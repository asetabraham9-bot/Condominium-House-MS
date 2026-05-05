import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import Layout from '../../components/Layout';
import { Send, Bell, Info, AlertTriangle, CheckCircle, Mail, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from 'sonner';
import { API_BASE_URL } from '../../lib/apiBase';

const recipientGroupMap = {
  all: 'all_users',
  applicants: 'applicants_only',
  residents: 'residents_only',
  individual: 'individual',
} as const;

type RecipientOption = keyof typeof recipientGroupMap;
type Template = { title: string; message: string; icon: React.ReactNode };

export default function SendNotifications() {
  const { user } = useAuth();
  const { refreshData } = useData();
  const navigate = useNavigate();

  const [message, setMessage] = useState('');
  const [recipient, setRecipient] = useState<RecipientOption>('all');
  const [individualId, setIndividualId] = useState('');
  const [type, setType] = useState<'info' | 'warning' | 'success'>('info');
  const [sending, setSending] = useState(false);
  const [usersList, setUsersList] = useState<{ id: string; name: string; role: string; email: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'chms_admin') {
      navigate('/login');
    } else {
      // Fetch users for individual sending
      fetch(`${API_BASE_URL}/notifications/read_users.php`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.records) {
            setUsersList(data.records);
          }
        })
        .catch((err) => console.error('Failed to fetch users:', err));
    }
  }, [user, navigate]);

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      toast.error('You must be signed in to send notifications');
      return;
    }

    if (recipient === 'individual' && !individualId) {
      toast.error('Please select an individual recipient');
      return;
    }

    const body = `[${type}] ${message.trim()}`;

    setSending(true);
    try {
      const res = await fetch(`${API_BASE_URL}/notifications/send.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: user.id,
          recipientGroup: recipientGroupMap[recipient],
          recipientId: recipient === 'individual' ? individualId : undefined,
          message: body,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) {
        toast.error(data.message ?? 'Could not send notification');
        return;
      }
      await refreshData();
      toast.success('Notification sent successfully');
      setMessage('');
      setIndividualId('');
    } catch {
      toast.error('Network error while sending notification');
    } finally {
      setSending(false);
    }
  };

  const templates: Template[] = [
    {
      title: 'Application Opening',
      message: 'Application period for condominium houses is now open. Submit your application by the deadline.',
      icon: <Mail className="w-5 h-5 text-blue-500" />,
    },
    {
      title: 'Lottery Announcement',
      message: 'Lottery draw will be conducted soon. Results will be announced shortly.',
      icon: <Bell className="w-5 h-5 text-purple-500" />,
    },
    {
      title: 'Payment Reminder',
      message: 'Monthly payment reminder: Please ensure your payment is submitted by the due date.',
      icon: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
    },
    {
      title: 'Payment Overdue',
      message: 'This is a formal reminder that your monthly housing payment is overdue. Please settle your balance immediately to avoid penalties.',
      icon: <AlertTriangle className="w-5 h-5 text-red-500" />,
    },
    {
      title: 'Maintenance Update',
      message: 'Maintenance is scheduled for your block. Please expect minor disruptions to services during this time.',
      icon: <Info className="w-5 h-5 text-blue-500" />,
    },
    {
      title: 'Move-in Instructions',
      message: 'Welcome! Your housing application is approved. Please visit the campus housing office for your move-in instructions.',
      icon: <CheckCircle className="w-5 h-5 text-green-500" />,
    },
    {
      title: 'Rule Violation',
      message: 'This is a warning regarding a recent violation of campus housing rules. Please adhere to the guidelines to maintain your residency.',
      icon: <AlertTriangle className="w-5 h-5 text-red-500" />,
    },
    {
      title: 'General Announcement',
      message: 'Please check the resident portal for a new general announcement from the campus housing administration.',
      icon: <MessageSquare className="w-5 h-5 text-gray-500" />,
    }
  ];

  const filteredUsers = usersList.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Toaster position="top-right" />
      <Layout role="chms_admin">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center space-x-3 mb-8">
            <div className="p-3 bg-blue-100 rounded-xl shadow-sm border border-blue-200">
              <Send className="w-7 h-7 text-blue-700" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Send Notifications</h1>
              <p className="text-gray-500 mt-1">Communicate with applicants and residents</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-8 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100">
                <form onSubmit={handleSend} className="space-y-6">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Recipient Group *
                      </label>
                      <select
                        value={recipient}
                        onChange={(e) => setRecipient(e.target.value as RecipientOption)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
                      >
                        <option value="all">All Users</option>
                        <option value="applicants">Applicants Only</option>
                        <option value="residents">Residents Only</option>
                        <option value="individual">Individual User</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Notification Type *
                      </label>
                      <select
                        value={type}
                        onChange={(e) => setType(e.target.value as 'info' | 'warning' | 'success')}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
                      >
                        <option value="info">Information</option>
                        <option value="warning">Warning</option>
                        <option value="success">Success</option>
                      </select>
                    </div>
                  </div>

                  {/* Individual Selection */}
                  {recipient === 'individual' && (
                    <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                      <label className="block text-sm font-semibold text-blue-900">
                        Select Individual Recipient *
                      </label>
                      <input 
                        type="text" 
                        placeholder="Search by name or email..." 
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full px-4 py-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                      <div className="max-h-48 overflow-y-auto border border-blue-200 rounded-lg bg-white shadow-inner custom-scrollbar">
                        {filteredUsers.length === 0 ? (
                          <div className="p-4 text-center text-gray-500 text-sm">No users found</div>
                        ) : (
                          <div className="divide-y divide-gray-100">
                            {filteredUsers.map(u => (
                              <div 
                                key={u.id}
                                onClick={() => setIndividualId(u.id)}
                                className={`p-3 cursor-pointer hover:bg-blue-50 transition-colors flex justify-between items-center ${individualId === u.id ? 'bg-blue-100 border-l-4 border-blue-500' : 'border-l-4 border-transparent'}`}
                              >
                                <div>
                                  <div className={`font-medium ${individualId === u.id ? 'text-blue-900' : 'text-gray-900'}`}>{u.name}</div>
                                  <div className="text-xs text-gray-500 mt-0.5">{u.email}</div>
                                </div>
                                <span className="text-[10px] px-2.5 py-1 bg-gray-100 rounded-full text-gray-600 uppercase font-bold tracking-wider">
                                  {u.role.replace('_', ' ')}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Message *
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                      rows={6}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors resize-none"
                      placeholder="Type your notification message here..."
                    />
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                    <h4 className="font-semibold text-gray-500 mb-3 text-xs uppercase tracking-wider">Message Preview</h4>
                    <div
                      className={`p-4 rounded-xl border-l-4 flex items-start space-x-3 shadow-sm bg-white transition-all ${
                        type === 'success'
                          ? 'border-green-500'
                          : type === 'warning'
                          ? 'border-yellow-500'
                          : 'border-blue-500'
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {type === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
                        {type === 'warning' && <AlertTriangle className="w-5 h-5 text-yellow-500" />}
                        {type === 'info' && <Info className="w-5 h-5 text-blue-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-800 font-medium leading-relaxed whitespace-pre-wrap break-words">{message || 'Your message will appear here...'}</p>
                        <div className="mt-3 flex items-center space-x-2">
                          <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Delivering to:</span>
                          <span className="text-xs font-semibold px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md">
                            {
                              recipient === 'all' ? 'All Users' : 
                              recipient === 'applicants' ? 'Applicants Only' : 
                              recipient === 'residents' ? 'Residents Only' : 
                              individualId ? usersList.find(u => u.id === individualId)?.name || 'Selected User' : 'Individual User'
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={sending || (recipient === 'individual' && !individualId) || !message.trim()}
                    className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-blue-700 to-blue-900 text-white rounded-xl hover:from-blue-800 hover:to-blue-950 font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
                  >
                    <Send className="w-5 h-5" />
                    <span>{sending ? 'Sending Notification...' : 'Send Notification'}</span>
                  </button>
                </form>
              </div>
            </div>

            {/* Quick Templates Sidebar */}
            <div className="space-y-6">
              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                  <div className="flex items-center space-x-2">
                    <Bell className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-gray-900 text-lg">Quick Templates</h3>
                  </div>
                  <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full">{templates.length}</span>
                </div>
                
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {templates.map((tpl, idx) => (
                    <button
                      key={idx}
                      onClick={() => setMessage(tpl.message)}
                      className="w-full text-left p-4 bg-gray-50 hover:bg-blue-50/50 border border-gray-100 hover:border-blue-200 rounded-xl transition-all group"
                    >
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="bg-white p-1.5 rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                          {tpl.icon}
                        </div>
                        <span className="font-semibold text-gray-800 group-hover:text-blue-900">{tpl.title}</span>
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                        {tpl.message}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </Layout>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent; 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db; 
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af; 
        }
      `}</style>
    </>
  );
}
