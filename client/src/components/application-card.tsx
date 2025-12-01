import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Eye, User, MessageSquare, AlertTriangle, FileImage } from "lucide-react";
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

const statusColors: Record<string, string> = {
  "Submitted": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  "Assigned": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  "In Progress": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  "Approved": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  "Rejected": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  "Auto-Approved": "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
};

const priorityColors: Record<string, string> = {
  "High": "bg-red-500 text-white border-red-600",
  "Medium": "bg-orange-500 text-white border-orange-600",
  "Normal": "bg-gray-400 text-white border-gray-500",
};

const borderColors: Record<string, string> = {
  "Submitted": "border-l-blue-500",
  "Assigned": "border-l-purple-500",
  "In Progress": "border-l-yellow-500",
  "Approved": "border-l-green-500",
  "Rejected": "border-l-red-500",
  "Auto-Approved": "border-l-emerald-500",
};

const cardBackgroundColors: Record<string, string> = {
  "Submitted": "bg-gradient-to-br from-white to-blue-50/30 dark:from-slate-800 dark:to-blue-900/10",
  "Assigned": "bg-gradient-to-br from-white to-purple-50/30 dark:from-slate-800 dark:to-purple-900/10",
  "In Progress": "bg-gradient-to-br from-white to-yellow-50/30 dark:from-slate-800 dark:to-yellow-900/10",
  "Approved": "bg-gradient-to-br from-white to-green-50/30 dark:from-slate-800 dark:to-green-900/10",
  "Rejected": "bg-gradient-to-br from-white to-red-50/30 dark:from-slate-800 dark:to-red-900/10",
  "Auto-Approved": "bg-gradient-to-br from-white to-emerald-50/30 dark:from-slate-800 dark:to-emerald-900/10",
};

export function ApplicationCard({ application, onViewDetails, showActions, onAccept, onUpdate, className }: ApplicationCardProps) {
  const hasRemarks = application.remarks && application.remarks.trim().length > 0;
  const hasImage = application.image && application.image.trim().length > 0;

  return (
    <Card
      className={`transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl shadow-md rounded-lg overflow-hidden border-l-4 ${borderColors[application.status] || "border-l-gray-500"} ${cardBackgroundColors[application.status] || "bg-white dark:bg-slate-800"} ${className || ""}`}
      data-testid={`card-application-${application.id}`}>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 pb-2 bg-gradient-to-r from-gray-50 to-white dark:from-slate-800 dark:to-slate-800/50 border-b border-gray-100 dark:border-gray-800/50">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${statusColors[application.status].split(" ")[0].replace("bg-", "bg-")}`} />
            <code className="text-sm font-mono font-semibold text-foreground" data-testid={`text-tracking-${application.trackingId}`}>
              {application.trackingId}
            </code>
          </div>
          <p className="text-xs text-muted-foreground font-medium">
            {application.applicationType}
          </p>
        </div>
        <div className="flex flex-wrap gap-1">
          {(application.escalationLevel || 0) > 0 && (
            <div className="flex items-center justify-center mr-1" title="Escalated Application">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            </div>
          )}
          <Badge className={`${statusColors[application.status]} shadow-sm`} data-testid={`badge-status-${application.status.toLowerCase().replace(/\s+/g, '-')}`}>
            {application.status}
          </Badge>
          {application.priority && application.priority !== "Normal" && (
            <Badge className={`${priorityColors[application.priority]} shadow-sm`} variant="outline">
              {application.priority}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-foreground line-clamp-2">
          {application.description}
        </p>
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{formatDistanceToNow(new Date(application.submittedAt), { addSuffix: true })}</span>
          </div>
          {application.officialId && (
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span>Assigned</span>
            </div>
          )}
          {hasRemarks && (
            <div className="flex items-center gap-1 text-blue-600">
              <MessageSquare className="h-3 w-3" />
              <span>Has Notes</span>
            </div>
          )}
          {hasImage && (
            <div className="flex items-center gap-1">
              <FileImage className="h-3 w-3" />
              <span>Image</span>
            </div>
          )}
          {(application as any).rating && (
            <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400 font-medium">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-star"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
              <span>{(application as any).rating}/5</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={onViewDetails} data-testid={`button-view-${application.id}`}>
          <Eye className="h-3 w-3" />
          Check Status
        </Button>
        {showActions && onAccept && application.status === "Submitted" && (
          <Button size="sm" onClick={onAccept} data-testid={`button-accept-${application.id}`}>
            Accept
          </Button>
        )}
        {showActions && onUpdate && application.status !== "Submitted" && (
          <Button size="sm" onClick={onUpdate} data-testid={`button-update-${application.id}`}>
            Update Status
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
