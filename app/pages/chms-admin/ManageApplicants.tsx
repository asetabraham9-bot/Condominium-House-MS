import React, { useEffect, useState, Fragment } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import Layout from '../../components/Layout';
import StatusBadge from '../../components/StatusBadge';
import { UserCheck, Clock, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from 'sonner';
import { API_BASE_URL } from '../../lib/apiBase';

type RowStatus = 'pending' | 'approved' | 'rejected';

export default function ManageApplicants() {
  const { user } = useAuth();
  const { applications, refreshData } = useData();
  const navigate = useNavigate();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!user || user.role !== 'chms_admin') {
      navigate('/login');
    }
  }, [user, navigate]);

  const setStatus = async (applicantUserId: string, status: RowStatus) => {
    setUpdatingId(applicantUserId);
    try {
      const res = await fetch(`${API_BASE_URL}/applicant/update_submission_status.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicantUserId, status }),
      });
      const data = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) {
        toast.error(data.message ?? 'Update failed');
        return;
      }
      await refreshData();
      toast.success(`Application marked ${status}`);
    } catch {
      toast.error('Network error');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <>
      <Toaster position="top-right" />
      <Layout role="chms_admin">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Applicants</h1>
          <p className="text-gray-600 mb-8">
            Review submissions tied to an open housing cycle. Set status to pending, approved, or
            rejected.
          </p>

          {applications.length === 0 ? (
            <div className="bg-white rounded-lg shadow border border-gray-200 p-12 text-center text-gray-600">
              <UserCheck className="w-14 h-14 mx-auto mb-4 text-gray-400" />
              <p>No submitted applications yet.</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow border border-gray-200 overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Applicant
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Cycle
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Score
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Academic
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Years
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {applications.map((app) => (
                    <Fragment key={app.applicantId}>
                    <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => setExpandedId(expandedId === app.applicantId ? null : app.applicantId)}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{app.applicantName}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {app.cycleTitle ?? '—'}
                        {app.cycleId ? (
                          <span className="block text-xs text-gray-400">ID {app.cycleId}</span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded font-bold">
                          {app.score}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{app.academicLevel}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{app.yearsOfService}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(app.applicationDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm">
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
                      </td>
                      <td className="px-4 py-3 text-sm" onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-col gap-2 max-w-[240px]">
                          <label className="text-xs text-gray-500 uppercase tracking-wide">
                            Application status (default pending)
                          </label>
                          {app.status === 'lottery' || app.status === 'placed' ? (
                            <p className="text-xs text-gray-500 leading-snug">
                              Lottery or placement workflow — adjust status elsewhere if needed.
                            </p>
                          ) : (
                            <div className="flex items-center gap-2">
                              <select
                                aria-label={`Status for ${app.applicantName}`}
                                disabled={updatingId === app.applicantId}
                                value={app.status as RowStatus}
                                onChange={(e) =>
                                  void setStatus(app.applicantId, e.target.value as RowStatus)
                                }
                                className="flex-1 min-w-0 text-sm border border-gray-300 rounded-lg px-2 py-1.5 bg-white focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                              >
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                              </select>
                              {updatingId === app.applicantId ? (
                                <Clock className="w-5 h-5 text-amber-500 shrink-0 animate-pulse" />
                              ) : null}
                            </div>
                          )}
                          <div className="flex flex-wrap gap-2 text-[10px] text-gray-400">
                            <span className="inline-flex items-center gap-0.5">
                              <Clock className="w-3 h-3" /> Pending
                            </span>
                            <span className="inline-flex items-center gap-0.5">
                              <CheckCircle className="w-3 h-3" /> Approved
                            </span>
                            <span className="inline-flex items-center gap-0.5">
                              <XCircle className="w-3 h-3" /> Rejected
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>
                    {expandedId === app.applicantId && (
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <td colSpan={8} className="px-4 py-4">
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="block text-gray-500 font-medium">Job Responsibility</span>
                              <span className="text-gray-900">{app.jobResponsibility}</span>
                            </div>
                            <div>
                              <span className="block text-gray-500 font-medium">Marital Status</span>
                              <span className="text-gray-900">{app.maritalStatus}</span>
                            </div>
                            <div>
                              <span className="block text-gray-500 font-medium">Children Count</span>
                              <span className="text-gray-900">{app.childrenCount ?? 0}</span>
                            </div>
                            <div>
                              <span className="block text-gray-500 font-medium">Disability Status</span>
                              <span className="text-gray-900">{app.isDisabled ? 'Yes' : 'No'}</span>
                            </div>
                            <div className="col-span-2">
                                <span className="block text-gray-500 font-medium">Additional Info</span>
                                <span className="text-gray-900">Score exactly calculated based on your personal detail information and scoring rule of the system.</span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Layout>
    </>
  );
}
