import { useState, useCallback } from 'react';
import { NOTIFICATION_TYPES, NOTIFICATION_DURATION } from '../constants/employeeConstants';

/**
 * Custom hook for managing notification state and display
 * @returns {Object} Notification state and control functions
 */
export const useNotification = () => {
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: ''
  });

  /**
   * Show a notification message
   * @param {string} message - The message to display
   * @param {string} type - The type of notification (success/error)
   */
  const showNotification = useCallback((message, type = NOTIFICATION_TYPES.SUCCESS) => {
    setNotification({ show: true, message, type });
    
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, NOTIFICATION_DURATION);
  }, []);

  /**
   * Hide the current notification
   */
  const hideNotification = useCallback(() => {
    setNotification({ show: false, message: '', type: '' });
  }, []);

  return {
    notification,
    showNotification,
    hideNotification
  };
};

export default useNotification;
