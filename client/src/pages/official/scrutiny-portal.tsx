import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Scale, CheckCircle2, XCircle, Eye, AlertTriangle, FileText, UserX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Case } from "@shared/schema";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Label } from "@/components/ui/label";

export default function ScrutinyPortal() {
  const { toast } = useToast();
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [rejectReason, setRejectReason] = useState<string>("");

  const { data: cases, isLoading } = useQuery<Case[]>({
    queryKey: ["/api/official/scrutiny-cases"],
     // We need to implement this endpoint or filter client side if we reuse /api/judiciary/cases
     // For now, let's assume we filter client side from a general endpoint or add a specific one.
     // Better yet, let's use the existing /api/applications/my equivalent for cases -> /api/judiciary/my-assigned-cases
     // But we don't have that. Let's assume we add it or standard /api/judiciary/cases returns everything and we filter (not secure but quick for proto)
     // Actually, let's add a proper endpoint to routes.ts for this? Or reuse.
     // Let's use a new endpoint to be clean: /api/judiciary/scrutiny-tasks
     queryFn: async () => {
       const res = await apiRequest("GET", "/api/judiciary/scrutiny-tasks");
       return res.json();
     }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, reason }: { id: string, status: string, reason?: string }) => {
      await apiRequest("POST", `/api/judiciary/case/${id}/scrutiny-decision`, { status, reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/official/scrutiny-cases"] });
      toast({ title: "Decision Recorded", description: "The case status has been updated." });
      setSelectedCase(null);
      setRejectReason("");
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  });

  const handleApprove = (caseId: string) => {
    updateStatusMutation.mutate({ id: caseId, status: "Pending" }); // Moves to Judge Allocation pool
  };

  const handleReject = () => {
    if (!selectedCase || !rejectReason) return;
    updateStatusMutation.mutate({ id: selectedCase.id, status: "Rejected", reason: rejectReason });
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-slate-950 font-['Outfit',sans-serif]">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="p-1.5 rounded-full bg-[#0071e3] text-white">
              <Scale className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold text-[#1d1d1f] dark:text-white">Faceless<span className="text-[#0071e3]">Scrutiny</span></span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/official/dashboard">
              <a className="text-sm font-medium text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white transition-colors">Dashboard</a>
            </Link>
             <ThemeToggle />
          </div>
        </div>
      </nav>

      <main className="py-10 px-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#1d1d1f] dark:text-white mb-2">Assigned Scrutiny Tasks</h1>
          <div className="flex items-center gap-2 text-[#86868b]">
             <UserX className="h-4 w-4" />
             <p>These cases are anonymized. Determine if they are valid for court admission.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-20">Loading tasks...</div>
        ) : cases?.length === 0 ? (
           <Card className="border-0 shadow-sm bg-white dark:bg-slate-900 text-center py-12">
             <CardContent>
                <div className="mb-4 flex justify-center text-green-500">
                   <CheckCircle2 className="h-12 w-12" />
                </div>
                <h3 className="text-xl font-semibold mb-2">All Caught Up!</h3>
                <p className="text-[#86868b]">You have no pending cases for scrutiny.</p>
             </CardContent>
           </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {cases?.map((c) => (
              <Card key={c.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white dark:bg-slate-900 overflow-hidden group">
                <CardHeader className="bg-slate-50 dark:bg-slate-800/50 pb-4">
                  <div className="flex justify-between items-start">
                    <Badge variant="outline" className="bg-white dark:bg-slate-900 backdrop-blur-md">
                      {c.caseNumber}
                    </Badge>
                    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-0">
                      Scrutiny Pending
                    </Badge>
                  </div>
                  <CardTitle className="mt-2 line-clamp-1">{c.title}</CardTitle>
                  <CardDescription>Filing District: {c.filingDistrict || 'Unknown'}</CardDescription>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="text-sm text-[#86868b]">
                    <span className="font-semibold text-[#1d1d1f] dark:text-gray-300">Description:</span>
                     <p className="mt-1 line-clamp-3">{c.description}</p>
                  </div>
                   <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 dark:bg-blue-900/20 w-fit px-2 py-1 rounded">
                      <UserX className="h-3 w-3" />
                      Citizen Identity Hidden
                   </div>
                </CardContent>
                <CardFooter className="pt-2 gap-3">
                   <Button onClick={() => handleApprove(c.id)} className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-xl">
                      <CheckCircle2 className="h-4 w-4 mr-2" /> Admit
                   </Button>
                   
                   <Dialog open={selectedCase?.id === c.id} onOpenChange={(open) => !open && setSelectedCase(null)}>
                      <DialogTrigger asChild>
                        <Button variant="destructive" onClick={() => setSelectedCase(c)} className="flex-1 rounded-xl">
                            <XCircle className="h-4 w-4 mr-2" /> Reject
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Reject Case Admission</DialogTitle>
                          <DialogDescription>
                            Please specify the reason for rejection. This will be shared with the filer.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="py-4 space-y-4">
                           <div className="space-y-2">
                              <Label>Reason for Rejection</Label>
                              <Select onValueChange={setRejectReason}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a reason" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Incomplete Documentation">Incomplete Documentation</SelectItem>
                                  <SelectItem value="Out of Jurisdiction">Out of Jurisdiction</SelectItem>
                                  <SelectItem value="Frivolous Filing">Frivolous Filing</SelectItem>
                                  <SelectItem value="Duplicate Case">Duplicate Case</SelectItem>
                                  <SelectItem value="Incorrect Format">Incorrect Format</SelectItem>
                                </SelectContent>
                              </Select>
                           </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setSelectedCase(null)}>Cancel</Button>
                          <Button variant="destructive" onClick={handleReject} disabled={!rejectReason}>Confirm Rejection</Button>
                        </DialogFooter>
                      </DialogContent>
                   </Dialog>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
