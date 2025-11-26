import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield } from "lucide-react";
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

const DEPARTMENTS = [
  "Aadhaar – Unique Identification Authority of India (UIDAI)",
  "Animal Husbandry & Dairying – Department of Animal Husbandry and Dairying",
  "Agriculture – Ministry of Agriculture and Farmers Welfare",
  "CBSE – Central Board of Secondary Education",
  "Central Public Works Department (CPWD)",
  "Consumer Affairs – Department of Consumer Affairs",
  "Corporate Affairs – Ministry of Corporate Affairs",
  "Education – Ministry of Education",
  "Electricity – Ministry of Power",
  "Election Commission of India (ECI)",
  "Employees’ Provident Fund Organisation (EPFO)",
  "Employees’ State Insurance Corporation (ESIC)",
  "Finance – Ministry of Finance",
  "Food & Civil Supplies – Department of Food and Public Distribution",
  "Forest – Ministry of Environment, Forest and Climate Change",
  "Health – Ministry of Health and Family Welfare",
  "Home Affairs – Ministry of Home Affairs",
  "Income Tax Department (CBDT)",
  "Industrial Development – Department for Promotion of Industry and Internal Trade (DPIIT)",
  "Labour – Ministry of Labour and Employment",
  "Minority Affairs – Ministry of Minority Affairs",
  "Municipal Corporation / Urban Local Bodies (ULBs)",
  "Panchayati Raj – Ministry of Panchayati Raj",
  "Passport – Ministry of External Affairs (Passport Seva)",
  "Personnel & Training – Department of Personnel and Training (DoPT)",
  "Police – State Police Department",
  "Pollution – Central Pollution Control Board (CPCB)",
  "Post Office – Department of Posts",
  "Public Grievances – Department of Administrative Reforms and Public Grievances (DARPG)",
  "Public Works – Public Works Department (PWD)",
  "Railways – Ministry of Railways",
  "Revenue – Department of Revenue (Ministry of Finance)",
  "Road Transport – Ministry of Road Transport and Highways (MoRTH)",
  "Rural Development – Ministry of Rural Development",
  "Science & Technology – Ministry of Science and Technology",
  "Skills – Ministry of Skill Development and Entrepreneurship",
  "Social Justice – Ministry of Social Justice and Empowerment",
  "Telecommunications – Department of Telecommunications (DoT)",
  "Urban Development – Ministry of Housing and Urban Affairs (MoHUA)",
  "Water – Ministry of Jal Shakti",
  "Women & Child Development – Ministry of Women and Child Development",
  "Other"
];

export default function Register() {
  const [, setLocation] = useLocation();
  const { setUser } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
<<<<<<< HEAD
  const [tempUser, setTempUser] = useState<{ user: User; phone?: string; email?: string; otpMethod?: "phone" | "email" } | null>(null);
=======
  const [tempUser, setTempUser] = useState<{ user: User; recipient: string } | null>(null);
>>>>>>> e521b45e5e9f988fe7945c688af4ed3bec9b205d
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    email: "",
    phone: "",
    aadharNumber: "",
    role: "citizen",
<<<<<<< HEAD
    department: "",
=======
>>>>>>> e521b45e5e9f988fe7945c688af4ed3bec9b205d
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

    setIsLoading(true);

    try {
      const { confirmPassword, ...registerData } = formData;
<<<<<<< HEAD

      // Filter out empty optional fields to avoid sending empty strings
      const cleanedData = Object.fromEntries(
        Object.entries(registerData).filter(([key, value]) => {
          // Keep all required fields and non-empty optional fields
          if (key === 'phone' || key === 'aadharNumber' || key === 'department') {
            return value && value.trim() !== '';
          }
          return true;
        })
      );

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
=======
      const response = await apiRequest<{ user: User; token?: string; recipient?: string; otp?: string }>(
        "POST",
        "/api/auth/register",
        registerData
      );

      // If server returned a phone (two-step flow), show OTP modal
      if (response.recipient) {
        setTempUser({ user: response.user, recipient: response.recipient });
        setShowOTP(true);
        toast({ title: "OTP Sent", description: "Check your email or phone for the verification code" });
>>>>>>> e521b45e5e9f988fe7945c688af4ed3bec9b205d
        return;
      }

      // otherwise immediate login (no phone)
      if (response.token) {
        localStorage.setItem("user", JSON.stringify(response.user));
        localStorage.setItem("token", response.token);
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
<<<<<<< HEAD
      await apiRequest<{ message?: string }>("POST", "/api/auth/verify-otp", {
        phone: tempUser?.phone,
        email: tempUser?.email,
=======
      await apiRequest<{ message?: string }>("POST", "/api/otp/verify", {
        recipient: tempUser?.recipient,
>>>>>>> e521b45e5e9f988fe7945c688af4ed3bec9b205d
        otp,
        purpose: "register",
      });

      const tokenResp = await apiRequest<{ user: User; token: string }>("POST", "/api/auth/token", {
        username: tempUser?.user.username,
        phone: tempUser?.phone,
        email: tempUser?.email,
        purpose: "register"
      });

      localStorage.setItem("user", JSON.stringify(tokenResp.user));
      localStorage.setItem("token", tokenResp.token);
      setUser(tokenResp.user);

      toast({ title: "Registration Complete", description: "Your account is verified and ready" });

      setShowOTP(false);
      setTempUser(null);
<<<<<<< HEAD
      setFormData({ username: "", password: "", confirmPassword: "", fullName: "", email: "", phone: "", aadharNumber: "", role: "citizen", department: "" });
=======
      setFormData({ username: "", password: "", confirmPassword: "", fullName: "", email: "", phone: "", aadharNumber: "", role: "citizen" });
>>>>>>> e521b45e5e9f988fe7945c688af4ed3bec9b205d

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
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent mb-6">Create Account</h2>

            <Tabs defaultValue="citizen" value={formData.role} onValueChange={(val) => setFormData({ ...formData, role: val })} className="w-full mb-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="citizen">Citizen</TabsTrigger>
                <TabsTrigger value="official">Official</TabsTrigger>
                <TabsTrigger value="admin">Admin</TabsTrigger>
              </TabsList>
            </Tabs>

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
                <Label htmlFor="phone" className="text-sm font-semibold">Mobile Number (Optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter your mobile number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  data-testid="input-phone"
                  className="border-purple-200/30 bg-white/10 dark:bg-slate-900/30 focus:border-purple-500 focus:ring-purple-500/20 dark:border-purple-800/30 dark:focus:bg-slate-900/40 backdrop-blur-sm"
                />
              </div>
              <div className="space-y-2">
<<<<<<< HEAD
=======
                <Label htmlFor="role" className="text-sm font-semibold">Register As</Label>
                <select
                  id="role"
                  aria-label="Select registration role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  data-testid="select-role"
                  className="w-full border-purple-200/30 bg-white/10 dark:bg-slate-900/30 focus:border-purple-500 focus:ring-purple-500/20 dark:border-purple-800/30 dark:focus:bg-slate-900/40 rounded-md p-2"
                >
                  <option value="citizen">Citizen</option>
                  <option value="official">Official</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
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
                  data-testid="input-aadhar"
                  className="border-purple-200/30 bg-white/10 dark:bg-slate-900/30 focus:border-purple-500 focus:ring-purple-500/20 dark:border-purple-800/30 dark:focus:bg-slate-900/40 backdrop-blur-sm"
                />
              </div>
              <div className="space-y-2">
>>>>>>> e521b45e5e9f988fe7945c688af4ed3bec9b205d
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
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  data-testid="input-password"
                  className="border-purple-200/50 bg-white/20 dark:bg-slate-900/40 focus:border-purple-500 focus:ring-purple-500/20 dark:border-purple-800/50 dark:focus:bg-slate-900/60 backdrop-blur-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-semibold">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  data-testid="input-confirm-password"
                  className="border-purple-200/30 bg-white/10 dark:bg-slate-900/30 focus:border-purple-500 focus:ring-purple-500/20 dark:border-purple-800/30 dark:focus:bg-slate-900/40 backdrop-blur-sm"
                />
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
<<<<<<< HEAD
          phone={tempUser.phone}
          email={tempUser.email}
=======
          recipient={tempUser.recipient}
>>>>>>> e521b45e5e9f988fe7945c688af4ed3bec9b205d
          purpose="register"
        />
      )}
    </div>
  );
}
