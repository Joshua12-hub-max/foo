import { useState, useRef, useEffect, useCallback } from "react";
import { Bell, X, Check, AlertCircle, FileText, Calendar, Clock, RefreshCw, LucideIcon } from "lucide-react";
import { notificationApi } from "@/api/notificationApi";
import { useAuthStore } from "@/stores";

interface NotificationStyle {
  icon: LucideIcon;
  color: string;
  bg: string;
}

// Get icon and color based on notification type
const getNotificationStyle = (type: string): NotificationStyle => {
  const styles: Record<string, NotificationStyle> = {
    leave_request: { icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-50' },
    leave_process: { icon: RefreshCw, color: 'text-blue-600', bg: 'bg-blue-50' },
    leave_finalize: { icon: Check, color: 'text-cyan-600', bg: 'bg-cyan-50' },
    leave_approval: { icon: Check, color: 'text-green-600', bg: 'bg-green-50' },
    leave_rejection: { icon: X, color: 'text-red-600', bg: 'bg-red-50' },
    dtr_request: { icon: Clock, color: 'text-purple-600', bg: 'bg-purple-50' },
    dtr_approval: { icon: Check, color: 'text-green-600', bg: 'bg-green-50' },
    dtr_rejection: { icon: X, color: 'text-red-600', bg: 'bg-red-50' },
    memo_request: { icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    memo_acknowledged: { icon: Check, color: 'text-green-600', bg: 'bg-green-50' },
    event_created: { icon: Calendar, color: 'text-pink-600', bg: 'bg-pink-50' },
    announcement: { icon: Bell, color: 'text-amber-600', bg: 'bg-amber-50' },
  };
  return styles[type] || { icon: Bell, color: 'text-gray-600', bg: 'bg-gray-50' };
};

// Format relative time
const formatTimeAgo = (dateString?: string) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
};

interface NotificationItem {
  notificationId: string | number;
  type: string;
  title: string;
  message: string;
  status: 'read' | 'unread';
  createdAt: string;
  senderName?: string;
}

interface NotificationResponse {
  success: boolean;
  notifications: NotificationItem[];
  unreadCount: number;
}

export default function EmployeeNotificationMenu() {
  const { isAuthenticated } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await notificationApi.getNotifications({ limit: 20, offset: 0 });
      const data = response.data as NotificationResponse;
      setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
      setUnreadCount(typeof data.unreadCount === 'number' ? data.unreadCount : 0);
    } catch (err) {
      console.error('Notification fetch error:', err);
      setError('Unable to load notifications');
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Fetch just the unread count for polling
  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const response = await notificationApi.getUnreadCount();
      const data = response.data as { success: boolean; unreadCount: number };
      setUnreadCount(typeof data.unreadCount === 'number' ? data.unreadCount : 0);
    } catch (err) {
      console.error('Unread count fetch error:', err);
    }
  }, [isAuthenticated]);

  // Mark notification as read
  const handleMarkAsRead = useCallback(async (id: string | number) => {
    if (!isAuthenticated) return;
    try {
      await notificationApi.markAsRead(id);
      setNotifications(prev => prev.map(n => 
        n.notificationId === id ? { ...n, status: 'read' } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Mark as read error:', err);
    }
  }, [isAuthenticated]);

  // Delete notification
  const handleDelete = useCallback(async (id: string | number) => {
    if (!isAuthenticated) return;
    try {
      const notification = notifications.find(n => n.notificationId === id);
      await notificationApi.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.notificationId !== id));
      if (notification?.status === 'unread') {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Delete notification error:', err);
    }
  }, [isAuthenticated, notifications]);

  // Mark all as read
  const handleMarkAllAsRead = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const unreadNotifications = notifications.filter(n => n.status === 'unread');
      await Promise.all(unreadNotifications.map(n => notificationApi.markAsRead(n.notificationId)));
      setNotifications(prev => prev.map(n => ({ ...n, status: 'read' })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Mark all as read error:', err);
    }
  }, [isAuthenticated, notifications]);


  // Initial fetch and polling
  useEffect(() => {
    if (!isAuthenticated) {
        setNotifications([]);
        setUnreadCount(0);
        return;
    }
    fetchNotifications();
    const pollInterval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(pollInterval);
  }, [isAuthenticated, fetchNotifications, fetchUnreadCount]);

  // Refresh when menu opens
  useEffect(() => {
    if (isOpen) fetchNotifications();
  }, [isOpen, fetchNotifications]);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-6 h-6 text-slate-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold text-white bg-red-500 rounded-full px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-12 right-0 w-80 sm:w-96 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="bg-gray-200 shadow-md px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-gray-700" />
                <h3 className="text-base font-semibold text-gray-700">Notifications</h3>
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={fetchNotifications}
                  className="p-1 hover:bg-gray-300 rounded-full transition-colors"
                  title="Refresh"
                >
                  <RefreshCw className={`w-4 h-4 text-gray-700 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
            </p>
          </div>

          {/* Notification List */}
          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="py-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-700 border-t-transparent mx-auto mb-2" />
                <p className="text-sm text-gray-500">Loading...</p>
              </div>
            ) : error ? (
              <div className="py-8 text-center">
                <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-2" />
                <p className="text-sm text-red-600 mb-2">{error}</p>
                <button
                  onClick={fetchNotifications}
                  className="text-sm text-green-700 hover:underline"
                >
                  Try again
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center">
                <Bell className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => {
                  const style = getNotificationStyle(notification.type);
                  const IconComponent = style.icon;
                  const isUnread = notification.status === 'unread';

                  return (
                    <div
                      key={notification.notificationId}
                      onClick={() => isUnread && handleMarkAsRead(notification.notificationId)}
                      className={`group flex items-start gap-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                        isUnread ? 'bg-blue-50/30' : ''
                      }`}
                    >
                      {/* Icon */}
                      <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${style.bg}`}>
                        <IconComponent className={`w-4 h-4 ${style.color}`} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm truncate ${isUnread ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                            {notification.senderName?.trim() || notification.title || 'Notification'}
                          </p>
                          {isUnread && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                          )}
                          {/* Status Badge */}
                          {(notification.type?.toLowerCase().includes('request') || 
                            notification.type?.toLowerCase().includes('pending') ||
                            notification.type?.toLowerCase().includes('process') ||
                            notification.type?.toLowerCase().includes('finalize')) && 
                           !notification.type?.toLowerCase().includes('approved') && 
                           !notification.type?.toLowerCase().includes('rejected') && 
                           !notification.type?.toLowerCase().includes('approval') && 
                           !notification.type?.toLowerCase().includes('rejection') && 
                           !notification.type?.toLowerCase().includes('acknowledged') && (
                            <span className="px-1.5 py-0.5 text-[10px] font-medium bg-amber-100 text-amber-700 rounded whitespace-nowrap">Pending</span>
                          )}
                          {(notification.type?.toLowerCase().includes('approved') || 
                            notification.type?.toLowerCase().includes('approval') ||
                            notification.type?.toLowerCase().includes('acknowledged')) && (
                            <span className="px-1.5 py-0.5 text-[10px] font-medium bg-green-100 text-green-700 rounded whitespace-nowrap">Completed</span>
                          )}
                          {(notification.type?.toLowerCase().includes('rejected') || 
                            notification.type?.toLowerCase().includes('rejection')) && (
                            <span className="px-1.5 py-0.5 text-[10px] font-medium bg-red-100 text-red-700 rounded whitespace-nowrap">Rejected</span>
                          )}
                        </div>
                        {notification.senderName?.trim() && (
                          <p className="text-xs text-gray-600 truncate mt-0.5">
                            {notification.title}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 truncate">
                          {notification.message || 'No details'}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-1">
                          {formatTimeAgo(notification.createdAt)}
                        </p>
                      </div>

                      {/* Delete Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(notification.notificationId);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-all"
                        title="Delete"
                      >
                        <X className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-gray-100 px-4 py-2 bg-gray-50">
              <p className="text-xs text-center text-gray-500">
                Showing {notifications.length} notification{notifications.length > 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
