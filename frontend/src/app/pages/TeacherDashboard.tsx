import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import api from '../api';
import { extractApiData, extractApiError } from '../utils/apiHelpers';
import {
  ClipboardCheck,
  LayoutDashboard,
  FilePlus,
  BookOpen,
  Activity,
  BarChart3,
  Building2,
  User,
  HelpCircle,
  LogOut,
  ChevronDown,
  Users,
  Calendar,
  Settings,
  Upload,
  FileText,
  Eye,
  Pencil,
  GraduationCap,
  TrendingUp,
  CheckCircle,
  Bell,
  Menu,
  X,
  Zap,
  Check,
  ArrowRight,
} from 'lucide-react';

// ── Data ───────────────────────────────────────────────────────────────────────

const stats = [
  {
    label: 'Total Exams Created',
    value: '24',
    icon: FileText,
    change: '+3 this month',
    colorClass: 'blue',
  },
  {
    label: 'Total Students Enrolled',
    value: '320',
    icon: GraduationCap,
    change: '+18 this week',
    colorClass: 'emerald',
  },
  {
    label: 'Active Exams Running',
    value: '3',
    icon: Activity,
    change: '2 ending today',
    colorClass: 'amber',
  },
  {
    label: 'Average Student Score',
    value: '78%',
    icon: BarChart3,
    change: '+2.4% vs last month',
    colorClass: 'purple',
  },
];

const quickActions = [
  { label: 'Create New Exam', icon: FilePlus, desc: 'Start a new examination', color: 'blue' },
  { label: 'Manage Question Bank', icon: BookOpen, desc: 'Add & organize questions', color: 'violet' },
  { label: 'Manage Students', icon: Users, desc: 'View & manage enrollments', color: 'emerald' },
  { label: 'Schedule Exam', icon: Calendar, desc: 'Set date, time & duration', color: 'amber' },
  { label: 'View Results', icon: BarChart3, desc: 'Analyze performance data', color: 'rose' },
  { label: 'Exam Settings', icon: Settings, desc: 'Configure exam parameters', color: 'slate' },
];

const examFormatOptions = [
  {
    title: 'Use Question Types',
    desc: 'Build your exam using structured question formats',
    features: ['Multiple Choice (MCQ)', 'Short Answer', 'Essay Questions', 'Auto grading available'],
    icon: FileText,
    badge: 'Recommended',
  },
  {
    title: 'Upload or Create Document',
    desc: 'Import existing exams or write from scratch',
    features: ['Upload PDF exam', 'Add written answers', 'Text formatting tools', 'Manual grading support'],
    icon: Upload,
    badge: null,
  },
];

const recentExams = [
  { name: 'Midterm Physics', subject: 'Physics', students: 120, date: 'Mar 12', status: 'Active' },
  { name: 'Math Quiz #3', subject: 'Mathematics', students: 85, date: 'Mar 15', status: 'Scheduled' },
  { name: 'Biology Finals', subject: 'Biology', students: 200, date: 'Mar 8', status: 'Completed' },
  { name: 'Chemistry Lab Test', subject: 'Chemistry', students: 45, date: 'Mar 20', status: 'Draft' },
  { name: 'History Essay', subject: 'History', students: 75, date: 'Mar 18', status: 'Scheduled' },
];

const upcomingExams = [
  { name: 'Physics Midterm', time: 'Tomorrow, 10:00 AM', subject: 'Physics', dot: 'bg-blue-400' },
  { name: 'Math Quiz', time: 'Friday, 2:00 PM', subject: 'Mathematics', dot: 'bg-violet-400' },
  { name: 'Biology Practical', time: 'Mon, 9:00 AM', subject: 'Biology', dot: 'bg-emerald-400' },
];

const liveStats = [
  { label: 'Students online now', value: '47', color: 'text-blue-400' },
  { label: 'Exams in progress', value: '3', color: 'text-emerald-400' },
  { label: 'Submissions today', value: '89', color: 'text-amber-400' },
  { label: 'Flags raised', value: '2', color: 'text-rose-400' },
];

// ── Style maps (full class strings so Tailwind scans them) ────────────────────

const statIconStyles: Record<string, string> = {
  blue: 'text-blue-400 bg-blue-500/10',
  emerald: 'text-emerald-400 bg-emerald-500/10',
  amber: 'text-amber-400 bg-amber-500/10',
  purple: 'text-purple-400 bg-purple-500/10',
};

const actionIconStyles: Record<string, string> = {
  blue: 'text-blue-400 bg-blue-500/10 group-hover:bg-blue-500/20',
  violet: 'text-violet-400 bg-violet-500/10 group-hover:bg-violet-500/20',
  emerald: 'text-emerald-400 bg-emerald-500/10 group-hover:bg-emerald-500/20',
  amber: 'text-amber-400 bg-amber-500/10 group-hover:bg-amber-500/20',
  rose: 'text-rose-400 bg-rose-500/10 group-hover:bg-rose-500/20',
  slate: 'text-slate-400 bg-slate-600/20 group-hover:bg-slate-600/30',
};

const statusConfig: Record<string, { classes: string }> = {
  Active: { classes: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' },
  Scheduled: { classes: 'bg-blue-500/10 text-blue-400 border border-blue-500/25' },
  Completed: { classes: 'bg-gray-500/10 text-gray-400 border border-gray-500/25' },
  Draft: { classes: 'bg-amber-500/10 text-amber-400 border border-amber-500/25' },
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState('Dashboard');
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<number | null>(null);
  const [user, setUser] = useState<{name: string, email: string, role: string} | null>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchUser = async () => {
      try {
        const response = await api.get('/me');
        const data = extractApiData(response) ?? response.data;
        setUser(data);
      } catch (err) {
        setUser(null);
      }
    };
    fetchUser();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await api.post('/logout');
    } catch(e) {
      // Optionally handle error
    } finally {
      localStorage.removeItem('token');
      navigate('/login');
    }
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks = [
    { label: 'Dashboard', icon: LayoutDashboard },
    { label: 'New Exam', icon: FilePlus },
    { label: 'Exams', icon: BookOpen },
    { label: 'Monitoring', icon: Activity },
    { label: 'Results', icon: BarChart3 },
  ];

  const profileMenuItems = [
    { icon: User, label: 'View Profile' },
    { icon: Settings, label: 'Account Settings' },
    { icon: HelpCircle, label: 'Help & Training' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ── Sticky Navbar ─────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-card/95 border-b border-border backdrop-blur-md">
        <div className="max-w-screen-2xl mx-auto h-full px-4 lg:px-6 flex items-center justify-between gap-4">

          {/* Left: Logo + Center Nav */}
          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="flex items-center gap-2.5 group shrink-0">
              <div className="w-9 h-9 rounded-xl bg-linear-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-all duration-200 group-hover:scale-105">
                <ClipboardCheck className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-foreground tracking-tight">ExamFlow</span>
            </Link>

            {/* Center nav — desktop */}
            <div className="hidden lg:flex items-center gap-0.5">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = activeNav === link.label;
                return (
                  <button
                    key={link.label}
                    onClick={() => setActiveNav(link.label)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                      isActive
                        ? 'bg-primary/15 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {link.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-1.5">
            {/* Institution badge */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted border border-border mr-1">
              <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-foreground font-medium">Oxford University</span>
            </div>

            {/* Notification bell */}
            <button className="relative w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-primary">
              <Bell className="w-4.5 h-4.5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full ring-2 ring-card"></span>
            </button>

            {/* Help */}
            <button className="hidden sm:flex w-9 h-9 rounded-lg items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-primary">
              <HelpCircle className="w-4.5 h-4.5" />
            </button>

            {/* Profile dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-accent transition-all duration-200 cursor-pointer ml-1 focus-visible:ring-2 focus-visible:ring-primary"
              >
                <div className="w-7 h-7 rounded-full bg-linear-to-br from-primary to-primary/70 flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0">
                  {user?.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="hidden sm:block text-sm text-foreground font-medium">
                  {user?.name || 'User'}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${
                    profileOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-56 bg-popover border border-border rounded-2xl shadow-2xl shadow-black/50 overflow-hidden"
                  >
                    <div className="p-3.5 border-b border-border">
                      <p className="text-sm font-semibold text-popover-foreground">{user?.name || 'Loading...'}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{user?.email || ''}</p>
                    </div>
                    <div className="p-1.5">
                      {profileMenuItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.label}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-popover-foreground hover:bg-accent transition-all duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <Icon className="w-4 h-4 text-muted-foreground" />
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                    <div className="p-1.5 border-t border-border">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-red-400"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Logout shortcut — desktop */}
            <button
              onClick={handleLogout}
              className="hidden lg:flex w-9 h-9 rounded-lg items-center justify-center text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-red-400"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-all cursor-pointer ml-1 focus-visible:ring-2 focus-visible:ring-primary"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile nav menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden bg-card border-t border-border overflow-hidden"
            >
              <div className="px-4 py-3 space-y-1">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = activeNav === link.label;
                  return (
                    <button
                      key={link.label}
                      onClick={() => { setActiveNav(link.label); setMobileMenuOpen(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                        isActive ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {link.label}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ── Page Content ──────────────────────────────────────────────────── */}
      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

          {/* Welcome Banner */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
          >
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-1">
                Welcome back, {user?.name || 'Loading...'} 👋
              </h1>
              <p className="text-muted-foreground text-sm">
                Create exams, manage students, and monitor results in real time.
              </p>
            </div>
            <button className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold text-sm transition-all duration-200 shadow-lg shadow-primary/20 hover:shadow-primary/40 cursor-pointer hover:scale-[1.02] active:scale-95 whitespace-nowrap shrink-0">
              <FilePlus className="w-4 h-4" />
              Create New Exam
            </button>
          </motion.div>

          {/* ── Stats Grid ─────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              const iconStyle = statIconStyles[stat.colorClass];
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: i * 0.07 }}
                  className="bg-card border border-border rounded-2xl p-5 hover:border-border/80 hover:shadow-xl hover:shadow-black/20 transition-all duration-300 group cursor-default"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconStyle}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <TrendingUp className="w-4 h-4 text-muted-foreground group-hover:text-emerald-400 transition-colors duration-300" />
                  </div>
                  <div className="text-3xl font-bold text-foreground mb-1">{stat.value}</div>
                  <div className="text-xs text-muted-foreground mb-2">{stat.label}</div>
                  <div className="text-xs text-emerald-400 font-medium">{stat.change}</div>
                </motion.div>
              );
            })}
          </div>

          {/* ── Main Layout (content + sidebar) ────────────────────────────── */}
          <div className="flex flex-col xl:flex-row gap-6">

            {/* ── Main Content ──────────────────────────────────────────────── */}
            <div className="flex-1 min-w-0 space-y-6">

              {/* Quick Actions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.28 }}
              >
                <h2 className="text-base font-semibold text-foreground mb-3">Quick Actions</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {quickActions.map((action) => {
                    const Icon = action.icon;
                    const iconStyle = actionIconStyles[action.color];
                    return (
                      <motion.button
                        key={action.label}
                        whileHover={{ y: -2, transition: { duration: 0.15 } }}
                        className="group bg-card border border-border hover:border-border/80 rounded-xl p-4 text-left transition-all duration-200 cursor-pointer hover:shadow-lg hover:shadow-black/20"
                      >
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 transition-all duration-200 ${iconStyle}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="text-sm font-semibold text-foreground group-hover:text-foreground transition-colors mb-0.5">
                          {action.label}
                        </div>
                        <div className="text-xs text-muted-foreground">{action.desc}</div>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>

              {/* Choose Exam Format */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.35 }}
                className="bg-card border border-border rounded-2xl p-6"
              >
                <div className="mb-5">
                  <h2 className="text-base font-semibold text-foreground mb-1">Choose Exam Format</h2>
                  <p className="text-sm text-muted-foreground">How will this look for the students?</p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 mb-4">
                  {examFormatOptions.map((option, i) => {
                    const Icon = option.icon;
                    const isSelected = selectedFormat === i;
                    return (
                      <button
                        key={option.title}
                        onClick={() => setSelectedFormat(isSelected ? null : i)}
                        className={`relative text-left p-5 rounded-xl border transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? 'border-blue-500 bg-blue-500/5 shadow-lg shadow-blue-500/10'
                            : 'border-border bg-muted/30 hover:border-border/80 hover:bg-muted/60'
                        }`}
                      >
                        {/* Badge / selected check */}
                        {isSelected ? (
                          <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        ) : option.badge ? (
                          <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-xs font-medium border border-blue-500/20">
                            {option.badge}
                          </span>
                        ) : null}

                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-all duration-200 ${
                            isSelected ? 'bg-blue-500/15 text-blue-400' : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <h3 className="text-sm font-semibold text-foreground mb-1">{option.title}</h3>
                        <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{option.desc}</p>
                        <ul className="space-y-1.5">
                          {option.features.map((feat) => (
                            <li key={feat} className="flex items-center gap-2 text-xs text-muted-foreground">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              {feat}
                            </li>
                          ))}
                        </ul>
                      </button>
                    );
                  })}
                </div>

                {/* PDF conversion CTA */}
                <button className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl border border-dashed border-border hover:border-primary/40 hover:bg-primary/5 text-sm text-muted-foreground hover:text-primary transition-all duration-200 cursor-pointer group">
                  <Upload className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                  Convert PDF to Auto-Marked Questions
                  <span className="px-1.5 py-0.5 rounded text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                    Beta
                  </span>
                </button>
              </motion.div>

              {/* Recent Exams Table */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.42 }}
                className="bg-card border border-border rounded-2xl overflow-hidden"
              >
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                  <h2 className="text-base font-semibold text-foreground">Recent Exams</h2>
                  <button className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors cursor-pointer">
                    View all
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Exam Name</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Subject</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Students</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Date</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                        <th className="text-right px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {recentExams.map((exam, i) => {
                        const cfg = statusConfig[exam.status];
                        return (
                          <tr
                            key={exam.name}
                            className="hover:bg-accent/30 transition-colors duration-150 group"
                          >
                            <td className="px-6 py-4">
                              <span className="text-sm font-medium text-foreground group-hover:text-foreground transition-colors">
                                {exam.name}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <span className="text-sm text-muted-foreground">{exam.subject}</span>
                            </td>
                            <td className="px-4 py-4 hidden sm:table-cell">
                              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                <Users className="w-3.5 h-3.5" />
                                {exam.students}
                              </div>
                            </td>
                            <td className="px-4 py-4 hidden md:table-cell">
                              <span className="text-sm text-muted-foreground">{exam.date}</span>
                            </td>
                            <td className="px-4 py-4">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${cfg.classes}`}>
                                {exam.status}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-end gap-0.5">
                                <button
                                  className="p-1.5 rounded-lg text-muted-foreground hover:text-blue-400 hover:bg-blue-500/10 transition-all duration-200 cursor-pointer"
                                  title="Edit"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  className="p-1.5 rounded-lg text-muted-foreground hover:text-amber-400 hover:bg-amber-500/10 transition-all duration-200 cursor-pointer"
                                  title="Monitor"
                                >
                                  <Activity className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  className="p-1.5 rounded-lg text-muted-foreground hover:text-emerald-400 hover:bg-emerald-500/10 transition-all duration-200 cursor-pointer"
                                  title="View Results"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </div>

            {/* ── Right Sidebar ────────────────────────────────────────────── */}
            <motion.aside
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
              className="xl:w-72 shrink-0 space-y-4"
            >
              {/* Upcoming Exams */}
              <div className="bg-card border border-border rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  Upcoming Exams
                </h3>
                <div className="space-y-2">
                  {upcomingExams.map((exam) => (
                    <div
                      key={exam.name}
                      className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 hover:bg-muted border border-transparent hover:border-border/80 transition-all duration-200 cursor-pointer group"
                    >
                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${exam.dot}`} />
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-foreground group-hover:text-foreground transition-colors truncate">
                          {exam.name}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">{exam.time}</div>
                        <div className="text-xs text-muted-foreground/80 mt-0.5">{exam.subject}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Live Activity */}
              <div className="bg-card border border-border rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  Live Activity
                </h3>
                <div className="space-y-3">
                  {liveStats.map((item) => (
                    <div key={item.label} className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{item.label}</span>
                      <span className={`text-sm font-bold ${item.color}`}>{item.value}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-2 pt-3 border-t border-border">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shrink-0" />
                  <span className="text-xs text-muted-foreground">Live monitoring active</span>
                </div>
              </div>

              {/* Pro Tip */}
              <div className="bg-linear-to-br from-blue-600/10 to-violet-600/10 border border-blue-500/20 rounded-2xl p-5">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center shrink-0">
                    <Zap className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-1">Pro Tip</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Use the Question Bank to reuse questions across multiple exams and save time on repeat assessments.
                    </p>
                    <button className="mt-3 text-xs text-primary hover:text-primary/80 font-medium cursor-pointer transition-colors">
                      Learn more →
                    </button>
                  </div>
                </div>
              </div>

              {/* Grade distribution mini chart */}
              <div className="bg-card border border-border rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-purple-400" />
                  Grade Distribution
                </h3>
                <div className="space-y-2">
                  {[
                    { grade: 'A (90–100%)', pct: 22, color: 'bg-emerald-400' },
                    { grade: 'B (75–89%)', pct: 38, color: 'bg-blue-400' },
                    { grade: 'C (60–74%)', pct: 25, color: 'bg-amber-400' },
                    { grade: 'D / F (<60%)', pct: 15, color: 'bg-rose-400' },
                  ].map((row) => (
                    <div key={row.grade}>
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>{row.grade}</span>
                        <span>{row.pct}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${row.pct}%` }}
                          transition={{ duration: 0.8, delay: 0.6 }}
                          className={`h-full rounded-full ${row.color}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.aside>
          </div>
        </div>
      </div>
    </div>
  );
}
