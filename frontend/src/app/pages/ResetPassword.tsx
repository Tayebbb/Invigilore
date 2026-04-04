import { useState } from 'react';
import { Shield, Lock, Eye, EyeOff, CheckCircle, Loader2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router';

export default function ResetPassword() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');

  // Password strength calculation
  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: '', color: '' };
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;

    const labels = ['Weak', 'Fair', 'Good', 'Strong'];
    const colors = ['bg-red-500', 'bg-amber-500', 'bg-blue-500', 'bg-emerald-500'];
    
    return {
      strength: (strength / 4) * 100,
      label: labels[strength - 1] || '',
      color: colors[strength - 1] || 'bg-muted'
    };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);

    // Simulate password reset
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
    }, 1500);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const requirements = [
    { met: formData.password.length >= 8, text: 'At least 8 characters' },
    { met: /[a-z]/.test(formData.password) && /[A-Z]/.test(formData.password), text: 'Upper & lowercase letters' },
    { met: /\d/.test(formData.password), text: 'At least one number' },
    { met: /[^a-zA-Z\d]/.test(formData.password), text: 'At least one special character' },
  ];

  return (
    <div className="min-h-screen bg-background flex text-foreground">
      {/* Left Side - Illustration/Graphics (Desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/40 to-primary/20 p-16 items-center justify-center relative overflow-hidden">
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
              <Shield className="w-7 h-7 text-primary-foreground" strokeWidth={1.5} />
            </div>
            <div>
              <div className="text-2xl font-semibold text-foreground tracking-wide">
                Invigilore
              </div>
              <div className="text-xs text-blue-200 uppercase tracking-widest">
                Secure Examination Systems
              </div>
            </div>
          </div>

          {/* Main Illustration Text */}
          <h1 className="text-5xl font-bold text-foreground mb-6 leading-tight">
            Reset Your<br />
            Password
          </h1>
          <p className="text-xl text-blue-100 font-light leading-relaxed mb-12">
            Create a strong, secure password to protect your account and examination data.
          </p>

          {/* Features */}
          <div className="space-y-4">
            {[
              'Encrypted password storage',
              'Secure authentication protocol',
              'Two-factor authentication ready',
              'Regular security audits',
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-blue-100 font-light">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Reset Password Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-card">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 border-2 border-blue-500 flex items-center justify-center">
              <Shield className="w-6 h-6 text-blue-500" strokeWidth={1.5} />
            </div>
            <div>
              <div className="text-xl font-semibold text-foreground tracking-wide">
                Invigilore
              </div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest">
                Secure Examination Systems
              </div>
            </div>
          </div>

          {/* Reset Password Card */}
          <div className="bg-card border border-border rounded-2xl shadow-2xl shadow-black/30 p-8 md:p-10">
            {!isSuccess ? (
              <>
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-foreground mb-2">
                    Create New Password
                  </h2>
                  <p className="text-muted-foreground">
                    Your new password must be different from previously used passwords
                  </p>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/25 flex items-start gap-3">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-red-300">Error</p>
                      <p className="text-sm text-red-400">{error}</p>
                    </div>
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Password Input */}
                  <div>
                    <label htmlFor="password" className="block text-sm font-semibold text-foreground mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="block w-full pl-10 pr-12 py-3 bg-input-background border border-input rounded-lg focus:ring-2 focus:ring-ring/50 focus:border-transparent outline-none transition-all duration-200 text-foreground placeholder:text-muted-foreground"
                        placeholder="Create a strong password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                        ) : (
                          <Eye className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                        )}
                      </button>
                    </div>

                    {/* Password Strength Indicator */}
                    {formData.password && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground">Password Strength</span>
                          <span className={`text-xs font-semibold ${
                            passwordStrength.strength >= 75 ? 'text-emerald-400' :
                            passwordStrength.strength >= 50 ? 'text-blue-400' :
                            passwordStrength.strength >= 25 ? 'text-amber-400' : 'text-red-400'
                          }`}>
                            {passwordStrength.label}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full ${passwordStrength.color} transition-all duration-300`}
                            style={{ width: `${passwordStrength.strength}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password Input */}
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-semibold text-foreground mb-2">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="block w-full pl-10 pr-12 py-3 bg-input-background border border-input rounded-lg focus:ring-2 focus:ring-ring/50 focus:border-transparent outline-none transition-all duration-200 text-foreground placeholder:text-muted-foreground"
                        placeholder="Confirm your password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                        ) : (
                          <Eye className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Password Requirements */}
                  <div className="p-4 rounded-lg bg-muted/40 border border-border">
                    <p className="text-sm font-semibold text-foreground mb-3">
                      Password Requirements:
                    </p>
                    <ul className="space-y-2">
                      {requirements.map((req, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                            req.met ? 'bg-emerald-500/20 text-emerald-400' : 'bg-muted text-muted-foreground'
                          }`}>
                            {req.met && (
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <span className={req.met ? 'text-foreground' : 'text-muted-foreground'}>
                            {req.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 focus:ring-4 focus:ring-primary/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] hover:shadow-md shadow-primary/20 hover:shadow-primary/40 active:scale-95"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Resetting Password...
                      </>
                    ) : (
                      'Reset Password'
                    )}
                  </button>
                </form>

                {/* Back to Login Link */}
                <div className="mt-6">
                  <Link
                    to="/login"
                    className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Login
                  </Link>
                </div>
              </>
            ) : (
              /* Success State */
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-emerald-400" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-3">
                  Password Reset Successful!
                </h2>
                <p className="text-muted-foreground mb-8">
                  Your password has been successfully reset. You can now log in with your new password.
                </p>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-all duration-200 cursor-pointer hover:scale-[1.02] active:scale-95"
                >
                  Continue to Login
                </Link>
              </div>
            )}
          </div>

          {/* Footer Links */}
          <div className="mt-8 text-center">
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <a href="#privacy" className="hover:text-primary transition-colors">
                Privacy Policy
              </a>
              <span className="text-border">•</span>
              <a href="#support" className="hover:text-primary transition-colors">
                Contact Support
              </a>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              © 2026 Invigilore. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}