import { createInsertSchema } from "drizzle-zod";
import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const billingCustomersTable = pgTable(
  "nightowl_billing_customers",
  {
    id: serial("id").primaryKey(),
    email: text("email").notNull(),
    clerkUserId: text("clerk_user_id"),
    stripeCustomerId: text("stripe_customer_id").notNull(),
    stripeSubscriptionId: text("stripe_subscription_id"),
    subscriptionStatus: text("subscription_status").notNull().default("not_started"),
    paymentStatus: text("payment_status").notNull().default("unpaid"),
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
    lastPaymentError: text("last_payment_error"),
    lastStripeEventCreated: integer("last_stripe_event_created"),
    lastStripeSubscriptionEventCreated: integer(
      "last_stripe_subscription_event_created",
    ),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    emailUnique: unique("nightowl_billing_customers_email_unique").on(table.email),
    stripeCustomerUnique: unique(
      "nightowl_billing_customers_stripe_customer_unique",
    ).on(table.stripeCustomerId),
    clerkUserUnique: unique(
      "nightowl_billing_customers_clerk_user_unique",
    ).on(table.clerkUserId),
  }),
);

export const insertBillingCustomerSchema = createInsertSchema(
  billingCustomersTable,
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertBillingCustomer = z.infer<typeof insertBillingCustomerSchema>;
export type BillingCustomer = typeof billingCustomersTable.$inferSelect;