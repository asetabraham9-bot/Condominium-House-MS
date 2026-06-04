import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { useData, Campus, Block, House } from '../../context/DataContext';
import Layout from '../../components/Layout';
import { Building2, Plus, Edit2, MapPin, CheckCircle2, XCircle } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { API_BASE_URL } from '../../lib/apiBase';

export default function ManageCampus() {
  const { user } = useAuth();
  const { campuses, blocks, houses, refreshData } = useData();
  const navigate = useNavigate();

  const [showCampusModal, setShowCampusModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [campusData, setCampusData] = useState<Partial<Campus> & { adminFirstName?: string, adminLastName?: string, adminEmail?: string, adminPassword?: string }>({});

  useEffect(() => {
    if (!user || user.role !== 'chms_admin') {
      navigate('/login');
    }
  }, [user, navigate]);

  const openAddCampus = () => {
    setCampusData({ name: '', location: '', adminFirstName: '', adminLastName: '', adminEmail: '', adminPassword: '' });
    setShowCampusModal(true);
  };
  const openEditCampus = (c: Campus) => {
    setCampusData(c);
    setShowCampusModal(true);
  };

  const handleSaveCampus = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const isEditing = !!campusData.id;
    const url = isEditing ? `${API_BASE_URL}/campuses/update.php` : `${API_BASE_URL}/campuses/create.php`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: campusData.id,
          campusName: campusData.name?.trim(),
          location: campusData.location?.trim(),
          adminFirstName: campusData.adminFirstName,
          adminLastName: campusData.adminLastName,
          adminEmail: campusData.adminEmail,
          adminPassword: campusData.adminPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Error saving campus');
      
      await refreshData();
      toast.success(data.message || 'Campus saved successfully');
      setShowCampusModal(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const computeCampusStats = (campusId: string) => {
    const campusBlocks = blocks.filter(b => b.campusId === campusId);
    const totalBlocks = campusBlocks.length;
    
    const stats: Record<string, { occupied: number; available: number }> = {
      studio: { occupied: 0, available: 0 },
      one_bedroom: { occupied: 0, available: 0 },
      two_bedroom: { occupied: 0, available: 0 },
      three_bedroom: { occupied: 0, available: 0 },
    };

    campusBlocks.forEach(block => {
      const blockHouses = houses.filter(h => h.blockId === block.id);
      blockHouses.forEach(h => {
        if (stats[h.houseType]) {
          if (h.status === 'available') {
            stats[h.houseType].available += 1;
          } else {
            stats[h.houseType].occupied += 1;
          }
        }
      });
    });

    return { totalBlocks, stats };
  };

  return (
    <>
      <Toaster position="top-right" />
      <Layout role="chms_admin">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Campuses</h1>
              <p className="text-gray-600">
                Register new campuses and view their blocks and houses details.
              </p>
            </div>
            <button
              onClick={openAddCampus}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center space-x-2 font-medium shadow-sm"
            >
              <Plus className="w-5 h-5" />
              <span>Register New Campus</span>
            </button>
          </div>

          {campuses.length === 0 ? (
            <div className="bg-white rounded-xl shadow border border-gray-100 p-12 text-center">
              <p className="text-gray-500">No campuses registered yet.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {campuses.map((campus) => {
                const { totalBlocks, stats } = computeCampusStats(campus.id);

                return (
                  <div key={campus.id} className="bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden hover:shadow-lg transition-shadow duration-300">
                    <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 p-6 text-white flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <div className="bg-white/10 p-3 rounded-xl backdrop-blur-md">
                          <MapPin className="w-6 h-6 text-indigo-300" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
                            {campus.name} Campus
                            <button
                              onClick={(e) => { e.stopPropagation(); openEditCampus(campus); }}
                              className="p-1 hover:bg-white/20 rounded transition text-indigo-200"
                              title="Edit Campus Details"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </h2>
                          <p className="text-xs text-indigo-200/80 mt-0.5 font-medium">{campus.location}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 bg-white/10 px-4 py-2.5 rounded-xl backdrop-blur-md border border-white/10">
                        <Building2 className="w-5 h-5 text-indigo-300" />
                        <span className="font-bold text-sm tracking-wide">{totalBlocks} Blocks Configured</span>
                      </div>
                    </div>
                    
                    <div className="p-6 bg-slate-50/30">
                      <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-ping" />
                        House Types Breakdown
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {['studio', 'one_bedroom', 'two_bedroom', 'three_bedroom'].map(type => {
                          const data = stats[type];
                          const label = type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
                          const total = data.available + data.occupied;
                          const occupancyRate = total > 0 ? (data.occupied / total) * 100 : 0;

                          return (
                            <div key={type} className="border border-slate-100 rounded-2xl p-5 bg-white hover:border-indigo-200 hover:shadow-md transition-all duration-300 group hover:-translate-y-0.5">
                              <h4 className="font-bold text-slate-800 text-sm mb-3 group-hover:text-indigo-600 transition-colors">{label}</h4>
                              <div className="space-y-2.5">
                                <div className="flex justify-between items-center text-xs">
                                  <span className="text-slate-500 flex items-center gap-1.5">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                    Available
                                  </span>
                                  <span className="font-bold text-slate-800">{data.available}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                  <span className="text-slate-500 flex items-center gap-1.5">
                                    <XCircle className="w-3.5 h-3.5 text-rose-500" />
                                    Occupied
                                  </span>
                                  <span className="font-bold text-slate-800">{data.occupied}</span>
                                </div>
                                <div className="pt-2.5 border-t border-slate-50">
                                  <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1.5">
                                    <span>OCCUPANCY</span>
                                    <span>{Math.round(occupancyRate)}%</span>
                                  </div>
                                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                    <div 
                                      className={`h-1.5 rounded-full ${occupancyRate > 90 ? 'bg-rose-500' : occupancyRate > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                                      style={{ width: `${occupancyRate}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Layout>

      {/* Campus Modal */}
      {showCampusModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 md:p-8 max-w-xl w-full shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-slate-900">
                {campusData.id ? 'Edit Campus Details' : 'Register New Campus'}
              </h3>
              <button
                onClick={() => setShowCampusModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-100 rounded-full"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSaveCampus} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Campus Name *</label>
                  <input
                    type="text"
                    required
                    value={campusData.name || ''}
                    onChange={(e) => setCampusData({ ...campusData, name: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
                    placeholder="e.g. Main Campus"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Location *</label>
                  <input
                    type="text"
                    required
                    value={campusData.location || ''}
                    onChange={(e) => setCampusData({ ...campusData, location: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
                    placeholder="e.g. Downtown Sector 4"
                  />
                </div>
              </div>

              {!campusData.id && (
                <div className="pt-6 border-t border-slate-100 space-y-4">
                  <h4 className="font-bold text-slate-800 flex items-center gap-2">
                    <span className="bg-indigo-100 text-indigo-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
                    Campus Admin Account Setup
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">First Name *</label>
                      <input
                        type="text"
                        required
                        value={campusData.adminFirstName || ''}
                        onChange={(e) => setCampusData({ ...campusData, adminFirstName: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Last Name *</label>
                      <input
                        type="text"
                        required
                        value={campusData.adminLastName || ''}
                        onChange={(e) => setCampusData({ ...campusData, adminLastName: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={campusData.adminEmail || ''}
                      onChange={(e) => setCampusData({ ...campusData, adminEmail: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Temporary Password *</label>
                    <input
                      type="password"
                      required
                      value={campusData.adminPassword || ''}
                      onChange={(e) => setCampusData({ ...campusData, adminPassword: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-6">
                <button
                  type="button"
                  onClick={() => setShowCampusModal(false)}
                  className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-sm transition-colors text-sm flex items-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Campus'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
