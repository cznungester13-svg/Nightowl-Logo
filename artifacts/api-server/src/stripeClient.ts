import Stripe from "stripe";
import { classifyStripeSecretKey } from "./stripeSecret";

// Interface to bypass global Response collision with Express
interface FetchResponse {
  ok: boolean;
  status: number;
  statusText: string;
  json(): Promise<any>;
}

async function getStripeCredentials(): Promise<{
  secretKey: string;
  webhookSecret?: string;
}> {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secretKey) {
    throw new Error(
      "STRIPE_SECRET_KEY environment variable is missing. Add it in your Vercel project settings.",
    );
  }

  classifyStripeSecretKey(secretKey);

  return {
    secretKey,
    webhookSecret,
  };
}

export async function getUncachableStripeClient(): Promise<Stripe> {
  const { secretKey } = await getStripeCredentials();
  return new Stripe(secretKey);
}

// Stub or light wrapper replacement for getStripeSync to prevent build errors
export async function getStripeSync(): Promise<any> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  const { secretKey, webhookSecret } = await getStripeCredentials();
  
  // Return standard Stripe instance since stripe-replit-sync is no longer used on Vercel
  return new Stripe(secretKey, {
    apiVersion: "2025-02-28.acacia" as any,
  });
}