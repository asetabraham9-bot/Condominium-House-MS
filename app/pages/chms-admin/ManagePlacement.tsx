import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import Layout from '../../components/Layout';
import { Home } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from 'sonner';
import { API_BASE_URL } from '../../lib/apiBase';

export default function ManagePlacement() {
  const { user } = useAuth();
  const { applications, houses, blocks, refreshData } = useData();
  const navigate = useNavigate();
  const [selectedApplicant, setSelectedApplicant] = useState('');
  const [selectedHouse, setSelectedHouse] = useState('');
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'chms_admin') {
      navigate('/login');
    }
  }, [user, navigate]);

  /** Applicants who won the lottery and are not yet placed (backend: lottery_won). */
  const lotteryWinners = applications.filter((a) => a.status === 'lottery');
  const availableHouses = houses.filter((h) => h.status === 'available');

  const campusIdForHouse = (houseId: string) => {
    const house = houses.find((h) => h.id === houseId);
    if (!house) return undefined;
    if (house.campusId) return house.campusId;
    const block = blocks.find((b) => b.id === house.blockId);
    return block?.campusId;
  };

  const handleAssignHouse = async () => {
    if (!selectedApplicant || !selectedHouse) {
      toast.error('Please select both applicant and house');
      return;
    }

    const applicant = lotteryWinners.find((a) => a.applicantId === selectedApplicant);
    const house = availableHouses.find((h) => h.id === selectedHouse);

    if (!applicant || !house) return;

    const campusId = campusIdForHouse(house.id);
    if (!campusId) {
      toast.error('Could not determine campus for the selected house');
      return;
    }

    setAssigning(true);
    try {
      const res = await fetch(`${API_BASE_URL}/placement/assign.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: applicant.applicantId,
          houseId: house.id,
          campusId,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) {
        toast.error(data.message ?? 'Placement failed');
        return;
      }
      await refreshData();
      toast.success('House assigned successfully');
      setSelectedApplicant('');
      setSelectedHouse('');
    } catch {
      toast.error('Network error during placement');
    } finally {
      setAssigning(false);
    }
  };

  return (
    <>
      <Toaster position="top-right" />
      <Layout role="chms_admin">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Placement</h1>
          <p className="text-gray-600 mb-8">
            Assign houses to applicants who won the lottery (eligible in the system as lottery
            winners).
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Assignment Form */}
            <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Assign House</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select lottery winner *
                  </label>
                  <select
                    value={selectedApplicant}
                    onChange={(e) => setSelectedApplicant(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choose applicant...</option>
                    {lotteryWinners.map((app) => (
                      <option key={app.applicantId} value={app.applicantId}>
                        {app.applicantName} (Score: {app.score})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Available House *
                  </label>
                  <select
                    value={selectedHouse}
                    onChange={(e) => setSelectedHouse(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choose house...</option>
                    {availableHouses.map((house) => (
                      <option key={house.id} value={house.id}>
                        {house.blockName ? `${house.blockName} · ` : ''}
                        {house.houseNumber} — {String(house.houseType).replace(/_/g, ' ')}
                        {house.campusName ? ` (${house.campusName})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <strong>Lottery winners awaiting placement:</strong> {lotteryWinners.length}
                  </p>
                  <p className="text-sm text-blue-900 mt-1">
                    <strong>Available Houses:</strong> {availableHouses.length}
                  </p>
                </div>

                <button
                  onClick={handleAssignHouse}
                  disabled={!selectedApplicant || !selectedHouse || assigning}
                  className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {assigning ? 'Assigning…' : 'Assign House'}
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Placement Statistics</h2>
              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Home className="w-8 h-8 text-green-600" />
                    <div>
                      <p className="text-sm text-green-600">Lottery winners</p>
                      <p className="text-2xl font-bold text-green-900">{lotteryWinners.length}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Home className="w-8 h-8 text-blue-600" />
                    <div>
                      <p className="text-sm text-blue-600">Available Houses</p>
                      <p className="text-2xl font-bold text-blue-900">{availableHouses.length}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Lottery winners list */}
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Lottery winners awaiting placement</h2>
            {lotteryWinners.length === 0 ? (
              <p className="text-gray-600 text-center py-8">
                No lottery winners awaiting placement. Run the lottery for approved applicants first.
              </p>
            ) : (
              <div className="space-y-2">
                {lotteryWinners.map((app) => (
                  <div
                    key={app.applicantId}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{app.applicantName}</p>
                      <p className="text-sm text-gray-600">
                        {app.academicLevel} | {app.yearsOfService} years | Score: {app.score}
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                      Lottery winner
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Layout>
    </>
  );
}
