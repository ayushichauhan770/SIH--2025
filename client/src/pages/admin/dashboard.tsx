import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NotificationBell } from "@/components/notification-bell";
import { ThemeToggle } from "@/components/theme-toggle";
import { StatsCard } from "@/components/stats-card";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText, Users, AlertTriangle, TrendingUp, LogOut, LayoutDashboard, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Application, Notification, User as UserType } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  const { data: applications, isLoading: appsLoading } = useQuery<Application[]>({
    queryKey: ["/api/applications/all"],
  });

  const { data: officials, isLoading: officialsLoading } = useQuery<UserType[]>({
    queryKey: ["/api/users/officials"],
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

  const totalApplications = applications?.length || 0;
  const pendingApplications = applications?.filter(app =>
    ["Submitted", "Assigned", "In Progress"].includes(app.status)
  ).length || 0;
  const delayedApplications = applications?.filter(app => {
    const daysSinceSubmission = Math.floor(
      (Date.now() - new Date(app.submittedAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysSinceSubmission > 20 && !["Approved", "Rejected", "Auto-Approved"].includes(app.status);
  }).length || 0;

  const sidebarStyle = {
    "--sidebar-width": "16rem",
  };

  const statusColors: Record<string, string> = {
    "Submitted": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    "Assigned": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    "In Progress": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    "Approved": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    "Rejected": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    "Auto-Approved": "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  };

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full bg-gradient-to-br from-blue-50 via-slate-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <Sidebar className="bg-white/95 dark:bg-slate-950/95 border-r border-gray-200 dark:border-gray-800">
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="text-gray-600 dark:text-gray-400">Admin Panel</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton className="hover:bg-blue-50 dark:hover:bg-blue-950/50" data-testid="sidebar-dashboard">
                      <LayoutDashboard className="h-4 w-4" />
                      <span>Dashboard</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton className="hover:bg-blue-50 dark:hover:bg-blue-950/50" data-testid="sidebar-applications">
                      <FileText className="h-4 w-4" />
                      <span>Applications</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton className="hover:bg-blue-50 dark:hover:bg-blue-950/50" data-testid="sidebar-officials">
                      <Users className="h-4 w-4" />
                      <span>Officials</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton className="hover:bg-blue-50 dark:hover:bg-blue-950/50" data-testid="sidebar-delay-monitor">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Delay Monitor</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between p-4 border-b bg-white/95 dark:bg-slate-950/95 border-gray-200 dark:border-gray-800 shadow-sm">
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
            <div className="space-y-2">
              <h1 className="text-3xl font-bold font-heading bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400">System overview and monitoring</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatsCard
                title="Total Applications"
                value={totalApplications}
                icon={FileText}
              />
              <StatsCard
                title="Pending"
                value={pendingApplications}
                icon={Clock}
              />
              <StatsCard
                title="Delayed"
                value={delayedApplications}
                icon={AlertTriangle}
              />
              <StatsCard
                title="Officials"
                value={officials?.length || 0}
                icon={Users}
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="font-heading">Recent Applications</CardTitle>
                <CardDescription>Overview of all applications in the system</CardDescription>
              </CardHeader>
              <CardContent>
                {appsLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tracking ID</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead>Official</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {applications?.slice(0, 10).map(app => (
                        <TableRow key={app.id} data-testid={`row-application-${app.id}`}>
                          <TableCell className="font-mono text-sm">{app.trackingId}</TableCell>
                          <TableCell>{app.applicationType}</TableCell>
                          <TableCell>
                            <Badge className={statusColors[app.status]}>
                              {app.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(app.submittedAt), { addSuffix: true })}
                          </TableCell>
                          <TableCell className="text-sm">
                            {app.officialId ? "Assigned" : "Unassigned"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-heading">Officials Performance</CardTitle>
                <CardDescription>Track official workload and performance</CardDescription>
              </CardHeader>
              <CardContent>
                {officialsLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Assigned</TableHead>
                        <TableHead>Completed</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {officials?.map(official => {
                        const assignedCount = applications?.filter(app => app.officialId === official.id).length || 0;
                        const completedCount = applications?.filter(app =>
                          app.officialId === official.id &&
                          ["Approved", "Rejected", "Auto-Approved"].includes(app.status)
                        ).length || 0;

                        return (
                          <TableRow key={official.id} data-testid={`row-official-${official.id}`}>
                            <TableCell className="font-medium">{official.fullName}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{official.email}</TableCell>
                            <TableCell>{assignedCount}</TableCell>
                            <TableCell>{completedCount}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
