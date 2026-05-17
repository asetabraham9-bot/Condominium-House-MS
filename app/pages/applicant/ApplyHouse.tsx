import React, { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import Layout from '../../components/Layout';
import { toast } from 'sonner';
import { Toaster } from 'sonner';
import { calculateTotalScore, getScoreBreakdown } from '../../utils/scoreCalculator';
import { API_BASE_URL, uploadsPublicUrl } from '../../lib/apiBase';
import {
  ArrowRight,
  Building2,
  CalendarClock,
  CheckCircle2,
  Droplets,
  Home,
  Lightbulb,
  Sparkles,
  Wallet,
  Zap,
} from 'lucide-react';
import StatusBadge from '../../components/StatusBadge';

function ynLabel(value: string | null | undefined): string {
  if (value == null || value === '') return 'Not specified';
  const v = String(value).toLowerCase();
  if (v === 'yes' || v === 'y' || v === '1' || v === 'true') return 'Available';
  if (v === 'no' || v === 'n' || v === '0' || v === 'false') return 'Not available';
  return String(value);
}

export default function ApplyHouse() {
  const { user } = useAuth();
  const { applications, housingCycles, refreshData } = useData();
  const navigate = useNavigate();

  const openCycle = housingCycles.find((c) => c.status === 'open');
  const deadlineMs = openCycle?.deadline ? new Date(openCycle.deadline).getTime() : null;
  const deadlineOk = deadlineMs == null || !Number.isFinite(deadlineMs) || deadlineMs >= Date.now();
  const canApply = Boolean(openCycle && deadlineOk);

  const [formData, setFormData] = useState({
    gender: user?.gender || '',
    academicLevel: user?.academicLevel || '',
    yearsOfService: user?.yearsOfService || 0,
    maritalStatus: user?.maritalStatus || '',
    childrenCount: 0,
    jobResponsibility: user?.jobResponsibility || '',
    isDisabled: user?.isDisabled || false,
  });

  useEffect(() => {
    if (!user || user.role !== 'applicant') {
      navigate('/login');
    }
  }, [user, navigate]);

  const currentScore = calculateTotalScore({
    ...formData,
    gender: user?.gender,
  });

  const scoreBreakdown = getScoreBreakdown({
    ...formData,
    gender: user?.gender,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]:
        type === 'number'
          ? parseInt(value)
          : type === 'checkbox'
            ? (e.target as HTMLInputElement).checked
            : value,
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!user) return;

    if (!canApply) {
      toast.error('There is no open application cycle, or the deadline has passed.');
      return;
    }

    const existingApp = applications.find((app) => app.applicantId === user.id && app.status === 'pending');

    if (existingApp) {
      toast.error('You already have a pending application');
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

  const houseImages = openCycle?.houseImages ?? [];

  const mySubmission = user ? applications.find((a) => a.applicantId === user.id) : undefined;

  /** Active cycle submission blocks the form unless admin rejects the application */
  const submissionComplete = Boolean(
    mySubmission &&
      mySubmission.cycleId != null &&
      String(mySubmission.cycleId).trim() !== '' &&
      mySubmission.status !== 'rejected'
  );

  if (submissionComplete && user && mySubmission) {
    const statusForBadge = mySubmission.status as
      | 'pending'
      | 'approved'
      | 'rejected'
      | 'lottery'
      | 'placed';

    return (
      <>
        <Toaster position="top-right" />
        <Layout role="applicant">
          <div className="max-w-3xl mx-auto pb-16">
            <div className="rounded-3xl overflow-hidden shadow-2xl border border-emerald-200/80 bg-white">
              <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 px-8 md:px-12 py-12 md:py-14 text-white text-center relative">
                <div className="absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_50%_-20%,#fff9,transparent_50%)]" />
                <div className="relative">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 ring-4 ring-white/30 mb-6 mx-auto">
                    <CheckCircle2 className="w-9 h-9 text-white" />
                  </div>
                  <p className="text-sm uppercase tracking-[0.2em] font-semibold text-emerald-100 mb-3">
                    Thank you — you are registered in this housing cycle
                  </p>
                  <h1 className="text-3xl md:text-4xl font-bold mb-4">Your application was submitted successfully</h1>
                  <p className="text-emerald-50 max-w-xl mx-auto leading-relaxed text-lg">
                    Your responses are on file for this cycle. Track progress from your dashboard; you do not need to
                    submit this form again unless an administrator marks your application as rejected.
                  </p>
                </div>
              </div>

              <div className="p-8 md:p-12 space-y-8">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-6 md:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Current status</p>
                    <StatusBadge status={statusForBadge} />
                    <p className="mt-4 text-lg font-semibold text-slate-900">
                      {mySubmission.cycleTitle ?? 'Housing application'}
                      {mySubmission.cycleId ? (
                        <span className="text-slate-500 font-normal"> · Cycle #{mySubmission.cycleId}</span>
                      ) : null}
                    </p>
                    <p className="text-sm text-slate-600 mt-2">
                      Submitted on {new Date(mySubmission.applicationDate).toLocaleDateString()} · Eligibility score{' '}
                      <span className="font-bold text-indigo-600">{mySubmission.score}</span> / 100
                    </p>
                  </div>
                  <div className="shrink-0 rounded-xl bg-white border border-slate-100 px-6 py-4 text-center shadow-sm">
                    <p className="text-[11px] uppercase text-slate-500 tracking-wide mb-2">Applicant identity</p>
                    <p className="font-semibold text-slate-900">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-sm text-slate-600 truncate max-w-[200px]" title={user.email}>
                      {user.email}
                    </p>
                  </div>
                </div>

                <p className="text-sm text-slate-700 leading-relaxed border-l-4 border-teal-500 pl-4 py-2">
                  The questionnaire stays hidden while your submission is active. If your status becomes{' '}
                  <strong>rejected</strong>, you may apply again in a future open round. Adjust notification preferences in
                  Settings to choose how CHMS reaches you about updates.
                </p>

                <div className="flex flex-wrap gap-4 justify-center pt-4">
                  <button
                    type="button"
                    onClick={() => navigate('/applicant')}
                    className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-colors shadow-lg"
                  >
                    Back to applicant dashboard <ArrowRight className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/applicant/settings')}
                    className="inline-flex items-center px-8 py-3 rounded-xl border-2 border-slate-300 font-semibold text-slate-800 hover:bg-slate-50 transition-colors"
                  >
                    Manage settings & notices
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/applicant/notifications')}
                    className="inline-flex items-center px-8 py-3 rounded-xl border-2 border-indigo-200 text-indigo-800 font-semibold hover:bg-indigo-50 transition-colors"
                  >
                    Notifications
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Layout>
      </>
    );
  }

  return (
    <>
      <Toaster position="top-right" />
      <Layout role="applicant">
        <div className="max-w-6xl mx-auto pb-16">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-900 text-white px-6 py-12 md:px-12 mb-10 shadow-xl">
            <div className="absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_20%_-10%,white,transparent_45%),radial-gradient(circle_at_90%_30%,cyan,transparent_40%)]" />
            <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div>
                <p className="inline-flex items-center gap-2 text-indigo-100 text-sm font-medium mb-3">
                  <Sparkles className="w-4 h-4" />
                  Published housing cycle
                </p>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Apply for a condominium house</h1>
                <p className="mt-4 text-indigo-100 max-w-xl leading-relaxed">
                  Review the advertised unit below, confirm fees and deadlines, then complete your eligibility form.
                  Your ranking score updates live as you fill in your profile fields.
                </p>
              </div>
              {canApply ? (
                <div className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/15 backdrop-blur border border-white/20 text-sm font-medium">
                  <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                  Applications open · deadline honoured
                </div>
              ) : (
                <div className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-black/25 border border-white/10 text-sm">
                  <CalendarClock className="w-5 h-5 shrink-0" />
                  Waiting for CHMS or deadline passed
                </div>
              )}
            </div>
          </div>

          {!openCycle && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-5 text-amber-950 mb-8">
              <p className="font-semibold">Applications are closed</p>
              <p className="text-sm mt-1 text-amber-900/85">
                There is no open housing round. Check published rounds on your dashboard once CHMS opens a cycle.
              </p>
            </div>
          )}

          {openCycle && !deadlineOk && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-5 text-red-950 mb-8">
              <p className="font-semibold">Deadline passed</p>
              <p className="text-sm mt-1">
                This round closed on <strong>{new Date(openCycle.deadline!).toLocaleString()}</strong>.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
            {/* House & cycle panel */}
            <div className="lg:col-span-2 space-y-4 lg:sticky lg:top-6">
              {openCycle && deadlineOk && (
                <>
                  <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="flex items-center gap-2 px-5 py-3 bg-slate-900 text-white text-sm font-semibold">
                      <Home className="w-4 h-4 opacity-90" />
                      Listed house · this cycle
                    </div>
                    {houseImages.length > 0 && (
                      <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100">
                        {houseImages.slice(0, 6).map((rel, idx) => (
                          <button
                            type="button"
                            key={`${rel}-${idx}`}
                            onClick={() => window.open(uploadsPublicUrl(rel), '_blank')}
                            className="relative aspect-square rounded-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-indigo-400"
                          >
                            <img src={uploadsPublicUrl(rel)} alt="" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="p-5 space-y-4 text-sm">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Cycle</p>
                        <p className="font-bold text-slate-900 text-lg leading-tight">{openCycle.title ?? '—'}</p>
                        {openCycle.roundLabel ? (
                          <p className="text-slate-600 mt-0.5">{openCycle.roundLabel}</p>
                        ) : null}
                      </div>
                      {openCycle.description ? (
                        <p className="text-slate-700 leading-relaxed">{openCycle.description}</p>
                      ) : null}

                      <div className="grid grid-cols-1 gap-3">
                        {(openCycle.applicationFee != null || openCycle.monthlyPayment != null) && (
                          <div className="rounded-xl bg-indigo-50 border border-indigo-100 px-4 py-3 flex flex-wrap gap-4">
                            {openCycle.applicationFee != null && (
                              <div className="flex items-start gap-2 min-w-[44%]">
                                <Wallet className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-[11px] uppercase text-indigo-600 font-semibold">Application fee</p>
                                  <p className="text-base font-bold text-slate-900">
                                    {openCycle.applicationFee.toLocaleString()} ETB
                                  </p>
                                </div>
                              </div>
                            )}
                            {openCycle.monthlyPayment != null && (
                              <div className="flex items-start gap-2 min-w-[44%]">
                                <Building2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-[11px] uppercase text-indigo-600 font-semibold">Monthly</p>
                                  <p className="text-base font-bold text-slate-900">
                                    {openCycle.monthlyPayment.toLocaleString()} ETB
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex gap-3 flex-wrap">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-medium">
                            <Zap className="w-3.5 h-3.5" />
                            Power: {ynLabel(openCycle.electricityService)}
                          </span>
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-medium">
                            <Droplets className="w-3.5 h-3.5" />
                            Water: {ynLabel(openCycle.waterService)}
                          </span>
                        </div>

                        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-[13px]">
                          <div>
                            <dt className="text-slate-500">House type</dt>
                            <dd className="font-semibold text-slate-900">{openCycle.houseType ?? '—'}</dd>
                          </div>
                          <div>
                            <dt className="text-slate-500">Bed / bath</dt>
                            <dd className="font-semibold text-slate-900">
                              {openCycle.bedrooms ?? '—'} / {openCycle.bathrooms ?? '—'}
                            </dd>
                          </div>
                          <div className="col-span-2">
                            <dt className="text-slate-500">Campus · block · number</dt>
                            <dd className="font-semibold text-slate-900">
                              {[openCycle.campusName, openCycle.blockName, openCycle.houseNumber]
                                .filter(Boolean)
                                .join(' · ') || '—'}
                            </dd>
                          </div>
                          <div className="col-span-2">
                            <dt className="flex items-center gap-1 text-slate-500">
                              <CalendarClock className="w-3.5 h-3.5" /> Apply before
                            </dt>
                            <dd className="font-semibold text-indigo-700">
                              {openCycle.deadline
                                ? new Date(openCycle.deadline).toLocaleString()
                                : '—'}
                            </dd>
                          </div>
                        </dl>

                        {openCycle.houseDetails ? (
                          <p className="text-xs text-slate-600 border-l-2 border-teal-500 pl-3 py-1">
                            {openCycle.houseDetails}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Form */}
            <div className="lg:col-span-3 space-y-6">
              <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-6 shadow-inner">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-amber-500" />
                      Your weighted score preview
                    </h3>
                    <p className="text-sm text-slate-600 mt-1 max-w-md">
                      Academic level (50%), years of service (25%), job responsibility (15%), marital status (10%).
                      Disability bonus applies for qualifying female applicants.
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 tabular-nums">
                      {currentScore}
                    </p>
                    <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">out of 100</p>
                  </div>
                </div>

                <ul className="mt-5 grid sm:grid-cols-2 gap-2">
                  {(
                    [
                      ['Academic', scoreBreakdown.academic.value],
                      ['Service', scoreBreakdown.service.value],
                      ['Job role', scoreBreakdown.job.value],
                      ['Marital', scoreBreakdown.marital.value],
                      ['Disability bonus', scoreBreakdown.disability.value],
                    ] as const
                  ).map(([label, pts]) =>
                    pts > 0 ? (
                      <li
                        key={label}
                        className="flex justify-between text-xs bg-white/70 border border-blue-50 rounded-lg px-3 py-1.5"
                      >
                        <span className="text-slate-600">{label}</span>
                        <span className="font-bold text-blue-900">+{pts}</span>
                      </li>
                    ) : null
                  )}
                </ul>
              </div>

              <form
                onSubmit={handleSubmit}
                className={`rounded-2xl border border-slate-200 bg-white p-8 shadow-lg shadow-slate-200/70 space-y-6 ${
                  !canApply ? 'opacity-65 pointer-events-none' : ''
                }`}
              >
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Gender <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition mb-5"
                    >
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>

                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Academic level <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="academicLevel"
                      value={formData.academicLevel}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition"
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Years of service <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="yearsOfService"
                        value={formData.yearsOfService}
                        onChange={handleChange}
                        required
                        min={0}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Marital status <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="maritalStatus"
                        value={formData.maritalStatus}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Select</option>
                        <option value="Single">Single</option>
                        <option value="Married">Married</option>
                        <option value="Divorced">Divorced</option>
                        <option value="Widowed">Widowed</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Number of children <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="childrenCount"
                        value={formData.childrenCount}
                        onChange={handleChange}
                        required
                        min={0}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Job responsibility <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="jobResponsibility"
                      value={formData.jobResponsibility}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select</option>
                      <option value="Dean">Dean</option>
                      <option value="Department Head">Department Head</option>
                      <option value="Lecturer">Lecturer</option>
                      <option value="Assistant Lecturer">Assistant Lecturer</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <label className="flex items-center gap-3 cursor-pointer rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                    <input
                      type="checkbox"
                      name="isDisabled"
                      checked={formData.isDisabled}
                      onChange={handleChange}
                      className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-slate-700">
                      Disability declaration
                      {user?.gender === 'Female' ? (
                        <span className="text-indigo-600 font-medium">
                          {' '}
                          (female applicant bonus applies when eligible)
                        </span>
                      ) : null}
                    </span>
                  </label>
                </div>

                <div className="border-t border-slate-100 pt-6 grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2 rounded-xl bg-slate-900 text-white p-5">
                    <p className="text-xs uppercase text-slate-400 font-semibold">Applicant snapshot</p>
                    <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                      <div>
                        <span className="text-slate-400">Name</span>
                        <p className="font-semibold">
                          {user?.firstName} {user?.lastName}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-400">Email</span>
                        <p className="font-semibold truncate">{user?.email}</p>
                      </div>
                      <div>
                        <span className="text-slate-400">Calculated score</span>
                        <p className="font-bold text-amber-400 text-lg">{currentScore}/100</p>
                      </div>
                      <div>
                        <span className="text-slate-400">Today</span>
                        <p className="font-semibold">{new Date().toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!canApply}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold shadow-lg hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                  >
                    {canApply ? 'Submit application' : 'Applications closed'}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/applicant')}
                    className="w-full py-3.5 rounded-xl border border-slate-300 text-slate-800 font-semibold hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}
