import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import Layout from '../../components/Layout';
import StatusBadge from '../../components/StatusBadge';

export default function ManageResidents() {
  const { user } = useAuth();
  const { residents } = useData();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.role !== 'chms_admin') {
      navigate('/login');
    }
  }, [user, navigate]);

  return (
    <Layout role="chms_admin">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Residents</h1>
        <p className="text-gray-600 mb-8">View and manage all residents</p>

        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Resident Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Block
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  House Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Move-in Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {residents.map((resident) => (
                <tr key={resident.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {resident.residentName}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{resident.blockName}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{resident.houseNumber}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(resident.moveInDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <StatusBadge 
                      status={resident.residenceStatus as any}
                      label={resident.residenceStatus === 'active' ? 'Active' : 'Left'}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}