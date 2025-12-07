import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Shield, Scale, Gavel, Play, CheckCircle2, AlertCircle, Clock, TrendingUp, Users, Menu, Search, Bell, ChevronRight, AlertTriangle, BarChart3, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Judge, Case } from "@shared/schema";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

export default function JudiciaryDashboard() {
  const { toast } = useToast();
  const [isAllocating, setIsAllocating] = useState(false);
  const [allocationResults, setAllocationResults] = useState<any[]>([]);

  const { data: judges, isLoading: judgesLoading } = useQuery<Judge[]>({
    queryKey: ["/api/judiciary/judges"],
  });

  const { data: cases, isLoading: casesLoading } = useQuery<Case[]>({
    queryKey: ["/api/judiciary/cases"],
  });

  const allocateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/judiciary/allocate", {});
      return res.json();
    },
    onSuccess: (data) => {
      setAllocationResults(data.allocations);
      queryClient.invalidateQueries({ queryKey: ["/api/judiciary/cases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/judiciary/judges"] });
      toast({
        title: "Allocation Complete",
        description: `Successfully allocated ${data.allocations.length} cases.`,
      });
      setIsAllocating(false);
    },
    onError: (error: any) => {
      toast({
        title: "Allocation Failed",
        description: error.message,
        variant: "destructive",
      });
      setIsAllocating(false);
    },
  });

  const handleStartAllocation = () => {
    setIsAllocating(true);
    // Simulate "AI Processing" delay
    setTimeout(() => {
      allocateMutation.mutate();
    }, 2000);
  };

  const pendingCases = cases?.filter(c => c.status === "Pending") || [];
  const allocatedCases = cases?.filter(c => c.status === "Allocated") || [];

  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-slate-950 font-['Outfit',sans-serif]">
      {/* Navbar */}
      <nav className="fixed top-6 left-0 right-0 z-50 flex justify-center px-6 pointer-events-none">
        <div className="w-full max-w-7xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm rounded-full px-6 py-3 pointer-events-auto flex justify-between items-center transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-full bg-[#0071e3] shadow-lg shadow-blue-500/20">
              <Scale className="h-5 w-5 text-white" />
            </div>
            <Link href="/">
              <a className="text-xl font-bold tracking-tight text-[#1d1d1f] dark:text-white">Judiciary<span className="text-[#0071e3]">AI</span></a>
            </Link>
          </div>

          <div className="hidden md:flex gap-8 h-full items-center">
            <Link href="/">
              <a className="text-[#1d1d1f] dark:text-white text-sm font-medium hover:text-[#0071e3] transition-colors">Home</a>
            </Link>
            <a href="#metrics" className="text-[#86868b] text-sm font-medium hover:text-[#0071e3] transition-colors">Metrics</a>
            <a href="#allocation" className="text-[#86868b] text-sm font-medium hover:text-[#0071e3] transition-colors">Allocation</a>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button className="rounded-full bg-[#1d1d1f] dark:bg-white text-white dark:text-[#1d1d1f] hover:bg-[#1d1d1f]/90 dark:hover:bg-white/90 px-6">
              Login
            </Button>
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-6 mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-sm font-medium text-[#1d1d1f] dark:text-white">Live System Status: Operational</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-[#1d1d1f] dark:text-white">
            Blind Justice via <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">AI Allocation</span>
          </h1>
          <p className="text-xl text-[#86868b] max-w-2xl mx-auto leading-relaxed">
            Eliminating bias through algorithmic case distribution. Ensuring every case is heard by the right judge, at the right time.
          </p>
        </div>

        {/* Allocation Simulator */}
        <div id="allocation" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 border-0 shadow-xl bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-900/10 dark:to-purple-900/10 pointer-events-none" />
            <CardHeader className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold text-[#1d1d1f] dark:text-white">AI Allocation Engine</CardTitle>
                  <CardDescription>Real-time blind case assignment simulation</CardDescription>
                </div>
                <Button 
                  onClick={handleStartAllocation} 
                  disabled={isAllocating || pendingCases.length === 0}
                  className={`rounded-full px-8 h-12 font-bold transition-all duration-500 ${
                    isAllocating 
                      ? "bg-slate-100 text-slate-400 dark:bg-slate-800" 
                      : "bg-[#0071e3] hover:bg-[#0077ED] text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105"
                  }`}
                >
                  {isAllocating ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></span>
                      Processing...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Play className="h-4 w-4 fill-current" />
                      Start Allocation
                    </span>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="relative min-h-[400px]">
              {isAllocating ? (
                <div className="flex flex-col items-center justify-center h-full py-20 space-y-8">
                  <div className="relative">
                    <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-20 animate-pulse rounded-full"></div>
                    <Scale className="h-32 w-32 text-[#0071e3] animate-bounce relative z-10" />
                  </div>
                  <div className="space-y-2 text-center">
                    <h3 className="text-2xl font-bold text-[#1d1d1f] dark:text-white animate-pulse">Analyzing Case Complexity...</h3>
                    <p className="text-[#86868b]">Matching with judge specialization & workload</p>
                  </div>
                  <div className="flex gap-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-2 w-2 bg-[#0071e3] rounded-full animate-ping" style={{ animationDelay: `${i * 200}ms` }} />
                    ))}
                  </div>
                </div>
              ) : allocationResults.length > 0 ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="flex items-center gap-2 text-green-600 bg-green-50 dark:bg-green-900/20 p-4 rounded-2xl mb-6">
                    <CheckCircle2 className="h-6 w-6" />
                    <span className="font-bold">Allocation Successful! {allocationResults.length} cases assigned.</span>
                  </div>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {allocationResults.map((res, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-[#F5F5F7] dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center font-bold text-[#1d1d1f] dark:text-white shadow-sm">
                            {i + 1}
                          </div>
                          <div>
                            <p className="font-bold text-[#1d1d1f] dark:text-white">{res.caseTitle}</p>
                            <p className="text-xs text-[#86868b] uppercase tracking-wider">Case ID: {res.caseId.slice(0, 8)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="h-px w-12 bg-slate-300 dark:bg-slate-600 hidden md:block"></div>
                          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-full shadow-sm">
                            <Gavel className="h-4 w-4 text-[#0071e3]" />
                            <span className="text-sm font-bold text-[#1d1d1f] dark:text-white">{res.judgeName}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-20 text-center space-y-4">
                  <div className="h-24 w-24 rounded-full bg-[#F5F5F7] dark:bg-slate-800 flex items-center justify-center">
                    <Shield className="h-10 w-10 text-[#86868b]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#1d1d1f] dark:text-white">System Idle</h3>
                    <p className="text-[#86868b]">{pendingCases.length} cases pending allocation</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pending Queue */}
          <Card className="bg-white dark:bg-slate-900 border-0 shadow-lg rounded-[32px] overflow-hidden flex flex-col h-full">
            <CardHeader className="bg-[#F5F5F7] dark:bg-slate-800/50 pb-6">
              <CardTitle className="text-lg font-bold text-[#1d1d1f] dark:text-white flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-500" />
                Pending Queue
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-y-auto max-h-[400px]">
              {pendingCases.length === 0 ? (
                <div className="p-8 text-center text-[#86868b]">No pending cases</div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {pendingCases.map(c => (
                    <div key={c.id} className="p-4 hover:bg-[#F5F5F7] dark:hover:bg-slate-800 transition-colors">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-[#1d1d1f] dark:text-white text-sm line-clamp-1">{c.title}</span>
                        <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-white dark:bg-slate-900">{c.type}</Badge>
                      </div>
                      <div className="flex justify-between items-center text-xs text-[#86868b]">
                        <span>{new Date(c.filedDate).toLocaleDateString()}</span>
                        <span className={`font-bold ${c.priority === 'High' ? 'text-red-500' : 'text-orange-500'}`}>{c.priority}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Judge Performance Metrics - Advanced Dashboard */}
        <div id="metrics" className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-[#1d1d1f] dark:text-white">Judicial Analytics</h2>
              <p className="text-[#86868b]">Real-time performance metrics and efficiency tracking</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="rounded-full">Daily</Button>
              <Button variant="outline" className="rounded-full bg-[#1d1d1f] text-white dark:bg-white dark:text-[#1d1d1f] border-0">Monthly</Button>
            </div>
          </div>

          {/* Top Level Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
             <Card className="border-0 shadow-sm bg-white dark:bg-slate-900 rounded-[24px]">
                <CardContent className="p-6 flex items-center justify-between">
                   <div>
                     <p className="text-sm font-medium text-[#86868b]">Avg Disposal Rate</p>
                     <p className="text-3xl font-bold text-[#1d1d1f] dark:text-white mt-1">
                       {judges?.length ? Math.round(judges.reduce((acc, j) => acc + (j.casesDisposed || 0), 0) / judges.length) : 0}
                     </p>
                   </div>
                   <div className="h-12 w-12 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                     <Activity className="h-6 w-6 text-blue-500" />
                   </div>
                </CardContent>
             </Card>
             <Card className="border-0 shadow-sm bg-white dark:bg-slate-900 rounded-[24px]">
                <CardContent className="p-6 flex items-center justify-between">
                   <div>
                     <p className="text-sm font-medium text-[#86868b]">Avg Time/Case</p>
                     <p className="text-3xl font-bold text-[#1d1d1f] dark:text-white mt-1">
                       {judges?.length ? Math.round(judges.reduce((acc, j) => acc + j.avgResolutionTime, 0) / judges.length) : 0} <span className="text-sm text-[#86868b] font-normal">days</span>
                     </p>
                   </div>
                   <div className="h-12 w-12 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                     <Clock className="h-6 w-6 text-purple-500" />
                   </div>
                </CardContent>
             </Card>
             <Card className="border-0 shadow-sm bg-white dark:bg-slate-900 rounded-[24px]">
                <CardContent className="p-6 flex items-center justify-between">
                   <div>
                     <p className="text-sm font-medium text-[#86868b]">Total Pending</p>
                     <p className="text-3xl font-bold text-[#1d1d1f] dark:text-white mt-1">
                       {judges?.reduce((acc, j) => acc + (j.casesPending || 0), 0) || 0}
                     </p>
                   </div>
                   <div className="h-12 w-12 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
                     <AlertCircle className="h-6 w-6 text-orange-500" />
                   </div>
                </CardContent>
             </Card>
             <Card className="border-0 shadow-sm bg-white dark:bg-slate-900 rounded-[24px]">
                <CardContent className="p-6 flex items-center justify-between">
                   <div>
                     <p className="text-sm font-medium text-[#86868b]">Public Trust</p>
                     <p className="text-3xl font-bold text-[#1d1d1f] dark:text-white mt-1">
                        4.2 <span className="text-sm text-[#86868b] font-normal">/ 5.0</span>
                     </p>
                   </div>
                   <div className="h-12 w-12 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                     <Users className="h-6 w-6 text-green-500" />
                   </div>
                </CardContent>
             </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Efficiency Leaderboard */}
            <Card className="border-0 shadow-sm bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-[#0071e3]" />
                  Efficiency Leaderboard
                </CardTitle>
                <CardDescription>Judges ranked by disposal rate & efficiency score</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[...(judges || [])].sort((a, b) => (b.performanceScore || 0) - (a.performanceScore || 0)).map(j => ({
                        name: j.name.split(' ')[1] || j.name, // Short name
                        score: j.performanceScore || 0,
                        fill: (j.performanceScore || 0) < 50 ? '#ef4444' : '#0071e3'
                      }))}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                      <XAxis type="number" domain={[0, 100]} hide />
                      <YAxis dataKey="name" type="category" width={100} tick={{fill: '#64748b', fontSize: 12}} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        cursor={{fill: 'transparent'}}
                      />
                      <Bar dataKey="score" radius={4} barSize={20} background={{ fill: '#f1f5f9', radius: 4 }} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Red Flags & Performance Radar */}
            <div className="space-y-6">
              {/* Red Flag Alerts */}
              <Card className="border-0 shadow-sm bg-red-50 dark:bg-red-900/10 rounded-[32px] overflow-hidden border-l-4 border-red-500">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400 text-lg">
                    <AlertTriangle className="h-5 w-5" />
                    Performance Alerts (Red Flags)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {judges?.filter(j => (j.performanceScore || 0) < 50 || (j.casesPending || 0) > 50).map(j => (
                      <div key={j.id} className="flex items-center justify-between bg-white dark:bg-slate-950 p-3 rounded-xl shadow-sm">
                        <div className="flex items-center gap-3">
                           <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 font-bold text-xs">
                             !
                           </div>
                           <div>
                             <p className="font-bold text-sm text-[#1d1d1f] dark:text-white">{j.name}</p>
                             <p className="text-xs text-red-500">
                               {(j.casesPending || 0) > 50 ? "High Backlog" : "Low Efficiency"}
                             </p>
                           </div>
                        </div>
                        <Badge variant="destructive" className="rounded-full px-2 py-0.5 text-[10px]">Action Required</Badge>
                      </div>
                    ))}
                    {!judges?.some(j => (j.performanceScore || 0) < 50 || (j.casesPending || 0) > 50) && (
                      <p className="text-sm text-green-600 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" /> No systemic issues detected.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Case Disposal Trend (Simulated) */}
               <Card className="border-0 shadow-sm bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden">
                  <CardHeader className="pb-2">
                     <CardTitle className="text-lg">Avg Resolution Time Comparison</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[180px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={judges?.map(j => ({ name: j.name, time: j.avgResolutionTime }))}>
                           <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                           <XAxis dataKey="name" tick={{fontSize: 10}} interval={0} tickFormatter={(val) => val.split(' ')[1] || val} />
                           <YAxis hide />
                           <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                           <Bar dataKey="time" fill="#a855f7" radius={[4, 4, 0, 0]} barSize={30} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
               </Card>
            </div>
          </div>

          {/* Individual Judge Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {judges?.map(judge => (
              <Card key={judge.id} className="border-0 shadow-sm hover:shadow-xl transition-all duration-300 bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden group">
                <CardContent className="p-0">
                  <div className="p-6 flex items-center gap-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center text-2xl font-bold text-[#86868b]">
                      {judge.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-[#1d1d1f] dark:text-white group-hover:text-[#0071e3] transition-colors">
                        {judge.name}
                      </h3>
                      <p className="text-[#86868b] text-sm font-medium">{judge.specialization}</p>
                    </div>
                    <div className={`ml-auto px-3 py-1 rounded-full text-xs font-bold ${
                      judge.status === 'Available' 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}>
                      {judge.status}
                    </div>
                  </div>
                  
                  <div className="p-6 grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <p className="text-xs text-[#86868b] uppercase tracking-wider font-bold">Performance</p>
                      <div className="flex items-end gap-2">
                        <span className={`text-3xl font-bold ${
                          (judge.performanceScore || 0) < 50 ? 'text-red-500' : 'text-[#1d1d1f] dark:text-white'
                        }`}>
                          {judge.performanceScore}
                        </span>
                        <span className="text-sm text-green-500 font-bold mb-1">/100</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-2">
                        <div 
                          className={`h-1.5 rounded-full ${
                             (judge.performanceScore || 0) < 50 ? 'bg-red-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${judge.performanceScore}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs text-[#86868b] uppercase tracking-wider font-bold">Avg Resolution</p>
                      <div className="flex items-end gap-2">
                        <span className="text-3xl font-bold text-[#1d1d1f] dark:text-white">{judge.avgResolutionTime}</span>
                        <span className="text-sm text-[#86868b] mb-1">days</span>
                      </div>
                    </div>

                    <div className="col-span-2 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                      <div className="flex items-center gap-2 text-sm text-[#86868b]">
                        <Gavel className="h-4 w-4" />
                        <span>{judge.casesDisposed} disposed</span>
                        <span className="text-xs">•</span>
                        <span>{judge.casesPending} pending</span>
                      </div>
                      <Button variant="ghost" size="sm" className="rounded-full text-[#0071e3] hover:bg-blue-50 dark:hover:bg-blue-900/20">
                        View Profile <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
