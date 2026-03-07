import { useState } from 'react';
import { Eye, EyeOff, Shield, Lock, Mail, User, AlertCircle, Loader2 } from 'lucide-react';
import { Link } from 'react-router';

export default function SignUp() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState('admin');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!agreeToTerms) {
      setError('Please agree to the Terms and Privacy Policy');
      return;
    }

    setIsLoading(true);

    // Simulate signup
    setTimeout(() => {
      // Success - redirect to home or login
      window.location.href = '/login';
    }, 1500);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSocialSignUp = (provider: string) => {
    // Mock social signup
    console.log(`Sign up with ${provider}`);
    // In production, this would redirect to OAuth provider
  };

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Left Side - Illustration/Graphics (Desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-900 to-blue-950 p-16 items-center justify-center relative overflow-hidden">
        {/* Background Pattern */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{ 
            backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), 
                             linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        ></div>

        {/* Content */}
        <div className="relative z-10 max-w-lg">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 border-2 border-white/30 flex items-center justify-center">
              <Shield className="w-7 h-7 text-white" strokeWidth={1.5} />
            </div>
            <div>
              <div className="text-2xl font-semibold text-white tracking-wide">
                Invigilore
              </div>
              <div className="text-xs text-blue-200 uppercase tracking-widest">
                Secure Examination Systems
              </div>
            </div>
          </div>

          {/* Main Illustration Text */}
          <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
            Create Your<br />
            Account
          </h1>
          <p className="text-xl text-blue-100 font-light leading-relaxed mb-12">
            Join the secure examination management platform trusted by academic institutions worldwide.
          </p>

          {/* Features */}
          <div className="space-y-4">
            {[
              'Multi-layer role-based access control',
              'Real-time monitoring & audit trails',
              'Encrypted data protection',
              'Compliance-ready reporting',
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-blue-100 font-light">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Sign Up Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-900">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 border-2 border-blue-500 flex items-center justify-center">
              <Shield className="w-6 h-6 text-blue-500" strokeWidth={1.5} />
            </div>
            <div>
              <div className="text-xl font-semibold text-white tracking-wide">
                Invigilore
              </div>
              <div className="text-[10px] text-gray-500 uppercase tracking-widest">
                Secure Examination Systems
              </div>
            </div>
          </div>

          {/* Sign Up Card */}
          <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl shadow-black/40 p-8 md:p-10">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">
                Sign Up
              </h2>
              <p className="text-gray-400">
                Create a new account to access the platform
              </p>
            </div>

            {/* Social Signup Buttons */}
            <div className="space-y-3 mb-6">
              {/* Google Signup */}
              <button
                type="button"
                onClick={() => handleSocialSignUp('Google')}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg font-medium text-white hover:bg-gray-600 hover:border-gray-500 focus:ring-4 focus:ring-gray-500/30 transition-all duration-200 cursor-pointer"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Sign up with Google
              </button>

              {/* Facebook Signup */}
              <button
                type="button"
                onClick={() => handleSocialSignUp('Facebook')}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#1877F2] border border-[#1877F2] rounded-lg font-medium text-white hover:bg-[#166FE5] focus:ring-4 focus:ring-blue-500/30 transition-all duration-200 cursor-pointer"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Sign up with Facebook
              </button>
            </div>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-gray-800 text-gray-400 font-medium">OR SIGN UP WITH EMAIL</span>
              </div>
            </div>

            {/* Role Indicator */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-300 mb-3">
                Select Your Role
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'admin', label: 'Admin' },
                  { value: 'controller', label: 'Controller' },
                  { value: 'moderator', label: 'Moderator' },
                  { value: 'invigilator', label: 'Invigilator' },
                ].map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                      role === r.value
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/25 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-300">Sign Up Failed</p>
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Full Name Input */}
              <div>
                <label htmlFor="fullName" className="block text-sm font-semibold text-gray-300 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 text-white placeholder-gray-400"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              </div>

              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-300 mb-2">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 text-white placeholder-gray-400"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-12 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 text-white placeholder-gray-400"
                    placeholder="Create a password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-500 hover:text-gray-300" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-500 hover:text-gray-300" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password Input */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-300 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-12 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 text-white placeholder-gray-400"
                    placeholder="Confirm your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-500 hover:text-gray-300" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-500 hover:text-gray-300" />
                    )}
                  </button>
                </div>
              </div>

              {/* Terms & Privacy Checkbox */}
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreeToTerms}
                  onChange={(e) => setAgreeToTerms(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="terms" className="text-sm text-gray-400 cursor-pointer">
                  I agree to the{' '}
                  <a href="#terms" className="text-blue-400 hover:text-blue-300 font-medium">
                    Terms of Service
                  </a>
                  {' '}and{' '}
                  <a href="#privacy" className="text-blue-400 hover:text-blue-300 font-medium">
                    Privacy Policy
                  </a>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-500 focus:ring-4 focus:ring-blue-600/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] hover:shadow-md shadow-blue-500/20 hover:shadow-blue-500/40 active:scale-95"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            {/* Sign In Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-400">
                Already have an account?{' '}
                <Link to="/login" className="text-blue-400 hover:text-blue-300 font-semibold">
                  Sign In
                </Link>
              </p>
            </div>

            {/* Security Warning */}
            <div className="mt-6 p-4 rounded-lg bg-amber-500/10 border border-amber-500/25">
              <p className="text-xs text-amber-300 text-center font-medium">
                <Lock className="w-4 h-4 inline mr-1" />
                Your data is encrypted and secured. All activity is logged.
              </p>
            </div>
          </div>

          {/* Footer Links */}
          <div className="mt-8 text-center">
            <div className="flex items-center justify-center gap-6 text-sm text-gray-400">
              <a href="#privacy" className="hover:text-blue-400 transition-colors">
                Privacy Policy
              </a>
              <span className="text-gray-700">•</span>
              <a href="#terms" className="hover:text-blue-400 transition-colors">
                Terms of Use
              </a>
            </div>
            <p className="mt-4 text-xs text-gray-500">
              © 2026 Invigilore. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
