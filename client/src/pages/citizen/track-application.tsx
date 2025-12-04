import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Shield, ArrowLeft, Search, Calendar, Clock, FileText, X, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/contexts/auth-context";
import type { Application } from "@shared/schema";

export default function TrackApplication() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [trackingId, setTrackingId] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [foundApplication, setFoundApplication] = useState<Application | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  const statusColors: Record<string, string> = {
    "Submitted": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    "Assigned": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    "In Progress": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    "Approved": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    "Rejected": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    "Auto-Approved": "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
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
        <div className="w-full max-w-7xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 shadow-sm rounded-full px-6 py-3 pointer-events-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={user ? "/citizen/dashboard" : "/"}>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 -ml-2">
                <ArrowLeft className="h-5 w-5 text-[#1d1d1f] dark:text-white" />
              </Button>
            </Link>
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-full bg-[#0071e3] shadow-lg shadow-blue-500/20">
                <Shield className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold text-sm tracking-tight text-[#1d1d1f] dark:text-white">
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
            <h1 className="text-4xl font-bold tracking-tight text-[#1d1d1f] dark:text-white">
              Track Status
            </h1>
            <p className="text-lg text-[#86868b] dark:text-slate-400 font-medium max-w-xl mx-auto">
              Enter your tracking ID to view the current status of your application.
            </p>
          </div>

          <Card className="border-0 shadow-sm bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 p-8 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600">
                  <Search className="h-5 w-5" />
                </div>
                <CardTitle className="text-xl font-bold text-[#1d1d1f] dark:text-white">Search Application</CardTitle>
              </div>
              <CardDescription className="text-[#86868b] ml-12">
                Your tracking ID was provided when you submitted your application
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleSearch} className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="trackingId" className="text-sm font-semibold text-[#1d1d1f] dark:text-white">Tracking ID</Label>
                  <div className="relative">
                    <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                    <Input
                      id="trackingId"
                      type="text"
                      placeholder="e.g., APP-2024-001234"
                      value={trackingId}
                      onChange={(e) => setTrackingId(e.target.value)}
                      className="h-12 pl-12 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-[#0071e3] focus:ring-offset-0 font-mono text-lg tracking-wide uppercase placeholder:normal-case placeholder:tracking-normal"
                      required
                      data-testid="input-tracking-id"
                    />
                  </div>
                  <p className="text-xs text-[#86868b] ml-1">
                    The tracking ID is case-sensitive
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={isSearching}
                  className="w-full h-12 rounded-full bg-[#0071e3] hover:bg-[#0077ED] text-white font-medium shadow-lg shadow-blue-500/20 text-base"
                  data-testid="button-search"
                >
                  {isSearching ? "Searching..." : "Track Application"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-0 shadow-sm bg-white dark:bg-slate-900 rounded-[24px] p-6">
              <div className="flex gap-4">
                <div className="p-3 rounded-full bg-blue-50 dark:bg-blue-900/20 text-[#0071e3] h-fit">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-[#1d1d1f] dark:text-white mb-1">Real-time Updates</h3>
                  <p className="text-sm text-[#86868b]">
                    Get instant status updates as your application moves through the review process.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="border-0 shadow-sm bg-white dark:bg-slate-900 rounded-[24px] p-6">
              <div className="flex gap-4">
                <div className="p-3 rounded-full bg-orange-50 dark:bg-orange-900/20 text-orange-500 h-fit">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-[#1d1d1f] dark:text-white mb-1">Need Help?</h3>
                  <p className="text-sm text-[#86868b]">
                    Check your email for the tracking ID or contact support if you've lost it.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>

      {/* Status Dialog - Refined */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl border-0 rounded-[32px] p-0 overflow-hidden bg-white dark:bg-slate-900 shadow-2xl">
          <DialogHeader className="p-8 pb-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-[#0071e3]">
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
            <DialogDescription className="text-[#86868b] ml-12">
              Current status details for your application
            </DialogDescription>
          </DialogHeader>

          {foundApplication && (
            <div className="p-8 space-y-8">
              {/* Tracking ID and Status */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-6 bg-[#f5f5f7] dark:bg-slate-800/50 rounded-2xl">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#86868b] mb-1">Tracking ID</p>
                  <code className="text-xl font-mono font-bold text-[#1d1d1f] dark:text-white">{foundApplication.trackingId}</code>
                </div>
                <Badge className={`${statusColors[foundApplication.status]} text-sm px-4 py-1.5 rounded-full font-semibold border-0`}>
                  {foundApplication.status}
                </Badge>
              </div>

              {/* Application Details */}
              <div className="space-y-6">
                <div>
                  <Label className="text-xs font-bold uppercase tracking-wider text-[#86868b]">Application Type</Label>
                  <p className="text-lg font-medium text-[#1d1d1f] dark:text-white mt-1">{foundApplication.applicationType}</p>
                </div>

                <div>
                  <Label className="text-xs font-bold uppercase tracking-wider text-[#86868b]">Description</Label>
                  <p className="mt-2 text-sm leading-relaxed text-[#1d1d1f] dark:text-slate-300 whitespace-pre-wrap bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                    {foundApplication.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <Calendar className="h-5 w-5 text-[#86868b]" />
                    <div>
                      <p className="text-xs font-medium text-[#86868b]">Submitted</p>
                      <p className="text-sm font-bold text-[#1d1d1f] dark:text-white">
                        {new Date(foundApplication.submittedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <Clock className="h-5 w-5 text-[#86868b]" />
                    <div>
                      <p className="text-xs font-medium text-[#86868b]">Auto-Approval</p>
                      <p className="text-sm font-bold text-[#1d1d1f] dark:text-white">
                        {new Date(foundApplication.autoApprovalDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Login Prompt */}
              <div className="p-6 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/20">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-4">
                  Want to see more details? Log in to view full history and rate officials.
                </p>
                <div className="flex gap-3">
                  <Button
                    size="sm"
                    onClick={() => setLocation("/login")}
                    className="rounded-full bg-[#0071e3] hover:bg-[#0077ED] text-white shadow-md shadow-blue-500/20 px-6"
                  >
                    Log In
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setLocation("/register")}
                    className="rounded-full border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-6"
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
