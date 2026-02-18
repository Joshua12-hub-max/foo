import { getDaysInMonth, isSameDay } from './dateUtils'; 

/**
 * Filter events for a specific date
 * @param {Array} events - Array of events
 * @param {Date} date - Date to filter for
 * @returns {Array} - Filtered events
 */
export const filterEventsByDate = (events: any[], date: Date): any[] => {
  if (!events || !Array.isArray(events)) return [];
  
  return events.filter(item => {
    // @ts-ignore
    const itemDate = new Date(item.date);
    return isSameDay(itemDate, date);
  });
};

/**
 * Sort events by time
 * @param {Array} items - Array of calendar items (events, holidays, schedules)
 * @returns {Array} - Sorted items
 */
export const sortCalendarItemsByTime = (items: any[]): any[] => {
  if (!items || !Array.isArray(items)) return [];
  return [...items].sort((a, b) => {
    // Convert times to a comparable format (e.g., minutes from midnight)
    // @ts-ignore
    const timeA = a.time ? parseInt(a.time.toString().split(':')[0]) * 60 + parseInt(a.time.toString().split(':')[1] || 0) : 0;
    // @ts-ignore
    const timeB = b.time ? parseInt(b.time.toString().split(':')[0]) * 60 + parseInt(b.time.toString().split(':')[1] || 0) : 0;
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
export const combineCalendarItems = (events: any[], holidays: any[], showHolidays: boolean, announcements: any[], currentDate: Date, schedules: any[] = []): any[] => {
  let allItems = [...events];
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

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

  // Add announcements
  if (announcements && Array.isArray(announcements)) {
    const announcementItems = announcements.map(a => ({
      ...a,
      id: `announcement-${a.id}`,
      type: 'announcement', // Explicit type
      time: '00:00', // All day
      isAnnouncement: true,
      date: a.start_date || a.created_at, // Use start_date or created_at
    }));
    allItems = [...allItems, ...announcementItems];
  }

  // Add schedules - expand each schedule to show on relevant days
  if (schedules && Array.isArray(schedules) && schedules.length > 0) {
    const scheduleItems: any[] = [];
    console.log('📅 Processing schedules for calendar:', schedules);
    
    schedules.forEach(schedule => {
      const startDateStr = schedule.start_date || schedule.startDate;
      const endDateStr = schedule.end_date || schedule.endDate;
      const daysString = schedule.days || '';
      // @ts-ignore
      const scheduleDays = daysString ? daysString.split(',').map(d => d.trim()) : [];
      
      console.log(`📅 Duty: ${schedule.duties || schedule.scheduleName}`, { startDateStr, endDateStr, scheduleDays });
      
      // Check if we have valid date strings (not 'Recurring' or empty)
      const hasValidDates = startDateStr && endDateStr && 
                            startDateStr !== 'Recurring' && endDateStr !== 'Recurring';
      
      if (hasValidDates) {
        // Parse dates as local time to avoid timezone offset issues
        // @ts-ignore
        const parseLocalDate = (dateStr) => {
          const str = String(dateStr).split('T')[0]; // Get just the date part
          const [year, month, day] = str.split('-').map(Number);
          return new Date(year, month - 1, day); // month is 0-indexed
        };
        
        const start = parseLocalDate(startDateStr);
        const end = parseLocalDate(endDateStr);
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        
        console.log(`📅 Iterating from ${start.toDateString()} to ${end.toDateString()}`);
        
        // Iterate through each day in the schedule range for the current month view
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          // Only add if the day is in the current month being viewed
          if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
            const dayName = dayNames[d.getDay()];
            
            // Check if this day of week is in the schedule's days (or if no specific days, show all)
            if (scheduleDays.length === 0 || scheduleDays.includes(dayName)) {
              // Format date as YYYY-MM-DD in local time
              const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
              
              scheduleItems.push({
                id: `schedule-${schedule.id}-${dateStr}`,
                title: schedule.duties || schedule.scheduleName || 'Work Duties',
                type: 'schedule',
                isSchedule: true,
                time: schedule.start_time || schedule.startTime || '09:00',
                endTime: schedule.end_time || schedule.endTime || '17:00',
                date: dateStr,
                startDate: startDateStr,
                endDate: endDateStr,
                originalSchedule: schedule
              });
            }
          }
        }
      } else if (scheduleDays.length > 0) {
        // No date range, but we have specific days - show for current month on those days
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        
        for (let day = 1; day <= daysInCurrentMonth; day++) {
          const d = new Date(currentYear, currentMonth, day);
          const dayName = dayNames[d.getDay()];
          
          if (scheduleDays.includes(dayName)) {
            const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            
            scheduleItems.push({
              id: `schedule-${schedule.id}-${dateStr}`,
              title: schedule.duties || schedule.scheduleName || 'Work Duties',
              type: 'schedule',
              isSchedule: true,
              time: schedule.start_time || schedule.startTime || '09:00',
              endTime: schedule.end_time || schedule.endTime || '17:00',
              date: dateStr,
              originalSchedule: schedule
            });
          }
        }
      }
    });
    
    console.log(`📅 Generated ${scheduleItems.length} schedule items for display`);
    allItems = [...allItems, ...scheduleItems];
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
