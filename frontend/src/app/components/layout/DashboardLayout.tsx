import { useState, type ReactNode } from 'react';
import DashboardSidebar, { type SidebarNavItem } from './DashboardSidebar';
import DashboardNavbar,  { type NavbarUser    } from './DashboardNavbar';
import DashboardFooter                          from './DashboardFooter';
import type { StudentNotification } from '../../pages/student/studentTypes';
import { useAuthUser } from '../../context/AuthUserContext';
import { resolveProfileImageUrl } from '../../utils/profileImage';
import api from '../../api';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DashboardLayoutProps {
  /** Sidebar role badge and colour theming */
  role: string;
  /** Sidebar navigation items for this role */
  navItems: SidebarNavItem[];
  /** Currently active sidebar item (controlled by parent page) */
  activeItem: string;
  /** Called when the user selects a different nav item */
  onNavChange: (label: string) => void;
  /** Logged-in user info for the top navbar */
  user: NavbarUser;
  /** Notification dot count */
  notificationCount?: number;
  /** Optional rich notifications payload for dropdown panel */
  notifications?: StudentNotification[];
  /** Page title shown in the navbar */
  pageTitle: string;
  /** Dashboard body content */
  children: ReactNode;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * DashboardLayout — shell used by Admin, Teacher and Student dashboards.
 *
 * Structure:
 *   ┌──────────┬──────────────────────────────────┐
 *   │          │  DashboardNavbar (fixed, h-16)    │
 *   │ Sidebar  ├──────────────────────────────────┤
 *   │ (fixed,  │  <children>  (scrollable)        │
 *   │  w-64)   │                                  │
 *   │          ├──────────────────────────────────┤
 *   │          │  DashboardFooter                 │
 *   └──────────┴──────────────────────────────────┘
 *
 * On mobile the sidebar is hidden and a hamburger button in the navbar
 * triggers a slide-in overlay drawer.
 */
export default function DashboardLayout({
  role,
  navItems,
  activeItem,
  onNavChange,
  user,
  notificationCount,
  notifications,
  pageTitle,
  children,
}: DashboardLayoutProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { user: authUser } = useAuthUser();

  const resolvedName = authUser?.name || user.name;
  const resolvedEmail = authUser?.email || user.email;
  const resolvedRole = authUser?.role || user.role;
  const resolvedInitial = (resolvedName?.[0] ?? user.initial ?? 'U').toUpperCase();
  const resolvedAvatarUrl = resolveProfileImageUrl(authUser?.profile_picture, api.defaults.baseURL?.toString());

  const mergedUser: NavbarUser = {
    ...user,
    name: resolvedName,
    email: resolvedEmail,
    role: resolvedRole,
    initial: resolvedInitial,
    avatarUrl: resolvedAvatarUrl,
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex">

      {/* ── Sidebar ───────────────────────────────────────────────────────── */}
      <DashboardSidebar
        role={role}
        navItems={navItems}
        activeItem={activeItem}
        onSelect={onNavChange}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      {/* ── Main area (offset by sidebar width on desktop) ────────────────── */}
      <div className="flex flex-col flex-1 min-h-screen lg:ml-64">

        {/* Navbar */}
        <DashboardNavbar
          pageTitle={pageTitle}
          user={mergedUser}
          notificationCount={notificationCount}
          notifications={notifications}
          onMenuClick={() => setMobileSidebarOpen(true)}
        />

        {/* Page content — padded below the fixed navbar */}
        <main className="flex-1 pt-16 overflow-y-auto">
          <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8">
            {children}
          </div>
        </main>

        {/* Footer */}
        <DashboardFooter />
      </div>
    </div>
  );
}
