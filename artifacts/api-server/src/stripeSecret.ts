export type StripeSecretKind = "live";

export interface ClassifiedStripeSecret {
  kind: StripeSecretKind;
  prefix: "sk_live_" | "rk_live_";
}

export function classifyStripeSecretKey(secretKey: string): ClassifiedStripeSecret {
  if (!secretKey.trim()) {
    throw new Error("Missing Stripe secret key in the integration configuration.");
  }

  if (/^sk_live_|^rk_live_/.test(secretKey)) {
    return {
      kind: "live",
      prefix: secretKey.startsWith("rk_live_") ? "rk_live_" : "sk_live_",
    };
  }

  if (/^sk_test_|^rk_test_/.test(secretKey)) {
    throw new Error(
      "The Stripe integration contains a test-mode secret key. Connect a live Stripe secret key before creating checkout sessions.",
    );
  }

  if (/^pk_(live|test)_/.test(secretKey)) {
    throw new Error(
      "The Stripe integration contains a publishable key, not a secret key.",
    );
  }

  throw new Error(
    "The Stripe integration contains an invalid secret key format.",
  );
}
