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
      {/* Public Routes */}
      <Route path="/auth" component={AuthPage} />
      
      {/* Protected Routes */}
      <Route path="/">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/productivity">
        <ProtectedRoute component={Productivity} />
      </Route>
      <Route path="/finance">
        <ProtectedRoute component={Finance} />
      </Route>
      
      {/* Placeholders for routes to be implemented */}
      <Route path="/calendar">
        <div className="flex items-center justify-center h-screen bg-background">
          <div className="text-center">
            <h1 className="text-2xl font-bold font-display">Calendar Coming Soon</h1>
            <p className="text-muted-foreground mt-2">This module is under construction.</p>
            <a href="/" className="text-primary hover:underline mt-4 block">Go Home</a>
          </div>
        </div>
      </Route>

      <Route path="/journal">
         <div className="flex items-center justify-center h-screen bg-background">
          <div className="text-center">
            <h1 className="text-2xl font-bold font-display">Journal Coming Soon</h1>
            <p className="text-muted-foreground mt-2">This module is under construction.</p>
            <a href="/" className="text-primary hover:underline mt-4 block">Go Home</a>
          </div>
        </div>
      </Route>

      <Route path="/insights">
         <div className="flex items-center justify-center h-screen bg-background">
          <div className="text-center">
            <h1 className="text-2xl font-bold font-display">Insights Coming Soon</h1>
            <p className="text-muted-foreground mt-2">This module is under construction.</p>
            <a href="/" className="text-primary hover:underline mt-4 block">Go Home</a>
          </div>
        </div>
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
