import { Router, type IRouter, type Request } from "express";
import {
  CreateBillingPortalSessionBody,
  CreateBillingPortalSessionResponse,
  CreateCheckoutSessionBody,
  CreateCheckoutSessionResponse,
  GetPublicBillingPriceResponse,
} from "@workspace/api-zod";
import {
  getNightOwlPrice,
  serializeNightOwlPrice,
} from "../lib/stripeCatalog";
import { getUncachableStripeClient } from "../stripeClient";

const router: IRouter = Router();

function getRequestOrigin(req: Request): string {
  const forwardedHost = req.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || req.get("host");

  if (!host) {
    throw new Error("Unable to determine the public host for Stripe checkout.");
  }

  const forwardedProtocol = req
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim();
  const protocol = forwardedProtocol || req.protocol;
  return `${protocol}://${host}`;
}

router.get("/billing/price", async (_req, res): Promise<void> => {
  try {
    const price = await getNightOwlPrice();
    res.json(
      GetPublicBillingPriceResponse.parse(serializeNightOwlPrice(price)),
    );
  } catch (error) {
    res.status(503).json({
      message:
        error instanceof Error
          ? error.message
          : "NightOwl billing is temporarily unavailable.",
    });
  }
});

router.post("/billing/checkout", async (req, res): Promise<void> => {
  const input = CreateCheckoutSessionBody.parse(req.body);

  try {
    const price = await getNightOwlPrice();

    if (input.priceId !== price.id) {
      res.status(400).json({ message: "That NightOwl price is not available." });
      return;
    }

    const stripe = await getUncachableStripeClient();
    const origin = getRequestOrigin(req);
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: price.id, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/cancel`,
      subscription_data: {
        metadata: {
          nightowl_plan: "launch",
        },
      },
    });

    if (!session.url) {
      throw new Error("Stripe did not return a checkout URL.");
    }

    res.json(CreateCheckoutSessionResponse.parse({ url: session.url }));
  } catch (error) {
    res.status(503).json({
      message:
        error instanceof Error
          ? error.message
          : "Unable to start Stripe checkout.",
    });
  }
});

router.post("/billing/portal", async (req, res): Promise<void> => {
  const input = CreateBillingPortalSessionBody.parse(req.body);

  try {
    const stripe = await getUncachableStripeClient();
    const checkoutSession = await stripe.checkout.sessions.retrieve(
      input.sessionId,
    );
    const customerId =
      typeof checkoutSession.customer === "string"
        ? checkoutSession.customer
        : checkoutSession.customer?.id;

    if (!customerId || checkoutSession.mode !== "subscription") {
      res
        .status(400)
        .json({ message: "That checkout session has no subscription customer." });
      return;
    }

    const configurations = await stripe.billingPortal.configurations.list({
      active: true,
      limit: 1,
    });
    const configuration = configurations.data[0];

    if (!configuration) {
      throw new Error("The NightOwl billing portal is not configured.");
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      configuration: configuration.id,
      return_url: `${getRequestOrigin(req)}/checkout/success?session_id=${encodeURIComponent(input.sessionId)}`,
    });

    res.json(
      CreateBillingPortalSessionResponse.parse({ url: portalSession.url }),
    );
  } catch (error) {
    res.status(503).json({
      message:
        error instanceof Error
          ? error.message
          : "Unable to open the Stripe billing portal.",
    });
  }
});

export default router;