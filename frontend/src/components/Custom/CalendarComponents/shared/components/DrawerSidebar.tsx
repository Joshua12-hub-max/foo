import React from 'react';
import { X } from 'lucide-react';
import MiniCalendar from './MiniCalendar';
import EventsList from './EventsList';
import { isSameDay } from '../utils/dateUtils';
import { GridItem } from './CalendarGrid';
import { Holiday } from '@/types/calendar';

interface DrawerSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentDate: Date;
  today: Date;
  month: string;
  year: number | string;
  onDateClick: (date: Date) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  displayedEvents: GridItem[];
  hours: { [key: string]: string };
  onEventClick: (event: GridItem) => void;
  showHolidays: boolean;
  holidays: Holiday[];
  announcements?: GridItem[];
  schedules?: GridItem[];
}

const DrawerSidebar: React.FC<DrawerSidebarProps> = ({isOpen,onClose,currentDate,today,month,year,onDateClick,onPrevMonth,onNextMonth,displayedEvents,hours,onEventClick,showHolidays,holidays,announcements = [],schedules = []}) => {
  
  // Filter and format announcements for the current date
  const todaysAnnouncements = announcements.filter(a => {
     const checkDate = new Date(currentDate);
     checkDate.setHours(0,0,0,0);

     if (a.startDate && a.endDate) {
         const start = new Date(a.startDate);
         const end = new Date(a.endDate);
         start.setHours(0,0,0,0);
         end.setHours(23,59,59,999);
         return checkDate >= start && checkDate <= end;
     } else {
         const created = new Date(a.createdAt ?? '');
         created.setHours(0,0,0,0);
         return created.getTime() === checkDate.getTime();
     }
  }).map(a => {
      let time = '09:00'; // Default time
      if (a.startTime) {
          time = a.startTime;
      }
            let color = 'bg-gray-200 border-gray-300 text-gray-700';
       if (a.priority === 'high') color = 'bg-gray-200 border-gray-300 text-gray-700';
       if (a.priority === 'urgent') color = 'bg-red-50 border-red-400 text-red-800';

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

  // Filter schedules from displayedEvents for the current date
  const todaysSchedules = displayedEvents.filter(item => {
    if (item.type !== 'schedule' && !item.isSchedule) return false;
    // @ts-ignore
    const itemDate = new Date(item.date);
    // @ts-ignore
    return isSameDay(itemDate, currentDate);
  }).map(s => ({
    ...s,
    id: `schedule-sidebar-${s.id}`,
    description: `${s.time} - ${s.endTime || 'End'}`,
  }));

  // Filter out schedules from displayedEvents to avoid duplicates (they'll be added back separately)
  const eventsWithoutSchedules = displayedEvents.filter(item => 
    item.type !== 'schedule' && !item.isSchedule
  );

  const allEvents = [...eventsWithoutSchedules, ...todaysAnnouncements, ...todaysSchedules];

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
