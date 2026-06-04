import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import Layout from '../../components/Layout';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import { FileText, Users, TrendingUp, Home, Rocket, Lock, Bell } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from 'sonner';
import { API_BASE_URL } from '../../lib/apiBase';

export default function Dashboard() {
  const { user } = useAuth();
  const { applications, residents, blocks, houses, housingCycles, notifications, refreshData } = useData();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.role !== 'chms_admin') {
      navigate('/login');
    }
  }, [user, navigate]);

  const pendingApplications = applications.filter((a) => a.status === 'pending');
  const lotteryApplications = applications.filter((a) => a.status === 'lottery');
  const openCycle = housingCycles.find((c) => c.status === 'open');
  const activeResidents = residents.filter((r) => r.residenceStatus === 'active');
  const availableHouses = houses.filter((h) => h.status === 'available');

  return (
    <Layout role="chms_admin">
      <Toaster position="top-right" />
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">CHMS Admin Dashboard</h1>
        <p className="text-gray-600 mb-8">System-wide condominium management overview</p>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <StatCard
            icon={FileText}
            iconColor="text-blue-600"
            title="Submitted applications"
            value={applications.length}
            subtitle={`${pendingApplications.length} pending`}
          />
          <StatCard
            icon={Rocket}
            iconColor="text-orange-600"
            title="Open housing cycle"
            value={openCycle ? 'Yes' : 'None'}
            subtitle={openCycle?.title ?? 'Launch a round for applicants'}
          />
          <StatCard
            icon={TrendingUp}
            iconColor="text-purple-600"
            title="In Lottery"
            value={lotteryApplications.length}
          />
          <StatCard
            icon={Users}
            iconColor="text-green-600"
            title="Active Residents"
            value={activeResidents.length}
          />
          <StatCard
            icon={Home}
            iconColor="text-yellow-600"
            title="Available Houses"
            value={availableHouses.length}
          />
        </div>

        {/* System Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">System Overview</h2>
            <div className="space-y-3">
              <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Total Blocks</span>
                <span className="font-bold text-gray-900">{blocks.length}</span>
              </div>
              <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Total Houses</span>
                <span className="font-bold text-gray-900">{houses.length}</span>
              </div>
              <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Occupied Houses</span>
                <span className="font-bold text-gray-900">
                  {houses.filter((h) => h.status === 'occupied').length}
                </span>
              </div>
              <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Monthly Revenue</span>
                <span className="font-bold text-green-600">
                  {activeResidents.length * 1200} Birr
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => navigate('/chms-admin/launch-cycle')}
                className="w-full p-3 text-left border-2 border-orange-600 text-orange-700 rounded-lg hover:bg-orange-50 transition-colors font-medium"
              >
                Launch application cycle
              </button>
              <button
                onClick={() => navigate('/chms-admin/applicants')}
                className="w-full p-3 text-left border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
              >
                Manage Applicants
              </button>
              <button
                onClick={() => navigate('/chms-admin/lottery')}
                className="w-full p-3 text-left border-2 border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors font-medium"
              >
                Draw Lottery
              </button>
              <button
                onClick={() => navigate('/chms-admin/placement')}
                className="w-full p-3 text-left border-2 border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-colors font-medium"
              >
                Manage Placement
              </button>
              <button
                onClick={() => navigate('/chms-admin/notifications')}
                className="w-full p-3 text-left border-2 border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium"
              >
                Send Notifications
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          {/* Recent Applications */}
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Applications</h2>
            <div className="space-y-3">
              {applications.slice(0, 5).map((app) => (
                <div
                  key={app.applicantId}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">{app.applicantName}</p>
                    <p className="text-sm text-gray-600">
                      Score: {app.score} | {new Date(app.applicationDate).toLocaleDateString()}
                    </p>
                  </div>
                  <StatusBadge status={app.status as any} />
                </div>
              ))}
            </div>
          </div>

          {/* Forwarded House Requests */}
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5 text-indigo-600 animate-pulse" />
              Forwarded House Nominations
            </h2>
            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
              {notifications.filter((n) => n.message.includes('[FORWARDED_REQUEST]')).length === 0 ? (
                <div className="text-sm text-gray-500 text-center py-8">
                  No forwarded house reports from managers.
                </div>
              ) : (
                notifications
                  .filter((n) => n.message.includes('[FORWARDED_REQUEST]'))
                  .map((req) => (
                    <div
                      key={req.id}
                      className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-2 text-xs"
                    >
                      <div className="flex justify-between items-center border-b border-indigo-100/50 pb-2">
                        <span className="bg-indigo-600 text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                          Forwarded Report
                        </span>
                        <span className="text-slate-500 font-medium">
                          {new Date(req.dateSent).toLocaleDateString()}
                        </span>
                      </div>
                      <pre className="whitespace-pre-wrap font-mono text-slate-700 leading-relaxed bg-white p-3 rounded-lg border border-slate-100 shadow-inner">
                        {req.message.replace('[FORWARDED_REQUEST] ', '')}
                      </pre>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}