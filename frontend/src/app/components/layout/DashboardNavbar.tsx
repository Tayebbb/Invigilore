import { Menu, Bell, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router';
import NotificationsPanel from '../student/NotificationsPanel';
import type { StudentNotification } from '../../pages/student/studentTypes';
import { isStudentRole } from '../../navigation/roleRoutes';
import UserMenuDropdown from './UserMenuDropdown';
import api from '../../api';
import { clearStoredAuthUser } from '../../utils/authUser';

export interface NavbarUser {
  name: string;
  email: string;
  initial: string;
  role: string;
  avatarUrl?: string | null;
}

export interface DashboardNavbarProps {
  pageTitle: string;
  user: NavbarUser;
  notificationCount?: number;
  notifications?: StudentNotification[];
  onMenuClick: () => void;
}

export default function DashboardNavbar({
  pageTitle,
  user,
  notificationCount = 0,
  notifications,
  onMenuClick,
}: DashboardNavbarProps) {
  const navigate = useNavigate();

  async function handleSignOut() {
    try {
      await api.post('/logout');
    } catch {
      // Local sign-out still proceeds if backend token is already invalid.
    }

    localStorage.removeItem('token');
    clearStoredAuthUser();
    navigate('/login');
  }

  const showStudentNotifications = isStudentRole(user.role) && Array.isArray(notifications);

  return (
    <header className="fixed top-0 right-0 z-30 h-16 bg-card border-b border-border backdrop-blur-md left-0 lg:left-64 flex items-center gap-4 px-4 lg:px-6">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <button
          onClick={onMenuClick}
          className="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="Open sidebar menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <h1 className="text-sm sm:text-base font-semibold text-card-foreground truncate" title={pageTitle}>
          {pageTitle}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        {showStudentNotifications ? (
          <NotificationsPanel notifications={notifications} />
        ) : (
          <button
            className="relative w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {notificationCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full ring-2 ring-card" />
            )}
          </button>
        )}

        <button
          className="hidden sm:flex w-9 h-9 rounded-lg items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="Help"
        >
          <HelpCircle className="w-5 h-5" />
        </button>

        <UserMenuDropdown user={user} onSignOut={handleSignOut} />
      </div>
    </header>
  );
}
