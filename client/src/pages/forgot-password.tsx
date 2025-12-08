import { useState } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Mail, Phone, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ThemeToggle } from "@/components/theme-toggle";
import { OTPModal } from "@/components/otp-modal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ForgotPassword() {
      const [, setLocation] = useLocation();
      const { toast } = useToast();
      const [isLoading, setIsLoading] = useState(false);
      const [showOTP, setShowOTP] = useState(false);
      const [showNewPassword, setShowNewPassword] = useState(false);
      const [activeTab, setActiveTab] = useState("email");
      const [identifier, setIdentifier] = useState("");
      const [identifierType, setIdentifierType] = useState<"email" | "phone">("email");

      const [formData, setFormData] = useState({
            email: "",
            phone: "",
            newPassword: "",
            confirmPassword: "",
      });

      const handleSendOTP = async (e: React.FormEvent) => {
            e.preventDefault();
            setIsLoading(true);

            try {
                  const payload = activeTab === "email"
                        ? { email: formData.email, purpose: "reset-password" }
                        : { phone: formData.phone, purpose: "reset-password" };

                  const response = await apiRequest<{ message?: string; otp?: string }>(
                        "POST",
                        "/api/otp/generate",
                        payload
                  );

                  if (response.otp) {
                        (window as any).LAST_OTP = response.otp;
                        console.log("OTP exposed for testing:", response.otp);
                  }

                  const currentIdentifier = activeTab === "email" ? formData.email : formData.phone;
                  setIdentifier(currentIdentifier);
                  setIdentifierType(activeTab === "email" ? "email" : "phone");
                  setShowOTP(true);

                  toast({
                        title: "OTP Sent Successfully",
                        description: activeTab === "email"
                              ? "We've sent an OTP to your email. Kindly check your inbox (and spam folder)."
                              : "An OTP has been sent to your registered mobile number.",
                  });
            } catch (error: any) {
                  toast({
                        title: "Failed to Send OTP",
                        description: error.message || "Please check your email/phone and try again",
                        variant: "destructive",
                  });
            } finally {
                  setIsLoading(false);
            }
      };

      const handleOTPVerify = async (otp: string): Promise<boolean> => {
            try {
                  if (!identifier) {
                        toast({
                              title: "Error",
                              description: "Identifier not found. Please start over.",
                              variant: "destructive",
                        });
                        return false;
                  }

                  const payload = identifierType === "email"
                        ? { email: identifier, otp, purpose: "reset-password" }
                        : { phone: identifier, otp, purpose: "reset-password" };

                  await apiRequest<{ message?: string }>("POST", "/api/auth/verify-otp", payload);

                  toast({
                        title: "OTP Verified",
                        description: "Please set your new password",
                  });

                  setShowOTP(false);
                  setShowNewPassword(true);
                  // Ensure identifier is preserved
                  console.log("OTP verified, identifier preserved:", identifier, "type:", identifierType);
                  return true;
            } catch (error: any) {
                  toast({
                        title: "Verification Failed",
                        description: error?.message || "Invalid or expired OTP",
                        variant: "destructive",
                  });
                  return false;
            }
      };

      const handleResetPassword = async (e: React.FormEvent) => {
            e.preventDefault();

            if (formData.newPassword !== formData.confirmPassword) {
                  toast({
                        title: "Password Mismatch",
                        description: "Passwords do not match",
                        variant: "destructive",
                  });
                  return;
            }

            if (formData.newPassword.length < 6) {
                  toast({
                        title: "Password Too Short",
                        description: "Password must be at least 6 characters",
                        variant: "destructive",
                  });
                  return;
            }

            setIsLoading(true);

            try {
                  if (!identifier) {
                        toast({
                              title: "Error",
                              description: "Identifier not found. Please start over.",
                              variant: "destructive",
                        });
                        setIsLoading(false);
                        return;
                  }

                  const payload = identifierType === "email"
                        ? { email: identifier, newPassword: formData.newPassword }
                        : { phone: identifier, newPassword: formData.newPassword };

                  console.log("Resetting password with payload:", { ...payload, newPassword: "***" });

                  const response = await apiRequest<{ message: string; username: string }>("POST", "/api/auth/reset-password", payload);

                  toast({
                        title: "Password Reset Successful",
                        description: `Password has been successfully reset for username: ${response.username}. You can now login with your new password.`,
                  });

                  // Reset form and redirect to login
                  setFormData({ email: "", phone: "", newPassword: "", confirmPassword: "" });
                  setShowNewPassword(false);
                  setIdentifier("");
                  setIdentifierType("email");
                  setTimeout(() => setLocation("/login"), 3000);
            } catch (error: any) {
                  toast({
                        title: "Reset Failed",
                        description: error.message || "Failed to reset password",
                        variant: "destructive",
                  });
            } finally {
                  setIsLoading(false);
            }
      };

      return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4 relative overflow-hidden">
                  <div className="fixed top-4 left-4 z-50">
                        <ThemeToggle />
                  </div>

                  {/* Animated background elements */}
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-green-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
                        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
                        <div className="absolute top-20 left-10 w-32 h-32 border-2 border-green-300/30 rounded-full animate-spin" style={{ animationDuration: "20s", animationDirection: "reverse" }}></div>
                        <div className="absolute bottom-20 right-10 w-40 h-40 border-2 border-blue-300/30 rounded-full animate-pulse"></div>
                  </div>

                  <div className="w-full max-w-md space-y-6 relative z-10 animate-slide-in-left">
                        <div className="flex flex-col items-center gap-2 text-center">
                              <div className="p-3 rounded-full bg-gradient-to-br from-green-500 to-blue-600 animate-bounce">
                                    <Shield className="h-10 w-10 text-white" />
                              </div>
                              <h1 className="text-3xl font-bold font-heading bg-gradient-to-r from-green-600 to-blue-600 dark:from-green-400 dark:to-blue-400 bg-clip-text text-transparent">
                                    Reset Password
                              </h1>
                              <p className="text-sm text-muted-foreground">Enter your email or phone to reset your password</p>
                        </div>

                        <Card className="border border-white/20 dark:border-slate-700/60 bg-white/60 dark:bg-slate-800/70 backdrop-blur-2xl shadow-2xl hover:shadow-2xl transition-all duration-300 rounded-3xl w-full max-w-md p-6">
                              <div className="flex flex-col items-center justify-center">
                                    {!showNewPassword ? (
                                          <>
                                                <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 dark:from-green-400 dark:to-blue-400 bg-clip-text text-transparent mb-6">
                                                      Forgot Password
                                                </h2>

                                                <Tabs defaultValue="email" value={activeTab} onValueChange={setActiveTab} className="w-full">
                                                      <TabsList className="grid w-full grid-cols-2 mb-6">
                                                            <TabsTrigger value="email" className="flex items-center gap-2">
                                                                  <Mail className="h-4 w-4" /> Email
                                                            </TabsTrigger>
                                                            <TabsTrigger value="phone" className="flex items-center gap-2">
                                                                  <Phone className="h-4 w-4" /> Phone
                                                            </TabsTrigger>
                                                      </TabsList>

                                                      <form onSubmit={handleSendOTP} className="space-y-4 w-full bg-white/10 dark:bg-slate-900/20 backdrop-blur-md rounded-2xl p-4">
                                                            <TabsContent value="email" className="space-y-4 mt-0">
                                                                  <div className="space-y-2">
                                                                        <Label htmlFor="email" className="text-sm font-semibold">Email Address</Label>
                                                                        <Input
                                                                              id="email"
                                                                              type="email"
                                                                              placeholder="Enter your registered email"
                                                                              value={formData.email}
                                                                              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                                              required={activeTab === "email"}
                                                                              className="border-green-200/30 bg-white/10 dark:bg-slate-900/30 focus:border-green-500 focus:ring-green-500/20 dark:border-green-800/30 dark:focus:bg-slate-900/40 backdrop-blur-sm"
                                                                        />
                                                                  </div>
                                                            </TabsContent>

                                                            <TabsContent value="phone" className="space-y-4 mt-0">
                                                                  <div className="space-y-2">
                                                                        <Label htmlFor="phone" className="text-sm font-semibold">Mobile Number</Label>
                                                                        <Input
                                                                              id="phone"
                                                                              type="tel"
                                                                              placeholder="Enter your registered mobile number"
                                                                              value={formData.phone}
                                                                              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                                              required={activeTab === "phone"}
                                                                              className="border-green-200/30 bg-white/10 dark:bg-slate-900/30 focus:border-green-500 focus:ring-green-500/20 dark:border-green-800/30 dark:focus:bg-slate-900/40 backdrop-blur-sm"
                                                                        />
                                                                  </div>
                                                            </TabsContent>

                                                            <Button
                                                                  type="submit"
                                                                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 mt-4"
                                                                  disabled={isLoading}
                                                            >
                                                                  {isLoading ? "Sending OTP..." : "Send OTP"}
                                                            </Button>
                                                      </form>
                                                </Tabs>
                                          </>
                                    ) : (
                                          <>
                                                <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 dark:from-green-400 dark:to-blue-400 bg-clip-text text-transparent mb-6">
                                                      Set New Password
                                                </h2>

                                                <form onSubmit={handleResetPassword} className="space-y-4 w-full bg-white/10 dark:bg-slate-900/20 backdrop-blur-md rounded-2xl p-4">
                                                      <div className="space-y-2">
                                                            <Label htmlFor="newPassword" className="text-sm font-semibold">New Password</Label>
                                                            <Input
                                                                  id="newPassword"
                                                                  type="password"
                                                                  placeholder="Enter new password"
                                                                  value={formData.newPassword}
                                                                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                                                  required
                                                                  className="border-green-200/30 bg-white/10 dark:bg-slate-900/30 focus:border-green-500 focus:ring-green-500/20 dark:border-green-800/30 dark:focus:bg-slate-900/40 backdrop-blur-sm"
                                                            />
                                                      </div>

                                                      <div className="space-y-2">
                                                            <Label htmlFor="confirmPassword" className="text-sm font-semibold">Confirm Password</Label>
                                                            <Input
                                                                  id="confirmPassword"
                                                                  type="password"
                                                                  placeholder="Confirm new password"
                                                                  value={formData.confirmPassword}
                                                                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                                                  required
                                                                  className="border-green-200/30 bg-white/10 dark:bg-slate-900/30 focus:border-green-500 focus:ring-green-500/20 dark:border-green-800/30 dark:focus:bg-slate-900/40 backdrop-blur-sm"
                                                            />
                                                      </div>

                                                      <Button
                                                            type="submit"
                                                            className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 mt-4"
                                                            disabled={isLoading}
                                                      >
                                                            {isLoading ? "Resetting..." : "Reset Password"}
                                                      </Button>
                                                </form>
                                          </>
                                    )}

                                    <div className="mt-6 text-center text-sm space-y-2">
                                          <div>
                                                Remember your password?{" "}
                                                <Link href="/login" className="text-green-600 dark:text-green-400 hover:underline font-semibold">
                                                      Login
                                                </Link>
                                          </div>
                                    </div>
                              </div>
                        </Card>

                        <div className="text-center">
                              <Link href="/">
                                    <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400">
                                          <ArrowLeft className="h-4 w-4 mr-2" />
                                          Back to Home
                                    </Button>
                              </Link>
                        </div>
                  </div>

                  {/* OTP Modal */}
                  <OTPModal
                        open={showOTP}
                        onClose={() => {
                              setShowOTP(false);
                              // Don't clear identifier here, keep it for password reset
                        }}
                        onVerify={handleOTPVerify}
                        email={identifierType === "email" ? identifier : undefined}
                        phone={identifierType === "phone" ? identifier : undefined}
                        purpose="reset-password"
                  />
            </div>
      );
}
