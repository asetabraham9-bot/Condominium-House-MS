import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import Layout from '../../components/Layout';
import { toast } from 'sonner';
import { Toaster } from 'sonner';

import { API_BASE_URL } from '../../lib/apiBase';

export default function LeaveHouse() {
  const { user } = useAuth();
  const { residents, refreshData } = useData();
  const navigate = useNavigate();
  const [reason, setReason] = useState('');
  const [leaveDate, setLeaveDate] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'applicant') {
      navigate('/login');
    }
  }, [user, navigate]);

  const userResident = residents.find((r) => r.applicantId === user?.id);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!userResident) {
      toast.error('You are not currently a resident');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/residents/submit_leave.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          reason,
          leaveDate,
        }),
      });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) {
        toast.error(result.message ?? 'Failed to submit leave request');
        return;
      }

      await refreshData();
      toast.success(result.message ?? 'Leave request submitted successfully');
      setReason('');
      setLeaveDate('');
    } catch (error) {
      console.error('Leave request submit failed:', error);
      toast.error('Unable to submit leave request');
    }
  };

  return (
    <>
      <Toaster position="top-right" />
      <Layout role="applicant">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Leave House Request</h1>
          <p className="text-gray-600 mb-8">Submit a request to vacate your condominium house</p>

          {!userResident ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h3 className="font-bold text-yellow-900 mb-2">No Housing Assigned</h3>
              <p className="text-yellow-800">
                You are not currently assigned to any condominium house.
              </p>
            </div>
          ) : userResident.residenceStatus === 'left' ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="font-bold text-gray-900 mb-2">Already Left</h3>
              <p className="text-gray-600">You have already left your condominium house.</p>
            </div>
          ) : (
            <>
              <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Current Housing Information</h2>
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
                    <p className="font-medium text-gray-900">Active</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Leave Request Form</h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Intended Leave Date *
                    </label>
                    <input
                      type="date"
                      value={leaveDate}
                      onChange={(e) => setLeaveDate(e.target.value)}
                      required
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason for Leaving *
                    </label>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      required
                      rows={6}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Please provide a detailed reason for your leave request..."
                    />
                  </div>

                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="font-bold text-red-900 mb-2">Important Notice</h4>
                    <ul className="text-sm text-red-800 space-y-1 list-disc list-inside">
                      <li>Ensure all pending payments are cleared before leaving</li>
                      <li>House inspection will be conducted before final approval</li>
                      <li>Any damages will be charged accordingly</li>
                      <li>Leave request processing may take 7-14 days</li>
                    </ul>
                  </div>

                  <div className="flex space-x-4">
                    <button
                      type="submit"
                      className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors font-medium"
                    >
                      Submit Leave Request
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/applicant')}
                      className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            </>
          )}
        </div>
      </Layout>
    </>
  );
}
