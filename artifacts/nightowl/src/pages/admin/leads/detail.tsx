import { useRoute, Link } from "wouter";
import { 
  useGetAdminLead, 
  useUpdateAdminLead, 
  LeadStatus,
  getGetAdminLeadQueryKey,
  getListAdminLeadsQueryKey,
  getGetAdminOverviewQueryKey
} from "@workspace/api-client-react";
import { format } from "date-fns";
import { ArrowLeft, User, Mail, Calendar, MessageSquare } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export function AdminLeadDetailPage() {
  const [, params] = useRoute("/admin/leads/:id");
  const id = Number(params?.id);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: lead, isLoading } = useGetAdminLead(id);
  const updateLead = useUpdateAdminLead();

  const handleStatusUpdate = (status: LeadStatus) => {
    updateLead.mutate(
      { id, data: { status } },
      {
        onSuccess: (updatedLead) => {
          queryClient.setQueryData(getGetAdminLeadQueryKey(id), updatedLead);
          queryClient.invalidateQueries({ queryKey: getListAdminLeadsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetAdminOverviewQueryKey() });
          toast({
            title: "Lead updated",
            description: `Status changed to ${status}`,
          });
        },
        onError: () => {
          toast({
            title: "Failed to update lead",
            description: "Please try again.",
            variant: "destructive"
          });
        }
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-6 w-24 bg-card rounded" />
        <div className="h-48 bg-card rounded-2xl" />
        <div className="h-64 bg-card rounded-2xl" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold mb-2">Lead not found</h2>
        <Link href="/admin/leads" className="text-primary hover:underline">Return to leads</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <Link href="/admin/leads" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6" data-testid="link-back-leads">
          <ArrowLeft size={16} /> Back to leads
        </Link>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight">{lead.name}</h1>
            <p className="mt-2 text-sm text-muted-foreground flex items-center gap-4">
              <span className="flex items-center gap-1.5"><Mail size={14} /> {lead.email}</span>
            </p>
          </div>
          
          <div className="flex items-center gap-3 bg-card p-2 rounded-xl border border-border">
            {(['new', 'contacted', 'qualified', 'closed'] as LeadStatus[]).map((status) => (
              <button
                key={status}
                onClick={() => handleStatusUpdate(status)}
                disabled={lead.status === status || updateLead.isPending}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  lead.status === status 
                    ? status === 'new' ? 'bg-accent text-accent-foreground' 
                      : status === 'contacted' ? 'bg-primary text-primary-foreground'
                      : status === 'qualified' ? 'bg-green-500 text-white'
                      : 'bg-muted-foreground text-white'
                    : 'bg-transparent text-muted-foreground hover:bg-secondary'
                }`}
                data-testid={`button-status-${status}`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_.4fr]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-border bg-card overflow-hidden">
            <div className="p-6 border-b border-border/50 flex items-center gap-3">
              <MessageSquare size={18} className="text-muted-foreground" />
              <h2 className="font-semibold">Message</h2>
            </div>
            <div className="p-6">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{lead.message}</p>
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="rounded-3xl border border-border bg-card p-6">
            <h3 className="font-semibold mb-5 text-sm uppercase tracking-wider text-muted-foreground">Details</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <User size={16} className="text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider mb-0.5">Name</p>
                  <p className="text-sm">{lead.name}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail size={16} className="text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider mb-0.5">Email</p>
                  <a href={`mailto:${lead.email}`} className="text-sm text-primary hover:underline">{lead.email}</a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar size={16} className="text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider mb-0.5">Submitted</p>
                  <p className="text-sm">{format(new Date(lead.createdAt), "MMM d, yyyy")}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(lead.createdAt), "h:mm a")}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
