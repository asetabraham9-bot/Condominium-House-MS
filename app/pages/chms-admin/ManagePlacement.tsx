import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { useData, type Application } from '../../context/DataContext';
import Layout from '../../components/Layout';
import { Home, User } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from 'sonner';
import { API_BASE_URL } from '../../lib/apiBase';
import { houseTypesMatch } from '../../utils/houseOfferings';

function formatHouseType(value: string | null | undefined): string {
  if (!value) return '—';
  return String(value).replace(/_/g, ' ');
}

function WinnerDetails({ applicant }: { applicant: Application }) {
  return (
    <div className="rounded-lg border border-indigo-100 bg-indigo-50/60 p-4 space-y-3">
      <div className="flex items-center gap-2 text-indigo-900 font-semibold">
        <User className="w-4 h-4" />
        Winner profile
      </div>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div>
          <dt className="text-gray-500">Full name</dt>
          <dd className="font-medium text-gray-900">{applicant.applicantName}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Work / live campus</dt>
          <dd className="font-medium text-gray-900">{applicant.applicantCampusName ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Applied house type</dt>
          <dd className="font-medium text-gray-900">{applicant.houseType ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Preferred placement campus</dt>
          <dd className="font-medium text-gray-900">{applicant.preferredCampusName ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Academic level</dt>
          <dd className="font-medium text-gray-900">{applicant.academicLevel}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Years of service</dt>
          <dd className="font-medium text-gray-900">{applicant.yearsOfService}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Selection score</dt>
          <dd className="font-medium text-gray-900">{applicant.score}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Gender</dt>
          <dd className="font-medium text-gray-900">{applicant.gender ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Marital status</dt>
          <dd className="font-medium text-gray-900">{applicant.maritalStatus}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Children</dt>
          <dd className="font-medium text-gray-900">{applicant.childrenCount ?? 0}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Job responsibility</dt>
          <dd className="font-medium text-gray-900">{applicant.jobResponsibility}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Disability</dt>
          <dd className="font-medium text-gray-900">
            {applicant.isDisabled
              ? applicant.disabilityType || 'Yes'
              : 'No'}
          </dd>
        </div>
      </dl>
    </div>
  );
}

export default function ManagePlacement() {
  const { user } = useAuth();
  const { applications, houses, blocks, refreshData } = useData();
  const navigate = useNavigate();
  const [selectedApplicant, setSelectedApplicant] = useState('');
  const [selectedHouse, setSelectedHouse] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [showAllHouses, setShowAllHouses] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'chms_admin') {
      navigate('/login');
    }
  }, [user, navigate]);

  const lotteryWinners = applications.filter((a) => a.status === 'lottery');
  const availableHouses = houses.filter((h) => h.status === 'available');
  const selectedWinner = lotteryWinners.find((a) => a.applicantId === selectedApplicant);

  const housesForWinner = selectedWinner
    ? availableHouses.filter((house) => {
        const campusId = house.campusId ?? blocks.find((b) => b.id === house.blockId)?.campusId;
        const campusMatch =
          !selectedWinner.preferredCampusId || campusId === selectedWinner.preferredCampusId;
        const typeMatch =
          !selectedWinner.houseType || houseTypesMatch(selectedWinner.houseType, house.houseType);
        return campusMatch && typeMatch;
      })
    : availableHouses;

  const houseOptions = showAllHouses || !selectedWinner ? availableHouses : housesForWinner;

  const campusIdForHouse = (houseId: string) => {
    const house = houses.find((h) => h.id === houseId);
    if (!house) return undefined;
    if (house.campusId) return house.campusId;
    const block = blocks.find((b) => b.id === house.blockId);
    return block?.campusId;
  };

  const handleApplicantChange = (applicantId: string) => {
    setSelectedApplicant(applicantId);
    setSelectedHouse('');
    setShowAllHouses(false);
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

    if (
      applicant.preferredCampusId &&
      campusId !== applicant.preferredCampusId
    ) {
      toast.warning('Selected house is outside the winner’s preferred campus.');
    }

    if (applicant.houseType && !houseTypesMatch(applicant.houseType, house.houseType)) {
      toast.warning('Selected house type does not match what the applicant applied for.');
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
      setShowAllHouses(false);
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
            Assign houses to lottery winners using their applied house type and campus preferences.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Assign House</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select lottery winner *
                  </label>
                  <select
                    value={selectedApplicant}
                    onChange={(e) => handleApplicantChange(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choose applicant...</option>
                    {lotteryWinners.map((app) => (
                      <option key={app.applicantId} value={app.applicantId}>
                        {app.applicantName} — {app.houseType ?? 'No type'} @{' '}
                        {app.preferredCampusName ?? app.applicantCampusName ?? 'Unknown campus'} (Score:{' '}
                        {app.score})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedWinner ? <WinnerDetails applicant={selectedWinner} /> : null}

                <div>
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Select available house *
                    </label>
                    {selectedWinner ? (
                      <label className="flex items-center gap-2 text-xs text-gray-600">
                        <input
                          type="checkbox"
                          checked={showAllHouses}
                          onChange={(e) => {
                            setShowAllHouses(e.target.checked);
                            setSelectedHouse('');
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        Show all houses
                      </label>
                    ) : null}
                  </div>
                  <select
                    value={selectedHouse}
                    onChange={(e) => setSelectedHouse(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choose house...</option>
                    {houseOptions.map((house) => (
                      <option key={house.id} value={house.id}>
                        {house.blockName ? `${house.blockName} · ` : ''}
                        {house.houseNumber} — {formatHouseType(house.houseType)}
                        {house.campusName ? ` (${house.campusName})` : ''}
                      </option>
                    ))}
                  </select>
                  {selectedWinner && !showAllHouses ? (
                    <p className="text-xs text-gray-500 mt-2">
                      Showing houses matching{' '}
                      <strong>{selectedWinner.houseType ?? 'any type'}</strong> at{' '}
                      <strong>
                        {selectedWinner.preferredCampusName ??
                          selectedWinner.applicantCampusName ??
                          'any campus'}
                      </strong>
                      . {houseOptions.length} match(es) found.
                    </p>
                  ) : null}
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <strong>Lottery winners awaiting placement:</strong> {lotteryWinners.length}
                  </p>
                  <p className="text-sm text-blue-900 mt-1">
                    <strong>Available houses:</strong> {availableHouses.length}
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
                      <p className="text-sm text-blue-600">Available houses</p>
                      <p className="text-2xl font-bold text-blue-900">{availableHouses.length}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Lottery winners awaiting placement</h2>
            {lotteryWinners.length === 0 ? (
              <p className="text-gray-600 text-center py-8">
                No lottery winners awaiting placement. Run the lottery for approved applicants first.
              </p>
            ) : (
              <div className="space-y-4">
                {lotteryWinners.map((app) => (
                  <div
                    key={app.applicantId}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-100"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="space-y-2">
                        <p className="font-semibold text-gray-900 text-lg">{app.applicantName}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-1 text-sm text-gray-700">
                          <p>
                            <span className="text-gray-500">Work/live campus:</span>{' '}
                            {app.applicantCampusName ?? '—'}
                          </p>
                          <p>
                            <span className="text-gray-500">Applied house type:</span>{' '}
                            {app.houseType ?? '—'}
                          </p>
                          <p>
                            <span className="text-gray-500">Preferred campus:</span>{' '}
                            {app.preferredCampusName ?? '—'}
                          </p>
                          <p>
                            <span className="text-gray-500">Academic level:</span> {app.academicLevel}
                          </p>
                          <p>
                            <span className="text-gray-500">Service:</span> {app.yearsOfService} years
                          </p>
                          <p>
                            <span className="text-gray-500">Score:</span> {app.score}
                          </p>
                          <p>
                            <span className="text-gray-500">Marital status:</span> {app.maritalStatus}
                          </p>
                          <p>
                            <span className="text-gray-500">Children:</span> {app.childrenCount ?? 0}
                          </p>
                          <p>
                            <span className="text-gray-500">Job:</span> {app.jobResponsibility}
                          </p>
                        </div>
                      </div>
                      <span className="self-start px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                        Lottery winner
                      </span>
                    </div>
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
