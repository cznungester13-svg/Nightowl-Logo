import { getAuth } from "@clerk/express";
import {
  billingCustomersTable,
  db,
  type BillingCustomer,
} from "@workspace/db";
import {
  CreateAdminBillingPortalResponse,
  CreateCheckoutSessionBody,
  CreateCheckoutSessionResponse,
  GetAdminBillingStatusResponse,
} from "@workspace/api-zod";
import { eq, or } from "drizzle-orm";
import { Router, type IRouter, type Request } from "express";
import { getOrCreateSettings } from "./public";
import { getAdminIdentity, requireAdmin } from "../middlewares/admin-auth";
import { getUncachableStripeClient } from "../stripeClient";
import { getTrustedAppOrigin } from "../appOrigin";

const router: IRouter = Router();

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

async function getNightOwlPriceId(monthlyPrice: number): Promise<string> {
  const stripe = await getUncachableStripeClient();
  const configuredPriceId = process.env.NIGHTOWL_STRIPE_PRICE_ID?.trim();
  if (configuredPriceId) {
    const configuredPrice = await stripe.prices.retrieve(configuredPriceId);
    if (
      !configuredPrice.active ||
      configuredPrice.currency !== "usd" ||
      configuredPrice.recurring?.interval !== "month" ||
      configuredPrice.unit_amount !== monthlyPrice * 100
    ) {
      throw new Error(
        "NIGHTOWL_STRIPE_PRICE_ID does not match the active USD monthly price displayed by NightOwl.",
      );
    }
    return configuredPrice.id;
  }

  const products = await stripe.products.list({ active: true, limit: 100 });
  const product = products.data.find(
    (candidate) => candidate.metadata.nightowl_plan === "launch",
  );
  if (!product) {
    throw new Error(
      "NightOwl's Stripe product is not configured. Run the NightOwl Stripe seed script or set NIGHTOWL_STRIPE_PRICE_ID.",
    );
  }

  const prices = await stripe.prices.list({
    active: true,
    product: product.id,
    type: "recurring",
    limit: 100,
  });
  const monthly = prices.data.find(
    (price) =>
      price.currency === "usd" &&
      price.recurring?.interval === "month" &&
      price.unit_amount === monthlyPrice * 100,
  );
  if (!monthly) {
    throw new Error(
      "NightOwl's Stripe price does not exactly match the displayed monthly amount. Run the seed script after changing pricing.",
    );
  }
  return monthly.id;
}

async function getOrCreateBillingCustomer(
  email: string,
  clerkUserId: string,
): Promise<BillingCustomer> {
  const normalizedEmail = normalizeEmail(email);
  const [existing] = await db
    .select()
    .from(billingCustomersTable)
    .where(
      or(
        eq(billingCustomersTable.clerkUserId, clerkUserId),
        eq(billingCustomersTable.email, normalizedEmail),
      ),
    );
  if (existing) {
    if (
      existing.clerkUserId &&
      clerkUserId &&
      existing.clerkUserId !== clerkUserId
    ) {
      throw new Error("This billing customer belongs to another account.");
    }
    if (!existing.clerkUserId) {
      const [linked] = await db
        .update(billingCustomersTable)
        .set({ clerkUserId })
        .where(eq(billingCustomersTable.id, existing.id))
        .returning();
      return linked ?? existing;
    }
    return existing;
  }

  const stripe = await getUncachableStripeClient();
  const stripeCustomer = await stripe.customers.create(
    {
      email: normalizedEmail,
      metadata: {
        nightowl_email: normalizedEmail,
        clerk_user_id: clerkUserId,
      },
    },
    { idempotencyKey: `nightowl-customer:${clerkUserId}` },
  );
  const [created] = await db
    .insert(billingCustomersTable)
    .values({
      email: normalizedEmail,
      clerkUserId,
      stripeCustomerId: stripeCustomer.id,
    })
    .onConflictDoUpdate({
      target: billingCustomersTable.clerkUserId,
      set: {
        email: normalizedEmail,
        clerkUserId,
        stripeCustomerId: stripeCustomer.id,
      },
    })
    .returning();
  if (!created) throw new Error("Unable to record the Stripe customer");
  return created;
}

async function getAdminEmail(req: Request): Promise<string | null> {
  return (await getAdminIdentity(req))?.email ?? null;
}

export async function getBillingCustomerByEmail(
  email: string,
): Promise<BillingCustomer | null> {
  const [customer] = await db
    .select()
    .from(billingCustomersTable)
    .where(eq(billingCustomersTable.email, normalizeEmail(email)));
  return customer ?? null;
}

router.post("/checkout/session", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateCheckoutSessionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  try {
    const identity = await getAdminIdentity(req);
    if (!identity || normalizeEmail(parsed.data.email) !== identity.email) {
      res.status(400).json({
        error: "Use the verified email address on your NightOwl admin account.",
      });
      return;
    }

    const { userId } = getAuth(req);
    if (!userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const customer = await getOrCreateBillingCustomer(identity.email, userId);
    const settings = await getOrCreateSettings();
    const priceId = await getNightOwlPriceId(settings.monthlyPrice);
    const stripe = await getUncachableStripeClient();
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.stripeCustomerId,
      status: "all",
      limit: 100,
    });
    const blockingStatuses = new Set([
      "active",
      "trialing",
      "past_due",
      "unpaid",
      "incomplete",
      "paused",
    ]);
    if (
      subscriptions.data.some((subscription) =>
        blockingStatuses.has(subscription.status),
      )
    ) {
      res.status(409).json({
        error:
          "A NightOwl subscription already exists for this account. Manage it from the billing page.",
      });
      return;
    }

    const sessions = await stripe.checkout.sessions.list({
      customer: customer.stripeCustomerId,
      limit: 100,
    });
    const reusableSession = sessions.data.find(
      (session) =>
        session.mode === "subscription" &&
        session.status === "open" &&
        Boolean(session.url) &&
        session.expires_at > Math.floor(Date.now() / 1000),
    );

    const origin = getTrustedAppOrigin();
    const session =
      reusableSession ??
      (await stripe.checkout.sessions.create(
        {
          customer: customer.stripeCustomerId,
          client_reference_id: userId ?? undefined,
          mode: "subscription",
          line_items: [{ price: priceId, quantity: 1 }],
          success_url: `${origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${origin}/billing/cancel`,
          allow_promotion_codes: true,
          billing_address_collection: "auto",
          customer_update: { address: "auto", name: "auto" },
          metadata: {
            nightowl_email: customer.email,
            clerk_user_id: userId ?? "",
          },
          subscription_data: {
            metadata: {
              nightowl_email: customer.email,
              clerk_user_id: userId ?? "",
            },
          },
        },
        {
          idempotencyKey: `nightowl-checkout:${userId}:${Math.floor(Date.now() / 3_600_000)}`,
        },
      ));
    if (!session.url) {
      res.status(502).json({ error: "Stripe did not return a checkout URL." });
      return;
    }
    res.json(CreateCheckoutSessionResponse.parse({ url: session.url }));
  } catch (error) {
    req.log.error({ err: error }, "Unable to create Stripe checkout session");
    res.status(503).json({
      error:
        "Checkout is temporarily unavailable. Please try again in a moment.",
    });
  }
});

router.get("/admin/billing-status", requireAdmin, async (req, res): Promise<void> => {
  const settings = await getOrCreateSettings();
  const email = await getAdminEmail(req);
  const customer = email ? await getBillingCustomerByEmail(email) : null;
  const status = customer?.subscriptionStatus ?? "not_started";
  const message =
    status === "active" || status === "trialing"
      ? customer?.cancelAtPeriodEnd
        ? "Your subscription is active and will end at the close of the current billing period."
        : "Your NightOwl subscription is active."
      : status === "past_due" || customer?.paymentStatus === "failed"
        ? (customer?.lastPaymentError ??
          "Your latest payment needs attention. Update your payment method to keep NightOwl running.")
        : status === "canceled" || status === "unpaid"
          ? "Your subscription is no longer active. Start checkout again to resume NightOwl."
          : "Stripe checkout is ready. Start a subscription to activate your NightOwl plan.";

  res.json(
    GetAdminBillingStatusResponse.parse({
      provider: "Stripe",
      connected: true,
      monthlyPrice: settings.monthlyPrice,
      planName: "Launch plan",
      status,
      paymentStatus: customer?.paymentStatus ?? "unpaid",
      currentPeriodEnd: customer?.currentPeriodEnd?.toISOString() ?? null,
      cancelAtPeriodEnd: customer?.cancelAtPeriodEnd ?? false,
      hasCustomer: Boolean(customer),
      portalAvailable: Boolean(customer?.stripeCustomerId),
      message,
    }),
  );
});

router.post(
  "/admin/billing-portal",
  requireAdmin,
  async (req, res): Promise<void> => {
    const email = await getAdminEmail(req);
    const customer = email ? await getBillingCustomerByEmail(email) : null;
    if (!customer) {
      res.status(404).json({
        error: "No NightOwl billing customer exists for this admin account.",
      });
      return;
    }

    try {
      const stripe = await getUncachableStripeClient();
      const portal = await stripe.billingPortal.sessions.create({
        customer: customer.stripeCustomerId,
        return_url: `${getTrustedAppOrigin()}/admin/billing`,
      });
      res.json(CreateAdminBillingPortalResponse.parse({ url: portal.url }));
    } catch (error) {
      req.log.error({ err: error }, "Unable to create Stripe billing portal session");
      res.status(503).json({
        error:
          "The billing portal is temporarily unavailable. Please try again shortly.",
      });
    }
  },
);

export default router;