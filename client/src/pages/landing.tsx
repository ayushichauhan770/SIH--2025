import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Shield, Bell, Award, Clock, CheckCircle, Star, Phone, Mail, CheckCircle2, ChevronRight, ArrowRight, Activity, Users, Building2, Search, Menu } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/contexts/auth-context";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import FundingTransparency from "@/components/FundingTransparency";
import PoliticianRatingSection from "@/components/PoliticianRatingSection";
import { getAllDepartmentNames } from "@shared/sub-departments";
import { AccountabilityChat } from "@/components/AccountabilityChat";

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
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
    staleTime: 5000,
  });

  const allDepartmentNames = getAllDepartmentNames();
  const displayDepartments = (ratingsData?.departments || allDepartmentNames.map((name, index) => ({
    department_id: `dept-${index}`,
    department_name: name,
    averageRating: 0,
    totalRatings: 0,
    officialCount: 0,
  }))).sort((a, b) => {
    if (a.averageRating !== b.averageRating) {
      return b.averageRating - a.averageRating;
    }
    return a.department_name.localeCompare(b.department_name);
  });

  const handleSubmitApplication = () => {
    setLocation("/login?role=citizen");
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-slate-950 font-['Outfit',sans-serif] selection:bg-blue-500/30">
      {/* Fixed Navbar with Mega Menu */}
      <nav className="fixed top-6 left-0 right-0 z-50 flex justify-center px-6 pointer-events-none">
        <div className="w-full max-w-7xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm rounded-full px-6 py-3 pointer-events-auto flex justify-between items-center relative transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-full bg-[#0071e3] shadow-lg shadow-blue-500/20">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <a href="/" className="text-xl font-bold tracking-tight text-[#1d1d1f] dark:text-white">Accountability</a>
          </div>
          
          <div className="hidden md:flex gap-8 h-full items-center">
            <a href="#" className="text-[#1d1d1f] dark:text-white text-sm font-medium hover:text-[#0071e3] transition-colors">Home</a>
            
            {/* Mega Menu Trigger */}
            <div className="relative group h-full flex items-center">
              <button className="text-[#86868b] text-sm font-medium hover:text-[#0071e3] transition-colors py-2 flex items-center gap-1">
                Services <ChevronRight className="h-3 w-3 rotate-90 transition-transform group-hover:-rotate-90" />
              </button>
              
              {/* Mega Dropdown */}
              <div className="fixed top-[50px] left-0 right-0 z-40 flex justify-center px-6 transition-all duration-300 delay-300 group-hover:delay-0 opacity-0 invisible group-hover:opacity-100 group-hover:visible pointer-events-none group-hover:pointer-events-auto">
                <div className="w-full max-w-7xl pt-10">
                  <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-100 dark:border-slate-800 shadow-xl rounded-[32px] overflow-hidden">
                    <div className="py-12 px-12 grid grid-cols-3 gap-16">
                      <div>
                        <h3 className="text-xs font-bold text-[#86868b] uppercase tracking-wider mb-6">Browse Services</h3>
                        <div className="space-y-4">
                          {['Birth/Death Certificates', 'Complain & Feedback', 'Electricity and Power', 'Land & Property Records', 'Licenses & Permits'].map(item => (
                            <a key={item} href="#" className="block text-[15px] text-[#1d1d1f] dark:text-white hover:text-[#0071e3] transition-colors font-medium">
                              {item}
                            </a>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-[#86868b] uppercase tracking-wider mb-6">Quick Access</h3>
                        <div className="space-y-4">
                          {[
                            { name: 'Track Application', href: '/track' },
                            { name: 'Application Status', href: '/track' },
                            { name: 'Judiciary Dashboard', href: '/judiciary' },
                            { name: 'Litigant Portal', href: '/judiciary/portal' },
                            { name: 'Payment History', href: '#' }
                          ].map(item => (
                            <a key={item.name} href={item.href} className="block text-[15px] text-[#1d1d1f] dark:text-white hover:text-[#0071e3] transition-colors font-medium">
                              {item.name}
                            </a>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-[#86868b] uppercase tracking-wider mb-6">Special Services</h3>
                        <div className="space-y-4">
                          {['Senior Citizens', 'Women & Child', 'Rural Services', 'Student Schemes'].map(item => (
                            <a key={item} href="#" className="block text-[15px] text-[#1d1d1f] dark:text-white hover:text-[#0071e3] transition-colors font-medium">
                              {item}
                            </a>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <a href="#dashboard" className="text-[#86868b] text-sm font-medium hover:text-[#0071e3] transition-colors">Dashboard</a>
            <a href="#reforms" className="text-[#86868b] text-sm font-medium hover:text-[#0071e3] transition-colors">Reforms</a>
            <Link href="/judiciary">
              <a className="text-[#86868b] text-sm font-medium hover:text-[#0071e3] transition-colors">Judiciary</a>
            </Link>
          </div>

          <div className="hidden md:flex gap-4 items-center">
            <Button variant="ghost" size="icon" className="rounded-full text-[#1d1d1f] dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-[#0071e3]">
              <Search className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full text-[#1d1d1f] dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-[#0071e3]">
              <Bell className="h-5 w-5" />
            </Button>
            <ThemeToggle />
            <Link href="/login">
              <Button className="rounded-full bg-[#0071e3] hover:bg-[#0077ED] text-white shadow-lg shadow-blue-500/20 px-6 ml-2">
                Login
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-4">
            <ThemeToggle />
            <button 
              className="text-[#1d1d1f] dark:text-white p-2"
              onClick={() => document.getElementById('mobile-menu')?.classList.toggle('hidden')}
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        <div id="mobile-menu" className="hidden absolute top-[70px] left-6 right-6 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-[32px] shadow-2xl border border-slate-200 dark:border-slate-800 p-6 pointer-events-auto animate-in slide-in-from-top-4 duration-300">
          <div className="flex flex-col gap-6">
            <a href="#" className="text-lg font-medium text-[#1d1d1f] dark:text-white">Home</a>
            <div className="space-y-4">
              <div className="text-sm font-bold text-[#86868b] uppercase tracking-wider">Services</div>
              <div className="grid grid-cols-1 gap-3 pl-4">
                <a href="/track" className="text-[#1d1d1f] dark:text-white">Track Application</a>
                <a href="#" className="text-[#1d1d1f] dark:text-white">Birth/Death Certificates</a>
                <a href="#" className="text-[#1d1d1f] dark:text-white">Licenses & Permits</a>
              </div>
            </div>
            {/* <a href="#dashboard" className="text-lg font-medium text-[#1d1d1f] dark:text-white">Dashboard</a>
            <a href="#reforms" className="text-lg font-medium text-[#1d1d1f] dark:text-white">Reforms</a> */}
            <div className="h-px bg-slate-200 dark:bg-slate-800 my-2"></div>
            <div className="flex flex-col gap-4">
              <Link href="/login">
                <Button className="w-full rounded-full bg-[#0071e3] hover:bg-[#0077ED] text-white h-12 text-lg">
                  Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-sm font-medium text-[#1d1d1f] dark:text-white">Live Governance System</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl lg:text-[64px] font-bold text-[#1d1d1f] dark:text-white tracking-tight mb-6 leading-[1.1] animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
            Transparent Digital<br />
            <span className="text-[#0071e3]">Governance</span>
          </h1>
          
          <p className="text-xl text-[#86868b] max-w-2xl mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
            Submit, track, and manage government applications with AI-powered monitoring, blockchain verification, and guaranteed 30-day processing.
          </p>

          <div className="flex flex-wrap items-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
            <Button 
              size="lg" 
              className="h-14 px-8 rounded-full bg-[#0071e3] hover:bg-[#0077ED] text-white text-lg font-medium shadow-xl shadow-blue-500/20 transition-all hover:scale-105"
              onClick={handleSubmitApplication}
            >
              Submit Application
            </Button>
            <Link href="/track">
              <Button size="lg" variant="outline" className="h-14 px-8 rounded-full border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[#1d1d1f] dark:text-white text-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-all hover:scale-105">
                Track Status
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Bento Grid Features */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <Card className="md:col-span-2 border-0 shadow-sm bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden group hover:shadow-md transition-all duration-500">
              <CardContent className="p-8 md:p-12 flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1 space-y-4">
                  <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-[#0071e3] w-fit">
                    <Activity className="h-8 w-8" />
                  </div>
                  <h3 className="text-3xl font-bold text-[#1d1d1f] dark:text-white">Real-time Tracking</h3>
                  <p className="text-[#86868b] text-lg leading-relaxed">
                    Monitor your application's progress at every step. Get instant notifications and detailed timeline updates.
                  </p>
                </div>
                <div className="flex-1 w-full relative">
                  <div className="absolute inset-0 bg-gradient-to-tr from-blue-50 to-transparent dark:from-blue-900/10 rounded-3xl transform rotate-3 scale-95 opacity-50"></div>
                  <div className="bg-[#F5F5F7] dark:bg-slate-800 rounded-3xl p-6 transform transition-transform group-hover:-translate-y-2 duration-500">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600">
                        <CheckCircle className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="h-2 w-24 bg-slate-200 dark:bg-slate-700 rounded-full mb-2"></div>
                        <div className="h-2 w-16 bg-slate-100 dark:bg-slate-700 rounded-full"></div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                      <div className="h-2 w-3/4 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="border-0 shadow-sm bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden group hover:shadow-md transition-all duration-500">
              <CardContent className="p-8 flex flex-col h-full justify-between">
                <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 w-fit mb-6">
                  <Shield className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-[#1d1d1f] dark:text-white mb-3">Blockchain Verified</h3>
                  <p className="text-[#86868b]">
                    Every approval is secured on the blockchain, ensuring tamper-proof records and absolute transparency.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="border-0 shadow-sm bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden group hover:shadow-md transition-all duration-500">
              <CardContent className="p-8 flex flex-col h-full justify-between">
                <div className="p-3 rounded-2xl bg-orange-50 dark:bg-orange-900/20 text-orange-600 w-fit mb-6">
                  <Bell className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-[#1d1d1f] dark:text-white mb-3">AI Monitoring</h3>
                  <p className="text-[#86868b]">
                    Smart algorithms detect delays and automatically escalate issues to higher authorities.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Feature 4 */}
            <Card className="md:col-span-2 border-0 shadow-sm bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden group hover:shadow-md transition-all duration-500">
              <CardContent className="p-8 md:p-12 flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1 w-full relative order-2 md:order-1">
                   <div className="grid grid-cols-2 gap-4">
                      <div className="bg-[#F5F5F7] dark:bg-slate-800 p-4 rounded-2xl">
                        <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-3"></div>
                        <div className="h-2 w-16 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                      </div>
                      <div className="bg-[#F5F5F7] dark:bg-slate-800 p-4 rounded-2xl mt-8">
                        <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 mb-3"></div>
                        <div className="h-2 w-16 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                      </div>
                   </div>
                </div>
                <div className="flex-1 space-y-4 order-1 md:order-2">
                  <div className="p-3 rounded-2xl bg-green-50 dark:bg-green-900/20 text-green-600 w-fit">
                    <Award className="h-8 w-8" />
                  </div>
                  <h3 className="text-3xl font-bold text-[#1d1d1f] dark:text-white">Candidate Selection</h3>
                  <p className="text-[#86868b] text-lg leading-relaxed">
                    Participate in transparent internal primaries. Empower citizens to select party candidates and end dynasty politics.
                  </p>
                  <Link href="/election/candidates">
                    <Button variant="link" className="p-0 h-auto text-[#0071e3] font-semibold hover:no-underline group-hover:translate-x-1 transition-transform">
                      Explore Candidates <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-6 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: FileText, val: '2.5M+', label: 'Applications' },
              { icon: CheckCircle, val: '98.7%', label: 'Success Rate' },
              { icon: Star, val: '4.6/5', label: 'User Rating' },
              { icon: Clock, val: '2.3 Days', label: 'Avg Time' }
            ].map((stat, idx) => (
              <div key={idx} className="text-center group">
                <div className="mb-4 inline-flex p-4 rounded-full bg-[#F5F5F7] dark:bg-slate-800 group-hover:scale-110 transition-transform duration-300">
                  <stat.icon className="h-8 w-8 text-[#0071e3]" />
                </div>
                <h3 className="text-4xl font-bold text-[#1d1d1f] dark:text-white mb-2">{stat.val}</h3>
                <p className="text-[#86868b] font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Services */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-bold text-[#1d1d1f] dark:text-white mb-2">Popular Services</h2>
              <p className="text-[#86868b]">Most accessed government services this month</p>
            </div>
            <Button variant="outline" className="rounded-full border-slate-200 dark:border-slate-700">
              View All
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "Aadhaar Services", desc: "Identity Management", icon: Shield, rating: 4.8 },
              { title: "Passport Services", desc: "Travel Documents", icon: FileText, rating: 4.5 },
              { title: "Birth Certificate", desc: "Vital Records", icon: FileText, rating: 4.7 },
              { title: "Digital Payment", desc: "UPI & Tax Payments", icon: CheckCircle, rating: 4.9 },
              { title: "Driving License", desc: "RTO Services", icon: FileText, rating: 4.3 },
              { title: "Property Reg.", desc: "Land Records", icon: FileText, rating: 4.2 },
              { title: "Power Supply", desc: "Bill & Meter", icon: FileText, rating: 3.8 },
              { title: "Grievance", desc: "Redressal System", icon: Bell, rating: 4.1 },
            ].map((service, idx) => (
              <Card key={idx} className="border-0 shadow-sm bg-white dark:bg-slate-900 rounded-[24px] hover:shadow-md transition-all duration-300 cursor-pointer group">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 rounded-2xl bg-[#F5F5F7] dark:bg-slate-800 text-[#0071e3] group-hover:bg-[#0071e3] group-hover:text-white transition-colors">
                      <service.icon size={24} />
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#F5F5F7] dark:bg-slate-800 text-xs font-bold text-[#1d1d1f] dark:text-white">
                      <Star size={12} className="fill-yellow-400 text-yellow-400" />
                      {service.rating}
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-[#1d1d1f] dark:text-white mb-1">{service.title}</h3>
                  <p className="text-sm text-[#86868b]">{service.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Reforms & Dashboard Section */}
      <section className="py-20 px-6 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto space-y-20">
          
          {/* Reforms */}
          <div>
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="inline-block px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-[#0071e3] text-sm font-semibold mb-4">
                Institutional Framework
              </span>
              <h2 className="text-4xl font-bold text-[#1d1d1f] dark:text-white mb-4">Policy Reforms</h2>
              <p className="text-[#86868b] text-lg">
                Foundational changes ensuring the entire governance structure aligns with accountability.
              </p>
            </div>

            <FundingTransparency />
            
            <div className="my-12">
              <PoliticianRatingSection />
            </div>

            <div className="grid md:grid-cols-2 gap-8">
               <Card className="border-0 shadow-sm bg-[#F5F5F7] dark:bg-slate-800 rounded-[32px] overflow-hidden">
                  <CardContent className="p-8 flex items-start gap-6">
                    <div className="p-4 rounded-2xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 shrink-0">
                       <Shield size={28} />
                    </div>
                    <div>
                       <h3 className="text-xl font-bold text-[#1d1d1f] dark:text-white mb-2">Judicial Accountability</h3>
                       <p className="text-[#86868b] leading-relaxed">
                         AI-driven blind case allocation and public performance metrics for judges to ensure unbiased and timely justice.
                       </p>
                    </div>
                  </CardContent>
               </Card>
               <Card className="border-0 shadow-sm bg-[#F5F5F7] dark:bg-slate-800 rounded-[32px] overflow-hidden">
                  <CardContent className="p-8 flex items-start gap-6">
                    <div className="p-4 rounded-2xl bg-pink-100 dark:bg-pink-900/30 text-pink-600 shrink-0">
                       <Award size={28} />
                    </div>
                    <div>
                       <h3 className="text-xl font-bold text-[#1d1d1f] dark:text-white mb-2">Electoral Reforms</h3>
                       <p className="text-[#86868b] leading-relaxed">
                         Amending laws to incorporate consequences from the rating system, barring underperforming politicians from contesting.
                       </p>
                    </div>
                  </CardContent>
               </Card>
            </div>
          </div>

          {/* Public Dashboard */}
          <div>
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-[#1d1d1f] dark:text-white">Public Dashboard</h2>
            </div>

            <div className="grid lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Overall Rating */}
              <div className="lg:col-span-4 space-y-6 sticky top-24">
                <Card className="border-0 shadow-lg bg-gradient-to-br from-[#0071e3] to-blue-600 text-white rounded-[32px] overflow-hidden relative">
                  <CardContent className="p-8 text-center">
                    <div className="flex justify-center mb-6">
                      <Star className="h-16 w-16 fill-yellow-400 text-yellow-400 drop-shadow-md" />
                    </div>
                    <div className="mb-2">
                      <span className="text-6xl font-extrabold tracking-tight">
                        {ratingsData ? `${ratingsData.websiteRating.toFixed(1)}` : "0.0"}
                      </span>
                      <span className="text-2xl opacity-80 font-medium">/5.0</span>
                    </div>
                    <h3 className="text-xl font-bold mb-2">Overall Performance</h3>
                    <p className="text-sm opacity-80">
                      Based on {ratingsData?.totalRatings || 0} verified citizen ratings
                    </p>
                  </CardContent>
                </Card>

                <div className="bg-[#F5F5F7] dark:bg-slate-800 p-6 rounded-[24px]">
                  <h4 className="font-bold text-[#1d1d1f] dark:text-white mb-2 flex items-center gap-2">
                    <Shield size={18} className="text-[#0071e3]" /> Why Ratings Matter?
                  </h4>
                  <p className="text-sm text-[#86868b] leading-relaxed">
                    Department ratings directly impact funding allocation and official performance reviews. Your feedback drives real change.
                  </p>
                </div>
              </div>

              {/* Right Column: Department List */}
              <div className="lg:col-span-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-[#1d1d1f] dark:text-white">
                    Department Ratings
                  </h3>
                  <div className="text-sm text-[#86868b]">
                    {displayDepartments.length} Departments Listed
                  </div>
                </div>

                {ratingsLoading ? (
                  <div className="text-center py-12 bg-[#F5F5F7] dark:bg-slate-800 rounded-[32px]">
                    <p className="text-[#86868b] animate-pulse">Loading ratings data...</p>
                  </div>
                ) : (
                  <div className="space-y-4 h-[400px] md:h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                    {displayDepartments.map((dept, index) => (
                      <div
                        key={dept.department_id}
                        className="flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-[20px] md:rounded-[24px] bg-[#F5F5F7] dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 hover:shadow-md transition-all duration-300 cursor-pointer group"
                      >
                        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-bold text-sm md:text-base shrink-0 ${
                          dept.averageRating > 0 
                            ? "bg-blue-100 dark:bg-blue-900/30 text-[#0071e3]"
                            : "bg-slate-200 dark:bg-slate-700 text-slate-400"
                        }`}>
                          {dept.department_name.charAt(0)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-1">
                            <h4 className="font-bold text-[#1d1d1f] dark:text-white truncate pr-4">
                              {dept.department_name}
                            </h4>
                            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg font-bold text-xs shrink-0 ${
                              dept.averageRating > 0
                                ? "bg-green-100 dark:bg-green-900/30 text-green-600"
                                : "bg-slate-200 dark:bg-slate-700 text-slate-500"
                            }`}>
                              {dept.averageRating.toFixed(1)} <Star size={10} fill="currentColor" />
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 text-xs text-[#86868b]">
                            <span className="flex items-center gap-1">
                              <CheckCircle2 size={12} className={dept.totalRatings > 0 ? "text-green-600" : "text-slate-400"} /> 
                              {dept.totalRatings} Ratings
                            </span>
                            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                            <span>{dept.officialCount} Officials</span>
                          </div>
                        </div>
                        
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <ChevronRight size={18} className="text-[#86868b]" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
            {/* Column 1: Category */}
            <div>
              <h3 className="font-bold text-[#1d1d1f] dark:text-white mb-4">Category</h3>
              <ul className="space-y-3 text-sm text-[#86868b]">
                <li><a href="#" className="hover:text-[#0071e3] transition-colors">Individuals</a></li>
                <li><a href="#" className="hover:text-[#0071e3] transition-colors">Business</a></li>
                <li><a href="#" className="hover:text-[#0071e3] transition-colors">Foreign Nationals</a></li>
                <li><a href="#" className="hover:text-[#0071e3] transition-colors">Government Employees</a></li>
                <li><a href="#" className="hover:text-[#0071e3] transition-colors">Overseas Indians</a></li>
              </ul>
            </div>

            {/* Column 2: My Government */}
            <div>
              <h3 className="font-bold text-[#1d1d1f] dark:text-white mb-4">My Government</h3>
              <ul className="space-y-3 text-sm text-[#86868b]">
                <li><a href="#" className="hover:text-[#0071e3] transition-colors">Constitution of India</a></li>
                <li><a href="#" className="hover:text-[#0071e3] transition-colors">Government Directory</a></li>
                <li><a href="#" className="hover:text-[#0071e3] transition-colors">Indian Parliament</a></li>
                <li><a href="#" className="hover:text-[#0071e3] transition-colors">Judiciary</a></li>
                <li><a href="#" className="hover:text-[#0071e3] transition-colors">Ministries</a></li>
                <li><a href="#" className="hover:text-[#0071e3] transition-colors">State Governments</a></li>
              </ul>
            </div>

            {/* Column 3: Explore India + News Hub */}
            <div>
              <h3 className="font-bold text-[#1d1d1f] dark:text-white mb-4">Explore India</h3>
              <ul className="space-y-3 text-sm text-[#86868b]">
                <li><a href="#" className="hover:text-[#0071e3] transition-colors">About India</a></li>
                <li><a href="#" className="hover:text-[#0071e3] transition-colors">India at a Glance</a></li>
                <li><a href="#" className="hover:text-[#0071e3] transition-colors">National Symbols</a></li>
                <li><a href="#" className="hover:text-[#0071e3] transition-colors">States & UTs</a></li>
              </ul>
              <h3 className="font-bold text-[#1d1d1f] dark:text-white mb-4 mt-8">News Hub</h3>
              <ul className="space-y-3 text-sm text-[#86868b]">
                <li><a href="#" className="hover:text-[#0071e3] transition-colors">Press Releases</a></li>
                <li><a href="#" className="hover:text-[#0071e3] transition-colors">News Updates</a></li>
              </ul>
            </div>

            {/* Column 4: About Us */}
            <div>
              <h3 className="font-bold text-[#1d1d1f] dark:text-white mb-4">About Us</h3>
              <ul className="space-y-3 text-sm text-[#86868b]">
                <li><a href="#" className="hover:text-[#0071e3] transition-colors">About Portal</a></li>
                <li><a href="#" className="hover:text-[#0071e3] transition-colors">Help</a></li>
                <li><a href="#" className="hover:text-[#0071e3] transition-colors">FAQs</a></li>
                <li><a href="#" className="hover:text-[#0071e3] transition-colors">Feedback</a></li>
                <li><a href="#" className="hover:text-[#0071e3] transition-colors">Terms & Conditions</a></li>
                <li><a href="#" className="hover:text-[#0071e3] transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-[#0071e3] transition-colors">Accessibility</a></li>
                <li><a href="#" className="hover:text-[#0071e3] transition-colors">Sitemap</a></li>
              </ul>
            </div>

            {/* Column 5: Calendar */}
            <div>
              <h3 className="font-bold text-[#1d1d1f] dark:text-white mb-4">Calendar</h3>
              <ul className="space-y-3 text-sm text-[#86868b]">
                <li><a href="#" className="hover:text-[#0071e3] transition-colors">National Holidays</a></li>
                <li><a href="#" className="hover:text-[#0071e3] transition-colors">Government Events</a></li>
                <li><a href="#" className="hover:text-[#0071e3] transition-colors">Important Dates</a></li>
                <li><a href="#" className="hover:text-[#0071e3] transition-colors">Public Holidays</a></li>
              </ul>
            </div>
          </div>

          {/* Contact Information */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-8 mt-8">
            <div className="text-center mb-6">
              <h4 className="font-bold text-[#1d1d1f] dark:text-white mb-4">Contact Us</h4>
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-[#0071e3]" />
                  <span className="text-sm text-[#86868b]">+91 1800-123-4567</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-[#0071e3]" />
                  <a href="mailto:support@digitalgovernance.gov.in" className="text-sm text-[#86868b] hover:text-[#0071e3] transition-colors">
                    support@digitalgovernance.gov.in
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Copyright */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-6 text-center">
            <p className="text-sm text-[#86868b]">© 2025 Digital Governance Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>

      
      {/* AI Help Desk */}
      <AccountabilityChat defaultOpen={false} className="shadow-2xl" />
    </div>
  );
}
