import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Shield, ArrowLeft, FileText, Upload, CheckCircle, Info, Loader, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { ThemeToggle } from "@/components/theme-toggle";
import { getSubDepartmentsForDepartment, getAllDepartmentNames } from "@shared/sub-departments";
import { NotificationBell } from "@/components/notification-bell";
import { useQuery } from "@tanstack/react-query";
import { validateImageAsDocument } from "@/lib/image-scanner";
import type { Notification } from "@shared/schema";

export default function SubmitApplication() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    department: "",
    subDepartment: "",
    applicationType: "",
    description: "",
    additionalInfo: "",
    image: "",
    aadhaarCard: "", // For Aadhaar Department applications
    addressProof: "", // For Aadhaar Department applications
  });
  const [aadhaarScanResult, setAadhaarScanResult] = useState<{ valid: boolean; message: string } | null>(null);
  const [addressScanResult, setAddressScanResult] = useState<{ valid: boolean; message: string } | null>(null);
  const [isScanningAadhaar, setIsScanningAadhaar] = useState(false);
  const [isScanningAddress, setIsScanningAddress] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{ valid: boolean; message: string } | null>(null);

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    refetchInterval: 30000,
  });

  // Check suspension status
  const { data: userData } = useQuery<{ suspended?: boolean; suspendedUntil?: string; hoursRemaining?: number; suspensionReason?: string }>({
    queryKey: ["/api/auth/me"],
    refetchInterval: 60000, // Check every minute
  });

  const isSuspended = userData?.suspended || false;
  const hoursRemaining = userData?.hoursRemaining || 0;

  const handleMarkAsRead = async (id: string) => {
    await apiRequest("POST", `/api/notifications/${id}/read`, {});
    queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
  };

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Max dimensions
          const maxWidth = 1920;
          const maxHeight = 1920;

          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          // Compress to JPEG with 70% quality
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          resolve(compressedBase64);
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Check if this is an Aadhaar Department + Aadhaar Update application
  const isAadhaarUpdate = formData.department?.includes("Aadhaar") &&
    formData.subDepartment === "Aadhaar Update (Name/DOB/Address mismatch)";

  const handleAadhaarCardUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload an image smaller than 50MB",
          variant: "destructive",
        });
        e.target.value = "";
        return;
      }

      try {
        const compressedImage = await compressImage(file);
        setIsScanningAadhaar(true);
        setAadhaarScanResult(null);

        const validationResult = await validateImageAsDocument(compressedImage);

        if (validationResult.valid) {
          setFormData({ ...formData, aadhaarCard: compressedImage });
          setAadhaarScanResult({ valid: true, message: validationResult.message });
          toast({ title: "✓ Aadhaar Card Verified", description: "Document detected successfully." });
        } else {
          setAadhaarScanResult({ valid: false, message: "This image is not a document." });
          toast({ title: "Invalid Image", description: "This image is not a document", variant: "destructive" });
          e.target.value = "";
        }
      } catch (error) {
        toast({ title: "Upload failed", description: "Failed to process image", variant: "destructive" });
        setAadhaarScanResult({ valid: false, message: "Error scanning image. Please try again." });
        e.target.value = "";
      } finally {
        setIsScanningAadhaar(false);
      }
    }
  };

  const handleAddressProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload an image smaller than 50MB",
          variant: "destructive",
        });
        e.target.value = "";
        return;
      }

      try {
        const compressedImage = await compressImage(file);
        setIsScanningAddress(true);
        setAddressScanResult(null);

        const validationResult = await validateImageAsDocument(compressedImage);

        if (validationResult.valid) {
          setFormData({ ...formData, addressProof: compressedImage });
          setAddressScanResult({ valid: true, message: validationResult.message });
          toast({ title: "✓ Address Proof Verified", description: "Document detected successfully." });
        } else {
          setAddressScanResult({ valid: false, message: "This image is not a document." });
          toast({ title: "Invalid Image", description: "This image is not a document", variant: "destructive" });
          e.target.value = "";
        }
      } catch (error) {
        toast({ title: "Upload failed", description: "Failed to process image", variant: "destructive" });
        setAddressScanResult({ valid: false, message: "Error scanning image. Please try again." });
        e.target.value = "";
      } finally {
        setIsScanningAddress(false);
      }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload an image smaller than 50MB",
          variant: "destructive",
        });
        e.target.value = "";
        return;
      }

      try {
        // First compress the image
        const compressedImage = await compressImage(file);

        // Start AI scanning
        setIsScanning(true);
        setScanResult(null);

        const validationResult = await validateImageAsDocument(compressedImage);

        if (validationResult.valid) {
          // Valid document detected
          setFormData({ ...formData, image: compressedImage });
          setScanResult({
            valid: true,
            message: validationResult.message
          });
          toast({
            title: "✓ Valid Document",
            description: "Document detected successfully. Image uploaded.",
          });
        } else {
          // Invalid - not a document - show error popup
          const errorMessage = "This image is not a document. Please upload a document image (scanned document, certificate, ID card, etc.).";
          setScanResult({
            valid: false,
            message: errorMessage
          });
          toast({
            title: "Invalid Image",
            description: "This image is not a document",
            variant: "destructive",
            duration: 5000,
          });
          e.target.value = "";
        }
      } catch (error) {
        toast({
          title: "Upload failed",
          description: "Failed to process image",
          variant: "destructive",
        });
        setScanResult({
          valid: false,
          message: "Error scanning image. Please try again."
        });
        e.target.value = "";
      } finally {
        setIsScanning(false);
      }
    }
  };

  const departments = getAllDepartmentNames();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent submission if suspended
    if (isSuspended) {
      toast({
        title: "Account Suspended",
        description: `You have reached the maximum submission limit for this department. Your account is temporarily suspended for 24 hours. ${hoursRemaining > 0 ? `${hoursRemaining} hours remaining.` : ''}`,
        variant: "destructive",
        duration: 10000, // Show for 10 seconds
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare documents for Aadhaar Department applications
      const documents: { aadhaarCard?: string; addressProof?: string } = {};
      if (formData.aadhaarCard) {
        documents.aadhaarCard = formData.aadhaarCard;
      }
      if (formData.addressProof) {
        documents.addressProof = formData.addressProof;
      }

      const data = {
        applicationType: formData.subDepartment || formData.department || formData.applicationType,
        department: formData.department,
        subDepartment: formData.subDepartment,
        description: formData.description,
        citizenId: user!.id,
        data: JSON.stringify({
          additionalInfo: formData.additionalInfo,
          documents: documents
        }),
        image: formData.image || undefined,
      };

      await apiRequest("POST", "/api/applications", data);

      await queryClient.invalidateQueries({ queryKey: ["/api/applications/my"] });

      toast({
        title: "Application Submitted!",
        description: "Your application has been submitted successfully. You'll receive updates via notifications.",
      });

      setLocation("/citizen/dashboard");
    } catch (error: any) {
      // Check if error is due to suspension
      if (error.suspended || error.message?.includes("suspended") || error.message?.includes("maximum submission limit")) {
        // Refresh user data to get updated suspension status
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        // Show popup/dialog for suspension
        toast({
          title: "Account Suspended",
          description: error.message || "You have reached the maximum submission limit for this department. Your account is temporarily suspended for 24 hours.",
          variant: "destructive",
          duration: 10000, // Show for 10 seconds
        });
      } else {
        toast({
          title: "Submission Failed",
          description: error.message || "Unable to submit application",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-slate-950 font-['Outfit',sans-serif] selection:bg-blue-500/30">
      {/* Floating Header - Consistent with Dashboard */}
      <header className="fixed top-6 left-0 right-0 z-50 flex justify-center pointer-events-none px-6">
        <div className="w-full max-w-7xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 shadow-sm rounded-full px-6 py-3 pointer-events-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/citizen/dashboard">
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 -ml-2">
                <ArrowLeft className="h-5 w-5 text-[#1d1d1f] dark:text-white" />
              </Button>
            </Link>
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-full bg-[#0071e3] shadow-lg shadow-blue-500/20">
                <Shield className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold text-sm tracking-tight text-[#1d1d1f] dark:text-white">
                Submit Application
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell notifications={notifications} onMarkAsRead={handleMarkAsRead} />
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 pt-32 pb-12 max-w-4xl">
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-[#1d1d1f] dark:text-white">
              New Request
            </h1>
            <p className="text-lg text-[#86868b] dark:text-slate-400 font-medium max-w-xl mx-auto">
              Please provide accurate details to help us process your application faster.
            </p>
          </div>

          {/* Suspension Banner */}
          {isSuspended && (
            <Card className="border-2 border-red-500 bg-gradient-to-br from-red-50 via-red-100/50 to-orange-50 dark:from-red-950/40 dark:via-red-900/30 dark:to-orange-950/40 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-full bg-red-500 text-white shadow-lg">
                    <AlertCircle className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-red-900 dark:text-red-100 mb-1">
                      Account Suspended
                    </h3>
                    <p className="text-sm text-red-800 dark:text-red-200">
                      You have reached the maximum submission limit for this department. Your account is temporarily suspended for 24 hours.
                      {hoursRemaining > 0 && (
                        <span className="font-semibold"> {hoursRemaining} hour{hoursRemaining !== 1 ? 's' : ''} remaining.</span>
                      )}
                    </p>
                    <p className="text-xs text-red-700 dark:text-red-300 mt-2">
                      You cannot submit new applications until the suspension period ends.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-0 shadow-sm bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 p-8 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-[#0071e3]">
                  <FileText className="h-5 w-5" />
                </div>
                <CardTitle className="text-xl font-bold text-[#1d1d1f] dark:text-white">Application Details</CardTitle>
              </div>
              <CardDescription className="text-[#86868b] ml-12">
                All fields marked with * are required
              </CardDescription>
            </CardHeader>

            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label htmlFor="department" className="text-sm font-semibold text-[#1d1d1f] dark:text-white">Department *</Label>
                    <Select
                      value={formData.department}
                      onValueChange={(value) => setFormData({ ...formData, department: value, subDepartment: "" })}
                      required
                    >
                      <SelectTrigger className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-[#0071e3] focus:ring-offset-0" data-testid="select-department">
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map(dept => (
                          <SelectItem key={dept} value={dept}>
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.department && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-left-2 duration-300">
                      <Label htmlFor="subDepartment" className="text-sm font-semibold text-[#1d1d1f] dark:text-white">Issue Type *</Label>
                      <Select
                        value={formData.subDepartment}
                        onValueChange={(value) => setFormData({ ...formData, subDepartment: value })}
                        required
                      >
                        <SelectTrigger className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-[#0071e3] focus:ring-offset-0" data-testid="select-sub-department">
                          <SelectValue placeholder="Select specific issue" />
                        </SelectTrigger>
                        <SelectContent>
                          {getSubDepartmentsForDepartment(formData.department).map(subDept => (
                            <SelectItem key={subDept.name} value={subDept.name}>
                              {subDept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="description" className="text-sm font-semibold text-[#1d1d1f] dark:text-white">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Please describe your request in detail..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    rows={6}
                    className="resize-none rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-[#0071e3] focus:ring-offset-0 p-4"
                    data-testid="textarea-description"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="additionalInfo" className="text-sm font-semibold text-[#1d1d1f] dark:text-white">Additional Information</Label>
                  <Textarea
                    id="additionalInfo"
                    placeholder="Any other relevant details..."
                    value={formData.additionalInfo}
                    onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
                    rows={4}
                    className="resize-none rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-[#0071e3] focus:ring-offset-0 p-4"
                    data-testid="textarea-additional"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="image" className="text-sm font-semibold text-[#1d1d1f] dark:text-white">Attachments (Government Documents)</Label>
                  <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer relative group ${isScanning ? 'border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-900/10' :
                    scanResult?.valid ? 'border-green-300 dark:border-green-700 bg-green-50/50 dark:bg-green-900/10' :
                      scanResult?.valid === false ? 'border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-900/10' :
                        'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}>
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={isScanning}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
                    />
                    <div className="flex flex-col items-center gap-2">
                      <div className={`p-3 rounded-full group-hover:scale-110 transition-transform ${isScanning ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' :
                        scanResult?.valid ? 'bg-green-100 dark:bg-green-900/30 text-green-600' :
                          scanResult?.valid === false ? 'bg-red-100 dark:bg-red-900/30 text-red-600' :
                            'bg-blue-50 dark:bg-blue-900/20 text-[#0071e3]'
                        }`}>
                        {isScanning ? (
                          <Loader className="h-6 w-6 animate-spin" />
                        ) : scanResult?.valid ? (
                          <CheckCircle className="h-6 w-6" />
                        ) : scanResult?.valid === false ? (
                          <AlertCircle className="h-6 w-6" />
                        ) : (
                          <Upload className="h-6 w-6" />
                        )}
                      </div>
                      <div className="space-y-1">
                        {isScanning ? (
                          <>
                            <p className="text-sm font-medium text-[#1d1d1f] dark:text-white">Scanning document...</p>
                            <p className="text-xs text-[#86868b]">AI is analyzing the image</p>
                          </>
                        ) : formData.image ? (
                          <>
                            <p className="text-sm font-medium text-green-600 dark:text-green-400">Document verified</p>
                            <p className="text-xs text-[#86868b]">Valid text document detected</p>
                          </>
                        ) : (
                          <>
                            <p className="text-sm font-medium text-[#1d1d1f] dark:text-white">Click to upload image</p>
                            <p className="text-xs text-[#86868b]">Max 50MB (Auto-compressed) - Documents only</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {scanResult && !formData.image && (
                    <div className={`mt-3 p-3 rounded-lg flex gap-2 ${scanResult.valid
                      ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900'
                      : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900'
                      }`}>
                      <div className="flex-shrink-0 mt-0.5">
                        {scanResult.valid ? (
                          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                        )}
                      </div>
                      <p className={`text-sm ${scanResult.valid
                        ? 'text-green-800 dark:text-green-200'
                        : 'text-red-800 dark:text-red-200'
                        }`}>
                        {scanResult.message}
                      </p>
                    </div>
                  )}

                  {formData.image && (
                    <div className="mt-4 space-y-3">
                      <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900 rounded-lg">
                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                        <p className="text-sm text-green-800 dark:text-green-200">Document verified and ready</p>
                      </div>
                      <div className="relative group inline-block">
                        <img src={formData.image} alt="Preview" className="h-32 w-32 object-cover rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm" />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => {
                            setFormData({ ...formData, image: "" });
                            setScanResult(null);
                          }}
                        >
                          <span className="sr-only">Remove</span>
                          <div className="h-3 w-3 bg-white rounded-sm rotate-45 transform origin-center" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Aadhaar Department - Mandatory Documents Section */}
                {isAadhaarUpdate && (
                  <div className="space-y-4 p-6 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl">
                    <div className="flex items-center gap-2 mb-4">
                      <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                        Mandatory Documents for Aadhaar Update
                      </h3>
                    </div>
                    <p className="text-xs text-blue-800 dark:text-blue-200 mb-4">
                      Both documents are required for auto-approval. If both documents are uploaded and verified, your application will be automatically approved.
                    </p>

                    {/* Aadhaar Card Upload */}
                    <div className="space-y-3">
                      <Label htmlFor="aadhaarCard" className="text-sm font-semibold text-[#1d1d1f] dark:text-white">
                        Aadhaar Card Photo *
                      </Label>
                      <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-all cursor-pointer relative group ${isScanningAadhaar ? 'border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-900/10' :
                          aadhaarScanResult?.valid ? 'border-green-300 dark:border-green-700 bg-green-50/50 dark:bg-green-900/10' :
                            aadhaarScanResult?.valid === false ? 'border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-900/10' :
                              'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}>
                        <Input
                          id="aadhaarCard"
                          type="file"
                          accept="image/*"
                          onChange={handleAadhaarCardUpload}
                          disabled={isScanningAadhaar}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="flex items-center gap-3">
                          {isScanningAadhaar ? (
                            <Loader className="h-5 w-5 animate-spin text-blue-600" />
                          ) : formData.aadhaarCard ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <Upload className="h-5 w-5 text-slate-400" />
                          )}
                          <span className="text-sm text-[#1d1d1f] dark:text-white">
                            {formData.aadhaarCard ? "Aadhaar Card Verified" : "Upload Aadhaar Card"}
                          </span>
                        </div>
                      </div>
                      {formData.aadhaarCard && (
                        <div className="relative group inline-block">
                          <img src={formData.aadhaarCard} alt="Aadhaar Card" className="h-24 w-24 object-cover rounded-lg border border-green-200 dark:border-green-800" />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2 h-5 w-5 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => {
                              setFormData({ ...formData, aadhaarCard: "" });
                              setAadhaarScanResult(null);
                            }}
                          >
                            <span className="sr-only">Remove</span>
                            <div className="h-2.5 w-2.5 bg-white rounded-sm rotate-45" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Address Proof Upload */}
                    <div className="space-y-3">
                      <Label htmlFor="addressProof" className="text-sm font-semibold text-[#1d1d1f] dark:text-white">
                        Address Proof *
                      </Label>
                      <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-all cursor-pointer relative group ${isScanningAddress ? 'border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-900/10' :
                          addressScanResult?.valid ? 'border-green-300 dark:border-green-700 bg-green-50/50 dark:bg-green-900/10' :
                            addressScanResult?.valid === false ? 'border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-900/10' :
                              'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}>
                        <Input
                          id="addressProof"
                          type="file"
                          accept="image/*"
                          onChange={handleAddressProofUpload}
                          disabled={isScanningAddress}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="flex items-center gap-3">
                          {isScanningAddress ? (
                            <Loader className="h-5 w-5 animate-spin text-blue-600" />
                          ) : formData.addressProof ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <Upload className="h-5 w-5 text-slate-400" />
                          )}
                          <span className="text-sm text-[#1d1d1f] dark:text-white">
                            {formData.addressProof ? "Address Proof Verified" : "Upload Address Proof"}
                          </span>
                        </div>
                      </div>
                      {formData.addressProof && (
                        <div className="relative group inline-block">
                          <img src={formData.addressProof} alt="Address Proof" className="h-24 w-24 object-cover rounded-lg border border-green-200 dark:border-green-800" />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2 h-5 w-5 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => {
                              setFormData({ ...formData, addressProof: "" });
                              setAddressScanResult(null);
                            }}
                          >
                            <span className="sr-only">Remove</span>
                            <div className="h-2.5 w-2.5 bg-white rounded-sm rotate-45" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="bg-[#f5f5f7] dark:bg-slate-800/50 rounded-2xl p-6 flex gap-4 items-start">
                  <Info className="h-5 w-5 text-[#0071e3] mt-0.5 flex-shrink-0" />
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm text-[#1d1d1f] dark:text-white">Process Overview</h3>
                    <ul className="text-xs text-[#86868b] space-y-1.5">
                      <li className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-[#0071e3]" />
                        Application assigned to relevant official
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-[#0071e3]" />
                        Real-time status updates via notifications
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-[#0071e3]" />
                        AI-monitored for timely resolution
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Link href="/citizen/dashboard" className="flex-1">
                    <Button type="button" variant="outline" className="w-full h-12 rounded-full border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium" data-testid="button-cancel">
                      Cancel
                    </Button>
                  </Link>
                  <Button
                    type="submit"
                    disabled={isSubmitting || isSuspended}
                    className="flex-1 h-12 rounded-full bg-[#0071e3] hover:bg-[#0077ED] text-white font-medium shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    data-testid="button-submit-application"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Application"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
