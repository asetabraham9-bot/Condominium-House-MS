import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Toaster } from 'sonner';
import wsuLogo from '../assets/wsu_logo.png';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const success = await login(email, password);

    if (success) {
      toast.success('Login successful!');
      // Redirect based on role will be handled by checking user role
      setTimeout(() => {
        const user = JSON.parse(localStorage.getItem('ochms_user') || '{}');
        if (user.role === 'applicant') {
          navigate('/applicant');
        } else if (user.role === 'campus_admin') {
          navigate('/campus-admin');
        } else if (user.role === 'chms_admin') {
          navigate('/chms-admin');
        } else if (user.role === 'manager') {
          navigate('/manager/dashboard');
        }
      }, 500);
    } else {
      toast.error('Invalid email or password');
    }

    setLoading(false);
  };

  return (
    <>
      <Toaster position="top-right" />
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-white border-4 border-blue-900 p-1 rounded-full mb-4 shadow-lg">
              <img src={wsuLogo} alt="WSU Logo" className="w-16 h-16 rounded-full object-cover" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">OCHMS Login</h1>
            <p className="text-gray-600 mt-2 text-center">
              Online Condominium House Management System
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="you@wsu.edu"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-900 text-white py-3 rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <button
                onClick={() => navigate('/register')}
                className="text-blue-900 hover:underline font-medium"
              >
                Register here
              </button>
            </p>
          </div>


        </div>
      </div>
    </>
  );
}
