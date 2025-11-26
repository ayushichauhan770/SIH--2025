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
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, CheckCircle, Clock, TrendingUp, LogOut, LayoutDashboard, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Application, Notification } from "@shared/schema";

export default function OfficialDashboard() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [updateStatus, setUpdateStatus] = useState("");
  const [comment, setComment] = useState("");

  const { data: applications, isLoading } = useQuery<Application[]>({
    queryKey: ["/api/applications/official"],
  });

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    refetchInterval: 30000,
  });

  const acceptMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("POST", `/api/applications/${id}/accept`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications/official"] });
      toast({ title: "Application Accepted", description: "You can now work on this application" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, comment }: { id: string; status: string; comment: string }) => {
      return await apiRequest("PATCH", `/api/applications/${id}/status`, { status, comment });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications/official"] });
      setSelectedApp(null);
      setUpdateStatus("");
      setComment("");
      toast({ title: "Status Updated", description: "Application status has been updated" });
    },
  });

  const handleMarkAsRead = async (id: string) => {
    await apiRequest("POST", `/api/notifications/${id}/read`, {});
    queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
  };

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  const handleAccept = async (id: string) => {
    await acceptMutation.mutateAsync(id);
  };

  const handleUpdateStatus = () => {
    if (selectedApp && updateStatus) {
      updateMutation.mutate({
        id: selectedApp.id,
        status: updateStatus,
        comment,
      });
    }
  };

  const unassignedApps = applications?.filter(app => app.status === "Submitted") || [];
  const myApps = applications?.filter(app => app.officialId === user?.id) || [];
  const pendingApps = myApps.filter(app => app.status === "Assigned");
  const completedToday = myApps.filter(app =>
    app.approvedAt && new Date(app.approvedAt).toDateString() === new Date().toDateString()
  ).length;

  const sidebarStyle = {
    "--sidebar-width": "16rem",
  };

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full bg-gradient-to-br from-green-50 via-slate-50 to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <Sidebar>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Official Portal</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton data-testid="sidebar-dashboard">
                      <LayoutDashboard className="h-4 w-4" />
                      <span>Dashboard</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton data-testid="sidebar-my-applications">
                      <FileText className="h-4 w-4" />
                      <span>My Applications</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton data-testid="sidebar-delays">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Delays</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between p-4 border-b bg-white/95 dark:bg-slate-950/95 shadow-sm">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-2">
              <NotificationBell notifications={notifications} onMarkAsRead={handleMarkAsRead} />
              <ThemeToggle />
              <Button variant="ghost" size="icon" onClick={handleLogout} data-testid="button-logout">
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </header>

          <main className="flex-1 overflow-auto p-6 space-y-6">
            <div>
              <h1 className="text-3xl font-bold font-heading bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">Official Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-400">Welcome, {user?.fullName}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatsCard
                title="Assigned to Me"
                value={myApps.length}
                icon={FileText}
              />
              <StatsCard
                title="Pending Review"
                value={pendingApps.length}
                icon={Clock}
              />
              <StatsCard
                title="Completed Today"
                value={completedToday}
                icon={CheckCircle}
              />
              <StatsCard
                title="Avg Processing Time"
                value="12 days"
                icon={TrendingUp}
              />
            </div>

            <Tabs defaultValue="unassigned" className="w-full">
              <TabsList>
                <TabsTrigger value="unassigned" data-testid="tab-unassigned">
                  Unassigned ({unassignedApps.length})
                </TabsTrigger>
                <TabsTrigger value="my-apps" data-testid="tab-my-applications">
                  My Applications ({myApps.length})
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
                ) : unassignedApps.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No unassigned applications</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {unassignedApps.map(app => (
                      <ApplicationCard
                        key={app.id}
                        application={app}
                        onViewDetails={() => { }}
                        showActions
                        onAccept={() => handleAccept(app.id)}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="my-apps" className="space-y-4 mt-4">
                {myApps.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No applications assigned to you</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {myApps.map(app => (
                      <ApplicationCard
                        key={app.id}
                        application={app}
                        onViewDetails={() => { }}
                        showActions
                        onUpdate={() => setSelectedApp(app)}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>

      <Dialog open={!!selectedApp} onOpenChange={() => setSelectedApp(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Application Status</DialogTitle>
            <DialogDescription>
              Update the status of {selectedApp?.trackingId}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="status">New Status</Label>
              <Select value={updateStatus} onValueChange={setUpdateStatus}>
                <SelectTrigger data-testid="select-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="comment">Comment</Label>
              <Textarea
                id="comment"
                placeholder="Add a comment about this update..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                data-testid="textarea-comment"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedApp(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateStatus} disabled={!updateStatus} data-testid="button-update-status">
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
