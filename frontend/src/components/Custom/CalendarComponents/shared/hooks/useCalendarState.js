import { useState, useMemo } from 'react';

/**
 * Custom hook for managing calendar state
 * @returns {Object} Calendar state and setters
 */
export const useCalendarState = () => {
  const today = useMemo(() => new Date(), []);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showHolidays, setShowHolidays] = useState(false);
  const [showEventDetails, setShowEventDetails] = useState(null);

  return {
    today,
    currentDate,
    setCurrentDate,
    isDrawerOpen,
    setIsDrawerOpen,
    showHolidays,
    setShowHolidays,
    showEventDetails,
    setShowEventDetails
  };
};
