import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Shield, Bell, Award, Clock, CheckCircle, Star, Phone, Mail, CheckCircle2, ChevronRight } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/contexts/auth-context";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import FundingTransparency from "@/components/FundingTransparency";
import PoliticianRatingSection from "@/components/PoliticianRatingSection";
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
            {/* <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
              <Shield className="h-6 w-6 text-white" />
            </div> */}
            <span className="font-heading font-bold text-xl bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-300 bg-clip-text text-transparent">
              Accountability
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
              <Button className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white shadow-md hover:shadow-lg transition-all" data-testid="button-register">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 via-cyan-50/50 to-sky-50/30 dark:from-blue-950/30 dark:via-cyan-950/20 dark:to-sky-950/10" />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-sky-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-5xl md:text-7xl font-extrabold font-heading text-slate-900 dark:text-white tracking-tight leading-tight">
              Transparent Digital Governance
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300">
              Submit, track, and manage government applications with AI-powered monitoring,
              blockchain verification, and guaranteed 30-day processing
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white shadow-lg hover:shadow-xl transition-all" 
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
              <Link href="/election/candidates">
                <Button size="lg" variant="outline" className="border-green-300 hover:bg-green-50 dark:border-green-700 dark:hover:bg-green-950" data-testid="button-candidate-selection">
                  <Award className="h-4 w-4 mr-2" />
                  Candidate Selection
                </Button>
              </Link>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6 pt-8 text-sm">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 dark:bg-blue-950/50">
                <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-blue-900 dark:text-blue-100">30-Day Auto-Assign</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-50 dark:bg-cyan-950/50 border border-cyan-100 dark:border-cyan-900/50">
                <Bell className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                <span className="text-cyan-900 dark:text-cyan-100">AI-Monitored</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-50 dark:bg-sky-950/50 border border-sky-100 dark:border-sky-900/50">
                <Shield className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                <span className="text-sky-900 dark:text-sky-100">Blockchain Verified</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-br from-slate-100/50 to-slate-200/50 dark:from-slate-800/50 dark:to-slate-900/50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold font-heading text-center mb-12 bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
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
            <Card className="glass-card border-0 bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-950/30 dark:to-cyan-900/30">
              <CardHeader>
                <div className="p-3 rounded-lg bg-cyan-500 text-white w-fit mb-3 shadow-md">
                  <Bell className="h-6 w-6" />
                </div>
                <CardTitle className="font-heading text-cyan-900 dark:text-cyan-100">AI Monitoring</CardTitle>
                <CardDescription className="text-cyan-700 dark:text-cyan-300">
                  Advanced AI detects delays and automatically escalates to ensure timely processing
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="glass-card border-0 bg-gradient-to-br from-sky-50 to-sky-100 dark:from-sky-950/30 dark:to-sky-900/30">
              <CardHeader>
                <div className="p-3 rounded-lg bg-sky-500 text-white w-fit mb-3 shadow-md">
                  <Shield className="h-6 w-6" />
                </div>
                <CardTitle className="font-heading text-sky-900 dark:text-sky-100">Secure Feedback</CardTitle>
                <CardDescription className="text-sky-700 dark:text-sky-300">
                  OTP-verified feedback system ensures authentic ratings and improves service quality
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-0 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50">
              <CardHeader>
                <div className="p-3 rounded-lg bg-green-500 text-white w-fit mb-3">
                  <Award className="h-6 w-6" />
                </div>
                <CardTitle className="font-heading text-green-900 dark:text-green-100">Candidate Selection</CardTitle>
                <CardDescription className="text-green-700 dark:text-green-300">
                  Transparent internal primaries empower citizens to select party candidates, ending ticket-selling and dynasty politics
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
              { step: 2, icon: Award, title: "Assign", desc: "AI assigns to available official", color: "from-cyan-500 to-cyan-600" },
              { step: 3, icon: Bell, title: "Monitor", desc: "Receive real-time status updates", color: "from-sky-500 to-sky-600" },
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

      {/* Stats Section */}
      <section className="py-20 bg-slate-50 dark:bg-slate-900/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: FileText, val: '2.5M+', label: 'Applications Today' },
              { icon: CheckCircle, val: '98.7%', label: 'Auto-Approval Rate' },
              { icon: Star, val: '4.6/5', label: 'Average Rating' },
              { icon: Clock, val: '2.3 Days', label: 'Avg Processing Time' }
            ].map((stat, idx) => (
              <div key={idx} className="bg-white dark:bg-slate-800 p-8 rounded-2xl text-center hover:-translate-y-1 transition-transform shadow-sm hover:shadow-md border border-slate-100 dark:border-slate-700">
                <stat.icon size={40} className="text-blue-600 dark:text-blue-400 mb-4 mx-auto" />
                <h3 className="text-4xl font-bold text-slate-900 dark:text-white mb-2 leading-none">{stat.val}</h3>
                <p className="text-slate-500 dark:text-slate-400 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Services Section */}
      <section className="py-20 bg-white dark:bg-slate-950">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-heading bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
              Popular Services
            </h2>
            <Button variant="link" className="text-blue-600 dark:text-blue-400 font-semibold">
              View All Services
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "Aadhaar Services", desc: "UIDAI - Identity Management", icon: Shield, rating: 4.8 },
              { title: "Passport Services", desc: "Central Govt - Travel Documents", icon: FileText, rating: 4.5 },
              { title: "Birth Certificate", desc: "Municipal Corp - Vital Records", icon: FileText, rating: 4.7 },
              { title: "Digital Payment", desc: "NPCI - UPI & Tax Payments", icon: CheckCircle, rating: 4.9 },
              { title: "Driving License", desc: "Transport Dept - RTO Services", icon: FileText, rating: 4.3 },
              { title: "Property Reg.", desc: "Revenue Dept - Land Records", icon: FileText, rating: 4.2 },
              { title: "Power Supply", desc: "Electricity Board - Bill & Meter", icon: FileText, rating: 3.8 },
              { title: "Grievance", desc: "Public Redressal System", icon: Bell, rating: 4.1 },
            ].map((service, idx) => (
              <Card key={idx} className="border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 transition-all duration-300 group cursor-pointer hover:shadow-lg">
                <CardHeader>
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <service.icon size={24} />
                    </div>
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full text-xs font-bold">
                      <Star size={12} className="fill-yellow-400 text-yellow-400" />
                      {service.rating}
                    </div>
                  </div>
                  <CardTitle className="text-lg mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{service.title}</CardTitle>
                  <CardDescription>{service.desc}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>



      {/* Reforms Section */}
      <section className="py-20 bg-slate-50 dark:bg-slate-900/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <span className="inline-block px-4 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-bold uppercase tracking-wide mb-4">
              Institutional Framework
            </span>
            <h2 className="text-3xl md:text-4xl font-bold font-heading mb-4 text-slate-900 dark:text-white">Policy Reforms</h2>
            <p className="text-slate-600 dark:text-slate-400 text-lg">
              Foundational changes ensuring the entire governance structure aligns with accountability.
            </p>
          </div>

          <FundingTransparency />
          
          <div className="my-12">
            <PoliticianRatingSection />
          </div>

          <div className="grid md:grid-cols-2 gap-8">
             <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl flex flex-col md:flex-row gap-6 hover:shadow-xl transition-shadow border border-slate-100 dark:border-slate-700">
                <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                   <Shield size={28} />
                </div>
                <div>
                   <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Judicial Accountability</h3>
                   <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                     AI-driven blind case allocation and public performance metrics for judges to ensure unbiased and timely justice.
                   </p>
                </div>
             </div>
             <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl flex flex-col md:flex-row gap-6 hover:shadow-xl transition-shadow border border-slate-100 dark:border-slate-700">
                 <div className="w-14 h-14 bg-pink-100 dark:bg-pink-900/30 rounded-2xl flex items-center justify-center text-pink-600 dark:text-pink-400 shrink-0">
                   <Award size={28} />
                </div>
                <div>
                   <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Electoral Reforms</h3>
                   <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                     Amending laws to incorporate consequences from the rating system, barring underperforming politicians from contesting.
                   </p>
                </div>
             </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-br from-slate-100/50 to-slate-200/50 dark:from-slate-800/50 dark:to-slate-900/50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold font-heading text-center mb-12 bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
            Public Dashboard
          </h2>

          <div className="grid lg:grid-cols-12 gap-8 max-w-6xl mx-auto items-start">
            {/* Left Column: Overall Rating */}
            <div className="lg:col-span-4 space-y-6 sticky top-24">
              <Card className="glass-card border-0 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 hover:shadow-xl transition-all rounded-[32px] overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
                <CardHeader className="text-center py-8 px-6">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Star className="h-12 w-12 text-yellow-400 fill-yellow-400 drop-shadow-sm" />
                  </div>
                  <div className="mb-2">
                    <span className="font-heading text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                      {ratingsData ? `${ratingsData.websiteRating.toFixed(1)}` : "0.0"}
                    </span>
                    <span className="text-2xl text-slate-400 font-medium">/5.0</span>
                  </div>
                  <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">
                    Overall Performance
                  </CardTitle>
                  <CardDescription className="text-sm text-slate-500 dark:text-slate-400">
                    Based on {ratingsData?.totalRatings || 0} verified citizen ratings
                  </CardDescription>
                </CardHeader>
              </Card>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-3xl border border-blue-100 dark:border-blue-800/50">
                <h4 className="font-bold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                  <Shield size={18} /> Why Ratings Matter?
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                  Department ratings directly impact funding allocation and official performance reviews. Your feedback drives real change.
                </p>
              </div>
            </div>

            {/* Right Column: Department List */}
            <div className="lg:col-span-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold font-heading text-slate-900 dark:text-white">
                  Department Ratings
                </h3>
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  {displayDepartments.length} Departments Listed
                </div>
              </div>

              {ratingsLoading ? (
                <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/50 rounded-3xl">
                  <p className="text-muted-foreground animate-pulse">Loading ratings data...</p>
                </div>
              ) : (
                <div className="space-y-3 h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {displayDepartments.map((dept, index) => (
                    <div
                      key={dept.department_id}
                      className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 bg-white dark:bg-slate-800 group cursor-pointer"
                    >
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-base shrink-0 ${
                        dept.averageRating > 0 
                          ? "bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900 dark:to-blue-800 text-blue-600 dark:text-blue-400"
                          : "bg-slate-100 dark:bg-slate-700 text-slate-400"
                      }`}>
                        {dept.department_name.charAt(0)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate pr-4">
                            {dept.department_name}
                          </h4>
                          <div className={`flex items-center gap-1 px-2 py-1 rounded-lg font-bold text-xs shrink-0 ${
                            dept.averageRating > 0
                              ? "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                          }`}>
                            {dept.averageRating.toFixed(1)} <Star size={10} fill="currentColor" />
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <CheckCircle2 size={12} className={dept.totalRatings > 0 ? "text-green-600 dark:text-green-400" : "text-slate-400"} /> 
                            {dept.totalRatings} Ratings
                          </span>
                          <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                          <span>{dept.officialCount} Officials</span>
                        </div>
                      </div>
                      
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <ChevronRight size={18} className="text-slate-300 dark:text-slate-600" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
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
