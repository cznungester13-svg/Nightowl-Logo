import { type ComponentType, type ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { queryClient } from '@/lib/queryClient';

// Pages
import { Home } from '@/pages/home';
import { SignInPage } from '@/pages/auth/sign-in';
import { SignUpPage } from '@/pages/auth/sign-up';
import { AdminOverviewPage } from '@/pages/admin/overview';
import { AdminLeadsPage } from '@/pages/admin/leads/index';
import { AdminLeadDetailPage } from '@/pages/admin/leads/detail';
import { AdminSettingsPage } from '@/pages/admin/settings';
import { AdminAnalyticsPage } from '@/pages/admin/analytics';
import { AdminBillingPage } from '@/pages/admin/billing';
import { CheckoutCancelPage, CheckoutSuccessPage } from '@/pages/checkout-status';

// Layouts and Auth
import { ClerkProviderWithRoutes } from '@/components/auth/clerk-provider';
import { AdminLayout } from '@/components/admin/admin-layout';

// Wrapper for Admin Routes that ensures they are rendered inside the AdminLayout
function AdminRoute({ component: Component }: { component: ComponentType }) {
  return (
    <AdminLayout>
      <Component />
    </AdminLayout>
  );
}

function Router() {
  return (
    <ClerkProviderWithRoutes>
      <RoutedErrorBoundary>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/checkout/success" component={CheckoutSuccessPage} />
          <Route path="/checkout/cancel" component={CheckoutCancelPage} />
          
          <Route path="/sign-in/*?" component={SignInPage} />
          <Route path="/sign-up/*?" component={SignUpPage} />
          
          <Route path="/admin">
            <AdminRoute component={AdminOverviewPage} />
          </Route>
          <Route path="/admin/leads">
            <AdminRoute component={AdminLeadsPage} />
          </Route>
          <Route path="/admin/leads/:id">
            <AdminRoute component={AdminLeadDetailPage} />
          </Route>
          <Route path="/admin/settings">
            <AdminRoute component={AdminSettingsPage} />
          </Route>
          <Route path="/admin/analytics">
            <AdminRoute component={AdminAnalyticsPage} />
          </Route>
          <Route path="/admin/billing">
            <AdminRoute component={AdminBillingPage} />
          </Route>
          
          <Route component={NotFound} />
        </Switch>
      </RoutedErrorBoundary>
    </ClerkProviderWithRoutes>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={basePath}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
