import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import Layout from '../../components/Layout';
import { CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from 'sonner';
import { API_BASE_URL } from '../../lib/apiBase';

export default function VerifyPayments() {
  const { user } = useAuth();
  const { payments, refreshData } = useData();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.role !== 'campus_admin') {
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

  const pendingPayments = payments.filter((p) => p.paymentStatus === 'pending');

  return (
    <>
      <Toaster position="top-right" />
      <Layout role="campus_admin">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Verify Payments</h1>
          <p className="text-gray-600 mb-8">Review and verify resident payments</p>

          {pendingPayments.length === 0 ? (
            <div className="bg-white p-12 rounded-lg shadow border border-gray-200 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">All Caught Up!</h3>
              <p className="text-gray-600">No pending payments to verify</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingPayments.map((payment) => (
                <div key={payment.id} className="bg-white p-6 rounded-lg shadow border border-gray-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">{payment.residentName}</h3>
                      <p className="text-sm text-gray-600 mb-2">{payment.month}</p>
                      <p className="text-2xl font-bold text-blue-600">{payment.amount} Birr</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Submitted: {new Date(payment.paymentDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleVerify(payment.id, 'verified')}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Verify</span>
                      </button>
                      <button
                        onClick={() => handleVerify(payment.id, 'rejected')}
                        className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Layout>
    </>
  );
}
