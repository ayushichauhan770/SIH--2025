import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Clock, User, FileText, Calendar, AlertCircle, CheckCircle2, MessageSquare, AlertTriangle } from "lucide-react";
import type { Application, User as UserType, ApplicationHistory } from "@shared/schema";
import { formatDistanceToNow, format } from "date-fns";
import { useState, useEffect } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface ApplicationDetailsDialogProps {
      application: Application | null;
      open: boolean;
      onClose: () => void;
      canUpdateStatus?: boolean;
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
      "High": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border border-red-500",
      "Medium": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 border border-orange-500",
      "Normal": "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 border border-gray-500",
};

export function ApplicationDetailsDialog({ application, open, onClose, canUpdateStatus }: ApplicationDetailsDialogProps) {
      const { toast } = useToast();
      const [updateStatus, setUpdateStatus] = useState("");
      const [comment, setComment] = useState("");
      const [priority, setPriority] = useState("");
      const [remarks, setRemarks] = useState("");

      const { data: citizen } = useQuery<UserType>({
            queryKey: [`/api/users/${application?.citizenId}`],
            enabled: !!application?.citizenId && open,
      });

      const { data: history = [] } = useQuery<ApplicationHistory[]>({
            queryKey: [`/api/applications/${application?.id}/history`],
            enabled: !!application?.id && open,
      });

      useEffect(() => {
            if (application) {
                  setUpdateStatus(application.status);
                  setPriority(application.priority || "Normal");
                  setRemarks(application.remarks || "");
            }
      }, [application]);

      const handleUpdate = async () => {
            if (!application) return;

            try {
                  await apiRequest("PATCH", `/api/applications/${application.id}/status`, {
                        status: updateStatus,
                        comment,
                  });

                  if (priority !== application.priority || remarks !== application.remarks) {
                        await apiRequest("PATCH", `/api/applications/${application.id}`, {
                              priority,
                              remarks,
                        });
                  }

                  queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
                  toast({
                        title: "Application Updated",
                        description: "The application has been updated successfully.",
                  });
                  onClose();
            } catch (error: any) {
                  toast({
                        title: "Update Failed",
                        description: error.message || "Failed to update application",
                        variant: "destructive",
                  });
            }
      };

      if (!application) return null;

      return (
            <Dialog open={open} onOpenChange={onClose}>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    Application Details
                              </DialogTitle>
                              <DialogDescription>
                                    Tracking ID: <code className="font-mono font-semibold">{application.trackingId}</code>
                              </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6">
                              {/* Status and Priority Row */}
                              <div className="flex flex-wrap gap-3">
                                    <Badge className={statusColors[application.status]}>
                                          {application.status}
                                    </Badge>
                                    <Badge className={priorityColors[application.priority || "Normal"]}>
                                          {application.priority || "Normal"} Priority
                                    </Badge>
                                    {(application.escalationLevel || 0) > 0 && (
                                          <>
                                                <Badge className="bg-red-500 text-white border-red-600 animate-pulse flex items-center gap-1">
                                                      <AlertTriangle className="h-3 w-3" />
                                                      Escalated
                                                </Badge>
                                                <Badge variant="outline" className="border-red-200 text-red-600 bg-red-50">
                                                      Reassigned: {application.escalationLevel}x
                                                </Badge>
                                          </>
                                    )}
                              </div>

                              <Separator />

                              {/* Citizen Information */}
                              <div className="space-y-3">
                                    <h3 className="font-semibold flex items-center gap-2">
                                          <User className="h-4 w-4" />
                                          Citizen Information
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                          <div>
                                                <Label className="text-muted-foreground">Full Name</Label>
                                                <p className="font-medium">{citizen?.fullName || "Loading..."}</p>
                                          </div>
                                          <div>
                                                <Label className="text-muted-foreground">Email</Label>
                                                <p className="font-medium">{citizen?.email || "N/A"}</p>
                                          </div>
                                          <div>
                                                <Label className="text-muted-foreground">Phone</Label>
                                                <p className="font-medium">{citizen?.phone || "N/A"}</p>
                                          </div>
                                          <div>
                                                <Label className="text-muted-foreground">Aadhar Number</Label>
                                                <p className="font-medium">{citizen?.aadharNumber || "N/A"}</p>
                                          </div>
                                    </div>
                              </div>

                              <Separator />

                              {/* Application Information */}
                              <div className="space-y-3">
                                    <h3 className="font-semibold flex items-center gap-2">
                                          <FileText className="h-4 w-4" />
                                          Application Information
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                          <div>
                                                <Label className="text-muted-foreground">Application Type</Label>
                                                <p className="font-medium">{application.applicationType}</p>
                                          </div>
                                          <div>
                                                <Label className="text-muted-foreground">Department</Label>
                                                <p className="font-medium">{application.department || "N/A"}</p>
                                          </div>
                                          <div>
                                                <Label className="text-muted-foreground">Submitted Date</Label>
                                                <p className="font-medium flex items-center gap-1">
                                                      <Calendar className="h-3 w-3" />
                                                      {format(new Date(application.submittedAt), "PPP")}
                                                </p>
                                          </div>
                                          <div>
                                                <Label className="text-muted-foreground">Time Elapsed</Label>
                                                <p className="font-medium flex items-center gap-1">
                                                      <Clock className="h-3 w-3" />
                                                      {formatDistanceToNow(new Date(application.submittedAt), { addSuffix: true })}
                                                </p>
                                          </div>
                                          {application.image && (
                                                <div className="col-span-2">
                                                      <Label className="text-muted-foreground">Attached Image</Label>
                                                      <img src={application.image} alt="Application attachment" className="mt-2 rounded-lg max-h-48 object-contain border" />
                                                </div>
                                          )}
                                    </div>
                              </div>

                              <Separator />

                              {/* Description */}
                              <div>
                                    <Label className="text-muted-foreground">Description</Label>
                                    <p className="mt-2 text-sm whitespace-pre-wrap">{application.description}</p>
                              </div>

                              {/* Current Remarks */}
                              {application.remarks && (
                                    <div>
                                          <Label className="text-muted-foreground flex items-center gap-1">
                                                <MessageSquare className="h-3 w-3" />
                                                Remarks
                                          </Label>
                                          <p className="mt-2 text-sm whitespace-pre-wrap bg-muted p-3 rounded-md">{application.remarks}</p>
                                    </div>
                              )}

                              <Separator />

                              {/* Update Section (for officials) */}
                              {canUpdateStatus && (
                                    <div className="space-y-4 bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
                                          <h3 className="font-semibold">Update Application</h3>

                                          <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                      <Label htmlFor="status">Status</Label>
                                                      <Select value={updateStatus} onValueChange={setUpdateStatus}>
                                                            <SelectTrigger id="status">
                                                                  <SelectValue placeholder="Select status" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                  <SelectItem value="Assigned">Assigned</SelectItem>
                                                                  <SelectItem value="In Progress">In Progress</SelectItem>
                                                                  <SelectItem value="Approved">Approved</SelectItem>
                                                                  <SelectItem value="Rejected">Rejected</SelectItem>
                                                            </SelectContent>
                                                      </Select>
                                                </div>

                                                <div className="space-y-2">
                                                      <Label htmlFor="priority">Priority</Label>
                                                      <Select value={priority} onValueChange={setPriority}>
                                                            <SelectTrigger id="priority">
                                                                  <SelectValue placeholder="Select priority" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                  <SelectItem value="High">High Priority</SelectItem>
                                                                  <SelectItem value="Medium">Medium Priority</SelectItem>
                                                                  <SelectItem value="Normal">Normal Priority</SelectItem>
                                                            </SelectContent>
                                                      </Select>
                                                </div>
                                          </div>

                                          <div className="space-y-2">
                                                <Label htmlFor="comment">Status Update Comment</Label>
                                                <Textarea
                                                      id="comment"
                                                      placeholder="Add a comment about this status change..."
                                                      value={comment}
                                                      onChange={(e) => setComment(e.target.value)}
                                                      rows={3}
                                                />
                                          </div>

                                          <div className="space-y-2">
                                                <Label htmlFor="remarks">Remarks (Visible to Citizen)</Label>
                                                <Textarea
                                                      id="remarks"
                                                      placeholder="Add internal notes or remarks..."
                                                      value={remarks}
                                                      onChange={(e) => setRemarks(e.target.value)}
                                                      rows={3}
                                                />
                                          </div>
                                    </div>
                              )}

                              {/* History Timeline */}
                              {history.length > 0 && (
                                    <div className="space-y-3">
                                          <h3 className="font-semibold flex items-center gap-2">
                                                <Clock className="h-4 w-4" />
                                                Status History
                                          </h3>
                                          <div className="space-y-2">
                                                {history.map((item, index) => (
                                                      <div key={item.id} className="flex gap-3">
                                                            <div className="flex flex-col items-center">
                                                                  <div className={`rounded-full p-1 ${index === 0 ? 'bg-blue-500' : 'bg-gray-300'}`}>
                                                                        {index === 0 ? (
                                                                              <AlertCircle className="h-3 w-3 text-white" />
                                                                        ) : (
                                                                              <CheckCircle2 className="h-3 w-3 text-white" />
                                                                        )}
                                                                  </div>
                                                                  {index < history.length - 1 && (
                                                                        <div className="w-px h-full bg-gray-300 mt-1" />
                                                                  )}
                                                            </div>
                                                            <div className="flex-1 pb-4">
                                                                  <div className="flex items-center gap-2">
                                                                        <Badge variant="outline">{item.status}</Badge>
                                                                        <span className="text-xs text-muted-foreground">
                                                                              {format(new Date(item.updatedAt), "PPp")}
                                                                        </span>
                                                                  </div>
                                                                  {item.comment && (
                                                                        <p className="text-sm text-muted-foreground mt-1">{item.comment}</p>
                                                                  )}
                                                            </div>
                                                      </div>
                                                ))}
                                          </div>
                                    </div>
                              )}
                        </div>

                        <DialogFooter>
                              <Button variant="outline" onClick={onClose}>Close</Button>
                              {canUpdateStatus && (
                                    <Button onClick={handleUpdate} disabled={!updateStatus}>
                                          Update Application
                                    </Button>
                              )}
                        </DialogFooter>
                  </DialogContent>
            </Dialog>
      );
}
