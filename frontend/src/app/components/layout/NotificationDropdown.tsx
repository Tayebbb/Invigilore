import { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2, ExternalLink, Clock, BellOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router';
import api from '../../api';
import { formatDistanceToNow } from 'date-fns';

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

export default function NotificationDropdown() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.notifications.data);
      setUnreadCount(res.data.unread_count);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Real-time polling - every 60 seconds
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const openNotification = async (notif: Notification) => {
    if (!notif.read_at) {
      await markAsRead(notif.id);
    }

    setIsOpen(false);

    if (notif.data.action_url) {
      navigate(notif.data.action_url);
      return;
    }

    navigate('/teacher/notifications');
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const clearAll = async () => {
    try {
      await api.delete('/notifications');
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to clear all:', err);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl bg-gray-900/50 border border-gray-800 hover:border-emerald-500/50 transition-all group"
      >
        <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'text-emerald-500 animate-pulse' : 'text-gray-400 group-hover:text-emerald-500'}`} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-black" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-3 w-80 sm:w-96 bg-gray-900/90 backdrop-blur-xl border border-gray-800 rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Notifications</h3>
                <p className="text-[10px] text-gray-400 font-medium">You have {unreadCount} unread alerts</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={markAllAsRead}
                  className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-emerald-500 transition-colors"
                  title="Mark all as read"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={clearAll}
                  className="p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-500 transition-colors"
                  title="Clear all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-xs text-gray-500">Loading alerts...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-12 text-center">
                  <BellOff className="w-8 h-8 text-gray-800 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 font-medium">All caught up!</p>
                  <p className="text-[10px] text-gray-700 mt-1">No new notifications today.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-800/50">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => { void openNotification(notif); }}
                      className={`p-4 transition-colors cursor-pointer group ${notif.read_at ? 'opacity-60 grayscale-[0.5]' : 'bg-emerald-500/[0.02] hover:bg-emerald-500/[0.05]'}`}
                    >
                      <div className="flex gap-3">
                        <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${notif.read_at ? 'bg-gray-800' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <h4 className={`text-xs font-bold truncate ${notif.read_at ? 'text-gray-400' : 'text-white'}`}>
                              {notif.data.title}
                            </h4>
                            <span className="text-[9px] text-gray-600 font-bold whitespace-nowrap">
                              {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed mb-2">
                            {notif.data.message}
                          </p>
                          {notif.data.action_url && (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                void openNotification(notif);
                              }}
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-500 hover:text-emerald-400"
                            >
                              View Details
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {notifications.length > 0 && (
              <div className="p-3 bg-gray-950/50 border-t border-gray-800 text-center">
                <button 
                  onClick={() => setIsOpen(false)}
                  className="text-[10px] font-bold text-gray-600 uppercase tracking-widest hover:text-white transition-colors"
                >
                  Close Panel
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
