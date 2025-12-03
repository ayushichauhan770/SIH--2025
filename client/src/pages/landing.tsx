import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Shield, Bell, Award, Clock, CheckCircle, Star, Phone, Mail } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/contexts/auth-context";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { getAllDepartmentNames } from "@shared/sub-departments";

interface DepartmentRating {
  department_id: string;
  department_name: string;
  averageRating: number;
  totalRatings: number;
  officialCount: number;
}

interface RatingsData {
  websiteRating: number;
  totalRatings: number;
  departments: DepartmentRating[];
}

export default function Landing() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const { data: ratingsData, isLoading: ratingsLoading, error } = useQuery<RatingsData>({
    queryKey: ["/api/public/ratings"],
    queryFn: () => apiRequest<RatingsData>("GET", "/api/public/ratings"),
    retry: 3,
    refetchInterval: 10000, // Refetch every 10 seconds for real-time updates
    refetchOnWindowFocus: true, // Refetch when user returns to the page
    staleTime: 5000, // Consider data stale after 5 seconds
  });

  // Fallback: if API fails, show all departments with 0 ratings
  const allDepartmentNames = getAllDepartmentNames();
  const displayDepartments = (ratingsData?.departments || allDepartmentNames.map((name, index) => ({
    department_id: `dept-${index}`,
    department_name: name,
    averageRating: 0,
    totalRatings: 0,
    officialCount: 0,
  }))).sort((a, b) => {
    // Sort by rating descending (highest first)
    if (a.averageRating !== b.averageRating) {
      return b.averageRating - a.averageRating;
    }
    // If ratings are equal, sort alphabetically by name
    return a.department_name.localeCompare(b.department_name);
  });

  const handleSubmitApplication = () => {
    setLocation("/login?role=citizen");
  };
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <header className="border-b sticky top-0 bg-white/95 dark:bg-slate-950/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-slate-950/60 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <span className="font-heading font-bold text-xl bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
              Digital Governance
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost" className="hover:bg-blue-50 dark:hover:bg-slate-800" data-testid="button-login">
                Login
              </Button>
            </Link>
            <Link href="/register">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white" data-testid="button-register">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-purple-50/30 to-pink-50/20 dark:from-blue-950/20 dark:via-purple-950/10 dark:to-pink-950/10" />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-400/30 to-purple-400/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-purple-400/30 to-pink-400/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-5xl md:text-7xl font-bold font-heading bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent animate-pulse">
              Transparent Digital Governance
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300">
              Submit, track, and manage government applications with AI-powered monitoring,
              blockchain verification, and guaranteed 30-day processing
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all" 
                data-testid="button-submit-application"
                onClick={handleSubmitApplication}
              >
                Submit Application
              </Button>
              <Link href="/track">
                <Button size="lg" variant="outline" className="border-purple-300 hover:bg-purple-50 dark:border-purple-700 dark:hover:bg-purple-950" data-testid="button-track-application">
                  Track Application
                </Button>
              </Link>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6 pt-8 text-sm">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 dark:bg-blue-950/50">
                <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-blue-900 dark:text-blue-100">30-Day Auto-Assign</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-50 dark:bg-purple-950/50">
                <Bell className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <span className="text-purple-900 dark:text-purple-100">AI-Monitored</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-pink-50 dark:bg-pink-950/50">
                <Shield className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                <span className="text-pink-900 dark:text-pink-100">Blockchain Verified</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-br from-slate-100/50 to-slate-200/50 dark:from-slate-800/50 dark:to-slate-900/50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold font-heading text-center mb-12 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
            Key Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-0 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50">
              <CardHeader>
                <div className="p-3 rounded-lg bg-blue-500 text-white w-fit mb-3">
                  <FileText className="h-6 w-6" />
                </div>
                <CardTitle className="font-heading text-blue-900 dark:text-blue-100">Real-time Tracking</CardTitle>
                <CardDescription className="text-blue-700 dark:text-blue-300">
                  Track your application status at every step with detailed timeline and notifications
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-0 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/50">
              <CardHeader>
                <div className="p-3 rounded-lg bg-purple-500 text-white w-fit mb-3">
                  <Bell className="h-6 w-6" />
                </div>
                <CardTitle className="font-heading text-purple-900 dark:text-purple-100">AI Monitoring</CardTitle>
                <CardDescription className="text-purple-700 dark:text-purple-300">
                  Advanced AI detects delays and automatically escalates to ensure timely processing
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-0 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-950/50 dark:to-pink-900/50">
              <CardHeader>
                <div className="p-3 rounded-lg bg-pink-500 text-white w-fit mb-3">
                  <Shield className="h-6 w-6" />
                </div>
                <CardTitle className="font-heading text-pink-900 dark:text-pink-100">Secure Feedback</CardTitle>
                <CardDescription className="text-pink-700 dark:text-pink-300">
                  OTP-verified feedback system ensures authentic ratings and improves service quality
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold font-heading text-center mb-12 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { step: 1, icon: FileText, title: "Submit", desc: "Fill out your application online", color: "from-blue-500 to-blue-600" },
              { step: 2, icon: Award, title: "Assign", desc: "AI assigns to available official", color: "from-purple-500 to-purple-600" },
              { step: 3, icon: Bell, title: "Monitor", desc: "Receive real-time status updates", color: "from-pink-500 to-pink-600" },
              { step: 4, icon: CheckCircle, title: "Approve", desc: "Get verified blockchain certificate", color: "from-green-500 to-green-600" },
            ].map(({ step, icon: Icon, title, desc, color }) => (
              <div key={step} className="text-center space-y-3 group hover:scale-105 transition-all duration-300">
                <div className="flex justify-center">
                  <div className={`flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br ${color} text-white font-bold text-2xl shadow-lg group-hover:shadow-xl transition-all`}>
                    {step}
                  </div>
                </div>
                <Icon className="h-8 w-8 mx-auto text-gray-600 dark:text-gray-400" />
                <h3 className="font-heading font-semibold text-lg">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-br from-slate-100/50 to-slate-200/50 dark:from-slate-800/50 dark:to-slate-900/50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold font-heading text-center mb-12 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
            Public Dashboard
          </h2>

          {/* Website Overall Rating */}
          <div className="max-w-2xl mx-auto mb-12">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 hover:shadow-xl transition-all">
              <CardHeader className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Star className="h-8 w-8 text-yellow-500 fill-yellow-500" />
                  <CardTitle className="font-heading text-5xl bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                    {ratingsData ? `${ratingsData.websiteRating.toFixed(1)}/5.0` : "0.0/5.0"}
                  </CardTitle>
                </div>
                <CardDescription className="text-lg font-semibold">
                  Overall Website Rating
                </CardDescription>
                <CardDescription className="text-sm text-muted-foreground">
                  Based on {ratingsData?.totalRatings || 0} ratings from all officials
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* Department Ratings */}
          <h3 className="text-2xl font-bold font-heading text-center mb-8 text-gray-700 dark:text-gray-300">
            Department Ratings
          </h3>
          {ratingsLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading department ratings...</p>
            </div>
          ) : (
            <div className="max-w-6xl mx-auto bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-md p-5 h-[600px] overflow-y-auto">
              {displayDepartments.map((dept, index) => (
                <div
                  key={dept.department_id}
                  className={`flex items-center justify-between py-3 px-4 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer rounded-lg ${
                    index !== displayDepartments.length - 1 ? "border-b border-gray-200 dark:border-gray-700" : ""
                  }`}
                >
                  {/* Left: Star + Rating */}
                  <div className="flex items-center gap-3 min-w-[140px]">
                    <Star className={`h-5 w-5 flex-shrink-0 ${dept.averageRating > 0 ? "text-yellow-500 fill-yellow-500" : "text-gray-400"}`} />
                    <span className={`font-bold text-lg ${
                      dept.averageRating > 0
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-gray-400 dark:text-gray-500"
                    }`}>
                      {dept.averageRating.toFixed(1)}/5.0
                    </span>
                  </div>

                  {/* Center: Department Name */}
                  <div className="flex-1 px-4">
                    <h4 className={`font-semibold text-base ${
                      dept.averageRating > 0
                        ? "text-gray-900 dark:text-gray-100"
                        : "text-gray-600 dark:text-gray-400"
                    }`}>
                      {dept.department_name}
                    </h4>
                  </div>

                  {/* Right: Status/Info */}
                  <div className="flex items-center gap-4 min-w-[220px] justify-end">
                    {(dept.totalRatings > 0 || dept.officialCount > 0) && (
                      <span className="text-sm text-muted-foreground">
                        {dept.totalRatings > 0 ? (
                          <>
                            {dept.totalRatings} rating{dept.totalRatings !== 1 ? "s" : ""} • {dept.officialCount} official{dept.officialCount !== 1 ? "s" : ""}
                          </>
                        ) : (
                          `${dept.officialCount} official${dept.officialCount !== 1 ? "s" : ""}`
                        )}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <footer className="bg-black text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-8">
            {/* Column 1: Category */}
            <div>
              <h3 className="font-bold text-lg mb-4">Category</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:underline">Individuals</a></li>
                <li><a href="#" className="hover:underline">Business</a></li>
                <li><a href="#" className="hover:underline">Foreign Nationals</a></li>
                <li><a href="#" className="hover:underline">Government Employees</a></li>
                <li><a href="#" className="hover:underline">Overseas Indians</a></li>
              </ul>
            </div>

            {/* Column 2: My Government */}
            <div>
              <h3 className="font-bold text-lg mb-4">My Government</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:underline">Constitution of India</a></li>
                <li><a href="#" className="hover:underline">Government Directory</a></li>
                <li><a href="#" className="hover:underline">Indian Parliament</a></li>
                <li><a href="#" className="hover:underline">Judiciary</a></li>
                <li><a href="#" className="hover:underline">Ministries</a></li>
                <li><a href="#" className="hover:underline">State Governments</a></li>
              </ul>
            </div>

            {/* Column 3: Explore India + News Hub */}
            <div>
              <h3 className="font-bold text-lg mb-4">Explore India</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:underline">About India</a></li>
                <li><a href="#" className="hover:underline">India at a Glance</a></li>
                <li><a href="#" className="hover:underline">National Symbols</a></li>
                <li><a href="#" className="hover:underline">States & UTs</a></li>
              </ul>
              <h3 className="font-bold text-lg mb-4 mt-6">News Hub</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:underline">Press Releases</a></li>
                <li><a href="#" className="hover:underline">News Updates</a></li>
              </ul>
            </div>

            {/* Column 4: About Us */}
            <div>
              <h3 className="font-bold text-lg mb-4">About Us</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:underline">About Portal</a></li>
                <li><a href="#" className="hover:underline">Help</a></li>
                <li><a href="#" className="hover:underline">FAQs</a></li>
                <li><a href="#" className="hover:underline">Feedback</a></li>
                <li><a href="#" className="hover:underline">Terms & Conditions</a></li>
                <li><a href="#" className="hover:underline">Privacy Policy</a></li>
                <li><a href="#" className="hover:underline">Accessibility</a></li>
                <li><a href="#" className="hover:underline">Sitemap</a></li>
              </ul>
            </div>

            {/* Column 5: Calendar */}
            <div>
              <h3 className="font-bold text-lg mb-4">Calendar</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:underline">National Holidays</a></li>
                <li><a href="#" className="hover:underline">Government Events</a></li>
                <li><a href="#" className="hover:underline">Important Dates</a></li>
                <li><a href="#" className="hover:underline">Public Holidays</a></li>
              </ul>
            </div>
          </div>

          {/* Contact Information */}
          <div className="border-t border-gray-700 pt-8 mt-8">
            <div className="text-center mb-6">
              <h4 className="font-bold text-lg mb-4">Contact Us</h4>
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-blue-400" />
                  <span className="text-sm">+91 1800-123-4567</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-blue-400" />
                  <a href="mailto:support@digitalgovernance.gov.in" className="text-sm hover:underline">
                    support@digitalgovernance.gov.in
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Copyright */}
          <div className="border-t border-gray-700 pt-6 text-center">
            <p className="text-sm">© 2025 Digital Governance Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
