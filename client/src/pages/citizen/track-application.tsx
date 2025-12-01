import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Shield, ArrowLeft, Search, Calendar, Clock, FileText, X } from "lucide-react";
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <header className="border-b sticky top-0 bg-white/95 dark:bg-slate-950/95 backdrop-blur z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={user ? "/citizen/dashboard" : "/"}>
                <Button variant="ghost" size="icon" data-testid="button-back">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-primary" />
                <span className="font-heading font-bold text-xl">Digital Governance</span>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold font-heading mb-2">Track Application</h1>
            <p className="text-muted-foreground">Enter your tracking ID to view application status</p>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Search className="h-5 w-5 text-primary" />
                <CardTitle className="font-heading">Search by Tracking ID</CardTitle>
              </div>
              <CardDescription>
                Your tracking ID was provided when you submitted your application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="trackingId">Tracking ID</Label>
                  <Input
                    id="trackingId"
                    type="text"
                    placeholder="Enter tracking ID (e.g., APP-2024-001234)"
                    value={trackingId}
                    onChange={(e) => setTrackingId(e.target.value)}
                    className="font-mono"
                    required
                    data-testid="input-tracking-id"
                  />
                  <p className="text-xs text-muted-foreground">
                    The tracking ID is case-sensitive
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={isSearching}
                  className="w-full"
                  data-testid="button-search"
                >
                  {isSearching ? "Searching..." : "Search Application"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-lg font-heading">Need Help?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• Check your email for the tracking ID sent after submission</p>
              <p>• Tracking IDs typically start with "APP-" followed by year and number</p>
              <p>• You can track your application without logging in</p>
              <p>• For full details and to rate officials, please log in to your account</p>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Status Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Application Status
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCloseDialog}
                className="h-6 w-6"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
            <DialogDescription>
              Your application details and current status
            </DialogDescription>
          </DialogHeader>

          {foundApplication && (
            <div className="space-y-6">
              {/* Tracking ID and Status */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Tracking ID</p>
                  <code className="text-lg font-mono font-bold">{foundApplication.trackingId}</code>
                </div>
                <Badge className={`${statusColors[foundApplication.status]} text-lg px-4 py-2`}>
                  {foundApplication.status}
                </Badge>
              </div>

              {/* Application Details */}
              <div className="space-y-4">
                <div>
                  <Label className="text-muted-foreground">Application Type</Label>
                  <p className="font-medium mt-1">{foundApplication.applicationType}</p>
                </div>

                <div>
                  <Label className="text-muted-foreground">Description</Label>
                  <p className="mt-1 text-sm whitespace-pre-wrap">{foundApplication.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Submitted</p>
                      <p className="text-sm font-medium">
                        {new Date(foundApplication.submittedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Auto-Approval Date</p>
                      <p className="text-sm font-medium">
                        {new Date(foundApplication.autoApprovalDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Login Prompt */}
              <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-900 dark:text-blue-300">
                  <strong>Want more details?</strong> Log in to your account to view complete application history,
                  rate officials, and track all your applications.
                </p>
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    onClick={() => setLocation("/login")}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Log In
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setLocation("/register")}
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
