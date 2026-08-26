import { useState } from "react";
import { useListAdminLeads, LeadStatus } from "@workspace/api-client-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { Search, Filter, Mail, ArrowRight, Inbox } from "lucide-react";

export function AdminLeadsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<LeadStatus | "">("");
  
  const { data: leads, isLoading } = useListAdminLeads({ 
    search: search || undefined, 
    status: (status as LeadStatus) || undefined 
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Leads</h1>
        <p className="mt-2 text-sm text-muted-foreground">Manage and triage your inquiries.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <input
            type="text"
            placeholder="Search leads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-card border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            data-testid="input-search-leads"
          />
        </div>
        <div className="relative w-40">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="w-full bg-card border border-border rounded-xl pl-9 pr-8 py-2.5 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            data-testid="select-filter-status"
          >
            <option value="">All Statuses</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-16 bg-secondary/50 rounded-lg animate-pulse" />)}
          </div>
        ) : leads && leads.length > 0 ? (
          <div className="divide-y divide-border/50">
            {leads.map((lead) => (
              <Link 
                key={lead.id} 
                href={`/admin/leads/${lead.id}`}
                className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 hover:bg-secondary/30 transition-colors group block"
                data-testid={`link-lead-row-${lead.id}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-sm font-semibold truncate">{lead.name}</h3>
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm ${
                      lead.status === 'new' ? 'bg-accent/20 text-accent' :
                      lead.status === 'contacted' ? 'bg-primary/20 text-primary' :
                      lead.status === 'qualified' ? 'bg-green-400/20 text-green-400' :
                      'bg-secondary text-muted-foreground'
                    }`}>
                      {lead.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5 truncate"><Mail size={12} /> {lead.email}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-48 text-right">
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(lead.createdAt), "MMM d, yyyy")}
                  </div>
                  <div className="text-muted-foreground group-hover:text-primary transition-colors">
                    <ArrowRight size={18} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-16 text-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-secondary/50 text-muted-foreground mb-4">
              <Inbox size={24} />
            </div>
            <h3 className="text-lg font-semibold mb-1">No leads found</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              {search || status ? "Try adjusting your search or filters to find what you're looking for." : "You're all caught up! New leads will appear here."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
