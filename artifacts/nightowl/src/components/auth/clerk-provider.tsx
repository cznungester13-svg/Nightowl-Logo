import { useEffect, useRef } from "react";
import { ClerkProvider, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.PROD
  ? `${window.location.origin}/api/__clerk`
  : undefined;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in .env file");
}

const clerkAppearance = {
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "hsl(175 47% 48%)", // Teal
    colorForeground: "hsl(42 36% 95%)", // Cream
    colorMutedForeground: "hsl(220 14% 70%)",
    colorDanger: "hsl(0 65% 55%)",
    colorBackground: "hsl(221 30% 17%)", // Card
    colorInput: "hsl(221 25% 26%)", // Input
    colorInputForeground: "hsl(42 36% 95%)",
    colorNeutral: "hsl(221 25% 26%)", // Borders
    fontFamily: "Space Grotesk, sans-serif",
    borderRadius: "1rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-[#1f2839] rounded-[2rem] w-[440px] max-w-full overflow-hidden border border-[#344157] shadow-2xl",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none p-8",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-2xl font-display font-semibold tracking-[-.04em] text-[#F7F2E8]",
    headerSubtitle: "text-sm text-[#98aaa4] mt-2",
    socialButtonsBlockButtonText: "text-sm font-semibold",
    formFieldLabel: "text-xs font-bold text-[#b9c8c1] mb-2",
    footerActionLink: "text-sm font-bold text-[#9ed3ca] hover:text-[#79b6ab]",
    footerActionText: "text-sm text-[#98aaa4]",
    dividerText: "text-xs font-bold uppercase tracking-[.15em] text-[#71817e]",
    identityPreviewEditButton: "text-[#9ed3ca] hover:text-[#79b6ab]",
    formFieldSuccessText: "text-xs text-[#9ed3ca]",
    alertText: "text-sm",
    logoBox: "mb-6 flex justify-center",
    logoImage: "h-12 w-auto",
    socialButtonsBlockButton: "border-[#344157] bg-[#273149] hover:bg-[#344157] text-[#F7F2E8]",
    formButtonPrimary: "bg-[#ed805f] hover:bg-[#d66f54] text-[#273149] font-bold py-3",
    formFieldInput: "bg-[#273149] border-[#526168] text-[#F7F2E8] px-4 py-3 rounded-xl focus:border-[#9ed3ca] focus:ring-1 focus:ring-[#9ed3ca]",
    footerAction: "mt-6 border-t border-[#344157] pt-6",
    dividerLine: "bg-[#344157]",
    alert: "bg-[#8d3328]/20 border border-[#8d3328] text-[#f7b09b]",
    otpCodeFieldInput: "bg-[#273149] border-[#526168] text-[#F7F2E8]",
    formFieldRow: "mb-5",
    main: "gap-6",
  },
};

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

export function ClerkProviderWithRoutes({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "Welcome back",
            subtitle: "Sign in to access your command center",
          },
        },
        signUp: {
          start: {
            title: "Create your account",
            subtitle: "Get started with NightOwl today",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <ClerkQueryClientCacheInvalidator />
      {children}
    </ClerkProvider>
  );
}
