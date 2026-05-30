import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import Layout from '../../components/Layout';
import {
  FileText,
  User,
  MapPin,
  Building,
  CheckCircle,
  XCircle,
  Clock,
  ArrowUpRight,
  ChevronRight,
  Info,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from 'sonner';
import { API_BASE_URL } from '../../lib/apiBase';

interface InformRequest {
  id: string;
  informer_id: string;
  campus_id: string;
  block: string;
  houseType: string;
  houseStatus: string;
  maintenanceDescription: string | null;
  status: 'pending' | 'resolved' | 'rejected';
  forwardedToAdmin: boolean;
  createdAt: string;
  informerName: string;
  informerCampusName: string;
  houseCampusName: string;
}

export default function InformHouseRequests() {
  const { user } = useAuth();
  const { campuses, refreshData } = useData();
  const [requests, setRequests] = useState<InformRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCampusTab, setActiveCampusTab] = useState<string>('');
  const [selectedRequest, setSelectedRequest] = useState<InformRequest | null>(null);

  // Modal actions state
  const [statusAction, setStatusAction] = useState<'pending' | 'resolved' | 'rejected'>('pending');
  const [forwardToAdmin, setForwardToAdmin] = useState(false);
  const [updating, setUpdating] = useState(false);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/manager/read_inform_requests.php`);
      const data = await res.json();
      if (res.ok && data.records) {
        setRequests(data.records);
        // Set first campus tab as default if there are campuses
        if (data.records.length > 0 && !activeCampusTab) {
          setActiveCampusTab(data.records[0].houseCampusName);
        }
      }
    } catch (err) {
      console.error('Failed to load requests:', err);
      toast.error('Could not load house inform requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // Sync modal form when a request is selected
  useEffect(() => {
    if (selectedRequest) {
      setStatusAction(selectedRequest.status);
      setForwardToAdmin(selectedRequest.forwardedToAdmin);
    }
  }, [selectedRequest]);

  // Group by campus name
  const campusesWithRequests = Array.from(new Set(requests.map((r) => r.houseCampusName)));
  const displayedCampus = activeCampusTab || (campusesWithRequests[0] ?? '');
  const filteredRequests = requests.filter((r) => r.houseCampusName === displayedCampus);

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest || !user) return;

    setUpdating(true);
    try {
      const res = await fetch(`${API_BASE_URL}/manager/update_inform_status.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: selectedRequest.id,
          status: statusAction,
          forwardToAdmin: forwardToAdmin,
          managerId: user.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || 'Failed to update request.');
        return;
      }

      toast.success(
        forwardToAdmin
          ? 'Request updated and forwarded to System Admin successfully!'
          : 'Request updated successfully!'
      );
      setSelectedRequest(null);
      await refreshData();
      await fetchRequests();
    } catch (err) {
      console.error('Action submit error:', err);
      toast.error('Network error. Unable to update status.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <>
      <Toaster position="top-right" />
      <Layout role="manager">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-2xl shadow-sm border border-blue-200 text-blue-700">
              <FileText className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">House Inform/Nomination Requests</h1>
              <p className="text-gray-500 mt-1">Review and action house status reports submitted by applicants</p>
            </div>
          </div>

          {/* Campus Category Tabs */}
          {campusesWithRequests.length > 0 ? (
            <div className="flex border-b border-gray-200 space-x-2">
              {campusesWithRequests.map((cName) => (
                <button
                  key={cName}
                  onClick={() => setActiveCampusTab(cName)}
                  className={`px-6 py-3 font-semibold text-sm transition-all border-b-2 rounded-t-lg ${
                    displayedCampus === cName
                      ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {cName} Campus
                </button>
              ))}
            </div>
          ) : !loading ? (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center text-gray-500 font-medium">
              No house inform requests found.
            </div>
          ) : null}

          {/* Requests Table */}
          {filteredRequests.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-150 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-gray-150 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                      <th className="px-6 py-4">Informer</th>
                      <th className="px-6 py-4">Block</th>
                      <th className="px-6 py-4">House Type</th>
                      <th className="px-6 py-4">House Status</th>
                      <th className="px-6 py-4">Action Status</th>
                      <th className="px-6 py-4">Forwarded</th>
                      <th className="px-6 py-4">Date Sent</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {filteredRequests.map((req) => (
                      <tr
                        key={req.id}
                        className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                        onClick={() => setSelectedRequest(req)}
                      >
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold text-gray-900">{req.informerName}</p>
                            <p className="text-xs text-gray-500 font-medium flex items-center gap-0.5 mt-0.5">
                              <MapPin className="w-3 h-3" /> {req.informerCampusName} Campus
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-800">{req.block}</td>
                        <td className="px-6 py-4 text-gray-600">{req.houseType}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                              req.houseStatus === 'available'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-900'
                            }`}
                          >
                            {req.houseStatus === 'available' ? 'Available' : 'Needs Maint.'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 w-fit ${
                              req.status === 'resolved'
                                ? 'bg-green-100 text-green-800'
                                : req.status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {req.status === 'resolved' && <CheckCircle className="w-3.5 h-3.5" />}
                            {req.status === 'rejected' && <XCircle className="w-3.5 h-3.5" />}
                            {req.status === 'pending' && <Clock className="w-3.5 h-3.5" />}
                            {req.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                              req.forwardedToAdmin
                                ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            {req.forwardedToAdmin ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500">
                          {new Date(req.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedRequest(req);
                            }}
                            className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors inline-flex items-center gap-1 font-semibold text-xs text-blue-600"
                          >
                            <span>Action</span>
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {loading && (
            <div className="text-center py-12 text-gray-500 font-semibold">Loading requests...</div>
          )}
        </div>
      </Layout>

      {/* Action Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-900 to-blue-800 p-6 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">Request Details</h3>
                <p className="text-xs text-blue-200 mt-1">Submitted on {new Date(selectedRequest.createdAt).toLocaleString()}</p>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleActionSubmit} className="p-6 space-y-6">
              <div className="space-y-4">
                {/* Informer Profile */}
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-start gap-3">
                  <div className="p-2.5 bg-blue-100 rounded-xl text-blue-700">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider">Informer Details</h4>
                    <p className="font-semibold text-slate-800 text-sm mt-0.5">{selectedRequest.informerName}</p>
                    <p className="text-xs text-slate-500 font-medium">Campus: {selectedRequest.informerCampusName}</p>
                  </div>
                </div>

                {/* House Attributes */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border border-slate-150 rounded-xl space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Campus Location</span>
                    <p className="font-semibold text-slate-800 text-sm">{selectedRequest.houseCampusName}</p>
                  </div>
                  <div className="p-4 border border-slate-150 rounded-xl space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Block Name</span>
                    <p className="font-semibold text-slate-800 text-sm">{selectedRequest.block}</p>
                  </div>
                  <div className="p-4 border border-slate-150 rounded-xl space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">House Type</span>
                    <p className="font-semibold text-slate-800 text-sm">{selectedRequest.houseType}</p>
                  </div>
                  <div className="p-4 border border-slate-150 rounded-xl space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">House Status</span>
                    <p className="font-semibold text-slate-800 text-sm capitalize">{selectedRequest.houseStatus}</p>
                  </div>
                </div>

                {/* Maintenance Notes */}
                {selectedRequest.houseStatus === 'maintenance' && (
                  <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-xl space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-amber-700 flex items-center gap-1">
                      <Info className="w-3.5 h-3.5" /> Maintenance Description
                    </span>
                    <p className="text-xs text-slate-700 leading-relaxed font-mono whitespace-pre-wrap">
                      {selectedRequest.maintenanceDescription}
                    </p>
                  </div>
                )}

                {/* Workflow Actions */}
                <div className="border-t border-slate-150 pt-5 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Update Action Status
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['pending', 'resolved', 'rejected'] as const).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setStatusAction(st)}
                          className={`py-2 px-3 rounded-lg text-xs font-semibold capitalize border transition-all ${
                            statusAction === st
                              ? st === 'resolved'
                                ? 'bg-green-600 text-white border-green-600 shadow-sm'
                                : st === 'rejected'
                                ? 'bg-red-600 text-white border-red-600 shadow-sm'
                                : 'bg-blue-600 text-white border-blue-600 shadow-sm'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Forward Checkbox */}
                  <label className="flex items-center space-x-3 p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl cursor-pointer hover:bg-indigo-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={forwardToAdmin}
                      onChange={(e) => setForwardToAdmin(e.target.checked)}
                      className="w-4.5 h-4.5 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-indigo-900 flex items-center gap-1">
                        Forward to System Admin <ArrowUpRight className="w-3.5 h-3.5" />
                      </p>
                      <p className="text-[10px] text-indigo-600 mt-0.5">
                        Send detailed request body & triggers system notification alert
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setSelectedRequest(null)}
                  className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-1 py-3 px-4 bg-blue-900 hover:bg-blue-950 text-white font-semibold rounded-xl text-xs shadow-md transition-colors disabled:opacity-50"
                >
                  {updating ? 'Saving changes...' : 'Save & Notify Proposer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
