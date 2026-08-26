import {
  analyticsEventsTable,
  db,
  leadsTable,
  siteSettingsTable,
} from "@workspace/db";
import {
  GetAdminAnalyticsQueryParams,
  GetAdminAnalyticsResponse,
  GetAdminBillingStatusResponse,
  GetAdminLeadParams,
  GetAdminLeadResponse,
  GetAdminMeResponse,
  GetAdminOverviewResponse,
  GetAdminSiteSettingsResponse,
  ListAdminLeadsQueryParams,
  ListAdminLeadsResponse,
  UpdateAdminLeadBody,
  UpdateAdminLeadParams,
  UpdateAdminLeadResponse,
  UpdateAdminSiteSettingsBody,
  UpdateAdminSiteSettingsResponse,
} from "@workspace/api-zod";
import { and, desc, eq, gte, ilike, or, type SQL } from "drizzle-orm";
import { Router, type IRouter } from "express";
import { getAdminIdentity, requireAdmin } from "../middlewares/admin-auth";
import { getOrCreateSettings } from "./public";

const router: IRouter = Router();

router.get("/admin/me", async (req, res): Promise<void> => {
  const identity = await getAdminIdentity(req);
  if (!identity) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  res.json(GetAdminMeResponse.parse(identity));
});

router.use("/admin", requireAdmin);

router.get("/admin/overview", async (_req, res): Promise<void> => {
  const [allLeads, analytics] = await Promise.all([
    db.select().from(leadsTable).orderBy(desc(leadsTable.createdAt)),
    db
      .select()
      .from(analyticsEventsTable)
      .where(
        gte(
          analyticsEventsTable.createdAt,
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        ),
      ),
  ]);

  const pageViews = analytics.filter((event) => event.type === "page_view").length;
  const submissions = analytics.filter(
    (event) => event.type === "contact_submission",
  ).length;

  res.json(
    GetAdminOverviewResponse.parse({
      totalLeads: allLeads.length,
      newLeads: allLeads.filter((lead) => lead.status === "new").length,
      qualifiedLeads: allLeads.filter((lead) => lead.status === "qualified")
        .length,
      pageViews,
      conversionRate: pageViews ? (submissions / pageViews) * 100 : 0,
      recentLeads: allLeads.slice(0, 5),
    }),
  );
});

router.get("/admin/leads", async (req, res): Promise<void> => {
  const parsed = ListAdminLeadsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const filters: SQL[] = [];
  if (parsed.data.status) {
    filters.push(eq(leadsTable.status, parsed.data.status));
  }
  if (parsed.data.search?.trim()) {
    const search = `%${parsed.data.search.trim()}%`;
    const searchFilter = or(
      ilike(leadsTable.name, search),
      ilike(leadsTable.email, search),
      ilike(leadsTable.message, search),
    );
    if (searchFilter) filters.push(searchFilter);
  }

  const leads = await db
    .select()
    .from(leadsTable)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(leadsTable.createdAt));
  res.json(ListAdminLeadsResponse.parse(leads));
});

router.get("/admin/leads/:id", async (req, res): Promise<void> => {
  const params = GetAdminLeadParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [lead] = await db
    .select()
    .from(leadsTable)
    .where(eq(leadsTable.id, params.data.id));
  if (!lead) {
    res.status(404).json({ error: "Lead not found" });
    return;
  }
  res.json(GetAdminLeadResponse.parse(lead));
});

router.patch("/admin/leads/:id", async (req, res): Promise<void> => {
  const params = UpdateAdminLeadParams.safeParse(req.params);
  const body = UpdateAdminLeadBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [lead] = await db
    .update(leadsTable)
    .set({ status: body.data.status })
    .where(eq(leadsTable.id, params.data.id))
    .returning();
  if (!lead) {
    res.status(404).json({ error: "Lead not found" });
    return;
  }
  res.json(UpdateAdminLeadResponse.parse(lead));
});

router.get("/admin/site-settings", async (_req, res): Promise<void> => {
  res.json(GetAdminSiteSettingsResponse.parse(await getOrCreateSettings()));
});

router.put("/admin/site-settings", async (req, res): Promise<void> => {
  const parsed = UpdateAdminSiteSettingsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [settings] = await db
    .insert(siteSettingsTable)
    .values({ id: 1, ...parsed.data })
    .onConflictDoUpdate({
      target: siteSettingsTable.id,
      set: parsed.data,
    })
    .returning();
  res.json(UpdateAdminSiteSettingsResponse.parse(settings));
});

router.get("/admin/analytics", async (req, res): Promise<void> => {
  const parsed = GetAdminAnalyticsQueryParams.safeParse({
    ...req.query,
    days:
      typeof req.query.days === "string"
        ? Number(req.query.days)
        : req.query.days,
  });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const days = parsed.data.days;
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - (days - 1));
  const events = await db
    .select()
    .from(analyticsEventsTable)
    .where(gte(analyticsEventsTable.createdAt, start))
    .orderBy(analyticsEventsTable.createdAt);

  const buckets = new Map<
    string,
    { date: string; pageViews: number; ctaClicks: number; contactSubmissions: number }
  >();
  for (let index = 0; index < days; index += 1) {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + index);
    const key = date.toISOString().slice(0, 10);
    buckets.set(key, {
      date: key,
      pageViews: 0,
      ctaClicks: 0,
      contactSubmissions: 0,
    });
  }
  for (const event of events) {
    const bucket = buckets.get(event.createdAt.toISOString().slice(0, 10));
    if (!bucket) continue;
    if (event.type === "page_view") bucket.pageViews += 1;
    if (event.type === "cta_click") bucket.ctaClicks += 1;
    if (event.type === "contact_submission") bucket.contactSubmissions += 1;
  }

  const series = [...buckets.values()];
  const pageViews = series.reduce((sum, day) => sum + day.pageViews, 0);
  const ctaClicks = series.reduce((sum, day) => sum + day.ctaClicks, 0);
  const contactSubmissions = series.reduce(
    (sum, day) => sum + day.contactSubmissions,
    0,
  );
  res.json(
    GetAdminAnalyticsResponse.parse({
      days,
      pageViews,
      ctaClicks,
      contactSubmissions,
      conversionRate: pageViews ? (contactSubmissions / pageViews) * 100 : 0,
      series,
    }),
  );
});

router.get("/admin/billing-status", async (_req, res): Promise<void> => {
  const settings = await getOrCreateSettings();
  res.json(
    GetAdminBillingStatusResponse.parse({
      provider: "Stripe",
      connected: false,
      monthlyPrice: settings.monthlyPrice,
      planName: "Launch plan",
      message:
        "Billing is not connected. Pricing is display-only until Stripe checkout and webhooks are implemented.",
    }),
  );
});

export default router;