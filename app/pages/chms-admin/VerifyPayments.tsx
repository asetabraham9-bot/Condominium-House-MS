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
  const { payments, refreshData } = useData();
  const navigate = useNavigate();
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);

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
      toast.success(`Payment ${status}`);
    } catch {
      toast.error('Network error while updating payment');
    }
  };

  // Sort ALL payments by recent time descending
  const sortedPayments = [...payments].sort(
    (a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
  );

  const pendingPayments = sortedPayments.filter((p) => p.paymentStatus === 'pending');
  const verifiedPayments = sortedPayments.filter((p) => p.paymentStatus === 'verified');

  // Group historical/all payments by campus
  const groupedPayments = sortedPayments.reduce((acc, p) => {
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
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl shadow-sm border border-green-200">
                <DollarSign className="w-7 h-7 text-green-700" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Verify Payments</h1>
                <p className="text-gray-500 mt-1">Review, categorize, and verify resident transactions</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              icon={Clock}
              iconColor="text-yellow-600"
              title="Pending Reviews"
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
              title="Total Verified Revenue"
              value={`${verifiedPayments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()} Birr`}
            />
          </div>

          {/* Pending Payments Action Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-yellow-100 p-6 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-yellow-400"></div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Clock className="w-5 h-5 text-yellow-500 mr-2" />
                Action Required: Pending Payments
              </h2>
              <span className="bg-yellow-50 text-yellow-700 text-xs font-bold px-3 py-1 rounded-full border border-yellow-200">
                {pendingPayments.length} Pending
              </span>
            </div>
            
            {pendingPayments.length === 0 ? (
              <div className="bg-gray-50 p-10 rounded-xl border border-dashed border-gray-200 text-center flex flex-col items-center">
                <CheckCircle className="w-16 h-16 text-green-400 mb-3" />
                <h3 className="text-lg font-bold text-gray-900">All Caught Up!</h3>
                <p className="text-sm text-gray-500">There are no pending payments requiring your verification right now.</p>
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
                            {payment.payment_type?.replace('_', ' ') || 'Residence Fee'}
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
                             <CalendarDays className="w-3.5 h-3.5 mr-1.5 text-gray-400" /> {payment.month}
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
                        <span>Verify</span>
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

          {/* Categorized Payment History */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center mb-6">
              <CalendarDays className="w-6 h-6 mr-2 text-indigo-500" />
              Payment History by Campus
            </h2>
            
            {Object.keys(groupedPayments).length === 0 ? (
               <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 text-center">
                 <p className="text-gray-500">No payment history available.</p>
               </div>
            ) : (
              Object.entries(groupedPayments).map(([campus, campusPayments]) => (
                <div key={campus} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                  <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex justify-between items-center">
                    <h3 className="text-lg font-bold text-indigo-900 flex items-center">
                      <Building className="w-5 h-5 mr-2 text-indigo-500" />
                      {campus}
                    </h3>
                    <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                      {campusPayments.length} Transactions
                    </span>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50/50 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                          <th className="px-6 py-4">Resident</th>
                          <th className="px-6 py-4">Transaction ID</th>
                          <th className="px-6 py-4">Month</th>
                          <th className="px-6 py-4">Amount</th>
                          <th className="px-6 py-4 text-center">Receipt</th>
                          <th className="px-6 py-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {campusPayments.map((payment) => (
                          <tr key={payment.id} className="hover:bg-indigo-50/30 transition-colors">
                            <td className="px-6 py-4">
                              <div className="text-sm font-bold text-gray-900">{payment.residentName}</div>
                              <div className="text-[10px] text-gray-400 font-medium">{new Date(payment.paymentDate).toLocaleDateString()}</div>
                            </td>
                            <td className="px-6 py-4 font-mono text-xs font-bold text-indigo-600">
                              {payment.transaction_id || payment.referenceNumber}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600 font-medium">{payment.month}</td>
                            <td className="px-6 py-4">
                              <span className="text-sm font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                                {payment.amount.toLocaleString()} Birr
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                               {payment.screenshot_path ? (
                                 <button 
                                   onClick={() => setSelectedScreenshot(payment.screenshot_path!)}
                                   className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                   title="View Receipt"
                                 >
                                   <Eye className="w-5 h-5" />
                                 </button>
                               ) : '-'}
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <StatusBadge status={payment.paymentStatus as any} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
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