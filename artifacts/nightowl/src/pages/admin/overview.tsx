import { useGetAdminOverview } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Inbox, Activity, CheckCircle, TrendingUp, ArrowRight, Clock } from "lucide-react";
import { format } from "date-fns";

export function AdminOverviewPage() {
  const { data: overview, isLoading } = useGetAdminOverview();

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-8">
        <div className="h-10 w-48 bg-card rounded-lg" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-card rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (!overview) return null;

  const stats = [
    { label: "Total Leads", value: overview.totalLeads, icon: Inbox, color: "text-primary", bg: "bg-primary/20" },
    { label: "New Leads", value: overview.newLeads, icon: Activity, color: "text-accent", bg: "bg-accent/20" },
    { label: "Qualified", value: overview.qualifiedLeads, icon: CheckCircle, color: "text-green-400", bg: "bg-green-400/20" },
    { label: "Conversion", value: `${overview.conversionRate.toFixed(1)}%`, icon: TrendingUp, color: "text-[#d8ad70]", bg: "bg-[#d8ad70]/20" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Overview</h1>
        <p className="mt-2 text-sm text-muted-foreground">Your overnight operations at a glance.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <div key={i} className="rounded-3xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between" data-testid={`stat-${stat.label.toLowerCase().replace(" ", "-")}`}>
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                <stat.icon size={20} />
              </div>
            </div>
            <div>
              <p className="text-3xl font-display font-semibold">{stat.value}</p>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mt-1">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        <div className="rounded-3xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-border/50">
            <h2 className="font-display text-lg font-semibold">Recent Activity</h2>
            <Link href="/admin/leads" className="text-xs font-bold text-primary hover:text-primary/80 flex items-center gap-1" data-testid="link-view-all-leads">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="divide-y divide-border/50">
            {overview.recentLeads.length > 0 ? (
              overview.recentLeads.map((lead) => (
                <Link key={lead.id} href={`/admin/leads/${lead.id}`} className="flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors block" data-testid={`link-recent-lead-${lead.id}`}>
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-muted-foreground">
                      {lead.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{lead.name}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1 max-w-[250px]">{lead.message}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 text-right">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock size={10} /> {format(new Date(lead.createdAt), "MMM d, h:mm a")}
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      lead.status === 'new' ? 'bg-accent/20 text-accent' :
                      lead.status === 'contacted' ? 'bg-primary/20 text-primary' :
                      lead.status === 'qualified' ? 'bg-green-400/20 text-green-400' :
                      'bg-secondary text-muted-foreground'
                    }`}>
                      {lead.status}
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <div className="p-8 text-center text-muted-foreground text-sm">
                No recent leads to display.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 flex flex-col items-center justify-center text-center">
          <div className="mb-6 rounded-full bg-primary/10 p-5 text-primary">
            <Activity size={32} />
          </div>
          <h3 className="font-display text-xl font-semibold mb-2">Systems Nominal</h3>
          <p className="text-sm text-muted-foreground mb-6">
            NightOwl is actively monitoring your inbox and schedule. Page views over the last period total <strong>{overview.pageViews}</strong>.
          </p>
          <Link href="/admin/settings" className="rounded-xl bg-secondary px-5 py-2.5 text-sm font-semibold hover:bg-secondary/80 transition-colors" data-testid="link-adjust-settings">
            Adjust Settings
          </Link>
        </div>
      </div>
    </div>
  );
}
