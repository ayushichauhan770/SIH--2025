import React from 'react';
import { ArrowRight, Database, Lock, Search, RefreshCw, Landmark } from 'lucide-react';
import { Button } from '@/components/ui/button';

const recentDonations = [
  { id: 'TXN-8921', party: 'Progress Party', amount: '₹5,00,000', time: '2 mins ago', type: 'Corporate' },
  { id: 'TXN-8922', party: 'Janata Union', amount: '₹1,200', time: '5 mins ago', type: 'Individual' },
  { id: 'TXN-8923', party: 'National Alliance', amount: '₹50,000', time: '12 mins ago', type: 'Corporate' },
  { id: 'TXN-8924', party: 'Progress Party', amount: '₹25,000', time: '15 mins ago', type: 'Individual' },
];

const FundingTransparency: React.FC = () => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-[24px] shadow-lg border border-slate-100 dark:border-slate-800 overflow-hidden mb-12">
      <div className="grid lg:grid-cols-2">
        <div className="p-8 md:p-12 flex flex-col justify-center order-2 lg:order-1">
          <div className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold mb-4 bg-blue-50 dark:bg-blue-900/20 w-fit px-3 py-1 rounded-full text-xs uppercase tracking-wide">
             <Landmark size={14} />
             <span>Institutional Reform</span>
          </div>
          <h3 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-4">Political Funding Transparency</h3>
          <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed mb-8">
            All political donations must be digital and viewable on a public portal. 
            We're ending the era of black money and opaque funding by ensuring every rupee is accounted for on an immutable ledger.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Button className="rounded-full shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white h-12 px-8">
              View Transparency Portal <ArrowRight size={18} className="ml-2" />
            </Button>
            <Button variant="outline" className="rounded-full h-12 px-8 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800">
              Read Policy <Search size={18} className="ml-2" />
            </Button>
          </div>
        </div>
        
        <div className="bg-slate-50 dark:bg-slate-950/50 border-b lg:border-b-0 lg:border-l border-slate-100 dark:border-slate-800 p-8 md:p-12 order-1 lg:order-2 flex items-center justify-center">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden w-full max-w-md mx-auto">
                <div className="px-4 py-3 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <Database size={12} /> Live Ledger
                    </span>
                    <div className="flex gap-1 items-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-[10px] text-green-600 dark:text-green-400 font-medium">Updating</span>
                    </div>
                </div>
                <div className="divide-y divide-slate-50 dark:divide-slate-800">
                    {recentDonations.map((d, i) => (
                        <div key={i} className="px-4 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold ${d.type === 'Corporate' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'}`}>
                                    {d.type === 'Corporate' ? 'C' : 'I'}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{d.party}</p>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                        {d.id} • <Lock size={8} /> Verified
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold text-slate-900 dark:text-white">{d.amount}</p>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400">{d.time}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/30 text-center border-t border-slate-100 dark:border-slate-800 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800/50 cursor-pointer">
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-medium flex items-center justify-center gap-1">
                        <RefreshCw size={10} /> View Full Transaction History
                    </span>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default FundingTransparency;
