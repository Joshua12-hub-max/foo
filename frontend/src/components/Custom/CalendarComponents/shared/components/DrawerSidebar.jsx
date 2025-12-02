import { X } from 'lucide-react';
import MiniCalendar from './MiniCalendar';
import EventsList from './EventsList';
import { DAYS_FULL } from '../constants/calendarConstants';
import { isSameDay } from '../utils/dateUtils';

/**
 * Drawer Sidebar Component
 * Right drawer with mini calendar and events list
 */
const DrawerSidebar = ({
  isOpen,
  onClose,
  currentDate,
  today,
  month,
  year,
  onDateClick,
  onPrevMonth,
  onNextMonth,
  displayedEvents,
  hours,
  onEventClick,
  showHolidays,
  holidays,
  announcements = [],
  schedules = [] // Accept schedules prop
}) => {
  
  // Filter and format announcements for the current date
  const todaysAnnouncements = announcements.filter(a => {
     const checkDate = new Date(currentDate);
     checkDate.setHours(0,0,0,0);

     if (a.start_date && a.end_date) {
         const start = new Date(a.start_date);
         const end = new Date(a.end_date);
         start.setHours(0,0,0,0);
         end.setHours(23,59,59,999);
         return checkDate >= start && checkDate <= end;
     } else {
         const created = new Date(a.created_at);
         created.setHours(0,0,0,0);
         return created.getTime() === checkDate.getTime();
     }
  }).map(a => {
      let time = '09:00'; // Default time
      if (a.start_time) {
          time = a.start_time;
      }
      
      let color = 'bg-yellow-100 border-yellow-300 text-yellow-800';
      if (a.priority === 'high') color = 'bg-orange-100 border-orange-300 text-orange-800';
      if (a.priority === 'urgent') color = 'bg-red-100 border-red-300 text-red-800';

      return {
          id: `announcement-${a.id}`,
          title: a.title,
          description: a.content,
          time: time,
          color: color,
          isAnnouncement: true,
          date: currentDate.toISOString().split('T')[0] // Assign current date for filtering
      };
  });

  // Filter schedules for the current date
  const todaysSchedules = schedules.filter(s => {
    // Schedules are generated in combineCalendarItems with a 'date' property
    // We need to compare this generated date with the currentDate
    const scheduleDate = new Date(s.date);
    return isSameDay(scheduleDate, currentDate);
  }).map(s => ({
    ...s,
    id: `schedule-sidebar-${s.id}`, // Ensure unique ID for sidebar display
    title: s.title, // Use the title generated in combineCalendarItems
    description: `From ${s.start_time} to ${s.end_time}. ${s.is_rest_day ? 'Rest Day' : 'Work Day'}`,
    time: s.time, // Use the time from the schedule item
    type: 'schedule', // Explicitly set type for styling
    isSchedule: true,
    date: currentDate.toISOString().split('T')[0]
  }));

  const allEvents = [...displayedEvents, ...todaysAnnouncements, ...todaysSchedules];

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div 
        className={`fixed top-0 right-0 h-full w-80 bg-gray-100 border-l border-gray-300 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full overflow-auto p-6">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-gray-200 rounded-lg transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5 text-gray-700" />
          </button>

          {/* Mini Calendar */}
          <MiniCalendar
            currentDate={currentDate}
            today={today}
            month={month}
            year={year}
            onDateClick={onDateClick}
            onPrevMonth={onPrevMonth}
            onNextMonth={onNextMonth}
            showHolidays={showHolidays}
            holidays={holidays}
          />

          {/* Today's Schedule */}
          <EventsList
            events={allEvents}
            currentDate={currentDate}
            hours={hours}
            onEventClick={onEventClick}
          />
        </div>
      </div>
    </>
  );
};

export default DrawerSidebar;