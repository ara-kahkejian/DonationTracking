import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { MainLayout } from "@/components/layout/main-layout";
import NotFound from "@/pages/not-found";
import { LanguageProvider } from "./contexts/LanguageContext";

// Pages
import Dashboard from "@/pages/dashboard";
import MembersPage from "@/pages/members/index";
import MemberDetailsPage from "@/pages/members/[id]";
import CategoriesPage from "@/pages/categories/index";
import InitiativesPage from "@/pages/initiatives/index";
import InitiativeDetailsPage from "@/pages/initiatives/[id]";
import VaultPage from "@/pages/vault/index";
import ReportsPage from "@/pages/reports/index";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/members" component={MembersPage} />
      <Route path="/members/:id" component={MemberDetailsPage} />
      <Route path="/categories" component={CategoriesPage} />
      <Route path="/initiatives" component={InitiativesPage} />
      <Route path="/initiatives/:id" component={InitiativeDetailsPage} />
      <Route path="/vault" component={VaultPage} />
      <Route path="/reports" component={ReportsPage} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <MainLayout>
          <Router />
        </MainLayout>
        <Toaster />
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
