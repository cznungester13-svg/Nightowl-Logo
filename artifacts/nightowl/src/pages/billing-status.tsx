import { ArrowLeft, CheckCircle2, CreditCard, XCircle } from "lucide-react";
import { Link } from "wouter";

function BillingResultShell({
  icon,
  eyebrow,
  title,
  message,
  children,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  message: string;
  children: React.ReactNode;
}) {
  return (
    <main className="nightowl-page noise grid min-h-screen place-items-center bg-[#273149] px-5 py-16 text-[#F7F2E8]">
      <section className="w-full max-w-xl rounded-[2rem] border border-[#526168] bg-[#344157] p-8 text-center shadow-2xl md:p-12">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#273149]">
          {icon}
        </div>
        <p className="mt-7 text-[11px] font-bold uppercase tracking-[.18em] text-[#9ed3ca]">
          {eyebrow}
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-[-.055em]">
          {title}
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-[#c5d0ca]">
          {message}
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          {children}
        </div>
      </section>
    </main>
  );
}

export function BillingSuccessPage() {
  return (
    <BillingResultShell
      icon={<CheckCircle2 size={30} className="text-[#9ed3ca]" />}
      eyebrow="Checkout complete"
      title="NightOwl is on duty."
      message="Stripe is finalizing your subscription. Your billing status will update automatically, and you can manage payment details from the command center."
    >
      <Link
        href="/admin/billing"
        className="inline-flex items-center justify-center rounded-xl bg-[#ed805f] px-5 py-3 text-sm font-bold text-[#273149]"
      >
        View billing status <CreditCard className="ml-2" size={15} />
      </Link>
      <Link
        href="/"
        className="inline-flex items-center justify-center rounded-xl border border-[#71817e] px-5 py-3 text-sm font-semibold text-[#d8e2dd]"
      >
        <ArrowLeft className="mr-2" size={15} /> Return home
      </Link>
    </BillingResultShell>
  );
}

export function BillingCancelPage() {
  return (
    <BillingResultShell
      icon={<XCircle size={30} className="text-[#ed9b82]" />}
      eyebrow="Checkout canceled"
      title="No subscription started."
      message="You left Stripe Checkout before subscribing. You can return to the pricing section whenever you are ready."
    >
      <Link
        href="/#pricing"
        className="inline-flex items-center justify-center rounded-xl bg-[#F7F2E8] px-5 py-3 text-sm font-bold text-[#273149]"
      >
        <ArrowLeft className="mr-2" size={15} /> Return to pricing
      </Link>
    </BillingResultShell>
  );
}