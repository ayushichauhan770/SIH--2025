import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, MessageSquare, FileImage, ArrowRight } from "lucide-react";
import type { Application } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

export interface ApplicationCardProps {
  application: Application;
  onViewDetails: () => void;
  showActions?: boolean;
  onAccept?: () => void;
  onUpdate?: () => void;
  className?: string;
}

const statusConfig: Record<string, { color: string, bg: string, border: string }> = {
  "Submitted": { color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20", border: "border-blue-200 dark:border-blue-800" },
  "Assigned": { color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/20", border: "border-purple-200 dark:border-purple-800" },
  "In Progress": { color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-900/20", border: "border-orange-200 dark:border-orange-800" },
  "Approved": { color: "text-green-600", bg: "bg-green-50 dark:bg-green-900/20", border: "border-green-200 dark:border-green-800" },
  "Rejected": { color: "text-red-600", bg: "bg-red-50 dark:bg-red-900/20", border: "border-red-200 dark:border-red-800" },
  "Auto-Approved": { color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20", border: "border-emerald-200 dark:border-emerald-800" },
  "Auto-Approved (Documents Verified by System)": { color: "text-teal-600", bg: "bg-teal-50 dark:bg-teal-900/20", border: "border-teal-200 dark:border-teal-800" },
};

const priorityConfig: Record<string, { color: string, bg: string }> = {
  "high": { color: "text-red-700", bg: "bg-red-100 dark:bg-red-900/40" },
  "medium": { color: "text-orange-700", bg: "bg-orange-100 dark:bg-orange-900/40" },
  "low": { color: "text-slate-600", bg: "bg-slate-100 dark:bg-slate-800" },
  // Legacy support for old capitalized values
  "High": { color: "text-red-700", bg: "bg-red-100 dark:bg-red-900/40" },
  "Medium": { color: "text-orange-700", bg: "bg-orange-100 dark:bg-orange-900/40" },
  "Low": { color: "text-slate-600", bg: "bg-slate-100 dark:bg-slate-800" },
  "Normal": { color: "text-slate-600", bg: "bg-slate-100 dark:bg-slate-800" },
};

export function ApplicationCard({ application, onViewDetails, showActions, onAccept, onUpdate, className }: ApplicationCardProps) {
  const hasRemarks = application.remarks && application.remarks.trim().length > 0;
  const hasImage = application.image && application.image.trim().length > 0;
  const status = statusConfig[application.status] || statusConfig["Submitted"];
  const priority = priorityConfig[(application.priority || "low").toLowerCase()] || priorityConfig["low"];

  return (
    <Card
      className={`group relative overflow-hidden border-0 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all duration-300 rounded-[24px] ${className || ""}`}
      data-testid={`card-application-${application.id}`}
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${status.bg.replace('bg-', 'bg-gradient-to-b from-')}-500 to-${status.bg.split('-')[1]}-600`} />

      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3 pt-5 px-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-[#86868b] dark:text-slate-400 tracking-wider uppercase">
              #{application.trackingId}
            </span>
            <span className="text-[10px] text-[#86868b] dark:text-slate-500 font-medium">
              • {formatDistanceToNow(new Date(application.submittedAt), { addSuffix: true })}
            </span>
          </div>
          <h3 className="font-bold text-base text-[#1d1d1f] dark:text-white leading-tight">
            {application.applicationType}
          </h3>
        </div>

        <Badge
          variant="secondary"
          className={`${status.bg} ${status.color} border-0 font-medium px-2.5 py-0.5 rounded-full text-[10px] tracking-wide uppercase`}
          data-testid={`badge-status-${application.status.toLowerCase().replace(/\s+/g, '-')}`}
        >
          {application.status}
        </Badge>
      </CardHeader>

      <CardContent className="px-5 pb-3 space-y-3">
        <p className="text-xs text-[#1d1d1f] dark:text-slate-300 line-clamp-2 leading-relaxed font-medium">
          {application.description}
        </p>

        <div className="flex flex-wrap gap-2">
          {application.officialId && (
            <div className="flex items-center gap-1 text-[10px] font-medium text-[#1d1d1f] bg-[#f5f5f7] dark:bg-slate-800 px-2 py-0.5 rounded-full">
              <User className="h-3 w-3" />
              <span>Assigned</span>
            </div>
          )}
          {hasRemarks && (
            <div className="flex items-center gap-1 text-[10px] font-medium text-[#0071e3] bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full">
              <MessageSquare className="h-3 w-3" />
              <span>Has Notes</span>
            </div>
          )}
          {hasImage && (
            <div className="flex items-center gap-1 text-[10px] font-medium text-purple-600 bg-purple-50 dark:bg-purple-900/20 px-2 py-0.5 rounded-full">
              <FileImage className="h-3 w-3" />
              <span>Image</span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="px-5 pb-5 pt-0 flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onViewDetails}
          className="text-[#86868b] hover:text-[#0071e3] hover:bg-transparent pl-0 pr-0 h-auto font-medium transition-all group/btn text-xs p-0"
          data-testid={`button-view-${application.id}`}
        >
          View Details
          <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover/btn:translate-x-0.5" />
        </Button>

        <div className="flex gap-2">
          {showActions && onAccept && application.status === "Submitted" && (
            <Button size="sm" onClick={onAccept} className="bg-[#0071e3] hover:bg-[#0077ED] text-white shadow-sm rounded-full px-3 h-7 text-[10px] font-medium" data-testid={`button-accept-${application.id}`}>
              Accept
            </Button>
          )}
          {showActions && onUpdate && application.status !== "Submitted" && (
            <Button size="sm" onClick={onUpdate} variant="outline" className="shadow-sm rounded-full px-3 h-7 text-[10px] font-medium" data-testid={`button-update-${application.id}`}>
              Update
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
