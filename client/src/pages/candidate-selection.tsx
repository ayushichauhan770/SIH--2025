import React, { useState } from 'react';
import { Candidate } from '@/../../shared/schema';
import { Vote, Shield, UserCheck, BarChart3, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-10 max-w-[1200px]">
        <div className="mb-10 text-center">
          <h1 className="text-4xl md:text-5xl font-bold font-heading bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent mb-3">
            Candidate Nomination
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Empowering citizens to nominate one candidate per party for the upcoming election. 
            Ensure fair representation by participating in internal primaries.
          </p>
        </div>

        {!hasVoted ? (
          <>
            <Card className="border-0 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 mb-10 shadow-lg">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <Shield className="text-orange-600 dark:text-orange-400 w-8 h-8 flex-shrink-0 mt-1" />
                  <div>
                    <CardTitle className="text-orange-700 dark:text-orange-300 text-lg">
                      Secure Internal Primary - Constituency: Varanasi South
                    </CardTitle>
                    <CardDescription className="text-orange-600/80 dark:text-orange-400/80">
                      <strong>Instructions:</strong> You must nominate exactly <strong>one candidate</strong> from each party below. 
                      Your choices will be verified via Aadhaar and recorded on the blockchain.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <div className="space-y-12">
              {parties.map(party => (
                <div key={party} className="space-y-6">
                  <div className="flex items-center gap-3 border-b pb-2 border-slate-200 dark:border-slate-800">
                    <h2 className="text-2xl font-bold text-foreground">{party}</h2>
                    <Badge variant="outline" className="text-sm">
                      {selections[party] ? "Nomination Selected" : "Select 1 Candidate"}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {candidates.filter(c => c.party === party).map((candidate) => (
                      <Card 
                        key={candidate.id}
                        className={`relative overflow-hidden group border-2 transition-all duration-300 cursor-pointer hover:shadow-lg ${
                          selections[party] === candidate.id 
                            ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-900' 
                            : 'border-transparent hover:border-purple-300 dark:hover:border-purple-700'
                        }`}
                        onClick={() => handleSelect(party, candidate.id)}
                      >
                        <CardHeader>
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                                {candidate.name}
                              </CardTitle>
                              <CardDescription className="text-sm font-medium">
                                {candidate.education} • {candidate.age} Years
                              </CardDescription>
                            </div>
                            <div className="text-right">
                              <span className="block text-xs text-muted-foreground uppercase tracking-wider">Net Worth</span>
                              <span className="font-bold text-foreground">{candidate.netWorth}</span>
                            </div>
                          </div>
                          
                          <div className="space-y-4">
                            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm">
                              <span className="font-bold block text-xs text-muted-foreground uppercase tracking-wider mb-1">Background</span>
                              {candidate.background}
                            </div>
                            <div className="flex gap-4">
                              <div className={`flex-1 p-2 rounded-lg border text-center ${
                                candidate.criminalRecords > 0 
                                  ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900 text-red-700 dark:text-red-400' 
                                  : 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900 text-green-700 dark:text-green-400'
                              }`}>
                                <div className="text-[10px] font-bold uppercase tracking-wider">Criminal Records</div>
                                <div className="text-xl font-bold">{candidate.criminalRecords}</div>
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        
                        {selections[party] === candidate.id && (
                          <div className="absolute top-2 right-2 bg-blue-500 text-white p-1 rounded-full shadow-lg animate-in zoom-in">
                            <UserCheck className="w-4 h-4" />
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="sticky bottom-6 mt-12 flex justify-center z-10">
              <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-4 rounded-full shadow-2xl border border-slate-200 dark:border-slate-800 flex gap-4 items-center">
                <div className="text-sm font-medium px-2">
                  <span className="text-muted-foreground">Nominations:</span>
                  <span className="ml-2 font-bold text-foreground">{Object.keys(selections).length} / {parties.length} Parties</span>
                </div>
                <Button 
                  onClick={handleInitiateVote}
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg rounded-full px-8"
                >
                  Submit Nominations
                </Button>
              </div>
            </div>

            {/* Aadhaar Verification Modal */}
            <Dialog open={showAadhaarModal} onOpenChange={setShowAadhaarModal}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Verify Identity</DialogTitle>
                  <DialogDescription>
                    To ensure free and fair elections, please verify your identity using your Aadhaar number. 
                    This action will permanently record your nominations on the blockchain.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="aadhaar">Aadhaar Number</Label>
                    <div className="flex gap-2">
                      <Input
                        id="aadhaar"
                        placeholder="Enter 12-digit Aadhaar Number"
                        value={aadhaarNumber}
                        onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, '').slice(0, 12))}
                        disabled={isOtpSent}
                        className="text-center text-lg tracking-widest"
                      />
                      {isOtpSent && (
                        <Button variant="ghost" size="sm" onClick={() => setIsOtpSent(false)}>
                          Change
                        </Button>
                      )}
                    </div>
                  </div>

                  {isOtpSent && (
                    <div className="grid gap-2 animate-in fade-in slide-in-from-top-2">
                      <Label htmlFor="otp">One Time Password (OTP)</Label>
                      <Input
                        id="otp"
                        placeholder="Enter 6-digit OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="text-center text-lg tracking-widest"
                      />
                      <p className="text-xs text-muted-foreground text-center">
                        Enter the code sent to your mobile. (Demo: 123456)
                      </p>
                    </div>
                  )}
                </div>
                <DialogFooter className="sm:justify-between">
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Shield className="w-3 h-3 mr-1" />
                    256-bit Encrypted
                  </div>
                  {!isOtpSent ? (
                    <Button type="button" onClick={handleSendOtp} disabled={aadhaarNumber.length !== 12}>
                      Send OTP
                    </Button>
                  ) : (
                    <Button type="button" onClick={handleVerifyOtp} disabled={otp.length !== 6}>
                      Verify & Vote
                    </Button>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        ) : (
          <Card className="max-w-3xl mx-auto border-2 border-green-200 dark:border-green-900 shadow-xl animate-in fade-in zoom-in duration-500">
            <CardHeader className="text-center pb-4">
              <div className="w-24 h-24 bg-green-100 dark:bg-green-950/50 rounded-full flex items-center justify-center mx-auto mb-6">
                <UserCheck className="w-12 h-12 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">
                Nominations Recorded
              </CardTitle>
              <CardDescription className="text-lg">
                Your nominations for all {parties.length} parties have been successfully recorded on the blockchain.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-8">
              {parties.map(party => (
                <div key={party}>
                  <h4 className="font-bold text-foreground flex items-center gap-2 text-lg mb-4 border-b pb-2">
                    <BarChart3 className="w-5 h-5" /> {party} - Live Trends
                  </h4>
                  {candidates.filter(c => c.party === party).map(c => {
                    // Simulate realistic vote distribution
                    const isSelected = selections[party] === c.id;
                    const simVotes = isSelected ? 12543 : Math.floor(Math.random() * 8000) + 2000;
                    const total = 25000; // rough total
                    const pct = Math.round((simVotes / total) * 100);
                    
                    return (
                      <div key={c.id} className="mb-4">
                        <div className="flex justify-between text-sm mb-2">
                          <span className={`font-medium ${isSelected ? 'text-blue-600 dark:text-blue-400 flex items-center gap-1' : 'text-foreground'}`}>
                            {c.name}
                            {isSelected && <Badge variant="secondary" className="text-[10px] h-4 px-1">You</Badge>}
                          </span>
                          <span className="text-muted-foreground">{simVotes.toLocaleString()} votes</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-1000 ${
                              isSelected 
                                ? 'bg-gradient-to-r from-blue-500 to-purple-500' 
                                : 'bg-slate-400 dark:bg-slate-500'
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
                className="w-full text-sm"
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
