import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Shield, ArrowLeft, Search, Calendar, Clock, FileText, X, CheckCircle, AlertCircle, MessageCircle, BookOpen, ListChecks, HelpCircle, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/contexts/auth-context";
import { useQuery } from "@tanstack/react-query";
import type { Application, ApplicationLocationHistory } from "@shared/schema";

export default function TrackApplication() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [trackingId, setTrackingId] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [foundApplication, setFoundApplication] = useState<Application | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  // Fetch location history for the found application (public access via tracking ID)
  const { data: locationHistory = [] } = useQuery<ApplicationLocationHistory[]>({
    queryKey: ["/api/applications/track", foundApplication?.trackingId, "location-history"],
    enabled: !!foundApplication?.trackingId && showDialog,
    refetchInterval: 3000,
    refetchOnWindowFocus: true,
  });

  const statusColors: Record<string, string> = {
    "Submitted": "bg-gradient-to-r from-blue-500 to-cyan-500 text-white dark:from-blue-600 dark:to-cyan-600 shadow-lg shadow-blue-500/30",
    "Assigned": "bg-gradient-to-r from-purple-500 to-pink-500 text-white dark:from-purple-600 dark:to-pink-600 shadow-lg shadow-purple-500/30",
    "In Progress": "bg-gradient-to-r from-amber-500 to-orange-500 text-white dark:from-amber-600 dark:to-orange-600 shadow-lg shadow-amber-500/30",
    "Approved": "bg-gradient-to-r from-green-500 to-emerald-500 text-white dark:from-green-600 dark:to-emerald-600 shadow-lg shadow-green-500/30",
    "Rejected": "bg-gradient-to-r from-red-500 to-rose-500 text-white dark:from-red-600 dark:to-rose-600 shadow-lg shadow-red-500/30",
    "Auto-Approved": "bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white dark:from-emerald-600 dark:via-teal-600 dark:to-cyan-600 shadow-lg shadow-emerald-500/30",
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!trackingId.trim()) {
      toast({
        title: "Invalid Input",
        description: "Please enter a tracking ID",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);

    try {
      const application = await apiRequest<Application>(
        "GET",
        `/api/applications/track/${trackingId}`,
        undefined
      );

      if (application) {
        // If user is logged in as citizen and owns the application, go to detailed view
        if (user && user.role === "citizen" && application.citizenId === user.id) {
          setLocation(`/citizen/application/${application.id}`);
        } else {
          // Show status dialog for public tracking
          setFoundApplication(application);
          setShowDialog(true);
        }
      }
    } catch (error: any) {
      toast({
        title: "Application Not Found",
        description: "No application found with this tracking ID",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setFoundApplication(null);
    setTrackingId("");
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-slate-950 font-['Outfit',sans-serif] selection:bg-blue-500/30">
      {/* Floating Header */}
      <header className="fixed top-6 left-0 right-0 z-50 flex justify-center pointer-events-none px-6">
        <div className="w-full max-w-7xl bg-gradient-to-r from-white/90 via-blue-50/50 to-indigo-50/50 dark:from-slate-900/90 dark:via-blue-950/50 dark:to-indigo-950/50 backdrop-blur-xl border border-blue-200/30 dark:border-blue-900/30 shadow-lg shadow-blue-500/10 rounded-full px-6 py-3 pointer-events-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={user ? "/citizen/dashboard" : "/"}>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-gradient-to-br hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/50 dark:hover:to-indigo-900/50 -ml-2 transition-all duration-300">
                <ArrowLeft className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </Button>
            </Link>
            <div className="h-4 w-px bg-gradient-to-b from-blue-200 to-indigo-200 dark:from-blue-800 dark:to-indigo-800" />
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-full bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 shadow-lg shadow-blue-500/30">
                <Shield className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold text-sm tracking-tight bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                Track Application
              </span>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-6 pt-32 pb-12 max-w-3xl">
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
              Track Status
            </h1>
            <p className="text-lg text-[#86868b] dark:text-slate-400 font-medium max-w-xl mx-auto">
              Enter your tracking ID to view the current status of your application.
            </p>
          </div>

          <Card className="group relative border-0 overflow-hidden bg-gradient-to-br from-white via-purple-50/30 to-pink-50/30 dark:from-slate-900 dark:via-purple-950/20 dark:to-pink-950/20 shadow-sm hover:shadow-lg transition-all duration-300 rounded-[32px]">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-400/5 to-pink-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardHeader className="relative z-10 border-b border-slate-100 dark:border-slate-800 p-8 bg-gradient-to-r from-purple-50/50 via-transparent to-pink-50/50 dark:from-purple-950/30 dark:via-transparent dark:to-pink-950/30">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-lg shadow-purple-500/30">
                  <Search className="h-5 w-5" />
                </div>
                <CardTitle className="text-xl font-bold text-[#1d1d1f] dark:text-white">Search Application</CardTitle>
              </div>
              <CardDescription className="text-[#86868b] dark:text-slate-400 ml-12">
                Your tracking ID was provided when you submitted your application
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10 p-8">
              <form onSubmit={handleSearch} className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="trackingId" className="text-sm font-semibold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">Tracking ID</Label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-rose-500/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
                    <Search className="absolute left-4 top-3.5 h-5 w-5 text-purple-500 dark:text-purple-400 z-10" />
                    <Input
                      id="trackingId"
                      type="text"
                      placeholder="e.g., APP-2024-001234"
                      value={trackingId}
                      onChange={(e) => setTrackingId(e.target.value)}
                      className="relative z-10 h-12 pl-12 rounded-xl border-2 border-purple-200/50 dark:border-purple-800/50 bg-gradient-to-br from-white via-purple-50/30 to-pink-50/30 dark:from-slate-900 dark:via-purple-950/30 dark:to-pink-950/30 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:focus:ring-purple-400 dark:focus:border-purple-400 focus:ring-offset-0 font-mono text-lg tracking-wide uppercase placeholder:normal-case placeholder:tracking-normal transition-all duration-300"
                      required
                      data-testid="input-tracking-id"
                    />
                  </div>
                  <p className="text-xs text-purple-600/70 dark:text-purple-400/70 ml-1">
                    The tracking ID is case-sensitive
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={isSearching}
                  className="w-full h-12 rounded-full bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:from-purple-700 hover:via-pink-700 hover:to-rose-700 text-white font-medium shadow-lg shadow-purple-500/30 text-base transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="button-search"
                >
                  {isSearching ? "Searching..." : "Track Application"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Status Dialog - Refined */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl border-0 rounded-[32px] p-0 overflow-hidden bg-gradient-to-br from-white via-indigo-50/20 to-purple-50/20 dark:from-slate-900 dark:via-indigo-950/20 dark:to-purple-950/20 shadow-2xl">
          <DialogHeader className="relative p-8 pb-0 bg-gradient-to-r from-blue-50/50 via-indigo-50/30 to-purple-50/50 dark:from-blue-950/30 dark:via-indigo-950/20 dark:to-purple-950/30">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/5 to-purple-400/5" />
            <div className="relative z-10 flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 text-white shadow-lg shadow-blue-500/30">
                  <FileText className="h-5 w-5" />
                </div>
                <DialogTitle className="text-xl font-bold text-[#1d1d1f] dark:text-white">Application Status</DialogTitle>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCloseDialog}
                className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5 text-slate-500" />
              </Button>
            </div>
            <DialogDescription className="relative z-10 text-[#86868b] dark:text-slate-400 ml-12">
              Current status details for your application
            </DialogDescription>
          </DialogHeader>

          {foundApplication && (
            <div className="p-8 space-y-8">
              {/* Tracking ID and Status */}
              <div className="group relative flex flex-wrap items-center justify-between gap-4 p-6 bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/50 dark:from-slate-800/80 dark:via-blue-950/40 dark:to-indigo-950/40 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
                <div className="relative z-10">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#86868b] dark:text-slate-400 mb-1">Tracking ID</p>
                  <code className="text-xl font-mono font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">{foundApplication.trackingId}</code>
                </div>
                <Badge className={`relative z-10 ${statusColors[foundApplication.status]} text-sm px-4 py-1.5 rounded-full font-semibold border-0`}>
                  {foundApplication.status}
                </Badge>
              </div>

              {/* Application Details */}
              <div className="space-y-6">
                <div className="group relative p-4 rounded-xl bg-gradient-to-br from-purple-50/50 via-pink-50/30 to-rose-50/30 dark:from-purple-950/30 dark:via-pink-950/20 dark:to-rose-950/30 border border-purple-100/50 dark:border-purple-900/30">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-400/10 to-pink-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
                  <Label className="relative z-10 text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">Application Type</Label>
                  <p className="relative z-10 text-lg font-medium bg-gradient-to-r from-purple-700 to-pink-700 dark:from-purple-300 dark:to-pink-300 bg-clip-text text-transparent mt-1">{foundApplication.applicationType}</p>
                </div>

                <div className="group relative p-4 rounded-xl bg-gradient-to-br from-cyan-50/50 via-teal-50/30 to-blue-50/30 dark:from-cyan-950/30 dark:via-teal-950/20 dark:to-blue-950/30 border border-cyan-100/50 dark:border-cyan-900/30">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 to-teal-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
                  <Label className="relative z-10 text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">Description</Label>
                  <p className="relative z-10 mt-2 text-sm leading-relaxed text-[#1d1d1f] dark:text-slate-300 whitespace-pre-wrap bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-4 rounded-xl border border-cyan-100/50 dark:border-cyan-900/30">
                    {foundApplication.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="group relative flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-emerald-50 via-green-50/50 to-teal-50/50 dark:from-emerald-950/40 dark:via-green-950/30 dark:to-teal-950/40 border border-emerald-100/50 dark:border-emerald-900/30 shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/10 to-green-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
                    <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-md relative z-10">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div className="relative z-10">
                      <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Submitted</p>
                      <p className="text-sm font-bold text-[#1d1d1f] dark:text-white">
                        {new Date(foundApplication.submittedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="group relative flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-amber-50 via-orange-50/50 to-yellow-50/50 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-yellow-950/40 border border-amber-100/50 dark:border-amber-900/30 shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-400/10 to-orange-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
                    <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md relative z-10">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div className="relative z-10">
                      <p className="text-xs font-medium text-amber-600 dark:text-amber-400">Auto-Approval</p>
                      <p className="text-sm font-bold text-[#1d1d1f] dark:text-white">
                        {new Date(foundApplication.autoApprovalDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Location History */}
              {locationHistory && locationHistory.length > 0 && (
                <div className="group relative p-6 bg-gradient-to-br from-green-50 via-emerald-50/50 to-teal-50/50 dark:from-green-950/40 dark:via-emerald-950/30 dark:to-teal-950/40 rounded-2xl border border-green-200/50 dark:border-green-900/30 shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-400/10 via-emerald-400/10 to-teal-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-md">
                        <MapPin className="h-5 w-5" />
                      </div>
                      <Label className="text-sm font-bold text-green-700 dark:text-green-300">Location / Path History</Label>
                    </div>
                    <div className="space-y-0 relative pl-4">
                      <div className="absolute left-[19px] top-2 bottom-4 w-0.5 bg-green-100 dark:bg-green-900/30"></div>
                      {locationHistory.map((entry, index) => (
                        <div key={entry.id} className="relative flex gap-4 pb-4 last:pb-0 group">
                          <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 ${
                            index === 0 ? 'bg-green-500 text-white shadow-md shadow-green-500/30' : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                          }`}>
                            {index === 0 ? <MapPin size={14} /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                          </div>
                          <div className="flex-1 pt-0.5">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                              <span className="font-semibold text-sm text-[#1d1d1f] dark:text-white">
                                {entry.location}
                              </span>
                              <span className="text-xs font-medium text-[#86868b] bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-lg">
                                {new Date(entry.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                              </span>
                            </div>
                            {index === 0 && (
                              <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 text-xs px-2 py-0.5 rounded-full mt-1 w-fit">
                                Current Location
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Login Prompt */}
              <div className="group relative p-6 bg-gradient-to-br from-blue-50 via-indigo-50/50 to-purple-50/50 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-purple-950/40 rounded-2xl border border-blue-200/50 dark:border-blue-900/30 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 via-indigo-400/10 to-purple-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
                <p className="relative z-10 text-sm font-medium bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 dark:from-blue-300 dark:via-indigo-300 dark:to-purple-300 bg-clip-text text-transparent mb-4">
                  Want to see more details? Log in to view full history and rate officials.
                </p>
                <div className="relative z-10 flex gap-3">
                  <Button
                    size="sm"
                    onClick={() => setLocation("/login")}
                    className="rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/30 px-6 transition-all duration-300"
                  >
                    Log In
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setLocation("/register")}
                    className="rounded-full border-2 border-blue-300 dark:border-blue-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 text-blue-700 dark:text-blue-300 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/50 dark:hover:to-indigo-900/50 px-6 transition-all duration-300"
                  >
                    Register
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
