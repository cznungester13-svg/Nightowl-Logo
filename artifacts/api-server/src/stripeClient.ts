import Stripe from "stripe";
import { StripeSync } from "stripe-replit-sync";
import { classifyStripeSecretKey } from "./stripeSecret";

const rawSecretKey = process.env.STRIPE_SECRET_KEY ?? "";

if (!rawSecretKey) {
  throw new Error("Missing Stripe secret key in the integration configuration.");
}

const secretKey: string = rawSecretKey;
classifyStripeSecretKey(secretKey);

const stripeInstance = new Stripe(secretKey);

export const stripe = stripeInstance;
export const StripeClient = stripeInstance;

export async function getUncachableStripeClient(): Promise<Stripe> {
  return stripeInstance;
}

export async function getStripeSync(): Promise<StripeSync> {
  const rawDatabaseUrl = process.env.DATABASE_URL ?? "";
  if (!rawDatabaseUrl) {
    throw new Error("DATABASE_URL is required for Stripe synchronization.");
  }

  const databaseUrl: string = rawDatabaseUrl;

  return new StripeSync({
    databaseUrl,
    poolConfig: { connectionString: databaseUrl },
    stripeSecretKey: secretKey,
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  });
}
