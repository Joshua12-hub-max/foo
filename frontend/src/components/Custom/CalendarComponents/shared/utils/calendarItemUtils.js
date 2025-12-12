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
 * Combine events, holidays, announcements, and schedules into a single array for display
 * @param {Array} events - Regular events
 * @param {Array} holidays - Holiday data
 * @param {boolean} showHolidays - Whether to include holidays
 * @param {Array} announcements - Announcements data
 * @param {Date} currentDate - Current date context for year and month
 * @param {Array} schedules - Employee schedules
 * @returns {Array} - Combined and sorted calendar items
 */
export const combineCalendarItems = (events, holidays, showHolidays, announcements, currentDate, schedules = []) => {
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
    const scheduleItems = [];
    console.log('📅 Processing schedules for calendar:', schedules);
    
    schedules.forEach(schedule => {
      const startDateStr = schedule.start_date || schedule.startDate;
      const endDateStr = schedule.end_date || schedule.endDate;
      const daysString = schedule.days || '';
      const scheduleDays = daysString ? daysString.split(',').map(d => d.trim()) : [];
      
      console.log(`📅 Schedule: ${schedule.schedule_title || schedule.scheduleName}`, { startDateStr, endDateStr, scheduleDays });
      
      // Check if we have valid date strings (not 'Recurring' or empty)
      const hasValidDates = startDateStr && endDateStr && 
                            startDateStr !== 'Recurring' && endDateStr !== 'Recurring';
      
      if (hasValidDates) {
        // Parse dates as local time to avoid timezone offset issues
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
                title: schedule.schedule_title || schedule.scheduleName || 'Work Schedule',
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
              title: schedule.schedule_title || schedule.scheduleName || 'Work Schedule',
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

export const getEventStyles = (type, title, priority) => {
  // 1. Announcement priority-based colors
  if (type === "announcement") {
    const p = priority?.toLowerCase();
    switch (p) {
      case "high":
        // High priority → STATUS_RED #7A0000
        return { textColor: "text-[#7A0000]", badgeBg: "bg-[#7A0000]/10", badgeText: "text-[#7A0000]", borderColor: "border-none", bgColor: "bg-[#F2F2F2]" };
      case "urgent":
        // Urgent → DARK_NAVY #1B1A55
        return { textColor: "text-[#1B1A55]", badgeBg: "bg-[#1B1A55]/10", badgeText: "text-[#1B1A55]", borderColor: "border-none", bgColor: "bg-[#F2F2F2]" };
      default:
        // Normal/Low → STATUS_GREEN #79B791 with stronger visibility
        return { textColor: "text-[#2E7D4A]", badgeBg: "bg-[#79B791]/20", badgeText: "text-[#2E7D4A]", borderColor: "border-none", bgColor: "bg-[#F2F2F2]" };
    }
  }

  // 2. Holiday type-based colors (Different colors for each type)
  const holidayType = type?.toLowerCase();

  // Regular Holiday → Rose Pink #AE445A
  if (holidayType === "regular holiday" || holidayType === "holiday") {
    return { textColor: "text-[#AE445A]", badgeBg: "bg-[#AE445A]/10", badgeText: "text-[#AE445A]", borderColor: "border-none", bgColor: "bg-[#F2F2F2]" };
  }

  // Special Non-Working Holiday → Deep Purple #2E294E
  if (holidayType === "special non-working" || holidayType === "non-working holiday") {
    return { textColor: "text-[#2E294E]", badgeBg: "bg-[#2E294E]/10", badgeText: "text-[#2E294E]", borderColor: "border-none", bgColor: "bg-[#F2F2F2]" };
  }

  // Special Holiday / Working Holiday → Warm Brown #A27B5C
  if (holidayType === "special holiday" || holidayType === "working holiday") {
    return { textColor: "text-[#A27B5C]", badgeBg: "bg-[#A27B5C]/10", badgeText: "text-[#A27B5C]", borderColor: "border-none", bgColor: "bg-[#F2F2F2]" };
  }

  // 3. Schedule Type → Slate Blue #535C91
  if (type === "schedule") {
    return { textColor: "text-[#535C91]", badgeBg: "bg-[#535C91]/10", badgeText: "text-[#535C91]", borderColor: "border-none", bgColor: "bg-[#F2F2F2]" };
  }

  // 4. Default / Event → STATUS_AMBER #CF9033
  return { textColor: "text-[#CF9033]", badgeBg: "bg-[#CF9033]/10", badgeText: "text-[#CF9033]", borderColor: "border-none", bgColor: "bg-[#F2F2F2]" };
};

