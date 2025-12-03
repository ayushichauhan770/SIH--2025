import { useState, useEffect } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText, Users, AlertTriangle, LogOut, Eye, Star, Send, Building2, CheckCircle, XCircle, UserCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Application, Notification, User as UserType } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { ApplicationDetailsDialog } from "@/components/application-details-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

// Helper component to fetch and display citizen info for each application row
function ApplicationRowWithCitizen({
  app,
  statusColors,
  officialId
}: {
  app: Application;
  statusColors: Record<string, string>;
  officialId: string;
}) {
  // Fetch citizen data
  const { data: citizen } = useQuery<{ fullName: string } | null>({
    queryKey: ["/api/users", app.citizenId],
    enabled: !!app.citizenId,
  });

  // Fetch feedback/rating for this application and official
  const { data: feedback } = useQuery<{ rating: number; comment: string } | null>({
    queryKey: ["/api/applications", app.id, "feedback"],
    enabled: !!app.id && ["Approved", "Auto-Approved", "Rejected"].includes(app.status),
  });

  return (
    <TableRow>
      <TableCell className="font-mono text-sm">{app.trackingId}</TableCell>
      <TableCell className="font-medium">{citizen?.fullName || "Loading..."}</TableCell>
      <TableCell>
        <Badge className={statusColors[app.status]}>{app.status}</Badge>
      </TableCell>
      <TableCell>
        {feedback?.rating ? (
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            <span className="font-semibold">{feedback.rating}/5</span>
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">No rating yet</span>
        )}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {formatDistanceToNow(new Date(app.submittedAt), { addSuffix: true })}
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
  const [officialSearch, setOfficialSearch] = useState("");

  // Fetch department-specific stats
  const { data: deptStats } = useQuery<{
    totalApplications: number;
    assignedCount: number;
    approvedCount: number;
    rejectedCount: number;
    pendingCount: number;
  }>({
    queryKey: ["/api/admin/department-stats"],
    enabled: !!user?.department,
    refetchInterval: 5000,
  });

  const { data: applications, isLoading: appsLoading } = useQuery<Application[]>({
    queryKey: ["/api/applications"],
    refetchInterval: 5000,
  });

  const { data: officials } = useQuery<UserType[]>({
    queryKey: ["/api/users/officials"],
    refetchInterval: 5000, // Refetch every 5 seconds for instant updates when ratings change
  });

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    refetchInterval: 30000,
  });

  // Fetch department rating
  const { data: departmentRating, isLoading: ratingLoading, error: ratingError, refetch: refetchRating } = useQuery<{ averageRating: number; totalRatings: number; officialCount: number }>({
    queryKey: ["/api/admin/department-rating"],
    refetchInterval: 10000, // Refetch every 10 seconds
    refetchOnWindowFocus: true,
  });

  // Debug logging
  useEffect(() => {
    console.log("[Admin Dashboard] User:", user?.fullName, "Department:", user?.department);
    console.log("[Admin Dashboard] Rating data:", departmentRating);
    console.log("[Admin Dashboard] Loading:", ratingLoading, "Error:", ratingError);
  }, [user, departmentRating, ratingLoading, ratingError]);

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

  // Filter applications by admin's department
  const deptApplications = applications?.filter(app =>
    app.department === user?.department
  ) || [];

  // Filter officials by admin's department and search term, then sort by rating
  const sortedOfficials = (officials || [])
    .filter(o => {
      // First filter by department - normalize department names (handle "Health – Ministry..." vs "Health")
      if (!o.department || !user?.department) return false;
      const officialDept = o.department.split(/[–-]/)[0].trim();
      const adminDept = user.department.split(/[–-]/)[0].trim();
      const matchesDepartment = officialDept === adminDept;

      // Then filter by search term (if provided)
      const matchesSearch = !officialSearch ||
        o.fullName.toLowerCase().includes(officialSearch.toLowerCase()) ||
        (o.email && o.email.toLowerCase().includes(officialSearch.toLowerCase()));

      return matchesDepartment && matchesSearch;
    })
    .sort((a, b) => (a.rating || 0) - (b.rating || 0));

  // Debug logging
  console.log("Admin department:", user?.department);
  console.log("Total officials fetched:", officials?.length || 0);
  console.log("Dept officials after filter:", sortedOfficials.length);
  console.log("Officials data:", officials);

  const statusColors: Record<string, string> = {
    "Submitted": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    "Assigned": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    "In Progress": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    "Approved": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    "Rejected": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    "Auto-Approved": "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  };

  return (
    <div className="flex flex-col h-screen w-full bg-gradient-to-br from-blue-50 via-slate-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <header className="flex items-center justify-between p-4 border-b bg-white/95 dark:bg-slate-950/95 border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <h2 className="text-xl font-bold">Admin Dashboard</h2>
            <p className="text-sm text-muted-foreground">Welcome, {user?.fullName}</p>
            <div className={`flex items-center gap-1 px-2 py-1 rounded-md mt-1 w-fit ${
              departmentRating && departmentRating.averageRating > 0 
                ? "bg-yellow-50 dark:bg-yellow-950/30" 
                : "bg-gray-50 dark:bg-gray-950/30"
            }`}>
              <Star className={`h-4 w-4 ${
                departmentRating && departmentRating.averageRating > 0 
                  ? "text-yellow-500 fill-yellow-500" 
                  : "text-gray-400"
              }`} />
              <span className={`text-sm font-semibold ${
                departmentRating && departmentRating.averageRating > 0 
                  ? "text-yellow-700 dark:text-yellow-400" 
                  : "text-gray-500 dark:text-gray-400"
              }`}>
                {departmentRating ? departmentRating.averageRating.toFixed(1) : "0.0"}/5.0
              </span>
              <span className="text-xs text-muted-foreground ml-1">
                ({departmentRating ? departmentRating.totalRatings : 0} ratings)
              </span>
            </div>
          </div>
          {user?.department && (
            <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950 ml-2">
              <Building2 className="h-3 w-3 mr-1" />
              {user.department.split(/[–-]/)[0].trim()}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell notifications={notifications} onMarkAsRead={handleMarkAsRead} />
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-6 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold font-heading bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
            Department Overview
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Monitoring and management for {user?.department}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatsCard
            title="Total Applications"
            value={deptStats?.totalApplications || 0}
            icon={FileText}
          />
          <StatsCard
            title="Assigned"
            value={deptStats?.assignedCount || 0}
            icon={UserCheck}
          />
          <StatsCard
            title="Approved"
            value={deptStats?.approvedCount || 0}
            icon={CheckCircle}
          />
          <StatsCard
            title="Rejected"
            value={deptStats?.rejectedCount || 0}
            icon={XCircle}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Department Officials</CardTitle>
            <CardDescription>Sorted by rating (lowest to highest)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Label>Search</Label>
              <Input
                placeholder="Search by name or email..."
                value={officialSearch}
                onChange={(e) => setOfficialSearch(e.target.value)}
              />
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Official ID</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Total Handled</TableHead>
                  <TableHead>Solved</TableHead>
                  <TableHead>Not Solved</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedOfficials.map(official => {
                  const hasPendingAlert = (applications?.filter(app =>
                    app.officialId === official.id &&
                    ["Assigned", "In Progress"].includes(app.status)
                  ).length || 0) >= 3;

                  return (
                    <TableRow key={official.id} className={hasPendingAlert ? "bg-red-50 dark:bg-red-950/20" : ""}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedOfficial(official);
                              setIsOfficialDetailOpen(true);
                            }}
                            className="font-medium hover:underline text-blue-600 dark:text-blue-400 cursor-pointer"
                          >
                            {official.fullName}
                          </button>
                          {hasPendingAlert && (
                            <Badge variant="destructive" className="text-xs">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              3+ Pending
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {official.id.slice(0, 8)}...
                      </TableCell>
                      <TableCell className="text-sm">{official.email || "N/A"}</TableCell>
                      <TableCell className="text-sm">{official.phone || "N/A"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          {official.rating?.toFixed(1) || "0.0"}
                        </div>
                      </TableCell>
                      <TableCell>
                        {applications?.filter(app => app.officialId === official.id).length || 0}
                      </TableCell>
                      <TableCell>
                        {applications?.filter(app =>
                          app.officialId === official.id &&
                          app.isSolved === true
                        ).length || 0}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className={`font-semibold ${(applications?.filter(app =>
                            app.officialId === official.id &&
                            app.isSolved === false
                          ).length || 0) > 0
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-gray-600 dark:text-gray-400'
                            }`}>
                            {applications?.filter(app =>
                              app.officialId === official.id &&
                              app.isSolved === false
                            ).length || 0}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedOfficial(official);
                              setIsOfficialDetailOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" /> Details
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedOfficial(official);
                              setIsWarningOpen(true);
                            }}
                          >
                            <AlertTriangle className="h-4 w-4 mr-1 text-red-500" />
                            Warning
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {sortedOfficials.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <Users className="h-12 w-12 text-muted-foreground opacity-50" />
                        <div>
                          <p className="text-lg font-semibold text-muted-foreground">No Officials Found</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {officials && officials.length > 0
                              ? `No officials found in "${user?.department?.split('–')[0].trim()}" department`
                              : "No officials have been registered yet"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            Total officials in system: {officials?.length || 0}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )
                }
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main >

      <ApplicationDetailsDialog
        application={selectedApp}
        open={!!selectedApp}
        onClose={() => setSelectedApp(null)}
        canUpdateStatus={false}
      />

      {/* Official Detail Dialog */}
      <Dialog open={isOfficialDetailOpen} onOpenChange={setIsOfficialDetailOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Official Performance Details</DialogTitle>
            <DialogDescription>Complete overview of {selectedOfficial?.fullName}'s performance</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Auto-Alert Banner */}
            {officialStats && officialStats.pending >= 3 && (
              <Card className="border-2 border-red-500 bg-red-50 dark:bg-red-950/30">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
                    <div>
                      <p className="font-bold text-red-600 dark:text-red-400 text-lg">
                        ⚠️ This official has more than 3 pending approvals. Action required.
                      </p>
                      <p className="text-red-600 dark:text-red-400">
                        {officialStats.pending} applications are waiting for approval.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-6">
                  {/* Profile Avatar */}
                  <div className="flex-shrink-0">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
                      {selectedOfficial?.fullName.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  {/* Details */}
                  <div className="grid grid-cols-2 gap-4 flex-1">
                    <div>
                      <Label className="text-muted-foreground">Name</Label>
                      <p className="text-lg font-semibold">{selectedOfficial?.fullName}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Department</Label>
                      <p className="text-lg font-semibold">{selectedOfficial?.department?.split(/[–-]/)[0].trim()}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Email</Label>
                      <p className="text-lg font-semibold">{selectedOfficial?.email || "N/A"}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Phone</Label>
                      <p className="text-lg font-semibold">{selectedOfficial?.phone || "N/A"}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Summary */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Performance Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <Card className="bg-purple-50 dark:bg-purple-950/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Total Assigned</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                      {officialStats?.assigned || 0}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-green-50 dark:bg-green-950/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Approved</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {officialStats?.approved || 0}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-red-50 dark:bg-red-950/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Rejected</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                      {officialStats?.rejected || 0}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-blue-50 dark:bg-blue-950/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Solved</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {officialStats?.solved || 0}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-yellow-50 dark:bg-yellow-950/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Avg Rating</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-1">
                      <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                      <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                        {selectedOfficial?.rating?.toFixed(1) || "0.0"}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-orange-50 dark:bg-orange-950/20 border-orange-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Warnings Sent</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-orange-600" />
                      <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                        {officialStats?.warningsSent || 0}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Applications Handled */}
            <Card>
              <CardHeader>
                <CardTitle>Applications Handled</CardTitle>
                <CardDescription>All applications assigned to this official with citizen feedback</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Application ID</TableHead>
                      <TableHead>Citizen Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Citizen Rating</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {applications?.filter(app => app.officialId === selectedOfficial?.id)
                      .slice(0, 10)
                      .map(app => {
                        const statusColors: Record<string, string> = {
                          "Submitted": "bg-blue-100 text-blue-800",
                          "Assigned": "bg-purple-100 text-purple-800",
                          "In Progress": "bg-yellow-100 text-yellow-800",
                          "Approved": "bg-green-100 text-green-800",
                          "Rejected": "bg-red-100 text-red-800",
                          "Auto-Approved": "bg-emerald-100 text-emerald-800",
                        };

                        return (
                          <ApplicationRowWithCitizen
                            key={app.id}
                            app={app}
                            statusColors={statusColors}
                            officialId={selectedOfficial?.id || ''}
                          />
                        );
                      })}
                    {(!applications || applications.filter(app => app.officialId === selectedOfficial?.id).length === 0) && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No applications found for this official
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Warning Control */}
            <Card className="border-2 border-orange-200 dark:border-orange-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                  <AlertTriangle className="h-5 w-5" />
                  Send Warning
                </CardTitle>
                <CardDescription>Send a warning notification to this official</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label>Warning Message</Label>
                    <Textarea
                      placeholder="Enter warning message for the official..."
                      value={warningMessage}
                      onChange={(e) => setWarningMessage(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <Button
                    onClick={handleSendWarning}
                    className="bg-red-600 hover:bg-red-700 w-full"
                    disabled={!warningMessage.trim()}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send Warning
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsOfficialDetailOpen(false);
              setWarningMessage("");
            }}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Warning Dialog */}
      <Dialog open={isWarningOpen} onOpenChange={setIsWarningOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Warning</DialogTitle>
            <DialogDescription>
              Send a warning notification to {selectedOfficial?.fullName}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Warning Message</Label>
              <Textarea
                placeholder="Enter warning message..."
                value={warningMessage}
                onChange={(e) => setWarningMessage(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsWarningOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={handleSendWarning}
              disabled={!warningMessage.trim()}
            >
              <Send className="h-4 w-4 mr-2" />
              Send Warning
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Warning Dialog functionality now integrated into Official Detail Dialog */}
    </div >
  );
}
