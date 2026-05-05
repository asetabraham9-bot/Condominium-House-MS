import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import Layout from '../../components/Layout';
import { Home, Layers, Rocket, ImagePlus } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from 'sonner';
import { API_BASE_URL } from '../../lib/apiBase';

type CampusRow = { id: string; name: string };

const MAX_IMAGES = 6;

export default function LaunchCycle() {
  const { user } = useAuth();
  const { blocks, refreshData } = useData();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [campuses, setCampuses] = useState<CampusRow[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  const [form, setForm] = useState({
    title: '',
    roundLabel: '',
    description: '',
    houseDetails: '',
    monthlyPayment: '',
    applicationFee: '',
    electricityService: '',
    waterService: '',
    houseType: 'Two Bedroom',
    campusId: '',
    blockId: '',
    houseNumber: '',
    bedrooms: '2',
    bathrooms: '2',
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

  const filteredBlocks = form.campusId
    ? blocks.filter((b) => String(b.campusId ?? '') === form.campusId)
    : [];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'campusId') {
        next.blockId = '';
      }
      return next;
    });
  };

  const onImagesPick = (e: ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files ?? []).slice(0, MAX_IMAGES);
    setImageFiles(list);
    e.target.value = '';
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.deadline.trim()) {
      toast.error('Application deadline is required');
      return;
    }
    if (!user?.id) {
      toast.error('You must be signed in');
      return;
    }
    if (imageFiles.length > MAX_IMAGES) {
      toast.error(`You can attach at most ${MAX_IMAGES} images`);
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title.trim());
      if (form.roundLabel.trim()) fd.append('roundLabel', form.roundLabel.trim());
      fd.append('description', form.description.trim());
      if (form.houseDetails.trim()) fd.append('houseDetails', form.houseDetails.trim());
      if (form.monthlyPayment) fd.append('monthlyPayment', form.monthlyPayment);
      if (form.applicationFee) fd.append('applicationFee', form.applicationFee);
      if (form.electricityService) fd.append('electricityService', form.electricityService);
      if (form.waterService) fd.append('waterService', form.waterService);
      if (form.houseType.trim()) fd.append('houseType', form.houseType.trim());
      if (form.campusId) fd.append('campusId', form.campusId);
      if (form.blockId) fd.append('blockId', form.blockId);
      if (form.houseNumber.trim()) fd.append('houseNumber', form.houseNumber.trim());
      fd.append('bedrooms', form.bedrooms || '0');
      fd.append('bathrooms', form.bathrooms || '0');
      fd.append('deadline', form.deadline);
      fd.append('launchedBy', user.id);

      imageFiles.forEach((file) => {
        fd.append('images[]', file);
      });

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
      toast.success(data.message ?? 'Application cycle launched. Previous open cycles were closed.');
      setForm({
        title: '',
        roundLabel: '',
        description: '',
        houseDetails: '',
        monthlyPayment: '',
        applicationFee: '',
        electricityService: '',
        waterService: '',
        houseType: 'Two Bedroom',
        campusId: '',
        blockId: '',
        houseNumber: '',
        bedrooms: '2',
        bathrooms: '2',
        deadline: '',
      });
      setImageFiles([]);
    } catch {
      toast.error('Network error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Toaster position="top-right" />
      <Layout role="chms_admin">
        <div className="max-w-5xl">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Rocket className="w-8 h-8 text-indigo-600" />
            Launch application cycle
          </h1>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Configure the <strong>housing round</strong> (fees and deadline), then <strong>house details</strong> that
            applicants will see when they apply. Launching closes any other <strong>open</strong> rounds automatically.
          </p>

          <form
            onSubmit={handleSubmit}
            className="space-y-8"
          >
            {/* Application */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-4 text-white flex items-center gap-2">
                <Layers className="w-5 h-5 opacity-90" />
                <h2 className="text-lg font-semibold">Application details</h2>
              </div>
              <div className="p-6 md:p-8 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Application cycle title <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="title"
                      value={form.title}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g. 2026 Academic Year Housing"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Round label (optional)
                    </label>
                    <input
                      name="roundLabel"
                      value={form.roundLabel}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g. Round 1 · Block A"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Application description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    required
                    rows={4}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Who can apply, required documents, and key dates..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Application fee (ETB)
                    </label>
                    <input
                      name="applicationFee"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.applicationFee}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Application deadline <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="deadline"
                      type="datetime-local"
                      value={form.deadline}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 max-w-md"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* House */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-teal-600 to-emerald-600 px-6 py-4 text-white flex items-center gap-2">
                <Home className="w-5 h-5 opacity-90" />
                <h2 className="text-lg font-semibold">House details</h2>
              </div>
              <div className="p-6 md:p-8 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    House overview (notes for applicants)
                  </label>
                  <textarea
                    name="houseDetails"
                    value={form.houseDetails}
                    onChange={handleChange}
                    rows={2}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500"
                    placeholder="Short summary of the unit or offering"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Campus</label>
                    <select
                      name="campusId"
                      value={form.campusId}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-teal-500"
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
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Block name</label>
                    <select
                      name="blockId"
                      value={form.blockId}
                      onChange={handleChange}
                      disabled={!form.campusId}
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-xl bg-white disabled:bg-slate-100 focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="">Select block</option>
                      {filteredBlocks.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.blockName}
                          {b.campus ? ` — ${b.campus}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">House type</label>
                    <select
                      name="houseType"
                      value={form.houseType}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="Studio">Studio</option>
                      <option value="One Bedroom">One Bedroom</option>
                      <option value="Two Bedroom">Two Bedroom</option>
                      <option value="Three Bedroom">Three Bedroom</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">House number</label>
                    <input
                      name="houseNumber"
                      value={form.houseNumber}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500"
                      placeholder="e.g. A-12"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Monthly payment (ETB)
                    </label>
                    <input
                      name="monthlyPayment"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.monthlyPayment}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Electric service
                    </label>
                    <select
                      name="electricityService"
                      value={form.electricityService}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="">—</option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Water service</label>
                    <select
                      name="waterService"
                      value={form.waterService}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="">—</option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Bedrooms
                    </label>
                    <input
                      name="bedrooms"
                      type="number"
                      min="0"
                      value={form.bedrooms}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Bathrooms
                    </label>
                    <input
                      name="bathrooms"
                      type="number"
                      min="0"
                      value={form.bathrooms}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div className="border border-dashed border-slate-300 rounded-xl p-5 bg-slate-50">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-center gap-3 text-teal-800">
                      <div className="p-3 bg-white rounded-xl shadow-sm border border-teal-100">
                        <ImagePlus className="w-7 h-7" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">House photos</p>
                        <p className="text-sm text-slate-600">Up to {MAX_IMAGES} images (JPEG, PNG, WebP)</p>
                      </div>
                    </div>
                    <label className="sm:ml-auto cursor-pointer inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-teal-600 text-white font-medium hover:bg-teal-700">
                      Choose files
                      <input type="file" accept="image/*" multiple className="hidden" onChange={onImagesPick} />
                    </label>
                  </div>
                  {imageFiles.length > 0 && (
                    <ul className="mt-4 text-sm text-slate-600 space-y-1">
                      {imageFiles.map((f, i) => (
                        <li key={`${f.name}-${i}`}>
                          {i + 1}. {f.name} ({Math.round(f.size / 1024)} KB)
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full md:w-auto px-10 py-3.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 shadow-lg shadow-indigo-200 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Launching…' : 'Launch open cycle'}
            </button>
          </form>
        </div>
      </Layout>
    </>
  );
}
