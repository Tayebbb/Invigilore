import { LayoutGrid, Users, Database, UserCog, type LucideIcon } from 'lucide-react';

export interface TeacherPortalNavItem {
  label: string;
  icon: LucideIcon;
  path: string;
}

export const TEACHER_PORTAL_NAV: TeacherPortalNavItem[] = [
  { label: 'My tests', icon: LayoutGrid, path: '/teacher/dashboard' },
  { label: 'Respondents', icon: Users, path: '/teacher/respondents' },
  { label: 'Results database', icon: Database, path: '/teacher/results-database' },
  { label: 'My account', icon: UserCog, path: '/teacher/account' },
];
