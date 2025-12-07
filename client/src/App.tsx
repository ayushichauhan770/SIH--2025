import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Register from "@/pages/register";
import CitizenDashboard from "@/pages/citizen/dashboard";
import SubmitApplication from "@/pages/citizen/submit-application";
import TrackApplication from "@/pages/citizen/track-application";
import ApplicationDetails from "@/pages/citizen/application-details";
import OfficialDashboard from "@/pages/official/dashboard";
import AdminDashboard from "@/pages/admin/dashboard";
import CandidateSelection from "@/pages/candidate-selection";
import JudiciaryDashboard from "@/pages/judiciary/dashboard";
import FileCase from "@/pages/judiciary/file-case";
import LitigantPortal from "@/pages/judiciary/litigant-portal";
import CaseDetails from "@/pages/judiciary/case-details";
import ScrutinyPortal from "@/pages/official/scrutiny-portal";

import { SessionGuard } from "@/components/session-guard";
import { ChatbotWidget } from "@/components/chatbot-widget";

function ProtectedRoute({ component: Component, allowedRoles }: { component: React.ComponentType; allowedRoles: string[] }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Redirect to="/" />;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/election/candidates" component={CandidateSelection} />
      <Route path="/judiciary" component={JudiciaryDashboard} />
      <Route path="/judiciary/dashboard" component={JudiciaryDashboard} />
      <Route path="/judiciary/file" component={FileCase} />
      <Route path="/judiciary/portal" component={LitigantPortal} />
      <Route path="/judiciary/cases/:id" component={CaseDetails} />

      <Route path="/citizen/dashboard">
        {() => <ProtectedRoute component={CitizenDashboard} allowedRoles={["citizen"]} />}
      </Route>
      <Route path="/citizen/submit">
        {() => <ProtectedRoute component={SubmitApplication} allowedRoles={["citizen"]} />}
      </Route>
      <Route path="/track" component={TrackApplication} />
      <Route path="/citizen/track">
        {() => <ProtectedRoute component={TrackApplication} allowedRoles={["citizen"]} />}
      </Route>
      <Route path="/citizen/application/:id">
        {() => <ProtectedRoute component={ApplicationDetails} allowedRoles={["citizen"]} />}
      </Route>

      <Route path="/official/dashboard">
        {() => <ProtectedRoute component={OfficialDashboard} allowedRoles={["official"]} />}
      </Route>

      {/* New Scrutiny Portal Route */}
      <Route path="/official/scrutiny">
         {() => <ProtectedRoute component={ScrutinyPortal} allowedRoles={["official"]} />}
      </Route>

      <Route path="/admin/dashboard">
        {() => <ProtectedRoute component={AdminDashboard} allowedRoles={["admin"]} />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SessionGuard />
        <TooltipProvider>
          <Toaster />
          <ChatbotWidget />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
