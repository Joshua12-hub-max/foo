import { getDaysInMonth, isSameDay } from './dateUtils'; 

/**
 * Filter events for a specific date
 * @param {Array} events - Array of events
 * @param {Date} date - Date to filter for
 * @returns {Array} - Filtered events
 */
export const filterEventsByDate = (events, date) => {
  if (!events || !Array.isArray(events)) return [];
  
  return events.filter(item => {
    const itemDate = new Date(item.date);
    return isSameDay(itemDate, date);
  });
};

/**
 * Sort events by time
 * @param {Array} items - Array of calendar items (events, holidays, schedules)
 * @returns {Array} - Sorted items
 */
export const sortCalendarItemsByTime = (items) => {
  if (!items || !Array.isArray(items)) return [];
  return [...items].sort((a, b) => {
    // Convert times to a comparable format (e.g., minutes from midnight)
    const timeA = a.time ? parseInt(a.time.toString().split(':')[0]) * 60 + parseInt(a.time.toString().split(':')[1] || 0) : 0;
    const timeB = b.time ? parseInt(b.time.toString().split(':')[0]) * 60 + parseInt(b.time.toString().split(':')[1] || 0) : 0;
    return timeA - timeB;
  });
};

/**
 * Combine events, holidays, and schedules into a single array for display
 * @param {Array} events - Regular events
 * @param {Array} holidays - Holiday data
 * @param {boolean} showHolidays - Whether to include holidays
 * @param {Array} schedules - Employee schedules
 * @param {Date} currentDate - Current date context for year and month
 * @returns {Array} - Combined and sorted calendar items
 */
export const combineCalendarItems = (events, holidays, showHolidays, schedules, currentDate) => {
  let allItems = [...events];
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const { daysInMonth } = getDaysInMonth(currentDate);

  // Add holidays
  if (showHolidays && holidays && Array.isArray(holidays)) {
    const holidayItems = holidays.map(h => ({
      ...h,
      id: `holiday-${h.id}-${currentYear}`,
      type: 'holiday', // Explicit type
      time: '00:00', // All day
      isHoliday: true,
      date: new Date(currentYear, h.month, h.day).toISOString().split('T')[0], // Assign a specific date for sorting
    }));
    allItems = [...allItems, ...holidayItems];
  }

  // Add schedules (generate for the current month)
  if (schedules && Array.isArray(schedules)) {
    const scheduleItems = [];
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    schedules.forEach(s => {
      const dayOfWeekNum = dayNames.indexOf(s.day_of_week);
      if (dayOfWeekNum !== -1) {
        for (let day = 1; day <= daysInMonth; day++) {
          const date = new Date(currentYear, currentMonth, day);
          if (date.getDay() === dayOfWeekNum) {
            scheduleItems.push({
              ...s,
              id: `schedule-${s.id}-${currentYear}-${currentMonth}-${day}`,
              title: `Schedule: ${s.start_time} - ${s.end_time} (${s.is_rest_day ? 'Rest Day' : 'Work'})`,
              type: 'schedule', // Explicit type
              date: date.toISOString().split('T')[0],
              time: s.start_time,
              endTime: s.end_time,
              isSchedule: true,
              day_of_week_num: dayOfWeekNum, // Store numerical day of week for filtering
            });
          }
        }
      }
    });
    allItems = [...allItems, ...scheduleItems];
  }
  
  return sortCalendarItemsByTime(allItems);
};

/**
 * Get holidays for a specific day
 * @param {Array} holidays - Holiday data
 * @param {number} month - Month number (0-11)
 * @param {number} day - Day number
 * @returns {Array} - Holidays for that day
 */
export const getHolidaysForDay = (holidays, month, day) => {
  if (!holidays || !Array.isArray(holidays)) return [];
  return holidays.filter(h => h.month === month && h.day === day);
};

/**
 * Generate a random event color from available colors
 * @param {Array} colors - Array of color classes
 * @returns {string} - Random color class
 */
export const getRandomEventColor = (colors) => {
  return colors[Math.floor(Math.random() * colors.length)];
};


