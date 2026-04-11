import { LayoutDashboard, Lock, User } from 'lucide-react';
import type { SidebarNavItem } from '../components/layout/DashboardSidebar';

export const TEACHER_NAV_ITEMS: SidebarNavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'View Profile', icon: User },
  { label: 'Account Settings', icon: Lock },
];

export const TEACHER_NAV_PATHS: Record<string, string> = {
  Dashboard: '/teacher/dashboard',
  'View Profile': '/teacher/profile',
  'Account Settings': '/teacher/account-settings',
};

export function getTeacherSidebarRoute(label: string): string | null {
  return TEACHER_NAV_PATHS[label] ?? null;
}
