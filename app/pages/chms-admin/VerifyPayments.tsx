import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import Layout from '../../components/Layout';
import StatusBadge from '../../components/StatusBadge';
import StatCard from '../../components/StatCard';
import { CheckCircle, XCircle, DollarSign, Building, Clock, CalendarDays, Eye, ExternalLink, ShieldCheck, X } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { API_BASE_URL } from '../../lib/apiBase';

export default function VerifyPayments() {
  const { user } = useAuth();
  const { payments, housingCycles, refreshData } = useData();
  const navigate = useNavigate();
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'application_fee' | 'residence_fee'>('application_fee');

  useEffect(() => {
    if (!user || user.role !== 'chms_admin') {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleVerify = async (id: string, status: 'verified' | 'rejected') => {
    try {
      const res = await fetch(`${API_BASE_URL}/payments/update_status.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          status,
          verifiedBy: user?.id ? parseInt(user.id, 10) : null,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) {
        toast.error(data.message ?? 'Could not update payment');
        return;
      }
      await refreshData();
      toast.success(`Payment ${status === 'verified' ? 'Approved' : 'Rejected'}`);
    } catch {
      toast.error('Network error while updating payment');
    }
  };

  // Check if there's any active/open cycle
  const hasOpenCycle = housingCycles.some((c) => c.status === 'open');

  // Filter payments by active tab
  const filteredPayments = payments.filter((p) => {
    const pType = p.payment_type || 'residence_fee';
    return pType === activeTab;
  });

  const pendingPayments = filteredPayments.filter((p) => p.paymentStatus === 'pending');
  const verifiedPayments = filteredPayments.filter((p) => p.paymentStatus === 'verified');
  const rejectedPayments = filteredPayments.filter((p) => p.paymentStatus === 'rejected');

  // Group historical/all payments by campus
  const groupedCampuses = filteredPayments.reduce((acc, p) => {
    const campus = p.campusName || 'System / Unassigned';
    if (!acc[campus]) acc[campus] = [];
    acc[campus].push(p);
    return acc;
  }, {} as Record<string, typeof payments>);

  return (
    <>
      <Toaster position="top-right" />
      <Layout role="chms_admin">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl shadow-sm border border-green-200">
                <DollarSign className="w-7 h-7 text-green-700" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Verify Payments</h1>
                <p className="text-gray-500 mt-1">Review, approve, and track application and residence fees</p>
              </div>
            </div>

            {/* Type selector tabs */}
            <div className="flex bg-gray-100 p-1.5 rounded-xl border border-gray-200">
              <button
                onClick={() => setActiveTab('application_fee')}
                className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  activeTab === 'application_fee'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Application Fees
              </button>
              <button
                onClick={() => setActiveTab('residence_fee')}
                className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  activeTab === 'residence_fee'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Residence Fees
              </button>
            </div>
          </div>

          {/* Stats for the active tab type */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              icon={Clock}
              iconColor="text-yellow-600"
              title={`${activeTab === 'application_fee' ? 'Pending Application Fees' : 'Pending Residence Fees'}`}
              value={pendingPayments.length}
            />
            <StatCard
              icon={CheckCircle}
              iconColor="text-green-600"
              title="Verified Transactions"
              value={verifiedPayments.length}
            />
            <StatCard
              icon={DollarSign}
              iconColor="text-blue-600"
              title="Total Revenue"
              value={`${verifiedPayments.reduce((sum, p) => sum + Number(p.amount), 0).toLocaleString()} Birr`}
            />
          </div>

          {/* Alert if Application Fee is closed */}
          {activeTab === 'application_fee' && !hasOpenCycle && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start space-x-3">
              <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-amber-950">Application Cycle is Closed (History View)</h4>
                <p className="text-sm text-amber-900 mt-1">
                  There is currently no open housing cycle. All application fees displayed below are historical records.
                  Once a new application cycle is launched, these records will be cleared to accept new applicants.
                </p>
              </div>
            </div>
          )}

          {/* Action Required: Pending Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-yellow-100 p-6 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-yellow-400"></div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Clock className="w-5 h-5 text-yellow-500 mr-2" />
                Action Required: Pending {activeTab === 'application_fee' ? 'Application Fees' : 'Residence Fees'}
              </h2>
              <span className="bg-yellow-50 text-yellow-700 text-xs font-bold px-3 py-1 rounded-full border border-yellow-200">
                {pendingPayments.length} Pending
              </span>
            </div>

            {pendingPayments.length === 0 ? (
              <div className="bg-gray-50 p-10 rounded-xl border border-dashed border-gray-200 text-center flex flex-col items-center">
                <CheckCircle className="w-16 h-16 text-green-400 mb-3" />
                <h3 className="text-lg font-bold text-gray-900">All Caught Up!</h3>
                <p className="text-sm text-gray-500">No pending payments require verification in this category.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {pendingPayments.map((payment) => (
                  <div key={payment.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-bold text-gray-900 text-lg">{payment.residentName}</h3>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 uppercase tracking-wider mt-1">
                            {payment.paymentMethod}
                          </span>
                        </div>
                        <span className="text-xl font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-xl border border-blue-100">{payment.amount.toLocaleString()} Birr</span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-5">
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Campus</p>
                          <p className="text-sm font-semibold text-gray-700 flex items-center">
                            <Building className="w-3.5 h-3.5 mr-1.5 text-gray-400" /> {payment.campusName || 'N/A'}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Transaction ID</p>
                          <p className="text-sm font-mono font-bold text-indigo-600 flex items-center">
                            <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-indigo-400" /> {payment.transaction_id || payment.referenceNumber}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Payment Month</p>
                          <p className="text-sm font-semibold text-gray-700 flex items-center">
                            <CalendarDays className="w-3.5 h-3.5 mr-1.5 text-gray-400" /> {payment.month || 'N/A'}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Submitted Date</p>
                          <p className="text-sm font-semibold text-gray-700 flex items-center">
                            <Clock className="w-3.5 h-3.5 mr-1.5 text-gray-400" /> {new Date(payment.paymentDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {payment.screenshot_path && (
                        <button
                          onClick={() => setSelectedScreenshot(payment.screenshot_path!)}
                          className="w-full mb-4 flex items-center justify-center space-x-2 py-2 bg-gray-50 border border-gray-200 text-gray-600 rounded-xl hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all font-bold text-sm"
                        >
                          <Eye className="w-4 h-4" />
                          <span>View Receipt Screenshot</span>
                        </button>
                      )}
                    </div>

                    <div className="flex space-x-3 pt-4 border-t border-gray-50">
                      <button
                        onClick={() => handleVerify(payment.id, 'verified')}
                        className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 bg-green-50 text-green-700 border border-green-200 rounded-xl hover:bg-green-600 hover:text-white font-bold transition-all group"
                      >
                        <CheckCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => handleVerify(payment.id, 'rejected')}
                        className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 bg-red-50 text-red-700 border border-red-200 rounded-xl hover:bg-red-600 hover:text-white font-bold transition-all group"
                      >
                        <XCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Categorized Payment History Section */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center mb-6">
              <CalendarDays className="w-6 h-6 mr-2 text-indigo-500" />
              {activeTab === 'application_fee' ? 'Application Fee History by Campus' : 'Residence Fee History by Campus'}
            </h2>

            {Object.keys(groupedCampuses).length === 0 ? (
              <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 text-center">
                <p className="text-gray-500">No payment records available.</p>
              </div>
            ) : (
              Object.entries(groupedCampuses).map(([campus, campusPayments]) => {
                // Inside each campus, group by status
                const statuses: ('pending' | 'verified' | 'rejected')[] = ['pending', 'verified', 'rejected'];
                const statusTitles = {
                  pending: 'Pending Verification',
                  verified: 'Approved Payments',
                  rejected: 'Rejected Payments',
                };
                const statusColors = {
                  pending: 'border-yellow-200 bg-yellow-50/50 text-yellow-800',
                  verified: 'border-green-200 bg-green-50/50 text-green-800',
                  rejected: 'border-red-200 bg-red-50/50 text-red-800',
                };

                return (
                  <div key={campus} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-6 space-y-6">
                    <h3 className="text-lg font-bold text-indigo-900 flex items-center border-b pb-3">
                      <Building className="w-5 h-5 mr-2 text-indigo-500" />
                      {campus} Campus
                    </h3>

                    <div className="space-y-6">
                      {statuses.map((status) => {
                        const paymentsWithStatus = campusPayments.filter((p) => p.paymentStatus === status);
                        if (paymentsWithStatus.length === 0) return null;

                        return (
                          <div key={status} className="space-y-3">
                            <div className={`px-4 py-2 border rounded-xl font-bold text-xs inline-block ${statusColors[status]}`}>
                              {statusTitles[status]} ({paymentsWithStatus.length})
                            </div>

                            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
                              <table className="w-full text-left border-collapse">
                                <thead>
                                  <tr className="bg-gray-50/80 text-xs uppercase tracking-wider text-gray-500 font-semibold border-b">
                                    <th className="px-6 py-3">Payer Name</th>
                                    <th className="px-6 py-3">Amount</th>
                                    <th className="px-6 py-3">Payment Method</th>
                                    <th className="px-6 py-3">Payment Month</th>
                                    <th className="px-6 py-3">Transaction ID</th>
                                    <th className="px-6 py-3 text-center">Receipt</th>
                                    <th className="px-6 py-3">Status</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                  {paymentsWithStatus.map((payment) => (
                                    <tr key={payment.id} className="hover:bg-blue-50/20 transition-colors">
                                      <td className="px-6 py-4">
                                        <div className="text-sm font-bold text-gray-900">{payment.residentName}</div>
                                        <div className="text-[10px] text-gray-400 font-medium">{new Date(payment.paymentDate).toLocaleDateString()}</div>
                                      </td>
                                      <td className="px-6 py-4">
                                        <span className="text-sm font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                                          {payment.amount.toLocaleString()} Birr
                                        </span>
                                      </td>
                                      <td className="px-6 py-4 text-sm text-gray-600 font-medium">{payment.paymentMethod}</td>
                                      <td className="px-6 py-4 text-sm text-gray-600 font-medium">{payment.month || 'N/A'}</td>
                                      <td className="px-6 py-4 font-mono text-xs font-bold text-indigo-600">
                                        {payment.transaction_id || payment.referenceNumber}
                                      </td>
                                      <td className="px-6 py-4 text-center">
                                        {payment.screenshot_path ? (
                                          <button
                                            onClick={() => setSelectedScreenshot(payment.screenshot_path!)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center mx-auto"
                                            title="View Receipt Screenshot"
                                          >
                                            <Eye className="w-5 h-5 mr-1" />
                                            <span className="text-xs font-bold">View</span>
                                          </button>
                                        ) : (
                                          <span className="text-gray-400 text-xs">No image</span>
                                        )}
                                      </td>
                                      <td className="px-6 py-4">
                                        <StatusBadge status={payment.paymentStatus as any} />
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </Layout>

      {/* Screenshot Preview Modal */}
      {selectedScreenshot && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setSelectedScreenshot(null)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 p-2 transition-colors flex items-center space-x-2 font-bold"
            >
              <X className="w-6 h-6" />
              <span>Close</span>
            </button>
            <div className="bg-white p-2 rounded-xl shadow-2xl overflow-hidden flex items-center justify-center">
              <img
                src={`${API_BASE_URL.replace('/api', '')}/${selectedScreenshot}`}
                alt="Payment Receipt"
                className="max-w-full max-h-[80vh] object-contain rounded-lg"
              />
            </div>
            <a
              href={`${API_BASE_URL.replace('/api', '')}/${selectedScreenshot}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 flex items-center space-x-2 px-6 py-3 bg-white text-blue-600 rounded-xl font-bold hover:bg-blue-50 transition-colors shadow-lg"
            >
              <ExternalLink className="w-5 h-5" />
              <span>Open in New Tab</span>
            </a>
          </div>
        </div>
      )}
    </>
  );
}