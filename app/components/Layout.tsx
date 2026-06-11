import { ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import {
  Home,
  Users,
  FileText,
  DollarSign,
  Bell,
  Settings,
  LogOut,
  Building2,
  UserCheck,
  TrendingUp,
  Send,
  Building,
  ClipboardList,
  Rocket,
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  role: 'applicant' | 'campus_admin' | 'chms_admin' | 'manager';
}

export default function Layout({ children, role }: LayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const applicantMenuItems = [
    { icon: Home, label: 'Dashboard', path: '/applicant' },
    { icon: FileText, label: 'Apply for House', path: '/applicant/apply' },
    { icon: TrendingUp, label: 'Lottery Result', path: '/applicant/lottery' },
    { icon: DollarSign, label: 'Payment', path: '/applicant/payment' },
    { icon: ClipboardList, label: 'Leave House Request', path: '/applicant/leave-house' },
    { icon: Bell, label: 'Notifications', path: '/applicant/notifications' },
    { icon: Settings, label: 'Settings', path: '/applicant/settings' },
  ];

  const campusAdminMenuItems = [
    { icon: Home, label: 'Dashboard', path: '/campus-admin' },
    { icon: Building2, label: 'Manage Blocks', path: '/campus-admin/blocks' },
    { icon: Users, label: 'Manage Residents', path: '/campus-admin/residents' },
    { icon: DollarSign, label: 'Verify Payments', path: '/campus-admin/verify-payments' },
    { icon: ClipboardList, label: 'Resident Requests', path: '/campus-admin/requests' },
    { icon: FileText, label: 'Reports', path: '/campus-admin/reports' },
    { icon: Settings, label: 'Settings', path: '/campus-admin/settings' },
  ];

  const chmsAdminMenuItems = [
    { icon: Home, label: 'Dashboard', path: '/chms-admin' },
    { icon: Rocket, label: 'Launch application cycle', path: '/chms-admin/launch-cycle' },
    { icon: UserCheck, label: 'Manage Applicants', path: '/chms-admin/applicants' },
    { icon: Users, label: 'Manage Residents', path: '/chms-admin/residents' },
    { icon: TrendingUp, label: 'Draw Lottery', path: '/chms-admin/lottery' },
    { icon: Building, label: 'Manage Placement', path: '/chms-admin/placement' },
    { icon: DollarSign, label: 'Verify Payments', path: '/chms-admin/verify-payments' },
    { icon: Send, label: 'Send Notifications', path: '/chms-admin/notifications' },
    { icon: FileText, label: 'Reports', path: '/chms-admin/reports' },
    { icon: Building2, label: 'Manage Campus', path: '/chms-admin/campus' },
    { icon: Settings, label: 'Settings', path: '/chms-admin/settings' },
  ];

  const managerMenuItems = [
    { icon: Home, label: 'Dashboard', path: '/manager/dashboard' },
    { icon: Building2, label: 'Campus Information', path: '/manager/campus-info' },
    { icon: ClipboardList, label: 'Inform House Requests', path: '/manager/inform-house-requests' },
    { icon: Settings, label: 'Settings', path: '/manager/settings' },
  ];

  const menuItems =
    role === 'applicant'
      ? applicantMenuItems
      : role === 'campus_admin'
      ? campusAdminMenuItems
      : role === 'manager'
      ? managerMenuItems
      : chmsAdminMenuItems;

  const roleTitle =
    role === 'applicant'
      ? 'Applicant Portal'
      : role === 'campus_admin'
      ? 'Campus Admin'
      : role === 'manager'
      ? 'Manager'
      : 'CHMS Admin';

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-blue-900 text-white flex flex-col">
        <div className="p-6 border-b border-blue-800">
          <h1 className="font-bold text-xl">OCHMS</h1>
          <p className="text-sm text-blue-200 mt-1">{roleTitle}</p>
        </div>

        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.path}>
                <button
                  onClick={() => navigate(item.path)}
                  className="flex items-center space-x-3 w-full p-3 rounded-lg hover:bg-blue-800 transition-colors"
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-sm">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-blue-800">
          <div className="mb-4">
            <p className="text-sm font-medium">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-blue-200">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 w-full p-3 rounded-lg hover:bg-blue-800 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
