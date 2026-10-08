import assert from "node:assert/strict";
import test from "node:test";
import { classifyStripeSecretKey } from "../src/stripeSecret.ts";

test("accepts live secret keys without exposing their values", () => {
  assert.deepEqual(classifyStripeSecretKey("sk_live_example"), {
    kind: "live",
    prefix: "sk_live_",
  });
  assert.deepEqual(classifyStripeSecretKey("rk_live_example"), {
    kind: "live",
    prefix: "rk_live_",
  });
});

test("rejects test-mode secrets with a non-sensitive reason", () => {
  assert.throws(
    () => classifyStripeSecretKey("sk_test_example"),
    /test-mode Stripe secret key/i,
  );
});

test("rejects publishable keys and malformed values", () => {
  assert.throws(
    () => classifyStripeSecretKey("pk_live_example"),
    /publishable key/i,
  );
  assert.throws(
    () => classifyStripeSecretKey("not-a-stripe-key"),
    /invalid Stripe secret key format/i,
  );
});

test("rejects empty values without returning their contents", () => {
  assert.throws(
    () => classifyStripeSecretKey(""),
    /missing Stripe secret key/i,
  );
});
