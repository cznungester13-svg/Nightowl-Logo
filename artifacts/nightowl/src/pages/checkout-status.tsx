import { useState } from 'react';
import { ArrowRight, Check, CreditCard, Loader2, X } from 'lucide-react';
import { Link } from 'wouter';
import { useCreateBillingPortalSession } from '@workspace/api-client-react';

export function CheckoutSuccessPage() {
  const [error, setError] = useState('');
  const createPortal = useCreateBillingPortalSession();
  const sessionId = new URLSearchParams(window.location.search).get('session_id');

  const openPortal = () => {
    if (!sessionId) {
      setError('Your checkout session could not be found.');
      return;
    }

    setError('');
    createPortal.mutate(
      { data: { sessionId } },
      {
        onSuccess: ({ url }) => window.location.assign(url),
        onError: () => setError('The billing portal could not be opened. Please try again.'),
      },
    );
  };

  return (
    <CheckoutStatus
      icon={<Check size={28} />}
      title="Welcome to NightOwl."
      description="Your subscription is active. Stripe will email your receipt and keep your billing details secure."
    >
      <button
        type="button"
        onClick={openPortal}
        disabled={createPortal.isPending || !sessionId}
        className="inline-flex items-center justify-center rounded-xl bg-[#ed805f] px-5 py-3 text-sm font-bold text-[#273149] disabled:opacity-60"
        data-testid="button-open-billing-portal"
      >
        {createPortal.isPending ? <Loader2 className="mr-2 animate-spin" size={15} /> : <CreditCard className="mr-2" size={15} />}
        Manage billing
      </button>
      {error && <p className="mt-4 text-xs font-semibold text-[#f7b09b]" role="alert">{error}</p>}
    </CheckoutStatus>
  );
}

export function CheckoutCancelPage() {
  return (
    <CheckoutStatus
      icon={<X size={28} />}
      title="Checkout paused."
      description="Nothing was charged. Your NightOwl plan will be waiting whenever you are ready."
    >
      <Link
        href="/#pricing"
        className="inline-flex items-center justify-center rounded-xl bg-[#F7F2E8] px-5 py-3 text-sm font-bold text-[#273149]"
      >
        Return to pricing <ArrowRight className="ml-2" size={15} />
      </Link>
    </CheckoutStatus>
  );
}

function CheckoutStatus({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <main className="noise grid min-h-screen place-items-center bg-[#273149] px-5 py-16 text-[#F7F2E8]">
      <section className="w-full max-w-xl rounded-3xl border border-[#526168] bg-[#344157] p-8 text-center shadow-2xl md:p-12">
        <img src="/logo.svg" alt="NightOwl" className="mx-auto mb-8 h-14 w-14" />
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#79b6ab]/20 text-[#9ed3ca]">
          {icon}
        </span>
        <h1 className="mt-7 font-display text-4xl font-semibold tracking-[-.05em]">{title}</h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-[#c5d0ca]">{description}</p>
        <div className="mt-8">{children}</div>
        <Link href="/" className="mt-7 inline-block text-xs font-semibold text-[#9ed3ca]">
          Back to NightOwl
        </Link>
      </section>
    </main>
  );
}