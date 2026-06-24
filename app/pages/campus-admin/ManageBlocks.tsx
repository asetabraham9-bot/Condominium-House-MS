import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { useData, House, Block } from '../../context/DataContext';
import Layout from '../../components/Layout';
import { Plus, Building2, Home, Edit2, Trash2, ChevronDown, ChevronUp, Check, X } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { API_BASE_URL } from '../../lib/apiBase';

const HOUSE_TYPE_LABEL: Record<string, string> = {
  studio: 'Studio',
  one_bedroom: 'One Bedroom',
  two_bedroom: 'Two Bedroom',
  three_bedroom: 'Three Bedroom',
};

export default function ManageBlocks() {
  const { user } = useAuth();
  const { blocks, houses, refreshData } = useData();
  const navigate = useNavigate();

  const [expandedBlockId, setExpandedBlockId] = useState<string | null>(null);

  // Modals state
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showHouseModal, setShowHouseModal] = useState(false);

  // Loading states
  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  // Form states
  const [blockData, setBlockData] = useState<Partial<Block>>({
    blockName: '',
    totalHouses: 0,
  });
  
  const [houseData, setHouseData] = useState<Partial<House>>({
    blockId: '',
    houseNumber: '',
    houseType: 'two_bedroom',
    bedrooms: 2,
    bathrooms: 1,
    monthlyPayment: 0,
    electricService: 'yes',
    waterService: 'yes',
  });

  useEffect(() => {
    if (!user || user.role !== 'campus_admin') {
      navigate('/login');
    }
  }, [user, navigate]);

  const openAddBlock = () => {
    setBlockData({ blockName: '', totalHouses: 15 });
    setShowBlockModal(true);
  };

  const openEditBlock = (block: Block) => {
    setBlockData(block);
    setShowBlockModal(true);
  };

  const openAddHouse = (blockId: string) => {
    setHouseData({
      blockId,
      houseNumber: '',
      houseType: 'two_bedroom',
      bedrooms: 2,
      bathrooms: 1,
      monthlyPayment: 0,
      electricService: 'yes',
      waterService: 'yes',
    });
    setShowHouseModal(true);
  };

  const openEditHouse = (house: House) => {
    setHouseData(house);
    setShowHouseModal(true);
  };

  const handleSaveBlock = async (e: FormEvent) => {
    e.preventDefault();
    if (!user?.campusId) {
      toast.error('Your account is missing a campus.');
      return;
    }
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
          campus_id: user.campusId,
          name: blockData.blockName?.trim(),
          total_houses: blockData.totalHouses,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Could not save block');
      
      await refreshData();
      toast.success(isEditing ? 'Block updated successfully' : 'Block created successfully');
      setShowBlockModal(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteBlock = async (blockId: string) => {
    if (!confirm('Are you sure you want to delete this block? This may delete all houses inside it.')) return;
    setIsDeletingId(blockId);
    try {
      const res = await fetch(`${API_BASE_URL}/blocks/delete.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: blockId }),
      });
      if (!res.ok) throw new Error('Could not delete block');
      await refreshData();
      toast.success('Block deleted');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleSaveHouse = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    const isEditing = !!houseData.id;
    const url = isEditing ? `${API_BASE_URL}/houses/update.php` : `${API_BASE_URL}/houses/create.php`;
    
    try {
      let res;
      if (isEditing) {
        // Update API accepts JSON
        res = await fetch(url, {
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
      } else {
        // Create API accepts FormData
        const fd = new FormData();
        fd.append('block_id', houseData.blockId || '');
        fd.append('house_number', houseData.houseNumber?.trim() || '');
        fd.append('house_type', HOUSE_TYPE_LABEL[houseData.houseType || 'studio']);
        fd.append('price', '0');
        fd.append('monthly_payment', String(houseData.monthlyPayment || 0));
        fd.append('bedrooms', String(houseData.bedrooms || 0));
        fd.append('bathrooms', String(houseData.bathrooms || 0));
        fd.append('electric_service', houseData.electricService || 'yes');
        fd.append('water_service', houseData.waterService || 'yes');

        res = await fetch(url, {
          method: 'POST',
          body: fd,
        });
      }

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Could not save house');
      
      await refreshData();
      toast.success(isEditing ? 'House updated successfully' : 'House added successfully');
      setShowHouseModal(false);
      setExpandedBlockId(houseData.blockId || null);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteHouse = async (houseId: string) => {
    if (!confirm('Are you sure you want to delete this house?')) return;
    setIsDeletingId(houseId);
    try {
      const res = await fetch(`${API_BASE_URL}/houses/delete.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: houseId }),
      });
      if (!res.ok) throw new Error('Could not delete house');
      await refreshData();
      toast.success('House deleted');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsDeletingId(null);
    }
  };

  return (
    <>
      <Toaster position="top-right" richColors />
      <Layout role="campus_admin">
        <div className="max-w-7xl mx-auto pb-12">
          
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 bg-gradient-to-r from-blue-900 to-indigo-800 p-8 rounded-2xl shadow-xl text-white">
            <div>
              <h1 className="text-4xl font-extrabold mb-2 tracking-tight">Manage Blocks</h1>
              <p className="text-blue-100 text-lg opacity-90">
                Oversee campus blocks and manage individual houses with ease.
              </p>
            </div>
            <button
              onClick={openAddBlock}
              className="mt-6 md:mt-0 flex items-center space-x-2 px-6 py-3 bg-white text-blue-900 rounded-full hover:bg-blue-50 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <Plus className="w-5 h-5" />
              <span>Add New Block</span>
            </button>
          </div>

          {/* Blocks Grid */}
          <div className="grid grid-cols-1 gap-6">
            {blocks.length === 0 && (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 shadow-sm">
                <Building2 className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-xl font-medium text-gray-900">No blocks found</h3>
                <p className="text-gray-500 mt-2">Get started by creating your first block.</p>
              </div>
            )}
            
            {blocks.map((block) => {
              const blockHouses = houses.filter((h) => h.blockId === block.id);
              const totalCount = blockHouses.length;
              const occupiedCount = blockHouses.filter((h) => h.status === 'occupied').length;
              const availableCount = blockHouses.filter((h) => h.status === 'available').length;
              const isExpanded = expandedBlockId === block.id;

              return (
                <div key={block.id} className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden transition-all duration-200 hover:shadow-lg">
                  <div 
                    className="p-6 cursor-pointer flex flex-col md:flex-row md:items-center justify-between group"
                    onClick={() => setExpandedBlockId(isExpanded ? null : block.id)}
                  >
                    <div className="flex items-center space-x-5">
                      <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-xl shadow-sm text-white transform group-hover:scale-105 transition-transform">
                        <Building2 className="w-8 h-8" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-1">{block.blockName}</h3>
                        <p className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full inline-block">
                          Campus: {block.campus}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 md:mt-0 flex items-center space-x-8">
                      <div className="flex space-x-6 text-center">
                        <div>
                          <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider mb-1">Total</p>
                          <p className="text-xl font-bold text-gray-900">{totalCount}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider mb-1">Occupied</p>
                          <p className="text-xl font-bold text-indigo-600">{occupiedCount}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider mb-1">Available</p>
                          <p className="text-xl font-bold text-emerald-500">{availableCount}</p>
                        </div>
                      </div>
                      
                      <div className="hidden md:flex items-center space-x-2 pl-6 border-l border-gray-100">
                        <button 
                          onClick={(e) => { e.stopPropagation(); openEditBlock(block); }}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Block"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteBlock(block.id); }}
                          disabled={isDeletingId === block.id}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Block"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                        <div className="p-2 text-gray-400">
                          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mobile Actions */}
                  <div className="md:hidden flex border-t border-gray-50">
                    <button onClick={(e) => { e.stopPropagation(); openEditBlock(block); }} className="flex-1 py-3 text-center text-gray-600 font-medium hover:bg-gray-50 flex justify-center items-center gap-2">
                      <Edit2 className="w-4 h-4" /> Edit
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteBlock(block.id); }} className="flex-1 py-3 text-center text-red-600 font-medium hover:bg-red-50 border-l border-gray-50 flex justify-center items-center gap-2">
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  </div>

                  {/* Expanded Houses Section */}
                  {isExpanded && (
                    <div className="bg-gray-50/80 border-t border-gray-100 p-6">
                      <div className="flex justify-between items-center mb-6">
                        <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                          <Home className="w-5 h-5 text-gray-500" />
                          Houses in {block.blockName}
                        </h4>
                        <button
                          onClick={() => openAddHouse(block.id)}
                          className="flex items-center space-x-1 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add House</span>
                        </button>
                      </div>

                      {blockHouses.length === 0 ? (
                        <p className="text-gray-500 text-center py-6 bg-white rounded-xl border border-dashed border-gray-300">No houses added to this block yet.</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                          {blockHouses.map(house => (
                            <div key={house.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-lg font-bold text-gray-900">#{house.houseNumber}</span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                      house.status === 'occupied' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                                    }`}>
                                      {house.status === 'occupied' ? 'Occupied' : 'Available'}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-600">{house.houseType ? HOUSE_TYPE_LABEL[house.houseType] : 'Studio'}</p>
                                </div>
                                <div className="flex gap-1">
                                  <button onClick={() => openEditHouse(house)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded-md hover:bg-blue-50 transition-colors">
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => handleDeleteHouse(house.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm text-gray-600 mt-4 bg-gray-50 p-3 rounded-lg">
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Bedrooms:</span>
                                  <span className="font-semibold text-gray-900">{house.bedrooms || 0}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Bathrooms:</span>
                                  <span className="font-semibold text-gray-900">{house.bathrooms || 0}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Rent:</span>
                                  <span className="font-semibold text-gray-900">ETB {house.monthlyPayment || 0}</span>
                                </div>
                                <div className="flex justify-between col-span-2 mt-1 pt-2 border-t border-gray-200">
                                  <div className="flex gap-4">
                                    <span className="flex items-center gap-1">
                                      {house.electricService === 'yes' ? <Check className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4 text-red-400" />} 
                                      <span className="text-xs font-medium">Power: {house.electricService}</span>
                                    </span>
                                    <span className="flex items-center gap-1">
                                      {house.waterService === 'yes' ? <Check className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4 text-red-400" />} 
                                      <span className="text-xs font-medium">Water: {house.waterService}</span>
                                    </span>
                                  </div>
                                </div>
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

          {/* Block Modal */}
          {showBlockModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="bg-gradient-to-r from-blue-900 to-indigo-800 p-6 text-white flex justify-between items-center">
                  <h2 className="text-2xl font-bold">{blockData.id ? 'Edit Block' : 'Add New Block'}</h2>
                  <button onClick={() => setShowBlockModal(false)} className="text-blue-100 hover:text-white transition-colors">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <form onSubmit={handleSaveBlock} className="p-6 space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Block Name *</label>
                    <input
                      type="text"
                      value={blockData.blockName || ''}
                      onChange={(e) => setBlockData({ ...blockData, blockName: e.target.value })}
                      required
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-gray-50 focus:bg-white"
                      placeholder="e.g. Block A"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Total Houses *</label>
                    <input
                      type="number"
                      value={blockData.totalHouses || ''}
                      onChange={(e) => setBlockData({ ...blockData, totalHouses: parseInt(e.target.value, 10) })}
                      required min="1"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-gray-50 focus:bg-white"
                    />
                  </div>
                  <div className="pt-4 flex gap-3">
                    <button type="button" onClick={() => setShowBlockModal(false)} className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors">
                      Cancel
                    </button>
                    <button type="submit" disabled={isSaving} className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 disabled:opacity-50 transition-all">
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
              <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-6 text-white flex justify-between items-center sticky top-0 z-10">
                  <h2 className="text-2xl font-bold">{houseData.id ? 'Edit House' : 'Add New House'}</h2>
                  <button onClick={() => setShowHouseModal(false)} className="text-indigo-100 hover:text-white transition-colors">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <form onSubmit={handleSaveHouse} className="p-6 space-y-5">
                  <div className="grid grid-cols-2 gap-5">
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-sm font-semibold text-gray-700 mb-1">House Number *</label>
                      <input
                        type="text"
                        value={houseData.houseNumber || ''}
                        onChange={(e) => setHouseData({ ...houseData, houseNumber: e.target.value })}
                        required
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-gray-50 focus:bg-white"
                        placeholder="e.g. 101"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-sm font-semibold text-gray-700 mb-1">House Type *</label>
                      <select
                        value={houseData.houseType || 'studio'}
                        onChange={(e) => setHouseData({ ...houseData, houseType: e.target.value as any })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-gray-50 focus:bg-white"
                      >
                        <option value="studio">Studio</option>
                        <option value="one_bedroom">One Bedroom</option>
                        <option value="two_bedroom">Two Bedroom</option>
                        <option value="three_bedroom">Three Bedroom</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Bedrooms</label>
                      <input
                        type="number"
                        value={houseData.bedrooms ?? 0}
                        onChange={(e) => setHouseData({ ...houseData, bedrooms: parseInt(e.target.value) })}
                        min="0"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-gray-50 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Bathrooms</label>
                      <input
                        type="number"
                        value={houseData.bathrooms ?? 0}
                        onChange={(e) => setHouseData({ ...houseData, bathrooms: parseInt(e.target.value) })}
                        min="0"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-gray-50 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Monthly Payment (ETB)</label>
                    <input
                      type="number"
                      value={houseData.monthlyPayment ?? 0}
                      onChange={(e) => setHouseData({ ...houseData, monthlyPayment: parseFloat(e.target.value) })}
                      min="0" step="0.01"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-gray-50 focus:bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-5 pt-2 pb-2">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Electric Service</label>
                      <select
                        value={houseData.electricService || 'yes'}
                        onChange={(e) => setHouseData({ ...houseData, electricService: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-gray-50 focus:bg-white"
                      >
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                        <option value="requires maintenance">Requires Maintenance</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Water Service</label>
                      <select
                        value={houseData.waterService || 'yes'}
                        onChange={(e) => setHouseData({ ...houseData, waterService: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-gray-50 focus:bg-white"
                      >
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                        <option value="requires maintenance">Requires Maintenance</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-4 flex gap-3 border-t border-gray-100">
                    <button type="button" onClick={() => setShowHouseModal(false)} className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors">
                      Cancel
                    </button>
                    <button type="submit" disabled={isSaving} className="flex-1 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 disabled:opacity-50 transition-all">
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
