import { getDaysInMonth, isSameDay } from './dateUtils'; 
import type { CalendarDisplayItem, Holiday, Announcement, ScheduleEntry } from '@/types/calendar';

/**
 * Filter events for a specific date
 * @param {Array} events - Array of events
 * @param {Date} date - Date to filter for
 * @returns {Array} - Filtered events
 */
export const filterEventsByDate = (events: CalendarDisplayItem[], date: Date): CalendarDisplayItem[] => {
  if (!events || !Array.isArray(events)) return [];
  
  // Helper to parse "YYYY-MM-DD" safely into local date context
  const parseLocalDate = (dateStr: string) => {
    // Split by T or Space to handle both ISO and MySQL timestamp formats
    const str = String(dateStr).split(/[T ]/)[0];
    const [year, month, day] = str.split('-').map(Number);
    if (!year || !month || !day) return new Date(NaN);
    return new Date(year, month - 1, day);
  };

  return events.filter(item => {
    if (!item.date) return false;
    const itemDate = parseLocalDate(item.date);
    return isSameDay(itemDate, date);
  });
};

/**
 * Sort events by time
 * @param {Array} items - Array of calendar items (events, holidays, schedules)
 * @returns {Array} - Sorted items
 */
export const sortCalendarItemsByTime = (items: CalendarDisplayItem[]): CalendarDisplayItem[] => {
  if (!items || !Array.isArray(items)) return [];
  return [...items].sort((a, b) => {
    // Convert times to a comparable format (e.g., minutes from midnight)
    const timeA = a.time ? parseInt(String(a.time).split(':')[0]) * 60 + parseInt(String(a.time).split(':')[1] || '0') : 0;
    const timeB = b.time ? parseInt(String(b.time).split(':')[0]) * 60 + parseInt(String(b.time).split(':')[1] || '0') : 0;
    return timeA - timeB;
  });
};

/**
 * Combine events, holidays, announcements, and schedules into a single array for display
 * @param {Array} events - Regular events
 * @param {Array} holidays - Holiday data
 * @param {boolean} showHolidays - Whether to include holidays
 * @param {Array} announcements - Announcements data
 * @param {Date} currentDate - Current date context for year and month
 * @param {Array} schedules - Employee schedules
 * @returns {Array} - Combined and sorted calendar items
 */
export const combineCalendarItems = (events: CalendarDisplayItem[], holidays: Holiday[], showHolidays: boolean, announcements: Announcement[], currentDate: Date, schedules: ScheduleEntry[] = []): CalendarDisplayItem[] => {
  let allItems: CalendarDisplayItem[] = [];
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Helper to parse "YYYY-MM-DD" safely into local date
  const parseLocalDate = (dateStr: string | Date) => {
    // Split by T or Space to handle both ISO and MySQL timestamp formats
    const str = String(dateStr).split(/[T ]/)[0];
    const [year, month, day] = str.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  // 1. Expand Recurring Events
  if (events && Array.isArray(events)) {
    events.forEach(event => {
      const pattern = (event.recurringPattern || 'none').toLowerCase();
      const baseDate = parseLocalDate(event.date || event.startDate || '');
      const endDateLimit = event.recurringEndDate ? parseLocalDate(event.recurringEndDate) : new Date(currentYear, currentMonth + 1, 0);

      if (pattern === 'none') {
        allItems.push(event);
      } else {
        // Expand based on pattern
        const iter = new Date(baseDate);
        while (iter <= endDateLimit) {
          // Only add if it falls in the current month view
          if (iter.getMonth() === currentMonth && iter.getFullYear() === currentYear) {
            const dateStr = `${iter.getFullYear()}-${String(iter.getMonth() + 1).padStart(2, '0')}-${String(iter.getDate()).padStart(2, '0')}`;
            allItems.push({
              ...event,
              id: `${event.id}-${dateStr}`,
              date: dateStr
            });
          }

          if (pattern === 'daily') iter.setDate(iter.getDate() + 1);
          else if (pattern === 'weekly') iter.setDate(iter.getDate() + 7);
          else if (pattern === 'monthly') iter.setMonth(iter.getMonth() + 1);
          else break;

          // Safety break
          if (iter.getFullYear() > currentYear + 1) break;
        }
      }
    });
  }

  // 2. Add holidays (Fixed to handle date string correctly)
  if (showHolidays && holidays && Array.isArray(holidays)) {
    holidays.forEach(h => {
      const holidayDate = h.date ? parseLocalDate(h.date) : (h.month !== undefined ? new Date(currentYear, h.month, h.day) : null);
      
      if (holidayDate && holidayDate.getMonth() === currentMonth && holidayDate.getFullYear() === currentYear) {
        const dateStr = `${holidayDate.getFullYear()}-${String(holidayDate.getMonth() + 1).padStart(2, '0')}-${String(holidayDate.getDate()).padStart(2, '0')}`;
        
        allItems.push({
          ...h,
          id: `holiday-${h.id}-${dateStr}`,
          title: h.title || h.name || 'Holiday',
          type: 'holiday',
          time: '00:00',
          isHoliday: true,
          date: dateStr
        });
      }
    });
  }

  // 3. Add announcements
  if (announcements && Array.isArray(announcements)) {
    announcements.forEach(a => {
      const aDate = parseLocalDate(a.startDate || a.createdAt);
      if (aDate.getMonth() === currentMonth && aDate.getFullYear() === currentYear) {
        allItems.push({
          ...a,
          id: `announcement-${a.id}`,
          type: 'announcement',
          time: '00:00',
          isAnnouncement: true,
          date: a.startDate || a.createdAt,
        });
      }
    });
  }

  // 4. Add schedules - expand each schedule to show on relevant days
  if (schedules && Array.isArray(schedules) && schedules.length > 0) {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    schedules.forEach(schedule => {
      const startDateStr = schedule.startDate;
      const endDateStr = schedule.endDate;
      const daysString = schedule.days || schedule.dayOfWeek || '';
      // @ts-ignore
      const scheduleDays = daysString ? daysString.split(',').map(d => d.trim()) : [];
      
      const hasValidDates = startDateStr && endDateStr && 
                            startDateStr !== 'Recurring' && endDateStr !== 'Recurring';
      
      if (hasValidDates) {
        const start = parseLocalDate(startDateStr!);
        const end = parseLocalDate(endDateStr!);
        
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
            const dayName = dayNames[d.getDay()];
            if (scheduleDays.length === 0 || scheduleDays.includes(dayName)) {
              const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
              
              allItems.push({
                id: `schedule-${schedule.id}-${dateStr}`,
                title: schedule.duties || schedule.scheduleName || 'Work Duties',
                type: 'schedule',
                isSchedule: true,
                time: schedule.startTime || '09:00',
                endTime: schedule.endTime || '17:00',
                date: dateStr,
                startDate: startDateStr,
                endDate: endDateStr,
                originalSchedule: schedule
              });
            }
          }
        }
      } else if (scheduleDays.length > 0) {
        const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        for (let day = 1; day <= daysInCurrentMonth; day++) {
          const d = new Date(currentYear, currentMonth, day);
          const dayName = dayNames[d.getDay()];
          
          if (scheduleDays.includes(dayName)) {
            const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            
            allItems.push({
              id: `schedule-${schedule.id}-${dateStr}`,
              title: schedule.duties || schedule.scheduleName || 'Work Duties',
              type: 'schedule',
              isSchedule: true,
              time: schedule.startTime || '09:00',
              endTime: schedule.endTime || '17:00',
              date: dateStr,
              originalSchedule: schedule
            });
          }
        }
      }
    });
  }
  
  // Deduplicate items by ID to prevent React key errors
  const uniqueItems = Array.from(new Map(allItems.map(item => [item.id, item])).values());
  
  return sortCalendarItemsByTime(uniqueItems);
};

/**
 * Generate a random event color from available colors
 * @param {Array} colors - Array of color classes
 * @returns {string} - Random color class
 */
export const getRandomEventColor = (colors: string[]): string => {
  return colors[Math.floor(Math.random() * colors.length)];
};

export const getEventStyles = (type: string, title?: string, priority?: string) => {
  // 1. Announcement priority-based colors
  if (type === "announcement") {
    const p = priority?.toLowerCase();
    switch (p) {
      case "high":
        // High priority → Deep Red
        return { textColor: "text-red-950", badgeBg: "bg-red-950/10", badgeText: "text-red-950", borderColor: "border-red-950/20", bgColor: "bg-white" };
      case "urgent":
        // Urgent → Deep Navy
        return { textColor: "text-blue-950", badgeBg: "bg-blue-950/10", badgeText: "text-blue-950", borderColor: "border-blue-950/20", bgColor: "bg-white" };
      default:
        // Normal/Low → Deep Emerald
        return { textColor: "text-gray-900", badgeBg: "bg-gray-100", badgeText: "text-gray-900", borderColor: "border-gray-200", bgColor: "bg-white" };
    }
  }

  // 2. Holiday type-based colors
  const holidayType = type?.toLowerCase();

  // Regular Holiday → Deep Burgundy
  if (holidayType === "regular holiday" || holidayType === "holiday") {
    return { textColor: "text-red-950", badgeBg: "bg-red-950/10", badgeText: "text-red-950", borderColor: "border-red-950/20", bgColor: "bg-white" };
  }

  // Special Non-Working Holiday → Deep Indigo
  if (holidayType === "special non-working" || holidayType === "non-working holiday") {
    return { textColor: "text-indigo-950", badgeBg: "bg-indigo-950/10", badgeText: "text-indigo-950", borderColor: "border-indigo-950/20", bgColor: "bg-white" };
  }

  // Special Holiday / Working Holiday → Deep Amber
  if (holidayType === "special holiday" || holidayType === "working holiday") {
    return { textColor: "text-amber-900", badgeBg: "bg-amber-900/10", badgeText: "text-amber-900", borderColor: "border-amber-900/20", bgColor: "bg-white" };
  }

  // 3. Schedule Type → Deep Slate
  if (type === "schedule") {
    return { textColor: "text-slate-900", badgeBg: "bg-slate-900/10", badgeText: "text-slate-900", borderColor: "border-slate-900/20", bgColor: "bg-white" };
  }

  // 4. Default / Event → Deep Gray
  return { textColor: "text-gray-900", badgeBg: "bg-gray-900/10", badgeText: "text-gray-900", borderColor: "border-gray-900/20", bgColor: "bg-white" };
};
