import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, ArrowLeft, Clock, User, Calendar, MessageSquare, ThumbsUp, ThumbsDown, Star, FileText, CheckCircle, AlertCircle, MapPin } from "lucide-react";
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
    refetchInterval: 3000,
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

  const { data: official } = useQuery<{ id: string; fullName: string; department: string | null } | null>({
    queryKey: ["/api/users", application?.officialId],
    enabled: !!application?.officialId,
  });

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
      queryClient.invalidateQueries({ queryKey: ["/api/users/officials"] });
      queryClient.invalidateQueries({ queryKey: ["/api/officials", application?.officialId, "rating"] });
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
  };

  const handleNotSolvedRatingSubmit = (rating: number, comment: string) => {
    solveMutation.mutate({ isSolved: false, rating, comment });
  };

  const handleRatingSubmit = (rating: number, comment: string) => {
    solveMutation.mutate({ isSolved: true, rating, comment });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] dark:bg-slate-950">
        <header className="fixed top-6 left-0 right-0 z-50 flex justify-center pointer-events-none px-6">
          <div className="w-full max-w-7xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 shadow-sm rounded-full px-6 py-3 pointer-events-auto flex items-center justify-between">
            <Skeleton className="h-8 w-32 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </header>
        <main className="container mx-auto px-6 pt-32 pb-12 max-w-5xl">
          <Skeleton className="h-64 w-full rounded-[32px]" />
        </main>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F7] dark:bg-slate-950">
        <Card className="rounded-[32px] border-0 shadow-sm">
          <CardContent className="pt-6 p-12 text-center">
            <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 w-fit mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-slate-400" />
            </div>
            <h2 className="text-xl font-bold text-[#1d1d1f] dark:text-white mb-2">Application Not Found</h2>
            <p className="text-[#86868b] mb-6">The application you are looking for does not exist or you don't have permission to view it.</p>
            <Link href="/citizen/dashboard">
              <Button className="rounded-full bg-[#0071e3] hover:bg-[#0077ED]">Return to Dashboard</Button>
            </Link>
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

  const showRating = ["Approved", "Auto-Approved"].includes(application.status) && !application.isSolved && (
    !feedback || 
    (isReApproved && application.officialId && feedback.officialId !== application.officialId) || 
    (isReApproved && !feedback.officialId)
  );

  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-slate-950 font-['Outfit',sans-serif] selection:bg-blue-500/30">
      {/* Floating Header */}
      <header className="fixed top-6 left-0 right-0 z-50 flex justify-center pointer-events-none px-6">
        <div className="w-full max-w-7xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 shadow-sm rounded-full px-6 py-3 pointer-events-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/citizen/dashboard">
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
                Application Details
              </span>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-6 pt-32 pb-12 max-w-6xl">
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          
          {/* Header Card */}
          <Card className="border-0 shadow-sm bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden">
            <div className="p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Badge className={`${statusColors[application.status]} px-3 py-1 rounded-full text-sm font-semibold border-0 shadow-none`}>
                    {application.status}
                  </Badge>
                  <span className="text-sm text-[#86868b] font-mono">#{application.trackingId}</span>
                </div>
                <h1 className="text-3xl font-bold text-[#1d1d1f] dark:text-white tracking-tight">
                  {application.applicationType}
                </h1>
              </div>
              <div className="flex gap-3">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#f5f5f7] dark:bg-slate-800">
                  <Calendar className="h-4 w-4 text-[#86868b]" />
                  <span className="text-sm font-medium text-[#1d1d1f] dark:text-white">
                    {new Date(application.submittedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Details & Documents */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-0 shadow-sm bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800 p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-[#0071e3]">
                      <FileText className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-lg font-bold text-[#1d1d1f] dark:text-white">Description</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-[#1d1d1f] dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {application.description}
                  </p>
                  
                  {application.image && (
                    <div className="mt-6">
                      <h3 className="font-medium text-sm text-[#86868b] mb-3 uppercase tracking-wider">Attachment</h3>
                      <div className="relative group rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 inline-block">
                        <img 
                          src={application.image} 
                          alt="Application Attachment" 
                          className="max-h-64 object-cover transition-transform duration-500 group-hover:scale-105" 
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {application.remarks && application.remarks.trim() && (
                <Card className="border-0 shadow-sm bg-blue-50/50 dark:bg-blue-900/10 rounded-[32px] overflow-hidden border-l-4 border-l-[#0071e3]">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3">
                      <MessageSquare className="h-5 w-5 text-[#0071e3] mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="font-bold text-[#1d1d1f] dark:text-white mb-1">Official Remarks</h3>
                        <p className="text-sm text-[#1d1d1f] dark:text-slate-300 whitespace-pre-wrap">
                          {application.remarks}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {showRating && (
                <Card className="border-0 shadow-sm bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden">
                  <CardHeader className="border-b border-slate-100 dark:border-slate-800 p-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600">
                        <Star className="h-5 w-5" />
                      </div>
                      <CardTitle className="text-lg font-bold text-[#1d1d1f] dark:text-white">Feedback & Rating</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    {isSolved === null ? (
                      <div className="space-y-6 text-center py-4">
                        {(application.escalationLevel || 0) > 0 && (
                          <div className="p-3 bg-blue-50 text-blue-800 rounded-xl text-sm mb-4">
                            <p>This application has been re-processed. Please verify if your issue is now resolved.</p>
                          </div>
                        )}
                        <h3 className="text-xl font-bold text-[#1d1d1f] dark:text-white">Is your issue resolved?</h3>
                        <div className="flex justify-center gap-4">
                          <Button 
                            onClick={() => handleSolveSelection(true)} 
                            className="h-12 px-8 rounded-full bg-green-600 hover:bg-green-700 text-white gap-2 shadow-lg shadow-green-500/20"
                          >
                            <ThumbsUp className="h-5 w-5" />
                            Yes, Resolved
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => handleSolveSelection(false)} 
                            className="h-12 px-8 rounded-full border-slate-200 hover:bg-slate-50 gap-2"
                          >
                            <ThumbsDown className="h-5 w-5" />
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
                      <div className="space-y-6">
                        <div className="text-center p-4 bg-orange-50 text-orange-800 rounded-2xl">
                          <p className="font-medium">Please rate the service before we reassign your application.</p>
                        </div>
                        <RatingComponent
                          onSubmit={handleNotSolvedRatingSubmit}
                          isSubmitting={solveMutation.isPending}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column: Timeline & Info */}
            <div className="space-y-6">
              {/* Official Info Card */}
              {official && (
                <Card className="border-0 shadow-sm bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden">
                  <CardHeader className="border-b border-slate-100 dark:border-slate-800 p-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600">
                        <User className="h-5 w-5" />
                      </div>
                      <CardTitle className="text-lg font-bold text-[#1d1d1f] dark:text-white">Assigned Official</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-[#f5f5f7] dark:bg-slate-800 flex items-center justify-center text-lg font-bold text-[#86868b]">
                        {official.fullName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-[#1d1d1f] dark:text-white">{official.fullName}</p>
                        {official.department && (
                          <p className="text-sm text-[#86868b]">{official.department}</p>
                        )}
                      </div>
                    </div>
                    
                    {officialRating && officialRating.totalRatings > 0 && (
                      <div className="mt-4 flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/10 rounded-xl">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        <span className="font-bold text-[#1d1d1f] dark:text-white">{officialRating.averageRating.toFixed(1)}</span>
                        <span className="text-xs text-[#86868b]">({officialRating.totalRatings} ratings)</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Timeline Card */}
              <Card className="border-0 shadow-sm bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800 p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-orange-50 dark:bg-orange-900/20 text-orange-500">
                      <Clock className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-lg font-bold text-[#1d1d1f] dark:text-white">Timeline</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <StatusStepper
                    currentStatus={application.status}
                    history={history.map(h => ({
                      ...h,
                      comment: h.comment || undefined
                    }))}
                  />
                </CardContent>
              </Card>

              {/* Blockchain Hash */}
              {blockchainHash && (
                <Card className="border-0 shadow-sm bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden">
                  <CardContent className="p-6">
                    <BlockchainHashDisplay hash={blockchainHash} />
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
