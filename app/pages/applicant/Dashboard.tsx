import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import Layout from '../../components/Layout';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import {
  FileText,
  DollarSign,
  Bell,
  Home as HomeIcon,
  Send,
  AlertCircle,
  Building2,
  CalendarClock,
  Droplets,
  Zap,
  Wallet,
  CheckCircle2,
  ClipboardList,
  Sparkles,
} from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Toaster } from 'sonner';
import { API_BASE_URL, uploadsPublicUrl } from '../../lib/apiBase';
import { calculateTotalScore, getScoreBreakdown } from '../../utils/scoreCalculator';
import { getHouseOfferingOptions, parseOfferingValue } from '../../utils/houseOfferings';

function ynLabel(value: string | null | undefined): string {
  if (value == null || value === '') return '—';
  const v = String(value).toLowerCase();
  if (v === 'yes' || v === 'y' || v === '1' || v === 'true') return 'Yes';
  if (v === 'no' || v === 'n' || v === '0' || v === 'false') return 'No';
  return String(value);
}

export default function Dashboard() {
  const { user } = useAuth();
  const {
    applications,
    residents,
    payments,
    notifications,
    residentRequests,
    housingCycles,
    campuses,
    refreshData,
  } = useData();
  const navigate = useNavigate();

  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestFormData, setRequestFormData] = useState({
    requestType: 'maintenance' as 'maintenance' | 'complaint' | 'inquiry' | 'other',
    subject: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
  });

  const [showNominateForm, setShowNominateForm] = useState(false);
  const [nominateFormData, setNominateFormData] = useState({
    campusId: '',
    block: '',
    houseType: 'Studio',
    houseStatus: 'available',
    maintenanceDescription: '',
  });
  const [submittingNomination, setSubmittingNomination] = useState(false);

  // Application form state
  const [formData, setFormData] = useState({
    gender: user?.gender || '',
    academicLevel: user?.academicLevel || '',
    yearsOfService: user?.yearsOfService || 0,
    maritalStatus: user?.maritalStatus || '',
    childrenCount: 0,
    jobResponsibility: user?.jobResponsibility || '',
    isDisabled: user?.isDisabled || false,
    disabilityType: user?.disabilityType || '',
    houseType: '',
    preferredCampusId: user?.campusId || '',
    preferredOffering: '',
  });

  useEffect(() => {
    if (!user || user.role !== 'applicant') {
      navigate('/login');
    }
  }, [user, navigate]);

  // Sync user state to form on load
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        gender: prev.gender || user.gender || '',
        academicLevel: prev.academicLevel || user.academicLevel || '',
        yearsOfService: prev.yearsOfService || user.yearsOfService || 0,
        maritalStatus: prev.maritalStatus || user.maritalStatus || '',
        jobResponsibility: prev.jobResponsibility || user.jobResponsibility || '',
        isDisabled: prev.isDisabled || user.isDisabled || false,
        disabilityType: prev.disabilityType || user.disabilityType || '',
      }));
    }
  }, [user]);

  const userApplications = applications.filter((app) => app.applicantId === user?.id);
  const userResident = residents.find((r) => r.applicantId === user?.id);
  const userPayments = payments.filter((p) => p.residentId === userResident?.id);
  const userRequests = residentRequests.filter((r) => r.residentId === userResident?.id);
  const recentNotifications = notifications.slice(0, 5);

  // Open cycle validation
  const openCycle = housingCycles.find((c) => c.status === 'open');
  const deadlineMs = openCycle?.deadline ? new Date(openCycle.deadline).getTime() : null;
  const deadlineOk = deadlineMs == null || !Number.isFinite(deadlineMs) || deadlineMs >= Date.now();
  const canApply = Boolean(openCycle && deadlineOk);

  const applicantCampusName = campuses.find((c) => c.id === user?.campusId)?.name;
  const houseOfferingOptions = getHouseOfferingOptions(openCycle, user?.campusId ?? undefined, applicantCampusName);

  const mySubmission = user ? applications.find((a) => a.applicantId === user.id && (a.cycleId === openCycle?.id || a.status === 'placed')) : undefined;
  const submissionComplete = Boolean(
    mySubmission &&
    mySubmission.cycleId != null &&
    String(mySubmission.cycleId).trim() !== '' &&
    mySubmission.status !== 'rejected'
  );

  const currentScore = calculateTotalScore({
    ...formData,
    gender: user?.gender || formData.gender,
  });

  const scoreBreakdown = getScoreBreakdown({
    ...formData,
    gender: user?.gender || formData.gender,
  });

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (name === 'preferredOffering') {
      const { houseType, preferredCampusId } = parseOfferingValue(value);
      setFormData({
        ...formData,
        preferredOffering: value,
        houseType,
        preferredCampusId,
      });
      return;
    }

    setFormData({
      ...formData,
      [name]:
        type === 'number'
          ? parseInt(value) || 0
          : type === 'checkbox'
            ? (e.target as HTMLInputElement).checked
            : value,
    });
  };

  const handleSubmitApplication = async (e: FormEvent) => {
    e.preventDefault();

    if (!user) return;

    if (!canApply) {
      toast.error('There is no open application cycle, or the deadline has passed.');
      return;
    }

    const existingApp = applications.find((app) => app.applicantId === user.id && app.status === 'pending' && app.cycleId === openCycle?.id);
    if (existingApp) {
      toast.error('You already have a pending application in the current cycle');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/applicant/apply.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          gender: formData.gender,
          academicLevel: formData.academicLevel,
          yearsOfService: formData.yearsOfService,
          maritalStatus: formData.maritalStatus,
          childrenCount: formData.childrenCount,
          jobResponsibility: formData.jobResponsibility,
          isDisabled: formData.isDisabled,
          disabilityType: formData.disabilityType,
          houseType: formData.houseType,
          preferredCampusId: formData.preferredCampusId || null,
          score: currentScore,
        }),
      });

      const result = (await response.json()) as { message?: string };
      if (!response.ok) {
        toast.error(result.message ?? 'Failed to submit application');
        return;
      }

      await refreshData();
      toast.success(`Application submitted successfully! Your score: ${currentScore}`);
    } catch (error) {
      console.error('Application submit failed:', error);
      toast.error('Unable to submit application');
    }
  };

  const handleSubmitRequest = async (e: FormEvent) => {
    e.preventDefault();

    if (!userResident) {
      toast.error('Only active residents can submit requests');
      return;
    }

    if (!requestFormData.subject.trim() || !requestFormData.description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/applicant/submit_request.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          residentId: userResident.id,
          campusId: userResident.campusId ?? user?.campusId,
          requestType: requestFormData.requestType,
          subject: requestFormData.subject,
          description: requestFormData.description,
          priority: requestFormData.priority,
        }),
      });

      const result = (await response.json()) as { message?: string };
      if (!response.ok) {
        toast.error(result.message ?? 'Failed to submit request');
        return;
      }

      await refreshData();
      toast.success('Request submitted successfully!');
    } catch (error) {
      console.error('Request submit failed:', error);
      toast.error('Unable to submit request');
      return;
    }

    // Reset form
    setRequestFormData({
      requestType: 'maintenance',
      subject: '',
      description: '',
      priority: 'medium',
    });
    setShowRequestForm(false);
  };

  const handleNominateSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    if (!nominateFormData.campusId || !nominateFormData.block || !nominateFormData.houseType || !nominateFormData.houseStatus) {
      toast.error('Please fill in all required fields.');
      return;
    }

    if (nominateFormData.houseStatus === 'maintenance' && !nominateFormData.maintenanceDescription.trim()) {
      toast.error('Please describe what is messed up in the maintenance description.');
      return;
    }

    setSubmittingNomination(true);
    try {
      const response = await fetch(`${API_BASE_URL}/applicant/submit_nomination.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          informerId: user.id,
          campusId: nominateFormData.campusId,
          block: nominateFormData.block,
          houseType: nominateFormData.houseType,
          houseStatus: nominateFormData.houseStatus,
          maintenanceDescription: nominateFormData.maintenanceDescription,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        toast.error(result.message || 'Failed to submit nomination request.');
        return;
      }

      toast.success('Thank you for your nomination request! Your cooperation is highly valued.');
      setNominateFormData({
        campusId: '',
        block: '',
        houseType: 'Studio',
        houseStatus: 'available',
        maintenanceDescription: '',
      });
      setShowNominateForm(false);
      await refreshData();
    } catch (error) {
      console.error('Error submitting nomination:', error);
      toast.error('Network error. Unable to submit nomination.');
    } finally {
      setSubmittingNomination(false);
    }
  };

  return (
    <>
      <Toaster position="top-right" />
      <Layout role="applicant">
        <div className="space-y-10">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Welcome, {user?.firstName}!</h1>
            <p className="text-slate-600">Manage your condominium housing application, track progress, and submit requests.</p>
          </div>

          {/* Conditional Application Form */}
          {canApply && !submissionComplete ? (
            <div className="bg-white rounded-3xl overflow-hidden shadow-xl border border-indigo-100">
              {/* Form Title Banner */}
              <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 px-6 py-6 md:px-8 text-white relative">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <span className="bg-indigo-500/40 text-indigo-100 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                      Active Application Round Open
                    </span>
                    <h2 className="text-2xl font-bold mt-2">{openCycle?.title}</h2>
                    <p className="text-sm text-indigo-100 mt-1 max-w-2xl">
                      {openCycle?.description}
                    </p>
                  </div>
                  <div className="shrink-0 flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm">
                    <CalendarClock className="w-5 h-5 text-indigo-200" />
                    <div className="text-xs text-left">
                      <p className="text-indigo-200 uppercase font-semibold">Apply before</p>
                      <p className="font-bold text-white">
                        {openCycle?.deadline ? new Date(openCycle.deadline).toLocaleString() : '—'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Body Split Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 p-6 md:p-8">
                {/* Left Panel: Cycle details & score preview */}
                <div className="lg:col-span-2 space-y-6">
                  {/* House Config Details */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                    <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-1.5">
                      <HomeIcon className="w-4 h-4 text-indigo-600" />
                      Advertised House Offerings
                    </h3>

                    {openCycle?.houseConfigurations && openCycle.houseConfigurations.length > 0 ? (
                      <div className="space-y-3">
                        {openCycle.houseConfigurations.map((hc, index) => (
                          <div key={index} className="bg-white border border-slate-100 rounded-xl p-3.5 shadow-sm text-xs space-y-1">
                            <div className="flex justify-between font-semibold text-slate-900">
                              <span>{hc.houseType}</span>
                              <span className="text-indigo-600">{hc.monthlyPayment.toLocaleString()} ETB/mo</span>
                            </div>
                            <div className="flex justify-between text-slate-500">
                              <span>Campus: {hc.campusName}</span>
                              <span>{hc.numberOfHouses} houses available</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs space-y-2 text-slate-700 bg-white border border-slate-100 rounded-xl p-3.5">
                        <div className="flex justify-between">
                          <span className="font-medium">House Type:</span>
                          <span>{openCycle?.houseType}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Campus:</span>
                          <span>{openCycle?.campusName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Monthly:</span>
                          <span>{openCycle?.monthlyPayment?.toLocaleString()} ETB</span>
                        </div>
                      </div>
                    )}

                    {openCycle?.applicationFee != null && (
                      <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3.5 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 font-medium text-slate-700">
                          <Wallet className="w-4 h-4 text-indigo-600" />
                          <span>One-time Application Fee</span>
                        </div>
                        <span className="font-bold text-slate-900">{openCycle.applicationFee.toLocaleString()} ETB</span>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <span className="bg-slate-100 px-2.5 py-1 rounded-md text-slate-700 text-xs font-semibold flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5 text-amber-500" /> Power: {ynLabel(openCycle?.electricityService)}
                      </span>
                      <span className="bg-slate-100 px-2.5 py-1 rounded-md text-slate-700 text-xs font-semibold flex items-center gap-1">
                        <Droplets className="w-3.5 h-3.5 text-blue-500" /> Water: {ynLabel(openCycle?.waterService)}
                      </span>
                    </div>

                    {openCycle?.houseDetails && (
                      <p className="text-xs text-slate-600 border-l-2 border-teal-500 pl-3 py-1 font-mono leading-relaxed bg-white rounded p-2">
                        {openCycle.houseDetails}
                      </p>
                    )}
                  </div>

                  {/* Score Preview */}
                  <div className="bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-bold text-indigo-900 text-sm flex items-center gap-1">
                          <Sparkles className="w-4 h-4 text-amber-500" />
                          Estimated Selection Score
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 max-w-[200px]">
                          Based on academic, service, responsibility, marital status, and female disability bonuses.
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-4xl font-extrabold text-indigo-950 tabular-nums">
                          {currentScore}
                        </p>
                        <p className="text-[10px] uppercase font-bold text-slate-400">out of 100</p>
                      </div>
                    </div>

                    <ul className="mt-4 space-y-1.5">
                      {(
                        [
                          ['Academic Degree', scoreBreakdown.academic.value],
                          ['Service Duration', scoreBreakdown.service.value],
                          ['Responsibility', scoreBreakdown.job.value],
                          ['Marital Status', scoreBreakdown.marital.value],
                          ['Female Disability Bonus', scoreBreakdown.disability.value],
                        ] as const
                      ).map(([label, pts]) =>
                        pts > 0 ? (
                          <li
                            key={label}
                            className="flex justify-between text-xs bg-white/80 border border-indigo-100/50 rounded-lg px-2.5 py-1.5"
                          >
                            <span className="text-slate-600">{label}</span>
                            <span className="font-bold text-indigo-950">+{pts} pts</span>
                          </li>
                        ) : null
                      )}
                    </ul>
                  </div>
                </div>

                {/* Right Panel: Questionnaire Form */}
                <div className="lg:col-span-3">
                  <form onSubmit={handleSubmitApplication} className="space-y-5">
                    <h3 className="font-bold text-slate-800 text-base border-b border-slate-100 pb-2">
                      Eligibility Profile & Questionnaire
                    </h3>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Preferred House Type & Campus <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="preferredOffering"
                        value={formData.preferredOffering}
                        onChange={handleFormChange}
                        required
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 text-sm"
                      >
                        <option value="">Select the house type you are applying for</option>
                        {houseOfferingOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Gender <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="gender"
                          value={formData.gender}
                          onChange={handleFormChange}
                          required
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 text-sm"
                        >
                          <option value="">Select gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Academic Level <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="academicLevel"
                          value={formData.academicLevel}
                          onChange={handleFormChange}
                          required
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 text-sm"
                        >
                          <option value="">Select level</option>
                          <option value="Professor">Professor</option>
                          <option value="Assistant Professor">Assistant Professor</option>
                          <option value="PhD">PhD</option>
                          <option value="Masters">Masters</option>
                          <option value="Bachelor">Bachelor</option>
                          <option value="Diploma">Diploma</option>
                          <option value="Certificate">Certificate</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Years of Service <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          name="yearsOfService"
                          value={formData.yearsOfService}
                          onChange={handleFormChange}
                          required
                          min={0}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Marital Status <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="maritalStatus"
                          value={formData.maritalStatus}
                          onChange={handleFormChange}
                          required
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 text-sm"
                        >
                          <option value="">Select</option>
                          <option value="Single">Single</option>
                          <option value="Married">Married</option>
                          <option value="Divorced">Divorced</option>
                          <option value="Widowed">Widowed</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Number of Children <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          name="childrenCount"
                          value={formData.childrenCount}
                          onChange={handleFormChange}
                          required
                          min={0}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Job Responsibility <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="jobResponsibility"
                          value={formData.jobResponsibility}
                          onChange={handleFormChange}
                          required
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 text-sm"
                        >
                          <option value="">Select</option>
                          <option value="Dean">Dean</option>
                          <option value="Department Head">Department Head</option>
                          <option value="Lecturer">Lecturer</option>
                          <option value="Assistant Lecturer">Assistant Lecturer</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>

                    {/* Disability */}
                    <div className="space-y-3">
                      <label className="flex items-center gap-2.5 cursor-pointer rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-2.5">
                        <input
                          type="checkbox"
                          name="isDisabled"
                          checked={formData.isDisabled}
                          onChange={handleFormChange}
                          className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-xs text-slate-700">
                          Disability declaration
                          {(user?.gender === 'Female' || formData.gender === 'Female') && (
                            <span className="text-indigo-600 font-semibold">
                              {' '}
                              (female applicant points bonus eligible)
                            </span>
                          )}
                        </span>
                      </label>

                      {formData.isDisabled && (
                        <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-4 animate-fadeIn">
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Disability Type <span className="text-red-500">*</span>
                          </label>
                          <select
                            name="disabilityType"
                            value={formData.disabilityType}
                            onChange={handleFormChange}
                            required={formData.isDisabled}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 text-sm"
                          >
                            <option value="">Select Disability Type</option>
                            <option value="Wheelchair / Paralysis">Wheelchair / Paralysis</option>
                            <option value="Visually Impaired / Blindness">Visually Impaired / Blindness</option>
                            <option value="Hearing Impaired / Deafness">Hearing Impaired / Deafness</option>
                            <option value="Amputation / Missing Limb">Amputation / Missing Limb</option>
                            <option value="Intellectual / Cognitive Disability">Intellectual / Cognitive Disability</option>
                            <option value="Other Physical Disability">Other Physical Disability</option>
                          </select>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        type="submit"
                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm flex items-center gap-1.5 transition-colors text-sm"
                      >
                        <ClipboardList className="w-4 h-4" /> Submit Housing Application
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          ) : null}

          {/* History Section */}
          {housingCycles.filter(c => c.status === 'closed').length > 0 && (
            <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-200">
              <div className="bg-slate-100 px-6 py-4 md:px-8 border-b border-slate-200">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-slate-500" />
                  Application History
                </h2>
              </div>
              <div className="p-6 md:p-8 space-y-4">
                {housingCycles.filter(c => c.status === 'closed').map(cycle => (
                  <div key={cycle.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50 transition-colors hover:bg-slate-100/50">
                    <div>
                      <h3 className="font-bold text-slate-800">{cycle.title}</h3>
                      <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                        <CalendarClock className="w-4 h-4" />
                        Deadline: {cycle.deadline ? new Date(cycle.deadline).toLocaleString() : '—'}
                      </p>
                    </div>
                    <div className="mt-4 md:mt-0">
                      <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-200 text-slate-600">
                        Closed
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              icon={FileText}
              iconColor="text-blue-600"
              title="Applications"
              value={userApplications.length}
            />
            <StatCard
              icon={HomeIcon}
              iconColor="text-green-600"
              title="Housing Assigned"
              value={userResident ? '1' : '0'}
            />
            <StatCard
              icon={DollarSign}
              iconColor="text-yellow-600"
              title="Payments Made"
              value={userPayments.length}
            />
            <StatCard
              icon={Bell}
              iconColor="text-red-600"
              title="Notifications"
              value={notifications.length}
            />
          </div>

          {/* Resident Request Form Section */}
          {userResident && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Submit Request to Campus Admin</h2>
                  <p className="text-sm text-gray-600">Report issues or submit inquiries about your residence</p>
                </div>
                <button
                  onClick={() => setShowRequestForm(!showRequestForm)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>{showRequestForm ? 'Cancel' : 'New Request'}</span>
                </button>
              </div>

              {showRequestForm && (
                <form onSubmit={handleSubmitRequest} className="border-t border-gray-200 pt-6 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {/* Request Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Request Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={requestFormData.requestType}
                        onChange={(e) =>
                          setRequestFormData({ ...requestFormData, requestType: e.target.value as any })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="maintenance">Maintenance</option>
                        <option value="complaint">Complaint</option>
                        <option value="inquiry">Inquiry</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    {/* Priority */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Priority <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={requestFormData.priority}
                        onChange={(e) =>
                          setRequestFormData({ ...requestFormData, priority: e.target.value as any })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                  </div>

                  {/* Subject */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subject <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={requestFormData.subject}
                      onChange={(e) =>
                        setRequestFormData({ ...requestFormData, subject: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Brief description of your request"
                      required
                    />
                  </div>

                  {/* Description */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={requestFormData.description}
                      onChange={(e) =>
                        setRequestFormData({ ...requestFormData, description: e.target.value })
                      }
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Provide detailed information about your request..."
                      required
                    />
                  </div>

                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                    >
                      <Send className="w-4 h-4" />
                      <span>Submit Request</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowRequestForm(false)}
                      className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Recent Requests */}
              {userRequests.length > 0 && (
                <div className="border-t border-gray-200 pt-6 mt-6">
                  <h3 className="font-bold text-gray-900 mb-4">Your Recent Requests</h3>
                  <div className="space-y-3">
                    {userRequests.slice(0, 3).map((request) => (
                      <div key={request.id} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-medium text-gray-900">{request.subject}</span>
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${request.priority === 'high'
                                  ? 'bg-red-100 text-red-700'
                                  : request.priority === 'medium'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-gray-100 text-gray-700'
                                }`}>
                                {request.priority}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">{request.description.substring(0, 100)}...</p>
                            <p className="text-xs text-gray-500">
                              {request.requestType.charAt(0).toUpperCase() + request.requestType.slice(1)} •
                              {new Date(request.dateSubmitted).toLocaleDateString()}
                            </p>
                          </div>
                          <StatusBadge
                            status={request.status === 'in_progress' ? 'pending' as any : request.status as any}
                            label={
                              request.status === 'in_progress'
                                ? 'In Progress'
                                : request.status === 'resolved'
                                  ? 'Resolved'
                                  : request.status === 'rejected'
                                    ? 'Rejected'
                                    : 'Pending'
                            }
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Alert if not a resident */}
          {!userResident && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-xl">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-yellow-400 mr-3" />
                <p className="text-sm text-yellow-700">
                  You must be an active resident to submit maintenance or service requests to Campus Admin.
                </p>
              </div>
            </div>
          )}

          {/* Application Status (If submitted) */}
          {userApplications.length > 0 && (
            <div className="rounded-2xl shadow-sm border border-slate-200 overflow-hidden bg-white">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                <h2 className="text-xl font-bold text-slate-900">Your Submitted Applications</h2>
                <p className="text-sm text-slate-600 mt-1">
                  Track the status and scores of your housing requests.
                </p>
              </div>
              <div className="p-6 space-y-6">
                {userApplications.slice(0, 3).map((app) => {
                  const imgs = app.cycleHouseImages ?? [];
                  return (
                    <div
                      key={`${app.applicantId}-${app.cycleId ?? 'x'}`}
                      className="rounded-xl border border-slate-100 p-5 flex flex-col xl:flex-row gap-6 bg-gradient-to-br from-white to-indigo-50/30"
                    >
                      <div className="flex-1 space-y-3 min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="font-semibold text-slate-900 text-lg">
                              {app.cycleTitle ?? 'Application'}
                              {app.cycleId ? (
                                <span className="text-slate-500 font-normal"> · Cycle #{app.cycleId}</span>
                              ) : null}
                            </p>
                            {app.cycleRoundLabel ? (
                              <p className="text-sm text-slate-600">{app.cycleRoundLabel}</p>
                            ) : null}
                          </div>
                          <StatusBadge
                            status={
                              app.status as
                              | 'pending'
                              | 'approved'
                              | 'rejected'
                              | 'lottery'
                              | 'placed'
                            }
                          />
                        </div>
                        <p className="text-sm text-slate-600">
                          Submitted {new Date(app.applicationDate).toLocaleDateString()} · Selection Score: <span className="font-bold text-indigo-600">{app.score}</span> / 100
                          {app.houseType ? (
                            <>
                              {' '}
                              · Applied for <span className="font-semibold text-slate-800">{app.houseType}</span>
                              {app.preferredCampusName ? ` at ${app.preferredCampusName}` : ''}
                            </>
                          ) : null}
                        </p>
                        {app.cycleDescription ? (
                          <p className="text-sm text-slate-700">{app.cycleDescription}</p>
                        ) : null}
                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                          {app.cycleApplicationFee != null ? (
                            <>
                              <dt className="text-slate-500">Application fee</dt>
                              <dd className="font-medium">{app.cycleApplicationFee.toLocaleString()} ETB</dd>
                            </>
                          ) : null}
                          {app.cycleDeadline ? (
                            <>
                              <dt className="text-slate-500">Cycle deadline</dt>
                              <dd className="font-medium">{new Date(app.cycleDeadline).toLocaleString()}</dd>
                            </>
                          ) : null}
                          {app.cycleMonthlyPayment != null ? (
                            <>
                              <dt className="text-slate-500">Monthly payment</dt>
                              <dd className="font-medium">{app.cycleMonthlyPayment.toLocaleString()} ETB</dd>
                            </>
                          ) : null}
                          {app.cycleHouseType ? (
                            <>
                              <dt className="text-slate-500">Cycle house type</dt>
                              <dd className="font-medium">{app.cycleHouseType}</dd>
                            </>
                          ) : null}
                          {app.houseType ? (
                            <>
                              <dt className="text-slate-500">Applied house type</dt>
                              <dd className="font-medium">{app.houseType}</dd>
                            </>
                          ) : null}
                          <dt className="text-slate-500">Electric / water</dt>
                          <dd className="font-medium">
                            {ynLabel(app.cycleElectricityService)} / {ynLabel(app.cycleWaterService)}
                          </dd>
                          <dt className="text-slate-500">Bedrooms · baths</dt>
                          <dd className="font-medium">
                            {app.cycleBedrooms ?? '—'} · {app.cycleBathrooms ?? '—'}
                          </dd>
                          <dt className="text-slate-500">Campus · block · #</dt>
                          <dd className="font-medium">
                            {[app.cycleCampusName, app.cycleBlockName, app.cycleHouseNumber]
                              .filter(Boolean)
                              .join(' · ') || '—'}
                          </dd>
                        </dl>
                        {app.cycleHouseDetails ? (
                          <p className="text-sm text-slate-600 border-l-4 border-teal-400 pl-3 font-mono">
                            {app.cycleHouseDetails}
                          </p>
                        ) : null}
                      </div>
                      {imgs.length > 0 ? (
                        <div className="w-full xl:w-72 shrink-0 grid grid-cols-3 xl:grid-cols-3 gap-1.5">
                          {imgs.map((rel, i) => (
                            <img
                              key={`${app.applicantId}-img-${i}`}
                              src={uploadsPublicUrl(rel)}
                              alt=""
                              className="aspect-square rounded-lg object-cover w-full border border-slate-200 shadow-sm"
                            />
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Published housing rounds (Advertised list) */}
          {housingCycles.length > 0 && (
            <div className="rounded-2xl shadow-sm border border-slate-200 overflow-hidden bg-white">
              <div className="bg-gradient-to-r from-slate-800 to-indigo-900 px-6 py-4">
                <h2 className="text-xl font-bold text-white">Housing rounds & advertised units</h2>
                <p className="text-sm text-indigo-100 mt-1">
                  Every cycle lists what CHMS published: fees, deadlines, and house particulars.
                </p>
              </div>
              <div className="p-6 space-y-6">
                {housingCycles.map((c) => {
                  const open = c.status === 'open';
                  const past =
                    c.deadline && !Number.isNaN(new Date(c.deadline).getTime())
                      ? new Date(c.deadline).getTime() < Date.now()
                      : false;
                  const thumbs = Array.isArray(c.houseImages) ? c.houseImages.slice(0, 6) : [];
                  return (
                    <div
                      key={c.id}
                      className="rounded-xl border border-slate-100 bg-slate-50/80 p-5 flex flex-col lg:flex-row gap-5"
                    >
                      <div className="flex-1 space-y-3 min-w-0">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="font-bold text-slate-900 text-lg">{c.title ?? 'Housing round'}</p>
                            {c.roundLabel ? (
                              <p className="text-sm text-slate-600">Round: {c.roundLabel}</p>
                            ) : null}
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${open && !past
                                ? 'bg-emerald-100 text-emerald-800'
                                : open && past
                                  ? 'bg-amber-100 text-amber-900'
                                  : 'bg-slate-200 text-slate-700'
                              }`}
                          >
                            {open && !past ? 'Open' : open && past ? 'Open · deadline passed' : 'Closed'}
                          </span>
                        </div>
                        {c.description ? (
                          <p className="text-sm text-slate-700 leading-relaxed">{c.description}</p>
                        ) : null}

                        {/* Display configurations if they exist */}
                        {c.houseConfigurations && c.houseConfigurations.length > 0 ? (
                          <div className="bg-white border border-slate-150 rounded-xl p-3.5 space-y-2.5">
                            <p className="text-xs uppercase font-bold text-slate-500 tracking-wider">Unit Offerings breakdown</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                              {c.houseConfigurations.map((hc, idx) => (
                                <div key={idx} className="border border-slate-100 rounded-lg p-2.5 bg-slate-50/50">
                                  <p className="font-semibold text-slate-900">{hc.houseType}</p>
                                  <p className="text-slate-600">Campus: {hc.campusName}</p>
                                  <p className="text-slate-500">{hc.numberOfHouses} units available · {hc.monthlyPayment.toLocaleString()} ETB/mo</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                            {c.applicationFee != null ? (
                              <>
                                <dt className="text-slate-500">Application fee</dt>
                                <dd className="font-medium text-slate-900">
                                  {c.applicationFee.toLocaleString()} ETB
                                </dd>
                              </>
                            ) : null}
                            {c.deadline ? (
                              <>
                                <dt className="text-slate-500">Deadline</dt>
                                <dd className="font-medium text-slate-900">
                                  {new Date(c.deadline).toLocaleString()}
                                </dd>
                              </>
                            ) : null}
                            {c.monthlyPayment != null ? (
                              <>
                                <dt className="text-slate-500">Monthly payment</dt>
                                <dd className="font-medium text-slate-900">
                                  {c.monthlyPayment.toLocaleString()} ETB
                                </dd>
                              </>
                            ) : null}
                            {c.houseType ? (
                              <>
                                <dt className="text-slate-500">House type</dt>
                                <dd className="font-medium text-slate-900">{c.houseType}</dd>
                              </>
                            ) : null}
                          </dl>
                        )}

                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                          {c.deadline && (!c.houseConfigurations || c.houseConfigurations.length === 0) && (
                            <>
                              <dt className="text-slate-500">Deadline</dt>
                              <dd className="font-medium text-slate-900">
                                {new Date(c.deadline).toLocaleString()}
                              </dd>
                            </>
                          )}
                          <dt className="text-slate-500">Electric / water</dt>
                          <dd className="font-medium text-slate-900">
                            {ynLabel(c.electricityService)} / {ynLabel(c.waterService)}
                          </dd>
                        </dl>

                        {c.houseDetails ? (
                          <p className="text-xs text-slate-600 italic border-l-4 border-indigo-300 pl-3 py-1 font-mono bg-white rounded">
                            {c.houseDetails}
                          </p>
                        ) : null}
                      </div>
                      {thumbs.length > 0 ? (
                        <div className="w-full lg:w-56 shrink-0 grid grid-cols-3 lg:grid-cols-2 gap-1.5">
                          {thumbs.map((rel, i) => (
                            <img
                              key={`${c.id}-${i}`}
                              src={uploadsPublicUrl(rel)}
                              alt=""
                              className="aspect-square rounded-lg object-cover w-full border border-slate-200"
                            />
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Inform / Nominate House */}
          <div className="bg-white p-8 rounded-3xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <Building2 className="w-6 h-6 text-indigo-600" />
                  Inform / Nominate House
                </h2>
                <p className="text-slate-500 text-sm mt-1">
                  Report a free/available house or one requiring maintenance in any of our campuses to maintain transparency.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowNominateForm(!showNominateForm)}
                className="shrink-0 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-800 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-900 font-semibold shadow-md hover:shadow-lg transition-all"
              >
                {showNominateForm ? 'Close Form' : 'Start Nomination'}
              </button>
            </div>

            {showNominateForm && (
              <form onSubmit={handleNominateSubmit} className="border-t border-slate-100 pt-6 mt-4 space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Campus *
                    </label>
                    <select
                      value={nominateFormData.campusId}
                      onChange={(e) => setNominateFormData({ ...nominateFormData, campusId: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
                    >
                      <option value="">-- Select Campus --</option>
                      {campuses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Block *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Block 15"
                      value={nominateFormData.block}
                      onChange={(e) => setNominateFormData({ ...nominateFormData, block: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      House Type *
                    </label>
                    <select
                      value={nominateFormData.houseType}
                      onChange={(e) => setNominateFormData({ ...nominateFormData, houseType: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
                    >
                      <option value="Studio">Studio</option>
                      <option value="one bed">One Bed</option>
                      <option value="two bed">Two Bed</option>
                      <option value="three bed">Three Bed</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      House Status *
                    </label>
                    <select
                      value={nominateFormData.houseStatus}
                      onChange={(e) => setNominateFormData({ ...nominateFormData, houseStatus: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
                    >
                      <option value="available">Ready for residence purpose (Available)</option>
                      <option value="maintenance">Maintenance required</option>
                    </select>
                  </div>

                  {nominateFormData.houseStatus === 'maintenance' && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Describe what and what were messed up *
                      </label>
                      <textarea
                        rows={4}
                        placeholder="Please describe the repairs or issues (e.g. broken plumbing, electrical issues)..."
                        value={nominateFormData.maintenanceDescription}
                        onChange={(e) => setNominateFormData({ ...nominateFormData, maintenanceDescription: e.target.value })}
                        required
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors resize-none"
                      />
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submittingNomination}
                  className="w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-colors"
                >
                  {submittingNomination ? 'Submitting...' : 'Submit Nomination'}
                </button>
              </form>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => navigate('/applicant/apply')}
                className="p-4 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-semibold"
              >
                Apply for House (Form Page)
              </button>
              <button
                onClick={() => navigate('/applicant/lottery')}
                className="p-4 border-2 border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-colors font-semibold"
              >
                View Lottery Results
              </button>
              <button
                onClick={() => navigate('/applicant/payment')}
                className="p-4 border-2 border-yellow-600 text-yellow-600 rounded-lg hover:bg-yellow-50 transition-colors font-semibold"
              >
                Make Payment
              </button>
            </div>
          </div>

          {/* Housing Information */}
          {userResident && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Your Housing Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">House Number</p>
                  <p className="font-semibold text-gray-900">{userResident.houseNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Block Name</p>
                  <p className="font-semibold text-gray-900">{userResident.blockName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Move-in Date</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(userResident.moveInDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="font-semibold text-gray-900">
                    {userResident.residenceStatus === 'active' ? 'Active' : 'Left'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Recent Notifications */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Notifications</h2>
            <div className="space-y-3">
              {recentNotifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 rounded-lg border-l-4 ${notif.type === 'success'
                      ? 'bg-green-50 border-green-500'
                      : notif.type === 'warning'
                        ? 'bg-yellow-50 border-yellow-500'
                        : 'bg-blue-50 border-blue-500'
                    }`}
                >
                  <p className="text-gray-900 font-medium">{notif.message}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    {new Date(notif.dateSent).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
            <button
              onClick={() => navigate('/applicant/notifications')}
              className="mt-4 text-blue-600 hover:underline text-sm font-semibold inline-block"
            >
              View All Notifications →
            </button>
          </div>
        </div>
      </Layout>
    </>
  );
}