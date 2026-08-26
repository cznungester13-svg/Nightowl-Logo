import type Stripe from "stripe";
import { getUncachableStripeClient } from "../stripeClient";

export const NIGHTOWL_PRICE_LOOKUP_KEY = "nightowl_launch_monthly";

function isUsableNightOwlPrice(
  price: Stripe.Price,
): price is Stripe.Price & {
  unit_amount: number;
  recurring: Stripe.Price.Recurring;
} {
  return (
    price.active &&
    price.type === "recurring" &&
    typeof price.unit_amount === "number" &&
    price.unit_amount > 0 &&
    price.recurring !== null &&
    price.recurring.interval === "month"
  );
}

export async function getNightOwlPrice(): Promise<
  Stripe.Price & {
    unit_amount: number;
    recurring: Stripe.Price.Recurring;
  }
> {
  const stripe = await getUncachableStripeClient();
  const configuredPriceId = process.env.NIGHTOWL_STRIPE_PRICE_ID?.trim();

  if (configuredPriceId) {
    const configuredPrice = await stripe.prices.retrieve(configuredPriceId);
    if (isUsableNightOwlPrice(configuredPrice)) {
      return configuredPrice;
    }

    throw new Error(
      "NIGHTOWL_STRIPE_PRICE_ID does not reference an active monthly recurring price.",
    );
  }

  const prices = await stripe.prices.list({
    active: true,
    lookup_keys: [NIGHTOWL_PRICE_LOOKUP_KEY],
    type: "recurring",
    limit: 1,
  });
  const price = prices.data[0];

  if (!price || !isUsableNightOwlPrice(price)) {
    throw new Error("The NightOwl monthly Stripe price has not been created.");
  }

  return price;
}

export function serializeNightOwlPrice(
  price: Stripe.Price & {
    unit_amount: number;
    recurring: Stripe.Price.Recurring;
  },
) {
  return {
    id: price.id,
    amount: price.unit_amount,
    currency: price.currency,
    interval: price.recurring.interval as "month" | "year",
  };
}