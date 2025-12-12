import { useState, useEffect } from 'react';

// Shared hooks and components
import { useCalendarState } from '../../components/Custom/CalendarComponents/shared/hooks/useCalendarState';
import { useCalendarNav } from '../../components/Custom/CalendarComponents/shared/hooks/useCalendarNav';
import { useCalendarData } from '../../components/Custom/CalendarComponents/shared/hooks/useCalendarData';
import { HOURS_12, EVENT_COLORS } from '../../components/Custom/CalendarComponents/shared/constants/calendarConstants';

import CalendarHeader from '../../components/Custom/CalendarComponents/shared/components/CalendarHeader';
import CalendarControls from '../../components/Custom/CalendarComponents/shared/components/CalendarControls';
import CalendarGrid from '../../components/Custom/CalendarComponents/shared/components/CalendarGrid';
import EventDetailsModal from '../../components/Custom/CalendarComponents/shared/Modals/EventDetailsModal';
import DrawerSidebar from '../../components/Custom/CalendarComponents/shared/components/DrawerSidebar';

// Employee-specific components
import EmployeeCalendarActions from '../../components/Custom/CalendarComponents/employee/components/EmployeeCalendarActions';

// Utilities
import { holidays } from '../../utils/holidays';
import { announcementApi } from '../../api/announcementApi';
import { eventApi } from '../../api/eventApi';
import { scheduleApi } from '../../api/scheduleApi'; // Import scheduleApi
import { getRandomEventColor } from '../../components/Custom/CalendarComponents/shared/utils/eventUtils';

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

  // Events state
  const [events, setEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [schedules, setSchedules] = useState([]); // New state for schedules
  const [user, setUser] = useState(null); // State to store user info

  useEffect(() => {
    // Get user from local storage
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
        setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
        if (!user) return; // Ensure user is loaded

        try {
            // Fetch Announcements
            const announcementResponse = await announcementApi.getAnnouncements();
            if (announcementResponse.data && announcementResponse.data.announcements) {
                setAnnouncements(announcementResponse.data.announcements);
            }

            // Fetch Events
            const eventResponse = await eventApi.getEvents();
            if (eventResponse.data && eventResponse.data.events) {
                const apiEvents = eventResponse.data.events.map(e => ({
                   ...e,
                   color: getRandomEventColor(EVENT_COLORS)
                }));
                setEvents(apiEvents);
            }

            // Fetch Employee Schedule
            const scheduleResponse = await scheduleApi.getMySchedule();
            console.log('📅 [EmployeeCalendar] Schedule API Response:', scheduleResponse.data);
            if (scheduleResponse.data && scheduleResponse.data.schedule) {
                console.log('📅 [EmployeeCalendar] Setting schedules:', scheduleResponse.data.schedule);
                setSchedules(scheduleResponse.data.schedule);
            }

        } catch (error) {
            console.error("Failed to fetch calendar data:", error);
        }
    };
    fetchData();
  }, [user]); // Re-fetch when user changes


  // Calendar data processing
  const calendarData = useCalendarData({
    currentDate,
    events, 
    showHolidays,
    holidays,
    announcements,
    schedules // Pass schedules to useCalendarData
  });
  const { month, day, year, dayName, displayedEvents } = calendarData;

  return (
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
            holidays={holidays}
            announcements={announcements}
            schedules={schedules} // Pass schedules to CalendarGrid
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
        onEventClick={setShowEventDetails}
        showHolidays={showHolidays}
        holidays={holidays}
        announcements={announcements}
        schedules={schedules} // Pass schedules to DrawerSidebar
      />

      {/* Event Details Modal */}
      {showEventDetails && (
        <EventDetailsModal
          event={showEventDetails}
          onClose={() => setShowEventDetails(null)}
          hours={HOURS_12}
          month={month}
          day={day}
          dayName={dayName}
        />
      )}
    </div>
  );
}