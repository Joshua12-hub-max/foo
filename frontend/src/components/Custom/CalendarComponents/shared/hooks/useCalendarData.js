import { useMemo } from 'react';
import { formatDate } from '../utils/dateUtils';
import { combineCalendarItems, sortCalendarItemsByTime } from '../utils/calendarItemUtils'; // Updated import

/**
 * Custom hook for calendar data processing
 * @param {Object} params - Hook parameters
 * @param {Date} params.currentDate - Current date
 * @param {Array} params.events - Events array
 * @param {boolean} params.showHolidays - Whether to show holidays
 * @param {Array} params.holidays - Holidays data
 * @param {Array} params.announcements - Announcements data
 * @returns {Object} Processed calendar data
 */
export const useCalendarData = ({ currentDate, events, showHolidays, holidays, announcements }) => {
  // Format current date
  const formattedDate = useMemo(
    () => formatDate(currentDate),
    [currentDate]
  );

  // Combine events with holidays and announcements and sort
  const displayedEvents = useMemo(
    () => combineCalendarItems(events, holidays, showHolidays, announcements, currentDate),
    [events, holidays, showHolidays, announcements, currentDate]
  );

  // Sorted events (without holidays and announcements - original intent of sortedEvents, re-evaluate if needed)
  const sortedEvents = useMemo(
    () => sortCalendarItemsByTime([...events]), // Use new sort function
    [events]
  );

  return {
    month: formattedDate.month,
    day: formattedDate.day,
    year: formattedDate.year,
    dayName: formattedDate.dayName,
    displayedEvents,
    sortedEvents
  };
};
