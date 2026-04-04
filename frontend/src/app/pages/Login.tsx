import { useState, useEffect } from 'react';
import { Eye, EyeOff, Lock, Mail, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router';

import api from '../api';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { getHomeRouteByRole } from '../navigation/roleRoutes';
import { extractApiData, extractApiError } from '../utils/apiHelpers';

function normalizeRole(rawRole: unknown): 'admin' | 'teacher' | 'student' {
  const role = String(rawRole ?? '').toLowerCase().replace(/[-\s]+/g, '_');
  if (role === 'admin' || role === 'teacher' || role === 'student') {
    return role;
  }
  if (role === 'controller' || role === 'moderator' || role === 'question_setter' || role === 'invigilator') {
    return 'teacher';
  }
  return 'student';
}

function normalizeStoredRoleValue(rawRole: unknown): string {
  const role = String(rawRole ?? '').toLowerCase().replace(/[-\s]+/g, '_');
  return role || 'student';
}

export default function Login() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'InvigiLORE - Login';
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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await api.post('/login', {
        email: formData.email,
        password: formData.password,
      });

      const data = extractApiData(response) ?? response.data;
      const token = data?.token ?? data?.access_token;

      if (!token) {
        setError('Login succeeded, but no auth token was returned. Please try again.');
        return;
      }

      localStorage.setItem('token', token);

      const apiUser = data?.user ?? {};
      const rawRole = normalizeStoredRoleValue(apiUser?.role?.name ?? apiUser?.role);
      const roleName = normalizeRole(rawRole);

      localStorage.setItem('invigilore_user', JSON.stringify({
        name: apiUser?.name ?? '',
        email: apiUser?.email ?? formData.email,
        role: rawRole,
      }));

      if (rememberMe) {
        localStorage.setItem('invigilore_remember_email', formData.email);
      } else {
        localStorage.removeItem('invigilore_remember_email');
      }

      setTimeout(() => {
        navigate(getHomeRouteByRole(roleName));
      }, 300);
    } catch (err: unknown) {
      setError(extractApiError(err) || 'Invalid credentials. Please try again.');
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
    <div className="min-h-screen bg-background flex items-center justify-center p-3 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

      <div className="w-full max-w-md relative z-10 flex flex-col max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="text-center mb-5 flex-shrink-0">
          <h1 className="text-3xl font-bold text-foreground mb-1">Welcome Back</h1>
          <p className="text-muted-foreground text-xs">Sign in to your InvigiLORE account</p>
        </div>

        {/* Login Card */}
        <Card className="backdrop-blur-xl border-border shadow-2xl shadow-black/30 p-0 overflow-hidden flex-shrink-0">
          <CardContent className="p-6">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="w-4 h-4" />
              <AlertTitle>Login Failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-foreground mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                </div>
                <Input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-2 text-sm"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-foreground mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-muted-foreground" />
                </div>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-12 pr-12 py-2 text-sm"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted-foreground hover:text-foreground transition-colors"
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
                  className="w-4 h-4 rounded border-input bg-input-background text-primary focus:ring-2 focus:ring-primary cursor-pointer"
                />
                <span className="text-sm text-muted-foreground">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors">
                Forgot?
              </Link>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 mt-4 h-auto font-semibold text-sm flex items-center justify-center gap-2"
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
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-card text-muted-foreground">OR CONTINUE WITH</span>
            </div>
          </div>

          {/* Social Buttons */}
          <Button
            type="button"
            onClick={() => handleSocialLogin('Google')}
            variant="outline"
            className="w-full py-2.5 h-auto font-medium text-sm flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google
          </Button>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-4 text-center space-y-2 flex-shrink-0">
          <p className="text-xs text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary hover:text-primary/80 font-semibold transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}