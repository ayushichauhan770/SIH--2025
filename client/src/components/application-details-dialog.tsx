import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, User, FileText, Calendar, AlertCircle, CheckCircle2, MessageSquare, AlertTriangle, Shield, ChevronRight, MapPin, Plus } from "lucide-react";
import type { Application, User as UserType, ApplicationHistory, ApplicationLocationHistory } from "@shared/schema";
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
      "Submitted": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
      "Assigned": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
      "In Progress": "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
      "Approved": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
      "Rejected": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
      "Auto-Approved": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
};


export function ApplicationDetailsDialog({ application, open, onClose, canUpdateStatus }: ApplicationDetailsDialogProps) {
      const { toast } = useToast();
      const [updateStatus, setUpdateStatus] = useState("");
      const [comment, setComment] = useState("");
      const [remarks, setRemarks] = useState("");
      const [newLocation, setNewLocation] = useState("");

      const { data: citizen } = useQuery<UserType>({
            queryKey: [`/api/users/${application?.citizenId}`],
            enabled: !!application?.citizenId && open,
      });

      const { data: history = [] } = useQuery<ApplicationHistory[]>({
            queryKey: [`/api/applications/${application?.id}/history`],
            enabled: !!application?.id && open,
      });

      const { data: locationHistory = [] } = useQuery<ApplicationLocationHistory[]>({
            queryKey: ["/api/applications", application?.id, "location-history"],
            enabled: !!application?.id && open,
            refetchInterval: 3000,
            refetchOnWindowFocus: true,
      });

      useEffect(() => {
            if (application) {
                  setUpdateStatus(application.status);
                  setRemarks(application.remarks || "");
                  setNewLocation("");
            }
      }, [application]);

      const handleUpdate = async () => {
            if (!application) return;

            try {
                  await apiRequest("PATCH", `/api/applications/${application.id}/status`, {
                        status: updateStatus,
                        comment,
                  });

                  if (remarks !== application.remarks) {
                        await apiRequest("PATCH", `/api/applications/${application.id}`, {
                              remarks,
                        });
                  }

                  if (newLocation && newLocation.trim()) {
                        await apiRequest("POST", `/api/applications/${application.id}/location`, {
                              location: newLocation.trim(),
                        });
                        setNewLocation("");
                  }

                  queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
                  queryClient.invalidateQueries({ queryKey: ["/api/applications", application.id, "location-history"] });
                  // Also invalidate the public tracking endpoint
                  if (application.trackingId) {
                        queryClient.invalidateQueries({ queryKey: ["/api/applications/track", application.trackingId, "location-history"] });
                  }
                  
                  // Show success message
                  const locationMessage = newLocation && newLocation.trim() 
                        ? "Status, remarks, and location history have been updated successfully."
                        : "The application has been updated successfully.";
                  
                  toast({
                        title: "Application Updated",
                        description: locationMessage,
                  });
                  
                  // Clear form fields but keep dialog open so official can see the update
                  setComment("");
                  if (newLocation && newLocation.trim()) {
                        setNewLocation("");
                  }
                  
                  // Don't close dialog - let official see the updated location history
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
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#F5F5F7] dark:bg-slate-950 rounded-[32px] border-0 shadow-2xl p-0 font-['Outfit',sans-serif]">
                        
                        {/* Header */}
                        <div className="bg-white dark:bg-slate-900 p-6 border-b border-slate-100 dark:border-slate-800 sticky top-0 z-10">
                              <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                          <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-[#0071e3]">
                                                <FileText className="h-6 w-6" />
                                          </div>
                                          <div>
                                                <DialogTitle className="text-xl font-bold text-[#1d1d1f] dark:text-white">
                                                      Application Details
                                                </DialogTitle>
                                                <p className="text-sm text-[#86868b] font-mono mt-0.5">
                                                      ID: {application.trackingId}
                                                </p>
                                          </div>
                                    </div>
                                    <div className="flex gap-2">
                                          <Badge className={`rounded-full px-3 py-1 text-xs font-bold border-0 ${statusColors[application.status]}`}>
                                                {application.status}
                                          </Badge>
                                    </div>
                              </div>
                              
                              {(application.escalationLevel || 0) > 0 && (
                                    <div className="mt-4 flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 border border-red-100 dark:border-red-900/30">
                                          <AlertTriangle className="h-4 w-4 animate-pulse" />
                                          <span className="text-sm font-semibold">Escalated: Reassigned {application.escalationLevel} times</span>
                                    </div>
                              )}
                        </div>

                        <div className="p-6 space-y-6">
                              
                              {/* Grid Layout */}
                              <div className="grid md:grid-cols-2 gap-6">
                                    
                                    {/* Citizen Information Card */}
                                    <div className="bg-white dark:bg-slate-900 p-6 rounded-[24px] shadow-sm">
                                          <h3 className="font-bold text-[#1d1d1f] dark:text-white mb-4 flex items-center gap-2">
                                                <User className="h-5 w-5 text-[#0071e3]" />
                                                Citizen Information
                                          </h3>
                                          <div className="space-y-4">
                                                <div className="flex justify-between py-2 border-b border-slate-50 dark:border-slate-800">
                                                      <span className="text-sm text-[#86868b]">Full Name</span>
                                                      <span className="text-sm font-medium text-[#1d1d1f] dark:text-white">{citizen?.fullName || "Loading..."}</span>
                                                </div>
                                                <div className="flex justify-between py-2 border-b border-slate-50 dark:border-slate-800">
                                                      <span className="text-sm text-[#86868b]">Email</span>
                                                      <span className="text-sm font-medium text-[#1d1d1f] dark:text-white">{citizen?.email || "N/A"}</span>
                                                </div>
                                                <div className="flex justify-between py-2 border-b border-slate-50 dark:border-slate-800">
                                                      <span className="text-sm text-[#86868b]">Phone</span>
                                                      <span className="text-sm font-medium text-[#1d1d1f] dark:text-white">{citizen?.phone || "N/A"}</span>
                                                </div>
                                                <div className="flex justify-between py-2">
                                                      <span className="text-sm text-[#86868b]">Aadhar Number</span>
                                                      <span className="text-sm font-medium text-[#1d1d1f] dark:text-white font-mono">{citizen?.aadharNumber || "N/A"}</span>
                                                </div>
                                          </div>
                                    </div>

                                    {/* Application Info Card */}
                                    <div className="bg-white dark:bg-slate-900 p-6 rounded-[24px] shadow-sm">
                                          <h3 className="font-bold text-[#1d1d1f] dark:text-white mb-4 flex items-center gap-2">
                                                <Shield className="h-5 w-5 text-[#0071e3]" />
                                                Application Data
                                          </h3>
                                          <div className="space-y-4">
                                                <div className="flex justify-between py-2 border-b border-slate-50 dark:border-slate-800">
                                                      <span className="text-sm text-[#86868b]">Type</span>
                                                      <span className="text-sm font-medium text-[#1d1d1f] dark:text-white">{application.applicationType}</span>
                                                </div>
                                                <div className="flex justify-between py-2 border-b border-slate-50 dark:border-slate-800">
                                                      <span className="text-sm text-[#86868b]">Department</span>
                                                      <span className="text-sm font-medium text-[#1d1d1f] dark:text-white">{application.department || "N/A"}</span>
                                                </div>
                                                <div className="flex justify-between py-2 border-b border-slate-50 dark:border-slate-800">
                                                      <span className="text-sm text-[#86868b]">Submitted</span>
                                                      <span className="text-sm font-medium text-[#1d1d1f] dark:text-white flex items-center gap-1">
                                                            <Calendar className="h-3 w-3" />
                                                            {format(new Date(application.submittedAt), "MMM d, yyyy")}
                                                      </span>
                                                </div>
                                                <div className="flex justify-between py-2">
                                                      <span className="text-sm text-[#86868b]">Elapsed</span>
                                                      <span className="text-sm font-medium text-[#1d1d1f] dark:text-white flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            {formatDistanceToNow(new Date(application.submittedAt))}
                                                      </span>
                                                </div>
                                          </div>
                                    </div>
                              </div>

                              {/* Description & Attachments */}
                              <div className="bg-white dark:bg-slate-900 p-6 rounded-[24px] shadow-sm">
                                    <h3 className="font-bold text-[#1d1d1f] dark:text-white mb-4">Description</h3>
                                    <p className="text-sm text-[#86868b] leading-relaxed whitespace-pre-wrap mb-6">
                                          {application.description}
                                    </p>
                                    
                                    {application.image && (
                                          <div className="mt-4">
                                                <h4 className="text-xs font-bold text-[#1d1d1f] dark:text-white uppercase tracking-wider mb-3">Attachment</h4>
                                                <div className="rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 inline-block">
                                                      <img src={application.image} alt="Attachment" className="max-h-64 object-contain bg-slate-50 dark:bg-slate-950" />
                                                </div>
                                          </div>
                                    )}
                              </div>

                              {/* Action Section (Official Only) */}
                              {canUpdateStatus && (
                                    <div className="bg-white dark:bg-slate-900 p-6 rounded-[24px] shadow-sm border-2 border-blue-50 dark:border-blue-900/20">
                                          <h3 className="font-bold text-[#1d1d1f] dark:text-white mb-6 flex items-center gap-2">
                                                <CheckCircle2 className="h-5 w-5 text-[#0071e3]" />
                                                Update Status
                                          </h3>

                                          <div className="grid md:grid-cols-2 gap-6 mb-6">
                                                <div className="space-y-2">
                                                      <Label className="text-xs font-bold text-[#86868b] uppercase">Status</Label>
                                                      <Select value={updateStatus} onValueChange={setUpdateStatus}>
                                                            <SelectTrigger className="h-12 rounded-xl bg-[#F5F5F7] dark:bg-slate-800 border-0">
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

                                          </div>

                                          <div className="space-y-4">
                                                <div className="space-y-2">
                                                      <Label className="text-xs font-bold text-[#86868b] uppercase">Internal Comment</Label>
                                                      <Textarea
                                                            placeholder="Add a comment about this status change..."
                                                            value={comment}
                                                            onChange={(e) => setComment(e.target.value)}
                                                            className="min-h-[80px] rounded-xl bg-[#F5F5F7] dark:bg-slate-800 border-0 resize-none"
                                                      />
                                                </div>
                                                <div className="space-y-2">
                                                      <Label className="text-xs font-bold text-[#86868b] uppercase">Public Remarks</Label>
                                                      <Textarea
                                                            placeholder="Add remarks visible to the citizen..."
                                                            value={remarks}
                                                            onChange={(e) => setRemarks(e.target.value)}
                                                            className="min-h-[80px] rounded-xl bg-[#F5F5F7] dark:bg-slate-800 border-0 resize-none"
                                                      />
                                                </div>
                                          </div>

                                          {/* Location History Section */}
                                          <div className="bg-white dark:bg-slate-900 p-6 rounded-[24px] shadow-sm border-2 border-green-50 dark:border-green-900/20 mt-6">
                                                <h3 className="font-bold text-[#1d1d1f] dark:text-white mb-4 flex items-center gap-2">
                                                      <MapPin className="h-5 w-5 text-green-600" />
                                                      Location / Path History
                                                </h3>

                                                {/* Existing Location History */}
                                                {locationHistory.length > 0 && (
                                                      <div className="mb-6 space-y-3">
                                                            <Label className="text-xs font-bold text-[#86868b] uppercase">Previous Locations</Label>
                                                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                                                  {locationHistory.map((entry, index) => (
                                                                        <div key={entry.id} className="p-3 rounded-xl bg-[#F5F5F7] dark:bg-slate-800 border-l-4 border-l-green-500">
                                                                              <div className="flex items-start justify-between gap-2">
                                                                                    <div className="flex-1">
                                                                                          <p className="text-sm font-medium text-[#1d1d1f] dark:text-white">{entry.location}</p>
                                                                                          <p className="text-xs text-[#86868b] mt-1">
                                                                                                {format(new Date(entry.updatedAt), "MMM d, yyyy 'at' h:mm a")}
                                                                                          </p>
                                                                                    </div>
                                                                                    {index === 0 && (
                                                                                          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 text-xs px-2 py-0.5 rounded-full">
                                                                                                Current
                                                                                          </Badge>
                                                                                    )}
                                                                              </div>
                                                                        </div>
                                                                  ))}
                                                            </div>
                                                      </div>
                                                )}

                                                {/* Add New Location */}
                                                <div className="space-y-2">
                                                      <Label className="text-xs font-bold text-[#86868b] uppercase flex items-center gap-2">
                                                            <Plus className="h-3 w-3" />
                                                            Add New Location / Path
                                                      </Label>
                                                      <Textarea
                                                            placeholder="Enter where the application is currently stuck or its current path (e.g., 'Under review at Department X', 'Pending verification at Office Y')..."
                                                            value={newLocation}
                                                            onChange={(e) => setNewLocation(e.target.value)}
                                                            className="min-h-[80px] rounded-xl bg-[#F5F5F7] dark:bg-slate-800 border-0 resize-none"
                                                      />
                                                      <p className="text-xs text-[#86868b]">This will be added as a new entry in the location history and will be visible to the citizen</p>
                                                </div>
                                          </div>
                                    </div>
                              )}
                        </div>

                        <div className="p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 sticky bottom-0 z-10">
                              <Button variant="ghost" onClick={onClose} className="rounded-full h-12 px-6 text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white">
                                    Close
                              </Button>
                              {canUpdateStatus && (
                                    <Button 
                                          onClick={handleUpdate} 
                                          disabled={!updateStatus}
                                          className="rounded-full h-12 px-8 bg-[#0071e3] hover:bg-[#0077ED] text-white shadow-lg shadow-blue-500/20 font-medium"
                                    >
                                          Update Application
                                    </Button>
                              )}
                        </div>
                  </DialogContent>
            </Dialog>
      );
}
