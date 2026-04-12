import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown, Lock, LogOut, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { getHomeRouteByRole, isStudentRole, normalizeRole } from '../../navigation/roleRoutes';
import { getStudentAccountDropdownItems } from '../../navigation/studentNavigation';

export interface UserMenuUser {
  name: string;
  email: string;
  initial: string;
  role: string;
  avatarUrl?: string | null;
}

interface UserMenuDropdownProps {
  user: UserMenuUser;
  onSignOut: () => void;
}

export default function UserMenuDropdown({ user, onSignOut }: UserMenuDropdownProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const student = isStudentRole(user.role);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const normalizedRole = normalizeRole(user.role);
  const profileTarget = student ? '/student/profile' : normalizedRole === 'teacher' ? '/teacher/profile' : getHomeRouteByRole(user.role);

  const menuItems = student
    ? [{ icon: User, label: 'View Profile', action: () => navigate(profileTarget) }, ...getStudentAccountDropdownItems().map((item) => ({
        icon: item.icon,
        label: item.label,
        action: () => navigate(item.to),
      }))]
    : normalizedRole === 'teacher'
      ? [
          { icon: User, label: 'View Profile', action: () => navigate('/teacher/profile') },
          { icon: Lock, label: 'Account Settings', action: () => navigate('/teacher/account-settings') },
        ]
      : [{ icon: User, label: 'View Profile', action: () => navigate(profileTarget) }];

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setOpen((value) => !value);
          }
        }}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-accent transition-all duration-200 cursor-pointer ml-1 focus-visible:ring-2 focus-visible:ring-ring"
      >
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={`${user.name} avatar`}
            className="w-7 h-7 rounded-full object-cover border border-border flex-shrink-0"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-xs font-bold text-primary-foreground flex-shrink-0">
            {user.initial}
          </div>
        )}
        <span className="hidden sm:block text-sm text-foreground font-medium">{user.name}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-56 bg-popover border border-border rounded-2xl shadow-2xl shadow-black/50 overflow-hidden"
            role="menu"
          >
            <div className="p-3.5 border-b border-border">
              <p className="text-sm font-semibold text-popover-foreground">{user.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
            </div>

            <div className="p-1.5">
              {menuItems.map(({ icon: Icon, label, action }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    action();
                    setOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-popover-foreground hover:bg-accent transition-all duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-ring"
                  role="menuitem"
                >
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  {label}
                </button>
              ))}
            </div>

            <div className="p-1.5 border-t border-border">
              <Link
                to="/login"
                onClick={() => {
                  onSignOut();
                  setOpen(false);
                }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-red-400"
                role="menuitem"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}