import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ApplicationCard } from "@/components/application-card";
import { CaseCard } from "@/components/case-card";
import { NotificationBell } from "@/components/notification-bell";
import { ThemeToggle } from "@/components/theme-toggle";
import { FileText, Plus, Search, LogOut, Shield, Clock, CheckCircle, XCircle, LayoutDashboard, ArrowRight, Gavel } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Application, Notification } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function CitizenDashboard() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  const { data: applications, isLoading: applicationsLoading } = useQuery<Application[]>({
    queryKey: ["/api/applications/my"],
    refetchInterval: 5000,
  });

/*
  const { data: myCases, isLoading: casesLoading } = useQuery<any[]>({
    queryKey: ["/api/judiciary/my-cases"],
  });
*/

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    refetchInterval: 30000,
  });

  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved" | "rejected">("all");

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

  // Filter applications based on selected status
  const filteredApplications = (applications?.filter(app => {
    if (filterStatus === "all") return true;
    if (filterStatus === "pending") return ["Submitted", "Assigned", "In Progress"].includes(app.status);
    if (filterStatus === "approved") return ["Approved", "Auto-Approved"].includes(app.status);
    if (filterStatus === "rejected") return app.status === "Rejected";
    return true;
  }) || []).sort((a, b) => a.trackingId.localeCompare(b.trackingId));

  const stats = {
    total: applications?.length || 0,
    pending: applications?.filter(app => ["Submitted", "Assigned", "In Progress"].includes(app.status)).length || 0,
    approved: applications?.filter(app => ["Approved", "Auto-Approved"].includes(app.status)).length || 0,
    rejected: applications?.filter(app => app.status === "Rejected").length || 0
  };

  // Scroll to applications list when filter changes
  useEffect(() => {
    const element = document.getElementById("applications-list");
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [filterStatus]);

  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-slate-950 font-['Outfit',sans-serif] selection:bg-blue-500/30">
      {/* Wider Floating Header */}
      <header className="fixed top-6 left-0 right-0 z-50 flex justify-center pointer-events-none px-6">
        <div className="w-full max-w-7xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 shadow-sm rounded-full px-6 py-3 pointer-events-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-full bg-[#0071e3] shadow-lg shadow-blue-500/20">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-sm tracking-tight text-[#1d1d1f] dark:text-white">
              ACCOUNTABILITY
            </span>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell notifications={notifications} onMarkAsRead={handleMarkAsRead} />
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />
            <ThemeToggle />
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleLogout} 
              className="h-8 w-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4 text-slate-500" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 pt-32 pb-12 space-y-8 max-w-7xl">
        {/* Welcome Section */}
        <div className="flex flex-col items-center text-center space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-4xl font-bold tracking-tight text-[#1d1d1f] dark:text-white">
            Hello, {user?.fullName?.split(' ')[0]}
          </h1>
          <p className="text-lg text-[#86868b] dark:text-slate-400 font-medium">
            Manage your applications and requests
          </p>
        </div>

        {/* Horizontal Stats Row - Compact */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card
            className={`group relative border-0 overflow-hidden bg-white dark:bg-slate-900 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer rounded-[24px] flex flex-row items-center gap-4 p-4 ${filterStatus === 'all' ? 'ring-2 ring-[#0071e3]' : ''}`}
            onClick={() => setFilterStatus("all")}
          >
            <div className="p-2.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-[#0071e3]">
              <LayoutDashboard className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-[#1d1d1f] dark:text-white leading-none">{stats.total}</div>
              <div className="text-xs font-medium text-[#86868b] mt-1">Total</div>
            </div>
          </Card>

          <Card
            className={`group relative border-0 overflow-hidden bg-white dark:bg-slate-900 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer rounded-[24px] flex flex-row items-center gap-4 p-4 ${filterStatus === 'pending' ? 'ring-2 ring-orange-500' : ''}`}
            onClick={() => setFilterStatus("pending")}
          >
            <div className="p-2.5 rounded-full bg-orange-50 dark:bg-orange-900/20 text-orange-500">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-[#1d1d1f] dark:text-white leading-none">{stats.pending}</div>
              <div className="text-xs font-medium text-[#86868b] mt-1">Pending</div>
            </div>
          </Card>

          <Card
            className={`group relative border-0 overflow-hidden bg-white dark:bg-slate-900 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer rounded-[24px] flex flex-row items-center gap-4 p-4 ${filterStatus === 'approved' ? 'ring-2 ring-green-500' : ''}`}
            onClick={() => setFilterStatus("approved")}
          >
            <div className="p-2.5 rounded-full bg-green-50 dark:bg-green-900/20 text-green-500">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-[#1d1d1f] dark:text-white leading-none">{stats.approved}</div>
              <div className="text-xs font-medium text-[#86868b] mt-1">Approved</div>
            </div>
          </Card>

          <Card
            className={`group relative border-0 overflow-hidden bg-white dark:bg-slate-900 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer rounded-[24px] flex flex-row items-center gap-4 p-4 ${filterStatus === 'rejected' ? 'ring-2 ring-red-500' : ''}`}
            onClick={() => setFilterStatus("rejected")}
          >
            <div className="p-2.5 rounded-full bg-red-50 dark:bg-red-900/20 text-red-500">
              <XCircle className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-[#1d1d1f] dark:text-white leading-none">{stats.rejected}</div>
              <div className="text-xs font-medium text-[#86868b] mt-1">Rejected</div>
            </div>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Quick Actions & Filters */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold tracking-tight text-[#1d1d1f] dark:text-white px-2">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {/* My Cases Summary Card */}
{/*
              {myCases && myCases.length > 0 && (
                <Card 
                  className="bg-gradient-to-br from-[#0071e3] to-[#0077ED] border-0 text-white shadow-lg shadow-blue-500/30 rounded-[32px] overflow-hidden relative cursor-pointer group"
                  onClick={() => setLocation("/judiciary/portal")}
                >
                   <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
                   <CardHeader className="p-6">
                      <div className="flex justify-between items-start">
                         <div className="p-2.5 rounded-2xl bg-white/20 backdrop-blur-md">
                           <Gavel className="h-5 w-5 text-white" />
                         </div>
                         <Badge className="bg-white/20 hover:bg-white/30 text-white border-0">
                           {myCases.length} Active
                         </Badge>
                      </div>
                      <div className="mt-4">
                        <CardTitle className="text-xl font-bold">My Legal Cases</CardTitle>
                        <CardDescription className="text-blue-100 text-xs mt-1 font-medium">
                          Next Hearing: {myCases[0].nextHearingDate ? new Date(myCases[0].nextHearingDate).toLocaleDateString() : "Pending Scheduling"}
                        </CardDescription>
                      </div>
                   </CardHeader>
                </Card>
              )}
*/}
              <Card 
                className="group relative border-0 overflow-hidden bg-[#1d1d1f] dark:bg-white text-white dark:text-[#1d1d1f] shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer rounded-[32px] h-40"
                onClick={() => setLocation("/citizen/submit")} 
                data-testid="card-new-application"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10" />
                <CardHeader className="h-full flex flex-col justify-between p-6">
                  <div className="flex justify-between items-start">
                    <div className="p-2.5 rounded-2xl bg-white/20 backdrop-blur-md">
                      <Plus className="h-5 w-5" />
                    </div>
                    <ArrowRight className="h-5 w-5 opacity-50 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold tracking-tight mb-1">New Application</CardTitle>
                    <CardDescription className="text-white/70 dark:text-black/60 font-medium text-xs">
                      Start a new request
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>

              <Card 
                className="group relative border-0 overflow-hidden bg-white dark:bg-slate-900 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300 cursor-pointer rounded-[32px] h-40"
                onClick={() => setLocation("/citizen/track")} 
                data-testid="card-track-application"
              >
                <CardHeader className="h-full flex flex-col justify-between p-6">
                  <div className="flex justify-between items-start">
                    <div className="p-2.5 rounded-2xl bg-purple-50 dark:bg-purple-900/20 text-purple-600">
                      <Search className="h-5 w-5" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-[#0071e3] transition-colors" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold tracking-tight text-[#1d1d1f] dark:text-white mb-1">Track Status</CardTitle>
                    <CardDescription className="text-[#86868b] font-medium text-xs">
                      Check existing requests
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>

{/*
              <Card 
                className="group relative border-0 overflow-hidden bg-white dark:bg-slate-900 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300 cursor-pointer rounded-[32px] h-40"
                onClick={() => setLocation("/judiciary/file")} 
                data-testid="card-file-case"
              >
                <CardHeader className="h-full flex flex-col justify-between p-6">
                  <div className="flex justify-between items-start">
                    <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600">
                      <Gavel className="h-5 w-5" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-[#0071e3] transition-colors" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold tracking-tight text-[#1d1d1f] dark:text-white mb-1">File Legal Case</CardTitle>
                    <CardDescription className="text-[#86868b] font-medium text-xs">
                      Submit to Judiciary AI
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
*/}

{/*
              <Card 
                className="group relative border-0 overflow-hidden bg-white dark:bg-slate-900 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300 cursor-pointer rounded-[32px] h-40"
                onClick={() => setLocation("/judiciary/portal")} 
                data-testid="card-litigant-portal"
              >
                <CardHeader className="h-full flex flex-col justify-between p-6">
                  <div className="flex justify-between items-start">
                    <div className="p-2.5 rounded-2xl bg-purple-50 dark:bg-purple-900/20 text-purple-600">
                      <Search className="h-5 w-5" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-[#0071e3] transition-colors" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold tracking-tight text-[#1d1d1f] dark:text-white mb-1">Litigant Portal</CardTitle>
                    <CardDescription className="text-[#86868b] font-medium text-xs">
                      Track cases & hearings
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
*/}
            </div>
          </div>

          {/* Right Column: Recent Activity List (Spans 2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-[32px] p-6 shadow-sm min-h-[500px]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 px-2">
                <h2 className="text-xl font-bold tracking-tight text-[#1d1d1f] dark:text-white">
                  Recent Activity
                </h2>
                {/* Filter Tabs */}
                <div className="inline-flex p-1 bg-[#f5f5f7] dark:bg-slate-800 rounded-full">
                  {(["all", "pending", "approved", "rejected"] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => setFilterStatus(status)}
                      className={`
                        px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide transition-all duration-300
                        ${filterStatus === status 
                          ? "bg-white dark:bg-slate-700 text-[#1d1d1f] dark:text-white shadow-sm" 
                          : "text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white"
                        }
                      `}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {applicationsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                      <Skeleton className="h-12 w-12 rounded-xl" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (filteredApplications.length === 0) ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="p-4 rounded-full bg-[#f5f5f7] dark:bg-slate-800 mb-4">
                    <FileText className="h-8 w-8 text-[#86868b]" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#1d1d1f] dark:text-white mb-1">No activity found</h3>
                  <p className="text-[#86868b] max-w-sm">
                    {filterStatus === 'all' 
                      ? "You haven't submitted any applications or cases yet." 
                      : `No activity found with status "${filterStatus}".`
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Show Legal Cases First */}
{/*
                  {myCases && myCases.map(caseItem => (
                    <CaseCard
                      key={caseItem.id}
                      caseItem={caseItem}
                      className="!shadow-none !bg-[#f5f5f7] dark:!bg-slate-800 !rounded-[24px] hover:!bg-slate-200 dark:hover:!bg-slate-700"
                    />
                  ))}
*/}
                  
                  {filteredApplications.map(app => (
                    <ApplicationCard
                      key={app.id}
                      application={app}
                      onViewDetails={() => handleViewDetails(app.id)}
                      className="!shadow-none !bg-[#f5f5f7] dark:!bg-slate-800 !rounded-[24px] hover:!bg-slate-200 dark:hover:!bg-slate-700"
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
