import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { useData, type House } from '../../context/DataContext';
import Layout from '../../components/Layout';
import { Home, Layers, Rocket, Calendar, X, Lock, Unlock, Plus, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from 'sonner';
import { API_BASE_URL } from '../../lib/apiBase';

type CampusRow = { id: string; name: string };

type SelectedHouse = {
  id: string;
  houseNumber: string;
  houseType: string;
  blockName?: string;
  campusId: string;
  campusName: string;
  monthlyPayment: number;
  bedrooms?: number;
  bathrooms?: number;
  electricService?: string;
  waterService?: string;
};

function formatHouseTypeLabel(type: string): string {
  return type.replace(/_/g, ' ');
}

function toSelectedHouse(house: House): SelectedHouse {
  return {
    id: house.id,
    houseNumber: house.houseNumber,
    houseType: formatHouseTypeLabel(house.houseType),
    blockName: house.blockName,
    campusId: house.campusId ?? '',
    campusName: house.campusName ?? '—',
    monthlyPayment: Number(house.monthlyPayment ?? 0),
    bedrooms: house.bedrooms,
    bathrooms: house.bathrooms,
    electricService: house.electricService,
    waterService: house.waterService,
  };
}

export default function LaunchCycle() {
  const { user } = useAuth();
  const { houses, housingCycles, refreshData } = useData();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [campuses, setCampuses] = useState<CampusRow[]>([]);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const [selectedHouses, setSelectedHouses] = useState<SelectedHouse[]>([]);
  const [showHousePicker, setShowHousePicker] = useState(false);
  const [campusFilter, setCampusFilter] = useState('');
  const [houseSearch, setHouseSearch] = useState('');
  const [pickerCheckedIds, setPickerCheckedIds] = useState<string[]>([]);

  const [form, setForm] = useState({
    title: '',
    roundLabel: '',
    description: '',
    houseDetails: '',
    applicationFee: '',
    electricityService: 'yes',
    waterService: 'yes',
    deadline: '',
  });

  useEffect(() => {
    if (!user || user.role !== 'chms_admin') {
      navigate('/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/campuses/read.php`);
        const data = (await res.json()) as { records?: CampusRow[] };
        if (!cancelled && data.records) {
          setCampuses(data.records.map((r) => ({ id: String(r.id), name: r.name })));
        }
      } catch {
        if (!cancelled) setCampuses([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedHouseIds = new Set(selectedHouses.map((h) => h.id));

  const pickerHouses = houses
    .filter((h) => h.status === 'available' && !selectedHouseIds.has(h.id))
    .filter((h) => !campusFilter || h.campusId === campusFilter)
    .filter((h) => {
      if (!houseSearch.trim()) return true;
      const q = houseSearch.trim().toLowerCase();
      return (
        h.houseNumber.toLowerCase().includes(q) ||
        (h.blockName ?? '').toLowerCase().includes(q) ||
        formatHouseTypeLabel(h.houseType).toLowerCase().includes(q) ||
        (h.campusName ?? '').toLowerCase().includes(q)
      );
    });

  // Update house overview automatically when selected houses change
  useEffect(() => {
    if (selectedHouses.length === 0) {
      setForm((prev) => ({ ...prev, houseDetails: '' }));
      return;
    }

    const grouped = selectedHouses.reduce<Record<string, { label: string; count: number }>>((acc, house) => {
      const key = `${house.houseType}|${house.campusId}|${house.monthlyPayment}`;
      if (!acc[key]) {
        acc[key] = {
          label: `${house.houseType} (${house.campusName}): ${house.monthlyPayment.toLocaleString()} ETB/month`,
          count: 0,
        };
      }
      acc[key].count += 1;
      return acc;
    }, {});

    const breakdown = Object.values(grouped)
      .map((group) => `• ${group.label} — ${group.count} unit(s)`)
      .join('\n');

    const unitLines = selectedHouses
      .map(
        (house) =>
          `• ${house.blockName ?? 'Block'} #${house.houseNumber} — ${house.houseType} (${house.campusName}) @ ${house.monthlyPayment.toLocaleString()} ETB/month | Beds: ${house.bedrooms ?? 0} | Baths: ${house.bathrooms ?? 0} | Power: ${house.electricService ?? '—'} | Water: ${house.waterService ?? '—'}`
      )
      .join('\n');

    const autoSummary = `Total units launched: ${selectedHouses.length}\nBreakdown:\n${breakdown}\n\nSelected houses:\n${unitLines}`;
    setForm((prev) => ({ ...prev, houseDetails: autoSummary }));
  }, [selectedHouses]);

  const togglePickerHouse = (houseId: string) => {
    setPickerCheckedIds((prev) =>
      prev.includes(houseId) ? prev.filter((id) => id !== houseId) : [...prev, houseId]
    );
  };

  const handleAddSelectedHouses = () => {
    if (pickerCheckedIds.length === 0) {
      toast.error('Select at least one available house');
      return;
    }

    const toAdd = houses
      .filter((h) => pickerCheckedIds.includes(h.id))
      .map(toSelectedHouse);

    setSelectedHouses((prev) => [...prev, ...toAdd]);
    setPickerCheckedIds([]);
    setShowHousePicker(false);
    toast.success(`Added ${toAdd.length} house(s) to this cycle.`);
  };

  const handleRemoveSelectedHouse = (houseId: string) => {
    setSelectedHouses((prev) => prev.filter((house) => house.id !== houseId));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Application cycle title is required');
      return;
    }
    if (!form.deadline.trim()) {
      toast.error('Application deadline is required');
      return;
    }
    if (selectedHouses.length === 0) {
      toast.error('Select at least one available house to launch this cycle');
      return;
    }
    if (!user?.id) {
      toast.error('You must be signed in');
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title.trim());
      if (form.roundLabel.trim()) fd.append('roundLabel', form.roundLabel.trim());
      fd.append('description', form.description.trim());
      if (form.houseDetails.trim()) fd.append('houseDetails', form.houseDetails.trim());
      if (form.applicationFee) fd.append('applicationFee', form.applicationFee);
      fd.append('electricityService', form.electricityService);
      fd.append('waterService', form.waterService);
      fd.append('deadline', form.deadline);
      fd.append('launchedBy', user.id);
      fd.append('selectedHouseIds', JSON.stringify(selectedHouses.map((house) => house.id)));

      const res = await fetch(`${API_BASE_URL}/applications/launch.php`, {
        method: 'POST',
        body: fd,
      });
      const data = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) {
        toast.error(data.message ?? 'Launch failed');
        return;
      }
      await refreshData();
      toast.success(data.message ?? 'Application cycle launched successfully. Any previous open cycles were closed.');
      setForm({
        title: '',
        roundLabel: '',
        description: '',
        houseDetails: '',
        applicationFee: '',
        electricityService: 'yes',
        waterService: 'yes',
        deadline: '',
      });
      setSelectedHouses([]);
      setPickerCheckedIds([]);
      setShowHousePicker(false);
    } catch {
      toast.error('Network error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleCycleStatus = async (cycleId: string, currentStatus: 'open' | 'closed') => {
    setTogglingId(cycleId);
    const nextStatus = currentStatus === 'open' ? 'closed' : 'open';
    try {
      const res = await fetch(`${API_BASE_URL}/applications/toggle_cycle.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: cycleId, status: nextStatus }),
      });
      const data = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) {
        toast.error(data.message ?? 'Failed to update status');
        return;
      }
      await refreshData();
      toast.success(data.message ?? `Cycle status updated to ${nextStatus}.`);
    } catch {
      toast.error('Network error updating cycle status');
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <>
      <Toaster position="top-right" />
      <Layout role="chms_admin">
        <div className="max-w-6xl space-y-12">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 mb-2 flex items-center gap-2">
              <Rocket className="w-8 h-8 text-indigo-600 animate-pulse" />
              Launch Application Cycle
            </h1>
            <p className="text-slate-600 max-w-3xl leading-relaxed">
              Configure the application round and select actual available houses from inventory. Rent, utilities, and other attributes are taken from each house record automatically.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Round Details */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-4 text-white flex items-center gap-2">
                <Layers className="w-5 h-5 opacity-90" />
                <h2 className="text-lg font-semibold">Application Details</h2>
              </div>
              <div className="p-6 md:p-8 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5 font-semibold">
                      Application Cycle Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="title"
                      value={form.title}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g. 2026 Academic Year Housing"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5 font-semibold">
                      Round Label (optional)
                    </label>
                    <input
                      name="roundLabel"
                      value={form.roundLabel}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g. Round 1 · Block A"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5 font-semibold">
                    Application Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    required
                    rows={3}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Who can apply, required documents, and key dates..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5 font-semibold">
                      Application Fee (ETB)
                    </label>
                    <input
                      name="applicationFee"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.applicationFee}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                      placeholder="e.g. 150"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1.5 font-semibold">
                      Application Deadline <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="deadline"
                      type="datetime-local"
                      value={form.deadline}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 max-w-md"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* House Configurator */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-teal-600 to-emerald-600 px-6 py-4 text-white flex items-center gap-2">
                <Home className="w-5 h-5 opacity-90" />
                <h2 className="text-lg font-semibold">House Setup & Configuration</h2>
              </div>
              <div className="p-6 md:p-8 space-y-6">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-slate-800 text-sm uppercase tracking-wide">
                        Select Houses From Inventory
                      </h3>
                      <p className="text-sm text-slate-600 mt-1">
                        Choose from available houses in the database. Monthly rent, power, and water come from each house record.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowHousePicker(true)}
                      className="px-5 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-semibold text-sm flex items-center gap-1.5 shadow-sm transition-colors"
                    >
                      <Plus className="w-4 h-4" /> Browse Available Houses
                    </button>
                  </div>
                  <p className="text-xs text-slate-500">
                    {houses.filter((h) => h.status === 'available').length} available house(s) in inventory ·{' '}
                    {selectedHouses.length} selected for this cycle
                  </p>
                </div>

                {selectedHouses.length > 0 ? (
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase text-xs">
                        <tr>
                          <th className="px-4 py-3">House</th>
                          <th className="px-4 py-3">Type</th>
                          <th className="px-4 py-3">Campus</th>
                          <th className="px-4 py-3 text-right">Rent</th>
                          <th className="px-4 py-3">Beds/Baths</th>
                          <th className="px-4 py-3">Power</th>
                          <th className="px-4 py-3">Water</th>
                          <th className="px-4 py-3 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {selectedHouses.map((house) => (
                          <tr key={house.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 font-medium text-slate-900">
                              {house.blockName ? `${house.blockName} · ` : ''}#{house.houseNumber}
                            </td>
                            <td className="px-4 py-3 text-slate-700">{house.houseType}</td>
                            <td className="px-4 py-3 text-slate-600">{house.campusName}</td>
                            <td className="px-4 py-3 text-right font-bold text-slate-950">
                              {house.monthlyPayment.toLocaleString()} ETB
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {house.bedrooms ?? 0} / {house.bathrooms ?? 0}
                            </td>
                            <td className="px-4 py-3 text-slate-600">{house.electricService ?? '—'}</td>
                            <td className="px-4 py-3 text-slate-600">{house.waterService ?? '—'}</td>
                            <td className="px-4 py-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveSelectedHouse(house.id)}
                                className="text-red-500 hover:text-red-700 p-1"
                                title="Remove from cycle"
                              >
                                <Trash2 className="w-4 h-4 inline" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-6 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                    No houses selected yet. Browse available houses and add them to this cycle.
                  </div>
                )}

                {/* House Overview (notes) */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    House Overview (Generated Notes for Applicants)
                  </label>
                  <textarea
                    name="houseDetails"
                    value={form.houseDetails}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 bg-slate-50 font-mono text-sm"
                    placeholder="This will contain a summary of your configurations automatically, but you can edit or add custom remarks."
                  />
                </div>

                {/* Utilities */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5 font-semibold">
                      Electricity Service
                    </label>
                    <select
                      name="electricityService"
                      value={form.electricityService}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="yes">Yes (Included/Available)</option>
                      <option value="no">No</option>
                      <option value="maintenance">Maintenance Required</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5 font-semibold">Water Service</label>
                    <select
                      name="waterService"
                      value={form.waterService}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="yes">Yes (Included/Available)</option>
                      <option value="no">No</option>
                      <option value="maintenance">Maintenance Required</option>
                    </select>
                  </div>
                </div>


              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-10 py-3.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Launching…' : 'Launch Open Cycle'}
              </button>
            </div>
          </form>

          {showHousePicker && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Available Houses</h3>
                    <p className="text-sm text-slate-600">
                      Select one or more available houses to include in this application cycle.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowHousePicker(false);
                      setPickerCheckedIds([]);
                    }}
                    className="p-2 rounded-lg hover:bg-slate-200 text-slate-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="px-6 py-4 border-b border-slate-100 flex flex-col md:flex-row gap-3">
                  <div className="flex-1 relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={houseSearch}
                      onChange={(e) => setHouseSearch(e.target.value)}
                      placeholder="Search by house number, block, type, or campus..."
                      className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-sm"
                    />
                  </div>
                  <select
                    value={campusFilter}
                    onChange={(e) => setCampusFilter(e.target.value)}
                    className="md:w-64 px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-teal-500 text-sm"
                  >
                    <option value="">All campuses</option>
                    {campuses.map((campus) => (
                      <option key={campus.id} value={campus.id}>
                        {campus.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="overflow-auto flex-1">
                  {pickerHouses.length > 0 ? (
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase text-xs sticky top-0">
                        <tr>
                          <th className="px-4 py-3 w-12">
                            <input
                              type="checkbox"
                              checked={
                                pickerHouses.length > 0 &&
                                pickerHouses.every((house) => pickerCheckedIds.includes(house.id))
                              }
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setPickerCheckedIds(pickerHouses.map((house) => house.id));
                                } else {
                                  setPickerCheckedIds([]);
                                }
                              }}
                              className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                            />
                          </th>
                          <th className="px-4 py-3">House</th>
                          <th className="px-4 py-3">Type</th>
                          <th className="px-4 py-3">Campus</th>
                          <th className="px-4 py-3 text-right">Rent</th>
                          <th className="px-4 py-3">Beds/Baths</th>
                          <th className="px-4 py-3">Power</th>
                          <th className="px-4 py-3">Water</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {pickerHouses.map((house) => (
                          <tr key={house.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3">
                              <input
                                type="checkbox"
                                checked={pickerCheckedIds.includes(house.id)}
                                onChange={() => togglePickerHouse(house.id)}
                                className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                              />
                            </td>
                            <td className="px-4 py-3 font-medium text-slate-900">
                              {house.blockName ? `${house.blockName} · ` : ''}#{house.houseNumber}
                            </td>
                            <td className="px-4 py-3 text-slate-700">{formatHouseTypeLabel(house.houseType)}</td>
                            <td className="px-4 py-3 text-slate-600">{house.campusName ?? '—'}</td>
                            <td className="px-4 py-3 text-right font-semibold text-slate-900">
                              {Number(house.monthlyPayment ?? 0).toLocaleString()} ETB
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {house.bedrooms ?? 0} / {house.bathrooms ?? 0}
                            </td>
                            <td className="px-4 py-3 text-slate-600">{house.electricService ?? '—'}</td>
                            <td className="px-4 py-3 text-slate-600">{house.waterService ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-center py-16 text-slate-500">
                      No available houses match your filters, or all matching houses are already selected.
                    </div>
                  )}
                </div>

                <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
                  <p className="text-sm text-slate-600">
                    {pickerCheckedIds.length} house(s) selected
                  </p>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowHousePicker(false);
                        setPickerCheckedIds([]);
                      }}
                      className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAddSelectedHouses}
                      disabled={pickerCheckedIds.length === 0}
                      className="px-5 py-2 rounded-lg bg-teal-600 text-white font-semibold hover:bg-teal-700 disabled:opacity-50"
                    >
                      Add Selected Houses
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Cycles Control List */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-slate-700 to-slate-900 px-6 py-4 text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 opacity-90" />
              <h2 className="text-lg font-semibold">Active & Past Application Cycles</h2>
            </div>
            <div className="p-6 space-y-4">
              {housingCycles.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {housingCycles.map((cycle) => {
                    const isDeadlineReached = cycle.deadline
                      ? new Date(cycle.deadline).getTime() < Date.now()
                      : false;
                    const isOpen = cycle.status === 'open';

                    return (
                      <div key={cycle.id} className="py-4 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-900 text-base">{cycle.title || 'Housing Cycle'}</h3>
                            {cycle.roundLabel && (
                              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                                {cycle.roundLabel}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            Deadline: {cycle.deadline ? new Date(cycle.deadline).toLocaleString() : 'No deadline'}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2 text-xs">
                            {cycle.houseConfigurations && cycle.houseConfigurations.length > 0 ? (
                              cycle.houseConfigurations.map((hc, idx) => (
                                <span key={idx} className="bg-teal-50 text-teal-800 px-2 py-0.5 border border-teal-100 rounded">
                                  {hc.houseType} ({hc.campusName}): {hc.numberOfHouses} houses
                                </span>
                              ))
                            ) : (
                              <span className="bg-slate-50 text-slate-500 px-2 py-0.5 rounded italic">
                                {cycle.houseType} ({cycle.campusName})
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {/* Status Badge */}
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 ${
                              isOpen
                                ? isDeadlineReached
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {isOpen ? (
                              <>
                                <Unlock className="w-3.5 h-3.5" />
                                {isDeadlineReached ? 'Open (Deadline Reached)' : 'Open'}
                              </>
                            ) : (
                              <>
                                <Lock className="w-3.5 h-3.5" />
                                Closed
                              </>
                            )}
                          </span>

                          {/* Action Button */}
                          <button
                            type="button"
                            disabled={isDeadlineReached || togglingId === cycle.id}
                            onClick={() => handleToggleCycleStatus(cycle.id, cycle.status)}
                            className={`px-4 py-1.5 rounded-lg font-semibold text-xs transition-all shadow-sm flex items-center gap-1 ${
                              isOpen
                                ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                                : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200'
                            } disabled:opacity-40 disabled:cursor-not-allowed`}
                          >
                            {togglingId === cycle.id ? (
                              'Updating…'
                            ) : isDeadlineReached ? (
                              'Deadline Reached'
                            ) : isOpen ? (
                              <>
                                <Lock className="w-3.5 h-3.5" /> Close Cycle
                              </>
                            ) : (
                              <>
                                <Unlock className="w-3.5 h-3.5" /> Reopen Cycle
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  No application cycles history found.
                </div>
              )}
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}
