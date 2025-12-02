/**
 * Calendar Constants
 * Shared constants for admin and employee calendars
 */

// Month names
export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Day abbreviations (Sunday first)
export const DAYS_SHORT = ['Su', 'M', 'Tu', 'W', 'Th', 'F', 'Sa'];

// Full day names
export const DAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// 12-hour format hours with AM/PM
export const HOURS_12 = Array.from({ length: 24 }, (_, i) => {
  const hour = i % 12 || 12;
  const period = i < 12 ? 'AM' : 'PM';
  return `${hour}${period}`;
});

// Event color options
export const EVENT_COLORS = [
  'bg-blue-100 border-blue-300 text-blue-800',
  'bg-green-100 border-green-300 text-green-800',
  'bg-purple-100 border-purple-300 text-purple-800',
  'bg-pink-100 border-pink-300 text-pink-800',
  'bg-yellow-100 border-yellow-300 text-yellow-800',
  'bg-red-100 border-red-300 text-red-800'
];

// Calendar cell styling states
export const CALENDAR_STYLES = {
  TODAY: 'bg-[#274b46] text-[#F8F9FA] border-gray-700',
  SELECTED: 'bg-[#274b46] text-gray-900 border-gray-400',
  TODAY_SELECTED: 'bg-[#274b46] border-gray-400',
  DEFAULT: 'border-[#274b46] text-gray-700 hover:border-gray-400 hover:bg-gray-100',
  PREVIOUS_MONTH: 'text-gray-400'
};

// Theme colors
export const THEME = {
  PRIMARY: '#274b46',
  PRIMARY_DARK: '#305d56',
  LIGHT: '#F8F9FA',
  TEXT_PRIMARY: 'text-gray-800',
  TEXT_SECONDARY: 'text-gray-600',
  BORDER: 'border-gray-300'
};
