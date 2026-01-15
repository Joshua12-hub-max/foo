import { useMemo } from 'react';
import { formatDate } from '../utils/dateUtils';
import { combineCalendarItems, sortCalendarItemsByTime } from '../utils/calendarItemUtils'; 

interface UseCalendarDataParams {
  currentDate: Date;
  events: any[];
  showHolidays: boolean;
  holidays: any[];
  announcements?: any[];
  schedules?: any[];
}

/**
 * Custom hook for calendar data processing
 * @param {Object} params - Hook parameters
 * @param {Date} params.currentDate - Current date
 * @param {Array} params.events - Events array
 * @param {boolean} params.showHolidays - Whether to show holidays
 * @param {Array} params.holidays - Holidays data
 * @param {Array} params.announcements - Announcements data
 * @param {Array} params.schedules - Schedules data
 * @returns {Object} Processed calendar data
 */
export const useCalendarData = ({ currentDate, events, showHolidays, holidays, announcements = [], schedules = [] }: UseCalendarDataParams) => {
  // Format current date
  const formattedDate = useMemo(
    () => formatDate(currentDate),
    [currentDate]
  );

  // Log schedules being processed
  console.log('📅 [useCalendarData] Schedules received:', schedules?.length || 0, schedules);

  // Combine events with holidays, announcements, and schedules then sort
  const displayedEvents = useMemo(
    () => {
      const result = combineCalendarItems(events, holidays, showHolidays, announcements, currentDate, schedules);
      console.log('📅 [useCalendarData] displayedEvents generated:', result.length, result.filter(e => e.isSchedule));
      return result;
    },
    [events, holidays, showHolidays, announcements, currentDate, schedules]
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
