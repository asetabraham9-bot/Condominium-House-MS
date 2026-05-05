import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import { FileText, Download, CheckCircle, XCircle, Clock, Search, Eye, Filter, MessageSquare, AlertCircle } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { API_BASE_URL } from '../../lib/apiBase';

interface Report {
  id: string;
  report_type: string;
  description: string;
  file_path: string | null;
  generated_date: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_feedback: string | null;
  campus_name: string | null;
  first_name: string;
  last_name: string;
  email: string;
}

export default function Reports() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering and searching
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // Review Modal State
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'chms_admin') {
      navigate('/login');
    } else {
      fetchReports();
    }
  }, [user, navigate]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/reports/read.php`);
      const data = await res.json();
      if (data && data.records) {
        setReports(data.records);
      }
    } catch (err) {
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (status: 'approved' | 'rejected') => {
    if (!selectedReport) return;
    
    if (status === 'rejected' && !feedback.trim()) {
      toast.error('You must state a case/reason when rejecting a report.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/reports/review.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedReport.id,
          status,
          admin_feedback: feedback.trim()
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.message || `Failed to ${status} report`);
        return;
      }
      
      toast.success(`Report ${status} successfully`);
      setReports(reports.map(r => r.id === selectedReport.id ? { ...r, status, admin_feedback: feedback.trim() } : r));
      setSelectedReport(null);
      setFeedback('');
    } catch (err) {
      toast.error(`Network error while trying to ${status} report`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredReports = reports.filter(r => {
    const matchesSearch = 
      (r.report_type || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.campus_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.first_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.last_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const formatReportType = (type: string) => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <>
      <Toaster position="top-right" />
      <Layout role="chms_admin">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-100 rounded-xl shadow-sm border border-blue-200">
                <FileText className="w-7 h-7 text-blue-700" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">System Reports Review</h1>
                <p className="text-gray-500 mt-1">Review, approve, or reject reports from Campus Admins</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 bg-white p-2 rounded-xl border border-gray-200 shadow-sm">
              <div className="relative">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="Search reports..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-blue-500 w-64"
                />
              </div>
              <div className="h-8 w-px bg-gray-200 mx-1"></div>
              <div className="flex items-center space-x-2 px-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="bg-transparent border-none text-sm font-medium text-gray-700 focus:ring-0 cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>

          {/* Reports List */}
          <div className="bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-gray-500 flex flex-col items-center">
                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                Loading reports...
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="p-16 text-center text-gray-500 flex flex-col items-center">
                <FileText className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-1">No reports found</h3>
                <p>We couldn't find any reports matching your criteria.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                      <th className="px-6 py-4">Report Info</th>
                      <th className="px-6 py-4">Submitted By</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredReports.map((report) => (
                      <tr key={report.id} className="hover:bg-blue-50/30 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${
                              report.report_type.includes('resident') ? 'bg-green-100 text-green-700' :
                              report.report_type.includes('payment') ? 'bg-yellow-100 text-yellow-700' :
                              report.report_type.includes('house') || report.report_type.includes('inventory') ? 'bg-indigo-100 text-indigo-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              <FileText className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="font-bold text-gray-900">{formatReportType(report.report_type)}</div>
                              <div className="text-xs text-gray-500 truncate max-w-xs">{report.description || 'No description provided'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{report.first_name} {report.last_name}</div>
                          <div className="text-xs text-gray-500">{report.campus_name || 'System Admin'}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {report.generated_date ? new Date(report.generated_date).toLocaleDateString() : 'Unknown'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                            report.status === 'approved' ? 'bg-green-100 text-green-800 border border-green-200' :
                            report.status === 'rejected' ? 'bg-red-100 text-red-800 border border-red-200' :
                            'bg-yellow-100 text-yellow-800 border border-yellow-200'
                          }`}>
                            {report.status === 'approved' && <CheckCircle className="w-3.5 h-3.5 mr-1" />}
                            {report.status === 'rejected' && <XCircle className="w-3.5 h-3.5 mr-1" />}
                            {report.status === 'pending' && <Clock className="w-3.5 h-3.5 mr-1" />}
                            {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          {report.file_path && (
                            <a 
                              href={`${API_BASE_URL.replace('/api', '')}/${report.file_path}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Download Report"
                            >
                              <Download className="w-5 h-5" />
                            </a>
                          )}
                          <button
                            onClick={() => { setSelectedReport(report); setFeedback(report.admin_feedback || ''); }}
                            className="inline-flex items-center justify-center px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 hover:text-blue-600 font-medium text-sm transition-colors shadow-sm"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Review
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </Layout>

      {/* Review Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <FileText className="w-6 h-6 mr-2 text-blue-600" />
                Review Report
              </h2>
              <button 
                onClick={() => setSelectedReport(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Report Type</p>
                  <p className="font-semibold text-gray-900">{formatReportType(selectedReport.report_type)}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Campus</p>
                  <p className="font-semibold text-gray-900">{selectedReport.campus_name || 'System Level'}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Submitted By</p>
                  <p className="font-semibold text-gray-900">{selectedReport.first_name} {selectedReport.last_name}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Status</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                    selectedReport.status === 'approved' ? 'bg-green-100 text-green-800' :
                    selectedReport.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {selectedReport.status.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-bold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-600 bg-gray-50 p-4 rounded-xl text-sm leading-relaxed border border-gray-100">
                  {selectedReport.description || 'No description provided.'}
                </p>
              </div>

              {selectedReport.file_path && (
                <div className="mb-8 flex justify-center">
                  <a 
                    href={`${API_BASE_URL.replace('/api', '')}/${selectedReport.file_path}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 px-6 py-3 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 rounded-xl font-bold transition-colors"
                  >
                    <Download className="w-5 h-5" />
                    <span>Download Report Document</span>
                  </a>
                </div>
              )}

              {/* Feedback Section */}
              <div className="border-t border-gray-100 pt-6">
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center">
                  <MessageSquare className="w-4 h-4 mr-2 text-gray-500" />
                  Admin Feedback / Case Statement
                </h3>
                {selectedReport.status === 'pending' ? (
                  <>
                    <textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="State a case or provide reason for approval/rejection..."
                      rows={4}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                    <div className="flex items-center mt-2 text-xs text-gray-500">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      Feedback is required if rejecting the report.
                    </div>
                  </>
                ) : (
                  <div className={`p-4 rounded-xl border ${selectedReport.status === 'approved' ? 'bg-green-50 border-green-100 text-green-900' : 'bg-red-50 border-red-100 text-red-900'}`}>
                    {selectedReport.admin_feedback || 'No feedback provided.'}
                  </div>
                )}
              </div>
            </div>
            
            {selectedReport.status === 'pending' && (
              <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end space-x-3">
                <button
                  onClick={() => handleReview('rejected')}
                  disabled={isSubmitting || !feedback.trim()}
                  className="px-6 py-2.5 bg-white border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 rounded-xl font-bold disabled:opacity-50 transition-all flex items-center"
                >
                  <XCircle className="w-5 h-5 mr-2" />
                  Reject Report
                </button>
                <button
                  onClick={() => handleReview('approved')}
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-green-600 text-white hover:bg-green-700 rounded-xl font-bold shadow-md hover:shadow-lg disabled:opacity-50 transition-all flex items-center"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Approve Report
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
