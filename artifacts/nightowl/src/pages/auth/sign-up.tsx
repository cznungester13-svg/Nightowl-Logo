import { SignUp } from "@clerk/react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export function SignUpPage() {
  return (
    <div className="dark min-h-[100dvh] flex items-center justify-center bg-background px-4 noise relative">
      <div className="absolute inset-0 aurora night-grid opacity-30 pointer-events-none" />
      <div className="relative z-10 w-full max-w-[440px]">
        <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
      </div>
    </div>
  );
}
