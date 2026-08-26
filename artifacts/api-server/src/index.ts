import app from "./app";
import { logger } from "./lib/logger";
import { runMigrations } from "stripe-replit-sync";
import { getStripeSync } from "./stripeClient";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function initializeStripe(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for Stripe synchronization.");
  }

  logger.info("Initializing Stripe synchronization");
  await runMigrations({ databaseUrl });

  const stripeSync = await getStripeSync();
  const publicDomain =
    process.env.REPLIT_DOMAINS?.split(",")[0]?.trim() ||
    process.env.REPLIT_DEV_DOMAIN?.trim();

  if (!publicDomain) {
    throw new Error("A Replit domain is required to configure Stripe webhooks.");
  }

  const webhook = await stripeSync.findOrCreateManagedWebhook(
    `https://${publicDomain}/api/stripe/webhook`,
  );
  logger.info({ webhookUrl: webhook.url }, "Stripe webhook configured");

  await stripeSync.syncBackfill();
  logger.info("Stripe data synchronized");
}

await initializeStripe();

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
