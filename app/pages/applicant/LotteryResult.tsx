import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import Layout from '../../components/Layout';
import { Trophy, Clock, Users, CheckCircle2 } from 'lucide-react';
import { API_BASE_URL } from '../../lib/apiBase';
import StatusBadge from '../../components/StatusBadge';

export default function LotteryResult() {
  const { user } = useAuth();
  const { applications } = useData();
  const navigate = useNavigate();

  // Redirect non‑applicant users
  useEffect(() => {
    if (!user || user.role !== 'applicant') {
      navigate('/login');
    }
  }, [user, navigate]);

  // Load **all** applications (including closed cycles) for grouping and recent result
  const [allApplications, setAllApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchAllApplications = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/applications/read.php`);
        const data = await res.json();
        setAllApplications(data.records || []);
      } catch (err) {
        console.error('Failed to fetch applications:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllApplications();
  }, []);

  // Filter lottery‑related applications (drawn or decided)
  const lotteryApplications = allApplications.filter((app) =>
    ['lottery', 'approved', 'placed'].includes(app.status)
  );

  // Group by **application title** (cycleTitle)
  const applicationsByTitle = lotteryApplications.reduce<Record<string, any[]>>((acc, app) => {
    const title = app.cycleTitle ?? 'Untitled';
    if (!acc[title]) acc[title] = [];
    acc[title].push(app);
    return acc;
  }, {});

  // Recent result for the logged‑in applicant (most recent entry)
  const myRecentResult = allApplications
    .filter((app) => app.applicantId === user?.id)
    .sort((a, b) => (b.id ?? 0) - (a.id ?? 0))[0];

  // Helper: renders a table for a list of applications
  const renderTable = (apps: any[]) => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Applicant Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Selected?</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {apps.map((app, i) => {
            const isSelected = app.status === 'approved' || app.status === 'placed';
            const isMe = app.applicantId === user?.id;
            return (
              <tr key={`${app.applicantId}-${i}`} className={isMe ? 'bg-indigo-50/50' : 'hover:bg-gray-50'}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${isMe ? 'text-indigo-900' : 'text-gray-900'}`}>
                      {app.applicantName}
                    </span>
                    {isMe && (
                      <span className="bg-indigo-100 text-indigo-800 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                        You
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm">
                  <span className="font-bold text-gray-700">{app.score}</span>
                </td>
                <td className="px-6 py-4 text-sm">
                  <StatusBadge status={app.status as any} />
                </td>
                <td className="px-6 py-4 text-sm">
                  {isSelected ? (
                    <span className="inline-flex items-center gap-1 text-green-600 font-bold">
                      <CheckCircle2 className="w-4 h-4" /> Yes
                    </span>
                  ) : (
                    <span className="text-gray-400 font-medium">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <Layout role="applicant">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Lottery Results</h1>
        <p className="text-gray-600 mb-8">View the results of the condominium house lottery draws.</p>

        {/* Recent personal result */}
        {myRecentResult && (
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6 rounded-2xl shadow-lg mb-8 flex items-start gap-4 animate-fadeIn">
            <div className="bg-white/20 p-3 rounded-full">
              <Trophy className="w-8 h-8 text-yellow-300" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-1">🎉 Recent Result, {user?.firstName}!</h2>
              <p className="text-indigo-100 text-lg">
                Status: <StatusBadge status={myRecentResult.status as any} /> — Score: {myRecentResult.score}
              </p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
          </div>
        ) : lotteryApplications.length === 0 ? (
          <div className="bg-white p-12 rounded-lg shadow border border-gray-200 text-center">
            <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No Lottery Results Yet</h3>
            <p className="text-gray-600 mb-6">The lottery has not been drawn for any cycles yet.</p>
          </div>
        ) : (
          Object.entries(applicationsByTitle).map(([title, apps]) => (
            <div key={title} className="mb-12">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-gray-800">{title}</h3>
              </div>
              {renderTable(apps)}
            </div>
          ))
        )}
      </div>
    </Layout>
  );
}
