
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Scale, ArrowRight, Calendar } from "lucide-react";
import type { Case } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { useLocation } from "wouter";

export interface CaseCardProps {
  caseItem: Case;
  className?: string;
}

const statusConfig: Record<string, { color: string, bg: string }> = {
  "Pending": { color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-900/20" },
  "Allocated": { color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
  "Closed": { color: "text-green-600", bg: "bg-green-50 dark:bg-green-900/20" },
  "Scheduled": { color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/20" },
};

export function CaseCard({ caseItem, className }: CaseCardProps) {
  const [, setLocation] = useLocation();
  const status = statusConfig[caseItem.status] || statusConfig["Pending"];

  return (
    <Card
      className={`group relative overflow-hidden border-0 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all duration-300 rounded-[24px] ${className || ""}`}
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${status.bg.replace('bg-', 'bg-gradient-to-b from-')}-500 to-${status.bg.split('-')[1]}-600`} />
      
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3 pt-5 px-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-[#86868b] dark:text-slate-400 tracking-wider uppercase">
              #{caseItem.caseNumber}
            </span>
            <span className="text-[10px] text-[#86868b] dark:text-slate-500 font-medium">
              • {formatDistanceToNow(new Date(caseItem.filedDate), { addSuffix: true })}
            </span>
          </div>
          <h3 className="font-bold text-base text-[#1d1d1f] dark:text-white leading-tight">
            {caseItem.title}
          </h3>
        </div>

        <Badge 
          variant="secondary" 
          className={`${status.bg} ${status.color} border-0 font-medium px-2.5 py-0.5 rounded-full text-[10px] tracking-wide uppercase`}
        >
          {caseItem.status}
        </Badge>
      </CardHeader>

      <CardContent className="px-5 pb-3 space-y-3">
        <p className="text-xs text-[#1d1d1f] dark:text-slate-300 line-clamp-2 leading-relaxed font-medium">
          {caseItem.description}
        </p>

        <div className="flex flex-wrap gap-2">
           <div className="flex items-center gap-1 text-[10px] font-medium text-[#1d1d1f] bg-[#f5f5f7] dark:bg-slate-800 px-2 py-0.5 rounded-full">
              <Scale className="h-3 w-3" />
              <span>{caseItem.type}</span>
           </div>
           <div className="flex items-center gap-1 text-[10px] font-medium text-[#1d1d1f] bg-[#f5f5f7] dark:bg-slate-800 px-2 py-0.5 rounded-full">
              <Calendar className="h-3 w-3" />
              <span>{caseItem.priority} Priority</span>
           </div>
        </div>
      </CardContent>

      <CardFooter className="px-5 pb-5 pt-0 flex items-center justify-between gap-3">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setLocation(`/judiciary/cases/${caseItem.id}`)} 
          className="text-[#86868b] hover:text-[#0071e3] hover:bg-transparent pl-0 pr-0 h-auto font-medium transition-all group/btn text-xs p-0"
        >
          View Details
          <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover/btn:translate-x-0.5" />
        </Button>
      </CardFooter>
    </Card>
  );
}
