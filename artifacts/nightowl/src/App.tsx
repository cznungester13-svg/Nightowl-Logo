import { type FormEvent, type ReactNode, useEffect, useState } from 'react';
import {
  ArrowRight,
  Check,
  ChevronRight,
  Clock3,
  FileText,
  Inbox,
  Linkedin,
  Mail,
  Menu,
  Moon,
  Play,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  X,
} from 'lucide-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';

const queryClient = new QueryClient();

function OwlMark({ size = 38, dark = false }: { size?: number; dark?: boolean }) {
  const ink = dark ? '#F7F2E8' : '#273149';
  return (
    <svg width={size} height={size * 0.82} viewBox="0 0 52 43" role="img" aria-label="NightOwl mark">
      <path d="M7 5 2.5 1.5 4 12.3a20 20 0 0 0-1.8 8.4C2.2 33 12.7 41 26 41s23.8-8 23.8-20.3c0-3.1-.6-5.9-1.8-8.4l1.5-10.8L45 5l-5.3 3.7A25 25 0 0 0 26 4.3 25 25 0 0 0 12.3 8.7L7 5Z" fill={ink} />
      <path d="M5.8 18.8C9 13.6 15.2 11 21 12.5c2.1.5 3.8 1.6 5 3.2 1.2-1.6 2.9-2.7 5-3.2 5.8-1.5 12 1.1 15.2 6.3C45.5 29.2 37.4 36 26 36S6.5 29.2 5.8 18.8Z" fill="#79B6AB" />
      <circle cx="18.5" cy="21" r="6.6" fill={ink} />
      <circle cx="33.5" cy="21" r="6.6" fill={ink} />
      <circle cx="18.5" cy="21" r="2.1" fill="#F7F2E8" />
      <circle cx="33.5" cy="21" r="2.1" fill="#F7F2E8" />
      <path d="m22 28 4-3.2 4 3.2-4 3.5L22 28Z" fill="#ED805F" />
    </svg>
  );
}

function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <a href="#top" className="flex items-center gap-2.5" data-testid="link-logo">
      <OwlMark dark={dark} />
      <span className="font-display text-[1.15rem] font-semibold tracking-[-.04em]">NightOwl</span>
    </a>
  );
}

function SectionEyebrow({ children, light = false }: { children: ReactNode; light?: boolean }) {
  return (
    <div className={`mb-5 flex items-center gap-3 text-[11px] font-bold uppercase tracking-[.2em] ${light ? 'text-[#9ed3ca]' : 'text-[#23776d]'}`}>
      <span className="h-px w-7 bg-current" />
      {children}
    </div>
  );
}

function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    document.title = 'NightOwl — Your business never sleeps';
    const description = 'NightOwl is a calm, capable AI operations agent for small businesses.';
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) { meta = document.createElement('meta'); meta.setAttribute('name', 'description'); document.head.appendChild(meta); }
    meta.setAttribute('content', description);
    const ogTitle = document.querySelector('meta[property="og:title"]') ?? document.createElement('meta');
    ogTitle.setAttribute('property', 'og:title'); ogTitle.setAttribute('content', 'NightOwl — Your business never sleeps'); document.head.appendChild(ogTitle);
    const ogDescription = document.querySelector('meta[property="og:description"]') ?? document.createElement('meta');
    ogDescription.setAttribute('property', 'og:description'); ogDescription.setAttribute('content', description); document.head.appendChild(ogDescription);
  }, []);

  const goToContact = () => document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' });
  const submitContact = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const email = String(data.get('email') || '').trim();
    if (!email || !email.includes('@')) {
      setFormError('Please add a valid email so we know where to reply.');
      return;
    }
    setFormError('');
    setSubmitted(true);
    form.reset();
  };

  return (
    <div className="nightowl-page noise" id="top">
      <header className="absolute left-0 right-0 top-0 z-40 text-[#F7F2E8]">
        <div className="nightowl-shell flex h-[78px] items-center justify-between">
          <Logo dark />
          <nav className="hidden items-center gap-8 text-[13px] font-medium text-[#d8e2dd] md:flex" aria-label="Primary navigation">
            <a href="#capabilities" data-testid="link-capabilities">What NightOwl does</a>
            <a href="#process" data-testid="link-process">How it works</a>
            <a href="#mission" data-testid="link-mission">Our mission</a>
            <a href="#pricing" data-testid="link-pricing">Pricing</a>
          </nav>
          <button type="button" onClick={goToContact} className="hidden rounded-full bg-[#F7F2E8] px-5 py-2.5 text-[13px] font-bold text-[#273149] transition-transform hover:-translate-y-0.5 md:block" data-testid="button-header-contact">
            Talk to NightOwl <ArrowRight className="ml-1 inline-block" size={14} />
          </button>
          <button type="button" className="rounded-lg p-2 md:hidden" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} onClick={() => setMenuOpen(!menuOpen)} data-testid="button-mobile-menu">
            {menuOpen ? <X size={23} /> : <Menu size={23} />}
          </button>
        </div>
        {menuOpen && (
          <nav className="mx-3 rounded-2xl border border-[#526168] bg-[#273149] p-4 shadow-xl md:hidden" aria-label="Mobile navigation">
            {['capabilities', 'process', 'mission', 'pricing'].map((item) => (
              <a key={item} href={`#${item}`} onClick={() => setMenuOpen(false)} className="block border-b border-[#526168] px-3 py-3 text-sm capitalize text-[#e7eee9]" data-testid={`mobile-link-${item}`}>{item === 'capabilities' ? 'What NightOwl does' : item === 'process' ? 'How it works' : item === 'mission' ? 'Our mission' : 'Pricing'}</a>
            ))}
            <button type="button" onClick={() => { setMenuOpen(false); goToContact(); }} className="mt-3 w-full rounded-xl bg-[#F7F2E8] px-4 py-3 text-sm font-bold text-[#273149]" data-testid="button-mobile-contact">Talk to NightOwl</button>
          </nav>
        )}
      </header>

      <main>
        <section className="relative min-h-[720px] overflow-hidden bg-[#273149] text-[#F7F2E8]">
          <div className="absolute inset-0 aurora night-grid opacity-80" />
          <div className="absolute -left-32 top-[30%] h-72 w-72 rounded-full bg-[#ed805f]/10 blur-3xl" />
          <div className="nightowl-shell relative grid min-h-[720px] items-center gap-12 pb-16 pt-32 md:grid-cols-[1.05fr_.95fr] md:pb-20 md:pt-24">
            <div className="max-w-[610px]">
              <div className="reveal mb-7 inline-flex items-center gap-2 rounded-full border border-[#526168] bg-[#344157]/80 px-3.5 py-2 text-[11px] font-semibold tracking-[.13em] text-[#b9dcd5]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#ed805f] shadow-[0_0_0_4px_rgba(237,128,95,.14)]" /> THE AI OPERATIONS AGENT FOR SMALL BUSINESS
              </div>
              <h1 className="reveal reveal-delay-1 font-display text-[clamp(3.5rem,8vw,7.4rem)] font-semibold leading-[.91] tracking-[-.075em] text-[#F7F2E8]">
                Your business<br /><span className="text-[#9ed3ca]">never sleeps.</span>
              </h1>
              <p className="reveal reveal-delay-2 mt-7 max-w-[480px] text-[17px] leading-7 text-[#c5d0ca]">
                NightOwl handles the work that keeps you up — so you can finally switch off without your business going quiet.
              </p>
              <div className="reveal reveal-delay-3 mt-9 flex flex-wrap items-center gap-4">
                <button type="button" onClick={goToContact} className="rounded-full bg-[#ed805f] px-6 py-3.5 text-sm font-bold text-[#273149] transition-transform hover:-translate-y-1" data-testid="button-hero-contact">Get early access <ArrowRight className="ml-1 inline-block" size={16} /></button>
                <a href="#capabilities" className="group flex items-center gap-2 px-2 py-3 text-sm font-semibold text-[#e4ece6]" data-testid="link-hero-capabilities"><span className="grid h-8 w-8 place-items-center rounded-full border border-[#71817e] transition-colors group-hover:bg-[#71817e]"><Play size={12} fill="currentColor" /></span> See what it handles</a>
              </div>
              <div className="reveal reveal-delay-3 mt-11 flex items-center gap-5 text-xs text-[#aebdb7]">
                <div className="flex -space-x-2">
                  {['AM', 'JS', 'RK'].map((initials, i) => <span key={initials} className={`grid h-8 w-8 place-items-center rounded-full border-2 border-[#273149] text-[9px] font-bold ${i === 0 ? 'bg-[#d8ad70] text-[#273149]' : i === 1 ? 'bg-[#9ed3ca] text-[#273149]' : 'bg-[#ed805f] text-[#273149]'}`}>{initials}</span>)}
                </div>
                <span>Built for the people behind the business.</span>
              </div>
            </div>
            <div className="relative mx-auto w-full max-w-[490px]">
              <div className="owl-float relative z-10">
                <div className="absolute -inset-7 rounded-[42%] bg-[#79b6ab]/10 blur-2xl" />
                <div className="relative rounded-[2rem] border border-[#62736f] bg-[#344157] p-3 shadow-2xl">
                  <div className="rounded-[1.5rem] border border-[#526168] bg-[#273149] p-5">
                    <div className="mb-7 flex items-center justify-between border-b border-[#526168] pb-4">
                      <div className="flex items-center gap-2 text-sm font-semibold"><OwlMark size={27} dark /> NightOwl <span className="ml-1 rounded bg-[#79b6ab]/15 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-[#9ed3ca]">On duty</span></div>
                      <span className="font-mono text-[10px] text-[#98aaa4]">06:42 AM</span>
                    </div>
                    <div className="mb-5">
                      <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-[#98aaa4]">Good morning, Maya</p>
                      <p className="mt-2 font-display text-2xl font-medium tracking-[-.04em] text-[#F7F2E8]">Here’s what happened<br />while you were away.</p>
                    </div>
                    <div className="space-y-2.5">
                      {[
                        { icon: Inbox, label: 'Inbox cleared', detail: '12 conversations triaged', tone: 'teal' },
                        { icon: FileText, label: 'Invoice followed up', detail: '$2,840 now in motion', tone: 'coral' },
                        { icon: Clock3, label: 'Schedule untangled', detail: '2 conflicts resolved', tone: 'gold' },
                      ].map(({ icon: Icon, label, detail, tone }) => <div key={label} className="flex items-center gap-3 rounded-xl border border-[#526168] bg-[#344157]/60 px-3 py-3"><span className={`grid h-8 w-8 place-items-center rounded-lg ${tone === 'teal' ? 'bg-[#79b6ab]/20 text-[#9ed3ca]' : tone === 'coral' ? 'bg-[#ed805f]/20 text-[#ed9b82]' : 'bg-[#d8ad70]/20 text-[#e4c487]'}`}><Icon size={15} /></span><span className="min-w-0 flex-1"><span className="block text-xs font-semibold text-[#e7eee9]">{label}</span><span className="block text-[11px] text-[#98aaa4]">{detail}</span></span><Check size={14} className="text-[#9ed3ca]" /></div>)}
                    </div>
                    <div className="mt-5 flex items-center gap-2 rounded-xl bg-[#79b6ab]/10 px-3 py-2.5 text-[11px] text-[#b9dcd5]"><Sparkles size={13} /> Quietly making progress since 11:00 PM <span className="pulse-line ml-auto">•••</span></div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-4 -left-5 z-20 hidden rounded-2xl border border-[#7c837b] bg-[#f7f2e8] px-4 py-3 text-[#273149] shadow-xl sm:block"><p className="text-[10px] font-bold uppercase tracking-wider text-[#23776d]">Overnight report</p><p className="mt-1 text-sm font-semibold">Nothing urgent. Everything moving.</p></div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#f5f0e6] to-transparent" />
        </section>

        <section className="border-b border-[#ded8cb] bg-[#f5f0e6] py-12">
          <div className="nightowl-shell flex flex-col justify-between gap-7 md:flex-row md:items-center">
            <p className="max-w-sm text-[13px] leading-5 text-[#6e736d]">The invisible work of running a business is still work. NightOwl gives it a capable second shift.</p>
            <div className="flex flex-wrap gap-x-8 gap-y-3 text-[11px] font-bold uppercase tracking-[.17em] text-[#8a9089]"><span>Emails</span><span>Invoices</span><span>Appointments</span><span>Briefings</span><span>Peace of mind</span></div>
          </div>
        </section>

        <section id="capabilities" className="bg-[#f5f0e6] py-24 md:py-32">
          <div className="nightowl-shell">
            <div className="grid gap-12 md:grid-cols-[.78fr_1.22fr]">
              <div>
                <SectionEyebrow>What NightOwl does</SectionEyebrow>
                <h2 className="font-display text-4xl font-semibold leading-[1.02] tracking-[-.06em] text-[#273149] md:text-6xl">The work behind<br /><span className="text-[#23776d]">the work.</span></h2>
                <p className="mt-6 max-w-sm text-[15px] leading-7 text-[#6e736d]">Not another dashboard to babysit. NightOwl takes the operational threads you carry in your head and keeps them moving.</p>
                <a href="#process" className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-[#273149]" data-testid="link-capabilities-process">A calmer way to operate <ChevronRight size={16} className="text-[#ed805f]" /></a>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { no: '01', icon: Inbox, title: 'Email triage', desc: 'NightOwl sorts the signal from the noise, drafts thoughtful replies, and flags what only you can answer.', tint: 'teal' },
                  { no: '02', icon: FileText, title: 'Invoice follow-ups', desc: 'Friendly, timely nudges go out before an overdue invoice becomes an awkward conversation.', tint: 'coral' },
                  { no: '03', icon: Clock3, title: 'Smart scheduling', desc: 'It finds the right time, protects your focus, and untangles the back-and-forth.', tint: 'gold' },
                  { no: '04', icon: Moon, title: 'Morning briefings', desc: 'Wake up to a clear read on what moved, what matters, and where to start.', tint: 'navy' },
                ].map(({ no, icon: Icon, title, desc, tint }, index) => <article key={title} className={`group rounded-2xl border border-[#ded8cb] p-6 transition-transform hover:-translate-y-1 ${index === 1 ? 'sm:mt-10' : ''} ${index === 2 ? 'sm:-mt-4' : ''} bg-[#fbf8f2]`} data-testid={`card-capability-${no}`}><div className="mb-10 flex items-start justify-between"><span className="font-mono text-[11px] text-[#98978e]">{no}</span><span className={`grid h-10 w-10 place-items-center rounded-xl ${tint === 'teal' ? 'bg-[#d9ece7] text-[#23776d]' : tint === 'coral' ? 'bg-[#f7ded4] text-[#bc6047]' : tint === 'gold' ? 'bg-[#f3e7c9] text-[#9d7938]' : 'bg-[#e4e7ee] text-[#273149]'}`}><Icon size={18} /></span></div><h3 className="font-display text-xl font-semibold tracking-[-.04em] text-[#273149]">{title}</h3><p className="mt-3 text-[13px] leading-6 text-[#747a72]">{desc}</p></article>)}
              </div>
            </div>
          </div>
        </section>

        <section className="dark-panel relative overflow-hidden py-24 md:py-32">
          <div className="absolute right-0 top-0 h-full w-1/2 bg-[#344157]/40" />
          <div className="nightowl-shell relative grid gap-14 md:grid-cols-[.9fr_1.1fr] md:items-center">
            <div>
              <SectionEyebrow light>The NightOwl difference</SectionEyebrow>
              <h2 className="font-display text-4xl font-semibold leading-[1.04] tracking-[-.06em] text-[#F7F2E8] md:text-6xl">Capable enough<br />to <span className="text-[#ed805f]">let go.</span></h2>
              <p className="mt-6 max-w-[400px] text-[15px] leading-7 text-[#b9c8c1]">Your business is personal. NightOwl doesn’t bulldoze through it with robotic automation. It learns your preferences, keeps you in the loop, and knows when to hand things back.</p>
              <div className="mt-8 flex items-center gap-4 text-sm text-[#d8e2dd]"><ShieldCheck className="text-[#9ed3ca]" size={20} /> You stay in control, even when you’re offline.</div>
            </div>
            <div className="relative rounded-3xl border border-[#53636a] bg-[#2d394f] p-6 md:p-8">
              <div className="mb-7 flex items-center justify-between"><span className="text-sm font-semibold">A note from NightOwl</span><span className="rounded-full bg-[#79b6ab]/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#9ed3ca]">Human-first AI</span></div>
              <blockquote className="font-display text-2xl leading-[1.2] tracking-[-.04em] text-[#F7F2E8] md:text-3xl">“I didn’t need another tool telling me what to do. I needed someone to make sure the important things didn’t slip.”</blockquote>
              <div className="mt-8 flex items-center gap-3 border-t border-[#53636a] pt-5"><span className="grid h-9 w-9 place-items-center rounded-full bg-[#ed805f] text-xs font-bold text-[#273149]">TL</span><span><span className="block text-xs font-bold text-[#e9f0eb]">Tessa L.</span><span className="block text-[11px] text-[#98aaa4]">Owner, Cedar & Pine Studio</span></span></div>
              <div className="absolute -right-3 -top-3 rounded-lg bg-[#d8ad70] px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[#273149] rotate-3">Less noise. More life.</div>
            </div>
          </div>
        </section>

        <section id="process" className="bg-[#e5f0ed] py-24 md:py-32">
          <div className="nightowl-shell">
            <div className="mb-14 flex flex-col justify-between gap-6 md:flex-row md:items-end"><div><SectionEyebrow>How it works</SectionEyebrow><h2 className="font-display text-4xl font-semibold tracking-[-.06em] text-[#273149] md:text-6xl">Set it up once.<br /><span className="text-[#23776d]">Sleep better.</span></h2></div><p className="max-w-xs text-[13px] leading-6 text-[#60746f]">NightOwl works quietly in the background, with your permission and your patterns leading the way.</p></div>
            <div className="relative grid gap-5 md:grid-cols-3">
              <div className="absolute left-[17%] right-[17%] top-8 hidden h-px border-t border-dashed border-[#85aaa2] md:block" />
              {[
                { n: '1', title: 'Connect the dots', desc: 'Bring your inbox, calendar, and invoicing into one calm command center.', icon: Target },
                { n: '2', title: 'Teach your rhythm', desc: 'Tell NightOwl how you speak, what you prioritize, and when to ask first.', icon: Sparkles },
                { n: '3', title: 'Get your night back', desc: 'It gets to work. You get a briefing in the morning, not a backlog.', icon: Moon },
              ].map(({ n, title, desc, icon: Icon }) => <article key={n} className="relative z-10 bg-[#e5f0ed] md:pr-8" data-testid={`card-process-${n}`}><div className="grid h-16 w-16 place-items-center rounded-2xl border border-[#85aaa2] bg-[#f5f0e6] text-[#23776d]"><Icon size={22} /></div><div className="mt-7 flex items-baseline gap-3"><span className="font-mono text-xs text-[#ed805f]">0{n}</span><h3 className="font-display text-xl font-semibold tracking-[-.04em] text-[#273149]">{title}</h3></div><p className="mt-3 max-w-xs text-[13px] leading-6 text-[#60746f]">{desc}</p></article>)}
            </div>
          </div>
        </section>

        <section id="pricing" className="bg-[#f5f0e6] py-24 md:py-32">
          <div className="nightowl-shell grid gap-12 md:grid-cols-[.8fr_1.2fr] md:items-center">
            <div><SectionEyebrow>Simple by design</SectionEyebrow><h2 className="font-display text-4xl font-semibold leading-[1.03] tracking-[-.06em] text-[#273149] md:text-6xl">A small price<br />for a <span className="text-[#23776d]">quiet mind.</span></h2><p className="mt-6 max-w-sm text-[15px] leading-7 text-[#6e736d]">No tiers to decode. No annual commitment to justify. Just a capable second shift for your business.</p></div>
            <div className="coral-shadow rounded-3xl bg-[#273149] p-7 text-[#F7F2E8] md:p-10">
              <div className="flex flex-col justify-between gap-7 border-b border-[#526168] pb-8 sm:flex-row sm:items-end"><div><p className="text-[11px] font-bold uppercase tracking-[.18em] text-[#9ed3ca]">Launch plan</p><p className="mt-3 font-display text-5xl font-semibold tracking-[-.07em]">$20<span className="text-base font-normal tracking-normal text-[#aebdb7]"> / month</span></p></div><span className="rounded-full bg-[#ed805f] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#273149]">First six months</span></div>
              <div className="grid gap-x-8 gap-y-4 py-8 sm:grid-cols-2">{['Email triage and drafting', 'Invoice follow-up sequences', 'Smart scheduling support', 'Daily morning briefing', 'Human-first controls', 'Cancel whenever you need'].map((item) => <div key={item} className="flex items-center gap-2 text-[13px] text-[#d8e2dd]"><Check size={15} className="text-[#9ed3ca]" /> {item}</div>)}</div>
              <button type="button" onClick={goToContact} className="w-full rounded-xl bg-[#F7F2E8] px-5 py-3.5 text-sm font-bold text-[#273149] transition-colors hover:bg-[#e5f0ed]" data-testid="button-pricing-contact">Join the early access list <ArrowRight className="ml-1 inline-block" size={15} /></button>
              <p className="mt-5 text-center text-[11px] leading-5 text-[#98aaa4]">25% of your first six months supports a local SBA partner.</p>
            </div>
          </div>
        </section>

        <section id="mission" className="dark-panel py-24 md:py-32">
          <div className="nightowl-shell grid gap-12 md:grid-cols-[1.15fr_.85fr] md:items-center">
            <div><SectionEyebrow light>Why we’re here</SectionEyebrow><h2 className="font-display text-4xl font-semibold leading-[1.03] tracking-[-.065em] text-[#F7F2E8] md:text-6xl">The best businesses<br /><span className="text-[#ed805f]">shouldn’t cost you</span><br />your whole life.</h2></div>
            <div className="border-l border-[#526168] pl-7 md:pl-10"><p className="text-[17px] leading-8 text-[#c5d0ca]">Small-business owners are asked to be the visionary, the operator, the bookkeeper, and the person who replies at 11:47 PM.</p><p className="mt-6 text-[17px] leading-8 text-[#c5d0ca]">NightOwl is built to give some of that time back — and to put resources behind the people building businesses in their own communities.</p><a href="#contact" className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-[#9ed3ca]" data-testid="link-mission-contact">Start a conversation <ArrowRight size={16} /></a></div>
          </div>
        </section>

        <section id="contact" className="relative bg-[#ed805f] py-24 md:py-32">
          <div className="absolute right-[7%] top-16 hidden opacity-20 md:block"><OwlMark size={155} /></div>
          <div className="nightowl-shell relative grid gap-12 md:grid-cols-[.85fr_1.15fr] md:items-start">
            <div><SectionEyebrow>Come say hello</SectionEyebrow><h2 className="font-display text-4xl font-semibold leading-[1.02] tracking-[-.06em] text-[#273149] md:text-6xl">Ready to leave<br />work at <span className="text-[#F7F2E8]">work?</span></h2><p className="mt-6 max-w-sm text-[15px] leading-7 text-[#523f3b]">Tell us a little about your business. We’ll show you what a quieter night could look like.</p><div className="mt-8 flex items-center gap-3 text-sm font-semibold text-[#523f3b]"><Mail size={17} /> hello@nightowl.work</div></div>
            <div className="rounded-3xl border border-[#d66f54] bg-[#f7b09b]/45 p-6 md:p-8">
              {submitted ? <div className="flex min-h-[330px] flex-col items-center justify-center text-center"><span className="grid h-14 w-14 place-items-center rounded-full bg-[#273149] text-[#9ed3ca]"><Check size={25} /></span><h3 className="mt-6 font-display text-3xl font-semibold tracking-[-.05em] text-[#273149]">You’re on the list.</h3><p className="mt-3 max-w-xs text-sm leading-6 text-[#523f3b]">Thanks for reaching out. We’ll be in touch soon with a little more quiet.</p><button type="button" onClick={() => setSubmitted(false)} className="mt-7 text-sm font-bold underline underline-offset-4" data-testid="button-contact-reset">Send another note</button></div> : <form onSubmit={submitContact} noValidate><div className="mb-6"><p className="font-display text-2xl font-semibold tracking-[-.04em] text-[#273149]">Let’s make a plan.</p><p className="mt-1 text-xs text-[#694942]">Usually takes less than two minutes.</p></div><div className="grid gap-4 sm:grid-cols-2"><label className="text-xs font-bold text-[#523f3b]">Your name<input required name="name" className="form-input mt-2" placeholder="Maya Chen" data-testid="input-contact-name" /></label><label className="text-xs font-bold text-[#523f3b]">Work email<input required type="email" name="email" className="form-input mt-2" placeholder="maya@studio.com" data-testid="input-contact-email" /></label></div><label className="mt-4 block text-xs font-bold text-[#523f3b]">Tell us about your business <textarea required name="message" rows={4} className="form-input mt-2 resize-none" placeholder="I run a small design studio..." data-testid="input-contact-message" /></label>{formError && <p className="mt-3 text-xs font-bold text-[#8d3328]" role="alert" data-testid="status-contact-error">{formError}</p>}<button type="submit" className="mt-5 inline-flex items-center rounded-xl bg-[#273149] px-5 py-3.5 text-sm font-bold text-[#F7F2E8] transition-transform hover:-translate-y-0.5" data-testid="button-contact-submit">Send my note <Send className="ml-2" size={15} /></button><p className="mt-4 flex items-center gap-1.5 text-[10px] text-[#694942]"><ShieldCheck size={13} /> We’ll only use this to reply to you.</p></form>}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#273149] py-10 text-[#F7F2E8]">
        <div className="nightowl-shell flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div><Logo dark /><p className="mt-4 max-w-xs text-xs leading-5 text-[#98aaa4]">A calm, capable second shift for the people who keep small business moving.</p></div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-[#b9c8c1]"><a href="#capabilities" data-testid="footer-link-capabilities">Capabilities</a><a href="#pricing" data-testid="footer-link-pricing">Pricing</a><a href="#contact" data-testid="footer-link-contact">Contact</a><a href="mailto:hello@nightowl.work" aria-label="Email NightOwl" data-testid="footer-email"><Mail size={16} /></a><a href="https://www.linkedin.com" target="_blank" rel="noreferrer" aria-label="NightOwl on LinkedIn" data-testid="footer-linkedin"><Linkedin size={16} /></a></div>
          <p className="text-[10px] uppercase tracking-[.14em] text-[#71817e]">© 2025 NightOwl</p>
        </div>
      </footer>
    </div>
  );
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;