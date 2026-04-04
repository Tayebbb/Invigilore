import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  Menu,
  Bell,
  HelpCircle,
  ChevronDown,
  User,
  Settings,
  LogOut,
} from 'lucide-react';
import NotificationsPanel from '../student/NotificationsPanel';
import type { StudentNotification } from '../../pages/student/studentTypes';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface NavbarUser {
  name: string;
  email: string;
  /** Single uppercase letter for the avatar */
  initial: string;
  role: 'Admin' | 'Teacher' | 'Student';
}

export interface DashboardNavbarProps {
  /** Page title shown next to the hamburger menu */
  pageTitle: string;
  user: NavbarUser;
  /** Notification count — omit or pass 0 to hide the dot */
  notificationCount?: number;
  /** Optional notifications payload to show rich dropdown panel */
  notifications?: StudentNotification[];
  onMenuClick: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * DashboardNavbar — sticky top bar for all dashboard pages.
 *
 * Includes: mobile hamburger, page title, notification bell,
 * help button, and a profile dropdown with sign-out.
 */
export default function DashboardNavbar({
  pageTitle,
  user,
  notificationCount = 0,
  notifications,
  onMenuClick,
}: DashboardNavbarProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  /* Close dropdown when clicking outside */
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  return (
    <header
      className="fixed top-0 right-0 z-30 h-16
                 bg-gray-900/95 border-b border-gray-800 backdrop-blur-md
                 left-0 lg:left-64
                 flex items-center gap-4 px-4 lg:px-6"
    >
      {/* ── Left: hamburger + title ──────────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Hamburger — mobile only */}
        <button
          onClick={onMenuClick}
          className="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center
                     text-gray-400 hover:text-white hover:bg-gray-800
                     transition-all cursor-pointer flex-shrink-0"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Page title */}
        <h1 className="text-sm font-semibold text-white truncate">{pageTitle}</h1>
      </div>

      {/* ── Right: actions + profile ─────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 flex-shrink-0">

        {/* Notification bell */}
        {notifications ? (
          <NotificationsPanel notifications={notifications} />
        ) : (
          <button
            className="relative w-9 h-9 rounded-lg flex items-center justify-center
                       text-gray-400 hover:text-white hover:bg-gray-800
                       transition-all duration-200 cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-4.5 h-4.5" />
            {notificationCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500
                               rounded-full ring-2 ring-gray-900" />
            )}
          </button>
        )}

        {/* Help */}
        <button
          onClick={() => navigate('/student/help-support')}
          className="hidden sm:flex w-9 h-9 rounded-lg items-center justify-center
                     text-gray-400 hover:text-white hover:bg-gray-800
                     transition-all duration-200 cursor-pointer"
          aria-label="Help"
        >
          <HelpCircle className="w-4.5 h-4.5" />
        </button>

        {/* Profile dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg
                       hover:bg-gray-800 transition-all duration-200 cursor-pointer ml-1"
          >
            <div
              className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-violet-500
                         flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            >
              {user.initial}
            </div>
            <span className="hidden sm:block text-sm text-gray-300 font-medium">
              {user.name}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200
                          ${profileOpen ? 'rotate-180' : ''}`}
            />
          </button>

          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-56 bg-gray-900 border border-gray-700
                           rounded-2xl shadow-2xl shadow-black/60 overflow-hidden"
              >
                {/* User info */}
                <div className="p-3.5 border-b border-gray-800">
                  <p className="text-sm font-semibold text-white">{user.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{user.email}</p>
                </div>

                {/* Menu items */}
                <div className="p-1.5">
                  {[
                    { icon: User,     label: 'View Profile', action: () => navigate('/student/profile') },
                    { icon: Settings, label: 'Account Settings', action: () => navigate('/student/account-settings') },
                    { icon: HelpCircle, label: 'Help & Support', action: () => navigate('/student/help-support') },
                  ].map(({ icon: Icon, label, action }) => (
                    <button
                      key={label}
                      onClick={() => {
                        action();
                        setProfileOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                                 text-sm text-gray-300 hover:text-white hover:bg-gray-800
                                 transition-all duration-150 cursor-pointer"
                    >
                      <Icon className="w-4 h-4 text-gray-400" />
                      {label}
                    </button>
                  ))}
                </div>

                {/* Sign out */}
                <div className="p-1.5 border-t border-gray-800">
                  <Link
                    to="/login"
                    onClick={() => localStorage.removeItem('invigilore_user')}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl
                               text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10
                               transition-all duration-150 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
