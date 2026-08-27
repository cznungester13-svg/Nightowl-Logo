import {
  useCreateAdminBillingPortal,
  useGetAdminBillingStatus,
} from "@workspace/api-client-react";
import { format } from "date-fns";
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Loader2,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { useState } from "react";

const statusStyles = {
  active: {
    label: "Active",
    className: "text-green-400 bg-green-400/10 border-green-400/20",
    icon: CheckCircle2,
  },
  trialing: {
    label: "Trialing",
    className: "text-primary bg-primary/10 border-primary/20",
    icon: CheckCircle2,
  },
  past_due: {
    label: "Past due",
    className: "text-accent bg-accent/10 border-accent/20",
    icon: AlertCircle,
  },
  canceled: {
    label: "Canceled",
    className: "text-destructive bg-destructive/10 border-destructive/20",
    icon: XCircle,
  },
  unpaid: {
    label: "Unpaid",
    className: "text-destructive bg-destructive/10 border-destructive/20",
    icon: AlertCircle,
  },
  incomplete: {
    label: "Incomplete",
    className: "text-accent bg-accent/10 border-accent/20",
    icon: AlertCircle,
  },
  incomplete_expired: {
    label: "Expired",
    className: "text-destructive bg-destructive/10 border-destructive/20",
    icon: XCircle,
  },
  paused: {
    label: "Paused",
    className: "text-muted-foreground bg-secondary border-border",
    icon: AlertCircle,
  },
  not_started: {
    label: "Not started",
    className: "text-muted-foreground bg-secondary border-border",
    icon: CreditCard,
  },
} as const;

export function AdminBillingPage() {
  const {
    data: billing,
    isLoading,
    refetch,
    isFetching,
  } = useGetAdminBillingStatus();
  const portal = useCreateAdminBillingPortal();
  const [portalError, setPortalError] = useState("");

  if (isLoading) {
    return (
      <div className="max-w-3xl animate-pulse space-y-8">
        <div className="h-8 w-48 rounded bg-card" />
        <div className="h-[320px] rounded-3xl bg-card" />
      </div>
    );
  }

  if (!billing) return null;

  const status = statusStyles[billing.status];
  const StatusIcon = status.icon;
  const needsAttention =
    billing.paymentStatus === "failed" ||
    billing.status === "past_due" ||
    billing.status === "unpaid";

  const openPortal = () => {
    setPortalError("");
    portal.mutate(undefined, {
      onSuccess: ({ url }) => window.location.assign(url),
      onError: () =>
        setPortalError(
          "The Stripe billing portal is unavailable right now. Please try again.",
        ),
    });
  };

  return (
    <div className="max-w-3xl">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Billing & Plans
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage your NightOwl subscription through Stripe.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground disabled:opacity-50"
        >
          <RefreshCw size={14} className={isFetching ? "animate-spin" : ""} />
          Refresh status
        </button>
      </div>

      <div className="overflow-hidden rounded-3xl border border-border bg-card">
        <div className="flex flex-col items-start justify-between gap-6 border-b border-border/50 bg-secondary/20 p-8 sm:flex-row">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-3">
              <h2 className="font-display text-2xl font-semibold">
                {billing.planName}
              </h2>
              <span
                className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${status.className}`}
              >
                <StatusIcon size={12} /> {status.label}
              </span>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              {billing.message}
            </p>
          </div>
          <div className="text-left sm:text-right">
            <p className="font-display text-3xl font-semibold">
              ${billing.monthlyPrice}
            </p>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              / month
            </p>
          </div>
        </div>

        <div className="p-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-4 rounded-2xl border border-border/60 bg-secondary/20 p-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
                <CreditCard size={21} />
              </div>
              <div>
                <p className="text-sm font-semibold">Payment status</p>
                <p className="text-xs capitalize text-muted-foreground">
                  {billing.paymentStatus} via {billing.provider}
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-border/60 bg-secondary/20 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Current period
              </p>
              <p className="mt-2 text-sm font-semibold">
                {billing.currentPeriodEnd
                  ? `${billing.cancelAtPeriodEnd ? "Ends" : "Renews"} ${format(
                      new Date(billing.currentPeriodEnd),
                      "MMM d, yyyy",
                    )}`
                  : "Starts after checkout"}
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <button
              type="button"
              onClick={openPortal}
              disabled={!billing.portalAvailable || portal.isPending}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
              data-testid="button-manage-billing"
            >
              {portal.isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <ExternalLink size={14} />
              )}
              Open Stripe portal
            </button>
          </div>

          {portalError && (
            <p className="mt-4 text-sm font-semibold text-destructive" role="alert">
              {portalError}
            </p>
          )}

          {needsAttention && (
            <div className="mt-8 flex items-start gap-3 rounded-xl border border-accent/20 bg-accent/10 p-4">
              <AlertCircle size={18} className="mt-0.5 text-accent" />
              <div>
                <p className="text-sm font-semibold">Payment needs attention</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Open the Stripe portal to update your payment method and review
                  any outstanding invoice.
                </p>
              </div>
            </div>
          )}

          {!billing.hasCustomer && (
            <div className="mt-8 flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/10 p-4">
              <CheckCircle2 size={18} className="mt-0.5 text-primary" />
              <p className="text-sm text-muted-foreground">
                Stripe is connected and checkout is ready. Use the public pricing
                page with this admin email to create your subscription and unlock
                portal access.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}