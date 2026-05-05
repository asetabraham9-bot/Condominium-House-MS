import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { useData, Campus, Block, House } from '../../context/DataContext';
import Layout from '../../components/Layout';
import { Building2, Plus, Edit2, Trash2, ChevronDown, ChevronUp, Home, Check, X, MapPin } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { API_BASE_URL } from '../../lib/apiBase';

const HOUSE_TYPE_LABEL: Record<string, string> = {
  studio: 'Studio',
  one_bedroom: 'One Bedroom',
  two_bedroom: 'Two Bedroom',
};

export default function ManageCampus() {
  const { user } = useAuth();
  const { campuses, blocks, houses, refreshData } = useData();
  const navigate = useNavigate();

  // Expansion states
  const [expandedCampusId, setExpandedCampusId] = useState<string | null>(null);
  const [expandedBlockId, setExpandedBlockId] = useState<string | null>(null);

  // Modal states
  const [showCampusModal, setShowCampusModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showHouseModal, setShowHouseModal] = useState(false);

  // Loading
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [campusData, setCampusData] = useState<Partial<Campus> & { adminFirstName?: string, adminLastName?: string, adminEmail?: string, adminPassword?: string }>({});
  const [blockData, setBlockData] = useState<Partial<Block>>({});
  const [houseData, setHouseData] = useState<Partial<House>>({});

  useEffect(() => {
    if (!user || user.role !== 'chms_admin') {
      navigate('/login');
    }
  }, [user, navigate]);

  // Modal Openers
  const openAddCampus = () => {
    setCampusData({ name: '', location: '', adminFirstName: '', adminLastName: '', adminEmail: '', adminPassword: '' });
    setShowCampusModal(true);
  };
  const openEditCampus = (c: Campus) => {
    setCampusData(c);
    setShowCampusModal(true);
  };

  const openAddBlock = (campusId: string) => {
    setBlockData({ campusId, blockName: '', totalHouses: 15 });
    setShowBlockModal(true);
  };
  const openEditBlock = (b: Block) => {
    setBlockData(b);
    setShowBlockModal(true);
  };

  const openAddHouse = (blockId: string) => {
    setHouseData({ blockId, houseNumber: '', houseType: 'two_bedroom', bedrooms: 2, bathrooms: 1, monthlyPayment: 0, electricService: true, waterService: true });
    setShowHouseModal(true);
  };
  const openEditHouse = (h: House) => {
    setHouseData(h);
    setShowHouseModal(true);
  };

  // Savers
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

  const handleSaveBlock = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const isEditing = !!blockData.id;
    const url = isEditing ? `${API_BASE_URL}/blocks/update.php` : `${API_BASE_URL}/blocks/create.php`;
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: blockData.id,
          campus_id: blockData.campusId,
          name: blockData.blockName?.trim(),
          total_houses: blockData.totalHouses,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Error saving block');
      
      await refreshData();
      toast.success('Block saved successfully');
      setShowBlockModal(false);
      setExpandedCampusId(blockData.campusId || null);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveHouse = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const isEditing = !!houseData.id;
    const url = isEditing ? `${API_BASE_URL}/houses/update.php` : `${API_BASE_URL}/houses/create.php`;

    try {
      if (isEditing) {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: houseData.id,
            houseNumber: houseData.houseNumber?.trim(),
            houseType: HOUSE_TYPE_LABEL[houseData.houseType || 'studio'],
            monthlyPayment: houseData.monthlyPayment,
            bedrooms: houseData.bedrooms,
            bathrooms: houseData.bathrooms,
            electricService: houseData.electricService,
            waterService: houseData.waterService,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message);
      } else {
        const fd = new FormData();
        fd.append('block_id', houseData.blockId || '');
        fd.append('house_number', houseData.houseNumber?.trim() || '');
        fd.append('house_type', HOUSE_TYPE_LABEL[houseData.houseType || 'studio']);
        fd.append('price', '0');
        fd.append('monthly_payment', String(houseData.monthlyPayment || 0));
        fd.append('bedrooms', String(houseData.bedrooms || 0));
        fd.append('bathrooms', String(houseData.bathrooms || 0));
        fd.append('electric_service', houseData.electricService ? 'true' : 'false');
        fd.append('water_service', houseData.waterService ? 'true' : 'false');

        const res = await fetch(url, { method: 'POST', body: fd });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message);
      }
      
      await refreshData();
      toast.success('House saved successfully');
      setShowHouseModal(false);
      setExpandedBlockId(houseData.blockId || null);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Deleters
  const handleDeleteCampus = async (id: string) => {
    // Currently, there might not be a delete campus endpoint, 
    // but assuming there is or will be.
    toast.error('Deleting campuses requires direct database access to prevent mass data loss.');
  };

  const handleDeleteBlock = async (id: string) => {
    if (!confirm('Delete this block and all its houses?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/blocks/delete.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error('Could not delete block');
      await refreshData();
      toast.success('Block deleted');
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDeleteHouse = async (id: string) => {
    if (!confirm('Delete this house?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/houses/delete.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error('Could not delete house');
      await refreshData();
      toast.success('House deleted');
    } catch (err: any) { toast.error(err.message); }
  };

  return (
    <>
      <Toaster position="top-right" richColors />
      <Layout role="chms_admin">
        <div className="max-w-7xl mx-auto pb-12">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 bg-gradient-to-r from-emerald-800 to-teal-900 p-8 rounded-2xl shadow-xl text-white">
            <div>
              <h1 className="text-4xl font-extrabold mb-2 tracking-tight">System Admin Hub</h1>
              <p className="text-emerald-100 text-lg opacity-90">
                Manage all university campuses, blocks, and housing properties.
              </p>
            </div>
            <button
              onClick={openAddCampus}
              className="mt-6 md:mt-0 flex items-center space-x-2 px-6 py-3 bg-white text-emerald-900 rounded-full hover:bg-emerald-50 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <Plus className="w-5 h-5" />
              <span>Register Campus</span>
            </button>
          </div>

          {/* Campuses List */}
          <div className="space-y-6">
            {campuses.map(campus => {
              const campusBlocks = blocks.filter(b => b.campusId === campus.id || b.campus === campus.name);
              const isCampusExpanded = expandedCampusId === campus.id;

              return (
                <div key={campus.id} className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden transition-all duration-300">
                  {/* Campus Header */}
                  <div 
                    className="p-6 cursor-pointer flex flex-col md:flex-row md:items-center justify-between group hover:bg-gray-50/50"
                    onClick={() => setExpandedCampusId(isCampusExpanded ? null : campus.id)}
                  >
                    <div className="flex items-center space-x-5">
                      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-4 rounded-xl shadow-sm text-white transform group-hover:scale-105 transition-transform">
                        <MapPin className="w-8 h-8" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">{campus.name} Campus</h2>
                        <p className="text-sm font-medium text-gray-500 mt-1">{campus.location}</p>
                      </div>
                    </div>

                    <div className="mt-4 md:mt-0 flex items-center space-x-6">
                      <div className="text-center">
                        <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider mb-1">Total Blocks</p>
                        <p className="text-xl font-bold text-gray-900">{campusBlocks.length}</p>
                      </div>
                      <div className="flex items-center space-x-2 pl-6 border-l border-gray-200">
                        <button onClick={(e) => { e.stopPropagation(); openEditCampus(campus); }} className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg">
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <div className="p-2 text-gray-400">
                          {isCampusExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Blocks Section (Nested) */}
                  {isCampusExpanded && (
                    <div className="bg-gray-50 border-t border-gray-100 p-6 md:p-8">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                          <Building2 className="w-6 h-6 text-emerald-600" />
                          Blocks in {campus.name}
                        </h3>
                        <button
                          onClick={() => openAddBlock(campus.id)}
                          className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm font-medium"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add Block</span>
                        </button>
                      </div>

                      {campusBlocks.length === 0 ? (
                        <p className="text-center text-gray-500 py-8 bg-white rounded-xl border border-dashed border-gray-300">No blocks configured for this campus yet.</p>
                      ) : (
                        <div className="space-y-4">
                          {campusBlocks.map(block => {
                            const blockHouses = houses.filter(h => h.blockId === block.id);
                            const occupiedCount = blockHouses.filter(h => h.status === 'occupied').length;
                            const isBlockExpanded = expandedBlockId === block.id;

                            return (
                              <div key={block.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                <div 
                                  className="p-5 cursor-pointer flex flex-col md:flex-row md:items-center justify-between hover:bg-gray-50/80 transition-colors"
                                  onClick={() => setExpandedBlockId(isBlockExpanded ? null : block.id)}
                                >
                                  <div className="flex items-center space-x-4">
                                    <div className="bg-blue-100 p-2.5 rounded-lg text-blue-600">
                                      <Building2 className="w-5 h-5" />
                                    </div>
                                    <h4 className="text-lg font-bold text-gray-900">{block.blockName}</h4>
                                  </div>

                                  <div className="mt-4 md:mt-0 flex items-center space-x-6">
                                    <div className="flex space-x-4 text-center text-sm">
                                      <div><span className="text-gray-500">Total:</span> <span className="font-bold">{block.totalHouses}</span></div>
                                      <div><span className="text-gray-500">Occ:</span> <span className="font-bold text-indigo-600">{occupiedCount}</span></div>
                                      <div><span className="text-gray-500">Avail:</span> <span className="font-bold text-emerald-500">{block.totalHouses - occupiedCount}</span></div>
                                    </div>
                                    <div className="flex items-center space-x-1 pl-4 border-l border-gray-200">
                                      <button onClick={(e) => { e.stopPropagation(); openEditBlock(block); }} className="p-1.5 text-gray-400 hover:text-blue-600 rounded">
                                        <Edit2 className="w-4 h-4" />
                                      </button>
                                      <button onClick={(e) => { e.stopPropagation(); handleDeleteBlock(block.id); }} className="p-1.5 text-gray-400 hover:text-red-600 rounded">
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                      <div className="p-1.5 text-gray-400">
                                        {isBlockExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Houses Section (Double Nested) */}
                                {isBlockExpanded && (
                                  <div className="bg-slate-50 border-t border-slate-200 p-5">
                                    <div className="flex justify-between items-center mb-4">
                                      <h5 className="font-semibold text-slate-800 flex items-center gap-2">
                                        <Home className="w-4 h-4 text-slate-500" /> Houses
                                      </h5>
                                      <button onClick={() => openAddHouse(block.id)} className="text-sm bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded-md hover:bg-slate-100 font-medium flex items-center gap-1 shadow-sm">
                                        <Plus className="w-3.5 h-3.5" /> Add House
                                      </button>
                                    </div>

                                    {blockHouses.length === 0 ? (
                                      <p className="text-slate-500 text-sm text-center py-4 bg-white rounded-lg border border-dashed border-slate-300">No houses in this block.</p>
                                    ) : (
                                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                        {blockHouses.map(house => (
                                          <div key={house.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm relative group">
                                            <div className="flex justify-between items-start mb-2">
                                              <span className="font-bold text-slate-900 text-lg">#{house.houseNumber}</span>
                                              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex bg-white shadow-sm rounded-md border border-slate-100">
                                                <button onClick={() => openEditHouse(house)} className="p-1.5 text-slate-400 hover:text-blue-600"><Edit2 className="w-3.5 h-3.5" /></button>
                                                <button onClick={() => handleDeleteHouse(house.id)} className="p-1.5 text-slate-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                                              </div>
                                            </div>
                                            <div className="space-y-1 mb-2">
                                              <p className="text-xs text-slate-500">{house.houseType ? HOUSE_TYPE_LABEL[house.houseType] : 'Studio'}</p>
                                              <p className="text-xs text-slate-500">{house.bedrooms || 0} Bed, {house.bathrooms || 0} Bath</p>
                                            </div>
                                            <div className="flex justify-between items-center pt-2 border-t border-slate-100 mt-2">
                                              <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${
                                                house.status === 'occupied' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                                              }`}>
                                                {house.status}
                                              </span>
                                              <span className="text-sm font-semibold text-slate-800">ETB {house.monthlyPayment || 0}</span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Campus Modal */}
          {showCampusModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in duration-200 max-h-[90vh] overflow-y-auto">
                <div className="bg-gradient-to-r from-emerald-800 to-teal-700 p-6 text-white flex justify-between items-center sticky top-0 z-10">
                  <h2 className="text-2xl font-bold">{campusData.id ? 'Edit Campus' : 'Register New Campus'}</h2>
                  <button onClick={() => setShowCampusModal(false)} className="text-emerald-100 hover:text-white"><X className="w-6 h-6" /></button>
                </div>
                <form onSubmit={handleSaveCampus} className="p-6 space-y-5">
                  <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl border border-emerald-100 mb-6">
                    <h3 className="font-bold mb-1">Campus Details</h3>
                    <p className="text-xs opacity-80">Define the core information for this university campus.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Campus Name *</label>
                    <input type="text" required value={campusData.name || ''} onChange={e => setCampusData({...campusData, name: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-gray-50 focus:bg-white transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Location *</label>
                    <input type="text" required value={campusData.location || ''} onChange={e => setCampusData({...campusData, location: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-gray-50 focus:bg-white transition-colors" />
                  </div>

                  {!campusData.id && (
                    <>
                      <div className="bg-indigo-50 text-indigo-800 p-4 rounded-xl border border-indigo-100 mt-6 mb-2">
                        <h3 className="font-bold mb-1">Campus Admin Account (Optional)</h3>
                        <p className="text-xs opacity-80">Create an administrative account to manage this campus.</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">First Name</label>
                          <input type="text" value={campusData.adminFirstName || ''} onChange={e => setCampusData({...campusData, adminFirstName: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-gray-50 focus:bg-white" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Last Name</label>
                          <input type="text" value={campusData.adminLastName || ''} onChange={e => setCampusData({...campusData, adminLastName: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-gray-50 focus:bg-white" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Admin Email</label>
                        <input type="email" value={campusData.adminEmail || ''} onChange={e => setCampusData({...campusData, adminEmail: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-gray-50 focus:bg-white" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Admin Password</label>
                        <input type="password" value={campusData.adminPassword || ''} onChange={e => setCampusData({...campusData, adminPassword: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-gray-50 focus:bg-white" />
                      </div>
                    </>
                  )}

                  <div className="pt-4 flex gap-3 border-t border-gray-100">
                    <button type="button" onClick={() => setShowCampusModal(false)} className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200">Cancel</button>
                    <button type="submit" disabled={isSaving} className="flex-1 px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-200 disabled:opacity-50">
                      {isSaving ? 'Saving...' : 'Save Campus'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Block Modal */}
          {showBlockModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in duration-200">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white flex justify-between items-center">
                  <h2 className="text-2xl font-bold">{blockData.id ? 'Edit Block' : 'Add New Block'}</h2>
                  <button onClick={() => setShowBlockModal(false)} className="text-blue-100 hover:text-white"><X className="w-6 h-6" /></button>
                </div>
                <form onSubmit={handleSaveBlock} className="p-6 space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Block Name *</label>
                    <input type="text" required value={blockData.blockName || ''} onChange={e => setBlockData({...blockData, blockName: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Total Houses *</label>
                    <input type="number" required min="1" value={blockData.totalHouses || ''} onChange={e => setBlockData({...blockData, totalHouses: parseInt(e.target.value)})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white" />
                  </div>
                  <div className="pt-4 flex gap-3">
                    <button type="button" onClick={() => setShowBlockModal(false)} className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200">Cancel</button>
                    <button type="submit" disabled={isSaving} className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 disabled:opacity-50">
                      {isSaving ? 'Saving...' : 'Save Block'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* House Modal */}
          {showHouseModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in duration-200 max-h-[90vh] overflow-y-auto">
                <div className="bg-gradient-to-r from-slate-700 to-slate-900 p-6 text-white flex justify-between items-center sticky top-0 z-10">
                  <h2 className="text-2xl font-bold">{houseData.id ? 'Edit House' : 'Add New House'}</h2>
                  <button onClick={() => setShowHouseModal(false)} className="text-slate-300 hover:text-white"><X className="w-6 h-6" /></button>
                </div>
                <form onSubmit={handleSaveHouse} className="p-6 space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-sm font-semibold text-gray-700 mb-1">House Number *</label>
                      <input type="text" required value={houseData.houseNumber || ''} onChange={e => setHouseData({...houseData, houseNumber: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-500 bg-gray-50" />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-sm font-semibold text-gray-700 mb-1">House Type *</label>
                      <select value={houseData.houseType || 'studio'} onChange={e => setHouseData({...houseData, houseType: e.target.value as any})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-500 bg-gray-50">
                        <option value="studio">Studio</option>
                        <option value="one_bedroom">One Bedroom</option>
                        <option value="two_bedroom">Two Bedroom</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Bedrooms</label>
                      <input type="number" min="0" value={houseData.bedrooms ?? 0} onChange={e => setHouseData({...houseData, bedrooms: parseInt(e.target.value)})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-500 bg-gray-50" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Bathrooms</label>
                      <input type="number" min="0" value={houseData.bathrooms ?? 0} onChange={e => setHouseData({...houseData, bathrooms: parseInt(e.target.value)})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-500 bg-gray-50" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Monthly Payment (ETB)</label>
                    <input type="number" min="0" step="0.01" value={houseData.monthlyPayment ?? 0} onChange={e => setHouseData({...houseData, monthlyPayment: parseFloat(e.target.value)})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-500 bg-gray-50" />
                  </div>
                  <div className="flex gap-6 pt-2 pb-2 bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input type="checkbox" checked={!!houseData.electricService} onChange={e => setHouseData({...houseData, electricService: e.target.checked})} className="w-5 h-5 text-slate-800 rounded border-gray-300 focus:ring-slate-500" />
                      <span className="text-sm font-medium text-gray-800">Electric Service</span>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input type="checkbox" checked={!!houseData.waterService} onChange={e => setHouseData({...houseData, waterService: e.target.checked})} className="w-5 h-5 text-slate-800 rounded border-gray-300 focus:ring-slate-500" />
                      <span className="text-sm font-medium text-gray-800">Water Service</span>
                    </label>
                  </div>
                  <div className="pt-4 flex gap-3 border-t border-gray-100">
                    <button type="button" onClick={() => setShowHouseModal(false)} className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200">Cancel</button>
                    <button type="submit" disabled={isSaving} className="flex-1 px-6 py-3 bg-slate-800 text-white font-semibold rounded-xl hover:bg-slate-900 shadow-lg shadow-slate-200 disabled:opacity-50">
                      {isSaving ? 'Saving...' : 'Save House'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      </Layout>
    </>
  );
}
