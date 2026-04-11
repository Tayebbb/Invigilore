import { Bell, Calendar, Clock, Lock, Trophy, User } from 'lucide-react';
import type { SidebarNavItem } from '../components/layout/DashboardSidebar';

export const STUDENT_NAV_ITEMS: SidebarNavItem[] = [
  { label: 'Dashboard', icon: Calendar },
  { label: 'My Results', icon: Trophy },
  { label: 'Submission History', icon: Clock },
  { label: 'Notifications', icon: Bell },
  { label: 'Profile', icon: User },
];

export const STUDENT_NAV_PATHS: Record<string, string> = {
  Dashboard: '/student/dashboard',
  'My Results': '/student/results',
  'Submission History': '/student/submissions',
  Notifications: '/student/notifications',
  Profile: '/student/profile',
};

export function getStudentSidebarRoute(label: string): string | null {
  return STUDENT_NAV_PATHS[label] ?? null;
}

export function getStudentAccountDropdownItems() {
  return [
    { label: 'Account Settings', icon: Lock, to: '/student/account-settings' },
    { label: 'Help & Support', icon: Bell, to: '/student/help-support' },
  ];
}
