import {
  date,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const abuseEndpointEnum = pgEnum("nightowl_abuse_endpoint", [
  "leads",
  "analytics_events",
]);

export const abuseReasonEnum = pgEnum("nightowl_abuse_reason", [
  "rate_limit",
  "honeypot",
  "timing",
  "challenge",
]);

/**
 * Stores aggregateable abuse signals separately from first-party analytics.
 * No IP address or other client identifier is persisted.
 */
export const abuseEventsTable = pgTable("nightowl_abuse_events", {
  id: serial("id").primaryKey(),
  endpoint: abuseEndpointEnum("endpoint").notNull(),
  reason: abuseReasonEnum("reason").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const abuseCountersTable = pgTable(
  "nightowl_abuse_counters",
  {
    endpoint: abuseEndpointEnum("endpoint").notNull(),
    reason: abuseReasonEnum("reason").notNull(),
    bucketDate: date("bucket_date", { mode: "string" }).notNull(),
    count: integer("count").notNull().default(1),
  },
  (table) => [
    uniqueIndex("nightowl_abuse_counter_bucket_idx").on(
      table.endpoint,
      table.reason,
      table.bucketDate,
    ),
  ],
);

export const publicRateLimitsTable = pgTable(
  "nightowl_public_rate_limits",
  {
    endpoint: abuseEndpointEnum("endpoint").notNull(),
    clientHash: text("client_hash").notNull(),
    windowStartedAt: timestamp("window_started_at", {
      withTimezone: true,
    }).notNull(),
    requestCount: integer("request_count").notNull().default(1),
  },
  (table) => [
    uniqueIndex("nightowl_rate_limit_window_idx").on(
      table.endpoint,
      table.clientHash,
      table.windowStartedAt,
    ),
  ],
);

export type AbuseEvent = typeof abuseEventsTable.$inferSelect;