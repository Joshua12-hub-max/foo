import { MONTHS, DAYS_SHORT } from '../constants/calendarConstants';

/**
 * Get the number of days in a month and the starting day of the week
 * @param {Date} date - Date object for the month
 * @returns {Object} - { daysInMonth, startingDayOfWeek }
 */
export const getDaysInMonth = (date: Date): { daysInMonth: number; startingDayOfWeek: number } => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();
  
  return { daysInMonth, startingDayOfWeek };
};

/**
 * Format a date object into readable components
 * @param {Date} date - Date to format
 * @returns {Object} - { month, day, year, dayName }
 */
export const formatDate = (date: Date): { month: string; day: number; year: number; dayName: string } => {
  return {
    month: MONTHS[date.getMonth()],
    day: date.getDate(),
    year: date.getFullYear(),
    dayName: DAYS_SHORT[date.getDay()]
  };
};

/**
 * Check if a specific day is today
 * @param {Date} date - Current date context
 * @param {number} day - Day number
 * @param {Date} today - Today's date
 * @returns {boolean}
 */
export const isToday = (date: Date, day: number, today: Date): boolean => {
  return (
    today.getDate() === day &&
    today.getMonth() === date.getMonth() &&
    today.getFullYear() === date.getFullYear()
  );
};

/**
 * Check if two dates are the same day
 * @param {Date} date1 
 * @param {Date} date2 
 * @returns {boolean}
 */
export const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  );
};

/**
 * Get the previous month's date
 * @param {Date} date 
 * @returns {Date}
 */
export const getPreviousMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth() - 1, 1);
};

/**
 * Get the next month's date
 * @param {Date} date 
 * @returns {Date}
 */
export const getNextMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1);
};

/**
 * Create a new date for a specific day in the current month
 * @param {Date} currentDate - Current date context
 * @param {number} day - Day number
 * @returns {Date}
 */
export const createDateForDay = (currentDate: Date, day: number): Date => {
  return new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
};
