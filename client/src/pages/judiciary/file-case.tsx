import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ThemeToggle } from "@/components/theme-toggle";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Scale, ChevronLeft, Send, Gavel, FileText, CheckCircle2, Copy, ShieldCheck, IndianRupee } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { InsertCase } from "@shared/schema";
import type { Case } from "@shared/schema";

export default function FileCase() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedCase, setSubmittedCase] = useState<Case | null>(null);
  
  const [formData, setFormData] = useState<InsertCase>({
    title: "",
    description: "",
    type: "Civil",
    priority: "Medium",
  });

  const fileCaseMutation = useMutation({
    mutationFn: async (data: InsertCase) => {
      const res = await apiRequest("POST", "/api/judiciary/file-case", data);
      return res;
    },
    onSuccess: (data: Case) => {
      queryClient.invalidateQueries({ queryKey: ["/api/judiciary/cases"] });
      setSubmittedCase(data);
      toast({
        title: "Case Filed Successfully",
        description: `Case Number: ${data.caseNumber}`,
      });
      setIsSubmitting(false);
    },
    onError: (error: any) => {
      toast({
        title: "Submission Failed",
        description: error.message,
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);
    fileCaseMutation.mutate(formData);
  };

  const copyCaseNumber = () => {
    if (submittedCase?.caseNumber) {
      navigator.clipboard.writeText(submittedCase.caseNumber);
      toast({ title: "Copied to clipboard" });
    }
  };

  if (submittedCase) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] dark:bg-slate-950 font-['Outfit',sans-serif] flex items-center justify-center p-6">
        <Card className="max-w-md w-full border-0 shadow-2xl bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden">
          <CardContent className="pt-12 pb-8 px-8 text-center space-y-6">
            <div className="mx-auto h-24 w-24 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-6">
              <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-[#1d1d1f] dark:text-white">Case Filed Successfully!</h2>
              <p className="text-[#86868b]">Your legal case has been registered. The Faceless Scrutiny System is now processing it anonymously.</p>
            </div>

            <div className="bg-[#F5F5F7] dark:bg-slate-800 p-6 rounded-2xl space-y-2">
              <p className="text-xs uppercase tracking-wider font-bold text-[#86868b]">Case Number</p>
              <div className="flex items-center justify-center gap-3">
                <span className="text-2xl font-mono font-bold text-[#1d1d1f] dark:text-white">{submittedCase.caseNumber}</span>
                <Button variant="ghost" size="icon" onClick={copyCaseNumber} className="h-8 w-8 rounded-full hover:bg-white dark:hover:bg-slate-700">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-3 pt-4">
              <Button 
                onClick={() => setLocation("/judiciary/portal")}
                className="w-full h-12 rounded-full bg-[#0071e3] hover:bg-[#0077ED] text-white font-bold"
              >
                Track Case Status
              </Button>
              <Button 
                variant="outline"
                onClick={() => setLocation("/judiciary")}
                className="w-full h-12 rounded-full border-0 bg-transparent hover:bg-[#F5F5F7] dark:hover:bg-slate-800 text-[#1d1d1f] dark:text-white"
              >
                Return to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-slate-950 font-['Outfit',sans-serif]">
      {/* Navbar */}
      <nav className="fixed top-6 left-0 right-0 z-50 flex justify-center px-6 pointer-events-none">
        <div className="w-full max-w-7xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm rounded-full px-6 py-3 pointer-events-auto flex justify-between items-center transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-full bg-[#0071e3] shadow-lg shadow-blue-500/20">
              <Scale className="h-5 w-5 text-white" />
            </div>
            <Link href="/judiciary">
              <a className="text-xl font-bold tracking-tight text-[#1d1d1f] dark:text-white">Judiciary<span className="text-[#0071e3]">AI</span></a>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-20 px-6 max-w-3xl mx-auto">
        <div className="mb-8">
          <Link href="/judiciary">
            <a className="inline-flex items-center text-sm font-medium text-[#86868b] hover:text-[#0071e3] transition-colors mb-4">
              <ChevronLeft className="h-4 w-4 mr-1" /> Back to Dashboard
            </a>
          </Link>
          <h1 className="text-4xl font-bold text-[#1d1d1f] dark:text-white mb-2">File a Legal Case</h1>
          <p className="text-[#86868b]">Submit your case details for AI-driven blind allocation.</p>
        </div>

        <Card className="border-0 shadow-xl bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden">
          <CardHeader className="bg-slate-50 dark:bg-slate-800/50 pb-8 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-[#0071e3] flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                <Gavel className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-[#1d1d1f] dark:text-white">Case Information</CardTitle>
                <CardDescription>
                  Submit your case details below. Our <strong>Faceless Scrutiny System</strong> will automatically assign a scrutiny officer from a different district.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
               <div className="rounded-lg border border-blue-100 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-900 p-4">
                <div className="flex items-center gap-2 font-semibold text-blue-900 dark:text-blue-200">
                  <ShieldCheck className="h-5 w-5" />
                  AI Pre-Check Active
                </div>
                <p className="text-sm mt-1 text-blue-800 dark:text-blue-300">Your description will be analyzed for completeness.</p>
              </div>
              <div className="rounded-lg border border-green-100 bg-green-50 dark:bg-green-900/20 dark:border-green-900 p-4">
                <div className="flex items-center gap-2 font-semibold text-green-900 dark:text-green-200">
                  <IndianRupee className="h-5 w-5" />
                  Token Fee: ₹100
                </div>
                <p className="text-sm mt-1 text-green-800 dark:text-green-300">Simulated Fee for Spam Prevention.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-[#1d1d1f] dark:text-white font-medium">Case Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., State vs. John Doe"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="h-12 rounded-xl bg-[#F5F5F7] dark:bg-slate-800 border-transparent focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="type" className="text-[#1d1d1f] dark:text-white font-medium">Case Type</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger className="h-12 rounded-xl bg-[#F5F5F7] dark:bg-slate-800 border-transparent focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Civil">Civil</SelectItem>
                      <SelectItem value="Criminal">Criminal</SelectItem>
                      <SelectItem value="Constitutional">Constitutional</SelectItem>
                      <SelectItem value="Family">Family</SelectItem>
                      <SelectItem value="Corporate">Corporate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority" className="text-[#1d1d1f] dark:text-white font-medium">Priority Level</Label>
                  <Select 
                    value={formData.priority || undefined} 
                    onValueChange={(value) => setFormData({ ...formData, priority: value })}
                  >
                    <SelectTrigger className="h-12 rounded-xl bg-[#F5F5F7] dark:bg-slate-800 border-transparent focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-[#1d1d1f] dark:text-white font-medium">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Provide a detailed description of the case (min 5 words)..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="min-h-[150px] rounded-xl bg-[#F5F5F7] dark:bg-slate-800 border-transparent focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20 resize-none p-4"
                />
              </div>

              <div className="pt-4">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full h-12 rounded-full bg-[#0071e3] hover:bg-[#0077ED] text-white font-bold shadow-lg shadow-blue-500/30 transition-all hover:scale-[1.02]"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                      Submitting...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Send className="h-4 w-4" />
                      Submit Case for Allocation
                    </span>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
