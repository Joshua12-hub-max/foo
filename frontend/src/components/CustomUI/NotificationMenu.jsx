import { useState, useRef, useEffect, useCallback, useMemo, memo } from "react";
import { Bell, X, Eye } from "lucide-react";

// Avatar colors
const avatarColors = [
  'bg-green-700 text-white',
  'bg-slate-700 text-white',
  'bg-yellow-600 text-white',
  'bg-red-700 text-white',
  'bg-blue-700 text-white',
];

// Memoized Notification Item Component
const NotificationItem = memo(({ notification, onDelete, colorIndex }) => {
  const { id, name, message, time } = notification;

  const handleDelete = useCallback((e) => {
    e.stopPropagation();
    onDelete(id);
  }, [id, onDelete]);

  return (
    <div className="group flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-2xl hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer">
      {/* Avatar */}
      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold ${avatarColors[colorIndex % avatarColors.length]}`}>
        {name.split(' ').map(n => n[0]).join('').toUpperCase()}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-black truncate">
          {name}
        </p>
        <p className="text-sm text-slate-500 truncate">
          {message}
        </p>
      </div>

      {/* Time & Close */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-xs text-slate-400">{time}</span>
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

export default function NotificationMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      name: 'Sarah Chen',
      message: 'Commented on your post',
      time: '2m'
    },
    {
      id: 2,
      name: 'Alex Rivera',
      message: 'Started following you',
      time: '15m'
    },
    {
      id: 3,
      name: 'Jordan Kim',
      message: 'Liked your design',
      time: '1h'
    },
    {
      id: 4,
      name: 'Morgan Lee',
      message: 'Shared your project',
      time: '3h'
    },
  ]);

  const menuRef = useRef(null);

  // Memoized calculations
  const totalCount = useMemo(
    () => notifications.length,
    [notifications.length]
  );

  // Optimized callbacks
  const toggleDropdown = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const deleteNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const viewAllNotifications = useCallback(() => {
    // Close the dropdown first
    setIsOpen(false);
    
    // Navigation - choose one based on your routing setup:
    
    // Option 1: For React Router
    // window.location.href = '/notifications';
    
    // Option 2: For Next.js with next/router
    // router.push('/notifications');
    
    // Option 3: For Next.js with next/navigation
    // router.push('/notifications');
    
    // Option 4: Direct navigation (works everywhere)
    window.location.href = '/notifications';
    
    // Option 5: If you need to pass state or open in modal
    // You can trigger a parent component callback here
    // onViewAll?.();
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
        {totalCount > 0 && <NotificationBadge count={totalCount} />}
      </button>

      {isOpen && (
        <div className="fixed top-16 right-6 w-96 bg-white border border-gray-200 rounded-3xl shadow-lg z-50 overflow-hidden animate-in slide-in-from-top-2 duration-300">
          {/* Header - Gradient like the image */}
          <div className="px-6 py-4 bg-[#274b46]">
            <div className="flex items-center gap-3">
              <div className="p-2  rounded-lg">
                <Eye className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white">Notifications</h4>
                <p className="text-xs text-gray-200">Record Information</p>
              </div>
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-96 overflow-y-auto space-y-3 p-4">
            {totalCount > 0 ? (
              notifications.map((notification, index) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onDelete={deleteNotification}
                  colorIndex={index}
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