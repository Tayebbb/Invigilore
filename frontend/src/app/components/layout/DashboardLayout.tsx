import { useEffect, useMemo, useState, type ReactNode } from 'react';
import DashboardSidebar, { type SidebarNavItem } from './DashboardSidebar';
import DashboardNavbar, { type NavbarUser } from './DashboardNavbar';
import DashboardFooter from './DashboardFooter';
import { useAuthUser } from '../../context/AuthUserContext';
import { resolveProfileImageUrl } from '../../utils/profileImage';
import api from '../../api';

export interface DashboardLayoutProps {
  role: string;
  navItems: SidebarNavItem[];
  activeItem: string;
  onNavChange: (label: string) => void;
  user: NavbarUser;
  pageTitle: string;
  children: ReactNode;
}

export default function DashboardLayout({
  role,
  navItems,
  activeItem,
  onNavChange,
  user,
  pageTitle,
  children,
}: DashboardLayoutProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { user: authUser } = useAuthUser();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const fromStored = resolveProfileImageUrl(authUser?.profile_picture ?? null, api.defaults.baseURL);
    setAvatarUrl(fromStored);
  }, [authUser?.profile_picture]);

  const mergedUser = useMemo<NavbarUser>(() => {
    const sourceName = authUser?.name || user.name;
    const sourceRole = authUser?.role || user.role;

    return {
      ...user,
      name: sourceName,
      role: sourceRole,
      avatarUrl: avatarUrl ?? user.avatarUrl ?? null,
      initial: sourceName?.trim()?.[0]?.toUpperCase() || user.initial || 'U',
    };
  }, [authUser?.name, authUser?.role, avatarUrl, user]);

  return (
    <div className="min-h-screen flex bg-background text-foreground relative transition-colors duration-500">
      {/* ── Theme Background Elements ─────────────────────────────────────── */}
      {/* Main Gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#0f172a] to-[#020617] -z-10" />

      {/* Subtle Dot Pattern */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03] -z-10"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }}
      />

      <DashboardSidebar
        role={role}
        navItems={navItems}
        activeItem={activeItem}
        onSelect={onNavChange}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      <div className="flex flex-col flex-1 min-h-screen lg:ml-64 relative z-10">
        <DashboardNavbar
          pageTitle={pageTitle}
          user={mergedUser}
          onMenuClick={() => setMobileSidebarOpen(true)}
        />

        <main className="flex-1 pt-16 overflow-y-auto" aria-label="Main content">
          <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8">{children}</div>
        </main>

        <DashboardFooter />
      </div>
    </div>
  );
}
