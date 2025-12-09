import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, User as UserIcon, Crown, ArrowLeft, Eye, EyeOff, FileText, CheckCircle2 } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getSubDepartmentsForDepartment, getAllDepartmentNames } from "@shared/sub-departments";



export default function Register() {
  const DEPARTMENTS = getAllDepartmentNames();
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

  // Check for role parameter in URL and auto-select the role
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roleParam = params.get("role");
    if (roleParam === "citizen" || roleParam === "official" || roleParam === "admin") {
      setSelectedRole(roleParam);
      setFormData(prev => ({ ...prev, role: roleParam }));
    }
  }, []);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    email: "",
    phone: "",
    documentType: "aadhaar",
    aadharNumber: "",
    role: "citizen",
    department: "",
    subDepartment: "",
    hierarchyLevel: "1", // Default to level 1
    designation: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

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
      setFormData({ 
        username: "", 
        password: "", 
        confirmPassword: "", 
        fullName: "", 
        email: "", 
        phone: "", 
        aadharNumber: "", 
        role: "citizen", 
        department: "",
        documentType: "aadhaar",
        subDepartment: "",
        hierarchyLevel: "1",
        designation: ""
      });

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
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F7] dark:bg-slate-950 font-['Outfit',sans-serif] p-4">
        <div className="fixed top-6 right-6 z-50">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-5xl space-y-8 animate-in fade-in zoom-in duration-500">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-[#0071e3] shadow-lg shadow-blue-500/20 mb-2">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-[#1d1d1f] dark:text-white tracking-tight">
              Join Accountability
            </h1>
            <p className="text-lg text-[#86868b]">Select your role to get started</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card 
              className="group cursor-pointer border-0 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden"
              onClick={() => handleRoleSelect("citizen")}
            >
              <CardContent className="p-8 flex flex-col items-center text-center space-y-6">
                <div className="w-20 h-20 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <UserIcon className="h-10 w-10 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#1d1d1f] dark:text-white mb-2">Citizen</h3>
                  <p className="text-[#86868b]">Submit applications, track status, and rate services</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#F5F5F7] dark:bg-slate-800 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowLeft className="h-5 w-5 text-[#1d1d1f] dark:text-white rotate-180" />
                </div>
              </CardContent>
            </Card>

            <Card 
              className="group cursor-pointer border-0 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden"
              onClick={() => handleRoleSelect("official")}
            >
              <CardContent className="p-8 flex flex-col items-center text-center space-y-6">
                <div className="w-20 h-20 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Shield className="h-10 w-10 text-[#0071e3]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#1d1d1f] dark:text-white mb-2">Official</h3>
                  <p className="text-[#86868b]">Process applications and manage department tasks</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#F5F5F7] dark:bg-slate-800 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowLeft className="h-5 w-5 text-[#1d1d1f] dark:text-white rotate-180" />
                </div>
              </CardContent>
            </Card>

            <Card 
              className="group cursor-pointer border-0 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden"
              onClick={() => handleRoleSelect("admin")}
            >
              <CardContent className="p-8 flex flex-col items-center text-center space-y-6">
                <div className="w-20 h-20 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Crown className="h-10 w-10 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#1d1d1f] dark:text-white mb-2">Admin</h3>
                  <p className="text-[#86868b]">Monitor system performance and manage users</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#F5F5F7] dark:bg-slate-800 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowLeft className="h-5 w-5 text-[#1d1d1f] dark:text-white rotate-180" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <p className="text-[#86868b]">
              Already have an account?{" "}
              <Link href="/login">
                <span className="text-[#0071e3] font-semibold hover:underline cursor-pointer">Login</span>
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Registration Form
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F5F7] dark:bg-slate-950 font-['Outfit',sans-serif] p-4">
      <div className="fixed top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md animate-in fade-in slide-in-from-right-8 duration-700">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-[#0071e3] shadow-lg shadow-blue-500/20 mb-4">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-[#1d1d1f] dark:text-white tracking-tight mb-2">
            Create Account
          </h1>
          <p className="text-[#86868b]">Join our smart governance platform</p>
        </div>

        <Card className="border-0 shadow-lg bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-8">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleBackToRoleSelection} 
                className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 -ml-2 text-[#86868b]"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#F5F5F7] dark:bg-slate-800">
                {selectedRole === "citizen" && <UserIcon className="h-4 w-4 text-green-600" />}
                {selectedRole === "official" && <Shield className="h-4 w-4 text-[#0071e3]" />}
                {selectedRole === "admin" && <Crown className="h-4 w-4 text-purple-600" />}
                <span className="text-sm font-semibold capitalize text-[#1d1d1f] dark:text-white">{selectedRole}</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-semibold text-[#1d1d1f] dark:text-white ml-1">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                  className="h-12 rounded-xl bg-[#F5F5F7] dark:bg-slate-800 border-transparent focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20 transition-all"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-[#1d1d1f] dark:text-white ml-1">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="h-12 rounded-xl bg-[#F5F5F7] dark:bg-slate-800 border-transparent focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20 transition-all"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-semibold text-[#1d1d1f] dark:text-white ml-1">Mobile Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter 10-digit number"
                  value={formData.phone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setFormData({ ...formData, phone: value });
                  }}
                  required
                  maxLength={10}
                  pattern="[0-9]{10}"
                  className="h-12 rounded-xl bg-[#F5F5F7] dark:bg-slate-800 border-transparent focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20 transition-all"
                />
              </div>

              {(formData.role === "official" || formData.role === "admin") && (
                <div className="space-y-4 p-4 rounded-2xl bg-[#F5F5F7] dark:bg-slate-800">
                  <div className="space-y-2">
                    <Label htmlFor="department" className="text-sm font-semibold text-[#1d1d1f] dark:text-white ml-1">Department *</Label>
                    <select
                      id="department"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value, subDepartment: "" })}
                      className="w-full h-12 rounded-xl bg-white dark:bg-slate-900 border-transparent focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20 transition-all px-3"
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
                      <Label htmlFor="subDepartment" className="text-sm font-semibold text-[#1d1d1f] dark:text-white ml-1">Sub-Department *</Label>
                      <select
                        id="subDepartment"
                        value={formData.subDepartment}
                        onChange={(e) => setFormData({ ...formData, subDepartment: e.target.value })}
                        className="w-full h-12 rounded-xl bg-white dark:bg-slate-900 border-transparent focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20 transition-all px-3"
                        required
                      >
                        <option value="">Select Sub-Department</option>
                        {getSubDepartmentsForDepartment(formData.department).map((subDept) => (
                          <option key={subDept.name} value={subDept.name}>
                            {subDept.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="secretKey" className="text-sm font-semibold text-[#1d1d1f] dark:text-white ml-1">Secret Key *</Label>
                    <div className="relative">
                      <Input
                        id="secretKey"
                        type={showSecretKey ? "text" : "password"}
                        placeholder={
                            formData.hierarchyLevel === "2" ? "Enter Key (supervisor@2025)" :
                            formData.hierarchyLevel === "3" ? "Enter Key (director@2025)" :
                            "Enter Key (official@2025)"
                        }
                        value={(formData as any).secretKey || ""}
                        onChange={(e) => setFormData({ ...formData, secretKey: e.target.value } as any)}
                        required
                        className="h-12 rounded-xl bg-white dark:bg-slate-900 border-transparent focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20 transition-all pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSecretKey(!showSecretKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white transition-colors"
                      >
                        {showSecretKey ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                </div>

              )}

              {formData.role === "official" && (
                <div className="space-y-4 p-4 rounded-2xl bg-[#F5F5F7] dark:bg-slate-800 mt-4">
                  <div className="space-y-2">
                     <Label htmlFor="hierarchyLevel" className="text-sm font-semibold text-[#1d1d1f] dark:text-white ml-1">Official Level *</Label>
                     <select
                        id="hierarchyLevel"
                        value={formData.hierarchyLevel}
                        onChange={(e) => setFormData({ ...formData, hierarchyLevel: e.target.value })}
                        className="w-full h-12 rounded-xl bg-white dark:bg-slate-900 border-transparent focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20 transition-all px-3"
                        required
                     >
                        <option value="1">Level 1 - Junior Official (Field Officer)</option>
                        <option value="2">Level 2 - Senior Official (Supervisor)</option>
                        <option value="3">Level 3 - Head of Dept (Director)</option>
                     </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="designation" className="text-sm font-semibold text-[#1d1d1f] dark:text-white ml-1">Designation *</Label>
                    <Input
                       id="designation"
                       type="text"
                       placeholder="e.g. Junior Clerk, Senior Inspector"
                       value={formData.designation || ""}
                       onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                       className="h-12 rounded-xl bg-white dark:bg-slate-900 border-transparent focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20 transition-all"
                       required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="documentType" className="text-sm font-semibold text-[#1d1d1f] dark:text-white ml-1">Document Type</Label>
                <Select 
                  value={formData.documentType} 
                  onValueChange={(value) => {
                    setFormData({ ...formData, documentType: value, aadharNumber: "" });
                  }}
                >
                  <SelectTrigger 
                    id="documentType"
                    className="h-12 rounded-xl bg-[#F5F5F7] dark:bg-slate-800 border-transparent focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20 transition-all"
                  >
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aadhaar">Aadhaar Card</SelectItem>
                    <SelectItem value="pan">PAN Card</SelectItem>
                    <SelectItem value="voter">Voter ID</SelectItem>
                    <SelectItem value="driving">Driving License</SelectItem>
                    <SelectItem value="passport">Passport</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="aadharNumber" className="text-sm font-semibold text-[#1d1d1f] dark:text-white ml-1">
                  {formData.documentType === "aadhaar" && "Aadhaar Number"}
                  {formData.documentType === "pan" && "PAN Number"}
                  {formData.documentType === "voter" && "Voter ID Number"}
                  {formData.documentType === "driving" && "Driving License Number"}
                  {formData.documentType === "passport" && "Passport Number"}
                </Label>
                <Input
                  id="aadharNumber"
                  type="text"
                  placeholder="Enter document number"
                  value={formData.aadharNumber}
                  onChange={(e) => {
                    let value = e.target.value;
                    if (formData.documentType === "aadhaar") {
                      value = value.replace(/\D/g, "").slice(0, 12);
                    } else if (formData.documentType === "pan") {
                      value = value.toUpperCase().slice(0, 10);
                    }
                    setFormData({ ...formData, aadharNumber: value });
                  }}
                  maxLength={formData.documentType === "aadhaar" ? 12 : formData.documentType === "pan" ? 10 : undefined}
                  required
                  className="h-12 rounded-xl bg-[#F5F5F7] dark:bg-slate-800 border-transparent focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20 transition-all"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-semibold text-[#1d1d1f] dark:text-white ml-1">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Choose a username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                  className="h-12 rounded-xl bg-[#F5F5F7] dark:bg-slate-800 border-transparent focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-semibold text-[#1d1d1f] dark:text-white ml-1">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      className="h-12 rounded-xl bg-[#F5F5F7] dark:bg-slate-800 border-transparent focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20 transition-all pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-semibold text-[#1d1d1f] dark:text-white ml-1">Confirm</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      required
                      className="h-12 rounded-xl bg-[#F5F5F7] dark:bg-slate-800 border-transparent focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20 transition-all pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 rounded-full bg-[#0071e3] hover:bg-[#0077ED] text-white font-semibold shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 mt-4"
                disabled={isLoading}
              >
                {isLoading ? "Creating Account..." : "Register"}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-[#86868b]">
                Already have an account?{" "}
                <Link href="/login">
                  <span className="text-[#0071e3] font-semibold hover:underline cursor-pointer">Login</span>
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="rounded-full text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white">
              Back to Home
            </Button>
          </Link>
        </div>

        {/* Duplicate/email/phone error modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="rounded-[24px]">
            <DialogHeader>
              <DialogTitle>Registration Error</DialogTitle>
              <DialogDescription>{modalMessage}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={() => setIsModalOpen(false)} className="rounded-full bg-[#0071e3]">OK</Button>
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
