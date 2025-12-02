import { useState, useCallback, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// Shared hooks and components
import { useCalendarState } from '../../components/Custom/CalendarComponents/shared/hooks/useCalendarState';
import { useCalendarNav } from '../../components/Custom/CalendarComponents/shared/hooks/useCalendarNav';
import { useCalendarData } from '../../components/Custom/CalendarComponents/shared/hooks/useCalendarData';
import { HOURS_12, EVENT_COLORS } from '../../components/Custom/CalendarComponents/shared/constants/calendarConstants';

import CalendarHeader from '../../components/Custom/CalendarComponents/shared/components/CalendarHeader';
import CalendarControls from '../../components/Custom/CalendarComponents/shared/components/CalendarControls';
import CalendarGrid from '../../components/Custom/CalendarComponents/shared/components/CalendarGrid';
import AgendaView from '../../components/Custom/CalendarComponents/shared/components/AgendaView';
import DrawerSidebar from '../../components/Custom/CalendarComponents/shared/components/DrawerSidebar';
import EventDetailsModal from '../../components/Custom/CalendarComponents/shared/Modals/EventDetailsModal';
import ConfirmDeleteModal from '../../components/Custom/CalendarComponents/shared/Modals/ConfirmDeleteModal';
import AdminCalendarActions from '../../components/Custom/CalendarComponents/AdminCalendarActions';
import { Plus, Calendar as CalendarIcon, Clock, RefreshCw, List } from 'lucide-react';
import { eventApi } from '../../api/eventApi';
import { getEmployees } from '../../api/employeeApi';
import AddEventModal from '../../components/Custom/CalendarComponents/admin/Modals/AddEventModal';
import EditEventModal from '../../components/Custom/CalendarComponents/admin/Modals/EditEventModal';
import ScheduleModal from '../../components/Custom/CalendarComponents/admin/Modals/ScheduleModal';
import CreateAnnouncementModal from '../../components/Custom/CalendarComponents/admin/Modals/CreateAnnouncementModal';

// Utilities
import { holidays } from '../../utils/holidays';
import { getRandomEventColor } from '../../components/Custom/CalendarComponents/shared/utils/eventUtils';
import { scheduleApi } from '../../api/scheduleApi';
import { announcementApi } from '../../api/announcementApi';

export default function AdminCalendar() {
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
  const [schedules, setSchedules] = useState([]);
  const [employees, setEmployees] = useState([]);

  // Fetch Data
  const fetchData = useCallback(async () => {
      try {
        const announcementResponse = await announcementApi.getAnnouncements();
        if (announcementResponse.data && announcementResponse.data.announcements) {
            setAnnouncements(announcementResponse.data.announcements);
        }

        const eventResponse = await eventApi.getEvents();
        if (eventResponse.data && eventResponse.data.events) {
            const apiEvents = eventResponse.data.events.map(e => ({
               ...e,
               color: getRandomEventColor(EVENT_COLORS)
            }));
            setEvents(apiEvents);
        }

        // Fetch Schedules
        const scheduleResponse = await scheduleApi.getAllSchedules();
        if (scheduleResponse.data && scheduleResponse.data.schedules) {
            setSchedules(scheduleResponse.data.schedules);
        }

        // Fetch employees for filters
        const employeeResponse = await getEmployees();
        if (employeeResponse.data && employeeResponse.data.employees) {
            setEmployees(employeeResponse.data.employees);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Modal states
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showEditEvent, setShowEditEvent] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [eventToEdit, setEventToEdit] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // View state
  const [currentView, setCurrentView] = useState('month');

  // Form states
  const [newEvent, setNewEvent] = useState({ title: '', time: 9, date: '' });
  const [newSchedule, setNewSchedule] = useState({
    title: '', 
    employee_id: '',
    startDate: '', 
    endDate: '', 
    startTime: '09:00', 
    endTime: '17:00', 
    description: '', 
    repeat: 'none'
  });

  // Calendar data processing
  const calendarData = useCalendarData({
    currentDate,
    events,
    showHolidays,
    holidays,
    announcements
  });
  const { month, day, year, dayName, displayedEvents } = calendarData;

  // Event handlers
  const handleAddEventClick = useCallback((time = 9) => {
    setNewEvent({ title: '', time, date: currentDate.toISOString().split('T')[0] });
    setShowAddEvent(true);
  }, [currentDate]);

  const handleAddEvent = useCallback(async () => {
    if (newEvent.title.trim() && newEvent.date) {
      try {
          await eventApi.createEvent({
              ...newEvent,
              time: parseInt(newEvent.time),
          });
          
          // Refresh data
          await fetchData();
          
          setNewEvent({ title: '', time: 9, date: '' });
          setShowAddEvent(false);
          alert("Event created successfully!");
      } catch (error) {
          console.error("Failed to create event:", error);
          alert("Failed to create event.");
      }
    } else {
        alert("Please fill in the Event Title and Date.");
    }
  }, [newEvent, fetchData]);

  const handleCreateSchedule = useCallback(async () => {
    if (newSchedule.employee_id && newSchedule.startDate && newSchedule.endDate && newSchedule.startTime && newSchedule.endTime) {
      try {
        await scheduleApi.createSchedule(newSchedule);
        
        // Refresh data
        await fetchData(); 

        setNewSchedule({ 
          title: '', 
          employee_id: '',
          startDate: '', 
          endDate: '', 
          startTime: '09:00', 
          endTime: '17:00', 
          description: '', 
          repeat: 'none' 
        });
        setShowScheduleModal(false);
        alert("Schedule created successfully!");
      } catch (error) {
        console.error("Failed to create schedule:", error);
        alert("Failed to create schedule. Please try again.");
      }
    } else {
      alert("Please fill in all required fields (Employee, Start/End Date, Start/End Time).");
    }
  }, [newSchedule]);

  const handleCreateAnnouncement = useCallback(async (announcementData) => {
      if (announcementData.title && announcementData.content) {
        try {
            await announcementApi.createAnnouncement(announcementData);
            await fetchData(); // Refresh to show new announcement
            setShowAnnouncementModal(false);
            alert("Announcement created successfully!");
        } catch (error) {
            console.error("Failed to create announcement:", error);
            const errorMessage = error.response?.data?.message || error.message || "Failed to create announcement.";
            alert(`Error: ${errorMessage}`);
        }
      } else {
          alert("Please fill in the Title and Content.");
      }
  }, [fetchData]);

  // Edit event handler
  const handleEditEvent = useCallback((event) => {
    setEventToEdit(event);
    setShowEventDetails(null);
    setShowEditEvent(true);
  }, []);

  // Update event handler
  const handleUpdateEvent = useCallback(async (updatedData) => {
    if (!eventToEdit) return;

    try {
      await eventApi.updateEvent(eventToEdit.id, updatedData);
      await fetchData(); // Refresh data
      setShowEditEvent(false);
      setEventToEdit(null);
      alert("Event updated successfully!");
    } catch (error) {
      console.error("Failed to update event:", error);
      alert("Failed to update event. Please try again.");
    }
  }, [eventToEdit, fetchData]);

  // Delete event/schedule handler
  const handleDeleteClick = useCallback((item) => {
    setItemToDelete(item);
    setShowEventDetails(null);
    setShowDeleteConfirm(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!itemToDelete) return;

    setIsDeleting(true);
    try {
      if (itemToDelete.id) {
        // Check if it's a schedule or event
        if (itemToDelete.day_of_week) {
          // It's a schedule
          await scheduleApi.deleteSchedule(itemToDelete.id);
        } else {
          // It's an event
          await eventApi.deleteEvent(itemToDelete.id);
        }
        await fetchData(); // Refresh data
        alert("Deleted successfully!");
      }
      setShowDeleteConfirm(false);
      setItemToDelete(null);
    } catch (error) {
      console.error("Failed to delete:", error);
      alert("Failed to delete. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  }, [itemToDelete, fetchData]);

  // Handle event drop for drag and drop
  const handleEventDrop = useCallback(async (event, newDate) => {
    try {
      const formattedDate = newDate.toISOString().split('T')[0];
      await eventApi.updateEvent(event.id, { ...event, date: formattedDate });
      await fetchData(); // Refresh calendar
      alert(`Event "${event.title}" moved to ${formattedDate}`);
    } catch (error) {
      console.error('Failed to move event:', error);
      alert('Failed to move event. Please try again.');
    }
  }, [fetchData]);

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
          currentView={currentView}
          onViewChange={setCurrentView}
          allowedViews={['month', 'agenda']}
          actions={
            <>
              <AdminCalendarActions
                onAddEvent={() => handleAddEventClick(9)}
                onSchedule={() => setShowScheduleModal(true)}
                onAnnouncement={() => setShowAnnouncementModal(true)}
                onOpenDrawer={() => setIsDrawerOpen(true)}
              />
            </>
          }
        />

        {/* Calendar Body - Conditional View Rendering */}
        <div className="flex-1 overflow-auto p-8 bg-[#F8F9FA]">
          {currentView === 'month' && (
            <CalendarGrid
              currentDate={currentDate}
              today={today}
              onDateClick={navigation.handleDateClick}
              showHolidays={showHolidays}
              holidays={holidays}
              announcements={announcements}
              events={events}
              schedules={schedules}
              displayedEvents={displayedEvents}
              onEventDrop={handleEventDrop}
            />
          )}
          {currentView === 'agenda' && (
            <AgendaView
              events={events}
              announcements={announcements}
              onEventClick={setShowEventDetails}
            />
          )}
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
          isAdmin={true}
          onEdit={handleEditEvent}
          onDelete={handleDeleteClick}
        />
      )}

      {/* Add Event Modal */}
      <AddEventModal
        show={showAddEvent}
        newEvent={newEvent}
        setNewEvent={setNewEvent}
        onClose={() => setShowAddEvent(false)}
        onAdd={handleAddEvent}
        hours={HOURS_12}
      />

      {/* Schedule Modal */}
      <ScheduleModal
        show={showScheduleModal}
        newSchedule={newSchedule}
        setNewSchedule={setNewSchedule}
        onClose={() => setShowScheduleModal(false)}
        onCreate={handleCreateSchedule}
        hours={HOURS_12}
      />

      {/* Announcement Modal */}
      <CreateAnnouncementModal
        show={showAnnouncementModal}
        onClose={() => setShowAnnouncementModal(false)}
        onCreate={handleCreateAnnouncement}
      />

      {/* Edit Event Modal */}
      <EditEventModal
        show={showEditEvent}
        event={eventToEdit}
        onClose={() => {
          setShowEditEvent(false);
          setEventToEdit(null);
        }}
        onUpdate={handleUpdateEvent}
        hours={HOURS_12}
      />

      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal
        show={showDeleteConfirm}
        title="Confirm Deletion"
        message={`Are you sure you want to delete "${itemToDelete?.title || 'this item'}"? This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setItemToDelete(null);
        }}
        isDeleting={isDeleting}
      />

    </div>
    </DndProvider>
  );
}