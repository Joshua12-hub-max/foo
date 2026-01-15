import { useCallback } from 'react';

/**
 * Custom hook for calendar navigation
 * @param {Object} calendarState - State from useCalendarState
 * @returns {Object} Navigation handlers
 */
export const useCalendarNav = ({ setCurrentDate }: { setCurrentDate: (date: Date | ((prev: Date) => Date)) => void }) => {
  const handlePrevMonth = useCallback(() => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, prev.getDate()));
  }, [setCurrentDate]);

  const handleNextMonth = useCallback(() => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, prev.getDate()));
  }, [setCurrentDate]);

  const handleToday = useCallback(() => {
    setCurrentDate(new Date());
  }, [setCurrentDate]);

  const handleDateClick = useCallback((date: Date) => {
    setCurrentDate(date);
  }, [setCurrentDate]);

  return {
    handlePrevMonth,
    handleNextMonth,
    handleToday,
    handleDateClick
  };
};
