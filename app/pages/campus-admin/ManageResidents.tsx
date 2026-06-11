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
    if (!user || user.role !== 'campus_admin') {
      navigate('/login');
    }
  }, [user, navigate]);

  // Group residents by campus -> block -> house type
  const enrichedResidents = residents.map(r => {
    return { ...r, houseType: r.houseType || 'unknown' };
  });

  const campuses = Array.from(new Set(enrichedResidents.map(r => r.campusName).filter(Boolean)));
  const campusDisplayList = campuses.length > 0 ? campuses : (user?.campusName ? [user.campusName] : []);

  const labels: Record<string, string> = {
    studio: 'Studio Houses',
    one_bedroom: 'One Bedroom Houses',
    two_bedroom: 'Two Bedroom Houses',
    three_bedroom: 'Three Bedroom Houses',
    unknown: 'Unknown House Type',
  };

  const orderedHouseTypes: ('studio' | 'one_bedroom' | 'two_bedroom' | 'three_bedroom' | 'unknown')[] = [
    'studio',
    'one_bedroom',
    'two_bedroom',
    'three_bedroom',
    'unknown',
  ];

  return (
    <Layout role="campus_admin">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Residents</h1>
        <p className="text-gray-600 mb-8">View and manage residents assigned to your campus.</p>

        {campusDisplayList.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
            No residents or campus information found.
          </div>
        ) : (
          campusDisplayList.map(campus => {
            const campusResidents = enrichedResidents.filter(r => r.campusName === campus || (!r.campusName && campus === user?.campusName));
            
            const blocksInCampus = Array.from(new Set(campusResidents.map(r => r.blockName).filter(Boolean)));

            return (
              <div key={campus} className="mb-12 bg-gray-50/50 p-6 rounded-2xl border border-gray-200">
                <h2 className="text-2xl font-extrabold text-gray-900 mb-6 flex items-center gap-2">
                  <span className="w-2 h-8 bg-blue-600 rounded-full"></span>
                  {campus} Campus
                </h2>

                {blocksInCampus.length === 0 ? (
                  <div className="bg-white rounded-xl border border-gray-100 p-6 text-gray-500">
                    No blocks or assigned residents found in this campus.
                  </div>
                ) : (
                  blocksInCampus.map(block => {
                    const blockResidents = campusResidents.filter(r => r.blockName === block);

                    return (
                      <div key={`${campus}-${block}`} className="ml-4 mb-8 bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
                          <span className="w-1.5 h-5 bg-teal-500 rounded-full"></span>
                          Block: {block}
                        </h3>

                        <div className="space-y-8">
                          {orderedHouseTypes.map(type => {
                            const typeResidents = blockResidents.filter(r => r.houseType === type);
                            if (typeResidents.length === 0) return null;
                            return (
                              <div key={`${campus}-${block}-${type}`} className="ml-2">
                                <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">
                                  {labels[type] || type}
                                </h4>
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
                                  <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                      <tr>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Resident Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">House Number</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Move-in Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                      {typeResidents.map((resident) => (
                                        <tr key={resident.id} className="hover:bg-blue-50/50 transition-colors">
                                          <td className="px-6 py-4 text-sm font-semibold text-gray-900">{resident.residentName}</td>
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
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            );
          })
        )}
      </div>
    </Layout>
  );
}