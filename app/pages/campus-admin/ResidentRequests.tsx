import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import Layout from '../../components/Layout';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import { ClipboardList, CheckCircle, XCircle, Clock, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from 'sonner';
import { API_BASE_URL } from '../../lib/apiBase';

export default function ResidentRequests() {
  const { user } = useAuth();
  const { residentRequests, refreshData } = useData();
  const navigate = useNavigate();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  useEffect(() => {
    if (!user || user.role !== 'campus_admin') {
      navigate('/login');
    }
  }, [user, navigate]);

  // Filter requests
  const filteredRequests = residentRequests.filter((req) => {
    const statusMatch = filterStatus === 'all' || req.status === filterStatus;
    const priorityMatch = filterPriority === 'all' || req.priority === filterPriority;
    return statusMatch && priorityMatch;
  });

  const pendingRequests = residentRequests.filter((r) => r.status === 'pending');
  const inProgressRequests = residentRequests.filter((r) => r.status === 'in_progress');
  const resolvedRequests = residentRequests.filter((r) => r.status === 'resolved');

  const handleUpdateStatus = async (
    id: string,
    status: 'in_progress' | 'resolved' | 'rejected'
  ) => {
    try {
      const res = await fetch(`${API_BASE_URL}/resident_requests/update_status.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      const data = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) {
        toast.error(data.message ?? 'Could not update request');
        return;
      }
      await refreshData();
      const statusText = status === 'in_progress' ? 'moved to In Progress' : status;
      toast.success(`Request ${statusText}`);
    } catch {
      toast.error('Network error while updating request');
    }
  };

  return (
    <>
      <Toaster position="top-right" />
      <Layout role="campus_admin">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Resident Requests</h1>
          <p className="text-gray-600 mb-8">Manage resident requests and feedback</p>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <StatCard
              icon={ClipboardList}
              iconColor="text-blue-600"
              title="Total Requests"
              value={residentRequests.length}
            />
            <StatCard
              icon={Clock}
              iconColor="text-yellow-600"
              title="Pending"
              value={pendingRequests.length}
            />
            <StatCard
              icon={Clock}
              iconColor="text-orange-600"
              title="In Progress"
              value={inProgressRequests.length}
            />
            <StatCard
              icon={CheckCircle}
              iconColor="text-green-600"
              title="Resolved"
              value={resolvedRequests.length}
            />
          </div>

          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200 mb-6">
            <div className="flex items-center space-x-4">
              <Filter className="w-5 h-5 text-gray-600" />
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Status:</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Priority:</label>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
          </div>

          {/* Requests List */}
          {filteredRequests.length === 0 ? (
            <div className="bg-white p-12 rounded-lg shadow border border-gray-200 text-center">
              <ClipboardList className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No Requests Found</h3>
              <p className="text-gray-600">There are no resident requests matching your filters</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request) => (
                <div key={request.id} className="bg-white p-6 rounded-lg shadow border border-gray-200">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">{request.subject}</h3>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            request.priority === 'high' || request.priority === 'urgent'
                              ? 'bg-red-100 text-red-700'
                              : request.priority === 'medium'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {request.priority.toUpperCase()}
                        </span>
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                          {request.requestType === 'leave_house'
                            ? 'Leave house'
                            : request.requestType.charAt(0).toUpperCase() +
                              request.requestType.slice(1).replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-3">{request.description}</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <span className="text-gray-600">Resident:</span>
                          <p className="font-medium text-gray-900">{request.residentName}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">House:</span>
                          <p className="font-medium text-gray-900">
                            {request.blockName} - {request.houseNumber}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-600">Date Submitted:</span>
                          <p className="font-medium text-gray-900">
                            {new Date(request.dateSubmitted).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-600">Status:</span>
                          <div className="mt-1">
                            <StatusBadge
                              status={
                                request.status === 'in_progress'
                                  ? ('pending' as any)
                                  : (request.status as any)
                              }
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
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {request.status !== 'resolved' && request.status !== 'rejected' && (
                    <div className="flex space-x-2 pt-4 border-t border-gray-200">
                      {request.status === 'pending' && (
                        <button
                          onClick={() => handleUpdateStatus(request.id, 'in_progress')}
                          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Clock className="w-4 h-4" />
                          <span>Start Progress</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleUpdateStatus(request.id, 'resolved')}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Mark Resolved</span>
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(request.id, 'rejected')}
                        className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Layout>
    </>
  );
}