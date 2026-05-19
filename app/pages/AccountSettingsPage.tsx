import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../context/AuthContext';
import Layout from '../components/Layout';
import {
  Bell,
  Info,
  Lock,
  Loader2,
  Mail,
  Save,
  Shield,
  Smartphone,
  User,
} from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from 'sonner';
import { API_BASE_URL } from '../lib/apiBase';

type LayoutRole = 'applicant' | 'campus_admin' | 'chms_admin';

type NotificationPreferences = {
  emailChannel: boolean;
  smsChannel: boolean;
  pushChannel: boolean;
  housingApplicationUpdates: boolean;
  lotteryAndPlacementAlerts: boolean;
  paymentReminders: boolean;
  residentRequestsAndMaintenance: boolean;
  systemAnnouncements: boolean;
  marketingOptIn: boolean;
};

type ApplicantDetailsApi = {
  gender: string | null;
  academicLevel: string | null;
  yearsOfService: number;
  maritalStatus: string | null;
  jobResponsibility: string | null;
  isDisabled: boolean;
  disabilityType: string | null;
  applicationStatus: string | null;
  applicationId: string | null;
  score: number;
  employmentFieldsLocked: boolean;
} | null;

type TabId = 'profile' | 'security' | 'notifications' | 'about';

const NOTIF_COPY: Record<keyof NotificationPreferences, { title: string; detail: string }> = {
  emailChannel: {
    title: 'Email alerts',
    detail:
      'Receive official messages sent by CHMS administrators and campus coordinators to your registered email inbox.',
  },
  smsChannel: {
    title: 'SMS / text (optional)',
    detail:
      'If your institution adopts SMS gateways later, opting in reserves your line for urgent housing and payment bursts only.',
  },
  pushChannel: {
    title: 'In-app & browser reminders',
    detail:
      'Surface highlights while you browse OCHMS (lottery postings, replies to requests, unread notices). Disabled by default.',
  },
  housingApplicationUpdates: {
    title: 'Housing applications',
    detail:
      'Deadlines shifts, reviewer decisions on your submission, corrections requested, or when placement staff need more information.',
  },
  lotteryAndPlacementAlerts: {
    title: 'Lottery & placement',
    detail:
      'Draw outcomes, provisional assignments, confirmations, wait-list movement, and move-in checkpoints.',
  },
  paymentReminders: {
    title: 'Fees & invoicing',
    detail:
      'Application fee confirmations, installment reminders, bounced receipts, plus verification notes from treasury teams.',
  },
  residentRequestsAndMaintenance: {
    title: 'Resident workflows',
    detail:
      'Maintenance tickets, grievances, housekeeping rounds, inspections, keys, utilities, leave-house paperwork, plus campus approvals.',
  },
  systemAnnouncements: {
    title: 'Operational notices',
    detail:
      'Scheduled downtime, cybersecurity advisories, process changes, handbook refreshes—everything that touches every role.',
  },
  marketingOptIn: {
    title: 'Optional updates',
    detail:
      'Low-frequency messages about webinars, trainings, wellbeing programs, etc. Completely optional and seldom sent.',
  },
};

interface Props {
  layoutRole: LayoutRole;
}

export default function AccountSettingsPage({ layoutRole }: Props) {
  const { user, patchUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('profile');
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: '' as '' | 'Male' | 'Female',
    academicLevel: '',
    yearsOfService: 0,
    maritalStatus: '',
    jobResponsibility: '',
    isDisabled: false,
    disabilityType: '',
  });
  const [employmentLocked, setEmploymentLocked] = useState(false);

  const [prefs, setPrefs] = useState<NotificationPreferences>({
    emailChannel: true,
    smsChannel: false,
    pushChannel: false,
    housingApplicationUpdates: true,
    lotteryAndPlacementAlerts: true,
    paymentReminders: true,
    residentRequestsAndMaintenance: true,
    systemAnnouncements: true,
    marketingOptIn: false,
  });

  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });

  useEffect(() => {
    const expected: UserRole =
      layoutRole === 'chms_admin' ? 'chms_admin' : layoutRole === 'campus_admin' ? 'campus_admin' : 'applicant';

    if (!user || user.role !== expected) {
      navigate('/login');
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/users/read_profile.php?userId=${encodeURIComponent(user.id)}`);
        const raw = await res.json().catch(() => ({}));

        if (!res.ok || !raw.user) {
          toast.error((raw as { message?: string }).message ?? 'Unable to load your profile.');
          setLoading(false);
          return;
        }

        type ReadProfile = {
          user: {
            id: string;
            firstName: string;
            lastName: string;
            email: string;
            phone?: string | null;
            role: UserRole;
            campusId?: string | null;
            campusName?: string | null;
          };
          notificationPreferences: Partial<NotificationPreferences>;
          applicantDetails: ApplicantDetailsApi;
        };
        const data = raw as unknown as ReadProfile;

        if (cancelled) return;

        const g =
          layoutRole === 'applicant'
            ? data.applicantDetails?.gender === 'Female' || data.applicantDetails?.gender === 'Male'
              ? data.applicantDetails!.gender!
              : ''
            : '';

        setProfileData({
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          email: data.user.email,
          phone: typeof data.user.phone === 'string' ? data.user.phone : '',
          gender: g as '' | 'Male' | 'Female',
          academicLevel: data.applicantDetails?.academicLevel ?? '',
          yearsOfService: data.applicantDetails?.yearsOfService ?? 0,
          maritalStatus: data.applicantDetails?.maritalStatus ?? '',
          jobResponsibility: data.applicantDetails?.jobResponsibility ?? '',
          isDisabled: Boolean(data.applicantDetails?.isDisabled),
          disabilityType: data.applicantDetails?.disabilityType ?? '',
        });
        setEmploymentLocked(Boolean(data.applicantDetails?.employmentFieldsLocked));
        const np = data.notificationPreferences ?? {};
        setPrefs((prev) => {
          const next = { ...prev };
          (Object.keys(prev) as (keyof NotificationPreferences)[]).forEach((key) => {
            if (np[key] !== undefined) next[key] = Boolean(np[key]);
          });
          return next;
        });

        patchUser({
          id: user.id,
          email: data.user.email,
          firstName: data.user.firstName as string,
          lastName: data.user.lastName as string,
          phone: typeof data.user.phone === 'string' ? data.user.phone : undefined,
          campusId: (data.user as { campusId?: string | null }).campusId,
          campusName: (data.user as { campusName?: string | null }).campusName,
          ...(layoutRole === 'applicant' && data.applicantDetails
            ? {
                gender: data.applicantDetails.gender ?? undefined,
                academicLevel: data.applicantDetails.academicLevel ?? undefined,
                yearsOfService: data.applicantDetails.yearsOfService,
                maritalStatus: data.applicantDetails.maritalStatus ?? undefined,
                jobResponsibility: data.applicantDetails.jobResponsibility ?? undefined,
                isDisabled: data.applicantDetails.isDisabled,
                disabilityType: data.applicantDetails.disabilityType ?? undefined,
              }
            : {}),
        });
      } catch {
        if (!cancelled) toast.error('Network error loading profile.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // Omit full `user` from deps — patchUser merges profile into session without needing a reload loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-fetch when id or portal changes
  }, [user?.id, layoutRole, navigate, patchUser]);

  const handleProfileSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSavingProfile(true);
    try {
      const body: Record<string, unknown> = {
        userId: user.id,
        firstName: profileData.firstName.trim(),
        lastName: profileData.lastName.trim(),
        email: profileData.email.trim(),
        phone: profileData.phone.trim() || '',
      };

      if (layoutRole === 'applicant' && !employmentLocked) {
        body.applicantDetails = {
          gender: profileData.gender || null,
          academicLevel: profileData.academicLevel,
          yearsOfService: Number(profileData.yearsOfService) || 0,
          maritalStatus: profileData.maritalStatus,
          jobResponsibility: profileData.jobResponsibility,
          isDisabled: profileData.isDisabled,
          disabilityType: profileData.disabilityType,
        };
      }

      const res = await fetch(`${API_BASE_URL}/users/update_profile.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = (await res.json().catch(() => ({}))) as {
        message?: string;
        user?: {
          id: string;
          firstName: string;
          lastName: string;
          email: string;
          phone?: string | null;
          campusId?: string | null;
          campusName?: string | null;
        };
        applicantDetails?: ApplicantDetailsApi;
      };

      if (!res.ok) {
        toast.error(data.message ?? 'Unable to save profile.');
        return;
      }

      toast.success(data.message ?? 'Profile saved.');
      if (data.user) {
        patchUser({
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          email: data.user.email,
          phone: typeof data.user.phone === 'string' ? data.user.phone : undefined,
          campusId: data.user.campusId ?? undefined,
          campusName: data.user.campusName ?? undefined,
        });
      }
      if (layoutRole === 'applicant' && data.applicantDetails) {
        patchUser({
          gender: data.applicantDetails.gender ?? undefined,
          academicLevel: data.applicantDetails.academicLevel ?? undefined,
          yearsOfService: data.applicantDetails.yearsOfService,
          maritalStatus: data.applicantDetails.maritalStatus ?? undefined,
          jobResponsibility: data.applicantDetails.jobResponsibility ?? undefined,
          isDisabled: data.applicantDetails.isDisabled,
          disabilityType: data.applicantDetails.disabilityType ?? undefined,
        });
        setEmploymentLocked(Boolean(data.applicantDetails.employmentFieldsLocked));
      }
    } catch {
      toast.error('Network error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePrefsSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSavingPrefs(true);
    try {
      const res = await fetch(`${API_BASE_URL}/users/update_profile.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, notificationPreferences: prefs }),
      });

      const data = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) {
        toast.error(data.message ?? 'Unable to save notification preferences.');
        return;
      }
      toast.success(data.message ?? 'Notification preferences saved.');
    } catch {
      toast.error('Network error');
    } finally {
      setSavingPrefs(false);
    }
  };

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!pw.current || !pw.next || !pw.confirm) {
      toast.error('Fill in current password, new password, and confirmation.');
      return;
    }

    if (pw.next !== pw.confirm) {
      toast.error('New password and confirmation do not match.');
      return;
    }

    if (pw.next.length < 6) {
      toast.error('New password must be at least 6 characters.');
      return;
    }

    setChangingPw(true);
    try {
      const res = await fetch(`${API_BASE_URL}/users/change_password.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          currentPassword: pw.current,
          newPassword: pw.next,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) {
        toast.error(data.message ?? 'Unable to change password.');
        return;
      }
      toast.success(data.message ?? 'Password updated.');
      setPw({ current: '', next: '', confirm: '' });
    } catch {
      toast.error('Network error');
    } finally {
      setChangingPw(false);
    }
  };

  const roleLabel =
    layoutRole === 'applicant'
      ? 'Applicant Portal'
      : layoutRole === 'campus_admin'
        ? 'Campus administration'
        : 'CHMS system administration';

  if (!user || loading) {
    return (
      <Layout role={layoutRole}>
        <div className="flex items-center justify-center min-h-[40vh] text-slate-500 gap-3">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span>Loading your profile…</span>
        </div>
      </Layout>
    );
  }

  const tabs: { id: TabId; label: string; icon: typeof User }[] = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'about', label: 'About OCHMS', icon: Info },
  ];

  return (
    <>
      <Toaster position="top-right" />
      <Layout role={layoutRole}>
        <div className="max-w-6xl mx-auto pb-16">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-900 to-violet-900 text-white p-8 md:p-10 mb-10 shadow-xl">
            <div className="absolute inset-0 opacity-35 bg-[radial-gradient(circle_at_15%_-20%,#fff9,transparent_45%),radial-gradient(circle_at_85%_40%,#7c3aed99,transparent_45%)]" />
            <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <p className="text-sm font-medium text-indigo-200">{roleLabel}</p>
                <h1 className="text-3xl md:text-4xl font-bold mt-2">Account & preferences</h1>
                <p className="text-indigo-100/95 mt-4 max-w-2xl leading-relaxed">
                  Keep your Wolaita Sodo profile accurate, tighten security, tune how CHMS notifies you around housing,
                  fees, placements, resident services, and system-wide notices.
                </p>
              </div>
              <div className="rounded-2xl bg-white/12 backdrop-blur border border-white/20 px-5 py-4 text-sm">
                <p className="font-semibold text-white">{`${user.firstName} ${user.lastName}`}</p>
                <p className="text-indigo-200 flex items-center gap-2 mt-1 truncate max-w-[240px]">
                  <Mail className="w-4 h-4 shrink-0" />
                  {user.email}
                </p>
                {user.campusName ? (
                  <p className="text-indigo-200 text-xs mt-2">Campus: {user.campusName}</p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            <nav className="lg:w-56 shrink-0">
              <div className="flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 -mx-1 px-1 lg:bg-white lg:rounded-2xl lg:border lg:border-slate-200 lg:p-3 lg:shadow-sm">
                {tabs.map((t) => {
                  const Icon = t.icon;
                  const selected = activeTab === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setActiveTab(t.id)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium whitespace-nowrap transition-colors shrink-0 ${
                        selected
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 lg:shadow-none'
                          : 'bg-white text-slate-700 border border-slate-200 lg:border-0 lg:bg-transparent hover:bg-slate-50'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${selected ? '' : 'text-slate-500'}`} />
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </nav>

            <section className="flex-1 min-w-0">
              {activeTab === 'profile' && (
                <div className="rounded-3xl bg-white border border-slate-200 shadow-lg shadow-slate-200/50 p-8 md:p-10">
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-6">
                    <User className="w-6 h-6 text-indigo-600" /> Profile details
                  </h2>

                  <form onSubmit={handleProfileSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">First name</label>
                        <input
                          required
                          value={profileData.firstName}
                          onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Last name</label>
                        <input
                          required
                          value={profileData.lastName}
                          onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                        <input
                          type="email"
                          required
                          value={profileData.email}
                          onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Phone</label>
                        <input
                          type="tel"
                          value={profileData.phone}
                          onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                          placeholder="+251 ..."
                        />
                      </div>
                    </div>

                    {layoutRole === 'applicant' && (
                      <div className="rounded-2xl border border-amber-200 bg-amber-50/70 px-5 py-4 mb-6">
                        <p className="font-semibold text-amber-950 mb-2">Applicant demographics</p>
                        {employmentLocked ? (
                          <p className="text-sm text-amber-900/95 leading-relaxed">
                            Fields below are tied to an active housing application (pending approval, lottery queue, or
                            placement). Updating them requires admin reset or re-entry after rejection. Contact CHMS help
                            if something is materially wrong—or keep using your applicant dashboard for statuses.
                          </p>
                        ) : (
                          <p className="text-sm text-amber-900/95 leading-relaxed">
                            You may adjust these anytime before submitting a housing application—or after a rejected
                            round—because they contribute to eligibility scoring whenever you submit.
                          </p>
                        )}
                        <div className="grid md:grid-cols-2 gap-5 mt-5">
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Gender</label>
                            <select
                              disabled={employmentLocked}
                              value={profileData.gender}
                              onChange={(e) =>
                                setProfileData({
                                  ...profileData,
                                  gender: e.target.value as '' | 'Male' | 'Female',
                                })
                              }
                              className="w-full px-4 py-3 rounded-xl border disabled:bg-slate-100 disabled:text-slate-500"
                            >
                              <option value="">Select…</option>
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Academic level</label>
                            <select
                              disabled={employmentLocked}
                              required={!employmentLocked}
                              value={profileData.academicLevel}
                              onChange={(e) => setProfileData({ ...profileData, academicLevel: e.target.value })}
                              className="w-full px-4 py-3 rounded-xl border disabled:bg-slate-100"
                            >
                              <option value="">Select…</option>
                              <option value="Bachelor">Bachelor</option>
                              <option value="Masters">Masters</option>
                              <option value="PhD">PhD</option>
                              <option value="Professor">Professor</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Years of service</label>
                            <input
                              type="number"
                              min={0}
                              disabled={employmentLocked}
                              value={profileData.yearsOfService || ''}
                              onChange={(e) =>
                                setProfileData({
                                  ...profileData,
                                  yearsOfService: parseInt(e.target.value || '0', 10),
                                })
                              }
                              className="w-full px-4 py-3 rounded-xl border disabled:bg-slate-100"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                              Job responsibility
                            </label>
                            <select
                              disabled={employmentLocked}
                              required={!employmentLocked}
                              value={profileData.jobResponsibility}
                              onChange={(e) =>
                                setProfileData({ ...profileData, jobResponsibility: e.target.value })
                              }
                              className="w-full px-4 py-3 rounded-xl border disabled:bg-slate-100"
                            >
                              <option value="">Select…</option>
                              <option value="Lecturer">Lecturer</option>
                              <option value="Assistant Lecturer">Assistant Lecturer</option>
                              <option value="Senior Lecturer">Senior Lecturer</option>
                              <option value="Department Head">Department Head</option>
                              <option value="Dean">Dean</option>
                            </select>
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Marital status</label>
                            <select
                              disabled={employmentLocked}
                              required={!employmentLocked}
                              value={profileData.maritalStatus}
                              onChange={(e) => setProfileData({ ...profileData, maritalStatus: e.target.value })}
                              className="w-full px-4 py-3 rounded-xl border disabled:bg-slate-100"
                            >
                              <option value="">Select…</option>
                              <option value="Single">Single</option>
                              <option value="Married">Married</option>
                              <option value="Divorced">Divorced</option>
                              <option value="Widowed">Widowed</option>
                            </select>
                          </div>
                          <div className="md:col-span-2 flex items-center gap-3">
                            <input
                              id="dis"
                              type="checkbox"
                              disabled={employmentLocked}
                              checked={profileData.isDisabled}
                              onChange={(e) => setProfileData({ ...profileData, isDisabled: e.target.checked })}
                              className="w-5 h-5 rounded border-slate-300 text-indigo-600 disabled:opacity-50"
                            />
                            <label htmlFor="dis" className="text-sm text-slate-700 cursor-pointer select-none">
                              Disability declaration (eligible female applicants qualify for fairness bonus scoring)
                            </label>
                          </div>
                          
                          {profileData.isDisabled && (
                            <div className="md:col-span-2">
                              <label className="block text-sm font-semibold text-slate-700 mb-2">Disability Type</label>
                              <select
                                disabled={employmentLocked}
                                required={profileData.isDisabled}
                                value={profileData.disabilityType}
                                onChange={(e) => setProfileData({ ...profileData, disabilityType: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border disabled:bg-slate-100"
                              >
                                <option value="">Select Disability Type</option>
                                <option value="Wheelchair / Paralysis">Wheelchair / Paralysis (15%)</option>
                                <option value="Total Blindness">Total Blindness (13%)</option>
                                <option value="Deafness (Complete Hearing Loss)">Deafness (Complete Hearing Loss) (11%)</option>
                                <option value="Missing Limb(s)">Missing Limb(s) (10%)</option>
                                <option value="Intellectual / Developmental Disability">Intellectual / Developmental Disability (9%)</option>
                                <option value="Partial Blindness / Low Vision">Partial Blindness / Low Vision (8%)</option>
                                <option value="Physical Mobility Problem">Physical Mobility Problem (7%)</option>
                                <option value="Severe Chronic Illness">Severe Chronic Illness (6%)</option>
                              </select>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold shadow-lg shadow-indigo-200 hover:opacity-95 disabled:opacity-50"
                    >
                      {savingProfile ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                      Save profile
                    </button>
                  </form>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="rounded-3xl bg-white border border-slate-200 shadow-lg shadow-slate-200/50 p-8 md:p-10 space-y-6">
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Lock className="w-6 h-6 text-violet-600" /> Password & access
                  </h2>
                  <p className="text-sm text-slate-600 leading-relaxed max-w-xl">
                    Use a unique passphrase you do not recycle from other portals. Updating your CHMS credential here
                    takes effect instantly for every OCHMS role you hold.
                  </p>
                  <form onSubmit={handlePasswordSubmit} className="space-y-5 max-w-md">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Current password <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        autoComplete="current-password"
                        value={pw.current}
                        onChange={(e) => setPw({ ...pw, current: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-violet-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        New password <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        autoComplete="new-password"
                        value={pw.next}
                        onChange={(e) => setPw({ ...pw, next: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-violet-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Confirm new password <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        autoComplete="new-password"
                        value={pw.confirm}
                        onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-violet-500"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={changingPw}
                      className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-violet-600 text-white font-semibold hover:bg-violet-700 disabled:opacity-50 shadow-md shadow-violet-200"
                    >
                      {changingPw ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
                      Update password
                    </button>
                  </form>
                </div>
              )}

              {activeTab === 'notifications' && (
                <form
                  onSubmit={handlePrefsSubmit}
                  className="rounded-3xl bg-white border border-slate-200 shadow-lg shadow-slate-200/50 p-8 md:p-10 space-y-8"
                >
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <Bell className="w-6 h-6 text-emerald-600" /> Notification preferences
                    </h2>
                    <p className="text-sm text-slate-600 mt-4 leading-relaxed max-w-3xl">
                      Decide which communication channels Wolaita Sodo University administrators may leverage for your
                      account and which topics merit an alert. Institutional broadcast rules still override silenced items
                      for critical safety—but most categories respect your sliders below.
                    </p>
                    <div className="flex flex-wrap gap-3 mt-5 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100">
                        <Mail className="w-3.5 h-3.5" /> Email
                      </span>
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100">
                        <Smartphone className="w-3.5 h-3.5" /> SMS (future-ready)
                      </span>
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100">
                        Push / inbox
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {(Object.keys(NOTIF_COPY) as (keyof NotificationPreferences)[]).map((key) => {
                      const copy = NOTIF_COPY[key];
                      const channel =
                        key === 'emailChannel' || key === 'smsChannel' || key === 'pushChannel' ? 'channel' : 'topic';

                      return (
                        <label
                          key={key}
                          className={`flex flex-col md:flex-row md:items-start gap-4 p-5 rounded-2xl border transition-colors cursor-pointer ${
                            prefs[key]
                              ? 'border-emerald-200 bg-emerald-50/70'
                              : 'border-slate-200 bg-slate-50/60 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-start gap-3 flex-1">
                            <input
                              type="checkbox"
                              className="mt-1 w-5 h-5 rounded border-slate-300 text-emerald-600"
                              checked={prefs[key]}
                              onChange={(e) => setPrefs({ ...prefs, [key]: e.target.checked })}
                            />
                            <div>
                              <p className="font-semibold text-slate-900">
                                {copy.title}{' '}
                                <span className="font-normal text-slate-400 text-xs ml-2">
                                  {channel === 'channel' ? 'channel' : 'topic'}
                                </span>
                              </p>
                              <p className="text-sm text-slate-600 mt-1 leading-relaxed">{copy.detail}</p>
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>

                  <button
                    type="submit"
                    disabled={savingPrefs}
                    className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-emerald-600 text-white font-semibold shadow-lg shadow-emerald-200 hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {savingPrefs ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    Save preferences
                  </button>
                </form>
              )}

              {activeTab === 'about' && (
                <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 text-white overflow-hidden shadow-2xl border border-white/10">
                  <div className="grid md:grid-cols-2 gap-10 p-8 md:p-12">
                    <div>
                      <h2 className="text-2xl font-bold">Online Condominium Housing Management System</h2>
                      <p className="uppercase tracking-wider text-emerald-300 text-xs mt-3 font-semibold">
                        Powered for Wolaita Sodo University
                      </p>
                      <p className="mt-6 text-indigo-100 leading-relaxed text-sm md:text-[15px]">
                        OCHMS unifies applicants, reviewers, treasury, campus coordinators, placement teams, residents,
                        lottery oversight, notifications, billing, analytics, reporting, audits, integrations, GIS-ready
                        block maps… all under one audited roof.
                      </p>
                      <p className="mt-5 text-white/90 leading-relaxed text-sm md:text-[15px]">
                        Transparency is foundational: dashboards surface open housing cycles with fees and deadlines,
                        applicants experience consistent scoring disclosures, admins close rounds deliberately, residences
                        move from lottery to placement logically, campuses verify payments and maintenance without paper
                        detours—while staff keep control inside secure settings tied to authenticated profiles.
                      </p>
                      <dl className="mt-10 space-y-3 text-sm bg-white/8 rounded-2xl p-6 border border-white/10">
                        <div className="flex justify-between gap-4 flex-wrap border-b border-white/10 pb-3">
                          <dt className="text-indigo-200">Edition</dt>
                          <dd className="font-semibold">OCHMS 1.4 (May 2026)</dd>
                        </div>
                        <div className="flex justify-between gap-4 flex-wrap border-b border-white/10 pb-3">
                          <dt className="text-indigo-200">Responsible office</dt>
                          <dd className="font-semibold">Campus Housing & Mobility Services</dd>
                        </div>
                        <div className="flex justify-between gap-4 flex-wrap">
                          <dt className="text-indigo-200">Support corridor</dt>
                          <dd className="font-semibold">support@wsu.edu.et</dd>
                        </div>
                      </dl>
                    </div>
                    <div className="rounded-3xl bg-white/10 backdrop-blur border border-white/20 p-8 space-y-5 text-sm md:text-[15px] leading-relaxed text-indigo-50">
                      <div>
                        <p className="font-bold text-white text-lg mb-2">Why these settings?</p>
                        <p className="text-indigo-100">
                          Institutional communication must respect Ethiopian data norms, equitable housing law, treasury
                          compliance, whistleblowing safety, GDPR-inspired minimization—even when workloads spike around
                          registration or lottery spikes.
                        </p>
                      </div>
                      <div>
                        <p className="font-bold text-white text-lg mb-2">Responsible use</p>
                        <ul className="list-disc ml-5 space-y-2 text-indigo-100">
                          <li>Never share OTPs or passwords—even with campus IT.</li>
                          <li>Housing quotas follow published policies; dashboards reflect live server status.</li>
                          <li>Notification toggles personalize helpful signals without muting mandated safety bursts.</li>
                        </ul>
                      </div>
                      <div className="rounded-2xl bg-emerald-500/15 border border-emerald-400/30 p-4 text-emerald-50">
                        <p className="font-semibold text-emerald-200">Eco note</p>
                        <p className="mt-2 text-sm">
                          Digitizing condominium workflows trims paper manifests, aligns solar campuses with green goals,
                          and keeps audit trails reproducible online.
                        </p>
                      </div>
                    </div>
                  </div>
                  <footer className="px-10 py-4 border-t border-white/10 bg-black/25 text-[11px] text-indigo-200">
                    © Wolaita Sodo University • Condominium housing digital services • Sensitive data — encrypt in transit
                  </footer>
                </div>
              )}
            </section>
          </div>
        </div>
      </Layout>
    </>
  );
}
