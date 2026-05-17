import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import Layout from '../../components/Layout';
import StatusBadge from '../../components/StatusBadge';
import { toast } from 'sonner';
import { API_BASE_URL } from '../../lib/apiBase';
import { Trash2, RefreshCw } from 'lucide-react';

export default function ManageResidents() {
  const { user } = useAuth();
  const { residents, houses, refreshData } = useData();
  const navigate = useNavigate();

  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  useEffect(() => {
    if (!user || user.role !== 'chms_admin') {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this resident? House will be made available.')) return;
    setLoadingAction(`delete-${id}`);
    try {
      const res = await fetch(`${API_BASE_URL}/residents/delete.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error('Failed to delete resident');
      await refreshData();
      toast.success('Resident deleted successfully');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleReassign = async (id: string, newHouseId: string | null) => {
    if (!newHouseId) {
      toast.error('Please enter a new house ID to reassign (Implementation details depend on backend).');
      return;
    }
    // Simplistic prompt for now. In a real app, this would be a modal.
    setLoadingAction(`reassign-${id}`);
    try {
      const res = await fetch(`${API_BASE_URL}/residents/update.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, houseId: newHouseId }),
      });
      if (!res.ok) throw new Error('Failed to reassign resident');
      await refreshData();
      toast.success('Resident reassigned successfully');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoadingAction(null);
    }
  };

  // Group residents by house type
  const residentsWithHouseType = residents.map(r => {
    const house = houses.find(h => h.id === r.houseId);
    return { ...r, houseType: house?.houseType || 'unknown' };
  });

  const houseTypes = ['studio', 'one_bedroom', 'two_bedroom', 'three_bedroom'];
  const labels: Record<string, string> = {
    studio: 'Studio Houses',
    one_bedroom: 'One Bedroom Houses',
    two_bedroom: 'Two Bedroom Houses',
    three_bedroom: 'Three Bedroom Houses',
  };

  return (
    <Layout role="chms_admin">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Residents</h1>
        <p className="text-gray-600 mb-8">View and manage all residents by house type.</p>

        {houseTypes.map(type => {
          const typeResidents = residentsWithHouseType.filter(r => r.houseType === type);
          if (typeResidents.length === 0) return null;

          return (
            <div key={type} className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">{labels[type]}</h2>
              <div className="bg-white rounded-lg shadow border border-gray-200 overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resident Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Block</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">House Number</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Move-in Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {typeResidents.map((resident) => (
                      <tr key={resident.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{resident.residentName}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{resident.blockName}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{resident.houseNumber}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{new Date(resident.moveInDate).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-sm">
                          <StatusBadge 
                            status={resident.residenceStatus as any}
                            label={resident.residenceStatus === 'active' ? 'Active' : 'Left'}
                          />
                        </td>
                        <td className="px-6 py-4 text-sm flex gap-2">
                          <button
                            onClick={() => {
                              const newId = prompt('Enter new House ID to reassign (Temporary UI):');
                              if(newId) handleReassign(resident.id, newId);
                            }}
                            disabled={loadingAction === `reassign-${resident.id}`}
                            className="p-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 disabled:opacity-50 transition"
                            title="Reassign to new house"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(resident.id)}
                            disabled={loadingAction === `delete-${resident.id}`}
                            className="p-2 bg-red-50 text-red-600 rounded hover:bg-red-100 disabled:opacity-50 transition"
                            title="Delete resident"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </Layout>
  );
}