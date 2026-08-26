import { useGetAdminBillingStatus } from "@workspace/api-client-react";
import { CreditCard, AlertCircle, CheckCircle2, FileText, ExternalLink } from "lucide-react";

export function AdminBillingPage() {
  const { data: billing, isLoading } = useGetAdminBillingStatus();

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse max-w-3xl">
        <div className="h-8 w-48 bg-card rounded" />
        <div className="h-[250px] bg-card rounded-3xl" />
      </div>
    );
  }

  if (!billing) return null;

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold tracking-tight">Billing & Plans</h1>
        <p className="mt-2 text-sm text-muted-foreground">Manage your NightOwl subscription.</p>
      </div>

      <div className="rounded-3xl border border-border bg-card overflow-hidden">
        <div className="p-8 border-b border-border/50 bg-secondary/20 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="font-display text-2xl font-semibold">{billing.planName}</h2>
              {billing.connected ? (
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-green-400 bg-green-400/10 px-2.5 py-1 rounded-full border border-green-400/20">
                  <CheckCircle2 size={12} /> Active
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-secondary px-2.5 py-1 rounded-full border border-border">
                  <AlertCircle size={12} /> Not Connected
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground max-w-md leading-relaxed">{billing.message}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-display font-semibold">${billing.monthlyPrice}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">/ month</p>
          </div>
        </div>
        
        <div className="p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-12 w-12 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground">
              <CreditCard size={24} />
            </div>
            <div>
              <p className="text-sm font-semibold">Payment Method</p>
              <p className="text-xs text-muted-foreground">
                {billing.connected ? `Managed via ${billing.provider}` : "No payment method on file."}
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <button
              disabled={!billing.connected}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none"
              data-testid="button-manage-billing"
            >
              Manage Subscription <ExternalLink size={14} />
            </button>
            <button
              disabled={!billing.connected}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-6 py-3 text-sm font-bold text-foreground transition-all hover:bg-secondary disabled:opacity-50 disabled:pointer-events-none"
              data-testid="button-view-invoices"
            >
              <FileText size={14} /> View Invoices
            </button>
          </div>
          
          {!billing.connected && (
            <div className="mt-8 p-4 rounded-xl bg-accent/10 border border-accent/20 flex items-start gap-3">
              <AlertCircle size={18} className="text-accent mt-0.5" />
              <p className="text-sm text-accent-foreground/90">
                Billing is currently in development. You are on a complimentary early access plan. We will notify you when payment processing is available.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
