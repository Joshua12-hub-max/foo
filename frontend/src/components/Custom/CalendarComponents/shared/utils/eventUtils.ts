/**
 * Convert AM/PM time string to 24-hour integer
 * @param {string|number} timeStr - Time string like "9AM" or "1PM"
 * @returns {number} - 24-hour integer (0-23)
 */
export const convertTo24Hour = (timeStr: string | number | undefined): number => {
  if (!timeStr) return 9;
  if (typeof timeStr === 'number') return timeStr;
  if (typeof timeStr !== 'string' || timeStr.length < 3) return 9;
  
  const period = timeStr.slice(-2).toUpperCase();
  let hour = parseInt(timeStr.slice(0, -2));
  
  if (isNaN(hour)) return 9;
  if (period === 'PM' && hour !== 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;
  return hour;
};

/**
 * Convert 24-hour integer to AM/PM string
 * @param {number} hour24 - 24-hour integer (0-23)
 * @returns {string} - AM/PM string like "9AM"
 */
export const formatHour12 = (hour24: number | undefined | null): string => {
  if (hour24 === undefined || hour24 === null) return '9AM';
  const hour = hour24 % 12 || 12;
  const period = hour24 < 12 ? 'AM' : 'PM';
  return `${hour}${period}`;
};

/**
 * Get holidays for a specific day
 * @param holidays - Array of holiday objects
 * @param month - Month index (0-11)
 * @param day - Day of month (1-31)
 * @returns Array of holidays matching the specified month and day
 */
export const getHolidaysForDay = (
  holidays: Array<{ date?: string; month?: number; day?: number; [key: string]: unknown }>,
  month: number,
  day: number
): Array<{ date?: string; month?: number; day?: number; [key: string]: unknown }> => {
  if (!holidays || !Array.isArray(holidays)) return [];
  
  return holidays.filter((holiday) => {
    // Handle holiday objects with a date string (e.g., "2026-01-08")
    if (holiday.date) {
      const holidayDate = new Date(holiday.date);
      return holidayDate.getMonth() === month && holidayDate.getDate() === day;
    }
    // Handle holiday objects with month and day properties
    if (holiday.month !== undefined && holiday.day !== undefined) {
      return holiday.month === month && holiday.day === day;
    }
    return false;
  });
};
