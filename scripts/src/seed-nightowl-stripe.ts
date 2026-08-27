import { getUncachableStripeClient } from "./stripeClient";

const monthlyPriceDollars = Number(process.env.NIGHTOWL_MONTHLY_PRICE ?? "20");
if (
  !Number.isInteger(monthlyPriceDollars) ||
  monthlyPriceDollars <= 0 ||
  monthlyPriceDollars > 10_000
) {
  throw new Error("NIGHTOWL_MONTHLY_PRICE must be a whole dollar amount.");
}

const stripe = await getUncachableStripeClient();
const products = await stripe.products.list({ active: true, limit: 100 });
let product = products.data.find(
  (candidate) => candidate.metadata.nightowl_plan === "launch",
);

if (!product) {
  product = await stripe.products.create({
    name: "NightOwl Launch plan",
    description: "A calm, capable second shift for your business.",
    metadata: { nightowl_plan: "launch" },
  });
}

const prices = await stripe.prices.list({
  active: true,
  product: product.id,
  type: "recurring",
  limit: 100,
});
let price = prices.data.find(
  (candidate) =>
    candidate.currency === "usd" &&
    candidate.recurring?.interval === "month" &&
    candidate.unit_amount === monthlyPriceDollars * 100,
);

if (!price) {
  price = await stripe.prices.create({
    product: product.id,
    currency: "usd",
    unit_amount: monthlyPriceDollars * 100,
    recurring: { interval: "month" },
    metadata: { nightowl_plan: "launch" },
  });
}

const portalConfigurations = await stripe.billingPortal.configurations.list({
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

console.info(
  `NightOwl Stripe catalog ready: ${product.id} / ${price.id} ($${monthlyPriceDollars}/month)`,
);