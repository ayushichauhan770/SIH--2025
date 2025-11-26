import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Eye, User } from "lucide-react";
import type { Application } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

interface ApplicationCardProps {
  application: Application;
  onViewDetails: () => void;
  showActions?: boolean;
  onAccept?: () => void;
  onUpdate?: () => void;
}

const statusColors: Record<string, string> = {
  "Submitted": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  "Assigned": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  "In Progress": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  "Approved": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  "Rejected": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  "Auto-Approved": "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
};

export function ApplicationCard({ application, onViewDetails, showActions, onAccept, onUpdate }: ApplicationCardProps) {
  return (
    <Card
      className="transition-all transform hover:-translate-y-1 hover:shadow-2xl shadow-lg rounded-lg overflow-hidden bg-white/80 dark:bg-slate-800/60"
      data-testid={`card-application-${application.id}`}>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 pb-2">
        <div className="flex flex-col gap-1">
          <code className="text-sm font-mono font-semibold text-foreground" data-testid={`text-tracking-${application.trackingId}`}>
            {application.trackingId}
          </code>
          <p className="text-xs text-muted-foreground">
            {application.applicationType}
          </p>
        </div>
        <Badge className={statusColors[application.status]} data-testid={`badge-status-${application.status.toLowerCase().replace(/\s+/g, '-')}`}>
          {application.status}
        </Badge>
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
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={onViewDetails} data-testid={`button-view-${application.id}`}>
          <Eye className="h-3 w-3" />
          View Details
        </Button>
        {showActions && onAccept && application.status === "Submitted" && (
          <Button size="sm" onClick={onAccept} data-testid={`button-accept-${application.id}`}>
            Accept
          </Button>
        )}
        {showActions && onUpdate && application.status === "Assigned" && (
          <Button size="sm" onClick={onUpdate} data-testid={`button-update-${application.id}`}>
            Update Status
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
