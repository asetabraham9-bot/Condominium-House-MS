import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import Layout from '../../components/Layout';
import StatCard from '../../components/StatCard';
import { Building2, Users, DollarSign, ClipboardList } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const { blocks, residents, payments } = useData();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.role !== 'campus_admin') {
      navigate('/login');
    }
  }, [user, navigate]);

  const activeResidents = residents.filter((r) => r.residenceStatus === 'active');
  const pendingPayments = payments.filter((p) => p.paymentStatus === 'pending');
  const totalHouses = blocks.reduce((sum, block) => sum + block.totalHouses, 0);

  return (
    <Layout role="campus_admin">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Campus Admin Dashboard</h1>
        <p className="text-gray-600 mb-8">Manage blocks, residents, and campus operations</p>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={Building2}
            iconColor="text-blue-600"
            title="Total Blocks"
            value={blocks.length}
          />
          <StatCard
            icon={Building2}
            iconColor="text-green-600"
            title="Total Houses"
            value={totalHouses}
          />
          <StatCard
            icon={Users}
            iconColor="text-purple-600"
            title="Active Residents"
            value={activeResidents.length}
          />
          <StatCard
            icon={DollarSign}
            iconColor="text-yellow-600"
            title="Pending Payments"
            value={pendingPayments.length}
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => navigate('/campus-admin/blocks')}
              className="p-4 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
            >
              Manage Blocks
            </button>
            <button
              onClick={() => navigate('/campus-admin/residents')}
              className="p-4 border-2 border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-colors font-medium"
            >
              Manage Residents
            </button>
            <button
              onClick={() => navigate('/campus-admin/verify-payments')}
              className="p-4 border-2 border-yellow-600 text-yellow-600 rounded-lg hover:bg-yellow-50 transition-colors font-medium"
            >
              Verify Payments
            </button>
          </div>
        </div>

        {/* Blocks Overview */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Blocks Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {blocks.slice(0, 6).map((block) => (
              <div key={block.id} className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-bold text-gray-900 mb-1">{block.blockName}</h3>
                <p className="text-sm text-gray-600">Houses: {block.totalHouses}</p>
                <p className="text-sm text-gray-600">Campus: {block.campus}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Residents */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Residents</h2>
          <div className="space-y-3">
            {activeResidents.slice(0, 5).map((resident) => (
              <div
                key={resident.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900">{resident.residentName}</p>
                  <p className="text-sm text-gray-600">
                    {resident.blockName} - {resident.houseNumber}
                  </p>
                </div>
                <span className="text-sm text-green-600 font-medium">Active</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}