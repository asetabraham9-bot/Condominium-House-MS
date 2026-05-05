import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import Layout from '../../components/Layout';
import { Shuffle, Trophy, Star, ShieldCheck, HeartPulse, Info, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from 'sonner';
import { API_BASE_URL } from '../../lib/apiBase';

export default function DrawLottery() {
  const { user } = useAuth();
  const { applications, refreshData } = useData();
  const navigate = useNavigate();
  const [numberOfWinners, setNumberOfWinners] = useState(5);
  const [winners, setWinners] = useState<string[]>([]);
  const [drawing, setDrawing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'chms_admin') {
      navigate('/login');
    }
  }, [user, navigate]);

  /** Backend draws only from applicants already marked approved (HR / CHMS workflow). */
  const eligibleApplicants = applications.filter((a) => a.status === 'approved');

  // Sort logically for display: Priority (Disabled) first, then Score descending
  const sortedApplicants = [...eligibleApplicants].sort((a, b) => {
    if (a.isDisabled && !b.isDisabled) return -1;
    if (!a.isDisabled && b.isDisabled) return 1;
    return b.score - a.score;
  });

  const handleDrawLottery = async () => {
    if (eligibleApplicants.length === 0) {
      toast.error('No approved applicants to draw from. Approve applications first.');
      return;
    }

    const n = Math.min(Math.max(1, numberOfWinners), eligibleApplicants.length);
    setDrawing(true);
    setWinners([]); // clear previous winners for animation effect
    
    // Artificial delay for UI effect
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      const res = await fetch(`${API_BASE_URL}/lottery/draw.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numberOfWinners: n,
          strategy: 'by_score', // Strict highest-score & priority selection
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        message?: string;
        winners?: Array<{ name?: string }>;
        count?: number;
      };
      if (!res.ok) {
        toast.error(data.message ?? 'Lottery draw failed');
        setWinners([]);
        return;
      }
      await refreshData();
      const names =
        Array.isArray(data.winners) && data.winners.length > 0
          ? data.winners.map((w) => w.name ?? 'Unknown')
          : [];
      setWinners(names);
      toast.success(`Lottery drawn! ${data.count ?? names.length} winner(s) selected`);
    } catch {
      toast.error('Network error during lottery draw');
    } finally {
      setDrawing(false);
    }
  };

  return (
    <>
      <Toaster position="top-right" />
      <Layout role="chms_admin">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center space-x-3 mb-8">
            <div className="p-3 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-xl shadow-sm border border-purple-200">
              <Shuffle className="w-7 h-7 text-purple-700" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Draw Lottery</h1>
              <p className="text-gray-500 mt-1">Conduct intelligent selection for housing allocation</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Lottery Settings */}
            <div className="bg-white p-8 rounded-2xl shadow-[0_4px_20px_-4px_rgba(147,51,234,0.1)] border border-purple-100 flex flex-col">
              <div className="flex items-center space-x-2 mb-6">
                <ShieldCheck className="w-6 h-6 text-purple-600" />
                <h2 className="text-xl font-bold text-gray-900">Lottery Configuration</h2>
              </div>
              
              <div className="space-y-6 flex-1 flex flex-col justify-between">
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Number of Houses / Winners Available
                    </label>
                    <input
                      type="number"
                      value={numberOfWinners}
                      onChange={(e) => setNumberOfWinners(parseInt(e.target.value))}
                      min="1"
                      max={Math.max(1, eligibleApplicants.length)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:bg-white transition-colors text-lg font-medium text-gray-900"
                    />
                  </div>

                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-5 rounded-xl border border-indigo-100/50 shadow-inner">
                    <div className="flex items-start space-x-3">
                      <Info className="w-5 h-5 text-indigo-500 mt-0.5 shrink-0" />
                      <div>
                        <h4 className="font-bold text-indigo-900 text-sm mb-1">Selection Logic</h4>
                        <p className="text-sm text-indigo-800/80 leading-relaxed">
                          The system automatically grants <strong>Top Priority</strong> to applicants with disability cases. Remaining slots are awarded strictly based on <strong>Highest Assessment Score</strong>.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="font-semibold text-gray-700 flex items-center">
                      <Users className="w-4 h-4 mr-2 text-gray-400" />
                      Total Eligible Pool
                    </span>
                    <span className="text-xl font-black text-purple-600">{eligibleApplicants.length}</span>
                  </div>
                </div>

                <button
                  onClick={handleDrawLottery}
                  disabled={eligibleApplicants.length === 0 || drawing}
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                  className="mt-6 w-full flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg shadow-md hover:shadow-xl transition-all active:scale-[0.98] overflow-hidden relative group"
                >
                  <div className={`absolute inset-0 bg-white/20 w-full h-full transform -skew-x-12 -translate-x-full ${drawing ? 'animate-[shimmer_1.5s_infinite]' : 'group-hover:animate-[shimmer_1s_forwards]'}`}></div>
                  <Shuffle className={`w-6 h-6 ${drawing ? 'animate-spin' : ''}`} />
                  <span>{drawing ? 'Processing Draw...' : 'Execute Lottery Draw'}</span>
                </button>
              </div>
            </div>

            {/* Winners Display */}
            <div className="bg-white p-8 rounded-2xl shadow-[0_4px_20px_-4px_rgba(16,185,129,0.1)] border border-green-100 flex flex-col h-[500px]">
              <div className="flex items-center space-x-2 mb-6">
                <Trophy className="w-6 h-6 text-green-500" />
                <h2 className="text-xl font-bold text-gray-900">Official Winners</h2>
              </div>
              
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {winners.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-50">
                    <Trophy className={`w-20 h-20 text-gray-300 ${drawing ? 'animate-bounce text-purple-400' : ''}`} />
                    <p className="text-gray-500 font-medium text-lg">
                      {drawing ? 'Selecting winners...' : 'No lottery drawn yet'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {winners.map((winner, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50/30 border border-green-200/60 rounded-xl hover:shadow-md transition-shadow group"
                      >
                        <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-sm group-hover:scale-110 transition-transform">
                          #{index + 1}
                        </div>
                        <span className="font-bold text-gray-800 text-lg tracking-tight">{winner}</span>
                        <div className="ml-auto">
                           <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Approved applications (lottery pool) */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Current Eligible Pool (Ranked)</h2>
              <span className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-bold rounded-full border border-purple-100">
                Sorted by Priority & Score
              </span>
            </div>
            
            {sortedApplicants.length === 0 ? (
              <p className="text-gray-500 text-center py-12 font-medium bg-gray-50 rounded-xl border border-dashed border-gray-200">No approved applicants in the pool</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedApplicants.map((app, index) => (
                  <div
                    key={app.id}
                    className={`relative p-5 rounded-xl border transition-all ${
                      app.isDisabled 
                        ? 'bg-rose-50/30 border-rose-200/60 hover:shadow-md hover:border-rose-300' 
                        : 'bg-white border-gray-200 hover:shadow-md hover:border-blue-200'
                    }`}
                  >
                    {/* Rank Badge */}
                    <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-xs shadow-md border-2 border-white">
                      {index + 1}
                    </div>
                    
                    <div className="flex justify-between items-start mt-1">
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg mb-1">{app.applicantName}</h3>
                        <p className="text-xs text-gray-500 font-medium tracking-wide uppercase">
                          {app.academicLevel} &bull; {app.yearsOfService} YRS
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex items-center space-x-2">
                      <div className="flex-1 px-3 py-2 bg-blue-50 text-blue-800 rounded-lg font-bold text-sm text-center border border-blue-100/50">
                        Score: {app.score}
                      </div>
                      
                      {app.isDisabled && (
                        <div className="px-3 py-2 bg-rose-100 text-rose-700 rounded-lg flex items-center justify-center border border-rose-200" title="Disability Priority">
                          <HeartPulse className="w-4 h-4 mr-1" />
                          <span className="text-xs font-bold tracking-wider uppercase">Priority</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Layout>
      <style>{`
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent; 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db; 
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af; 
        }
      `}</style>
    </>
  );
}
