import Stripe from "stripe";
import { StripeSync } from "stripe-replit-sync";
import { classifyStripeSecretKey } from "./stripeSecret";

const rawSecretKey = process.env.STRIPE_SECRET_KEY ?? "";

if (!rawSecretKey) {
  throw new Error("Missing Stripe secret key in the integration configuration.");
}

const secretKey: string = rawSecretKey;
classifyStripeSecretKey(secretKey);

// Main stripe client export
export const stripe = new Stripe(secretKey);

// Export getUncachableStripeClient as requested by src/routes/billing.ts
export function getUncachableStripeClient() {
  return new Stripe(secretKey);
}

// Export getStripeSync as requested by src/index.ts
let stripeSyncInstance: StripeSync | null = null;
export function getStripeSync() {
  if (!stripeSyncInstance) {
    stripeSyncInstance = new StripeSync({
      secretKey: secretKey,
    } as any);
  }
  return stripeSyncInstance;
}

export default stripe;