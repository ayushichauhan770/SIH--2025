import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, ArrowLeft, Clock, User, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusStepper } from "@/components/status-stepper";
import { BlockchainHashDisplay } from "@/components/blockchain-hash";
import { RatingComponent } from "@/components/rating-component";
import { OTPModal } from "@/components/otp-modal";
import { ThemeToggle } from "@/components/theme-toggle";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Application, ApplicationHistory, BlockchainHash, Feedback } from "@shared/schema";

export default function ApplicationDetails() {
  const [, params] = useRoute("/citizen/application/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [pendingFeedback, setPendingFeedback] = useState<{ rating: number; comment: string } | null>(null);

  const applicationId = params?.id;

  const { data: application, isLoading } = useQuery<Application>({
    queryKey: ["/api/applications", applicationId],
    enabled: !!applicationId,
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

  const submitFeedbackMutation = useMutation({
    mutationFn: async (data: { rating: number; comment: string }) => {
      return await apiRequest("POST", "/api/feedback", {
        applicationId,
        citizenId: application?.citizenId,
        rating: data.rating,
        comment: data.comment,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications", applicationId, "feedback"] });
    },
  });

  const verifyOTPMutation = useMutation({
    mutationFn: async (otp: string) => {
      return await apiRequest("POST", "/api/otp/verify", {
        phone: "temp-phone",
        otp,
        purpose: "feedback",
      });
    },
  });

  const handleSubmitFeedback = (rating: number, comment: string) => {
    setPendingFeedback({ rating, comment });
    setShowOTPModal(true);
  };

  const handleVerifyOTP = async (otp: string): Promise<boolean> => {
    try {
      await verifyOTPMutation.mutateAsync(otp);

      if (pendingFeedback) {
        await submitFeedbackMutation.mutateAsync(pendingFeedback);
        toast({
          title: "Feedback Submitted!",
          description: "Thank you for your feedback",
        });
        setPendingFeedback(null);
      }
      return true;
    } catch (error) {
      return false;
    }
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Application Progress</CardTitle>
            <CardDescription>Track the status of your application</CardDescription>
          </CardHeader>
          <CardContent>
            <StatusStepper currentStatus={application.status} history={history} />
          </CardContent>
        </Card>

        {blockchainHash && <BlockchainHashDisplay hash={blockchainHash} />}

        {["Approved", "Auto-Approved", "Rejected"].includes(application.status) && !feedback && (
          <RatingComponent
            onSubmit={handleSubmitFeedback}
            isSubmitting={submitFeedbackMutation.isPending}
          />
        )}

        {feedback && (
          <Card>
            <CardHeader>
              <CardTitle className="font-heading">Your Feedback</CardTitle>
              <CardDescription>Thank you for rating this service</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <span
                    key={star}
                    className={star <= feedback.rating ? "text-yellow-400" : "text-gray-300"}
                  >
                    ★
                  </span>
                ))}
              </div>
              {feedback.comment && (
                <p className="text-sm text-muted-foreground">{feedback.comment}</p>
              )}
            </CardContent>
          </Card>
        )}
      </main>

      <OTPModal
        open={showOTPModal}
        onClose={() => setShowOTPModal(false)}
        onVerify={handleVerifyOTP}
        phone="1234567890"
        purpose="feedback"
      />
    </div>
  );
}
