import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import {
  Activity,
  AlertTriangle,
  BookOpenCheck,
  Clock3,
  LayoutDashboard,
  Monitor,
  Settings,
  ShieldAlert,
  Users,
  ClipboardList,
  BookOpen,
  BarChart3,
} from 'lucide-react';

import api from '../../api';
import DashboardCard from '../../components/dashboard/DashboardCard';
import DashboardLayout from '../../components/layout/DashboardLayout';
import type { SidebarNavItem } from '../../components/layout/DashboardSidebar';
import useCurrentUser from '../../hooks/useCurrentUser';

type MonitorResponse = {
  status?: string;
  details?: string[];
};

type ExamSession = {
  id: number;
  status: string;
  started_at?: string | null;
  created_at?: string;
  exam?: {
    title?: string;
    name?: string;
  };
  user?: {
    name?: string;
  };
};

const NAV_ITEMS: SidebarNavItem[] = [
  { label: 'Dashboard Overview', icon: LayoutDashboard },
  { label: 'User Management', icon: Users },
  { label: 'Exam Monitoring', icon: Monitor },
  { label: 'Exam Management', icon: ClipboardList },
  { label: 'Question Bank', icon: BookOpen },
  { label: 'System Monitoring', icon: Activity },
  { label: 'Reports & Analytics', icon: BarChart3 },
  { label: 'Settings', icon: Settings },
];

export default function ExamMonitoring() {
  return (
    <div style={{ padding: 32, textAlign: 'center' }}>
      <h2>Access Restricted</h2>
      <p>The System Administrator does not have access to exam monitoring or academic features.</p>
    </div>
  );
}
// This page is intentionally left blank as Exam Monitoring is not available for IT-only admin.
export default function ExamMonitoring() {
  return null;
}
