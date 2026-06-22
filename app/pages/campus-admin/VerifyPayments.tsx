import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import Layout from '../../components/Layout';
import { CheckCircle, XCircle, Eye, X, CalendarDays, Building, Clock, ExternalLink } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { API_BASE_URL } from '../../lib/apiBase';

export default function VerifyPayments() {
  const { user } = useAuth();
  const { payments, refreshData } = useData();
  const navigate = useNavigate();

  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user || user.role !== 'campus_admin') {
      navigate('/login');
    }
  }, [user, navigate]);

  // Helper: filter verified payments belonging to the admin's campus
  const campusPayments = payments.filter(
    (p) => p.campusId && String(p.campusId) === String(user?.campusId)
  );
  const verifiedPayments = campusPayments.filter((p) => p.paymentStatus === 'verified');

  // Unique months for selector
  const monthOptions = Array.from(new Set(verifiedPayments.map((p) => p.month))).filter(Boolean);

  const filteredByMonth = selectedMonth
    ? verifiedPayments.filter((p) => p.month === selectedMonth)
    : verifiedPayments;

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const selectAll = () => {
    const allIds = filteredByMonth.map((p) => p.id);
    setSelectedIds(new Set(allIds));
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleDelete = async (ids: string[]) => {
    if (!ids.length) return;
    if (!user?.campusId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/payments/delete.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, campusId: user.campusId }),
      });
      const data = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) {
        toast.error(data.message ?? 'Failed to delete payments');
        return;
      }
      toast.success('Payments deleted');
      await refreshData();
      clearSelection();
    } catch {
      toast.error('Network error while deleting payments');
    }
  };

  const generatePDF = (paymentsToExport: typeof filteredByMonth) => {
    const html = `
      <html><head><title>Payments Report</title></head><body>
        <h1>Campus Payments Report - ${selectedMonth || 'All Months'}</h1>
        <table border='1' cellpadding='5' cellspacing='0' style='border-collapse: collapse; width: 100%;'>
          <thead>
            <tr>
              <th>Resident</th>
              <th>Amount (Birr)</th>
              <th>Method</th>
              <th>Month</th>
              <th>Transaction ID</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            ${paymentsToExport
              .map(
                (p) => `
              <tr>
                <td>${p.residentName}</td>
                <td>${Number(p.amount).toLocaleString()}</td>
                <td>${p.paymentMethod}</td>
                <td>${p.month}</td>
                <td>${p.transaction_id || p.referenceNumber}</td>
                <td>${new Date(p.paymentDate).toLocaleDateString()}</td>
              </tr>`
              )
              .join('')}
          </tbody>
        </table>
        <script>window.print();</script>
      </body></html>`;
    const w = window.open('', '_blank');
    if (w) {
      w.document.write(html);
      w.document.close();
    }
  };

  return (
    <>
      <Toaster position="top-right" />
      <Layout role="campus_admin">
        <div className="max-w-5xl mx-auto space-y-8 p-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Verify Payments</h1>
          <p className="text-gray-600 mb-6">Track and manage verified payments for your campus.</p>

          {/* Month filter */}
          <div className="flex items-center space-x-4 mb-4">
            <label className="font-medium text-gray-700">Month:</label>
            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                clearSelection();
              }}
              className="border border-gray-300 rounded px-3 py-1.5"
            >
              <option value="">All Months</option>
              {monthOptions.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <button
              onClick={() => generatePDF(filteredByMonth)}
              className="ml-auto flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Generate PDF</span>
            </button>
          </div>

          {/* Payments Table */}
          <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50/80 text-xs uppercase tracking-wider text-gray-500 font-semibold border-b">
                <tr>
                  <th className="px-4 py-2"><input type="checkbox" onChange={(e) => e.target.checked ? selectAll() : clearSelection()} /></th>
                  <th className="px-4 py-2">Resident</th>
                  <th className="px-4 py-2">Amount</th>
                  <th className="px-4 py-2">Method</th>
                  <th className="px-4 py-2">Month</th>
                  <th className="px-4 py-2">Transaction ID</th>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2 text-center">Receipt</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredByMonth.map((payment) => (
                  <tr key={payment.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-4 py-2">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(payment.id)}
                        onChange={() => toggleSelect(payment.id)}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <div className="text-sm font-bold text-gray-900">{payment.residentName}</div>
                      <div className="text-[10px] text-gray-400 font-medium">{new Date(payment.paymentDate).toLocaleDateString()}</div>
                    </td>
                    <td className="px-4 py-2">
                      <span className="text-sm font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                        {Number(payment.amount).toLocaleString()} Birr
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600 font-medium">{payment.paymentMethod}</td>
                    <td className="px-4 py-2 text-sm text-gray-600 font-medium">{payment.month}</td>
                    <td className="px-4 py-2 font-mono text-xs font-bold text-indigo-600">
                      {payment.transaction_id || payment.referenceNumber}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600 font-medium">
                      {new Date(payment.paymentDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2 text-center">
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
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => handleDelete([payment.id])}
                        className="flex items-center space-x-1 text-red-600 hover:text-red-800"
                        title="Delete payment"
                      >
                        <X className="w-4 h-4" />
                        <span className="text-sm">Delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bulk actions */}
          {selectedIds.size > 0 && (
            <div className="flex items-center space-x-4 mt-4">
              <button
                onClick={() => handleDelete(Array.from(selectedIds))}
                className="flex items-center space-x-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
              >
                <X className="w-4 h-4" />
                <span>Delete Selected ({selectedIds.size})</span>
              </button>
              <button
                onClick={clearSelection}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
              >
                Clear Selection
              </button>
            </div>
          )}
        </div>
      </Layout>

      {/* Screenshot Modal */}
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
