import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, User as UserIcon, Crown, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ThemeToggle } from "@/components/theme-toggle";
import { OTPModal } from "@/components/otp-modal";
import type { User } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getSubDepartmentsForDepartment, getAllDepartmentNames } from "@shared/sub-departments";

const DEPARTMENTS = getAllDepartmentNames();

export default function Register() {
  const [, setLocation] = useLocation();
  const { setUser } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [tempUser, setTempUser] = useState<{ user: User; phone?: string; email?: string; otpMethod?: "phone" | "email" } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [selectedRole, setSelectedRole] = useState<"citizen" | "official" | "admin" | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    email: "",
    phone: "",
    aadharNumber: "",
    role: "citizen",
    department: "",
    subDepartment: "",
  });

  // OTP removed: verification is not required for registration flow

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // OTP removed: proceed directly with registration
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    // Validate sub-department for officials
    if (formData.role === "official" && !formData.subDepartment) {
      toast({
        title: "Sub-Department Required",
        description: "Please select a sub-department for official registration",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { confirmPassword, ...registerData } = formData;

      // All fields are now required, so we don't need to filter out empty optional fields
      const cleanedData = registerData;

      const response = await apiRequest<{ user: User; token?: string; phone?: string; email?: string; otpMethod?: "phone" | "email"; otp?: string }>(
        "POST",
        "/api/auth/register",
        cleanedData
      );

      if (response.otp) {
        (window as any).LAST_OTP = response.otp;
        console.log("OTP exposed for testing:", response.otp);
      }

      // If server returned a phone or email (two-step flow), show OTP modal
      if (response.phone || response.email) {
        setTempUser({
          user: response.user,
          phone: response.phone,
          email: response.email,
          otpMethod: response.otpMethod
        });
        setShowOTP(true);
        toast({
          title: "OTP Sent",
          description: `Check your ${response.otpMethod === 'email' ? 'email' : 'phone'} for the verification code`
        });
        return;
      }

      // otherwise immediate login (no phone)
      if (response.token) {
        sessionStorage.setItem("user", JSON.stringify(response.user));
        sessionStorage.setItem("token", response.token);
        setUser(response.user);

        toast({ title: "Registration Successful!", description: "Your account has been created" });

        if (response.user.role === "admin") {
          setLocation("/admin/dashboard");
        } else if (response.user.role === "official") {
          setLocation("/official/dashboard");
        } else {
          setLocation("/citizen/dashboard");
        }
      }
    } catch (error: any) {
      const msg = (error && error.message) ? String(error.message) : "Unable to create account";
      const lowered = msg.toLowerCase();
      // If the server returned a duplicate email/phone/aadhar message, show a modal popup.
      if (lowered.includes("email") || lowered.includes("mobile") || lowered.includes("phone") || lowered.includes("aadhar")) {
        setModalMessage(msg);
        setIsModalOpen(true);
      } else {
        toast({
          title: "Registration Failed",
          description: msg,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPVerify = async (otp: string): Promise<boolean> => {
    try {
      await apiRequest<{ message?: string }>("POST", "/api/auth/verify-otp", {
        phone: tempUser?.phone,
        email: tempUser?.email,
        otp,
        purpose: "register",
      });

      const tokenResp = await apiRequest<{ user: User; token: string }>("POST", "/api/auth/token", {
        username: tempUser?.user.username,
        phone: tempUser?.phone,
        email: tempUser?.email,
        purpose: "register"
      });

      sessionStorage.setItem("user", JSON.stringify(tokenResp.user));
      sessionStorage.setItem("token", tokenResp.token);
      setUser(tokenResp.user);

      toast({ title: "Registration Complete", description: "Your account is verified and ready" });

      setShowOTP(false);
      setTempUser(null);
      setFormData({ username: "", password: "", confirmPassword: "", fullName: "", email: "", phone: "", aadharNumber: "", role: "citizen", department: "" });

      const role = tokenResp.user?.role;
      if (role === "admin") {
        setLocation("/admin/dashboard");
      } else if (role === "official") {
        setLocation("/official/dashboard");
      } else {
        setLocation("/citizen/dashboard");
      }

      return true;
    } catch (err: any) {
      toast({ title: "Verification Failed", description: err?.message || "Invalid or expired OTP", variant: "destructive" });
      return false;
    }
  };

  const handleRoleSelect = (role: "citizen" | "official" | "admin") => {
    setSelectedRole(role);
    setFormData({ ...formData, role });
  };

  const handleBackToRoleSelection = () => {
    setSelectedRole(null);
  };

  // Step 1: Role Selection
  if (!selectedRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4 relative overflow-hidden">
        <div className="fixed top-4 left-4 z-50">
          <ThemeToggle />
        </div>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
        </div>

        <div className="w-full max-w-4xl space-y-6 relative z-10">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="p-3 rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
              <Shield className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold font-heading bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
              Digital Governance
            </h1>
            <p className="text-sm text-muted-foreground">Select your role to get started</p>
          </div>

          <Card className="border border-white/20 dark:border-slate-700/60 bg-white/60 dark:bg-slate-800/70 backdrop-blur-2xl shadow-2xl rounded-3xl w-full p-8">
            <div className="flex flex-col items-center justify-center">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent mb-8">
                Register As
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                <Card 
                  className="cursor-pointer border-2 hover:border-green-500 transition-all hover:shadow-xl hover:scale-105"
                  onClick={() => handleRoleSelect("citizen")}
                >
                  <CardContent className="flex flex-col items-center justify-center p-6 space-y-4">
                    <div className="p-4 rounded-full bg-gradient-to-br from-green-400 to-green-600">
                      <UserIcon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold">Citizen</h3>
                    <p className="text-sm text-muted-foreground text-center">Submit and track applications</p>
                  </CardContent>
                </Card>

                <Card 
                  className="cursor-pointer border-2 hover:border-blue-500 transition-all hover:shadow-xl hover:scale-105"
                  onClick={() => handleRoleSelect("official")}
                >
                  <CardContent className="flex flex-col items-center justify-center p-6 space-y-4">
                    <div className="p-4 rounded-full bg-gradient-to-br from-blue-400 to-blue-600">
                      <Shield className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold">Official</h3>
                    <p className="text-sm text-muted-foreground text-center">Process applications</p>
                  </CardContent>
                </Card>

                <Card 
                  className="cursor-pointer border-2 hover:border-purple-500 transition-all hover:shadow-xl hover:scale-105"
                  onClick={() => handleRoleSelect("admin")}
                >
                  <CardContent className="flex flex-col items-center justify-center p-6 space-y-4">
                    <div className="p-4 rounded-full bg-gradient-to-br from-purple-400 to-purple-600">
                      <Crown className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold">Admin</h3>
                    <p className="text-sm text-muted-foreground text-center">Monitor system</p>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-6 text-center text-sm">
                Already have an account?{" "}
                <Link href="/login" className="text-purple-600 dark:text-purple-400 hover:underline font-semibold">
                  Login
                </Link>
              </div>
            </div>
          </Card>

          <div className="text-center">
            <Link href="/">
              <Button variant="ghost" size="sm">Back to Home</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Registration Form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4 relative overflow-hidden">
      <div className="fixed top-4 left-4 z-50">
        <ThemeToggle />
      </div>
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>

        {/* Circular decorative boxes */}
        <div className="absolute top-20 right-10 w-32 h-32 border-2 border-blue-300/30 rounded-full animate-spin" style={{ animationDuration: "20s" }}></div>
        <div className="absolute bottom-20 left-10 w-40 h-40 border-2 border-purple-300/30 rounded-full animate-pulse"></div>
        <div className="absolute top-1/3 left-20 w-24 h-24 border-2 border-pink-300/30 rounded-full" style={{ animationName: "none" }}></div>
        <div className="absolute bottom-1/4 right-1/4 w-28 h-28 border-2 border-blue-300/20 rounded-full animate-bounce"></div>
      </div>

      <div className="w-full max-w-md space-y-6 relative z-10 animate-slide-in-right">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="p-3 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 animate-bounce">
            <Shield className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold font-heading bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
            Digital Governance
          </h1>
          <p className="text-sm text-muted-foreground">Join our smart governance platform</p>
        </div>

        <Card className="border border-white/20 dark:border-slate-700/60 bg-white/60 dark:bg-slate-800/70 backdrop-blur-2xl shadow-2xl hover:shadow-2xl transition-all duration-300 rounded-3xl w-full max-w-md p-8">
          <div className="flex flex-col items-center justify-center">
            <div className="flex items-center justify-between w-full mb-4">
              <Button variant="ghost" size="sm" onClick={handleBackToRoleSelection} className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div className="flex items-center gap-2">
                {selectedRole === "citizen" && <UserIcon className="h-5 w-5 text-green-600" />}
                {selectedRole === "official" && <Shield className="h-5 w-5 text-blue-600" />}
                {selectedRole === "admin" && <Crown className="h-5 w-5 text-purple-600" />}
                <span className="text-sm font-semibold capitalize">{selectedRole}</span>
              </div>
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent mb-6">Create Account</h2>

            <form onSubmit={handleSubmit} className="space-y-3 w-full bg-white/10 dark:bg-slate-900/20 backdrop-blur-md rounded-2xl p-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-semibold">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                  data-testid="input-fullname"
                  className="border-purple-200/30 bg-white/10 dark:bg-slate-900/30 focus:border-purple-500 focus:ring-purple-500/20 dark:border-purple-800/30 dark:focus:bg-slate-900/40 backdrop-blur-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  data-testid="input-email"
                  className="border-purple-200/30 bg-white/10 dark:bg-slate-900/30 focus:border-purple-500 focus:ring-purple-500/20 dark:border-purple-800/30 dark:focus:bg-slate-900/40 backdrop-blur-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-semibold">Mobile Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter your mobile number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  data-testid="input-phone"
                  className="border-purple-200/30 bg-white/10 dark:bg-slate-900/30 focus:border-purple-500 focus:ring-purple-500/20 dark:border-purple-800/30 dark:focus:bg-slate-900/40 backdrop-blur-sm"
                />
              </div>
              <div className="space-y-2">
                {(formData.role === "official" || formData.role === "admin") && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="department" className="text-sm font-semibold">Department *</Label>
                      <select
                        id="department"
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value, subDepartment: "" })}
                        className="w-full border-purple-200/30 bg-white/10 dark:bg-slate-900/30 focus:border-purple-500 focus:ring-purple-500/20 dark:border-purple-800/30 dark:focus:bg-slate-900/40 rounded-md p-2"
                        required
                      >
                        <option value="">Select Department</option>
                        {DEPARTMENTS.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>
                    </div>
                    {formData.department && formData.role === "official" && (
                      <div className="space-y-2">
                        <Label htmlFor="subDepartment" className="text-sm font-semibold">Sub-Department *</Label>
                        <select
                          id="subDepartment"
                          value={formData.subDepartment}
                          onChange={(e) => setFormData({ ...formData, subDepartment: e.target.value })}
                          className="w-full border-purple-200/30 bg-white/10 dark:bg-slate-900/30 focus:border-purple-500 focus:ring-purple-500/20 dark:border-purple-800/30 dark:focus:bg-slate-900/40 rounded-md p-2"
                          required
                        >
                          <option value="">Select Sub-Department</option>
                          {getSubDepartmentsForDepartment(formData.department).map((subDept) => (
                            <option key={subDept.name} value={subDept.name}>
                              {subDept.name}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-muted-foreground">
                          Select the sub-department you will handle. You will only receive applications matching this sub-department.
                        </p>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="secretKey" className="text-sm font-semibold">Enter Secret Key *</Label>
                      <div className="relative">
                        <Input
                          id="secretKey"
                          type={showSecretKey ? "text" : "password"}
                          placeholder="Enter Secret Key"
                          value={(formData as any).secretKey || ""}
                          onChange={(e) => setFormData({ ...formData, secretKey: e.target.value } as any)}
                          required
                          className="border-purple-200/30 bg-white/10 dark:bg-slate-900/30 focus:border-purple-500 focus:ring-purple-500/20 dark:border-purple-800/30 dark:focus:bg-slate-900/40 backdrop-blur-sm pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSecretKey(!showSecretKey)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          {showSecretKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="aadharNumber" className="text-sm font-semibold">Aadhar Number</Label>
                  <Input
                    id="aadharNumber"
                    type="text"
                    placeholder="Enter your 12-digit Aadhar number"
                    value={formData.aadharNumber}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "").slice(0, 12);
                      setFormData({ ...formData, aadharNumber: value });
                    }}
                    maxLength={12}
                    required
                    data-testid="input-aadhar"
                    className="border-purple-200/30 bg-white/10 dark:bg-slate-900/30 focus:border-purple-500 focus:ring-purple-500/20 dark:border-purple-800/30 dark:focus:bg-slate-900/40 backdrop-blur-sm"
                  />
                </div>
                <Label htmlFor="username" className="text-sm font-semibold">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Choose a username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                  data-testid="input-username"
                  className="border-purple-200/50 bg-white/20 dark:bg-slate-900/40 focus:border-purple-500 focus:ring-purple-500/20 dark:border-purple-800/50 dark:focus:bg-slate-900/60 backdrop-blur-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    data-testid="input-password"
                    className="border-purple-200/50 bg-white/20 dark:bg-slate-900/40 focus:border-purple-500 focus:ring-purple-500/20 dark:border-purple-800/50 dark:focus:bg-slate-900/60 backdrop-blur-sm pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-semibold">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                    data-testid="input-confirm-password"
                    className="border-purple-200/30 bg-white/10 dark:bg-slate-900/30 focus:border-purple-500 focus:ring-purple-500/20 dark:border-purple-800/30 dark:focus:bg-slate-900/40 backdrop-blur-sm pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
                disabled={isLoading}
                data-testid="button-register-submit"
              >
                {isLoading ? "Creating Account..." : "Register"}
              </Button>
            </form>
            {/* OTP removed */}
            <div className="mt-4 text-center text-sm">
              Already have an account?{" "}
              <Link href="/login" className="text-purple-600 dark:text-purple-400 hover:underline font-semibold" data-testid="link-login">
                Login
              </Link>
            </div>
          </div>
        </Card>

        <div className="text-center">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400" data-testid="button-back-home">
              Back to Home
            </Button>
          </Link>
        </div>

        {/* Duplicate/email/phone error modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registration Error</DialogTitle>
              <DialogDescription>{modalMessage}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={() => setIsModalOpen(false)}>OK</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* OTP Modal */}
      {tempUser && (
        <OTPModal
          open={showOTP}
          onClose={() => {
            setShowOTP(false);
            setTempUser(null);
          }}
          onVerify={handleOTPVerify}
          phone={tempUser.phone}
          email={tempUser.email}
          purpose="register"
        />
      )}
    </div>
  );
}
