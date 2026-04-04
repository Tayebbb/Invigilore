import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router';
import { X, LayoutDashboard, LogOut, type LucideIcon } from 'lucide-react';
import api from '../../api';
import { getHomeRouteByRole } from '../../navigation/roleRoutes';
import { clearStoredAuthUser } from '../../utils/authUser';
import { Badge } from '../ui/badge';
import { cn } from '../ui/utils';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SidebarNavItem {
  label: string;
  icon: LucideIcon;
  /** Optional badge text, e.g. "3" for notifications */
  badge?: string;
}

export interface DashboardSidebarProps {
  /** Role label shown in the header chip */
  role: string;
  navItems: SidebarNavItem[];
  activeItem: string;
  onSelect: (label: string) => void;
  /** Controls mobile slide-in overlay */
  mobileOpen: boolean;
  onMobileClose: () => void;
}

// ── Role colour tokens ────────────────────────────────────────────────────────

const roleChip: Record<string, string> = {
  Admin:   'bg-purple-500/15 text-purple-400 border border-purple-500/30',
  Teacher: 'bg-blue-500/15   text-blue-400   border border-blue-500/30',
  Student: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  Controller: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  Invigilator: 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30',
  'Question Setter': 'bg-fuchsia-500/15 text-fuchsia-400 border border-fuchsia-500/30',
  Moderator: 'bg-slate-500/15 text-slate-300 border border-slate-500/30',
};

// ── Sidebar inner content (shared between desktop & mobile) ───────────────────

function SidebarContent({
  role,
  navItems,
  activeItem,
  onSelect,
  onMobileClose,
}: Omit<DashboardSidebarProps, 'mobileOpen'>) {
  const navigate = useNavigate();
  const homeRoute = getHomeRouteByRole(role);

  async function handleLogout() {
    try {
      await api.post('/logout');
    } catch {
      // token may already be expired — clear locally regardless
    }
    localStorage.removeItem('token');
    clearStoredAuthUser();
    navigate('/login');
  }

  return (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">

      {/* ── Logo ──────────────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => navigate(homeRoute)}
        className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border text-left transition-colors duration-200 hover:bg-sidebar-accent/10"
        aria-label="Go to home dashboard"
      >
        <img src="/logo.png" alt="Invigilore" className="w-9 h-9 rounded-xl shadow-lg shadow-sidebar-primary/20 shrink-0" />
        <div className="min-w-0">
          <span className="text-base font-bold text-sidebar-foreground tracking-tight block leading-none">
            Invigilore
          </span>
          <Badge
            className={cn('mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full', roleChip[role] ?? roleChip.Student)}
            variant="secondary"
          >
            {role}
          </Badge>
        </div>
      </button>

      {/* ── Nav items ─────────────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.label;
          return (
            <button
              key={item.label}
              onClick={() => { onSelect(item.label); onMobileClose(); }}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer group focus-visible:ring-2 focus-visible:ring-sidebar-ring',
                isActive
                  ? 'bg-primary/10 text-primary border-l-2 border-primary shadow-[0_0_15px_-3px_rgba(59,130,246,0.3)]'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/30 hover:text-sidebar-primary'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge && (
                <Badge className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-sidebar-primary text-sidebar-primary-foreground" variant="secondary">
                  {item.badge}
                </Badge>
              )}
            </button>
          );
        })}
      </nav>

      {/* ── Bottom: logout ────────────────────────────────────────────────── */}
      <div className="px-3 py-4 border-t border-sidebar-border">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-red-400"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Sign Out
        </button>
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * DashboardSidebar — renders a fixed desktop rail + mobile slide-in overlay.
 *
 * Desktop: fixed left column (w-64), always visible on lg+ screens.
 * Mobile:  full-height overlay with backdrop, toggled by DashboardNavbar hamburger.
 */
export default function DashboardSidebar({
  role,
  navItems,
  activeItem,
  onSelect,
  mobileOpen,
  onMobileClose,
}: DashboardSidebarProps) {
  return (
    <>
      {/* ── Desktop sidebar ──────────────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-sidebar border-r border-sidebar-border fixed inset-y-0 left-0 z-40">
        <SidebarContent
          role={role}
          navItems={navItems}
          activeItem={activeItem}
          onSelect={onSelect}
          onMobileClose={onMobileClose}
        />
      </aside>

      {/* ── Mobile overlay ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onMobileClose}
              className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            />

            {/* Drawer */}
            <motion.aside
              key="drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-sidebar border-r border-sidebar-border flex flex-col"
            >
              {/* Close button */}
              <button
                onClick={onMobileClose}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-primary"
              >
                <X className="w-4 h-4" />
              </button>

              <SidebarContent
                role={role}
                navItems={navItems}
                activeItem={activeItem}
                onSelect={onSelect}
                onMobileClose={onMobileClose}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
