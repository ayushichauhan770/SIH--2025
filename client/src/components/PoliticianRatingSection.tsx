import React, { useState, useEffect } from 'react';
import { Search, MapPin, Star, AlertCircle, CheckCircle2, ChevronRight, User } from 'lucide-react';

// --- Types ---
export interface Politician {
  id: string;
  name: string;
  position: 'MP' | 'MLA';
  constituency: string;
  party: string;
  rating: number;
  attendance: number;
  status: 'Active' | 'Under Inquiry' | 'Suspended';
  imageUrl?: string;
}

// --- Mock Service ---
export const PoliticianService = {
  getTopRated: async (): Promise<Politician[]> => {
    // Simulating API delay
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            id: '1',
            name: 'Aditi Rao',
            position: 'MP',
            constituency: 'Bangalore South',
            party: 'Progress Party',
            rating: 4.8,
            attendance: 92,
            status: 'Active'
          },
          {
            id: '2',
            name: 'Vikram Singh',
            position: 'MLA',
            constituency: 'Pune Cantonment',
            party: 'Janata Union',
            rating: 4.6,
            attendance: 88,
            status: 'Active'
          }
        ]);
      }, 500);
    });
  },
  
  getUnderScrutiny: async (): Promise<Politician[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            id: '3',
            name: 'Rajesh Kumar',
            position: 'MLA',
            constituency: 'Patna Central',
            party: 'National Alliance',
            rating: 2.1,
            attendance: 45,
            status: 'Under Inquiry'
          }
        ]);
      }, 500);
    });
  }
};

const PoliticianRatingSection: React.FC = () => {
  const [topPoliticians, setTopPoliticians] = useState<Politician[]>([]);
  const [scrutinyList, setScrutinyList] = useState<Politician[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadData = async () => {
      const top = await PoliticianService.getTopRated();
      const scrutiny = await PoliticianService.getUnderScrutiny();
      setTopPoliticians(top);
      setScrutinyList(scrutiny);
    };
    loadData();
  }, []);

  return (
    <div className="glass-card rounded-[32px] p-8 md:p-12 border border-slate-100 dark:border-slate-800">
      <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
        <div>
          <div className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold mb-4 bg-blue-50 dark:bg-blue-900/20 w-fit px-3 py-1 rounded-full text-xs uppercase tracking-wide">
            <User size={14} /> Jan Samiksha
          </div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Know Your Leader</h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-xl">
            Real-time performance ratings of MPs and MLAs based on attendance, fund utilization, and citizen feedback.
          </p>
        </div>
        
        {/* Search Bar */}
        <div className="w-full md:w-auto relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
          </div>
          <input
            type="text"
            className="w-full md:w-[320px] bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-full pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-400"
            placeholder="Search by Constituency or Name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Top Performers Column */}
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <Star className="text-yellow-400 fill-yellow-400" size={20} /> Top Performing Representatives
          </h3>
          <div className="space-y-4">
            {topPoliticians.map((pol) => (
              <div key={pol.id} className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 bg-white dark:bg-slate-800 group cursor-pointer">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900 dark:to-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-lg">
                  {pol.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{pol.name}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                        <span className="font-semibold bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">{pol.position}</span>
                        {pol.constituency}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="inline-flex items-center gap-1 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 px-2 py-1 rounded-lg font-bold text-sm">
                        {pol.rating} <Star size={10} fill="currentColor" />
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1"><CheckCircle2 size={12} className="text-green-600 dark:text-green-400" /> {pol.attendance}% Attendance</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                    <span>{pol.party}</span>
                  </div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRight className="text-slate-300 dark:text-slate-600" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Accountability Watch Column */}
        <div className="bg-red-50/50 dark:bg-red-950/10 rounded-3xl p-6 border border-red-100 dark:border-red-900/30">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <AlertCircle className="text-red-600 dark:text-red-400" size={20} /> Accountability Watch (ACE)
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
            Representatives with ratings below 50% face automatic inquiry by the Automated Consequence Engine (ACE).
          </p>
          
          <div className="space-y-4">
            {scrutinyList.map((pol) => (
              <div key={pol.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-red-100 dark:border-red-900/30 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl">
                  {pol.status.toUpperCase()}
                </div>
                <div className="flex gap-4 items-center">
                   <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-600 dark:text-red-400 font-bold">
                    !
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">{pol.name}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{pol.position}, {pol.constituency}</p>
                    <div className="flex items-center gap-3 mt-2">
                       <span className="text-xs font-semibold text-red-600 dark:text-red-400">Rating: {pol.rating}/5.0</span>
                       <span className="text-xs text-slate-500 dark:text-slate-400">Attendance: {pol.attendance}%</span>
                    </div>
                  </div>
                </div>
                <button className="w-full mt-4 py-2 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl text-sm font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                  View Inquiry Report
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PoliticianRatingSection;
