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
 * Combine events, holidays, and announcements into a single array for display
 * @param {Array} events - Regular events
 * @param {Array} holidays - Holiday data
 * @param {boolean} showHolidays - Whether to include holidays
 * @param {Array} announcements - Announcements data
 * @param {Date} currentDate - Current date context for year and month
 * @returns {Array} - Combined and sorted calendar items
 */
export const combineCalendarItems = (events, holidays, showHolidays, announcements, currentDate) => {
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
  // 1. Priority-based colors take precedence
  if (priority) {
    switch (priority.toLowerCase()) {
      case "high":
        return { textColor: "text-[#7A0000]", badgeBg: "bg-[#7A0000]/10", badgeText: "text-[#7A0000]", borderColor: "border-none", bgColor: "bg-[#F2F2F2]" };
      case "medium":
        return { textColor: "text-[#CF9033]", badgeBg: "bg-[#CF9033]/10", badgeText: "text-[#CF9033]", borderColor: "border-none", bgColor: "bg-[#F2F2F2]" };
      case "low":
        return { textColor: "text-[#79B791]", badgeBg: "bg-[#79B791]/10", badgeText: "text-[#79B791]", borderColor: "border-none", bgColor: "bg-[#F2F2F2]" };
    }
  }

  // 2. Holiday type-based colors
  const holidayType = type?.toLowerCase();

  // Regular Holiday → Rose Pink #AE445A
  if (holidayType === "regular holiday") {
    return { textColor: "text-[#AE445A]", badgeBg: "bg-[#AE445A]/10", badgeText: "text-[#AE445A]", borderColor: "border-none", bgColor: "bg-[#F2F2F2]" };
  }

  // Special Non-Working Holiday → Deep Purple #432E54
  if (holidayType === "special non-working" || holidayType === "non-working holiday") {
    return { textColor: "text-[#432E54]", badgeBg: "bg-[#432E54]/10", badgeText: "text-[#432E54]", borderColor: "border-none", bgColor: "bg-[#F2F2F2]" };
  }

  // Special Holiday (and Working Holiday) → Warm Brown #A27B5C
  if (holidayType === "special holiday" || holidayType === "working holiday") {
    return { textColor: "text-[#A27B5C]", badgeBg: "bg-[#A27B5C]/10", badgeText: "text-[#A27B5C]", borderColor: "border-none", bgColor: "bg-[#F2F2F2]" };
  }

  // Schedule Type → Slate Blue #535C91
  if (type === "schedule") {
    return { textColor: "text-[#535C91]", badgeBg: "bg-[#535C91]/10", badgeText: "text-[#535C91]", borderColor: "border-none", bgColor: "bg-[#F2F2F2]" };
  }

  // Announcement Type → Soft Purple #9290C3
  if (type === "announcement") {
    return { textColor: "text-[#9290C3]", badgeBg: "bg-[#9290C3]/10", badgeText: "text-[#9290C3]", borderColor: "border-none", bgColor: "bg-[#F2F2F2]" };
  }
  
  // Default / Event → Dark Navy #1B1A55
  return { textColor: "text-[#1B1A55]", badgeBg: "bg-[#1B1A55]/10", badgeText: "text-[#1B1A55]", borderColor: "border-none", bgColor: "bg-[#F2F2F2]" };
};

