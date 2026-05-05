import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import Layout from '../../components/Layout';
import { Bell, Info, AlertTriangle, CheckCircle } from 'lucide-react';

export default function Notifications() {
  const { user } = useAuth();
  const { notifications } = useData();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.role !== 'applicant') {
      navigate('/login');
    }
  }, [user, navigate]);

  const relevantNotifications = notifications.filter(
    (n) => n.recipient === 'all' || n.recipient === 'applicants'
  );

  return (
    <Layout role="applicant">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Notifications</h1>
        <p className="text-gray-600 mb-8">Stay updated with important announcements and news</p>

        {relevantNotifications.length === 0 ? (
          <div className="bg-white p-12 rounded-lg shadow border border-gray-200 text-center">
            <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No Notifications</h3>
            <p className="text-gray-600">You don't have any notifications at the moment.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {relevantNotifications.map((notif) => (
              <div
                key={notif.id}
                className={`bg-white p-6 rounded-lg shadow border-l-4 ${
                  notif.type === 'success'
                    ? 'border-green-500'
                    : notif.type === 'warning'
                    ? 'border-yellow-500'
                    : 'border-blue-500'
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div className={`p-2 rounded-full ${
                    notif.type === 'success'
                      ? 'bg-green-100'
                      : notif.type === 'warning'
                      ? 'bg-yellow-100'
                      : 'bg-blue-100'
                  }`}>
                    {notif.type === 'success' ? (
                      <CheckCircle className={`w-6 h-6 text-green-600`} />
                    ) : notif.type === 'warning' ? (
                      <AlertTriangle className={`w-6 h-6 text-yellow-600`} />
                    ) : (
                      <Info className={`w-6 h-6 text-blue-600`} />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-900 mb-2">{notif.message}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(notif.dateSent).toLocaleDateString()} at{' '}
                      {new Date(notif.dateSent).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
