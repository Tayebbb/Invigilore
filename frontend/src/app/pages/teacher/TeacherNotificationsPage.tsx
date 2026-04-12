import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Bell, Check, Clock3, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { TEACHER_NAV_ITEMS, getTeacherSidebarRoute } from '../../navigation/teacherNavigation';
import useCurrentUser from '../../hooks/useCurrentUser';
import api, { clearApiCacheForPath } from '../../api';

type NotificationItem = {
  id: string;
  read_at: string | null;
  created_at: string;
  data: {
    title?: string;
    message?: string;
    type?: 'info' | 'success' | 'warning' | 'error';
    action_url?: string;
  };
};

type NotificationResponse = {
  unread_count: number;
  notifications: {
    data: NotificationItem[];
    current_page: number;
    last_page: number;
    total: number;
  };
};

export default function TeacherNotificationsPage() {
  const navigate = useNavigate();
  const currentUser = useCurrentUser();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  const teacherUser = useMemo(() => ({
    name: currentUser.name,
    email: currentUser.email,
    initial: currentUser.initial,
    role: 'Teacher' as const,
  }), [currentUser]);

  const loadNotifications = async (pageToLoad = 1) => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get<NotificationResponse>(`/notifications?page=${pageToLoad}`);
      const payload = response.data;
      setItems(payload?.notifications?.data ?? []);
      setUnreadCount(Number(payload?.unread_count ?? 0));
      setPage(Number(payload?.notifications?.current_page ?? 1));
      setLastPage(Number(payload?.notifications?.last_page ?? 1));
    } catch {
      setError('Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications(1);
  }, []);

  const handleNav = (label: string) => {
    const route = getTeacherSidebarRoute(label);
    if (route) {
      navigate(route);
    }
  };

  const markOneAsRead = async (item: NotificationItem) => {
    if (item.read_at) {
      if (item.data?.action_url) {
        navigate(item.data.action_url);
      }
      return;
    }

    try {
      await api.patch(`/notifications/${item.id}/read`);
      clearApiCacheForPath('/notifications');
      await loadNotifications(page);
      if (item.data?.action_url) {
        navigate(item.data.action_url);
      }
    } catch {
      setError('Unable to mark notification as read.');
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      clearApiCacheForPath('/notifications');
      await loadNotifications(page);
    } catch {
      setError('Unable to mark all notifications as read.');
    }
  };

  const clearAll = async () => {
    try {
      await api.delete('/notifications');
      clearApiCacheForPath('/notifications');
      await loadNotifications(1);
    } catch {
      setError('Unable to clear notifications.');
    }
  };

  return (
    <DashboardLayout
      role="Teacher"
      navItems={TEACHER_NAV_ITEMS}
      activeItem="Notifications"
      onNavChange={handleNav}
      user={teacherUser}
      pageTitle="Notifications"
    >
      <div className="mx-auto max-w-5xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-white">Notifications</h2>
            <p className="text-sm text-gray-400">Unread: {unreadCount}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={markAllAsRead}
              className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20"
            >
              <Check className="h-3.5 w-3.5" />
              Mark all read
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="inline-flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/20"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear all
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>
        )}

        <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900">
          {loading ? (
            <div className="p-8 text-center text-sm text-gray-400">Loading notifications...</div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-400">No notifications yet.</div>
          ) : (
            <div className="divide-y divide-gray-800">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => markOneAsRead(item)}
                  className={`w-full px-4 py-4 text-left transition-colors hover:bg-gray-800/60 ${item.read_at ? 'opacity-70' : 'bg-emerald-500/[0.03]'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">{item.data?.title ?? 'Notification'}</p>
                      <p className="mt-1 text-sm text-gray-300">{item.data?.message ?? ''}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 whitespace-nowrap text-xs text-gray-500">
                      <Clock3 className="h-3.5 w-3.5" />
                      {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {lastPage > 1 && (
          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => loadNotifications(page - 1)}
              className="rounded-lg border border-gray-700 px-3 py-1.5 text-xs text-gray-300 disabled:opacity-40"
            >
              Prev
            </button>
            <span className="text-xs text-gray-400">Page {page} of {lastPage}</span>
            <button
              type="button"
              disabled={page >= lastPage}
              onClick={() => loadNotifications(page + 1)}
              className="rounded-lg border border-gray-700 px-3 py-1.5 text-xs text-gray-300 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
