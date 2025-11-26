import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Phone, Mail, User as UserIcon } from "lucide-react";
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
  const [tempUser, setTempUser] = useState<{ user: User; phone?: string; email?: string; otpMethod?: "phone" | "email" } | null>(null);
  const [activeTab, setActiveTab] = useState("mobile");

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
        if (!formData.password) throw new Error("Please enter your password");
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
      localStorage.setItem("user", JSON.stringify(tokenResp.user));
      localStorage.setItem("token", tokenResp.token);
      setUser(tokenResp.user);

      toast({ title: "Welcome back!", description: "Logged in successfully" });

      // close OTP modal and clear temp state
      setShowOTP(false);
      setTempUser(null);
      setFormData({ username: "", password: "", phone: "", email: "" });

      // navigate based on role
      const role = tokenResp.user?.role;
      if (role === "admin") {
        setLocation("/admin/dashboard");
      } else if (role === "official") {
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4 relative overflow-hidden">
      <div className="fixed top-4 left-4 z-50">
        <ThemeToggle />
      </div>
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-green-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>

        {/* Circular decorative boxes */}
        <div className="absolute top-20 left-10 w-32 h-32 border-2 border-green-300/30 rounded-full animate-spin" style={{ animationDuration: "20s", animationDirection: "reverse" }}></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 border-2 border-blue-300/30 rounded-full animate-pulse"></div>
        <div className="absolute top-1/2 right-20 w-24 h-24 border-2 border-purple-300/30 rounded-full" style={{ animationName: "none" }}></div>
        <div className="absolute bottom-1/3 left-1/4 w-28 h-28 border-2 border-green-300/20 rounded-full animate-bounce"></div>
      </div>

      <div className="w-full max-w-md space-y-6 relative z-10 animate-slide-in-left">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="p-3 rounded-full bg-gradient-to-br from-green-500 to-blue-600 animate-bounce">
            <Shield className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold font-heading bg-gradient-to-r from-green-600 to-blue-600 dark:from-green-400 dark:to-blue-400 bg-clip-text text-transparent">
            Digital Governance
          </h1>
          <p className="text-sm text-muted-foreground">Welcome back! Sign in to your account</p>
        </div>

        <Card className="border border-white/20 dark:border-slate-700/60 bg-white/60 dark:bg-slate-800/70 backdrop-blur-2xl shadow-2xl hover:shadow-2xl transition-all duration-300 rounded-3xl w-full max-w-md p-6">
          <div className="flex flex-col items-center justify-center">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 dark:from-green-400 dark:to-blue-400 bg-clip-text text-transparent mb-6">Login</h2>

            <Tabs defaultValue="mobile" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="mobile" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" /> Mobile
                </TabsTrigger>
                <TabsTrigger value="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" /> Email/User
                </TabsTrigger>
              </TabsList>

              <form onSubmit={handleSubmit} className="space-y-4 w-full bg-white/10 dark:bg-slate-900/20 backdrop-blur-md rounded-2xl p-4">
                <TabsContent value="mobile" className="space-y-4 mt-0">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-semibold">Mobile Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Enter your mobile number"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required={activeTab === "mobile"}
                      className="border-green-200/30 bg-white/10 dark:bg-slate-900/30 focus:border-green-500 focus:ring-green-500/20 dark:border-green-800/30 dark:focus:bg-slate-900/40 backdrop-blur-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mobile-password" className="text-sm font-semibold">Password</Label>
                    <Input
                      id="mobile-password"
                      type="password"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required={activeTab === "mobile"}
                      className="border-green-200/30 bg-white/10 dark:bg-slate-900/30 focus:border-green-500 focus:ring-green-500/20 dark:border-green-800/30 dark:focus:bg-slate-900/40 backdrop-blur-sm"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="email" className="space-y-4 mt-0">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-sm font-semibold">Username or Email</Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="Enter username or email"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      required={activeTab === "email"}
                      className="border-green-200/30 bg-white/10 dark:bg-slate-900/30 focus:border-green-500 focus:ring-green-500/20 dark:border-green-800/30 dark:focus:bg-slate-900/40 backdrop-blur-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-sm font-semibold">Password</Label>
                      <Link href="/forgot-password" className="text-xs text-green-600 dark:text-green-400 hover:underline">
                        Forgot Password?
                      </Link>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required={activeTab === "email"}
                      className="border-green-200/30 bg-white/10 dark:bg-slate-900/30 focus:border-green-500 focus:ring-green-500/20 dark:border-green-800/30 dark:focus:bg-slate-900/40 backdrop-blur-sm"
                    />
                  </div>
                </TabsContent>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 mt-4"
                  disabled={isLoading}
                >
                  {isLoading ? "Processing..." : (activeTab === "mobile" ? "Send OTP" : "Login")}
                </Button>
              </form>
            </Tabs>

            <div className="w-full flex items-center gap-4 my-4">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground">OR</span>
              <Separator className="flex-1" />
            </div>

            <Button
              variant="outline"
              className="w-full flex items-center gap-2 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={handleGoogleLogin}
            >
              <SiGoogle className="h-4 w-4" />
              Continue with Google
            </Button>

            <div className="mt-4 text-center text-sm">
              Don't have an account?{" "}
              <Link href="/register" className="text-green-600 dark:text-green-400 hover:underline font-semibold">
                Register
              </Link>
            </div>
          </div>
        </Card>

        <div className="text-center">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400">
              Back to Home
            </Button>
          </Link>
        </div>
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
