import { useState } from "react";
import { useGetAdminAnalytics, GetAdminAnalyticsDays } from "@workspace/api-client-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { MousePointerClick, Eye, UserPlus, TrendingUp } from "lucide-react";
import { format, parseISO } from "date-fns";

export function AdminAnalyticsPage() {
  const [days, setDays] = useState<GetAdminAnalyticsDays>(30);
  const { data: analytics, isLoading } = useGetAdminAnalytics({ days });

  if (isLoading || !analytics) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-8 w-48 bg-card rounded" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-card rounded-2xl" />)}
        </div>
        <div className="h-[400px] bg-card rounded-3xl" />
      </div>
    );
  }

  const stats = [
    { label: "Page Views", value: analytics.pageViews, icon: Eye, color: "text-primary", bg: "bg-primary/20" },
    { label: "CTA Clicks", value: analytics.ctaClicks, icon: MousePointerClick, color: "text-accent", bg: "bg-accent/20" },
    { label: "Submissions", value: analytics.contactSubmissions, icon: UserPlus, color: "text-green-400", bg: "bg-green-400/20" },
    { label: "Conversion", value: `${analytics.conversionRate.toFixed(1)}%`, icon: TrendingUp, color: "text-[#d8ad70]", bg: "bg-[#d8ad70]/20" },
  ];

  const chartData = analytics.series.map(day => ({
    ...day,
    formattedDate: format(parseISO(day.date), "MMM d"),
  }));

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Analytics</h1>
          <p className="mt-2 text-sm text-muted-foreground">Monitor traffic and conversion.</p>
        </div>
        
        <div className="flex bg-card border border-border rounded-xl overflow-hidden p-1">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d as GetAdminAnalyticsDays)}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                days === d ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
              data-testid={`button-days-${d}`}
            >
              {d} Days
            </button>
          ))}
        </div>
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

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-border bg-card p-6 lg:p-8">
          <div className="mb-8">
            <h2 className="font-display text-lg font-semibold">Traffic Overview</h2>
            <p className="text-xs text-muted-foreground">Page views over the last {days} days.</p>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="formattedDate" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip 
                  cursor={{ fill: 'hsl(var(--secondary))' }}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="pageViews" name="Page Views" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 lg:p-8">
          <div className="mb-8">
            <h2 className="font-display text-lg font-semibold">Conversion Funnel</h2>
            <p className="text-xs text-muted-foreground">Clicks and form submissions.</p>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="formattedDate" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '12px', fontSize: '12px' }}
                />
                <Line type="monotone" dataKey="ctaClicks" name="CTA Clicks" stroke="hsl(var(--accent))" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="contactSubmissions" name="Submissions" stroke="#4ade80" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
