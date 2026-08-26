import { createInsertSchema } from "drizzle-zod";
import { pgEnum, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const analyticsEventTypeEnum = pgEnum("analytics_event_type", [
  "page_view",
  "cta_click",
  "contact_submission",
]);

export const analyticsEventsTable = pgTable("nightowl_analytics_events", {
  id: serial("id").primaryKey(),
  type: analyticsEventTypeEnum("type").notNull(),
  label: text("label"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAnalyticsEventSchema = createInsertSchema(
  analyticsEventsTable,
).omit({
  id: true,
  createdAt: true,
});

export type InsertAnalyticsEvent = z.infer<typeof insertAnalyticsEventSchema>;
export type AnalyticsEvent = typeof analyticsEventsTable.$inferSelect;