import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NotificationBell } from "@/components/notification-bell";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText, Users, AlertTriangle, LogOut, Eye, Star, Send, Building2, CheckCircle, XCircle, UserCheck, Menu, Search, Filter, ChevronRight, Shield, Clock } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Application, Notification, User as UserType } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { ApplicationDetailsDialog } from "@/components/application-details-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

// Helper component to fetch and display citizen info for each application row
function ApplicationRowWithCitizen({
  app,
  statusColors,
  officialId,
  onRowClick
}: {
  app: Application;
  statusColors: Record<string, string>;
  officialId: string;
  onRowClick?: (app: Application) => void;
}) {
  const { data: citizen } = useQuery<{ fullName: string } | null>({
    queryKey: ["/api/users", app.citizenId],
    enabled: !!app.citizenId,
  });

  const { data: feedback } = useQuery<{ rating: number; comment: string } | null>({
    queryKey: ["/api/applications", app.id, "feedback"],
    enabled: !!app.id && ["Approved", "Auto-Approved", "Rejected"].includes(app.status),
  });

  return (
    <TableRow className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800">
      <TableCell className="font-mono text-sm text-[#86868b]">{app.trackingId}</TableCell>
      <TableCell className="font-medium text-[#1d1d1f] dark:text-white">{citizen?.fullName || "Loading..."}</TableCell>
      <TableCell>
        <Badge className={`rounded-full px-3 py-1 text-xs font-medium border-0 ${statusColors[app.status]}`}>
          {app.status}
        </Badge>
      </TableCell>
      <TableCell>
        {feedback?.rating ? (
          <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded-lg w-fit">
            <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
            <span className="font-bold text-sm text-yellow-700 dark:text-yellow-500">{feedback.rating}</span>
          </div>
        ) : (
          <span className="text-xs text-[#86868b] italic">No rating</span>
        )}
      </TableCell>
      <TableCell className="text-sm text-[#86868b]">
        {formatDistanceToNow(new Date(app.submittedAt), { addSuffix: true })}
      </TableCell>
      <TableCell>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onRowClick?.(app);
          }}
          className="rounded-full hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
        >
          <Eye className="h-4 w-4 mr-1" />
          Details
        </Button>
      </TableCell>
    </TableRow>
  );
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [selectedOfficial, setSelectedOfficial] = useState<UserType | null>(null);
  const [warningMessage, setWarningMessage] = useState("");
  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const [isOfficialDetailOpen, setIsOfficialDetailOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(user?.department || null);

  const { data: deptStats } = useQuery<{
    totalApplications: number;
    assignedCount: number;
    approvedCount: number;
    rejectedCount: number;
    pendingCount: number;
    solvedCount: number;
    unsolvedCount: number;
    warningsSent: number;
  }>({
    queryKey: ["/api/admin/department-stats"],
    enabled: !!user?.department,
    refetchInterval: 5000,
  });

  const { data: applications } = useQuery<Application[]>({
    queryKey: ["/api/applications"],
    refetchInterval: 5000,
  });

  const { data: officials } = useQuery<UserType[]>({
    queryKey: ["/api/users/officials"],
    refetchInterval: 5000,
  });

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    refetchInterval: 30000,
  });

  const { data: departmentRating } = useQuery<{ averageRating: number; totalRatings: number; officialCount: number }>({
    queryKey: ["/api/admin/department-rating"],
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
  });

  const { data: officialStats } = useQuery<{
    approved: number;
    rejected: number;
    solved: number;
    assigned: number;
    pending: number;
    warningsSent: number;
  }>({
    queryKey: ["/api/officials", selectedOfficial?.id, "stats"],
    enabled: !!selectedOfficial,
  });

  // Get all departments for department list view
  const { data: departments } = useQuery<Array<{ id: string; name: string; description: string | null }>>({
    queryKey: ["/api/departments"],
    refetchInterval: 10000,
  });

  // Get department details when a department is selected
  const { data: departmentDetails } = useQuery<{
    department: string;
    officials: Array<UserType & { solvedCount: number; pendingCount: number; totalCount: number }>;
    stats: {
      totalApplications: number;
      solved: number;
      pending: number;
      approved: number;
      rejected: number;
    };
    applications: {
      solved: Application[];
      pending: Application[];
    };
  }>({
    queryKey: ["/api/admin/department", selectedDepartment],
    enabled: !!selectedDepartment,
    refetchInterval: 5000,
  });

  const handleMarkAsRead = async (id: string) => {
    await apiRequest("POST", `/api/notifications/${id}/read`, {});
    queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
  };

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  const handleSendWarning = async () => {
    if (!selectedOfficial || !warningMessage) return;
    try {
      await apiRequest("POST", "/api/warnings", {
        officialId: selectedOfficial.id,
        message: warningMessage,
      });
      toast({
        title: "Warning Sent",
        description: "The official has been notified.",
      });
      setIsWarningOpen(false);
      setWarningMessage("");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };


  const statusColors: Record<string, string> = {
    "Submitted": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    "Assigned": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    "In Progress": "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
    "Approved": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    "Rejected": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    "Auto-Approved": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#F5F5F7] dark:bg-slate-950 font-['Outfit',sans-serif]">
      {/* Floating Navbar */}
      <nav className="fixed top-6 left-0 right-0 z-50 flex justify-center px-6 pointer-events-none">
        <div className="w-full max-w-7xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm rounded-full px-6 py-3 pointer-events-auto flex justify-between items-center transition-all duration-300">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                A
              </div>
              <div className="hidden md:block">
                <h1 className="text-sm font-bold text-[#1d1d1f] dark:text-white leading-tight">Admin Dashboard</h1>
                <p className="text-[10px] text-[#86868b] font-medium tracking-wide uppercase">
                  {selectedDepartment ? selectedDepartment.split(/[–-]/)[0].trim() : "Select Department"}
                </p>
              </div>
            </div>

            {/* Department Rating Badge */}
            <div className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${departmentRating && departmentRating.averageRating > 0
              ? "bg-yellow-50 border-yellow-100 dark:bg-yellow-900/20 dark:border-yellow-900/30"
              : "bg-slate-50 border-slate-100 dark:bg-slate-800 dark:border-slate-700"
              }`}>
              <Star className={`h-3.5 w-3.5 ${departmentRating && departmentRating.averageRating > 0
                ? "text-yellow-500 fill-yellow-500"
                : "text-slate-400"
                }`} />
              <span className={`text-xs font-bold ${departmentRating && departmentRating.averageRating > 0
                ? "text-yellow-700 dark:text-yellow-500"
                : "text-slate-500"
                }`}>
                {departmentRating ? departmentRating.averageRating.toFixed(1) : "0.0"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <NotificationBell notifications={notifications} onMarkAsRead={handleMarkAsRead} />
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={handleLogout} className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-[#86868b]">
              <LogOut className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="md:hidden rounded-full text-[#1d1d1f] dark:text-white">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-auto pt-28 pb-10 px-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {!selectedDepartment ? (
            /* Department List View */
            <>
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-[#1d1d1f] dark:text-white tracking-tight">
                    Select Department
                  </h1>
                  <p className="text-[#86868b] mt-2 text-lg">
                    Choose a department to view details and manage applications
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {departments?.map((dept) => (
                  <Card
                    key={dept.id}
                    onClick={() => setSelectedDepartment(dept.name)}
                    className="group cursor-pointer border-0 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 bg-gradient-to-br from-white via-slate-50/50 to-slate-100/50 dark:from-slate-900 dark:via-slate-800/50 dark:to-slate-900/50 rounded-[32px] overflow-hidden"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                          <Building2 className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-[#1d1d1f] dark:text-white text-lg">
                            {dept.name.split('–')[0].trim()}
                          </h3>
                          {dept.name.includes('–') && (
                            <p className="text-xs text-[#86868b] mt-1">
                              {dept.name.split('–')[1]?.trim()}
                            </p>
                          )}
                        </div>
                        <ChevronRight className="h-5 w-5 text-[#86868b] group-hover:text-[#0071e3] transition-colors" />
                      </div>
                      {dept.description && (
                        <p className="text-sm text-[#86868b] line-clamp-2">{dept.description}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            /* Department Detail View */
            <>
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedDepartment(null)}
                      className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      ← Back to Departments
                    </Button>
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold text-[#1d1d1f] dark:text-white tracking-tight">
                    {selectedDepartment.split('–')[0].trim()}
                  </h1>
                  <p className="text-[#86868b] mt-2 text-lg">
                    Department Overview & Management
                  </p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                  { title: "Total Applications", value: departmentDetails?.stats.totalApplications || 0, icon: FileText, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
                  { title: "Solved", value: departmentDetails?.stats.solved || 0, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50 dark:bg-green-900/20" },
                  { title: "Pending", value: departmentDetails?.stats.pending || 0, icon: Clock, color: "text-yellow-600", bg: "bg-yellow-50 dark:bg-yellow-900/20" },
                  { title: "Approved", value: departmentDetails?.stats.approved || 0, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
                  { title: "Rejected", value: departmentDetails?.stats.rejected || 0, icon: XCircle, color: "text-red-600", bg: "bg-red-50 dark:bg-red-900/20" },
                ].map((stat, i) => (
                  <div key={i} className="group relative border-0 overflow-hidden bg-gradient-to-br from-white via-slate-50/50 to-slate-100/50 dark:from-slate-900 dark:via-slate-800/50 dark:to-slate-900/50 p-6 rounded-[32px] shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-400/5 to-slate-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative z-10 flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                        <stat.icon className="h-6 w-6" />
                      </div>
                      <span className="text-xs font-bold text-[#86868b] dark:text-slate-400 uppercase tracking-wider">
                        {stat.title}
                      </span>
                    </div>
                    <div className="relative z-10 text-4xl font-bold text-[#1d1d1f] dark:text-white">
                      {stat.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Officials List */}
              <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                  <h2 className="text-xl font-bold text-[#1d1d1f] dark:text-white">Department Officials</h2>
                  <p className="text-sm text-[#86868b]">Click on an official to view details</p>
                </div>

                <div className="p-6">
                  {departmentDetails?.officials.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="h-12 w-12 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
                      <p className="text-[#86868b] font-medium">No officials found in this department</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {departmentDetails?.officials.map(official => (
                        <div
                          key={official.id}
                          onClick={() => {
                            setSelectedOfficial(official);
                            setIsOfficialDetailOpen(true);
                          }}
                          className="group relative border-0 overflow-hidden bg-gradient-to-br from-white via-slate-50/50 to-slate-100/50 dark:from-slate-900 dark:via-slate-800/50 dark:to-slate-900/50 p-6 rounded-[24px] shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer"
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-400/5 to-purple-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <div className="relative z-10">
                            <div className="flex items-center gap-4 mb-4">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                                {official.fullName.charAt(0)}
                              </div>
                              <div className="flex-1">
                                <div className="font-bold text-[#1d1d1f] dark:text-white">{official.fullName}</div>
                                <div className="text-xs text-[#86868b] font-mono">{official.id.slice(0, 8)}...</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 mb-3">
                              <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded-lg">
                                <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                                <span className="font-bold text-sm text-yellow-700 dark:text-yellow-500">{official.rating?.toFixed(1) || "0.0"}</span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-[#86868b]">Total Applications</span>
                                <span className="font-bold text-[#1d1d1f] dark:text-white">{official.totalCount}</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-[#86868b]">Solved</span>
                                <span className="font-semibold text-green-600 dark:text-green-400">{official.solvedCount}</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-[#86868b]">Pending</span>
                                <span className="font-semibold text-orange-600 dark:text-orange-400">{official.pendingCount}</span>
                              </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                              <div className="flex items-center gap-2 text-xs text-[#86868b]">
                                <Eye className="h-3 w-3" />
                                <span>Click to view details</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Solved Applications */}
              <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                  <h2 className="text-xl font-bold text-[#1d1d1f] dark:text-white">Solved Applications</h2>
                  <p className="text-sm text-[#86868b]">{departmentDetails?.applications.solved.length || 0} applications marked as solved</p>
                </div>
                <div className="p-6">
                  {departmentDetails?.applications.solved.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle className="h-10 w-10 text-slate-200 dark:text-slate-800 mx-auto mb-2" />
                      <p className="text-[#86868b]">No solved applications</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tracking ID</TableHead>
                          <TableHead>Citizen</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Submitted</TableHead>
                          <TableHead>Details</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {departmentDetails?.applications.solved.slice(0, 10).map(app => (
                          <ApplicationRowWithCitizen
                            key={app.id}
                            app={app}
                            statusColors={statusColors}
                            officialId={app.officialId || ''}
                            onRowClick={(app) => setSelectedApp(app)}
                          />
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </div>

              {/* Pending Applications */}
              <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                  <h2 className="text-xl font-bold text-[#1d1d1f] dark:text-white">Pending Applications</h2>
                  <p className="text-sm text-[#86868b]">{departmentDetails?.applications.pending.length || 0} applications pending review</p>
                </div>
                <div className="p-6">
                  {departmentDetails?.applications.pending.length === 0 ? (
                    <div className="text-center py-8">
                      <Clock className="h-10 w-10 text-slate-200 dark:text-slate-800 mx-auto mb-2" />
                      <p className="text-[#86868b]">No pending applications</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tracking ID</TableHead>
                          <TableHead>Citizen</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Submitted</TableHead>
                          <TableHead>Details</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {departmentDetails?.applications.pending.slice(0, 10).map(app => (
                          <ApplicationRowWithCitizen
                            key={app.id}
                            app={app}
                            statusColors={statusColors}
                            officialId={app.officialId || ''}
                            onRowClick={(app) => setSelectedApp(app)}
                          />
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </div>
            </>
          )}

        </div>
      </main>

      <ApplicationDetailsDialog
        application={selectedApp}
        open={!!selectedApp}
        onClose={() => setSelectedApp(null)}
        canUpdateStatus={false}
      />

      {/* Official Detail Dialog */}
      <Dialog open={isOfficialDetailOpen} onOpenChange={setIsOfficialDetailOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-[#F5F5F7] dark:bg-slate-950 rounded-[32px] border-0 shadow-2xl p-0 font-['Outfit',sans-serif]">
          <div className="bg-white dark:bg-slate-900 p-6 border-b border-slate-100 dark:border-slate-800 sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-blue-500/20">
                {selectedOfficial?.fullName.charAt(0)}
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-[#1d1d1f] dark:text-white">
                  {selectedOfficial?.fullName}
                </DialogTitle>
                <p className="text-[#86868b]">{selectedOfficial?.department?.split(/[–-]/)[0].trim()}</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: "Assigned", value: officialStats?.assigned || 0, color: "text-purple-600", bg: "bg-purple-50" },
                { label: "Approved", value: officialStats?.approved || 0, color: "text-green-600", bg: "bg-green-50" },
                { label: "Rejected", value: officialStats?.rejected || 0, color: "text-red-600", bg: "bg-red-50" },
                { label: "Solved", value: officialStats?.solved || 0, color: "text-blue-600", bg: "bg-blue-50" },
                { label: "Warnings", value: officialStats?.warningsSent || 0, color: "text-orange-600", bg: "bg-orange-50" },
              ].map((stat, i) => (
                <div key={i} className="bg-white dark:bg-slate-900 p-4 rounded-[24px] shadow-sm text-center">
                  <div className="text-2xl font-bold text-[#1d1d1f] dark:text-white mb-1">{stat.value}</div>
                  <div className={`text-xs font-bold uppercase tracking-wider ${stat.color}`}>{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Applications Table */}
            <div className="bg-white dark:bg-slate-900 rounded-[24px] shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-[#1d1d1f] dark:text-white">Recent Applications</h3>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-slate-100 dark:border-slate-800">
                    <TableHead className="text-xs font-bold uppercase text-[#86868b]">ID</TableHead>
                    <TableHead className="text-xs font-bold uppercase text-[#86868b]">Citizen</TableHead>
                    <TableHead className="text-xs font-bold uppercase text-[#86868b]">Status</TableHead>
                    <TableHead className="text-xs font-bold uppercase text-[#86868b]">Rating</TableHead>
                    <TableHead className="text-xs font-bold uppercase text-[#86868b]">Time</TableHead>
                    <TableHead className="text-xs font-bold uppercase text-[#86868b] text-right">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications?.filter(app => app.officialId === selectedOfficial?.id)
                    .slice(0, 5)
                    .map(app => (
                      <ApplicationRowWithCitizen
                        key={app.id}
                        app={app}
                        statusColors={statusColors}
                        officialId={selectedOfficial?.id || ''}
                        onRowClick={(app) => setSelectedApp(app)}
                      />
                    ))}
                </TableBody>
              </Table>
            </div>

            {/* Warning Section */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[24px] shadow-sm border-2 border-red-50 dark:border-red-900/20">
              <h3 className="font-bold text-[#1d1d1f] dark:text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Send Warning
              </h3>
              <div className="space-y-4">
                <Textarea
                  placeholder="Enter warning message..."
                  value={warningMessage}
                  onChange={(e) => setWarningMessage(e.target.value)}
                  className="bg-[#F5F5F7] dark:bg-slate-800 border-0 rounded-xl resize-none"
                  rows={3}
                />
                <Button
                  onClick={handleSendWarning}
                  disabled={!warningMessage.trim()}
                  className="w-full rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold h-12"
                >
                  Send Warning
                </Button>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 sticky bottom-0 z-10">
            <Button variant="ghost" onClick={() => setIsOfficialDetailOpen(false)} className="w-full rounded-full h-12 text-[#86868b]">
              Close Details
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick Warning Dialog */}
      <Dialog open={isWarningOpen} onOpenChange={setIsWarningOpen}>
        <DialogContent className="bg-white dark:bg-slate-900 rounded-[32px] border-0 shadow-2xl p-6 font-['Outfit',sans-serif]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#1d1d1f] dark:text-white flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              Send Warning
            </DialogTitle>
            <DialogDescription className="text-[#86868b]">
              Send a warning to {selectedOfficial?.fullName}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Enter warning message..."
              value={warningMessage}
              onChange={(e) => setWarningMessage(e.target.value)}
              className="bg-[#F5F5F7] dark:bg-slate-800 border-0 rounded-xl resize-none min-h-[120px]"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setIsWarningOpen(false)} className="rounded-full">Cancel</Button>
            <Button
              onClick={handleSendWarning}
              disabled={!warningMessage.trim()}
              className="bg-red-600 hover:bg-red-700 text-white rounded-full px-6"
            >
              Send Warning
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
