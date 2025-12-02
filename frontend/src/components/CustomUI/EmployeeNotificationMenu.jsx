import { useState, useRef, useEffect, useCallback, useMemo, memo } from "react";
import { Bell, X, Eye, FileEdit, CheckCircle, XCircle, UserPlus, AlertCircle } from "lucide-react";
import { notificationApi } from "../../api/notificationApi";

// Notification type configurations for employees
const employeeNotificationTypeConfig = {
  dtr_correction_approved: {
    icon: CheckCircle,
    color: 'text-[#79B791]',
    bgColor: 'bg-[#79B791]/10',
    title: 'DTR Approved',
  },
  dtr_correction_rejected: {
    icon: XCircle,
    color: 'text-[#7A0000]',
    bgColor: 'bg-[#7A0000]/10',
    title: 'DTR Rejected',
  },
  admin_dtr_correction: {
    icon: UserPlus,
    color: 'text-[#535C91]',
    bgColor: 'bg-[#535C91]/10',
    title: 'DTR Corrected',
  },
  leave_approved: {
    icon: CheckCircle,
    color: 'text-[#79B791]',
    bgColor: 'bg-[#79B791]/10',
    title: 'Leave Approved',
  },
  leave_rejected: {
    icon: XCircle,
    color: 'text-[#7A0000]',
    bgColor: 'bg-[#7A0000]/10',
    title: 'Leave Rejected',
  },
  announcement: {
    icon: AlertCircle,
    color: 'text-[#9290C3]',
    bgColor: 'bg-[#9290C3]/10',
    title: 'Announcement',
  },
};

// Memoized Notification Item Component
const EmployeeNotificationItem = memo(({ notification, onDelete, onMarkAsRead }) => {
  const { 
    notification_id, 
    request_name, 
    notification_title, 
    notification_duration, 
    status, 
    notification_type 
  } = notification;

  const typeConfig = employeeNotificationTypeConfig[notification_type] || {
    icon: Bell,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    title: 'Notification',
  };

  const Icon = typeConfig.icon;
  const isUnread = status === 'unread';

  const handleClick = useCallback(() => {
    if (isUnread) {
      onMarkAsRead(notification_id);
    }
    
    // Navigate based on notification type
    if (notification_type.includes('dtr')) {
      window.location.href = '/employee/dtr-corrections';
    } else if (notification_type.includes('leave')) {
      window.location.href = '/employee/leave-requests';
    }
  }, [notification_id, isUnread, onMarkAsRead, notification_type]);

  const handleDelete = useCallback((e) => {
    e.stopPropagation();
    onDelete(notification_id);
  }, [notification_id, onDelete]);

  return (
    <div 
      onClick={handleClick}
      className={`group flex items-center gap-3 p-4 border rounded-2xl hover:shadow-md transition-all cursor-pointer ${
        isUnread 
          ? 'bg-white border-gray-300 shadow-sm' 
          : 'bg-gray-50 border-gray-200'
      }`}
    >
      {/* Type Icon */}
      <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${typeConfig.bgColor}`}>
        <Icon className={`w-6 h-6 ${typeConfig.color}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {typeConfig.title}
          </p>
          {isUnread && (
            <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 animate-pulse"></span>
          )}
        </div>
        <p className="text-sm font-medium text-black mb-1">
          {notification_title}
        </p>
        <p className="text-xs text-slate-500">
          From: {request_name}
        </p>
      </div>

      {/* Time & Actions */}
      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        <span className="text-xs text-slate-400 font-medium">{notification_duration}</span>
        <button
          onClick={handleDelete}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-red-50 rounded-full"
          aria-label="Delete notification"
        >
          <X className="w-4 h-4 text-red-400 hover:text-red-600" />
        </button>
      </div>
    </div>
  );
});

EmployeeNotificationItem.displayName = "EmployeeNotificationItem";

// Memoized Empty State
const EmptyState = memo(() => (
  <div className="px-5 py-12 text-center">
    <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
      <Bell className="w-8 h-8 text-[#274b46]" />
    </div>
    <p className="text-sm text-[#274b46] font-semibold mb-1">All caught up!</p>
    <p className="text-xs text-slate-500 mt-2">You have no new notifications</p>
  </div>
));

EmptyState.displayName = "EmptyState";

// Memoized Badge Component
const NotificationBadge = memo(({ count }) => (
  <div className="absolute -top-1 -right-1 flex items-center justify-center">
    <span className="absolute w-5 h-5 bg-red-500 rounded-full animate-ping opacity-75" />
    <span className="relative min-w-[20px] h-5 px-1.5 flex items-center justify-center">
      <span className="text-xs font-bold text-white bg-red-500 rounded-full px-1.5 py-0.5">
        {count > 99 ? "99+" : count}
      </span>
    </span>
  </div>
));

NotificationBadge.displayName = "NotificationBadge";

// Memoized Loading State
const LoadingState = memo(() => (
  <div className="px-5 py-12 text-center">
    <div className="animate-spin rounded-full h-10 w-10 border-3 border-[#274b46] border-t-transparent mx-auto mb-4"></div>
    <p className="text-sm text-[#274b46] font-medium">Loading notifications...</p>
  </div>
));

LoadingState.displayName = "LoadingState";

// Memoized Error State
const ErrorState = memo(({ onRetry }) => (
  <div className="px-5 py-12 text-center">
    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
      <XCircle className="w-8 h-8 text-red-500" />
    </div>
    <p className="text-sm text-red-600 font-medium mb-3">Failed to load notifications</p>
    <button
      onClick={onRetry}
      className="text-sm text-[#274b46] font-semibold hover:underline"
    >
      Try again
    </button>
  </div>
));

ErrorState.displayName = "ErrorState";

export default function EmployeeNotificationMenu() {
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

  // Fetch unread count only (for polling)
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await notificationApi.getUnreadCount();
      const newCount = response.data.unread_count || 0;
      
      // Only update if count changed
      if (newCount !== unreadCount) {
        setUnreadCount(newCount);
        
        // If new notifications arrived, refresh the list if menu is open
        if (newCount > unreadCount && isOpen) {
          fetchNotifications();
        }
      }
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  }, [unreadCount, isOpen, fetchNotifications]);

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
      
      // Find the notification to check if it was unread
      const notification = notifications.find(n => n.notification_id === id);
      
      // Update local state
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
    window.location.href = '/employee/notifications';
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      // Mark all unread notifications as read
      const unreadNotifications = notifications.filter(n => n.status === 'unread');
      
      await Promise.all(
        unreadNotifications.map(n => notificationApi.markAsRead(n.notification_id))
      );
      
      // Update local state
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, status: 'read' }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  }, [notifications]);

  // Click outside handler
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
        className="relative p-2.5 hover:bg-green-50 rounded-full transition-all hover:scale-110 group"
        aria-label="Toggle notifications menu"
      >
        <Bell className="w-6 h-6 text-slate-700 group-hover:text-[#274b46] transition-colors" />
        {unreadCount > 0 && <NotificationBadge count={unreadCount} />}
      </button>

      {isOpen && (
        <div className="fixed top-16 right-6 w-[420px] bg-white border border-gray-200 rounded-3xl shadow-2xl z-50 overflow-hidden animate-in slide-in-from-top-2 duration-300">
          {/* Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-[#274b46] to-[#3a6b63]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-lg backdrop-blur">
                  <Bell className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white">Notifications</h4>
                  <p className="text-xs text-green-100">
                    {unreadCount > 0 ? `${unreadCount} unread message${unreadCount > 1 ? 's' : ''}` : 'All caught up'}
                  </p>
                </div>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-white hover:text-green-100 font-medium underline"
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-[480px] overflow-y-auto space-y-2 p-4 bg-gray-50">
            {isLoading ? (
              <LoadingState />
            ) : error ? (
              <ErrorState onRetry={fetchNotifications} />
            ) : totalCount > 0 ? (
              notifications.map((notification) => (
                <EmployeeNotificationItem
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
            <div className="px-6 py-3 border-t border-gray-200 text-center bg-white">
              <button 
                onClick={viewAllNotifications}
                className="text-sm font-semibold text-[#274b46] hover:text-[#1f3d39] transition-colors"
              >
                View all notifications →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
