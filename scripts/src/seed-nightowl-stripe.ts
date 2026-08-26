import { getUncachableStripeClient } from "./stripeClient";

const PRODUCT_NAME = "NightOwl Launch Plan";
const PRICE_LOOKUP_KEY = "nightowl_launch_monthly";
const MONTHLY_PRICE_CENTS = 2_000;

async function seedNightOwlStripe(): Promise<void> {
  const stripe = await getUncachableStripeClient();
  const existingProducts = await stripe.products.search({
    query: "metadata['nightowl_plan']:'launch' AND active:'true'",
    limit: 1,
  });

  const product =
    existingProducts.data[0] ??
    (await stripe.products.create({
      name: PRODUCT_NAME,
      description:
        "A calm, capable second shift for small-business operations.",
      metadata: {
        nightowl_plan: "launch",
      },
    }));

  const prices = await stripe.prices.list({
    product: product.id,
    active: true,
    type: "recurring",
    limit: 100,
  });
  const existingPrice = prices.data.find(
    (price) => price.lookup_key === PRICE_LOOKUP_KEY,
  );
  const price =
    existingPrice ??
    (await stripe.prices.create({
      product: product.id,
      unit_amount: MONTHLY_PRICE_CENTS,
      currency: "usd",
      recurring: { interval: "month" },
      lookup_key: PRICE_LOOKUP_KEY,
      metadata: {
        nightowl_plan: "launch",
      },
    }));

  const portalConfigurations =
    await stripe.billingPortal.configurations.list({
      active: true,
      limit: 1,
    });

  if (!portalConfigurations.data[0]) {
    await stripe.billingPortal.configurations.create({
      business_profile: {
        headline: "Manage your NightOwl subscription",
      },
      features: {
        customer_update: {
          enabled: true,
          allowed_updates: ["email"],
        },
        invoice_history: { enabled: true },
        payment_method_update: { enabled: true },
        subscription_cancel: {
          enabled: true,
          mode: "at_period_end",
        },
        subscription_update: { enabled: false },
      },
    });
  }

  console.log(`NightOwl Stripe product ready: ${product.id}`);
  console.log(`NightOwl Stripe price ready: ${price.id}`);
}

seedNightOwlStripe().catch((error) => {
  console.error(
    "Unable to seed NightOwl Stripe catalog:",
    error instanceof Error ? error.message : error,
  );
  process.exit(1);
});