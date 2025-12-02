import React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ApplicationCard } from "@/components/application-card";
import { NotificationBell } from "@/components/notification-bell";
import { ThemeToggle } from "@/components/theme-toggle";
import { StatsCard } from "@/components/stats-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Input } from "@/components/ui/input";
import { FileText, CheckCircle, Clock, TrendingUp, LogOut, LayoutDashboard, AlertTriangle, Search, Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import type { Application, Notification, Warning } from "@shared/schema";
import { ApplicationDetailsDialog } from "@/components/application-details-dialog";

export default function OfficialDashboard() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  const [filterStatus, setFilterStatus] = useState<"all" | "assigned" | "pending" | "completed">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: applications, isLoading } = useQuery<Application[]>({
    queryKey: ["/api/applications"],
    refetchInterval: 2000, // Auto-refresh every 2 seconds for near real-time updates
  });

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
  });

  // Fetch official's rating
  const { data: ratingStats } = useQuery<{ averageRating: number; totalRatings: number }>({
    queryKey: ["/api/officials", user?.id, "rating"],
    enabled: !!user?.id,
    refetchInterval: 5000, // Auto-update rating every 5 seconds
  });

  const [activeTab, setActiveTab] = useState("unassigned");

  const acceptMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("POST", `/api/applications/${id}/accept`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      toast({
        title: "Application Accepted",
        description: `Assigned to ${user?.fullName}. You can view it in My Applications.`,
      });
      setActiveTab("my-apps");
    },
  });

  const handleMarkAsRead = async (id: string) => {
    await apiRequest("POST", `/api/notifications/${id}/read`, {});
    queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
  };

  const [isWarningDialogOpen, setIsWarningDialogOpen] = useState(false);

  const { data: warnings = [], error: warningError } = useQuery<Warning[]>({
    queryKey: ["/api/warnings"],
    refetchInterval: 500, // Check every 0.5 seconds for instant warning alerts
  });

  // Show error if fetching fails
  useEffect(() => {
    if (warningError) {
      console.error("Failed to fetch warnings:", warningError);
    }
  }, [warningError]);

  const unreadWarnings = warnings.filter(w => !w.read);

  // Auto-open warning dialog if there are unread warnings
  useEffect(() => {
    if (unreadWarnings.length > 0) {
      if (!isWarningDialogOpen) {
        setIsWarningDialogOpen(true);
        // Play a sound or show a toast for the new warning
        toast({
          title: "New Warning Received",
          description: "You have a new performance warning from the admin.",
          variant: "destructive",
        });
      }
    }
  }, [unreadWarnings.length]);

  const handleAcknowledgeWarnings = async () => {
    try {
      // Acknowledge all unread warnings
      await Promise.all(unreadWarnings.map(w =>
        apiRequest("POST", `/api/warnings/${w.id}/acknowledge`, {})
      ));

      queryClient.invalidateQueries({ queryKey: ["/api/warnings"] });
      setIsWarningDialogOpen(false);
      toast({
        title: "Acknowledged",
        description: "You have acknowledged the warnings.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to acknowledge warnings",
        variant: "destructive",
      });
    }
  };

  const handleAccept = async (id: string) => {
    await acceptMutation.mutateAsync(id);
  };

  const unassignedApps = applications?.filter(app => app.status === "Submitted" && app.officialId === null) || [];
  const myApps = applications?.filter(app => app.officialId === user?.id) || [];
  const pendingApps = myApps.filter(app => app.status === "Assigned" || app.status === "In Progress");
  const completedToday = myApps.filter(app =>
    app.approvedAt && new Date(app.approvedAt).toDateString() === new Date().toDateString()
  ).length;

  // Filter myApps based on selection and search
  const filteredMyApps = myApps.filter(app => {
    // Search filter
    if (searchQuery && !app.trackingId.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    if (filterStatus === "all") return true;
    if (filterStatus === "assigned") return true; // "Assigned to Me" usually means all assigned apps
    if (filterStatus === "pending") return app.status === "Assigned" || app.status === "In Progress";
    if (filterStatus === "completed") return ["Approved", "Rejected", "Auto-Approved"].includes(app.status);
    return true;
  });

  // Filter unassigned apps based on search
  const filteredUnassignedApps = unassignedApps.filter(app => {
    if (searchQuery && !app.trackingId.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  // Scroll to list when filter changes
  useEffect(() => {
    if (filterStatus !== "all") {
      const element = document.getElementById("official-tabs");
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
        // Also switch to "my-apps" tab if not already there
        setActiveTab("my-apps");
      }
    }
  }, [filterStatus]);

  return (
    <div className="flex w-full h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex-col">
      <header className="border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold">Official Dashboard</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
            <span>Logged in as: <span className="font-mono font-bold text-primary">{user?.username}</span></span>
            {user?.department && <span>Dept: <span className="font-semibold">{user.department}</span></span>}
            {user?.subDepartment && <span>Sub-Dept: <span className="font-semibold">{user.subDepartment}</span></span>}
            <span>ID: <span className="font-mono">{user?.id?.substring(0, 8)}...</span></span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className={unreadWarnings.length > 0 ? "text-red-600 animate-flash hover:bg-red-50 hover:text-red-700" : "text-muted-foreground opacity-50"}
              onClick={() => unreadWarnings.length > 0 ? setIsWarningDialogOpen(true) : toast({ description: "No active warnings" })}
            >
              <AlertTriangle className={unreadWarnings.length > 0 ? "h-6 w-6" : "h-5 w-5"} />
            </Button>
            <NotificationBell notifications={notifications} onMarkAsRead={handleMarkAsRead} />
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={() => {
              logout();
              // Force full reload to clear any memory state
              window.location.href = "/";
            }}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-6 space-y-6">
        <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white shadow-lg">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold font-heading">Welcome back, {user?.fullName}!</h2>
            <p className="text-blue-100">Here's an overview of your assigned applications and performance.</p>

            <div className="flex flex-wrap items-center gap-4 mt-4">
              {user?.department && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
                  <span className="text-sm font-medium text-white">
                    {user.department}
                  </span>
                </div>
              )}
              {user?.subDepartment && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
                  <span className="text-sm font-medium text-white">
                    {user.subDepartment}
                  </span>
                </div>
              )}
              {ratingStats && ratingStats.totalRatings > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-400/20 backdrop-blur-sm rounded-full border border-yellow-400/50">
                  <Star className="h-4 w-4 text-yellow-300 fill-yellow-300" />
                  <span className="text-sm font-bold text-white">
                    {ratingStats.averageRating.toFixed(1)} / 5.0
                  </span>
                  <span className="text-xs text-blue-100">
                    ({ratingStats.totalRatings} ratings)
                  </span>
                </div>
              )}
              <Input
                type="search"
                placeholder="Search by Application Number..."
                className="pl-8 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div onClick={() => setFilterStatus("assigned")} className="cursor-pointer transition-transform hover:scale-105">
            <Card className={`border-0 shadow-lg ${filterStatus === 'assigned' ? 'ring-2 ring-blue-500 ring-offset-2' : ''} bg-gradient-to-br from-blue-500 to-blue-600 text-white`}>
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium text-blue-100">Assigned to Me</CardTitle>
                <FileText className="h-4 w-4 text-blue-100" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{myApps.length}</div>
              </CardContent>
            </Card>
          </div>
          <div onClick={() => setFilterStatus("pending")} className="cursor-pointer transition-transform hover:scale-105">
            <Card className={`border-0 shadow-lg ${filterStatus === 'pending' ? 'ring-2 ring-orange-500 ring-offset-2' : ''} bg-gradient-to-br from-orange-500 to-orange-600 text-white`}>
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium text-orange-100">Pending Review</CardTitle>
                <Clock className="h-4 w-4 text-orange-100" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{pendingApps.length}</div>
              </CardContent>
            </Card>
          </div>
          <div onClick={() => setFilterStatus("completed")} className="cursor-pointer transition-transform hover:scale-105">
            <Card className={`border-0 shadow-lg ${filterStatus === 'completed' ? 'ring-2 ring-green-500 ring-offset-2' : ''} bg-gradient-to-br from-green-500 to-green-600 text-white`}>
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium text-green-100">Completed Today</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-100" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{completedToday}</div>
              </CardContent>
            </Card>
          </div>
          <div className="cursor-pointer transition-transform hover:scale-105">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium text-purple-100">Avg Processing Time</CardTitle>
                <TrendingUp className="h-4 w-4 text-purple-100" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">12 days</div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full" id="official-tabs">
          <TabsList className="bg-white/50 dark:bg-slate-800/50 p-1 rounded-xl border border-gray-200 dark:border-gray-700">
            <TabsTrigger
              value="unassigned"
              data-testid="tab-unassigned"
              className="rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all duration-300"
            >
              Unassigned ({filteredUnassignedApps.length})
            </TabsTrigger>
            <TabsTrigger
              value="my-apps"
              data-testid="tab-my-applications"
              className="rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all duration-300"
            >
              My Applications ({filteredMyApps.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="unassigned" className="space-y-4 mt-4">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2].map(i => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-4 w-32" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-20 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredUnassignedApps.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No unassigned applications found</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredUnassignedApps.map(app => (
                  <ApplicationCard
                    key={app.id}
                    application={app}
                    onViewDetails={() => setSelectedApp(app)}
                    showActions
                    onAccept={() => handleAccept(app.id)}
                    className="animate-in fade-in slide-in-from-bottom-4 duration-500"
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="my-apps" className="space-y-4 mt-4">
            {filteredMyApps.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {filterStatus === "all" && !searchQuery ? "No applications assigned to you" : "No applications found"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredMyApps.map(app => (
                  <ApplicationCard
                    key={app.id}
                    application={app}
                    onViewDetails={() => setSelectedApp(app)}
                    showActions
                    onUpdate={() => setSelectedApp(app)}
                    className="animate-in fade-in slide-in-from-bottom-4 duration-500"
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main >

      <ApplicationDetailsDialog
        application={selectedApp}
        open={!!selectedApp}
        onClose={() => setSelectedApp(null)}
        canUpdateStatus={selectedApp?.officialId === user?.id}
      />

      {/* Fixed Warning Icon on Right Side */}
      {
        unreadWarnings.length > 0 && (
          <div className="fixed right-4 top-24 z-50 animate-bounce">
            <Button
              variant="destructive"
              size="lg"
              className="rounded-full h-16 w-16 shadow-2xl border-4 border-white dark:border-slate-950 animate-flash bg-red-600 hover:bg-red-700"
              onClick={() => setIsWarningDialogOpen(true)}
            >
              <AlertTriangle className="h-8 w-8" />
            </Button>
          </div>
        )
      }

      <Dialog open={isWarningDialogOpen} onOpenChange={setIsWarningDialogOpen}>
        <DialogContent className="sm:max-w-md border-2 border-red-500">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2 text-xl">
              <AlertTriangle className="h-6 w-6" />
              Performance Warning
            </DialogTitle>
            <DialogDescription className="text-base font-medium text-gray-700 dark:text-gray-300">
              You have received the following warning(s) from the administration. Please review and acknowledge.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            {unreadWarnings.map(warning => (
              <div key={warning.id} className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-4 rounded-lg shadow-sm">
                <p className="font-bold text-red-800 dark:text-red-300 mb-2">Message from Admin:</p>
                <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{warning.message}</p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-3 text-right font-mono">
                  {new Date(warning.sentAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-6 text-lg"
              onClick={handleAcknowledgeWarnings}
            >
              I Understand & Acknowledge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div >
  );
}
