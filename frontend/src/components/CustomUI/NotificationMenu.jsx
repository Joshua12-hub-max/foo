import { useState, useRef, useEffect, useCallback, useMemo, memo } from "react";
import { Bell, X, Eye, FileEdit, CheckCircle, XCircle, UserPlus } from "lucide-react";
import { notificationApi } from "../../api/notificationApi";
import { formatDistanceToNow } from 'date-fns';

// Notification type configurations
const notificationTypeConfig = {
  dtr_correction: {
    icon: FileEdit,
    color: 'text-[#535C91]',
    bgColor: 'bg-[#535C91]/10',
  },
  dtr_approval: {
    icon: CheckCircle,
    color: 'text-[#79B791]',
    bgColor: 'bg-[#79B791]/10',
  },
  dtr_rejection: {
    icon: XCircle,
    color: 'text-[#7A0000]',
    bgColor: 'bg-[#7A0000]/10',
  },
  undertime_request: {
    icon: FileEdit,
    color: 'text-[#4B4376]',
    bgColor: 'bg-[#4B4376]/10',
  },
  undertime_approval: {
    icon: CheckCircle,
    color: 'text-[#79B791]',
    bgColor: 'bg-[#79B791]/10',
  },
  undertime_rejection: {
    icon: XCircle,
    color: 'text-[#7A0000]',
    bgColor: 'bg-[#7A0000]/10',
  },
  leave_request: {
    icon: FileEdit,
    color: 'text-[#A27B5C]',
    bgColor: 'bg-[#A27B5C]/10',
  },
  leave_approval: {
    icon: CheckCircle,
    color: 'text-[#79B791]',
    bgColor: 'bg-[#79B791]/10',
  },
  leave_rejection: {
    icon: XCircle,
    color: 'text-[#7A0000]',
    bgColor: 'bg-[#7A0000]/10',
  },
  leave_process: {
    icon: CheckCircle,
    color: 'text-[#535C91]',
    bgColor: 'bg-[#535C91]/10',
  },
  leave_finalize: {
    icon: CheckCircle,
    color: 'text-[#9290C3]',
    bgColor: 'bg-[#9290C3]/10',
  },
  schedule_assigned: {
    icon: FileEdit,
    color: 'text-[#535C91]',
    bgColor: 'bg-[#535C91]/10',
  }
};

// Memoized Notification Item Component
const NotificationItem = memo(({ notification, onDelete, onMarkAsRead }) => {
  const { notification_id, title, message, status, type, created_at } = notification;

  const typeConfig = notificationTypeConfig[type] || {
    icon: Bell,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
  };

  const Icon = typeConfig.icon;
  const isUnread = status === 'unread';
  const timeAgo = created_at ? formatDistanceToNow(new Date(created_at), { addSuffix: true }) : '';

  const handleClick = useCallback(() => {
    if (isUnread) {
      onMarkAsRead(notification_id);
    }
  }, [notification_id, isUnread, onMarkAsRead]);

  const handleDelete = useCallback((e) => {
    e.stopPropagation();
    onDelete(notification_id);
  }, [notification_id, onDelete]);

  return (
    <div 
      onClick={handleClick}
      className={`group flex items-center gap-3 p-4 border rounded-2xl hover:shadow-sm transition-all cursor-pointer ${
        isUnread ? 'bg-white border-gray-300' : 'bg-gray-50 border-gray-200'
      }`}
    >
      {/* Type Icon */}
      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${typeConfig.bgColor}`}>
        <Icon className={`w-5 h-5 ${typeConfig.color}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-black truncate">
            {title}
          </p>
          {isUnread && (
            <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>
          )}
        </div>
        <p className="text-sm text-slate-500 truncate">
          {message}
        </p>
      </div>

      {/* Time & Close */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-xs text-slate-400 whitespace-nowrap">{timeAgo}</span>
        <button
          onClick={handleDelete}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded-full"
          aria-label="Delete notification"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>
    </div>
  );
});

NotificationItem.displayName = "NotificationItem";

// Memoized Empty State
const EmptyState = memo(() => (
  <div className="px-5 py-8 text-center">
    <Bell className="w-12 h-12 text-[#274b46] mx-auto mb-3" />
    <p className="text-sm text-[#274b46] font-semibold mb-1">All caught up!</p>
    <p className="text-xs text-[#274b46] mt-1">No new notifications</p>
  </div>
));

EmptyState.displayName = "EmptyState";

// Memoized Badge Component
const NotificationBadge = memo(({ count }) => (
  <div className="absolute top-1 right-1 flex items-center justify-center">
    <span className="absolute w-3 h-3 bg-red-500 rounded-full animate-pulse" />
    <span className="relative w-5 h-5 flex items-center justify-center">
      <span className="text-xs font-bold text-white bg-red-500 rounded-full w-full h-full flex items-center justify-center">
        {count > 9 ? "9+" : count}
      </span>
    </span>
  </div>
));

NotificationBadge.displayName = "NotificationBadge";

// Memoized Loading State
const LoadingState = memo(() => (
  <div className="px-5 py-8 text-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#274b46] mx-auto"></div>
    <p className="text-sm text-[#274b46] mt-3">Loading notifications...</p>
  </div>
));

LoadingState.displayName = "LoadingState";

export default function NotificationMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const menuRef = useRef(null);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await notificationApi.getNotifications({ limit: 20, offset: 0 });
      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unread_count || 0);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications');
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch unread count only
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await notificationApi.getUnreadCount();
      setUnreadCount(response.data.unread_count || 0);
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  }, []);

  // Initial fetch and polling
  useEffect(() => {
    fetchNotifications();
    
    // Poll for new notifications every 30 seconds
    const pollInterval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);
    
    return () => clearInterval(pollInterval);
  }, [fetchNotifications, fetchUnreadCount]);

  // Refresh when menu opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  // Memoized calculations
  const totalCount = useMemo(
    () => notifications.length,
    [notifications.length]
  );

  // Optimized callbacks
  const toggleDropdown = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const markAsRead = useCallback(async (id) => {
    try {
      await notificationApi.markAsRead(id);
      
      // Update local state
      setNotifications((prev) =>
        prev.map((n) => (n.notification_id === id ? { ...n, status: 'read' } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  }, []);

  const deleteNotification = useCallback(async (id) => {
    try {
      await notificationApi.deleteNotification(id);
      
      // Update local state
      const notification = notifications.find(n => n.notification_id === id);
      setNotifications((prev) => prev.filter((n) => n.notification_id !== id));
      
      // Update unread count if it was unread
      if (notification && notification.status === 'unread') {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  }, [notifications]);

  const viewAllNotifications = useCallback(() => {
    setIsOpen(false);
    // Navigate to notifications page
    window.location.href = '/notifications';
  }, []);

  // Optimized click outside handler
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={toggleDropdown}
        className="relative p-2 hover:bg-gray-100 rounded-full transition-all hover:scale-110"
        aria-label="Toggle notifications menu"
      >
        <Bell className="w-6 h-6 text-slate-700" />
        {unreadCount > 0 && <NotificationBadge count={unreadCount} />}
      </button>

      {isOpen && (
        <div className="fixed top-16 right-6 w-96 bg-white border border-gray-200 rounded-3xl shadow-lg z-50 overflow-hidden animate-in slide-in-from-top-2 duration-300">
          {/* Header */}
          <div className="px-6 py-4 bg-[#274b46]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg">
                <Eye className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white">Notifications</h4>
                <p className="text-xs text-gray-200">
                  {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                </p>
              </div>
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-96 overflow-y-auto space-y-3 p-4">
            {isLoading ? (
              <LoadingState />
            ) : error ? (
              <div className="px-5 py-8 text-center">
                <p className="text-sm text-red-600">{error}</p>
                <button
                  onClick={fetchNotifications}
                  className="mt-2 text-sm text-[#274b46] underline"
                >
                  Try again
                </button>
              </div>
            ) : totalCount > 0 ? (
              notifications.map((notification, index) => (
                <NotificationItem
                  key={notification.notification_id}
                  notification={notification}
                  onDelete={deleteNotification}
                  onMarkAsRead={markAsRead}
                />
              ))
            ) : (
              <EmptyState />
            )}
          </div>

          {/* Footer */}
          {totalCount > 0 && (
            <div className="px-6 py-3 border-t border-gray-200 text-center bg-gray-50 rounded-b-3xl">
              <button 
                onClick={viewAllNotifications}
                className="text-sm font-semibold text-gray-600 hover:text-black transition-colors"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}