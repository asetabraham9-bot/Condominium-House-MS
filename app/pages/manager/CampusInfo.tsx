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
              <div key={campus.id} className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-900 to-indigo-800 p-6 text-white flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-6 h-6 text-blue-200" />
                    <h2 className="text-2xl font-bold">{campus.name}</h2>
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm">
                    <Building2 className="w-5 h-5 text-blue-200" />
                    <span className="font-semibold">{campus.totalBlocks} Blocks</span>
                  </div>
                </div>
                
                <div className="p-6">
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 border-b pb-2">House Status Breakdown</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {['studio', 'one_bedroom', 'two_bedroom', 'three_bedroom'].map(type => {
                      const data = campus.houses[type] || { occupied: 0, available: 0 };
                      const label = type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
                      return (
                        <div key={type} className="border border-gray-100 rounded-xl p-4 bg-gray-50 hover:bg-white hover:shadow-md transition-all">
                          <h4 className="font-bold text-gray-800 mb-3">{label}</h4>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center p-2 bg-white rounded-lg border border-gray-100">
                              <span className="flex items-center gap-2 text-sm font-medium text-emerald-600">
                                <CheckCircle2 className="w-4 h-4"/> Available
                              </span>
                              <span className="font-bold text-gray-900">{data.available}</span>
                            </div>
                            <div className="flex justify-between items-center p-2 bg-white rounded-lg border border-gray-100">
                              <span className="flex items-center gap-2 text-sm font-medium text-red-500">
                                <XCircle className="w-4 h-4"/> Occupied
                              </span>
                              <span className="font-bold text-gray-900">{data.occupied}</span>
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
