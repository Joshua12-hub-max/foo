import { useQuery } from '@tanstack/react-query';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import {
  useCalendarState,
  useCalendarNav,
  useCalendarData,
  HOURS_12,
  EVENT_COLORS,
  CalendarHeader,
  CalendarControls,
  CalendarGrid,
  EventDetailsModal,
  DrawerSidebar,
  getRandomEventColor
} from '@components/Custom/CalendarComponents/shared';

import { EmployeeCalendarActions } from '@components/Custom/CalendarComponents/employee/components';
import { useHolidays } from '@/hooks/useLeave';
import { announcementApi, eventApi, scheduleApi } from '@api';
import { CalendarEvent, Holiday, ScheduleEntry } from '@/types/calendar';

export default function EmployeeCalendar() {
  // Calendar state management
  const calendarState = useCalendarState();
  const {
    today,
    currentDate,
    setCurrentDate,
    isDrawerOpen,
    setIsDrawerOpen,
    showHolidays,
    setShowHolidays,
    showEventDetails,
    setShowEventDetails
  } = calendarState;

  // Navigation handlers
  const navigation = useCalendarNav({ setCurrentDate });

  // Events query
  const { data: events = [] } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const response = await eventApi.getEvents();
      return response.data?.events?.map((e: CalendarEvent) => ({
        ...e,
        color: getRandomEventColor(EVENT_COLORS)
      })) || [];
    }
  });

  // Announcements query
  const { data: announcements = [] } = useQuery({
    queryKey: ['announcements'],
    queryFn: async () => {
      const response = await announcementApi.getAnnouncements();
      return response.data?.announcements || [];
    }
  });

  // Schedules query
  const { data: schedules = [] } = useQuery<ScheduleEntry[]>({
    queryKey: ['schedules-list'],
    queryFn: async () => {
        const response = await scheduleApi.getSchedules();
        return (response.schedules || []) as unknown as ScheduleEntry[];
    }
  });

  // Holidays query
  const { data: holidaysData } = useHolidays(currentDate.getFullYear());
  const holidays = holidaysData?.holidays || [];

  // Calendar data processing
  const calendarData = useCalendarData({
    currentDate,
    events,
    showHolidays,
    holidays: (holidays as unknown as Holiday[]).map(h => ({ ...h, name: h.name || h.title || '' })),
    announcements,
    schedules
  });
  const { month, day, year, dayName, displayedEvents } = calendarData;

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex h-screen bg-[#274b46] overflow-hidden">
        {/* MAIN CALENDAR AREA */}
        <div className="flex-1 flex flex-col">
          <CalendarHeader month={month} year={year} />

          <CalendarControls
            onPrevMonth={navigation.handlePrevMonth}
            onNextMonth={navigation.handleNextMonth}
            onToday={navigation.handleToday}
            showHolidays={showHolidays}
            onToggleHolidays={() => setShowHolidays(!showHolidays)}
            actions={
              <EmployeeCalendarActions
                onOpenDrawer={() => setIsDrawerOpen(true)}
              />
            }
          />

          {/* Calendar Body */}
          <div className="flex-1 overflow-auto p-8 bg-[#F8F9FA]">
            <CalendarGrid
              currentDate={currentDate}
              today={today}
              onDateClick={navigation.handleDateClick}
              showHolidays={showHolidays}
              holidays={holidays as unknown as import('@components/Custom/CalendarComponents/shared/components/CalendarGrid').GridItem[]}
              announcements={announcements}
              displayedEvents={displayedEvents}
            />
          </div>
        </div>

        {/* DRAWER SIDEBAR */}
        <DrawerSidebar
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          currentDate={currentDate}
          today={today}
          month={month}
          year={year}
          onDateClick={navigation.handleDateClick}
          onPrevMonth={navigation.handlePrevMonth}
          onNextMonth={navigation.handleNextMonth}
          displayedEvents={displayedEvents}
          hours={HOURS_12}
          onEventClick={(e) => setShowEventDetails(e as unknown as typeof showEventDetails)}
          showHolidays={showHolidays}
          holidays={(holidays as unknown as Holiday[]).map(h => ({ ...h, name: h.name || h.title || '' }))}
          announcements={announcements}
        />

        {/* Event Details Modal */}
        {showEventDetails && (
          <EventDetailsModal
            event={showEventDetails as unknown as CalendarEvent}
            onClose={() => setShowEventDetails(null)}
            hours={HOURS_12}
            month={month}
            day={day}
            dayName={dayName}
          />
        )}
      </div>
    </DndProvider>
  );
}