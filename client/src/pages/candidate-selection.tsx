import React, { useState } from 'react';
import { Candidate } from '@/../../shared/schema';
import { Vote, Shield, UserCheck, BarChart3, AlertCircle, ChevronRight, Search, Bell, Menu, CheckCircle2, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link } from "wouter";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

// Expanded mock candidate data with multiple parties
const candidatesMock: Candidate[] = [
  // Progressive Party
  {
    id: 'pp1',
    name: 'Arjun Mehta',
    party: 'Progressive Party',
    age: 45,
    education: 'M.Sc Economics',
    background: 'Former Civil Servant, focused on rural development.',
    criminalRecords: 0,
    netWorth: '₹2.5 Cr',
    votes: 0,
    manifestoSummary: 'Digital literacy for all, 100% road connectivity.'
  },
  {
    id: 'pp2',
    name: 'Suresh Reddy',
    party: 'Progressive Party',
    age: 52,
    education: '10th Pass',
    background: 'Real Estate Developer, strong local influence.',
    criminalRecords: 3,
    netWorth: '₹150 Cr',
    votes: 0,
    manifestoSummary: 'New shopping malls, tax breaks for businesses.'
  },
  {
    id: 'pp3',
    name: 'Dr. Priya Desai',
    party: 'Progressive Party',
    age: 38,
    education: 'PhD Public Health',
    background: 'Social Worker, Doctor running free clinics.',
    criminalRecords: 0,
    netWorth: '₹80 Lakh',
    votes: 0,
    manifestoSummary: 'Healthcare reform, sanitation for every home.'
  },
  {
    id: 'pp4',
    name: 'Vijay Kumar',
    party: 'Progressive Party',
    age: 49,
    education: 'B.Com',
    background: 'Contractor, Party loyalist for 20 years.',
    criminalRecords: 1,
    netWorth: '₹12 Cr',
    votes: 0,
    manifestoSummary: 'Loyalty to party leadership, infrastructure jobs.'
  },
  // People's Voice
  {
    id: 'pv1',
    name: 'Rajesh Singh',
    party: "People's Voice",
    age: 42,
    education: 'B.Tech',
    background: 'Tech entrepreneur, advocate for smart cities.',
    criminalRecords: 0,
    netWorth: '₹45 Cr',
    votes: 0,
    manifestoSummary: 'Free Wi-Fi, tech hubs, and startup incubators.'
  },
  {
    id: 'pv2',
    name: 'Meera Iyer',
    party: "People's Voice",
    age: 55,
    education: 'MA Sociology',
    background: 'Retired teacher, education activist.',
    criminalRecords: 0,
    netWorth: '₹1.2 Cr',
    votes: 0,
    manifestoSummary: 'Education reform, more schools, better teacher pay.'
  },
  {
    id: 'pv3',
    name: 'Vikram Malhotra',
    party: "People's Voice",
    age: 35,
    education: 'MBA',
    background: 'Investment banker turned politician.',
    criminalRecords: 0,
    netWorth: '₹25 Cr',
    votes: 0,
    manifestoSummary: 'Economic growth, foreign investment, job creation.'
  },
  {
    id: 'pv4',
    name: 'Anjali Gupta',
    party: "People's Voice",
    age: 48,
    education: 'LLB',
    background: 'Human rights lawyer.',
    criminalRecords: 0,
    netWorth: '₹3 Cr',
    votes: 0,
    manifestoSummary: 'Justice for all, legal aid, women safety.'
  },
  // National Alliance
  {
    id: 'na1',
    name: 'Col. Ranvir Singh (Retd)',
    party: 'National Alliance',
    age: 60,
    education: 'NDA Graduate',
    background: 'Decorated army veteran.',
    criminalRecords: 0,
    netWorth: '₹5 Cr',
    votes: 0,
    manifestoSummary: 'National security, veteran welfare, discipline.'
  },
  {
    id: 'na2',
    name: 'Sunita Patil',
    party: 'National Alliance',
    age: 40,
    education: 'B.Sc Agriculture',
    background: 'Farming community leader.',
    criminalRecords: 0,
    netWorth: '₹80 Lakh',
    votes: 0,
    manifestoSummary: 'Farmer subsidies, irrigation projects, crop insurance.'
  },
  {
    id: 'na3',
    name: 'Rakesh Verma',
    party: 'National Alliance',
    age: 50,
    education: '12th Pass',
    background: 'Transport union leader.',
    criminalRecords: 2,
    netWorth: '₹8 Cr',
    votes: 0,
    manifestoSummary: 'Better roads, transport welfare, lower fuel tax.'
  },
  {
    id: 'na4',
    name: 'Dr. Amit Shah',
    party: 'National Alliance',
    age: 45,
    education: 'MBBS, MD',
    background: 'Hospital owner.',
    criminalRecords: 0,
    netWorth: '₹60 Cr',
    votes: 0,
    manifestoSummary: 'Medical tourism, hospital infrastructure.'
  }
];

export default function CandidateSelection() {
  const [candidates, setCandidates] = useState<Candidate[]>(candidatesMock);
  const [hasVoted, setHasVoted] = useState(false);
  // Track selected candidate ID per party
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [showAadhaarModal, setShowAadhaarModal] = useState(false);
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const { toast } = useToast();

  // Group candidates by party
  const parties = Array.from(new Set(candidates.map(c => c.party)));

  const handleSelect = (party: string, candidateId: string) => {
    setSelections(prev => ({
      ...prev,
      [party]: candidateId
    }));
  };

  const handleInitiateVote = () => {
    // Check if user has selected one candidate for EACH party
    const missingParties = parties.filter(party => !selections[party]);
    
    if (missingParties.length > 0) {
      toast({
        title: "Incomplete Nominations",
        description: `Please nominate a candidate for: ${missingParties.join(', ')}`,
        variant: "destructive"
      });
      return;
    }
    
    setShowAadhaarModal(true);
    setAadhaarNumber('');
    setOtp('');
    setIsOtpSent(false);
  };

  const handleSendOtp = () => {
    if (aadhaarNumber.length !== 12 || !/^\d+$/.test(aadhaarNumber)) {
      toast({
        title: "Invalid Aadhaar",
        description: "Please enter a valid 12-digit Aadhaar number.",
        variant: "destructive"
      });
      return;
    }

    setIsOtpSent(true);
    toast({
      title: "OTP Sent",
      description: "A verification code has been sent to your registered mobile number. (Demo: 123456)",
    });
  };

  const handleVerifyOtp = () => {
    if (otp.length !== 6 || !/^\d+$/.test(otp)) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a valid 6-digit OTP.",
        variant: "destructive"
      });
      return;
    }

    // Simulate API call and vote recording
    setTimeout(() => {
      setCandidates(prev => prev.map(c => {
        // Increment votes for selected candidates
        const isSelected = Object.values(selections).includes(c.id);
        return isSelected ? { ...c, votes: c.votes + 1 } : c;
      }));
      setHasVoted(true);
      setShowAadhaarModal(false);
      toast({
        title: "Nominations Submitted",
        description: "Your nominations have been securely recorded on the blockchain.",
      });
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-slate-950 font-['Outfit',sans-serif] selection:bg-blue-500/30">
      {/* Navbar */}
      <nav className="fixed top-6 left-0 right-0 z-50 flex justify-center px-6 pointer-events-none">
        <div className="w-full max-w-7xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm rounded-full px-6 py-3 pointer-events-auto flex justify-between items-center relative transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-full bg-[#0071e3] shadow-lg shadow-blue-500/20">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <Link href="/">
              <a className="text-xl font-bold tracking-tight text-[#1d1d1f] dark:text-white">Accountability</a>
            </Link>
          </div>
          
          <div className="hidden md:flex gap-8 h-full items-center">
            <Link href="/">
              <a className="text-[#1d1d1f] dark:text-white text-sm font-medium hover:text-[#0071e3] transition-colors">Home</a>
            </Link>
            
            {/* Mega Menu Trigger */}
            <div className="relative group h-full flex items-center">
              <button className="text-[#86868b] text-sm font-medium hover:text-[#0071e3] transition-colors py-2 flex items-center gap-1">
                Services <ChevronRight className="h-3 w-3 rotate-90 transition-transform group-hover:-rotate-90" />
              </button>
              
              {/* Mega Dropdown */}
              <div className="fixed top-[65px] left-0 right-0 z-40 flex justify-center px-6 transition-all duration-300 opacity-0 invisible group-hover:opacity-100 group-hover:visible pointer-events-none group-hover:pointer-events-auto">
                <div className="w-full max-w-7xl pt-6">
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
                            { name: 'Download Forms', href: '#' },
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

          {/* Mobile Menu Button - Placeholder for now */}
          <button className="md:hidden text-[#1d1d1f] dark:text-white">
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </nav>

      <div className="container mx-auto px-6 pt-32 pb-20 max-w-7xl">
        <div className="mb-16 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            <span className="text-sm font-medium text-[#1d1d1f] dark:text-white">Internal Primaries 2025</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#1d1d1f] dark:text-white tracking-tight mb-6">
            Candidate Nomination
          </h1>
          <p className="text-[#86868b] text-lg max-w-2xl mx-auto leading-relaxed">
            Empowering citizens to nominate one candidate per party for the upcoming election. 
            Ensure fair representation by participating in internal primaries.
          </p>
        </div>

        {!hasVoted ? (
          <>
            <Card className="border-0 bg-white dark:bg-slate-900 rounded-[32px] shadow-sm mb-12 overflow-hidden">
              <CardContent className="p-8 md:p-10 flex items-start gap-6">
                <div className="p-4 rounded-2xl bg-orange-50 dark:bg-orange-900/20 text-orange-600 shrink-0">
                  <Shield className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#1d1d1f] dark:text-white mb-2">
                    Secure Internal Primary - Constituency: Varanasi South
                  </h3>
                  <p className="text-[#86868b] leading-relaxed">
                    <strong>Instructions:</strong> You must nominate exactly <strong>one candidate</strong> from each party below. 
                    Your choices will be verified via Aadhaar and recorded on the blockchain.
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-16">
              {parties.map(party => (
                <div key={party} className="space-y-8">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                    <h2 className="text-3xl font-bold text-[#1d1d1f] dark:text-white">{party}</h2>
                    <Badge variant={selections[party] ? "default" : "outline"} className={`rounded-full px-4 py-1.5 text-sm ${selections[party] ? 'bg-[#0071e3] hover:bg-[#0077ED]' : ''}`}>
                      {selections[party] ? "Nomination Selected" : "Select 1 Candidate"}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {candidates.filter(c => c.party === party).map((candidate) => (
                      <Card 
                        key={candidate.id}
                        className={`border-0 rounded-[32px] overflow-hidden transition-all duration-300 cursor-pointer group relative ${
                          selections[party] === candidate.id 
                            ? 'shadow-xl ring-2 ring-[#0071e3] ring-offset-4 ring-offset-[#F5F5F7] dark:ring-offset-slate-950 bg-white dark:bg-slate-900' 
                            : 'shadow-sm hover:shadow-md bg-white dark:bg-slate-900'
                        }`}
                        onClick={() => handleSelect(party, candidate.id)}
                      >
                        <CardContent className="p-8">
                          <div className="flex justify-between items-start mb-6">
                            <div>
                              <h3 className="text-2xl font-bold text-[#1d1d1f] dark:text-white mb-1">
                                {candidate.name}
                              </h3>
                              <p className="text-[#86868b] font-medium">
                                {candidate.education} • {candidate.age} Years
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="block text-xs text-[#86868b] uppercase tracking-wider mb-1">Net Worth</span>
                              <span className="font-bold text-[#1d1d1f] dark:text-white">{candidate.netWorth}</span>
                            </div>
                          </div>
                          
                          <div className="space-y-6">
                            <div className="p-4 bg-[#F5F5F7] dark:bg-slate-800 rounded-2xl text-sm leading-relaxed text-[#1d1d1f] dark:text-white">
                              <span className="font-bold block text-xs text-[#86868b] uppercase tracking-wider mb-2">Background</span>
                              {candidate.background}
                            </div>
                            
                            <div className="flex gap-4">
                              <div className={`flex-1 p-3 rounded-2xl flex flex-col items-center justify-center gap-1 ${
                                candidate.criminalRecords > 0 
                                  ? 'bg-red-50 dark:bg-red-900/20 text-red-600' 
                                  : 'bg-green-50 dark:bg-green-900/20 text-green-600'
                              }`}>
                                <div className="text-[10px] font-bold uppercase tracking-wider">Criminal Records</div>
                                <div className="text-xl font-bold">{candidate.criminalRecords}</div>
                              </div>
                            </div>
                          </div>

                          {selections[party] === candidate.id && (
                            <div className="absolute top-6 right-6 h-8 w-8 bg-[#0071e3] text-white rounded-full flex items-center justify-center shadow-lg animate-in zoom-in duration-300">
                              <CheckCircle2 className="w-5 h-5" />
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="fixed bottom-10 left-0 right-0 flex justify-center z-40 pointer-events-none">
              <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-3 pl-6 rounded-full shadow-2xl border border-slate-200 dark:border-slate-800 flex gap-6 items-center pointer-events-auto">
                <div className="text-sm font-medium">
                  <span className="text-[#86868b]">Nominations:</span>
                  <span className="ml-2 font-bold text-[#1d1d1f] dark:text-white">{Object.keys(selections).length} / {parties.length} Parties</span>
                </div>
                <Button 
                  onClick={handleInitiateVote}
                  size="lg"
                  className="rounded-full bg-[#0071e3] hover:bg-[#0077ED] text-white shadow-lg shadow-blue-500/20 px-8 h-12"
                >
                  Submit Nominations
                </Button>
              </div>
            </div>

            {/* Aadhaar Verification Modal */}
            <Dialog open={showAadhaarModal} onOpenChange={setShowAadhaarModal}>
              <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 rounded-[32px] border-0 shadow-2xl p-8">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-[#1d1d1f] dark:text-white">Verify Identity</DialogTitle>
                  <DialogDescription className="text-[#86868b] text-base mt-2">
                    To ensure free and fair elections, please verify your identity using your Aadhaar number. 
                    This action will permanently record your nominations on the blockchain.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-6">
                  <div className="space-y-2">
                    <Label htmlFor="aadhaar" className="text-[#1d1d1f] dark:text-white font-medium">Aadhaar Number</Label>
                    <div className="flex gap-3">
                      <Input
                        id="aadhaar"
                        placeholder="Enter 12-digit Aadhaar Number"
                        value={aadhaarNumber}
                        onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, '').slice(0, 12))}
                        disabled={isOtpSent}
                        className="h-12 rounded-xl bg-[#F5F5F7] dark:bg-slate-800 border-transparent focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20 text-center text-lg tracking-widest"
                      />
                      {isOtpSent && (
                        <Button variant="ghost" onClick={() => setIsOtpSent(false)} className="h-12 px-4 rounded-xl text-[#0071e3]">
                          Change
                        </Button>
                      )}
                    </div>
                  </div>

                  {isOtpSent && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                      <Label htmlFor="otp" className="text-[#1d1d1f] dark:text-white font-medium">One Time Password (OTP)</Label>
                      <Input
                        id="otp"
                        placeholder="Enter 6-digit OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="h-12 rounded-xl bg-[#F5F5F7] dark:bg-slate-800 border-transparent focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20 text-center text-lg tracking-widest"
                      />
                      <p className="text-xs text-[#86868b] text-center mt-2">
                        Enter the code sent to your mobile. (Demo: 123456)
                      </p>
                    </div>
                  )}
                </div>
                <DialogFooter className="sm:justify-between items-center gap-4">
                  <div className="flex items-center text-xs text-[#86868b]">
                    <Shield className="w-3 h-3 mr-1" />
                    256-bit Encrypted
                  </div>
                  {!isOtpSent ? (
                    <Button 
                      type="button" 
                      onClick={handleSendOtp} 
                      disabled={aadhaarNumber.length !== 12}
                      className="rounded-full bg-[#0071e3] hover:bg-[#0077ED] text-white px-6 h-10"
                    >
                      Send OTP
                    </Button>
                  ) : (
                    <Button 
                      type="button" 
                      onClick={handleVerifyOtp} 
                      disabled={otp.length !== 6}
                      className="rounded-full bg-[#0071e3] hover:bg-[#0077ED] text-white px-6 h-10"
                    >
                      Verify & Vote
                    </Button>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        ) : (
          <Card className="max-w-3xl mx-auto border-0 bg-white dark:bg-slate-900 rounded-[32px] shadow-xl animate-in fade-in zoom-in duration-500 overflow-hidden">
            <CardHeader className="text-center pb-8 pt-12 bg-gradient-to-b from-green-50 to-transparent dark:from-green-900/10">
              <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
                <UserCheck className="w-12 h-12" />
              </div>
              <CardTitle className="text-3xl font-bold text-[#1d1d1f] dark:text-white mb-2">
                Nominations Recorded
              </CardTitle>
              <CardDescription className="text-lg text-[#86868b]">
                Your nominations for all {parties.length} parties have been successfully recorded on the blockchain.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-10 p-10">
              {parties.map(party => (
                <div key={party}>
                  <h4 className="font-bold text-[#1d1d1f] dark:text-white flex items-center gap-2 text-xl mb-6">
                    <BarChart3 className="w-6 h-6 text-[#0071e3]" /> {party} - Live Trends
                  </h4>
                  {candidates.filter(c => c.party === party).map(c => {
                    // Simulate realistic vote distribution
                    const isSelected = selections[party] === c.id;
                    const simVotes = isSelected ? 12543 : Math.floor(Math.random() * 8000) + 2000;
                    const total = 25000; // rough total
                    const pct = Math.round((simVotes / total) * 100);
                    
                    return (
                      <div key={c.id} className="mb-6">
                        <div className="flex justify-between text-sm mb-2">
                          <span className={`font-medium text-base ${isSelected ? 'text-[#0071e3] flex items-center gap-2' : 'text-[#1d1d1f] dark:text-white'}`}>
                            {c.name}
                            {isSelected && <Badge className="text-[10px] h-5 px-2 rounded-full bg-[#0071e3]">You</Badge>}
                          </span>
                          <span className="text-[#86868b]">{simVotes.toLocaleString()} votes</span>
                        </div>
                        <div className="w-full bg-[#F5F5F7] dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-1000 ${
                              isSelected 
                                ? 'bg-[#0071e3]' 
                                : 'bg-slate-300 dark:bg-slate-600'
                            }`} 
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
              
              <Button 
                onClick={() => {
                  setHasVoted(false);
                  setSelections({});
                  setAadhaarNumber('');
                }}
                variant="ghost"
                className="w-full text-sm text-[#86868b] hover:text-[#0071e3]"
              >
                Reset Demo
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
