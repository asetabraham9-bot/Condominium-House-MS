import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import { API_BASE_URL } from '../../lib/apiBase';
import { Building2, Home, Users, CheckCircle2, XCircle } from 'lucide-react';

interface Stats {
  overall: {
    totalBlocks: number;
    totalHouses: number;
    totalActiveResidents: number;
  };
  houseStats: Record<string, { occupied: number; available: number }>;
  applications: Array<{
    id: string;
    title: string;
    created_at: string;
    deadline: string;
    status: string;
    total_applicants: number;
  }>;
}

export default function ManagerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
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
        setStats(data);
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

  if (!stats) return <Layout role="manager"><div>Error loading statistics</div></Layout>;

  return (
    <Layout role="manager">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Manager Dashboard</h1>
          <p className="text-gray-600">Overview of system-wide housing and application statistics.</p>
        </div>

        {/* Overall Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow border border-gray-100 flex items-center gap-4">
            <div className="bg-blue-100 p-4 rounded-lg text-blue-600">
              <Building2 className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Blocks</p>
              <p className="text-2xl font-bold text-gray-900">{stats.overall.totalBlocks}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow border border-gray-100 flex items-center gap-4">
            <div className="bg-indigo-100 p-4 rounded-lg text-indigo-600">
              <Home className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Houses</p>
              <p className="text-2xl font-bold text-gray-900">{stats.overall.totalHouses}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow border border-gray-100 flex items-center gap-4">
            <div className="bg-emerald-100 p-4 rounded-lg text-emerald-600">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Active Residents</p>
              <p className="text-2xl font-bold text-gray-900">{stats.overall.totalActiveResidents}</p>
            </div>
          </div>
        </div>

        {/* Houses by Type */}
        <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h2 className="text-lg font-bold text-gray-800">Houses by Type</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-6">
            {['studio', 'one_bedroom', 'two_bedroom', 'three_bedroom'].map(type => {
              const data = stats.houseStats[type] || { occupied: 0, available: 0 };
              const label = type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
              return (
                <div key={type} className="border border-gray-200 rounded-lg p-4 bg-gray-50/50">
                  <h3 className="font-semibold text-gray-700 mb-3">{label}</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="flex items-center gap-1 text-emerald-600"><CheckCircle2 className="w-4 h-4"/> Available</span>
                      <span className="font-bold">{data.available}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="flex items-center gap-1 text-red-500"><XCircle className="w-4 h-4"/> Occupied</span>
                      <span className="font-bold">{data.occupied}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Application Cycles */}
        <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h2 className="text-lg font-bold text-gray-800">Launched Applications</h2>
          </div>
          <div className="p-0 overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-medium border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left">Title</th>
                  <th className="px-6 py-3 text-left">Opened Date</th>
                  <th className="px-6 py-3 text-left">Deadline</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-left">Total Applicants</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stats.applications.map(app => (
                  <tr key={app.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">{app.title || 'Untitled Cycle'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{new Date(app.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{app.deadline ? new Date(app.deadline).toLocaleDateString() : 'No deadline'}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${app.status === 'open' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}`}>
                        {app.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-bold">{app.total_applicants}</td>
                  </tr>
                ))}
                {stats.applications.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No applications found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
