import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router';
import { Shield, X, LayoutDashboard, LogOut, type LucideIcon } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SidebarNavItem {
  label: string;
  icon: LucideIcon;
  /** Optional badge text, e.g. "3" for notifications */
  badge?: string;
}

export interface DashboardSidebarProps {
  /** Role label shown in the header chip */
  role: 'Admin' | 'Teacher' | 'Student';
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

  function handleLogout() {
    // TODO: clear auth token / session when auth is wired up
    localStorage.removeItem('invigilore_user');
    navigate('/login');
  }

  return (
    <div className="flex flex-col h-full">

      {/* ── Logo ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-800">
        <div className="w-9 h-9 rounded-xl bg-linear-to-br from-blue-500 to-blue-700
                        flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <span className="text-base font-bold text-white tracking-tight block leading-none">
            Invigilore
          </span>
          <span className={`mt-1 inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full
                            ${roleChip[role] ?? roleChip.Student}`}>
            {role}
          </span>
        </div>
      </div>

      {/* ── Nav items ─────────────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.label;
          return (
            <button
              key={item.label}
              onClick={() => { onSelect(item.label); onMobileClose(); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                          transition-all duration-200 cursor-pointer group
                          ${isActive
                            ? 'bg-blue-600/15 text-blue-400'
                            : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'}`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge && (
                <span className="ml-auto text-[10px] font-bold bg-blue-500 text-white
                                 px-1.5 py-0.5 rounded-full leading-none">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* ── Bottom: logout ────────────────────────────────────────────────── */}
      <div className="px-3 py-4 border-t border-gray-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                     text-gray-500 hover:text-red-400 hover:bg-red-500/10
                     transition-all duration-200 cursor-pointer"
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
      <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-gray-900
                        border-r border-gray-800 fixed inset-y-0 left-0 z-40">
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
              className="lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-gray-900
                         border-r border-gray-800 flex flex-col"
            >
              {/* Close button */}
              <button
                onClick={onMobileClose}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center
                           rounded-lg text-gray-400 hover:text-white hover:bg-gray-800
                           transition-all cursor-pointer"
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
