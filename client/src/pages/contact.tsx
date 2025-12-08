import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, ArrowLeft, Phone, Mail, MessageCircle, Clock, MapPin, Globe } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/contexts/auth-context";

export default function Contact() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const contactInfo = {
    phone: {
      primary: "+91 1800-123-4567",
      secondary: "+91 1800-987-6543",
      hours: "24/7 Available",
    },
    email: {
      support: "support@digitalgovernance.gov.in",
      technical: "technical@digitalgovernance.gov.in",
      general: "info@digitalgovernance.gov.in",
    },
    address: {
      line1: "Digital Governance Platform",
      line2: "Government of India",
      line3: "New Delhi - 110001",
      country: "India",
    },
    hours: {
      weekdays: "Monday - Friday: 9:00 AM - 6:00 PM",
      weekends: "Saturday - Sunday: 10:00 AM - 4:00 PM",
      emergency: "24/7 Emergency Support Available",
    },
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-slate-950 font-['Outfit',sans-serif] selection:bg-blue-500/30">
      {/* Floating Header */}
      <header className="fixed top-6 left-0 right-0 z-50 flex justify-center pointer-events-none px-6">
        <div className="w-full max-w-7xl bg-gradient-to-r from-white/90 via-blue-50/50 to-indigo-50/50 dark:from-slate-900/90 dark:via-blue-950/50 dark:to-indigo-950/50 backdrop-blur-xl border border-blue-200/30 dark:border-blue-900/30 shadow-lg shadow-blue-500/10 rounded-full px-6 py-3 pointer-events-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={user ? "/citizen/dashboard" : "/"}>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-gradient-to-br hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/50 dark:hover:to-indigo-900/50 -ml-2 transition-all duration-300">
                <ArrowLeft className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </Button>
            </Link>
            <div className="h-4 w-px bg-gradient-to-b from-blue-200 to-indigo-200 dark:from-blue-800 dark:to-indigo-800" />
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-full bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 shadow-lg shadow-blue-500/30">
                <Shield className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold text-sm tracking-tight bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                Contact Information
              </span>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-6 pt-32 pb-12 max-w-5xl">
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Header Section */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
              Get In Touch
            </h1>
            <p className="text-lg text-[#86868b] dark:text-slate-400 font-medium max-w-2xl mx-auto">
              We're here to help! Contact us through any of the channels below for support, inquiries, or assistance.
            </p>
          </div>

          {/* Contact Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Phone Support */}
            <Card className="group relative border-0 overflow-hidden bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 dark:from-blue-950/40 dark:via-cyan-950/30 dark:to-teal-950/40 shadow-sm hover:shadow-xl transition-all duration-300 rounded-[32px]">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-cyan-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
              <CardHeader className="relative z-10 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500 text-white shadow-lg shadow-blue-500/30">
                    <Phone className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl font-bold text-[#1d1d1f] dark:text-white">Phone Support</CardTitle>
                </div>
                <CardDescription className="text-[#86868b] dark:text-slate-400">
                  Call us anytime for immediate assistance
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10 p-6 pt-0 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <a href="tel:+9118001234567" className="text-lg font-bold text-[#1d1d1f] dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      {contactInfo.phone.primary}
                    </a>
                  </div>
                  <div className="flex items-center gap-3 ml-8">
                    <Phone className="h-4 w-4 text-blue-500/70 dark:text-blue-400/70" />
                    <a href="tel:+9118009876543" className="text-sm text-[#86868b] dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      {contactInfo.phone.secondary}
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                  <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-[#1d1d1f] dark:text-white">{contactInfo.phone.hours}</span>
                </div>
              </CardContent>
            </Card>

            {/* Email Support */}
            <Card className="group relative border-0 overflow-hidden bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 dark:from-purple-950/40 dark:via-pink-950/30 dark:to-rose-950/40 shadow-sm hover:shadow-xl transition-all duration-300 rounded-[32px]">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-400/10 to-pink-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-400/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
              <CardHeader className="relative z-10 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 text-white shadow-lg shadow-purple-500/30">
                    <Mail className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl font-bold text-[#1d1d1f] dark:text-white">Email Support</CardTitle>
                </div>
                <CardDescription className="text-[#86868b] dark:text-slate-400">
                  Send us an email and we'll respond within 24 hours
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10 p-6 pt-0 space-y-3">
                <div className="space-y-2">
                  <a href={`mailto:${contactInfo.email.support}`} className="flex items-center gap-3 p-3 rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-slate-800 transition-colors group/email">
                    <Mail className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    <div>
                      <p className="text-xs font-medium text-[#86868b] dark:text-slate-400">General Support</p>
                      <p className="text-sm font-bold text-[#1d1d1f] dark:text-white group-hover/email:text-purple-600 dark:group-hover/email:text-purple-400 transition-colors">
                        {contactInfo.email.support}
                      </p>
                    </div>
                  </a>
                  <a href={`mailto:${contactInfo.email.technical}`} className="flex items-center gap-3 p-3 rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-slate-800 transition-colors group/email">
                    <Mail className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    <div>
                      <p className="text-xs font-medium text-[#86868b] dark:text-slate-400">Technical Issues</p>
                      <p className="text-sm font-bold text-[#1d1d1f] dark:text-white group-hover/email:text-purple-600 dark:group-hover/email:text-purple-400 transition-colors">
                        {contactInfo.email.technical}
                      </p>
                    </div>
                  </a>
                  <a href={`mailto:${contactInfo.email.general}`} className="flex items-center gap-3 p-3 rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-slate-800 transition-colors group/email">
                    <Mail className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    <div>
                      <p className="text-xs font-medium text-[#86868b] dark:text-slate-400">General Inquiries</p>
                      <p className="text-sm font-bold text-[#1d1d1f] dark:text-white group-hover/email:text-purple-600 dark:group-hover/email:text-purple-400 transition-colors">
                        {contactInfo.email.general}
                      </p>
                    </div>
                  </a>
                </div>
              </CardContent>
            </Card>

            {/* Live Chat */}
            <Card className="group relative border-0 overflow-hidden bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-950/40 dark:via-emerald-950/30 dark:to-teal-950/40 shadow-sm hover:shadow-xl transition-all duration-300 rounded-[32px]">
              <div className="absolute inset-0 bg-gradient-to-br from-green-400/10 to-emerald-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-400/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
              <CardHeader className="relative z-10 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 text-white shadow-lg shadow-green-500/30">
                    <MessageCircle className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl font-bold text-[#1d1d1f] dark:text-white">Live Chat</CardTitle>
                </div>
                <CardDescription className="text-[#86868b] dark:text-slate-400">
                  Chat with our AI assistant for instant help
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10 p-6 pt-0">
                <Button
                  onClick={() => {
                    // Scroll to top and trigger chatbot
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    // The chatbot widget should be visible at top-right
                  }}
                  className="w-full h-12 rounded-full bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 hover:from-green-700 hover:via-emerald-700 hover:to-teal-700 text-white font-medium shadow-lg shadow-green-500/30 transition-all duration-300"
                >
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Open Chatbot
                </Button>
                <p className="text-xs text-center text-[#86868b] dark:text-slate-400 mt-3">
                  Available 24/7 • Click the 💬 icon in the top-right corner
                </p>
              </CardContent>
            </Card>

            {/* Office Address */}
            <Card className="group relative border-0 overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-yellow-950/40 shadow-sm hover:shadow-xl transition-all duration-300 rounded-[32px]">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-400/10 to-orange-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
              <CardHeader className="relative z-10 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 via-orange-500 to-yellow-500 text-white shadow-lg shadow-amber-500/30">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl font-bold text-[#1d1d1f] dark:text-white">Office Address</CardTitle>
                </div>
                <CardDescription className="text-[#86868b] dark:text-slate-400">
                  Visit us at our headquarters
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10 p-6 pt-0 space-y-3">
                <div className="space-y-2">
                  <p className="text-sm font-bold text-[#1d1d1f] dark:text-white">{contactInfo.address.line1}</p>
                  <p className="text-sm text-[#86868b] dark:text-slate-400">{contactInfo.address.line2}</p>
                  <p className="text-sm text-[#86868b] dark:text-slate-400">{contactInfo.address.line3}</p>
                  <p className="text-sm text-[#86868b] dark:text-slate-400">{contactInfo.address.country}</p>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm mt-4">
                  <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <div className="text-xs">
                    <p className="font-medium text-[#1d1d1f] dark:text-white">{contactInfo.hours.weekdays}</p>
                    <p className="text-[#86868b] dark:text-slate-400">{contactInfo.hours.weekends}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Information */}
          <Card className="border-0 overflow-hidden bg-gradient-to-br from-indigo-50 via-violet-50 to-purple-50 dark:from-indigo-950/40 dark:via-violet-950/30 dark:to-purple-950/40 shadow-sm rounded-[32px]">
            <CardHeader className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30">
                  <Globe className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg font-bold text-[#1d1d1f] dark:text-white">Additional Information</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                  <h4 className="font-bold text-sm text-[#1d1d1f] dark:text-white mb-2">Response Time</h4>
                  <p className="text-xs text-[#86868b] dark:text-slate-400">
                    We aim to respond to all inquiries within 24 hours. For urgent matters, please call our phone support line.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                  <h4 className="font-bold text-sm text-[#1d1d1f] dark:text-white mb-2">What to Include</h4>
                  <p className="text-xs text-[#86868b] dark:text-slate-400">
                    When contacting support, please include your username, issue description, and any relevant screenshots.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Back Button */}
          <div className="flex justify-center">
            <Button
              onClick={() => setLocation(user ? "/citizen/dashboard" : "/")}
              variant="outline"
              className="rounded-full border-2 border-blue-300 dark:border-blue-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 text-blue-700 dark:text-blue-300 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/50 dark:hover:to-indigo-900/50 px-8 transition-all duration-300"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to {user ? "Dashboard" : "Home"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

