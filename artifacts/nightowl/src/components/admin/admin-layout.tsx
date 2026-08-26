import { ReactNode, useState } from "react";
import { Link, useLocation, Redirect } from "wouter";
import { Show, useClerk, useUser } from "@clerk/react";
import {
  LayoutDashboard,
  Inbox,
  Settings as SettingsIcon,
  BarChart2,
  CreditCard,
  LogOut,
  Moon,
  ShieldAlert,
  Menu,
  X,
} from "lucide-react";
import { useGetAdminMe } from "@workspace/api-client-react";

function OwlMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.82} viewBox="0 0 52 43" role="img">
      <path d="M7 5 2.5 1.5 4 12.3a20 20 0 0 0-1.8 8.4C2.2 33 12.7 41 26 41s23.8-8 23.8-20.3c0-3.1-.6-5.9-1.8-8.4l1.5-10.8L45 5l-5.3 3.7A25 25 0 0 0 26 4.3 25 25 0 0 0 12.3 8.7L7 5Z" fill="#F7F2E8" />
      <path d="M5.8 18.8C9 13.6 15.2 11 21 12.5c2.1.5 3.8 1.6 5 3.2 1.2-1.6 2.9-2.7 5-3.2 5.8-1.5 12 1.1 15.2 6.3C45.5 29.2 37.4 36 26 36S6.5 29.2 5.8 18.8Z" fill="#79B6AB" />
      <circle cx="18.5" cy="21" r="6.6" fill="#F7F2E8" />
      <circle cx="33.5" cy="21" r="6.6" fill="#F7F2E8" />
      <circle cx="18.5" cy="21" r="2.1" fill="#273149" />
      <circle cx="33.5" cy="21" r="2.1" fill="#273149" />
      <path d="m22 28 4-3.2 4 3.2-4 3.5L22 28Z" fill="#ED805F" />
    </svg>
  );
}

const navItems = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/leads", label: "Leads", icon: Inbox },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/admin/settings", label: "Settings", icon: SettingsIcon },
  { href: "/admin/billing", label: "Billing", icon: CreditCard },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Show when="signed-in">
        <AdminLayoutContent>{children}</AdminLayoutContent>
      </Show>
      <Show when="signed-out">
        <Redirect to="/sign-in" />
      </Show>
    </>
  );
}

function AdminLayoutContent({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { signOut } = useClerk();
  const { user } = useUser();
  const { data: adminMe, isLoading, error } = useGetAdminMe();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = () => {
    signOut({ redirectUrl: "/" });
  };

  if (isLoading) {
    return (
      <div className="dark min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-muted-foreground animate-pulse">
          <Moon size={32} />
          <p className="text-sm font-semibold tracking-wider uppercase">Loading Command Center</p>
        </div>
      </div>
    );
  }

  if (error || !adminMe?.isAdmin) {
    return (
      <div className="dark min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-3xl border border-border bg-card p-8 shadow-2xl text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/20 text-destructive mb-6">
            <ShieldAlert size={32} />
          </div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground mb-3">
            Access Denied
          </h1>
          <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
            You do not have administrative privileges for the NightOwl command center. If you believe this is an error, please check your allowlist configuration.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={handleSignOut}
              className="w-full rounded-xl bg-primary text-primary-foreground font-bold py-3 transition-transform hover:-translate-y-0.5"
            >
              Sign out and return
            </button>
            <Link href="/" className="w-full rounded-xl border border-border text-foreground font-semibold py-3 transition-colors hover:bg-secondary/50 block">
              Go to public site
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dark min-h-screen bg-background text-foreground flex overflow-hidden">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-border bg-card md:flex flex-col relative z-20">
        <div className="p-6 flex items-center gap-3 border-b border-border/50">
          <OwlMark size={28} />
          <span className="font-display text-lg font-semibold tracking-tight">NightOwl</span>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-4">
          <div className="text-[10px] font-bold uppercase tracking-[.15em] text-muted-foreground mb-4 px-3">
            Command Center
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const active = location === item.href || (item.href !== "/admin" && location.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    active 
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                  data-testid={`nav-${item.label.toLowerCase()}`}
                >
                  <Icon size={18} className={active ? "text-primary" : "opacity-70"} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-border/50">
          <div className="flex items-center gap-3 px-3 py-3 mb-2 rounded-xl bg-secondary/30">
            <div className="h-8 w-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-bold text-xs uppercase overflow-hidden">
              {user?.imageUrl ? (
                <img src={user.imageUrl} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                user?.primaryEmailAddress?.emailAddress?.charAt(0) || "A"
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user?.firstName || "Admin"}</p>
              <p className="text-[10px] text-muted-foreground truncate">{user?.primaryEmailAddress?.emailAddress}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            data-testid="button-sign-out"
          >
            <LogOut size={18} className="opacity-70" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-black/65 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            data-testid="button-close-mobile-nav-overlay"
          />
          <aside className="relative flex h-full w-[min(19rem,86vw)] flex-col border-r border-border bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-border/50 p-5">
              <div className="flex items-center gap-3">
                <OwlMark size={28} />
                <span className="font-display text-lg font-semibold">NightOwl</span>
              </div>
              <button
                type="button"
                aria-label="Close navigation"
                onClick={() => setMobileOpen(false)}
                className="rounded-xl border border-border p-2 text-muted-foreground hover:text-foreground"
                data-testid="button-close-mobile-nav"
              >
                <X size={20} />
              </button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto p-4">
              {navItems.map((item) => {
                const active =
                  location === item.href ||
                  (item.href !== "/admin" && location.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium ${
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                    data-testid={`mobile-nav-${item.label.toLowerCase()}`}
                  >
                    <Icon size={18} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <button
              type="button"
              onClick={handleSignOut}
              className="m-4 flex items-center gap-3 rounded-xl border border-border px-3 py-3 text-sm font-medium text-muted-foreground"
              data-testid="button-mobile-sign-out"
            >
              <LogOut size={18} />
              Sign out
            </button>
          </aside>
        </div>
      )}

      <main className="min-w-0 flex-1 flex flex-col relative overflow-hidden bg-background">
        <div className="absolute inset-0 aurora night-grid opacity-10 pointer-events-none" />
        <header className="relative z-20 flex items-center justify-between border-b border-border bg-card/90 px-4 py-3 backdrop-blur md:hidden">
          <div className="flex items-center gap-3">
            <OwlMark size={27} />
            <span className="font-display font-semibold">NightOwl</span>
          </div>
          <button
            type="button"
            aria-label="Open navigation"
            onClick={() => setMobileOpen(true)}
            className="rounded-xl border border-border p-2.5 text-muted-foreground hover:text-foreground"
            data-testid="button-open-mobile-nav"
          >
            <Menu size={20} />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto relative z-10">
          <div className="mx-auto w-full max-w-[1200px] p-4 sm:p-6 lg:p-12">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
