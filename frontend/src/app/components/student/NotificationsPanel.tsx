import { useMemo, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { StudentNotification } from '../../pages/student/studentTypes';

interface NotificationsPanelProps {
  notifications: StudentNotification[];
}

export default function NotificationsPanel({ notifications }: NotificationsPanelProps) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<StudentNotification[]>(notifications);

  const unreadCount = useMemo(() => items.filter((n) => !n.read).length, [items]);

  const markAsRead = (id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAll = () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className="relative h-9 w-9 rounded-lg border border-gray-800 bg-gray-900 text-gray-300 hover:text-white"
        aria-label="Open notifications"
      >
        <Bell className="mx-auto h-4 w-4" />
        {unreadCount > 0 && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-teal-400" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute right-0 z-50 mt-2 w-96 rounded-xl border border-gray-800 bg-gray-950 p-3 shadow-2xl"
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-white">Notifications</p>
              <button
                type="button"
                onClick={markAll}
                className="inline-flex items-center gap-1 text-xs text-teal-300 hover:text-teal-200"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            </div>

            <div className="max-h-96 space-y-2 overflow-auto">
              {items.length === 0 && <p className="text-xs text-gray-500">No notifications yet.</p>}
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => markAsRead(item.id)}
                  className={`w-full rounded-lg border p-3 text-left ${
                    item.read ? 'border-gray-800 bg-gray-900/40' : 'border-teal-500/30 bg-teal-500/10'
                  }`}
                >
                  <p className="text-xs font-semibold text-white">{item.title}</p>
                  <p className="mt-1 text-xs text-gray-300">{item.message}</p>
                  <p className="mt-1 text-[11px] text-gray-500">{new Date(item.timestamp).toLocaleString()}</p>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
