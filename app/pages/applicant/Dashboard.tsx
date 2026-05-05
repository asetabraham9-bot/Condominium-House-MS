import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import Layout from '../../components/Layout';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import { FileText, TrendingUp, DollarSign, Bell, Home as HomeIcon, Send, AlertCircle } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Toaster } from 'sonner';
import { API_BASE_URL, uploadsPublicUrl } from '../../lib/apiBase';

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

  useEffect(() => {
    if (!user || user.role !== 'applicant') {
      navigate('/login');
    }
  }, [user, navigate]);

  const userApplications = applications.filter((app) => app.applicantId === user?.id);
  const userResident = residents.find((r) => r.applicantId === user?.id);
  const userPayments = payments.filter((p) => p.residentId === userResident?.id);
  const userRequests = residentRequests.filter((r) => r.residentId === userResident?.id);
  const recentNotifications = notifications.slice(0, 5);

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

  return (
    <>
      <Toaster position="top-right" />
      <Layout role="applicant">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome, {user?.firstName}!</h1>
          <p className="text-gray-600 mb-8">Manage your condominium housing application and services</p>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
            <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mb-8">
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
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                request.priority === 'high' 
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
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-yellow-400 mr-3" />
                <p className="text-sm text-yellow-700">
                  You must be an active resident to submit requests to Campus Admin.
                </p>
              </div>
            </div>
          )}

          {/* Published housing rounds (all applicants can see) */}
          {housingCycles.length > 0 && (
            <div className="rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8 bg-white">
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
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              open && !past
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
                          {c.campusName || c.blockName || c.houseNumber ? (
                            <>
                              <dt className="text-slate-500">Location</dt>
                              <dd className="font-medium text-slate-900">
                                {[c.campusName, c.blockName, c.houseNumber].filter(Boolean).join(' · ')}
                              </dd>
                            </>
                          ) : null}
                          <dt className="text-slate-500">Electric / water</dt>
                          <dd className="font-medium text-slate-900">
                            {ynLabel(c.electricityService)} / {ynLabel(c.waterService)}
                          </dd>
                          {(c.bedrooms != null || c.bathrooms != null) && (
                            <>
                              <dt className="text-slate-500">Bedrooms · baths</dt>
                              <dd className="font-medium text-slate-900">
                                {c.bedrooms ?? '—'} · {c.bathrooms ?? '—'}
                              </dd>
                            </>
                          )}
                        </dl>
                        {c.houseDetails ? (
                          <p className="text-sm text-slate-600 italic border-l-4 border-indigo-300 pl-3">
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

          {/* Quick Actions */}
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => navigate('/applicant/apply')}
                className="p-4 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
              >
                Apply for House
              </button>
              <button
                onClick={() => navigate('/applicant/lottery')}
                className="p-4 border-2 border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-colors font-medium"
              >
                View Lottery Results
              </button>
              <button
                onClick={() => navigate('/applicant/payment')}
                className="p-4 border-2 border-yellow-600 text-yellow-600 rounded-lg hover:bg-yellow-50 transition-colors font-medium"
              >
                Make Payment
              </button>
            </div>
          </div>

          {/* Application Status */}
          {userApplications.length > 0 && (
            <div className="rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8 bg-white">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                <h2 className="text-xl font-bold text-slate-900">Your application & house listing</h2>
                <p className="text-sm text-slate-600 mt-1">
                  Status and full details for the round you applied to — same data as on “Apply”.
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
                          Submitted {new Date(app.applicationDate).toLocaleDateString()} · Score {app.score}
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
                              <dt className="text-slate-500">House type</dt>
                              <dd className="font-medium">{app.cycleHouseType}</dd>
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
                          <p className="text-sm text-slate-600 border-l-4 border-teal-400 pl-3">
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

          {/* Housing Information */}
          {userResident && (
            <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Your Housing Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">House Number</p>
                  <p className="font-medium text-gray-900">{userResident.houseNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Block Name</p>
                  <p className="font-medium text-gray-900">{userResident.blockName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Move-in Date</p>
                  <p className="font-medium text-gray-900">
                    {new Date(userResident.moveInDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="font-medium text-gray-900">
                    {userResident.residenceStatus === 'active' ? 'Active' : 'Left'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Recent Notifications */}
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Notifications</h2>
            <div className="space-y-3">
              {recentNotifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 rounded-lg border-l-4 ${
                    notif.type === 'success'
                      ? 'bg-green-50 border-green-500'
                      : notif.type === 'warning'
                      ? 'bg-yellow-50 border-yellow-500'
                      : 'bg-blue-50 border-blue-500'
                  }`}
                >
                  <p className="text-gray-900">{notif.message}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {new Date(notif.dateSent).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
            <button
              onClick={() => navigate('/applicant/notifications')}
              className="mt-4 text-blue-600 hover:underline text-sm font-medium"
            >
              View All Notifications →
            </button>
          </div>
        </div>
      </Layout>
    </>
  );
}