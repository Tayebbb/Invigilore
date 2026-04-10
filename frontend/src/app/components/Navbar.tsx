import { useState, useEffect } from 'react';
import { Shield, Menu, X, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { getStoredUser } from '../auth/ProtectedRoute';
import { getHomeRouteByRole } from '../navigation/roleRoutes';
import { clearStoredAuthUser } from '../utils/authUser';
import { clearAuthToken, getAuthToken } from '../utils/authToken';

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  // Check if user is logged in
  useEffect(() => {
    const user = getStoredUser();
    setIsLoggedIn(Boolean(user && getAuthToken()));
  }, []);

  const handleLogout = () => {
    // Clear auth data from storage
    clearAuthToken();
    clearStoredAuthUser();
    setIsLoggedIn(false);
    setIsMobileMenuOpen(false);
    // Redirect to home page
    navigate('/', { replace: true });
  };

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'Security', href: '#security' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Blog', href: '#blog' },
    { label: 'Help', href: '#help' },
  ];

  const user = getStoredUser();
  const logoTarget = user ? getHomeRouteByRole(user.role) : '/';

  return (
    <nav className="sticky top-0 left-0 right-0 z-50 bg-gray-900/95 border-b border-gray-800 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left - Logo */}
          <Link to={logoTarget} className="flex items-center gap-3 group">
            <img src="/logo.png" alt="Invigilore" className="w-9 h-9 rounded-lg shadow-md shadow-blue-500/20 group-hover:shadow-lg group-hover:shadow-blue-500/30 transition-all duration-200 group-hover:scale-105" />
            <span className="text-xl font-semibold text-white">
              Invigilore
            </span>
          </Link>

          {/* Center - Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-gray-400 hover:text-white transition-colors duration-200"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Right - CTA Button (Desktop & Tablet) */}
          <div className="hidden md:flex items-center gap-3">
            {isLoggedIn ? (
              <button
                onClick={handleLogout}
                className="px-5 py-2.5 text-sm font-semibold text-gray-300 hover:text-white transition-colors duration-200 flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-5 py-2.5 text-sm font-semibold text-gray-300 hover:text-white transition-colors duration-200"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-500 focus:ring-4 focus:ring-blue-600/20 transition-all duration-200 shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-95 cursor-pointer"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-all duration-200 cursor-pointer"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-800 bg-gray-900 shadow-xl shadow-black/40">
          <div className="px-4 py-4 space-y-3">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="block px-4 py-2.5 text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all duration-200 cursor-pointer"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="pt-3 border-t border-gray-800 space-y-2">
              {isLoggedIn ? (
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2.5 text-gray-300 text-sm font-semibold text-center rounded-lg hover:bg-gray-800 hover:text-white transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="block px-4 py-2.5 text-gray-300 text-sm font-semibold text-center rounded-lg hover:bg-gray-800 hover:text-white transition-all duration-200 cursor-pointer"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="block px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold text-center rounded-lg hover:bg-blue-500 transition-all duration-200 cursor-pointer hover:scale-[1.02] active:scale-95"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}