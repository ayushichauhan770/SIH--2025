import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, ArrowLeft, Clock, User, Calendar, MessageSquare, ThumbsUp, ThumbsDown, Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusStepper } from "@/components/status-stepper";
import { BlockchainHashDisplay } from "@/components/blockchain-hash";
import { RatingComponent } from "@/components/rating-component";
import { ThemeToggle } from "@/components/theme-toggle";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Application, ApplicationHistory, BlockchainHash, Feedback } from "@shared/schema";
import { useState } from "react";

export default function ApplicationDetails() {
  const [, params] = useRoute("/citizen/application/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSolved, setIsSolved] = useState<boolean | null>(null);

  const applicationId = params?.id;

  const { data: application, isLoading } = useQuery<Application>({
    queryKey: ["/api/applications", applicationId],
    enabled: !!applicationId,
    refetchInterval: 3000, // Auto-refresh every 3 seconds to show latest status
  });

  const { data: history = [] } = useQuery<ApplicationHistory[]>({
    queryKey: ["/api/applications", applicationId, "history"],
    enabled: !!applicationId,
  });

  const { data: blockchainHash } = useQuery<BlockchainHash | null>({
    queryKey: ["/api/applications", applicationId, "blockchain"],
    enabled: !!applicationId && ["Approved", "Auto-Approved"].includes(application?.status || ""),
  });

  const { data: feedback } = useQuery<Feedback | null>({
    queryKey: ["/api/applications", applicationId, "feedback"],
    enabled: !!applicationId && ["Approved", "Auto-Approved", "Rejected"].includes(application?.status || ""),
  });

  // Fetch official information if application is assigned
  const { data: official } = useQuery<{ id: string; fullName: string; department: string | null } | null>({
    queryKey: ["/api/users", application?.officialId],
    enabled: !!application?.officialId,
  });

  // Fetch official rating stats
  const { data: officialRating } = useQuery<{ averageRating: number; totalRatings: number }>({
    queryKey: ["/api/officials", application?.officialId, "rating"],
    enabled: !!application?.officialId,
  });

  const solveMutation = useMutation({
    mutationFn: async (data: { isSolved: boolean; rating?: number; comment?: string }) => {
      return await apiRequest("POST", `/api/applications/${applicationId}/solve`, data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications", applicationId] });
      queryClient.invalidateQueries({ queryKey: ["/api/applications", applicationId, "feedback"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/officials"] }); // Update officials list for admin dashboard
      queryClient.invalidateQueries({ queryKey: ["/api/officials", application?.officialId, "rating"] }); // Update official's rating
      toast({
        title: "Success",
        description: data?.message || "Your feedback has been submitted successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to submit feedback. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleSolveSelection = (solved: boolean) => {
    setIsSolved(solved);
    // Don't immediately trigger for "Not Solved" - wait for rating
  };

  const handleNotSolvedRatingSubmit = (rating: number, comment: string) => {
    solveMutation.mutate({ isSolved: false, rating, comment });
  };

  const handleRatingSubmit = (rating: number, comment: string) => {
    solveMutation.mutate({ isSolved: true, rating, comment });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <header className="border-b sticky top-0 bg-white/95 dark:bg-slate-950/95 backdrop-blur z-50">
          <div className="container mx-auto px-4 py-4">
            <Skeleton className="h-8 w-64" />
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <Skeleton className="h-64 w-full" />
        </main>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <p>Application not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    "Submitted": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    "Assigned": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    "In Progress": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    "Approved": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    "Rejected": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    "Auto-Approved": "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  };

  const isReApproved = ["Approved", "Auto-Approved"].includes(application.status) && (application.escalationLevel || 0) > 0;

  // Show rating if:
  // 1. Application is approved/auto-approved AND no feedback exists yet, OR
  // 2. Application was re-approved (escalated) AND there's a new official assigned AND 
  //    (no feedback exists OR the existing feedback is for a different official)
  const showRating = ["Approved", "Auto-Approved"].includes(application.status) && !application.isSolved && (
    !feedback || // No feedback at all
    (isReApproved && application.officialId && feedback.officialId !== application.officialId) || // Re-approved with new official and old feedback is for previous official
    (isReApproved && !feedback.officialId) // Re-approved but old feedback has no official (edge case)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <header className="border-b sticky top-0 bg-white/95 dark:bg-slate-950/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/citizen/dashboard">
              <Button variant="ghost" size="icon" data-testid="button-back">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <span className="font-heading font-bold text-xl">Digital Governance</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-heading mb-2">Application Details</h1>
            <code className="text-lg font-mono text-muted-foreground" data-testid="text-tracking-id">
              {application.trackingId}
            </code>
          </div>
          <Badge className={statusColors[application.status]} data-testid="badge-status">
            {application.status}
          </Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading">{application.applicationType}</CardTitle>
            <CardDescription>Application Information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium text-sm text-muted-foreground mb-2">Description</h3>
              <p className="text-sm">{application.description}</p>
            </div>
            {application.remarks && application.remarks.trim() && (
              <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-2">
                  <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-sm text-blue-900 dark:text-blue-300 mb-1">Internal Notes / Status Comments</h3>
                    <p className="text-sm text-blue-800 dark:text-blue-200 whitespace-pre-wrap">{application.remarks}</p>
                  </div>
                </div>
              </div>
            )}
            {application.image && (
              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-2">Uploaded Image</h3>
                <img src={application.image} alt="Application Attachment" className="max-h-64 rounded-md border" />
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Submitted</p>
                  <p className="text-sm font-medium">{new Date(application.submittedAt).toLocaleDateString()}</p>
                </div>
              </div>
              {application.assignedAt && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Assigned</p>
                    <p className="text-sm font-medium">{new Date(application.assignedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Auto-Approval Date</p>
                  <p className="text-sm font-medium">{new Date(application.autoApprovalDate).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {/* Official Information */}
            {official && (
              <div className="pt-4 border-t">
                <h3 className="font-medium text-sm text-muted-foreground mb-3">Assigned Official</h3>
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div className="space-y-1 flex-1">
                      <p className="font-semibold text-blue-900 dark:text-blue-300">{official.fullName}</p>
                      {official.department && (
                        <p className="text-sm text-blue-700 dark:text-blue-400">{official.department}</p>
                      )}
                      {officialRating && officialRating.totalRatings > 0 && (
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/20 rounded-full">
                            <Star className="h-4 w-4 text-yellow-600 dark:text-yellow-400 fill-yellow-600 dark:fill-yellow-400" />
                            <span className="text-sm font-bold text-yellow-700 dark:text-yellow-300">
                              {officialRating.averageRating.toFixed(1)}
                            </span>
                            <span className="text-xs text-yellow-600 dark:text-yellow-400">/ 5.0</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {blockchainHash && (
              <div className="pt-4 border-t">
                <BlockchainHashDisplay hash={blockchainHash} />
              </div>
            )}

            <div className="pt-6 border-t">
              <StatusStepper
                currentStatus={application.status}
                history={history.map(h => ({
                  ...h,
                  comment: h.comment || undefined
                }))}
              />
            </div>

            {showRating && (
              <div className="pt-6 border-t">
                <h3 className="font-medium text-sm text-muted-foreground mb-4">Feedback & Rating</h3>
                {isSolved === null ? (
                  <div className="space-y-4">
                    {(application.escalationLevel || 0) > 0 && (
                      <div className="p-3 bg-blue-50 text-blue-800 rounded-md text-sm mb-2">
                        <p>This application has been re-processed and approved. Please verify if your issue is now resolved.</p>
                      </div>
                    )}
                    <p className="text-sm">Has your issue been resolved satisfactorily?</p>
                    <div className="flex gap-4">
                      <Button onClick={() => handleSolveSelection(true)} className="gap-2">
                        <ThumbsUp className="h-4 w-4" />
                        Yes, Resolved
                      </Button>
                      <Button variant="outline" onClick={() => handleSolveSelection(false)} className="gap-2">
                        <ThumbsDown className="h-4 w-4" />
                        No, Not Resolved
                      </Button>
                    </div>
                  </div>
                ) : isSolved ? (
                  <RatingComponent
                    onSubmit={handleRatingSubmit}
                    isSubmitting={solveMutation.isPending}
                  />
                ) : (
                  <div className="space-y-4">
                    <div className="text-center p-4 bg-orange-50 text-orange-800 rounded-md">
                      <p className="font-medium">Please rate the official's service before we reassign your application.</p>
                      <p className="text-sm mt-1">Your feedback helps us improve our services.</p>
                    </div>
                    <RatingComponent
                      onSubmit={handleNotSolvedRatingSubmit}
                      isSubmitting={solveMutation.isPending}
                    />
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div >
  );
}
