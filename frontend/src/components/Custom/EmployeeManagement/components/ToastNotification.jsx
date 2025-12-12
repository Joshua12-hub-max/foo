import { motion, AnimatePresence } from 'framer-motion';

/**
 * Toast Notification Component
 * Animated notification display for success/error messages
 */
const ToastNotification = ({
  notification
}) => {
  if (!notification.show) return null;

  return (
    <AnimatePresence>
      {notification.show && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${
            notification.type === 'error' 
              ? 'bg-red-100 text-red-800 border border-red-200' 
              : 'bg-green-100 text-green-800 border border-green-200'
          }`}
        >
          {notification.message}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ToastNotification;
