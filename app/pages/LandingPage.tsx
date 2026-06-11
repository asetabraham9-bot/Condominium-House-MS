import { useNavigate } from 'react-router';
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, FileCheck, TrendingUp, Building2 } from 'lucide-react';
import wsuLogo from '../assets/wsu_logo.png';

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    // Redirect logged-in users to their dashboard
    if (user) {
      if (user.role === 'applicant') {
        navigate('/applicant');
      } else if (user.role === 'campus_admin') {
        navigate('/campus-admin');
      } else if (user.role === 'chms_admin') {
        navigate('/chms-admin');
      }
    }
  }, [user, navigate]);

  // DB Connection Testing
  useEffect(() => {
    fetch('http://localhost:4000/api/properties')
      .then(r => r.json())
      .then(data => {
        console.log('Successfully connected to Backend DB:', data);
      })
      .catch(e => console.error('Failed Database Connection:', e));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <img src={wsuLogo} alt="WSU Logo" className="w-10 h-10 rounded-full object-cover border-2 border-white/40" />
            <span className="text-white text-xl font-bold">OCHMS</span>
          </div>
          <div className="space-x-4">
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-2 text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              Login
            </button>
            <button
              onClick={() => navigate('/register')}
              className="px-6 py-2 bg-white text-blue-900 rounded-lg hover:bg-gray-100 transition-colors font-medium"
            >
              Register
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="container mx-auto px-6 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <div className="flex justify-center mb-8">
            <img
              src={wsuLogo}
              alt="Wolaita Sodo University"
              className="w-28 h-28 rounded-full object-cover border-4 border-white/30 shadow-2xl"
            />
          </div>
          <h1 className="text-5xl font-bold text-white mb-6">
            Online Condominium House Management System
          </h1>
          <p className="text-xl text-blue-100 mb-12">
            Wolaita Sodo University's digital platform for managing condominium housing allocation,
            applications, and resident services.
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => navigate('/register')}
              className="px-8 py-4 bg-white text-blue-900 rounded-lg hover:bg-gray-100 transition-colors font-medium text-lg"
            >
              Apply for Housing
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-4 bg-blue-800 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg"
            >
              Access Portal
            </button>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-20">
          <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg border border-white/20">
            <div className="bg-white/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <FileCheck className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-white font-bold mb-2">Easy Application</h3>
            <p className="text-blue-100 text-sm">
              Submit your condominium house application online with a simple form
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg border border-white/20">
            <div className="bg-white/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-white font-bold mb-2">Fair Lottery System</h3>
            <p className="text-blue-100 text-sm">
              Transparent lottery-based allocation using merit scoring
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg border border-white/20">
            <div className="bg-white/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-white font-bold mb-2">Resident Management</h3>
            <p className="text-blue-100 text-sm">
              Track payments, requests, and housing information in one place
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg border border-white/20">
            <div className="bg-white/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-white font-bold mb-2">225 Housing Units</h3>
            <p className="text-blue-100 text-sm">
              Studio, one bedroom, and two bedroom units across 15 blocks
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white/10 backdrop-blur-sm p-8 rounded-lg border border-white/20 mt-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">225</div>
              <div className="text-blue-100">Total Housing Units</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">15</div>
              <div className="text-blue-100">Condominium Blocks</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">1,200 Birr</div>
              <div className="text-blue-100">Monthly Payment</div>
            </div>
          </div>
        </div>

        {/* Allocation Criteria */}
        <div className="mt-20 text-center">
          <h2 className="text-3xl font-bold text-white mb-8">Allocation Criteria</h2>
          <div className="bg-white/10 backdrop-blur-sm p-8 rounded-lg border border-white/20 max-w-2xl mx-auto">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-blue-100">Academic Level</span>
                <span className="text-white font-bold">50%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-100">Years of Service</span>
                <span className="text-white font-bold">25%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-100">Job Responsibility</span>
                <span className="text-white font-bold">15%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-100">Marital Status</span>
                <span className="text-white font-bold">10%</span>
              </div>
              <div className="pt-4 border-t border-white/20">
                <span className="text-blue-100 text-sm">
                  Additional 10% for female staff with disabilities
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-blue-950 mt-20 py-8">
        <div className="container mx-auto px-6 text-center">
          <p className="text-blue-200">
            © 2026 Wolaita Sodo University - Online Condominium House Management System
          </p>
        </div>
      </footer>
    </div>
  );
}