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
import AdminAgendaView from '../../components/Custom/CalendarComponents/admin/components/AdminAgendaView';
import DrawerSidebar from '../../components/Custom/CalendarComponents/shared/components/DrawerSidebar';
import EventDetailsModal from '../../components/Custom/CalendarComponents/shared/Modals/EventDetailsModal';
import ConfirmDeleteModal from '../../components/Custom/CalendarComponents/shared/Modals/ConfirmDeleteModal';
import AdminCalendarActions from '../../components/Custom/CalendarComponents/AdminCalendarActions';
import { eventApi } from '../../api/eventApi';
import { fetchEmployees } from '../../api/employeeApi';
import { fetchDepartments } from '../../api/departmentApi';
import AddEventModal from '../../components/Custom/CalendarComponents/admin/Modals/AddEventModal';
import EditEventModal from '../../components/Custom/CalendarComponents/admin/Modals/EditEventModal';
import ScheduleModal from '../../components/Custom/CalendarComponents/admin/Modals/ScheduleModal';
import CreateAnnouncementModal from '../../components/Custom/CalendarComponents/admin/Modals/CreateAnnouncementModal';
import EditAnnouncementModal from '../../components/Custom/CalendarComponents/admin/Modals/EditAnnouncementModal';
import EditScheduleModal from '../../components/Custom/CalendarComponents/admin/Modals/EditScheduleModal';

// Utilities
import { holidays } from '../../utils/holidays';
import { getRandomEventColor } from '../../components/Custom/CalendarComponents/shared/utils/eventUtils';
import { scheduleApi } from '../../api/scheduleApi';
import { announcementApi } from '../../api/announcementApi';

const convertTo24Hour = (timeStr) => {
  if (!timeStr) return 9;
  // Handle case where timeStr is already a number
  if (typeof timeStr === 'number') return timeStr;
  // Handle case where timeStr is a string but not in AM/PM format
  if (typeof timeStr !== 'string' || timeStr.length < 3) return 9;
  const period = timeStr.slice(-2).toUpperCase();
  let hour = parseInt(timeStr.slice(0, -2));
  if (isNaN(hour)) return 9;
  if (period === 'PM' && hour !== 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;
  return hour;
};

export default function AdminCalendar() {
  // Calendar state management
  const calendarState = useCalendarState();
  const { today, currentDate, setCurrentDate, isDrawerOpen, setIsDrawerOpen, showHolidays, setShowHolidays, showEventDetails, setShowEventDetails } = calendarState;

  // Navigation handlers
  const navigation = useCalendarNav({ setCurrentDate });

  // Events state
  const [events, setEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);

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
        const employeeResponse = await fetchEmployees();
        if (employeeResponse.success && employeeResponse.employees) {
            setEmployees(employeeResponse.employees);
        }

        // Fetch departments for event modal
        try {
          const deptResponse = await fetchDepartments();
          if (deptResponse.departments) {
            setDepartments(deptResponse.departments);
          }
        } catch (deptError) {
          console.error("Failed to fetch departments:", deptError);
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
  const [announcementToEdit, setAnnouncementToEdit] = useState(null);
  const [scheduleToEdit, setScheduleToEdit] = useState(null);
  const [showEditAnnouncement, setShowEditAnnouncement] = useState(false);
  const [showEditSchedule, setShowEditSchedule] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteType, setDeleteType] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // View state
  const [currentView, setCurrentView] = useState('month');

  // Form states
  const [newEvent, setNewEvent] = useState({ title: '', time: 9, date: '', startDate: '', endDate: '', department: '', description: '' });
  const [newSchedule, setNewSchedule] = useState({ title: '', employee_id: '', startDate: '', endDate: '', startTime: '09:00', endTime: '17:00', description: '', repeat: 'none' });

  // Calendar data processing
  const calendarData = useCalendarData({ currentDate, events, showHolidays, holidays, announcements });
  const { month, day, year, dayName, displayedEvents } = calendarData;

  // Event handlers
  const handleAddEventClick = useCallback((time = 9) => {
    const todayStr = currentDate.toISOString().split('T')[0];
    setNewEvent({ title: '', time, date: todayStr, startDate: todayStr, endDate: todayStr, department: '', description: '' });
    setShowAddEvent(true);
  }, [currentDate]);

  const handleAddEvent = useCallback(async () => {
    const startDate = newEvent.startDate || newEvent.date;
    if (newEvent.title.trim() && startDate) {
      try {
          await eventApi.createEvent({title: newEvent.title, start_date: startDate, end_date: newEvent.endDate || startDate, date: startDate, time: convertTo24Hour(newEvent.time), department: newEvent.department || null, description: newEvent.description || null,});
          
          // Refresh data
          await fetchData();
          
          setNewEvent({ title: '', time: 9, date: '', startDate: '', endDate: '', department: '' });
          setShowAddEvent(false);
          alert("Event created successfully!");
      } catch (error) {
          console.error("Failed to create event:", error);
          const errorMessage = error.response?.data?.error || error.message || "Failed to create event.";
          alert(`Failed to create event: ${errorMessage}`);
      }
    } else {
        alert("Please fill in the Event Title and Start Date.");
    }
  }, [newEvent, fetchData]);

  const handleCreateSchedule = useCallback(async () => {
    if (newSchedule.employee_id && newSchedule.startDate && newSchedule.endDate && newSchedule.startTime && newSchedule.endTime) {
      try {
        await scheduleApi.createSchedule(newSchedule);
        
        // Refresh data
        await fetchData(); 

        setNewSchedule({ title: '', employee_id: '', startDate: '', endDate: '', startTime: '09:00', endTime: '17:00', description: '', repeat: 'none' });
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

  // Edit announcement handler
  const handleEditAnnouncement = useCallback((announcement) => {
    setAnnouncementToEdit(announcement);
    setShowEditAnnouncement(true);
  }, []);

  // Update announcement handler
  const handleUpdateAnnouncement = useCallback(async (id, updatedData) => {
    try {
      await announcementApi.updateAnnouncement(id, updatedData);
      await fetchData();
      setShowEditAnnouncement(false);
      setAnnouncementToEdit(null);
      alert('Announcement updated successfully!');
    } catch (error) {
      console.error('Failed to update announcement:', error);
      alert('Failed to update announcement. Please try again.');
    }
  }, [fetchData]);

  // Delete announcement handler
  const handleDeleteAnnouncement = useCallback((item) => {
    setItemToDelete(item);
    setDeleteType('announcement');
    setShowDeleteConfirm(true);
  }, []);

  // Edit schedule handler
  const handleEditSchedule = useCallback((schedule) => {
    setScheduleToEdit(schedule);
    setShowEditSchedule(true);
  }, []);

  // Update schedule handler
  const handleUpdateSchedule = useCallback(async (id, updatedData) => {
    try {
      await scheduleApi.updateSchedule(id, updatedData);
      await fetchData();
      setShowEditSchedule(false);
      setScheduleToEdit(null);
      alert('Schedule updated successfully!');
    } catch (error) {
      console.error('Failed to update schedule:', error);
      alert('Failed to update schedule. Please try again.');
    }
  }, [fetchData]);

  // Delete schedule handler
  const handleDeleteSchedule = useCallback((item) => {
    setItemToDelete(item);
    setDeleteType('schedule');
    setShowDeleteConfirm(true);
  }, []);

  // Delete event handler
  const handleDeleteClick = useCallback((item) => {
    setItemToDelete(item);
    setDeleteType('event');
    setShowEventDetails(null);
    setShowDeleteConfirm(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!itemToDelete) return;

    setIsDeleting(true);
    try {
      if (itemToDelete.id) {
        // Delete based on type
        if (deleteType === 'announcement') {
          await announcementApi.deleteAnnouncement(itemToDelete.id);
        } else if (deleteType === 'schedule') {
          await scheduleApi.deleteSchedule(itemToDelete.id);
        } else {
          await eventApi.deleteEvent(itemToDelete.id);
        }
        await fetchData(); // Refresh data
        alert("Deleted successfully!");
      }
      setShowDeleteConfirm(false);
      setItemToDelete(null);
      setDeleteType(null);
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
            <AdminAgendaView
              events={events}
              announcements={announcements}
              schedules={schedules}
              onAddEvent={() => handleAddEventClick(9)}
              onEditEvent={handleEditEvent}
              onDeleteEvent={handleDeleteClick}
              onAddAnnouncement={() => setShowAnnouncementModal(true)}
              onEditAnnouncement={handleEditAnnouncement}
              onDeleteAnnouncement={handleDeleteAnnouncement}
              onAddSchedule={() => setShowScheduleModal(true)}
              onEditSchedule={handleEditSchedule}
              onDeleteSchedule={handleDeleteSchedule}
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
        departments={departments}
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
        departments={departments}
      />

      {/* Edit Announcement Modal */}
      <EditAnnouncementModal
        show={showEditAnnouncement}
        announcement={announcementToEdit}
        onClose={() => {
          setShowEditAnnouncement(false);
          setAnnouncementToEdit(null);
        }}
        onUpdate={handleUpdateAnnouncement}
      />

      {/* Edit Schedule Modal */}
      <EditScheduleModal
        show={showEditSchedule}
        schedule={scheduleToEdit}
        onClose={() => {
          setShowEditSchedule(false);
          setScheduleToEdit(null);
        }}
        onUpdate={handleUpdateSchedule}
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