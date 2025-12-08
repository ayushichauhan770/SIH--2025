import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Calendar, FileText, Scale, Clock, AlertTriangle, Video, MapPin, User, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { Case, Hearing } from "@shared/schema";
import { cn } from "@/lib/utils";

const statusConfig: Record<string, { bg: string; color: string; icon: any }> = {
  "Pending": { bg: "bg-amber-100", color: "text-amber-700", icon: Clock },
  "Allocated": { bg: "bg-blue-100", color: "text-blue-700", icon: User },
  "Scheduled": { bg: "bg-purple-100", color: "text-purple-700", icon: Calendar },
  "Disposed": { bg: "bg-green-100", color: "text-green-700", icon: CheckCircle2 },
};

export default function CaseDetails({ params }: { params: { id: string } }) {
  const [location, setLocation] = useLocation();
  const id = params.id;

  const { data: caseItem, isLoading: caseLoading } = useQuery<Case>({
    queryKey: [`/api/judiciary/cases/${id}`],
  });

  const { data: hearings, isLoading: hearingsLoading } = useQuery<Hearing[]>({
    queryKey: [`/api/judiciary/hearings/${id}`],
    enabled: !!caseItem,
  });

  if (caseLoading) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] p-4 md:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <Skeleton className="h-12 w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <Skeleton className="h-64 w-full rounded-2xl" />
              <Skeleton className="h-96 w-full rounded-2xl" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-48 w-full rounded-2xl" />
              <Skeleton className="h-64 w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!caseItem) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="bg-red-100 p-4 rounded-full inline-flex">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-[#1d1d1f]">Case Not Found</h2>
          <Button onClick={() => setLocation("/citizen/dashboard")}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  const status = statusConfig[caseItem.status || "Pending"] || statusConfig["Pending"];
  const StatusIcon = status.icon;

  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-slate-950 font-sans pb-20">
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setLocation("/citizen/dashboard")}
              className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ArrowLeft className="h-5 w-5 text-[#1d1d1f] dark:text-white" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-[#1d1d1f] dark:text-white">Case Details</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">#{caseItem.caseNumber}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 space-y-8">
        
        {/* Top Summary Card */}
        <Card className="rounded-[24px] border-0 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
          <div className={`h-2 w-full ${status.bg.replace('bg-', 'bg-gradient-to-r from-')}-500 to-${status.bg.split('-')[1]}-600`} />
          <CardHeader className="pb-4">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="space-y-2">
                <div className="flex gap-2 mb-1">
                  <Badge variant="outline" className="rounded-full border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium text-[10px] uppercase tracking-wider">
                    {caseItem.type}
                  </Badge>
                  <Badge variant="outline" className={cn("rounded-full border-0 font-medium text-[10px] uppercase tracking-wider", status.bg, status.color)}>
                    {caseItem.status}
                  </Badge>
                </div>
                <CardTitle className="text-2xl md:text-3xl font-bold text-[#1d1d1f] dark:text-white leading-tight">
                  {caseItem.title}
                </CardTitle>
                <CardDescription className="text-base text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
                  {caseItem.description}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Filed Date</span>
              <div className="flex items-center gap-2 text-sm font-medium text-[#1d1d1f] dark:text-slate-200">
                <Calendar className="h-4 w-4 text-blue-500" />
                {format(new Date(caseItem.filedDate), "dd MMM, yyyy")}
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Priority</span>
              <div className="flex items-center gap-2 text-sm font-medium text-[#1d1d1f] dark:text-slate-200">
                <AlertTriangle className={cn("h-4 w-4", caseItem.priority === "High" ? "text-red-500" : "text-amber-500")} />
                {caseItem.priority}
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Case Number</span>
              <div className="flex items-center gap-2 text-sm font-medium text-[#1d1d1f] dark:text-slate-200">
                <FileText className="h-4 w-4 text-purple-500" />
                {caseItem.caseNumber}
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Assigned Judge</span>
              <div className="flex items-center gap-2 text-sm font-medium text-[#1d1d1f] dark:text-slate-200">
                <Scale className="h-4 w-4 text-slate-500" />
                {caseItem.allocatedJudgeId ? "Justice Assigned" : "Pending Allocation"}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hearings Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-lg font-bold text-[#1d1d1f] dark:text-white flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Case Timeline
            </h3>

            {hearingsLoading ? (
               <Skeleton className="h-48 w-full rounded-2xl" />
            ) : hearings && hearings.length > 0 ? (
              <div className="relative space-y-8 pl-8 before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                {hearings.map((hearing, i) => (
                  <div key={hearing.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-white bg-slate-100 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 text-slate-500 group-[.is-active]:bg-blue-500 group-[.is-active]:border-blue-500 group-[.is-active]:text-white z-10 absolute left-0 md:static -translate-x-1/2">
                      <Calendar className="w-4 h-4" />
                    </div>
                    
                    <Card className="w-[calc(100%-4rem)] md:w-[calc(50%-2rem)] p-4 rounded-2xl border-0 shadow-sm bg-white dark:bg-slate-900 group-hover:shadow-md transition-all ml-10 md:ml-0">
                       <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
                            {format(new Date(hearing.date), "dd MMM yyyy")}
                          </span>
                          <span className={cn("text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full", 
                            hearing.status === "Completed" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                          )}>
                            {hearing.status}
                          </span>
                       </div>
                       <p className="text-sm font-medium text-[#1d1d1f] dark:text-slate-200">
                         Hearing Scheduled
                       </p>
                       {hearing.videoLink && (
                         <Button variant="link" className="px-0 h-auto text-xs mt-2 text-blue-600 flex items-center gap-1">
                           <Video className="h-3 w-3" />
                           View Recording
                         </Button>
                       )}
                    </Card>
                  </div>
                ))}
              </div>
            ) : (
               <Card className="rounded-2xl border-dashed border-2 border-slate-200 dark:border-slate-800 bg-transparent shadow-none p-8 flex flex-col items-center justify-center text-center">
                  <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-full mb-3">
                    <Calendar className="h-6 w-6 text-slate-400" />
                  </div>
                  <h4 className="text-sm font-semibold text-[#1d1d1f] dark:text-white">No hearings scheduled yet</h4>
                  <p className="text-xs text-slate-500">Upcoming hearings will appear here once assigned.</p>
               </Card>
            )}
          </div>

          <div className="space-y-6">
             <h3 className="text-lg font-bold text-[#1d1d1f] dark:text-white flex items-center gap-2">
               <Scale className="h-5 w-5 text-purple-600" />
               Judge Profile
             </h3>
             
             {caseItem.allocatedJudgeId ? (
               <Card className="rounded-[24px] border-0 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
                 <div className="bg-gradient-to-br from-purple-600 to-indigo-700 h-24 relative">
                   <div className="absolute -bottom-8 left-6">
                     <div className="h-16 w-16 rounded-full bg-white dark:bg-slate-800 p-1 shadow-md">
                       <div className="h-full w-full rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                         <User className="h-8 w-8" />
                       </div>
                     </div>
                   </div>
                 </div>
                 <CardContent className="pt-10 pb-6 px-6">
                    <h4 className="text-lg font-bold text-[#1d1d1f] dark:text-white">Assigned Judge</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Official Judicary Profile</p>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm">
                        <MapPin className="h-4 w-4 text-slate-400" />
                        <span className="text-slate-700 dark:text-slate-300">District Court, New Delhi</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                         <CheckCircle2 className="h-4 w-4 text-green-500" />
                         <span className="text-slate-700 dark:text-slate-300">98% Case Resolution Rate</span>
                      </div>
                    </div>

                    <Separator className="my-4" />
                    <Button className="w-full rounded-full" variant="outline">View Full Profile</Button>
                 </CardContent>
               </Card>
             ) : (
                <Card className="rounded-[24px] border-0 shadow-sm bg-white dark:bg-slate-900 p-6 text-center space-y-4">
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-full inline-flex">
                    <Scale className="h-8 w-8 text-purple-500" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#1d1d1f] dark:text-white">Awaiting Assignment</h4>
                    <p className="text-xs text-slate-500 mt-1">A judge will be allocated automatically based on availability and case priority.</p>
                  </div>
                </Card>
             )}
          </div>
        </div>

      </div>
    </div>
  );
}
