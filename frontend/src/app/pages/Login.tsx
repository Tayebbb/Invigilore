import { useState, useEffect } from 'react';
import { Eye, EyeOff, Lock, Mail, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import api from '../api';

function normalizeRole(rawRole: unknown): 'admin' | 'teacher' | 'student' {
  const role = String(rawRole ?? '').toLowerCase();
  if (role === 'admin' || role === 'teacher' || role === 'student') {
    return role;
  }
  return 'student';
}

export default function Login() {
  const navigate = useNavigate();
  
  // Set page title dynamically
  useEffect(() => {
    document.title = 'InvigiLORE - Sign In';
    return () => {
      document.title = 'InvigiLORE';
    };
  }, []);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await api.post('/login', {
        email: formData.email,
        password: formData.password,
      });

      if (response.data.token) {
        localStorage.setItem('token', response.data.token);

        // Store user info for ProtectedRoute and dashboard display
        const apiUser = response.data.user;
        const roleName = normalizeRole(apiUser?.role?.name ?? apiUser?.role);
        localStorage.setItem('invigilore_user', JSON.stringify({
          name:  apiUser.name,
          email: apiUser.email,
          role:  roleName,
        }));

        const dashboardPaths: Record<string, string> = {
          admin:   '/admin/dashboard',
          teacher: '/teacher/dashboard',
          student: '/student/dashboard',
        };

        setTimeout(() => {
          navigate(dashboardPaths[roleName] ?? '/dashboard');
        }, 500);
      }
    } catch (err: any) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Invalid credentials. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSocialLogin = (provider: string) => {
    // Mock social login
    console.log(`Continue with ${provider}`);
    // In production, this would redirect to OAuth provider
  };

  return (
    <div className="h-screen bg-gradient-to-br from-gray-950 via-blue-950 to-gray-950 flex items-center justify-center p-3 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
      
      <div className="w-full max-w-md relative z-10 flex flex-col max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="text-center mb-5 flex-shrink-0">
          <h1 className="text-3xl font-bold text-white mb-1">Welcome Back</h1>
          <p className="text-gray-400 text-xs">Sign in to your InvigiLORE account</p>
        </div>

        {/* Login Card */}
        <div className="bg-gradient-to-br from-gray-900/80 to-gray-950/80 backdrop-blur-xl border border-gray-800/50 rounded-2xl shadow-2xl shadow-black/50 p-6 flex-shrink-0">
          {/* Error Alert */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2 animate-in">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-red-300">Login Failed</p>
                <p className="text-xs text-red-400 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-gray-500" />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 text-white placeholder-gray-500 hover:border-gray-600/50 text-sm"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-gray-500" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-12 pr-12 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 text-white placeholder-gray-500 hover:border-gray-600/50 text-sm"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-gray-400 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between pt-0">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-sm text-gray-400">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors">
                Forgot?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 mt-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-semibold text-sm hover:from-blue-500 hover:to-blue-400 focus:ring-4 focus:ring-blue-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing In...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700/50"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-gray-900/80 text-gray-500">OR CONTINUE WITH</span>
            </div>
          </div>

          {/* Social Buttons */}
          <button
            type="button"
            onClick={() => handleSocialLogin('Google')}
            className="w-full py-2.5 bg-gray-800/50 border border-gray-700/50 rounded-xl font-medium text-sm text-gray-300 hover:bg-gray-800 hover:border-gray-600/50 focus:ring-4 focus:ring-gray-700/30 transition-all duration-200 flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google
          </button>
        </div>

        {/* Footer */}
        <div className="mt-4 text-center space-y-2 flex-shrink-0">
          <p className="text-xs text-gray-400">
            Don't have an account?{' '}
            <Link to="/signup" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}