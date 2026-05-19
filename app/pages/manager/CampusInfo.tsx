import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import { API_BASE_URL } from '../../lib/apiBase';
import { MapPin, Building2, CheckCircle2, XCircle } from 'lucide-react';

interface CampusStat {
  id: string;
  name: string;
  totalBlocks: number;
  houses: Record<string, { occupied: number; available: number }>;
}

export default function ManagerCampusInfo() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [campuses, setCampuses] = useState<CampusStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'manager') {
      navigate('/login');
      return;
    }

    const fetchStats = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/manager/stats.php`);
        const data = await response.json();
        setCampuses(data.campuses || []);
      } catch (error) {
        console.error('Failed to fetch manager stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user, navigate]);

  if (loading) {
    return (
      <Layout role="manager">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout role="manager">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Campus Information</h1>
          <p className="text-gray-600">Detailed breakdown of blocks and houses per campus.</p>
        </div>

        {campuses.length === 0 ? (
          <div className="bg-white rounded-xl shadow border border-gray-100 p-12 text-center">
            <p className="text-gray-500">No campus data available.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {campuses.map(campus => (
              <div key={campus.id} className="bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 p-6 text-white flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="bg-white/10 p-3 rounded-xl backdrop-blur-md">
                      <MapPin className="w-6 h-6 text-indigo-300" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-extrabold tracking-tight">{campus.name} Campus</h2>
                      <p className="text-xs text-indigo-200/80 mt-0.5 font-medium">Real-time status updates</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 px-4 py-2.5 rounded-xl backdrop-blur-md border border-white/10">
                    <Building2 className="w-5 h-5 text-indigo-300" />
                    <span className="font-bold text-sm tracking-wide">{campus.totalBlocks} Blocks Configured</span>
                  </div>
                </div>
                
                <div className="p-6 bg-slate-50/30">
                  <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-ping" />
                    House Types Breakdown
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {['studio', 'one_bedroom', 'two_bedroom', 'three_bedroom'].map(type => {
                      const data = campus.houses[type] || { occupied: 0, available: 0 };
                      const label = type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
                      const total = data.available + data.occupied;
                      const occupancyRate = total > 0 ? (data.occupied / total) * 100 : 0;

                      return (
                        <div key={type} className="border border-slate-100 rounded-2xl p-5 bg-white hover:border-indigo-200 hover:shadow-md transition-all duration-300 group hover:-translate-y-0.5">
                          <h4 className="font-bold text-slate-800 text-sm mb-3 group-hover:text-indigo-600 transition-colors">{label}</h4>
                          <div className="space-y-2.5">
                            <div className="flex justify-between items-center text-xs">
                              <span className="flex items-center gap-1.5 font-medium text-emerald-600">
                                <CheckCircle2 className="w-3.5 h-3.5"/> Available
                              </span>
                              <span className="font-bold text-slate-900 bg-emerald-50 px-2 py-0.5 rounded text-[11px]">{data.available} units</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                              <span className="flex items-center gap-1.5 font-medium text-rose-500">
                                <XCircle className="w-3.5 h-3.5"/> Occupied
                              </span>
                              <span className="font-bold text-slate-900 bg-rose-50 px-2 py-0.5 rounded text-[11px]">{data.occupied} units</span>
                            </div>

                            {/* Occupancy Progress Bar */}
                            <div className="pt-2 border-t border-slate-50">
                              <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium mb-1">
                                <span>Occupancy Rate</span>
                                <span>{Math.round(occupancyRate)}%</span>
                              </div>
                              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                <div 
                                  className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                                  style={{ width: `${occupancyRate}%` }} 
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
