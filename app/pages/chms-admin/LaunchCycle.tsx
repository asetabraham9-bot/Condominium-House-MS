import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import Layout from '../../components/Layout';
import { Home, Layers, Rocket, ImagePlus, Plus, Trash2, Calendar, Check, X, Lock, Unlock } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from 'sonner';
import { API_BASE_URL } from '../../lib/apiBase';

type CampusRow = { id: string; name: string };
type HouseConfig = {
  houseType: string;
  campusId: string;
  campusName: string;
  monthlyPayment: number;
  numberOfHouses: number;
};


export default function LaunchCycle() {
  const { user } = useAuth();
  const { blocks, housingCycles, refreshData } = useData();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [campuses, setCampuses] = useState<CampusRow[]>([]);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Multiple house configurations state
  const [houseConfigurations, setHouseConfigurations] = useState<HouseConfig[]>([]);

  // Selection state for adding house config
  const [houseType, setHouseType] = useState('Two Bedroom');
  const [campusId, setCampusId] = useState('');
  const [monthlyPayment, setMonthlyPayment] = useState('');
  const [numberOfHouses, setNumberOfHouses] = useState('');

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

  // Update house overview automatically when configurations change
  useEffect(() => {
    if (houseConfigurations.length === 0) {
      setForm((prev) => ({ ...prev, houseDetails: '' }));
      return;
    }
    const totalHouses = houseConfigurations.reduce((sum, c) => sum + c.numberOfHouses, 0);
    const details = houseConfigurations
      .map(
        (c) =>
          `• ${c.houseType} (${c.campusName}): ${c.numberOfHouses} units @ ${Number(
            c.monthlyPayment
          ).toLocaleString()} ETB/month`
      )
      .join('\n');
    const autoSummary = `Total units launched: ${totalHouses}\nBreakdown:\n${details}`;
    setForm((prev) => ({ ...prev, houseDetails: autoSummary }));
  }, [houseConfigurations]);

  const handleAddConfiguration = () => {
    if (!houseType) {
      toast.error('Please select a house type');
      return;
    }
    if (!campusId) {
      toast.error('Please select a campus');
      return;
    }
    if (!numberOfHouses || Number(numberOfHouses) <= 0) {
      toast.error('Please enter a valid number of houses');
      return;
    }
    if (!monthlyPayment || Number(monthlyPayment) < 0) {
      toast.error('Please enter a valid monthly payment');
      return;
    }

    const campus = campuses.find((c) => c.id === campusId);
    const campusName = campus ? campus.name : 'Unknown Campus';

    // Avoid duplicates of the same type and campus
    const exists = houseConfigurations.some(
      (c) => c.houseType === houseType && c.campusId === campusId
    );
    if (exists) {
      toast.error('This house type on the selected campus is already added. Remove it first to update.');
      return;
    }

    const newConfig: HouseConfig = {
      houseType,
      campusId,
      campusName,
      monthlyPayment: Number(monthlyPayment),
      numberOfHouses: Number(numberOfHouses),
    };

    setHouseConfigurations((prev) => [...prev, newConfig]);
    // Reset selection fields (keep type & campus as defaults for easier repeat)
    setMonthlyPayment('');
    setNumberOfHouses('');
    toast.success(`Added ${newConfig.houseType} configuration.`);
  };

  const handleRemoveConfiguration = (index: number) => {
    setHouseConfigurations((prev) => prev.filter((_, i) => i !== index));
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
    if (houseConfigurations.length === 0) {
      toast.error('At least one house configuration is required to launch');
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
      fd.append('houseConfigurations', JSON.stringify(houseConfigurations));

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
      setHouseConfigurations([]);
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
              Configure the application round, select campuses, house types, and prices. You can add multiple house offerings in a single round. Launching automatically closes other active rounds.
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
                {/* Selection Fields */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                  <h3 className="font-semibold text-slate-800 text-sm uppercase tracking-wide">Add House Offering</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">House Type</label>
                      <select
                        value={houseType}
                        onChange={(e) => setHouseType(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-teal-500 text-sm"
                      >
                        <option value="Studio">Studio</option>
                        <option value="One Bedroom">One Bedroom</option>
                        <option value="Two Bedroom">Two Bedroom</option>
                        <option value="Three Bedroom">Three Bedroom</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Campus</label>
                      <select
                        value={campusId}
                        onChange={(e) => setCampusId(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-teal-500 text-sm"
                      >
                        <option value="">Select campus</option>
                        {campuses.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Number of Houses</label>
                      <input
                        type="number"
                        min="1"
                        value={numberOfHouses}
                        onChange={(e) => setNumberOfHouses(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-sm"
                        placeholder="e.g. 10"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Monthly Payment (ETB)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={monthlyPayment}
                        onChange={(e) => setMonthlyPayment(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-sm"
                        placeholder="e.g. 2500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={handleAddConfiguration}
                      className="px-5 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-semibold text-sm flex items-center gap-1.5 shadow-sm transition-colors"
                    >
                      <Plus className="w-4 h-4" /> Add House Configuration
                    </button>
                  </div>
                </div>

                {/* Configurations List */}
                {houseConfigurations.length > 0 ? (
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase text-xs">
                        <tr>
                          <th className="px-4 py-3">House Type</th>
                          <th className="px-4 py-3">Campus</th>
                          <th className="px-4 py-3 text-right">Count</th>
                          <th className="px-4 py-3 text-right">Monthly Payment</th>
                          <th className="px-4 py-3 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {houseConfigurations.map((config, index) => (
                          <tr key={index} className="hover:bg-slate-50">
                            <td className="px-4 py-3 font-medium text-slate-900">{config.houseType}</td>
                            <td className="px-4 py-3 text-slate-600">{config.campusName}</td>
                            <td className="px-4 py-3 text-right text-slate-900 font-semibold">{config.numberOfHouses}</td>
                            <td className="px-4 py-3 text-right text-slate-950 font-bold">{config.monthlyPayment.toLocaleString()} ETB</td>
                            <td className="px-4 py-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveConfiguration(index)}
                                className="text-red-500 hover:text-red-700 p-1"
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
                    No house configurations added yet. Add at least one configuration above.
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
