import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useUser } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import Productivity from "@/pages/productivity";
import Finance from "@/pages/finance";
import CalendarPage from "@/pages/calendar";
import JournalPage from "@/pages/journal";
import InsightsPage from "@/pages/insights";
import SettingsPage from "@/pages/settings";
import AboutPage from "@/pages/about";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { data: user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      
      <Route path="/">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/productivity">
        <ProtectedRoute component={Productivity} />
      </Route>
      <Route path="/finance">
        <ProtectedRoute component={Finance} />
      </Route>
      <Route path="/calendar">
        <ProtectedRoute component={CalendarPage} />
      </Route>
      <Route path="/journal">
        <ProtectedRoute component={JournalPage} />
      </Route>
      <Route path="/insights">
        <ProtectedRoute component={InsightsPage} />
      </Route>
      <Route path="/settings">
        <ProtectedRoute component={SettingsPage} />
      </Route>
      <Route path="/about">
        <ProtectedRoute component={AboutPage} />
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
