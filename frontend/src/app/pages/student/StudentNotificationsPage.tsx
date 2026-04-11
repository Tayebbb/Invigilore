import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bell,
  BellOff,
  Check,
  Trash2,
  ExternalLink,
  CheckCheck,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { STUDENT_NAV_ITEMS, getStudentSidebarRoute } from '../../navigation/studentNavigation';
import api from '../../api';
import useCurrentUser from '../../hooks/useCurrentUser';

interface Notification {
  id: string;
  data: {
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    action_url?: string;
    timestamp: string;
  };
  read_at: string | null;
  created_at: string;
}

const TYPE_STYLES: Record<string, string> = {
  success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
  warning: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
  error:   'bg-rose-500/10 border-rose-500/20 text-rose-400',
  info:    'bg-blue-500/10 border-blue-500/20 text-blue-400',
};

const TYPE_DOT: Record<string, string> = {
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  error:   'bg-rose-500',
  info:    'bg-blue-500',
};

export default function StudentNotificationsPage() {
  const navigate = useNavigate();
  const currentUser = useCurrentUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const studentUser = {
    name: currentUser.name,
    email: currentUser.email,
    initial: currentUser.initial,
    role: 'Student' as const,
  };

  async function fetchNotifications() {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.notifications.data ?? []);
      setUnreadCount(res.data.unread_count ?? 0);
    } catch {
      setError('Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  async function markAsRead(id: string) {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      // ignore
    }
  }

  async function markAllAsRead() {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  }

  async function deleteNotification(id: string) {
    try {
      await api.delete(`/notifications/${id}`);
      const removed = notifications.find(n => n.id === id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (removed && !removed.read_at) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch {
      // ignore
    }
  }

  async function clearAll() {
    try {
      await api.delete('/notifications');
      setNotifications([]);
      setUnreadCount(0);
    } catch {
      // ignore
    }
  }

  const handleNav = (label: string) => {
    const route = getStudentSidebarRoute(label);
    if (route) navigate(route);
  };

  return (
    <DashboardLayout
      role="Student"
      navItems={STUDENT_NAV_ITEMS}
      activeItem="Notifications"
      onNavChange={handleNav}
      user={studentUser}
      pageTitle="Notifications"
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-3xl mx-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 border border-blue-500/20 flex items-center justify-center">
                <Bell className="w-4.5 h-4.5 text-blue-400" style={{ width: 18, height: 18 }} />
              </div>
              <h2 className="text-xl font-bold text-white">Notifications</h2>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-bold text-emerald-400">
                  {unreadCount} unread
                </span>
              )}
            </div>
            <p className="text-sm text-gray-400 ml-12">Exam updates, results, and system alerts.</p>
          </div>

          {notifications.length > 0 && (
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
              <button
                onClick={clearAll}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold hover:bg-rose-500/20 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Notifications list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 rounded-2xl border border-gray-800 bg-gray-900/40 animate-pulse" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <BellOff className="w-12 h-12 text-gray-800 mb-4" />
            <p className="text-base font-semibold text-gray-600">All caught up!</p>
            <p className="text-sm text-gray-700 mt-1">No notifications yet. Check back later.</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            <div className="space-y-2">
              {notifications.map((notif, i) => (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2, delay: i * 0.03 }}
                  className={`group relative rounded-2xl border p-4 transition-all ${
                    notif.read_at
                      ? 'bg-gray-900/30 border-gray-800/50 opacity-60'
                      : 'bg-gray-900/60 border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="flex gap-3">
                    {/* Type dot */}
                    <div className="mt-1.5 shrink-0">
                      <div className={`w-2 h-2 rounded-full ${notif.read_at ? 'bg-gray-700' : (TYPE_DOT[notif.data.type] ?? TYPE_DOT.info)} ${!notif.read_at ? 'shadow-[0_0_8px_rgba(99,102,241,0.5)]' : ''}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className={`text-sm font-bold ${notif.read_at ? 'text-gray-400' : 'text-white'}`}>
                            {notif.data.title}
                          </h4>
                          <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase ${TYPE_STYLES[notif.data.type] ?? TYPE_STYLES.info}`}>
                            {notif.data.type}
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-600 whitespace-nowrap shrink-0">
                          {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                        </span>
                      </div>

                      <p className="text-xs text-gray-400 leading-relaxed mb-2">
                        {notif.data.message}
                      </p>

                      <div className="flex items-center gap-3">
                        {notif.data.action_url && (
                          <a
                            href={notif.data.action_url}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-500 hover:text-emerald-400 transition-colors"
                          >
                            View Details
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      {!notif.read_at && (
                        <button
                          onClick={() => markAsRead(notif.id)}
                          title="Mark as read"
                          className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-gray-600 hover:text-emerald-400 transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notif.id)}
                        title="Delete"
                        className="p-1.5 rounded-lg hover:bg-rose-500/10 text-gray-600 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </motion.div>
    </DashboardLayout>
  );
}
