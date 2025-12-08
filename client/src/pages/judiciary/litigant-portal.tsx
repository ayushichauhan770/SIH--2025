import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { Scale, Search, Clock, Calendar, FileText, ChevronRight, Video, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Case, Hearing } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export default function LitigantPortal() {
  const { toast } = useToast();
  const [searchId, setSearchId] = useState("");
  const [caseId, setCaseId] = useState<string | null>(null);

  // Fetch all cases to find the mapped ID (in a real app, use a specific search endpoint)
  const { data: allCases } = useQuery<Case[]>({
    queryKey: ["/api/judiciary/cases"],
  });

  const { data: myCases } = useQuery<Case[]>({
    queryKey: ["/api/judiciary/my-cases"],
  });

  const { data: hearings } = useQuery<Hearing[]>({
    queryKey: [`/api/judiciary/hearings/${caseId}`],
    enabled: !!caseId,
  });

  const selectedCase = allCases?.find(c => c.caseNumber === searchId || c.id === searchId);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchId.trim()) return;

    const found = allCases?.find(c => c.caseNumber === searchId || c.id === searchId);
    if (found) {
      setCaseId(found.id);
      toast({
        title: "Case Found",
        description: `Viewing details for ${found.caseNumber}`,
      });
    } else {
      setCaseId(null);
      toast({
        title: "Case Not Found",
        description: "No case found with that ID or Case Number.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-slate-950 font-['Outfit',sans-serif]">
      {/* Navbar */}
      <nav className="fixed top-6 left-0 right-0 z-50 flex justify-center px-6 pointer-events-none">
        <div className="w-full max-w-7xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm rounded-full px-6 py-3 pointer-events-auto flex justify-between items-center transition-all duration-300">
          <Link href="/judiciary">
            <a className="flex items-center gap-3">
              <div className="p-1.5 rounded-full bg-[#0071e3] shadow-lg shadow-blue-500/20">
                <Scale className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-[#1d1d1f] dark:text-white">Judiciary<span className="text-[#0071e3]">AI</span></span>
            </a>
          </Link>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link href="/login">
              <Button className="rounded-full bg-[#1d1d1f] dark:bg-white text-white dark:text-[#1d1d1f] hover:bg-[#1d1d1f]/90 dark:hover:bg-white/90 px-6">
                Login
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-20 px-6 max-w-4xl mx-auto space-y-12">
        <div className="text-center space-y-6">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-[#1d1d1f] dark:text-white">
            Litigant <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Portal</span>
          </h1>
          <p className="text-xl text-[#86868b] max-w-2xl mx-auto">
            Track your case status, view hearing schedules, and submit feedback seamlessly.
          </p>
        </div>

        {/* Search */}
        <Card className="border-0 shadow-lg bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden">
          <CardContent className="p-8">
            <form onSubmit={handleSearch} className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#86868b]" />
                <Input 
                  placeholder="Enter Case Number or ID (e.g., CV-2023-001)" 
                  className="pl-12 h-14 rounded-2xl bg-[#F5F5F7] dark:bg-slate-800 border-0 focus-visible:ring-2 ring-[#0071e3] text-lg"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                />
              </div>
              <Button type="submit" size="lg" className="h-14 px-8 rounded-2xl bg-[#0071e3] hover:bg-[#0077ED] text-white">
                Track Case
              </Button>
            </form>
          </CardContent>
        {/* My Cases Section */}
        {myCases && myCases.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-[#1d1d1f] dark:text-white">My Active Cases</h2>
            <div className="grid gap-4">
              {myCases.map(c => (
                 <Card key={c.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setCaseId(c.id); setSearchId(c.caseNumber || ""); }}>
                   <CardContent className="p-6 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-lg">{c.title}</p>
                        <p className="text-sm text-gray-500">{c.caseNumber}</p>
                      </div>
                      <Badge variant={c.status === 'Pending' ? 'secondary' : 'default'}>{c.status}</Badge>
                   </CardContent>
                 </Card>
              ))}
            </div>
          </div>
        )}

        </Card>

        {/* Case Details */}
        {selectedCase && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Card className="border-0 shadow-sm bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl font-bold text-[#1d1d1f] dark:text-white">{selectedCase.title}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="bg-white dark:bg-slate-950">{selectedCase.caseNumber}</Badge>
                      <span>•</span>
                      <span>{selectedCase.type}</span>
                    </CardDescription>
                  </div>
                  <Badge className={`px-3 py-1 text-sm ${
                    selectedCase.status === 'Pending' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {selectedCase.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-[#86868b]">Description</p>
                    <p className="text-[#1d1d1f] dark:text-white">{selectedCase.description}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-[#86868b]">Filed Date</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-[#0071e3]" />
                      <p className="text-[#1d1d1f] dark:text-white">{new Date(selectedCase.filedDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-[#86868b]">Priority</p>
                    <p className={`font-bold ${selectedCase.priority === 'High' ? 'text-red-500' : 'text-[#1d1d1f] dark:text-white'}`}>
                      {selectedCase.priority}
                    </p>
                  </div>
                </div>

                {/* Hearing Timeline */}
                <div>
                  <h3 className="text-lg font-bold text-[#1d1d1f] dark:text-white mb-4 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-[#0071e3]" />
                    Hearing Schedule
                  </h3>
                  {hearings && hearings.length > 0 ? (
                    <div className="relative space-y-8 pl-8 before:absolute before:inset-0 before:ml-3 before:h-full before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                      {hearings.map((hearing, i) => (
                        <div key={hearing.id} className="relative">
                          <span className={`absolute left-[-39px] top-1 h-6 w-6 rounded-full border-4 border-white dark:border-slate-950 ${
                            hearing.status === 'Completed' ? 'bg-green-500' : 'bg-[#0071e3]'
                          }`} />
                          <div className="bg-[#F5F5F7] dark:bg-slate-800 p-4 rounded-2xl">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="font-bold text-[#1d1d1f] dark:text-white">Hearing #{hearings.length - i}</p>
                                <p className="text-sm text-[#86868b]">{new Date(hearing.date).toLocaleDateString()} at {new Date(hearing.date).toLocaleTimeString()}</p>
                              </div>
                              <Badge variant="secondary">{hearing.status}</Badge>
                            </div>
                            <div className="flex gap-4 mt-4">
                              {hearing.videoLink && (
                                <Button size="sm" variant="outline" className="gap-2 rounded-full">
                                  <Video className="h-4 w-4" /> Watch Recording
                                </Button>
                              )}
                              {hearing.status === 'Completed' && (
                                <Button size="sm" variant="outline" className="gap-2 rounded-full">
                                  <FileText className="h-4 w-4" /> View Order
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-[#F5F5F7] dark:bg-slate-800 rounded-2xl text-[#86868b]">
                      No hearings scheduled yet.
                    </div>
                  )}
                </div>

                {/* Feedback Section */}
                <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-3xl border border-blue-100 dark:border-blue-800/30 flex items-center justify-between">
                   <div>
                     <h4 className="font-bold text-[#1d1d1f] dark:text-white">Submti Feedback</h4>
                     <p className="text-sm text-[#86868b]">Help us improve judicial efficiency.</p>
                   </div>
                   <Button className="rounded-full bg-[#0071e3] hover:bg-[#0077ED] text-white">
                     <MessageSquare className="h-4 w-4 mr-2" /> Give Feedback
                   </Button>
                </div>

              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
