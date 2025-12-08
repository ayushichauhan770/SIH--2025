import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApplicationCard } from "@/components/application-card";
import { NotificationBell } from "@/components/notification-bell";
import { ThemeToggle } from "@/components/theme-toggle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { FileText, CheckCircle, Clock, TrendingUp, LogOut, AlertTriangle, Search, Star, Shield, Menu, Bell, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
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
   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

   const { data: applications, isLoading } = useQuery<Application[]>({
      queryKey: ["/api/applications"],
      refetchInterval: 500, // Refresh every 500ms for immediate visibility
      refetchOnWindowFocus: true, // Refetch when user switches back to tab
      refetchOnMount: true, // Always refetch when component mounts
      staleTime: 0, // Always consider data stale to ensure fresh data
      cacheTime: 0, // Don't cache to ensure latest data
   });

   const { data: notifications = [] } = useQuery<Notification[]>({
      queryKey: ["/api/notifications"],
   });

   const { data: ratingStats } = useQuery<{ averageRating: number; totalRatings: number }>({
      queryKey: ["/api/officials", user?.id, "rating"],
      enabled: !!user?.id,
      refetchInterval: 5000,
   });

   const [activeTab, setActiveTab] = useState("my-apps");

   const handleMarkAsRead = async (id: string) => {
      await apiRequest("POST", `/api/notifications/${id}/read`, {});
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
   };

   const [isWarningDialogOpen, setIsWarningDialogOpen] = useState(false);

   const { data: warnings = [], error: warningError } = useQuery<Warning[]>({
      queryKey: ["/api/warnings"],
      refetchInterval: 500,
   });

   useEffect(() => {
      if (warningError) {
         console.error("Failed to fetch warnings:", warningError);
      }
   }, [warningError]);

   const unreadWarnings = warnings.filter(w => !w.read);

   useEffect(() => {
      if (unreadWarnings.length > 0) {
         if (!isWarningDialogOpen) {
            setIsWarningDialogOpen(true);
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


   // Sort applications by priority (high > medium > low), then by submission date
   const priorityOrder = { high: 3, medium: 2, low: 1 };
   const sortedApplications = applications?.sort((a, b) => {
      const priorityDiff = (priorityOrder[(b.priority || "low").toLowerCase() as keyof typeof priorityOrder] || 0) - (priorityOrder[(a.priority || "low").toLowerCase() as keyof typeof priorityOrder] || 0);
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
   }) || [];

   // STRICT FILTERING: Only show applications assigned to THIS specific official
   // Each application should only be visible to ONE official (the one it's assigned to)
   const myApps = sortedApplications.filter(app => {
      const matches = app.officialId !== null && app.officialId === user?.id;
      if (!matches && app.officialId) {
         console.warn(`[Official Dashboard] Application ${app.trackingId} assigned to ${app.officialId}, not ${user?.id} - filtering out`);
      }
      return matches;
   });

   // Track previous count to detect new applications
   const [prevAppCount, setPrevAppCount] = useState(0);

   // Debug logging and new application detection
   useEffect(() => {
      if (applications && user) {
         const currentCount = myApps.length;
         console.log(`[Official Dashboard] Total applications received: ${applications.length}`);
         console.log(`[Official Dashboard] Applications assigned to ${user.fullName} (${user.id}): ${currentCount}`);

         // Detect new applications
         if (currentCount > prevAppCount && prevAppCount > 0) {
            const newApps = myApps.slice(0, currentCount - prevAppCount);
            newApps.forEach(app => {
               toast({
                  title: "New Application Assigned!",
                  description: `Application ${app.trackingId} has been automatically assigned to you.`,
               });
               console.log(`[Official Dashboard] 🎉 New application detected: ${app.trackingId}`);
            });
         }

         setPrevAppCount(currentCount);

         if (myApps.length > 0) {
            console.log(`[Official Dashboard] Latest application: ${myApps[0]?.trackingId} (Status: ${myApps[0]?.status}, Official ID: ${myApps[0]?.officialId})`);
         }
      }
   }, [applications, myApps.length, user?.id, prevAppCount]);
   const pendingApps = myApps.filter(app => app.status === "Assigned" || app.status === "In Progress");
   const completedToday = myApps.filter(app =>
      app.approvedAt && new Date(app.approvedAt).toDateString() === new Date().toDateString()
   ).length;

   const filteredMyApps = myApps.filter(app => {
      if (searchQuery && !app.trackingId.toLowerCase().includes(searchQuery.toLowerCase())) {
         return false;
      }
      if (filterStatus === "all") return true;
      if (filterStatus === "assigned") return true;
      if (filterStatus === "pending") return app.status === "Assigned" || app.status === "In Progress";
      if (filterStatus === "completed") return ["Approved", "Rejected", "Auto-Approved"].includes(app.status);
      return true;
   });


   useEffect(() => {
      if (filterStatus !== "all") {
         const element = document.getElementById("official-tabs");
         if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "start" });
            setActiveTab("my-apps");
         }
      }
   }, [filterStatus]);

   return (
      <div className="min-h-screen bg-[#F5F5F7] dark:bg-slate-950 font-['Outfit',sans-serif] pb-20">
         {/* Floating Navbar */}
         <nav className="fixed top-6 left-0 right-0 z-50 flex justify-center px-6 pointer-events-none">
            <div className="w-full max-w-7xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm rounded-full px-6 py-3 pointer-events-auto flex justify-between items-center transition-all duration-300">
               <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-full bg-[#0071e3] shadow-lg shadow-blue-500/20">
                     <Shield className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xl font-bold tracking-tight text-[#1d1d1f] dark:text-white">Official Portal</span>
               </div>

               <div className="hidden md:flex items-center gap-6">
                  <div className="flex items-center gap-4 text-sm font-medium text-[#86868b]">
                     {user?.department && (
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[#1d1d1f] dark:text-white">
                           <Shield size={14} className="text-[#0071e3]" />
                           {user.department}
                        </span>
                     )}
                     <span className="text-[#1d1d1f] dark:text-white">
                        {user?.fullName}
                     </span>
                  </div>

                  <div className="h-6 w-px bg-slate-200 dark:bg-slate-800"></div>

                  <div className="flex items-center gap-3">
                     <Button
                        variant="ghost"
                        size="icon"
                        className={`rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 ${unreadWarnings.length > 0 ? "text-red-500 animate-pulse" : "text-[#1d1d1f] dark:text-white"}`}
                        onClick={() => unreadWarnings.length > 0 ? setIsWarningDialogOpen(true) : toast({ description: "No active warnings" })}
                     >
                        <AlertTriangle className="h-5 w-5" />
                     </Button>
                     <NotificationBell notifications={notifications} onMarkAsRead={handleMarkAsRead} />
                     <ThemeToggle />
                     <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600"
                        onClick={() => {
                           logout();
                           window.location.href = "/";
                        }}
                     >
                        <LogOut className="h-5 w-5" />
                     </Button>
                  </div>
               </div>

               {/* Mobile Menu Button */}
               <button className="md:hidden text-[#1d1d1f] dark:text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                  <Menu className="h-6 w-6" />
               </button>
            </div>
         </nav>

         {/* Mobile Menu Overlay */}
         {mobileMenuOpen && (
            <div className="fixed inset-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl pt-24 px-6 md:hidden animate-in slide-in-from-top-10">
               <div className="flex flex-col gap-6">
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800">
                     <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-[#0071e3] font-bold text-lg">
                        {user?.fullName?.charAt(0)}
                     </div>
                     <div>
                        <h3 className="font-bold text-[#1d1d1f] dark:text-white">{user?.fullName}</h3>
                        <p className="text-sm text-[#86868b]">{user?.department}</p>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <Button variant="outline" className="h-12 rounded-xl justify-start gap-2" onClick={() => setIsWarningDialogOpen(true)}>
                        <AlertTriangle size={18} className={unreadWarnings.length > 0 ? "text-red-500" : ""} /> Warnings
                     </Button>
                     <Button variant="outline" className="h-12 rounded-xl justify-start gap-2 text-red-500 hover:text-red-600" onClick={() => logout()}>
                        <LogOut size={18} /> Logout
                     </Button>
                  </div>
               </div>
            </div>
         )}

         {/* Main Content */}
         <main className="pt-32 px-6 max-w-7xl mx-auto space-y-8">

            {/* Welcome Section */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
               <div>
                  <h1 className="text-4xl font-bold text-[#1d1d1f] dark:text-white mb-2">Dashboard</h1>
                  <p className="text-[#86868b] text-lg">Welcome back, {user?.fullName}. Here's your daily overview.</p>
               </div>

               <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-1.5 rounded-full shadow-sm border border-slate-200 dark:border-slate-800">
                  <div className="relative">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#86868b]" />
                     <Input
                        type="search"
                        placeholder="Search applications..."
                        className="pl-9 h-10 w-64 md:w-80 rounded-full border-none bg-transparent focus-visible:ring-0 placeholder:text-[#86868b]"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                     />
                  </div>
               </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
               <div onClick={() => setFilterStatus("assigned")} className="cursor-pointer group">
                  <Card className={`group relative border-0 overflow-hidden bg-gradient-to-br from-blue-50 via-cyan-50 to-indigo-50 dark:from-blue-950/40 dark:via-cyan-950/30 dark:to-indigo-950/40 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 rounded-[32px] ${filterStatus === 'assigned' ? 'ring-2 ring-[#0071e3] shadow-md' : ''}`}>
                     <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-cyan-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                     <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
                     <CardContent className="relative z-10 p-6 flex flex-col justify-between h-40">
                        <div className="flex justify-between items-start">
                           <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 via-cyan-500 to-indigo-500 text-white shadow-lg shadow-blue-500/30">
                              <FileText size={24} />
                           </div>
                           <span className="text-xs font-bold px-2 py-1 rounded-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm text-[#86868b]">Total</span>
                        </div>
                        <div>
                           <h3 className="text-3xl font-bold text-[#1d1d1f] dark:text-white mb-1">{myApps.length}</h3>
                           <p className="text-sm text-[#86868b] dark:text-slate-400 font-medium">Assigned to Me</p>
                        </div>
                     </CardContent>
                  </Card>
               </div>

               <div onClick={() => setFilterStatus("pending")} className="cursor-pointer group">
                  <Card className={`group relative border-0 overflow-hidden bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-orange-950/40 dark:via-amber-950/30 dark:to-yellow-950/40 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 rounded-[32px] ${filterStatus === 'pending' ? 'ring-2 ring-orange-500 shadow-md' : ''}`}>
                     <div className="absolute inset-0 bg-gradient-to-br from-orange-400/10 to-amber-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                     <div className="absolute top-0 right-0 w-32 h-32 bg-orange-400/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
                     <CardContent className="relative z-10 p-6 flex flex-col justify-between h-40">
                        <div className="flex justify-between items-start">
                           <div className="p-3 rounded-2xl bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500 text-white shadow-lg shadow-orange-500/30">
                              <Clock size={24} />
                           </div>
                           <span className="text-xs font-bold px-2 py-1 rounded-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm text-orange-600 dark:text-orange-400">Action Needed</span>
                        </div>
                        <div>
                           <h3 className="text-3xl font-bold text-[#1d1d1f] dark:text-white mb-1">{pendingApps.length}</h3>
                           <p className="text-sm text-[#86868b] dark:text-slate-400 font-medium">Pending Review</p>
                        </div>
                     </CardContent>
                  </Card>
               </div>

               <div onClick={() => setFilterStatus("completed")} className="cursor-pointer group">
                  <Card className={`group relative border-0 overflow-hidden bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-950/40 dark:via-emerald-950/30 dark:to-teal-950/40 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 rounded-[32px] ${filterStatus === 'completed' ? 'ring-2 ring-green-500 shadow-md' : ''}`}>
                     <div className="absolute inset-0 bg-gradient-to-br from-green-400/10 to-emerald-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                     <div className="absolute top-0 right-0 w-32 h-32 bg-green-400/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
                     <CardContent className="relative z-10 p-6 flex flex-col justify-between h-40">
                        <div className="flex justify-between items-start">
                           <div className="p-3 rounded-2xl bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 text-white shadow-lg shadow-green-500/30">
                              <CheckCircle size={24} />
                           </div>
                           <span className="text-xs font-bold px-2 py-1 rounded-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm text-green-600 dark:text-green-400">+12%</span>
                        </div>
                        <div>
                           <h3 className="text-3xl font-bold text-[#1d1d1f] dark:text-white mb-1">{completedToday}</h3>
                           <p className="text-sm text-[#86868b] dark:text-slate-400 font-medium">Completed Today</p>
                        </div>
                     </CardContent>
                  </Card>
               </div>

               <div className="group">
                  <Card className="group relative border-0 overflow-hidden bg-gradient-to-br from-purple-50 via-violet-50 to-fuchsia-50 dark:from-purple-950/40 dark:via-violet-950/30 dark:to-fuchsia-950/40 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 rounded-[32px]">
                     <div className="absolute inset-0 bg-gradient-to-br from-purple-400/10 to-violet-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                     <div className="absolute top-0 right-0 w-32 h-32 bg-purple-400/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
                     <CardContent className="relative z-10 p-6 flex flex-col justify-between h-40">
                        <div className="flex justify-between items-start">
                           <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500 via-violet-500 to-fuchsia-500 text-white shadow-lg shadow-purple-500/30">
                              <TrendingUp size={24} />
                           </div>
                           {ratingStats && (
                              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm text-yellow-600 dark:text-yellow-400 text-xs font-bold">
                                 <Star size={10} fill="currentColor" /> {ratingStats.averageRating.toFixed(1)}
                              </div>
                           )}
                        </div>
                        <div>
                           <h3 className="text-3xl font-bold text-[#1d1d1f] dark:text-white mb-1">30 Days</h3>
                           <p className="text-sm text-[#86868b] dark:text-slate-400 font-medium">Avg. Processing Time</p>
                        </div>
                     </CardContent>
                  </Card>
               </div>

               <div onClick={() => setIsWarningDialogOpen(true)} className="cursor-pointer group">
                  <Card className={`group relative border-0 overflow-hidden bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 dark:from-red-950/40 dark:via-rose-950/30 dark:to-pink-950/40 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 rounded-[32px] ${unreadWarnings.length > 0 ? 'ring-2 ring-red-500 shadow-md animate-pulse' : ''}`}>
                     <div className="absolute inset-0 bg-gradient-to-br from-red-400/10 to-rose-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                     <div className="absolute top-0 right-0 w-32 h-32 bg-red-400/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
                     <CardContent className="relative z-10 p-6 flex flex-col justify-between h-40">
                        <div className="flex justify-between items-start">
                           <div className="p-3 rounded-2xl bg-gradient-to-br from-red-500 via-rose-500 to-pink-500 text-white shadow-lg shadow-red-500/30">
                              <AlertTriangle size={24} />
                           </div>
                           {unreadWarnings.length > 0 && (
                              <span className="text-xs font-bold px-2 py-1 rounded-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm text-red-600 dark:text-red-400">New</span>
                           )}
                        </div>
                        <div>
                           <h3 className="text-3xl font-bold text-[#1d1d1f] dark:text-white mb-1">{warnings.length}</h3>
                           <p className="text-sm text-[#86868b] dark:text-slate-400 font-medium">Warnings Received</p>
                        </div>
                     </CardContent>
                  </Card>
               </div>
            </div>

            {/* Tabs & List */}
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200" id="official-tabs">
               <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <div className="flex justify-center mb-8">
                     <TabsList className="bg-white dark:bg-slate-900 p-1.5 rounded-full border border-slate-200 dark:border-slate-800 shadow-sm h-auto">
                        <TabsTrigger
                           value="my-apps"
                           className="rounded-full px-6 py-2.5 text-sm font-medium data-[state=active]:bg-[#1d1d1f] data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-[#1d1d1f] transition-all"
                        >
                           My Applications ({filteredMyApps.length})
                        </TabsTrigger>
                     </TabsList>
                  </div>

                  <TabsContent value="my-apps" className="space-y-6">
                     {filteredMyApps.length === 0 ? (
                        <div className="text-center py-20 bg-gradient-to-br from-blue-50 via-indigo-50/50 to-purple-50 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-purple-950/40 rounded-[32px] border border-blue-200/50 dark:border-blue-900/30 shadow-sm">
                           <div className="inline-flex p-4 rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 text-white shadow-lg shadow-blue-500/30 mb-4">
                              <FileText className="h-8 w-8" />
                           </div>
                           <h3 className="text-xl font-bold text-[#1d1d1f] dark:text-white mb-2">No Applications Found</h3>
                           <p className="text-[#86868b] dark:text-slate-400">
                              {filterStatus === "all" && !searchQuery ? "You haven't been assigned any applications yet." : "Try adjusting your filters or search query."}
                           </p>
                        </div>
                     ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           {filteredMyApps.map((app, index) => {
                              const colorVariants = [
                                 "from-blue-50 via-cyan-50 to-teal-50 dark:from-blue-950/30 dark:via-cyan-950/30 dark:to-teal-950/30",
                                 "from-purple-50 via-pink-50 to-rose-50 dark:from-purple-950/30 dark:via-pink-950/30 dark:to-rose-950/30",
                                 "from-orange-50 via-amber-50 to-yellow-50 dark:from-orange-950/30 dark:via-amber-950/30 dark:to-yellow-950/30",
                                 "from-green-50 via-emerald-50 to-lime-50 dark:from-green-950/30 dark:via-emerald-950/30 dark:to-lime-950/30",
                                 "from-indigo-50 via-violet-50 to-purple-50 dark:from-indigo-950/30 dark:via-violet-950/30 dark:to-purple-950/30",
                              ];
                              const bgClass = colorVariants[index % colorVariants.length];
                              return (
                                 <ApplicationCard
                                    key={app.id}
                                    application={app}
                                    onViewDetails={() => setSelectedApp(app)}
                                    showActions
                                    onUpdate={() => setSelectedApp(app)}
                                    className={`hover:shadow-lg hover:scale-[1.01] transition-all duration-300 !bg-gradient-to-br ${bgClass}`}
                                 />
                              );
                           })}
                        </div>
                     )}
                  </TabsContent>
               </Tabs>
            </div>
         </main>

         <ApplicationDetailsDialog
            application={selectedApp}
            open={!!selectedApp}
            onClose={() => setSelectedApp(null)}
            canUpdateStatus={selectedApp?.officialId === user?.id}
         />

         {/* Warning Dialog */}
         <Dialog open={isWarningDialogOpen} onOpenChange={setIsWarningDialogOpen}>
            <DialogContent className="sm:max-w-md border-0 bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl p-0 overflow-hidden">
               <div className="bg-red-50 dark:bg-red-900/20 p-8 text-center border-b border-red-100 dark:border-red-900/30">
                  <div className="inline-flex p-4 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 mb-4 animate-bounce">
                     <AlertTriangle size={32} />
                  </div>
                  <DialogTitle className="text-2xl font-bold text-red-600 mb-2">
                     Performance Warning
                  </DialogTitle>
                  <DialogDescription className="text-base font-medium text-[#1d1d1f] dark:text-white">
                     Action Required: Please review the following alerts from administration.
                  </DialogDescription>
               </div>

               <div className="p-6 space-y-4 max-h-[40vh] overflow-y-auto">
                  {unreadWarnings.map(warning => (
                     <div key={warning.id} className="bg-[#F5F5F7] dark:bg-slate-800 p-5 rounded-2xl">
                        <p className="font-bold text-[#1d1d1f] dark:text-white mb-2 text-sm uppercase tracking-wider">Admin Message</p>
                        <p className="text-[#86868b] leading-relaxed mb-3">{warning.message}</p>
                        <p className="text-xs text-[#86868b] font-mono text-right">
                           {new Date(warning.sentAt).toLocaleString()}
                        </p>
                     </div>
                  ))}
               </div>

               <div className="p-6 bg-[#F5F5F7] dark:bg-slate-950">
                  <Button
                     className="w-full h-14 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-lg shadow-lg shadow-red-500/20 transition-all hover:scale-[1.02]"
                     onClick={handleAcknowledgeWarnings}
                  >
                     I Understand & Acknowledge
                  </Button>
               </div>
            </DialogContent>
         </Dialog>

      </div>
   );
}
