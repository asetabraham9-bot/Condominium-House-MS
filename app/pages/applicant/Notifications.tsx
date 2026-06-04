import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import Layout from '../../components/Layout';
import { Bell, Info, AlertTriangle, CheckCircle, X, Trophy } from 'lucide-react';

export default function Notifications() {
  const { user } = useAuth();
  const { notifications, applications } = useData();
  const navigate = useNavigate();
  const [hiddenIds, setHiddenIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(`hiddenNotifs_${user?.id}`) || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (!user || (user.role !== 'applicant' && user.role !== 'resident')) {
      navigate('/login');
    }
  }, [user, navigate]);

  const hideNotification = (id: string) => {
    const newHidden = [...hiddenIds, id];
    setHiddenIds(newHidden);
    localStorage.setItem(`hiddenNotifs_${user?.id}`, JSON.stringify(newHidden));
  };

  const relevantNotifications = notifications.filter(
    (n) => n.recipient === 'all' || 
           (user?.role === 'applicant' && n.recipient === 'applicants') ||
           (user?.role === 'resident' && n.recipient === 'residents')
  );

  // Inject a synthetic notification if the user has a winning application
  const myWinningApps = applications.filter((app) => app.applicantId === user?.id && (app.status === 'approved' || app.status === 'placed'));
  
  const displayNotifications = [
    ...myWinningApps.map(app => ({
      id: `win-${app.cycleId || 'app'}`,
      type: 'success',
      message: `Congratulations! You have been selected in the housing lottery draw for ${app.cycleTitle || 'your application'}. Please proceed to placement.`,
      dateSent: new Date().toISOString(), // Use current date or application date
      isSynthetic: true
    })),
    ...relevantNotifications
  ].filter(n => !hiddenIds.includes(n.id));

  return (
    <Layout role={user?.role as 'applicant' | 'resident'}>
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Notifications</h1>
        <p className="text-gray-600 mb-8">Stay updated with important announcements and news</p>

        {displayNotifications.length === 0 ? (
          <div className="bg-white p-12 rounded-lg shadow border border-gray-200 text-center">
            <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No Notifications</h3>
            <p className="text-gray-600">You don't have any notifications at the moment.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayNotifications.map((notif) => (
              <div
                key={notif.id}
                className={`bg-white p-6 rounded-lg shadow border-l-4 relative group ${
                  notif.type === 'success'
                    ? 'border-green-500'
                    : notif.type === 'warning'
                    ? 'border-yellow-500'
                    : 'border-blue-500'
                }`}
              >
                <button
                  onClick={() => hideNotification(notif.id)}
                  className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                  title="Delete Notification"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex items-start space-x-4 pr-8">
                  <div className={`p-2 rounded-full ${
                    notif.type === 'success'
                      ? 'bg-green-100'
                      : notif.type === 'warning'
                      ? 'bg-yellow-100'
                      : 'bg-blue-100'
                  }`}>
                    {'isSynthetic' in notif ? (
                      <Trophy className="w-6 h-6 text-yellow-600" />
                    ) : notif.type === 'success' ? (
                      <CheckCircle className={`w-6 h-6 text-green-600`} />
                    ) : notif.type === 'warning' ? (
                      <AlertTriangle className={`w-6 h-6 text-yellow-600`} />
                    ) : (
                      <Info className={`w-6 h-6 text-blue-600`} />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-900 mb-2 text-lg">{'isSynthetic' in notif ? <strong>{notif.message}</strong> : notif.message}</p>
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
