import { useState } from 'react';
import { Shield, Mail, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import { Link } from 'react-router';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate sending reset link
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
    }, 1500);
  };

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
            Password<br />
            Recovery
          </h1>
          <p className="text-xl text-blue-100 font-light leading-relaxed mb-12">
            We'll send you a secure link to reset your password and regain access to your account.
          </p>

          {/* Features */}
          <div className="space-y-4">
            {[
              'Secure password reset process',
              'Email verification required',
              'Link expires in 24 hours',
              'Support team available 24/7',
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

      {/* Right Side - Forgot Password Form */}
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

          {/* Forgot Password Card */}
          <div className="bg-card border border-border rounded-2xl shadow-2xl shadow-black/30 p-8 md:p-10">
            {!isSuccess ? (
              <>
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-foreground mb-2">
                    Forgot Password?
                  </h2>
                  <p className="text-muted-foreground">
                    Enter your email and we'll send you a reset link
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Email Input */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-foreground mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="block w-full pl-10 pr-4 py-3 bg-input-background border border-input rounded-lg focus:ring-2 focus:ring-ring/50 focus:border-transparent outline-none transition-all duration-200 text-foreground placeholder:text-muted-foreground"
                        placeholder="Enter your email"
                        required
                      />
                    </div>
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
                        Sending Reset Link...
                      </>
                    ) : (
                      'Send Reset Link'
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
                  Check Your Email
                </h2>
                <p className="text-muted-foreground mb-2">
                  We've sent a password reset link to:
                </p>
                <p className="text-blue-400 font-semibold mb-6">{email}</p>
                <p className="text-sm text-muted-foreground mb-8">
                  Click the link in the email to reset your password. The link will expire in 24 hours.
                </p>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-muted text-foreground rounded-lg font-semibold hover:bg-accent transition-all duration-200 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Login
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
