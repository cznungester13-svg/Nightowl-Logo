export function getTrustedAppOrigin(): string {
  const configured = process.env.NIGHTOWL_APP_URL?.trim();
  if (!configured) {
    throw new Error(
      "NIGHTOWL_APP_URL is required for Stripe checkout, portal, and webhook URLs.",
    );
  }

  const url = new URL(configured);
  if (url.protocol !== "https:") {
    throw new Error("NIGHTOWL_APP_URL must use HTTPS.");
  }
  return url.origin;
}