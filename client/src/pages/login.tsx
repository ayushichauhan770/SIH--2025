import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Phone, Mail, User as UserIcon, Crown, ArrowLeft, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ThemeToggle } from "@/components/theme-toggle";
import { OTPModal } from "@/components/otp-modal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { SiGoogle } from "react-icons/si";
import type { User } from "@shared/schema";


export default function Login() {
  const [, setLocation] = useLocation();
  const { setUser } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"citizen" | "official" | "admin" | null>(null);
  const [loginRole, setLoginRole] = useState<"citizen" | "official" | "admin">("citizen");
  const [tempUser, setTempUser] = useState<{ user: User; phone?: string; email?: string; otpMethod?: "phone" | "email" } | null>(null);
  const [activeTab, setActiveTab] = useState("mobile");
  const [showPassword, setShowPassword] = useState(false);

  // Check for role parameter in URL and auto-select the role
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roleParam = params.get("role");
    if (roleParam === "citizen" || roleParam === "official" || roleParam === "admin") {
      setSelectedRole(roleParam);
      setLoginRole(roleParam);
    }
  }, []);

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    phone: "",
    email: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let payload: any = {};

      if (activeTab === "mobile") {
        if (!formData.phone) throw new Error("Please enter your mobile number");
        // Password is optional for mobile login (OTP based)
        payload = { phone: formData.phone, password: formData.password };
      } else {
        // Email/Username tab
        if (!formData.username && !formData.email) throw new Error("Please enter username or email");
        if (!formData.password) throw new Error("Please enter your password");

        // Check if input is email or username
        if (formData.username.includes("@")) {
          payload = { email: formData.username, password: formData.password };
        } else {
          payload = { username: formData.username, password: formData.password };
        }
      }

      const response = await apiRequest<{ user: User; phone?: string; email?: string; otpMethod?: "phone" | "email"; otp?: string }>(
        "POST",
        "/api/auth/login",
        payload
      );

      if (response.otp) {
        (window as any).LAST_OTP = response.otp;
        console.log("OTP exposed for testing:", response.otp);
      }
      setTempUser(response);
      setShowOTP(true);

      const otpMessage = response.otpMethod === "email"
        ? "We've sent an OTP to your email. Kindly check your inbox (and spam folder) and enter the OTP to log in."
        : "An OTP has been sent to your registered mobile number. Please enter it to continue.";

      toast({
        title: "OTP Sent Successfully",
        description: otpMessage,
      });
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
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
        purpose: "login",
      });

      // After successful OTP verification, request a token to complete login
      const tokenResp = await apiRequest<{ user: User; token: string }>(
        "POST",
        "/api/auth/token",
        {
          username: tempUser?.user.username,
          phone: tempUser?.phone,
          email: tempUser?.email,
          purpose: "login"
        }
      );

      // persist auth and update context
      sessionStorage.setItem("user", JSON.stringify(tokenResp.user));
      sessionStorage.setItem("token", tokenResp.token);
      setUser(tokenResp.user);

      toast({ title: "Welcome back!", description: "Logged in successfully" });

      // close OTP modal and clear temp state
      setShowOTP(false);
      setTempUser(null);
      setFormData({ username: "", password: "", phone: "", email: "" });

      // Navigate based on selected login role
      if (loginRole === "admin") {
        setLocation("/admin/dashboard");
      } else if (loginRole === "official") {
        setLocation("/official/dashboard");
      } else {
        setLocation("/citizen/dashboard");
      }

      return true;
    } catch (error: any) {
      const message = error?.message || String(error) || "OTP verification failed";
      toast({ title: "Verification Failed", description: message, variant: "destructive" });
      return false;
    }
  };

  const handleGoogleLogin = () => {
    // Redirect to Google Auth endpoint
    // Note: This requires backend configuration for Google OAuth
    window.location.href = "/api/auth/google";
  };

  const handleRoleSelect = (role: "citizen" | "official" | "admin") => {
    setSelectedRole(role);
    setLoginRole(role);
  };

  const handleBackToRoleSelection = () => {
    setSelectedRole(null);
    setFormData({ username: "", password: "", phone: "", email: "" });
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
              Welcome to Accountability
            </h1>
            <p className="text-lg text-[#86868b]">Select your role to continue</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card 
              className="group cursor-pointer border-0 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden"
              onClick={() => handleRoleSelect("citizen")}
            >
              <CardContent className="p-8 flex flex-col items-center text-center space-y-6">
                <div className="w-20 h-20 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <UserIcon className="h-10 w-10 text-[#0071e3]" />
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
                <div className="w-20 h-20 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Shield className="h-10 w-10 text-purple-600" />
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
                <div className="w-20 h-20 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Crown className="h-10 w-10 text-orange-600" />
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
              Don't have an account?{" "}
              <Link href="/register">
                <span className="text-[#0071e3] font-semibold hover:underline cursor-pointer">Register Now</span>
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Login Form
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F5F7] dark:bg-slate-950 font-['Outfit',sans-serif] p-4">
      <div className="fixed top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-[#0071e3] shadow-lg shadow-blue-500/20 mb-4">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-[#1d1d1f] dark:text-white tracking-tight mb-2">
            Welcome Back
          </h1>
          <p className="text-[#86868b]">Sign in to your account</p>
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
                {selectedRole === "citizen" && <UserIcon className="h-4 w-4 text-[#0071e3]" />}
                {selectedRole === "official" && <Shield className="h-4 w-4 text-purple-600" />}
                {selectedRole === "admin" && <Crown className="h-4 w-4 text-orange-600" />}
                <span className="text-sm font-semibold capitalize text-[#1d1d1f] dark:text-white">{selectedRole}</span>
              </div>
            </div>

            <Tabs defaultValue="mobile" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8 p-1 bg-[#F5F5F7] dark:bg-slate-800 rounded-2xl">
                <TabsTrigger 
                  value="mobile" 
                  className="rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm transition-all"
                >
                  <Phone className="h-4 w-4 mr-2" /> Mobile
                </TabsTrigger>
                <TabsTrigger 
                  value="email" 
                  className="rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm transition-all"
                >
                  <Mail className="h-4 w-4 mr-2" /> Email
                </TabsTrigger>
              </TabsList>

              <form onSubmit={handleSubmit} className="space-y-6">
                <TabsContent value="mobile" className="space-y-4 mt-0">
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
                      required={activeTab === "mobile"}
                      maxLength={10}
                      pattern="[0-9]{10}"
                      className="h-12 rounded-xl bg-[#F5F5F7] dark:bg-slate-800 border-transparent focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mobile-password" className="text-sm font-semibold text-[#1d1d1f] dark:text-white ml-1">Password</Label>
                    <div className="relative">
                      <Input
                        id="mobile-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="h-12 rounded-xl bg-[#F5F5F7] dark:bg-slate-800 border-transparent focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20 transition-all pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="email" className="space-y-4 mt-0">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-sm font-semibold text-[#1d1d1f] dark:text-white ml-1">Username or Email</Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="Enter username or email"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      required={activeTab === "email"}
                      className="h-12 rounded-xl bg-[#F5F5F7] dark:bg-slate-800 border-transparent focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between ml-1">
                      <Label htmlFor="password" className="text-sm font-semibold text-[#1d1d1f] dark:text-white">Password</Label>
                      <Link href="/forgot-password">
                        <span className="text-xs text-[#0071e3] hover:underline cursor-pointer font-medium">Forgot Password?</span>
                      </Link>
                    </div>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required={activeTab === "email"}
                        className="h-12 rounded-xl bg-[#F5F5F7] dark:bg-slate-800 border-transparent focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20 transition-all pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                </TabsContent>

                <Button
                  type="submit"
                  className="w-full h-12 rounded-full bg-[#0071e3] hover:bg-[#0077ED] text-white font-semibold shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
                  disabled={isLoading}
                >
                  {isLoading ? "Processing..." : (activeTab === "mobile" ? "Send OTP" : "Login")}
                </Button>
              </form>
            </Tabs>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-slate-900 px-2 text-[#86868b]">Or continue with</span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full h-12 rounded-full border-slate-200 dark:border-slate-700 hover:bg-[#F5F5F7] dark:hover:bg-slate-800 text-[#1d1d1f] dark:text-white font-medium transition-all"
              onClick={handleGoogleLogin}
            >
              <SiGoogle className="h-5 w-5 mr-2" />
              Google
            </Button>

            <div className="mt-8 text-center">
              <p className="text-[#86868b]">
                Don't have an account?{" "}
                <Link href="/register">
                  <span className="text-[#0071e3] font-semibold hover:underline cursor-pointer">Register Now</span>
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* OTP Modal */}
      {tempUser && (
        <OTPModal
          open={showOTP}
          onClose={() => {
            setShowOTP(false);
            setTempUser(null);
            setFormData({ username: "", password: "", phone: "", email: "" });
          }}
          onVerify={handleOTPVerify}
          phone={tempUser.phone}
          email={tempUser.email}
          purpose="login"
        />
      )}

    </div>
  );
}
