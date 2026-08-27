import Stripe from "stripe";
import { billingCustomersTable, db } from "@workspace/db";
import { and, eq, inArray, isNull, lte, or } from "drizzle-orm";
import { getStripeSync } from "./stripeClient";
import { logger } from "./lib/logger";

function subscriptionFields(subscription: Stripe.Subscription) {
  const periodEnd = subscription.items.data[0]?.current_period_end;
  return {
    stripeSubscriptionId: subscription.id,
    subscriptionStatus: subscription.status,
    currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  };
}

function getInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const legacy = (
    invoice as Stripe.Invoice & {
      subscription?: string | Stripe.Subscription | null;
    }
  ).subscription;
  if (typeof legacy === "string") return legacy;
  if (legacy?.id) return legacy.id;

  const parentSubscription = invoice.parent?.subscription_details?.subscription;
  return typeof parentSubscription === "string"
    ? parentSubscription
    : parentSubscription?.id ?? null;
}

function orderedCustomerMatch(
  customerId: string,
  eventCreated: number,
  subscriptionId?: string | null,
) {
  return and(
    eq(billingCustomersTable.stripeCustomerId, customerId),
    or(
      isNull(billingCustomersTable.lastStripeEventCreated),
      lte(billingCustomersTable.lastStripeEventCreated, eventCreated),
    ),
    subscriptionId
      ? or(
          isNull(billingCustomersTable.stripeSubscriptionId),
          eq(billingCustomersTable.stripeSubscriptionId, subscriptionId),
        )
      : undefined,
  );
}

function orderedSubscriptionMatch(
  customerId: string,
  subscriptionId: string,
  eventCreated: number,
  allowTerminalReplacement: boolean,
) {
  return and(
    eq(billingCustomersTable.stripeCustomerId, customerId),
    or(
      isNull(billingCustomersTable.lastStripeSubscriptionEventCreated),
      lte(
        billingCustomersTable.lastStripeSubscriptionEventCreated,
        eventCreated,
      ),
    ),
    or(
      isNull(billingCustomersTable.stripeSubscriptionId),
      eq(billingCustomersTable.stripeSubscriptionId, subscriptionId),
      allowTerminalReplacement
        ? inArray(billingCustomersTable.subscriptionStatus, [
            "canceled",
            "incomplete_expired",
          ])
        : undefined,
    ),
  );
}

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        "Stripe webhook payload must be a Buffer. Register the raw webhook route before express.json().",
      );
    }

    const sync = await getStripeSync();
    await sync.processWebhook(payload, signature);

    // StripeSync has verified the signature and synchronized the provider data.
    // The application-level record below links that data to NightOwl's customer.
    const event = JSON.parse(payload.toString("utf8")) as Stripe.Event;
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId =
          typeof session.customer === "string"
            ? session.customer
            : session.customer?.id;
        if (!customerId) break;

        await db
          .update(billingCustomersTable)
          .set({
            stripeSubscriptionId:
              typeof session.subscription === "string"
                ? session.subscription
                : session.subscription?.id ?? null,
            paymentStatus:
              session.payment_status === "paid" ||
              event.type.endsWith("succeeded")
                ? "paid"
                : "unpaid",
            lastPaymentError: null,
            lastStripeEventCreated: event.created,
          })
          .where(orderedCustomerMatch(customerId, event.created));
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;
        await db
          .update(billingCustomersTable)
          .set({
            ...subscriptionFields(subscription),
            lastStripeSubscriptionEventCreated: event.created,
          })
          .where(
            orderedSubscriptionMatch(
              customerId,
              subscription.id,
              event.created,
              event.type === "customer.subscription.created",
            ),
          );
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId =
          typeof invoice.customer === "string"
            ? invoice.customer
            : invoice.customer?.id;
        if (!customerId) break;
        const subscriptionId = getInvoiceSubscriptionId(invoice);
        await db
          .update(billingCustomersTable)
          .set({
            paymentStatus: "failed",
            lastPaymentError: "Your latest payment failed. Update your payment method.",
            lastStripeEventCreated: event.created,
          })
          .where(
            orderedCustomerMatch(customerId, event.created, subscriptionId),
          );
        break;
      }
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId =
          typeof invoice.customer === "string"
            ? invoice.customer
            : invoice.customer?.id;
        if (!customerId) break;
        const subscriptionId = getInvoiceSubscriptionId(invoice);
        await db
          .update(billingCustomersTable)
          .set({
            paymentStatus: "paid",
            lastPaymentError: null,
            lastStripeEventCreated: event.created,
          })
          .where(
            orderedCustomerMatch(customerId, event.created, subscriptionId),
          );
        break;
      }
      case "checkout.session.async_payment_failed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId =
          typeof session.customer === "string"
            ? session.customer
            : session.customer?.id;
        if (!customerId) break;
        await db
          .update(billingCustomersTable)
          .set({
            paymentStatus: "failed",
            lastPaymentError: "Your payment could not be completed. Please try again.",
            lastStripeEventCreated: event.created,
          })
          .where(orderedCustomerMatch(customerId, event.created));
        break;
      }
      default:
        break;
    }

    logger.info({ eventType: event.type }, "Stripe webhook synchronized");
  }
}