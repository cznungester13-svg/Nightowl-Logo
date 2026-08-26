import {
  analyticsEventsTable,
  db,
  leadsTable,
  siteSettingsTable,
} from "@workspace/db";
import {
  CreateAnalyticsEventBody,
  CreateLeadBody,
  CreateLeadResponse,
  GetPublicSiteSettingsResponse,
} from "@workspace/api-zod";
import { eq } from "drizzle-orm";
import { Router, type IRouter } from "express";

const router: IRouter = Router();

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

router.post("/leads", async (req, res): Promise<void> => {
  const parsed = CreateLeadBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
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