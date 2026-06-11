import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import { API_BASE_URL } from '../../lib/apiBase';
import {
  Building2,
  Home,
  Users,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Briefcase,
  GraduationCap,
  Calendar,
  Layers,
  Phone,
  Mail,
  Loader2,
} from 'lucide-react';
import React from 'react';

interface Stats {
  overall: {
    totalBlocks: number;
    totalHouses: number;
    totalActiveResidents: number;
  };
  houseStats: Record<string, { occupied: number; available: number }>;
  applications: Array<{
    id: string;
    title: string;
    created_at: string;
    deadline: string;
    status: string;
    total_applicants: number;
  }>;
}

interface HouseConfig {
  id: string;
  houseType: string;
  campusId: string;
  campusName: string;
  monthlyPayment: number;
  numberOfHouses: number;
}

interface ApplicantInfo {
  id: string;
  userId: string;
  gender: string;
  academicLevel: string;
  yearsOfService: number;
  maritalStatus: string;
  jobResponsibility: string;
  isDisabled: boolean;
  disabilityType: string;
  childrenCount: number;
  status: string;
  score: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
}

interface CycleDetailsData {
  cycle: any;
  houses: HouseConfig[];
  applicants: ApplicantInfo[];
}

export default function ManagerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  // Expandable details states
  const [expandedCycleId, setExpandedCycleId] = useState<string | null>(null);
  const [cycleDetails, setCycleDetails] = useState<CycleDetailsData | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'manager') {
      navigate('/login');
      return;
    }

    const fetchStats = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/manager/stats.php`);
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch manager stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user, navigate]);

  const handleToggleExpand = async (cycleId: string) => {
    if (expandedCycleId === cycleId) {
      setExpandedCycleId(null);
      setCycleDetails(null);
      return;
    }

    setExpandedCycleId(cycleId);
    setLoadingDetails(true);
    setCycleDetails(null);

    try {
      const response = await fetch(`${API_BASE_URL}/manager/cycle_details.php?id=${cycleId}`);
      if (response.ok) {
        const data = await response.json();
        setCycleDetails(data);
      } else {
        console.error('Failed to load cycle details');
      }
    } catch (err) {
      console.error('Error fetching cycle details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  if (loading) {
    return (
      <Layout role="manager">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </Layout>
    );
  }

  if (!stats) {
    return (
      <Layout role="manager">
        <div className="p-8 text-center text-red-500 font-semibold">
          Error loading dashboard statistics.
        </div>
      </Layout>
    );
  }

  return (
    <Layout role="manager">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Manager Dashboard</h1>
          <p className="text-slate-600">Overview of CHMS-system-wide housing statistics and cycle applicants management.</p>
        </div>

        {/* Overall Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-6 rounded-2xl shadow-md text-white flex items-center gap-5 hover:scale-102 hover:shadow-lg transition-all duration-300 group">
            <div className="bg-white/10 p-4 rounded-xl text-white backdrop-blur-md group-hover:scale-110 transition-transform">
              <Building2 className="w-8 h-8" />
            </div>
            <div>
              <p className="text-xs text-blue-100 font-bold uppercase tracking-wider">Total Blocks</p>
              <p className="text-3xl font-extrabold mt-0.5">{stats.overall.totalBlocks}</p>
            </div>
          </div>
          <div className="bg-gradient-to-br from-violet-500 to-purple-600 p-6 rounded-2xl shadow-md text-white flex items-center gap-5 hover:scale-102 hover:shadow-lg transition-all duration-300 group">
            <div className="bg-white/10 p-4 rounded-xl text-white backdrop-blur-md group-hover:scale-110 transition-transform">
              <Home className="w-8 h-8" />
            </div>
            <div>
              <p className="text-xs text-violet-100 font-bold uppercase tracking-wider">Total Houses</p>
              <p className="text-3xl font-extrabold mt-0.5">{stats.overall.totalHouses}</p>
            </div>
          </div>
          <div className="bg-gradient-to-br from-emerald-400 to-teal-500 p-6 rounded-2xl shadow-md text-white flex items-center gap-5 hover:scale-102 hover:shadow-lg transition-all duration-300 group">
            <div className="bg-white/10 p-4 rounded-xl text-white backdrop-blur-md group-hover:scale-110 transition-transform">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <p className="text-xs text-emerald-500/10 font-bold uppercase tracking-wider text-emerald-50">Active Residents</p>
              <p className="text-3xl font-extrabold mt-0.5">{stats.overall.totalActiveResidents}</p>
            </div>
          </div>
        </div>

        {/* Houses by Type */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Houses Availability Breakdown Based On House Type</h2>
              <p className="text-xs text-slate-500 mt-0.5">System-wide totals across all campuses</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 p-6 bg-slate-50/20">
            {['studio', 'one_bedroom', 'two_bedroom', 'three_bedroom'].map((type) => {
              const data = stats.houseStats[type] || { occupied: 0, available: 0 };
              const label = type.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
              const total = data.available + data.occupied;
              const occupancyRate = total > 0 ? (data.occupied / total) * 100 : 0;
              return (
                <div key={type} className="border border-slate-150 rounded-2xl p-5 bg-white hover:shadow-md hover:border-indigo-200 transition-all duration-300 group hover:-translate-y-0.5">
                  <h3 className="font-bold text-slate-800 text-sm mb-3.5 group-hover:text-indigo-600 transition-colors">{label}</h3>
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Available
                      </span>
                      <span className="font-bold text-slate-900 bg-emerald-50 px-2.5 py-0.5 rounded text-[11px]">{data.available} units</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="flex items-center gap-1.5 text-rose-500 font-medium">
                        <XCircle className="w-3.5 h-3.5" /> Occupied
                      </span>
                      <span className="font-bold text-slate-900 bg-rose-50 px-2.5 py-0.5 rounded text-[11px]">{data.occupied} units</span>
                    </div>

                    {/* Occupancy Progress Bar */}
                    <div className="pt-2 border-t border-slate-50">
                      <div className="flex justify-between items-center text-[10px] text-slate-405 font-medium mb-1">
                        <span className="text-slate-400">Occupancy Rate</span>
                        <span className="font-bold text-slate-600">{Math.round(occupancyRate)}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-600 h-full rounded-full transition-all duration-500"
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

        {/* Application Cycles Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
            <h2 className="text-lg font-bold text-slate-800">Launched Applications & Cycles</h2>
            <p className="text-xs text-slate-500 mt-0.5">Click on any row to expand house offerings and see the applicants list.</p>
          </div>
          <div className="p-0 overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="w-12 px-6 py-3"></th>
                  <th className="px-6 py-3 text-left">Title</th>
                  <th className="px-6 py-3 text-left">Opened Date</th>
                  <th className="px-6 py-3 text-left">Deadline</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-center">Total Applicants</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.applications.map((app) => {
                  const isExpanded = expandedCycleId === app.id;
                  return (
                    <React.Fragment key={app.id}>
                      {/* Parent Cycle Row */}
                      <tr
                        onClick={() => handleToggleExpand(app.id)}
                        className={`cursor-pointer hover:bg-indigo-50/20 transition-colors ${isExpanded ? 'bg-indigo-50/10' : ''
                          }`}
                      >
                        <td className="px-6 py-4 text-center">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-indigo-600 mx-auto" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400 mx-auto" />
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                          {app.title || 'Untitled Cycle'}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {new Date(app.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                          {app.deadline ? new Date(app.deadline).toLocaleDateString() : 'No deadline'}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold ${app.status === 'open'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-200 text-slate-800'
                              }`}
                          >
                            {app.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 font-bold text-center">
                          {app.total_applicants}
                        </td>
                      </tr>

                      {/* Expanded Sub-row details */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={6} className="px-8 py-6 bg-slate-50/50 border-t border-slate-100">
                            {loadingDetails ? (
                              <div className="flex items-center gap-2 text-sm text-slate-500 py-4 justify-center">
                                <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                                <span>Fetching configurations and applicant lists...</span>
                              </div>
                            ) : cycleDetails ? (
                              <div className="space-y-6">
                                {/* Houses offerings list */}
                                <div className="space-y-3">
                                  <h4 className="text-xs uppercase font-extrabold tracking-wider text-slate-500 flex items-center gap-1.5">
                                    <Home className="w-3.5 h-3.5 text-indigo-600" />
                                    Advertised Houses Configurations
                                  </h4>
                                  {cycleDetails.houses.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                      {cycleDetails.houses.map((house, idx) => (
                                        <div
                                          key={house.id || idx}
                                          className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm"
                                        >
                                          <p className="font-bold text-slate-900 text-sm">
                                            {house.houseType}
                                          </p>
                                          <p className="text-xs text-slate-600 mt-1">
                                            Campus: <span className="font-semibold">{house.campusName}</span>
                                          </p>
                                          <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-slate-100 text-xs">
                                            <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-medium">
                                              {house.monthlyPayment.toLocaleString()} ETB/mo
                                            </span>
                                            <span className="text-slate-500 font-semibold">
                                              {house.numberOfHouses} units
                                            </span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-xs text-slate-500 bg-white border border-slate-100 p-4 rounded-xl italic">
                                      No detailed config found. Legacy single unit: {cycleDetails.cycle.houseType} at Campus ID {cycleDetails.cycle.campusId}.
                                    </p>
                                  )}
                                </div>

                                {/* Applicants list */}
                                <div className="space-y-3">
                                  <h4 className="text-xs uppercase font-extrabold tracking-wider text-slate-500 flex items-center gap-1.5">
                                    <Users className="w-3.5 h-3.5 text-indigo-600" />
                                    Registered Applicants Details ({cycleDetails.applicants.length})
                                  </h4>
                                  {cycleDetails.applicants.length > 0 ? (
                                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                      <table className="w-full text-xs">
                                        <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200 text-[10px]">
                                          <tr>
                                            <th className="px-4 py-2.5 text-left">Rank</th>
                                            <th className="px-4 py-2.5 text-left">Applicant Name</th>
                                            <th className="px-4 py-2.5 text-center">Score</th>
                                            <th className="px-4 py-2.5 text-left">Academic & Service</th>
                                            <th className="px-4 py-2.5 text-left">Responsibility & Disability</th>
                                            <th className="px-4 py-2.5 text-left">Contact Info</th>
                                            <th className="px-4 py-2.5 text-center">Status</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                          {cycleDetails.applicants.map((applicant, rankIdx) => (
                                            <tr key={applicant.id} className="hover:bg-slate-50/50">
                                              <td className="px-4 py-3 font-bold text-slate-400 text-left">
                                                #{rankIdx + 1}
                                              </td>
                                              <td className="px-4 py-3 font-semibold text-slate-900">
                                                {applicant.firstName} {applicant.lastName}
                                                <span className="block text-[10px] text-slate-400 font-normal">
                                                  {applicant.gender} · {applicant.maritalStatus}
                                                </span>
                                              </td>
                                              <td className="px-4 py-3 text-center">
                                                <span className="inline-block bg-indigo-50 text-indigo-800 font-bold px-2 py-0.5 rounded text-xs">
                                                  {applicant.score}
                                                </span>
                                              </td>
                                              <td className="px-4 py-3 text-slate-700">
                                                <div className="flex items-center gap-1.5">
                                                  <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                                                  <span>{applicant.academicLevel}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 mt-0.5 text-slate-500">
                                                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                  <span>{applicant.yearsOfService} years service</span>
                                                </div>
                                              </td>
                                              <td className="px-4 py-3 text-slate-700">
                                                <div className="flex items-center gap-1.5">
                                                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                                                  <span>{applicant.jobResponsibility || 'None'}</span>
                                                </div>
                                                {applicant.isDisabled && (
                                                  <div className="flex items-center gap-1.5 mt-0.5 text-amber-600 font-medium">
                                                    <Layers className="w-3.5 h-3.5" />
                                                    <span>Disability: {applicant.disabilityType || 'Yes'}</span>
                                                  </div>
                                                )}
                                              </td>
                                              <td className="px-4 py-3 text-slate-600">
                                                <div className="flex items-center gap-1">
                                                  <Mail className="w-3 h-3 text-slate-400" />
                                                  <span>{applicant.email}</span>
                                                </div>
                                                <div className="flex items-center gap-1 mt-0.5">
                                                  <Phone className="w-3 h-3 text-slate-400" />
                                                  <span>{applicant.phoneNumber || '—'}</span>
                                                </div>
                                              </td>
                                              <td className="px-4 py-3 text-center">
                                                <span
                                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${applicant.status === 'placed'
                                                    ? 'bg-green-100 text-green-800'
                                                    : applicant.status === 'approved'
                                                      ? 'bg-blue-100 text-blue-800'
                                                      : applicant.status === 'rejected'
                                                        ? 'bg-red-100 text-red-800'
                                                        : 'bg-yellow-100 text-yellow-800'
                                                    }`}
                                                >
                                                  {applicant.status.toUpperCase()}
                                                </span>
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  ) : (
                                    <p className="text-xs text-slate-500 bg-white border border-slate-100 p-4 rounded-xl italic">
                                      No applicants have registered for this housing cycle yet.
                                    </p>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <p className="text-xs text-red-500">Failed to load cycle details.</p>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
                {stats.applications.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                      No applications found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
