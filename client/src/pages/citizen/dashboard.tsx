import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ApplicationCard } from "@/components/application-card";
import { NotificationBell } from "@/components/notification-bell";
import { ThemeToggle } from "@/components/theme-toggle";
import { FileText, Plus, Search, LogOut, Shield } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Application, Notification } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function CitizenDashboard() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  const { data: applications, isLoading: applicationsLoading } = useQuery<Application[]>({
    queryKey: ["/api/applications/my"],
  });

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    refetchInterval: 30000,
  });

  const handleMarkAsRead = async (id: string) => {
    await apiRequest("POST", `/api/notifications/${id}/read`, {});
    queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
  };

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  const handleViewDetails = (id: string) => {
    setLocation(`/citizen/application/${id}`);
  };

  const activeApplications = applications?.filter(app =>
    ["Submitted", "Assigned", "In Progress"].includes(app.status)
  ) || [];

  const completedApplications = applications?.filter(app =>
    ["Approved", "Rejected", "Auto-Approved"].includes(app.status)
  ) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <header className="border-b sticky top-0 bg-white/95 dark:bg-slate-950/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-slate-950/60 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <span className="font-heading font-bold text-xl bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                Digital Governance
              </span>
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell notifications={notifications} onMarkAsRead={handleMarkAsRead} />
              <ThemeToggle />
              <Button variant="ghost" size="icon" onClick={handleLogout} data-testid="button-logout">
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold font-heading bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
            Welcome, {user?.fullName}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your applications and track their progress</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-0 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50" onClick={() => setLocation("/citizen/submit")} data-testid="card-new-application">
            <CardHeader className="flex flex-row flex-wrap items-center gap-4 space-y-0">
              <div className="flex items-center justify-center w-14 h-14 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
                <Plus className="h-7 w-7" />
              </div>
              <div className="flex-1">
                <CardTitle className="font-heading text-blue-900 dark:text-blue-100">New Application</CardTitle>
                <CardDescription className="text-blue-700 dark:text-blue-300">Submit a new government application</CardDescription>
              </div>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/50" onClick={() => setLocation("/citizen/track")} data-testid="card-track-application">
            <CardHeader className="flex flex-row flex-wrap items-center gap-4 space-y-0">
              <div className="flex items-center justify-center w-14 h-14 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg">
                <Search className="h-7 w-7" />
              </div>
              <div className="flex-1">
                <CardTitle className="font-heading text-purple-900 dark:text-purple-100">Track Application</CardTitle>
                <CardDescription className="text-purple-700 dark:text-purple-300">Search by tracking ID</CardDescription>
              </div>
            </CardHeader>
          </Card>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950/50">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold font-heading text-gray-900 dark:text-gray-100">Active Applications</h2>
          </div>

          {applicationsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map(i => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24 mt-2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : activeApplications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  No active applications. Submit your first application to get started.
                </p>
                <Button className="mt-4" onClick={() => setLocation("/citizen/submit")} data-testid="button-submit-first">
                  Submit Application
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeApplications.map(app => (
                <ApplicationCard
                  key={app.id}
                  application={app}
                  onViewDetails={() => handleViewDetails(app.id)}
                />
              ))}
            </div>
          )}
        </div>

        {completedApplications.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-950/50">
                <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl font-bold font-heading text-gray-900 dark:text-gray-100">Completed Applications</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {completedApplications.map(app => (
                <ApplicationCard
                  key={app.id}
                  application={app}
                  onViewDetails={() => handleViewDetails(app.id)}
                />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
