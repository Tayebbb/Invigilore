import { useNavigate } from 'react-router';
import {
  Menu,
  Bell,
  HelpCircle,
} from 'lucide-react';
import NotificationsPanel from '../student/NotificationsPanel';
import type { StudentNotification } from '../../pages/student/studentTypes';
import { isStudentRole } from '../../navigation/roleRoutes';
import UserMenuDropdown from './UserMenuDropdown';
import { clearStoredAuthUser } from '../../utils/authUser';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface NavbarUser {
  name: string;
  email: string;
  /** Single uppercase letter for the avatar */
  initial: string;
  role: string;
  avatarUrl?: string | null;
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
  const navigate = useNavigate();

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
        {isStudentRole(user.role) && (
          <button
            onClick={() => navigate('/student/help-support')}
            className="hidden sm:flex w-9 h-9 rounded-lg items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 transition-all duration-200 cursor-pointer"
            aria-label="Help"
          >
            <HelpCircle className="w-4.5 h-4.5" />
          </button>
        )}

        <UserMenuDropdown
          user={user}
          onSignOut={() => {
            localStorage.removeItem('token');
            clearStoredAuthUser();
            navigate('/login');
          }}
        />
      </div>
    </header>
  );
}
