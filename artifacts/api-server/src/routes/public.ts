import {
  abuseCountersTable,
  analyticsEventsTable,
  db,
  leadsTable,
  publicRateLimitsTable,
  siteSettingsTable,
} from "@workspace/db";
import {
  CreateAnalyticsEventBody,
  CreateLeadBody,
  CreateLeadResponse,
  GetContactChallengeResponse,
  GetPublicSiteSettingsResponse,
} from "@workspace/api-zod";
import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { eq, lt, sql } from "drizzle-orm";
import {
  Router,
  type IRouter,
  type Request,
  type Response,
} from "express";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const RATE_LIMITS = {
  leads: { maxRequests: 5, windowMs: 15 * 60 * 1000 },
  analytics_events: { maxRequests: 120, windowMs: 60 * 1000 },
} as const;

type PublicEndpoint = keyof typeof RATE_LIMITS;
type AbuseReason = "rate_limit" | "honeypot" | "timing" | "challenge";

let nextRateLimitCleanupAt = 0;

function getClientKey(req: Request) {
  return req.ip || req.socket.remoteAddress || "unknown";
}

function getClientHash(req: Request) {
  return createHash("sha256").update(getClientKey(req)).digest("hex");
}

function getChallengeSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is required for contact bot protection");
  }
  return secret;
}

function signContactChallenge(req: Request) {
  const issuedAt = Date.now();
  const nonce = randomBytes(16).toString("base64url");
  const payload = `${issuedAt}.${nonce}.${getClientHash(req)}`;
  const signature = createHmac("sha256", getChallengeSecret())
    .update(payload)
    .digest("base64url");
  return `${issuedAt}.${nonce}.${signature}`;
}

function verifyContactChallenge(req: Request, token: string) {
  const [issuedAtValue, nonce, signature] = token.split(".");
  const issuedAt = Number(issuedAtValue);
  if (!issuedAtValue || !nonce || !signature || !Number.isFinite(issuedAt)) {
    return false;
  }

  const ageMs = Date.now() - issuedAt;
  if (ageMs < 1000 || ageMs > 2 * 60 * 60 * 1000) return false;

  const payload = `${issuedAtValue}.${nonce}.${getClientHash(req)}`;
  const expected = createHmac("sha256", getChallengeSecret())
    .update(payload)
    .digest();
  const actual = Buffer.from(signature, "base64url");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

async function consumeRateLimit(
  clientKey: string,
  endpoint: PublicEndpoint,
): Promise<{
  allowed: boolean;
  retryAfterSeconds: number;
}> {
  const now = Date.now();
  if (now >= nextRateLimitCleanupAt) {
    nextRateLimitCleanupAt = now + 60 * 60 * 1000;
    void db
      .delete(publicRateLimitsTable)
      .where(
        lt(
          publicRateLimitsTable.windowStartedAt,
          new Date(now - 24 * 60 * 60 * 1000),
        ),
      )
      .catch((error) => {
        logger.error({ err: error }, "Unable to prune rate-limit buckets");
      });
  }

  const limit = RATE_LIMITS[endpoint];
  const windowStartedAtMs = Math.floor(now / limit.windowMs) * limit.windowMs;
  const windowStartedAt = new Date(windowStartedAtMs);
  const clientHash = createHash("sha256").update(clientKey).digest("hex");
  const [bucket] = await db
    .insert(publicRateLimitsTable)
    .values({
      endpoint,
      clientHash,
      windowStartedAt,
      requestCount: 1,
    })
    .onConflictDoUpdate({
      target: [
        publicRateLimitsTable.endpoint,
        publicRateLimitsTable.clientHash,
        publicRateLimitsTable.windowStartedAt,
      ],
      set: {
        requestCount: sql`${publicRateLimitsTable.requestCount} + 1`,
      },
    })
    .returning({ requestCount: publicRateLimitsTable.requestCount });

  return {
    allowed: bucket.requestCount <= limit.maxRequests,
    retryAfterSeconds: Math.max(
      1,
      Math.ceil((windowStartedAtMs + limit.windowMs - now) / 1000),
    ),
  };
}

async function recordBlockedRequest(
  endpoint: "leads" | "analytics_events",
  reason: AbuseReason,
) {
  try {
    const bucketDate = new Date().toISOString().slice(0, 10);
    await db
      .insert(abuseCountersTable)
      .values({ endpoint, reason, bucketDate, count: 1 })
      .onConflictDoUpdate({
        target: [
          abuseCountersTable.endpoint,
          abuseCountersTable.reason,
          abuseCountersTable.bucketDate,
        ],
        set: {
          count: sql`${abuseCountersTable.count} + 1`,
        },
      });
  } catch (error) {
    // Blocking the request remains the priority if the audit trail is
    // temporarily unavailable; log the failure for operators to investigate.
    logger.error({ err: error, endpoint, reason }, "Unable to record blocked request");
  }
}

async function rejectForRateLimit(
  req: Request,
  res: Response,
  endpoint: PublicEndpoint,
): Promise<boolean> {
  const result = await consumeRateLimit(getClientKey(req), endpoint);
  if (result.allowed) return false;

  await recordBlockedRequest(endpoint, "rate_limit");
  res.set("Retry-After", String(result.retryAfterSeconds));
  res.status(429).json({
    error: "Too many requests. Please wait and try again.",
  });
  return true;
}

const defaultSettings = {
  heroTitle: "Your business",
  heroAccent: "never sleeps.",
  heroDescription:
    "NightOwl handles the work that keeps you up — so you can finally switch off without your business going quiet.",
  monthlyPrice: 20,
  pricingBadge: "First six months",
  contactEmail: "hello@nightowl.work",
};

async function getOrCreateSettings() {
  const [existing] = await db
    .select()
    .from(siteSettingsTable)
    .where(eq(siteSettingsTable.id, 1));
  if (existing) return existing;

  const [created] = await db
    .insert(siteSettingsTable)
    .values({ id: 1, ...defaultSettings })
    .onConflictDoNothing()
    .returning();
  if (created) return created;

  const [concurrent] = await db
    .select()
    .from(siteSettingsTable)
    .where(eq(siteSettingsTable.id, 1));
  if (!concurrent) throw new Error("Unable to initialize site settings");
  return concurrent;
}

router.get("/site-settings", async (_req, res): Promise<void> => {
  const settings = await getOrCreateSettings();
  res.json(GetPublicSiteSettingsResponse.parse(settings));
});

router.get("/contact-challenge", (req, res): void => {
  res.set("Cache-Control", "no-store");
  res.json(
    GetContactChallengeResponse.parse({
      token: signContactChallenge(req),
    }),
  );
});

router.post("/leads", async (req, res): Promise<void> => {
  if (await rejectForRateLimit(req, res, "leads")) return;

  const parsed = CreateLeadBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  if (parsed.data.website?.trim()) {
    await recordBlockedRequest("leads", "honeypot");
    res.status(400).json({ error: "Unable to process this submission." });
    return;
  }

  if (!verifyContactChallenge(req, parsed.data.botToken)) {
    await recordBlockedRequest("leads", "challenge");
    res.status(400).json({ error: "Unable to process this submission." });
    return;
  }

  const lead = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(leadsTable)
      .values(parsed.data)
      .returning();
    await tx.insert(analyticsEventsTable).values({
      type: "contact_submission",
      label: "landing_contact",
    });
    return created;
  });

  res.status(201).json(CreateLeadResponse.parse(lead));
});

router.post("/analytics/events", async (req, res): Promise<void> => {
  if (await rejectForRateLimit(req, res, "analytics_events")) return;

  const parsed = CreateAnalyticsEventBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  await db.insert(analyticsEventsTable).values(parsed.data);
  res.sendStatus(204);
});

export { getOrCreateSettings };
export default router;