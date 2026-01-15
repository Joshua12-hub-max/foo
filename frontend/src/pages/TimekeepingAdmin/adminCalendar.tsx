import { useState, useCallback } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  ConfirmDeleteModal,
  DrawerSidebar,
  getRandomEventColor,
} from '@components/Custom/CalendarComponents/shared';

import { AdminAgendaView } from '@components/Custom/CalendarComponents/admin/components';
import AdminCalendarActions from '@components/Custom/CalendarComponents/AdminCalendarActions';
import { eventApi, fetchEmployees, fetchDepartments, announcementApi, scheduleApi } from '@api';
import {
  AddEventModal,
  EditEventModal,
  CreateAnnouncementModal,
  EditAnnouncementModal,
  ScheduleModal,
  EditScheduleModal
} from '@components/Custom/CalendarComponents/admin/Modals';
import { useToastStore } from '@/stores';
import { holidays } from '@utils';

export default function AdminCalendar() {
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);
  const showNotification = (message: string, type: 'success' | 'error') => showToast(message, type);

  // Calendar state management
  const calendarState = useCalendarState();
  const { today, currentDate, setCurrentDate, isDrawerOpen, setIsDrawerOpen, showHolidays, setShowHolidays, showEventDetails, setShowEventDetails } = calendarState;

  // Constants
  const HOURS_LIST = Object.values(HOURS_12);

  // Navigation handlers
  const navigation = useCalendarNav({ setCurrentDate });

  // View state
  const [currentView, setCurrentView] = useState('month');

  // Modal states
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showEditEvent, setShowEditEvent] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showEditSchedule, setShowEditSchedule] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditAnnouncement, setShowEditAnnouncement] = useState(false);
  
  const [eventToEdit, setEventToEdit] = useState<any>(null);
  const [announcementToEdit, setAnnouncementToEdit] = useState<any>(null);
  const [scheduleToEdit, setScheduleToEdit] = useState<any>(null);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [deleteType, setDeleteType] = useState<'event' | 'announcement' | 'schedule' | null>(null);



  /* Removed newEvent state */

  // --- QUERIES ---

  const { data: announcements = [] } = useQuery({
    queryKey: ['announcements'],
    queryFn: async () => {
      const response = await announcementApi.getAnnouncements();
      return response.data?.announcements || [];
    }
  });

  const { data: schedules = [] } = useQuery({
    queryKey: ['schedules'],
    queryFn: async () => {
        const response = await scheduleApi.getSchedules();
        return response.data?.schedules || [];
    }
  });

  const { data: events = [] } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const response = await eventApi.getEvents();
      return response.data?.events?.map((e: any) => ({
        ...e,
        color: getRandomEventColor(EVENT_COLORS)
      })) || [];
    }
  });

  // Fetch employees (if needed for filtering/display, kept consistent with original)
  useQuery({
    queryKey: ['employees-list'],
    queryFn: async () => {
        const response = await fetchEmployees();
        return response.success ? response.employees : [];
    }
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['departments-list'],
    queryFn: async () => {
      const response = await fetchDepartments();
      return response.departments || [];
    }
  });

  // --- MUTATIONS ---

  const createScheduleMutation = useMutation({
    mutationFn: async (data: any) => {
        console.log('📅 [createScheduleMutation] Raw data received:', data);
        // Support both snake_case (from ScheduleModal) and camelCase formats
        const payload = {
            employee_id: data.employee_id,
            start_date: data.start_date || data.startDate,
            end_date: data.end_date || data.endDate,
            start_time: data.start_time || data.startTime,
            end_time: data.end_time || data.endTime,
            title: data.title,
            description: data.description,
            repeat: data.repeat || 'none'
        };
        console.log('📅 [createScheduleMutation] Payload to send:', payload);
        const response = await scheduleApi.createSchedule(payload);
        console.log('📅 [createScheduleMutation] Response:', response);
        return response;
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['schedules'] });
        setShowScheduleModal(false);
        showNotification("Schedule created successfully!", "success");
    },
    onError: (error: any) => {
        console.error("Failed to create schedule:", error);
        const errorMsg = error?.response?.data?.message || "Failed to create schedule.";
        showNotification(errorMsg, "error");
    }
  });

  const updateScheduleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string | number, data: any }) => {
        // Map frontend fields (startDate/startTime) to backend fields (start_date/start_time)
        const payload = {
            start_time: data.startTime || data.start_time,
            end_time: data.endTime || data.end_time,
        };
        await scheduleApi.updateSchedule(id, payload);
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['schedules'] });
        setShowEditSchedule(false);
        setScheduleToEdit(null);
        showNotification("Schedule updated successfully!", "success");
    },
    onError: (error) => {
        console.error("Failed to update schedule:", error);
        showNotification("Failed to update schedule.", "error");
    }
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: async (id: string | number) => {
        await scheduleApi.deleteSchedule(id);
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['schedules'] });
        setShowDeleteConfirm(false);
        setItemToDelete(null);
        setDeleteType(null);
        showNotification("Schedule deleted successfully!", "success");
    },
    onError: (error) => {
        console.error("Failed to delete schedule:", error);
        showNotification("Failed to delete schedule.", "error");
    }
  });


  const createEventMutation = useMutation({
    mutationFn: async (data: any) => {
        // Validation check before API call to mimic original logic behavior if needed, 
        // though typically this should be in the submit handler.
        if (!data.title?.trim() || !data.start_date) {
            throw new Error("Please fill in the Event Title and Start Date.");
        }
        await eventApi.createEvent(data);
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['events'] });
        setShowAddEvent(false);
        showNotification("Event created successfully!", "success");
    },
    onError: (error: any) => {
        console.error("Failed to create event:", error);
        const errorMessage = error.message || error.response?.data?.error || "Failed to create event.";
        showNotification(errorMessage.includes("fill in") ? errorMessage : `Failed to create event: ${errorMessage}`, "error");
    }
  });

  const updateEventMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string | number, data: any }) => {
        await eventApi.updateEvent(id, data);
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['events'] });
        setShowEditEvent(false);
        setEventToEdit(null);
        showNotification("Event updated successfully!", "success");
    },
    onError: (error) => {
        console.error("Failed to update event:", error);
        showNotification("Failed to update event. Please try again.", "error");
    }
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (id: string | number) => {
        await eventApi.deleteEvent(id);
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['events'] });
        setShowDeleteConfirm(false);
        setItemToDelete(null);
        setDeleteType(null);
        showNotification("Deleted successfully!", "success");
    },
    onError: (error) => {
        console.error("Failed to delete event:", error);
        showNotification("Failed to delete. Please try again.", "error");
    }
  });

  const createAnnouncementMutation = useMutation({
    mutationFn: async (data: any) => {
        if (!data.title || !data.content) {
             throw new Error("Please fill in the Title and Content.");
        }
        await announcementApi.createAnnouncement(data);
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['announcements'] });
        setShowAnnouncementModal(false);
        showNotification("Announcement created successfully!", "success");
    },
    onError: (error: any) => {
        console.error("Failed to create announcement:", error);
        const errorMessage = error.message || error.response?.data?.message || "Failed to create announcement.";
        showNotification(errorMessage.includes("fill in") ? errorMessage : `Error: ${errorMessage}`, "error");
    }
  });

  const updateAnnouncementMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string | number, data: any }) => {
        await announcementApi.updateAnnouncement(id, data);
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['announcements'] });
        setShowEditAnnouncement(false);
        setAnnouncementToEdit(null);
        showNotification('Announcement updated successfully!', 'success');
    },
    onError: (error) => {
        console.error('Failed to update announcement:', error);
        showNotification('Failed to update announcement. Please try again.', 'error');
    }
  });

  const deleteAnnouncementMutation = useMutation({
    mutationFn: async (id: string | number) => {
        await announcementApi.deleteAnnouncement(id);
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['announcements'] });
        setShowDeleteConfirm(false);
        setItemToDelete(null);
        setDeleteType(null);
        showNotification("Deleted successfully!", "success");
    },
    onError: (error) => {
        console.error("Failed to delete announcement:", error);
        showNotification("Failed to delete. Please try again.", "error");
    }
  });


  // --- HANDLERS ---

  const handleAddEventClick = useCallback((time = '09:00') => {
    // If we wanted to pass time to the modal we could using a separate state or just let the modal default
    setShowAddEvent(true);
  }, []);

  const handleAddEvent = useCallback((data: any) => {
    // RHF provides the data
    createEventMutation.mutate(data);
  }, [createEventMutation]);

  const handleCreateAnnouncement = useCallback((announcementData: any) => {
    createAnnouncementMutation.mutate(announcementData);
  }, [createAnnouncementMutation]);

  const handleEditEvent = useCallback((event: any) => {
    setEventToEdit(event);
    setShowEventDetails(null);
    setShowEditEvent(true);
  }, [setShowEventDetails]);

  const handleUpdateEvent = useCallback((updatedData: any) => {
    if (!eventToEdit) return;
    updateEventMutation.mutate({ id: eventToEdit.id, data: updatedData });
  }, [eventToEdit, updateEventMutation]);

  const handleEditAnnouncement = useCallback((announcement: any) => {
    setAnnouncementToEdit(announcement);
    setShowEditAnnouncement(true);
  }, []);

  const handleUpdateAnnouncement = useCallback((id: string | number, updatedData: any) => {
    updateAnnouncementMutation.mutate({ id, data: updatedData });
  }, [updateAnnouncementMutation]);

  const handleDeleteAnnouncement = useCallback((item: any) => {
    setItemToDelete(item);
    setDeleteType('announcement');
    setShowDeleteConfirm(true);
  }, []);

  const handleDeleteClick = useCallback((item: any) => {
    setItemToDelete(item);
    setDeleteType('event');
    setShowEventDetails(null);
    setShowDeleteConfirm(true);
  }, [setShowEventDetails]);

  const handleConfirmDelete = useCallback(() => {
    if (!itemToDelete) return;

    if (deleteType === 'announcement') {
      deleteAnnouncementMutation.mutate(itemToDelete.id);
    } else if (deleteType === 'schedule') {
      deleteScheduleMutation.mutate(itemToDelete.id);
    } else {
      deleteEventMutation.mutate(itemToDelete.id);
    }
  }, [itemToDelete, deleteType, deleteAnnouncementMutation, deleteEventMutation, deleteScheduleMutation]);

  const handleEditSchedule = useCallback((schedule: any) => {
    setScheduleToEdit(schedule);
    setShowEditSchedule(true);
  }, []);

  const handleUpdateSchedule = useCallback((id: string | number, updatedData: any) => {
    updateScheduleMutation.mutate({ id, data: updatedData });
  }, [updateScheduleMutation]);

  const handleDeleteSchedule = useCallback((item: any) => {
    setItemToDelete(item);
    setDeleteType('schedule');
    setShowDeleteConfirm(true);
  }, []);


  const handleEventDrop = useCallback((event: any, newDate: Date) => {
      const formattedDate = newDate.toISOString().split('T')[0];
      // Optimistic update or just simple mutation
      updateEventMutation.mutate({ id: event.id, data: { ...event, date: formattedDate } });
  }, [updateEventMutation]);

  // Calendar data processing
  const calendarData = useCalendarData({ currentDate, events, showHolidays, holidays, announcements });
  const { month, day, year, dayName, displayedEvents } = calendarData;
  
  const isDeleting = deleteEventMutation.isPending || deleteAnnouncementMutation.isPending || deleteScheduleMutation.isPending;

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
                  {...{
                    onAddEvent: () => handleAddEventClick('09:00'),
                    onAnnouncement: () => setShowAnnouncementModal(true),
                    onAddSchedule: () => setShowScheduleModal(true),
                    onOpenDrawer: () => setIsDrawerOpen(true)
                  } as any}
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
                displayedEvents={displayedEvents}
                onEventDrop={handleEventDrop}
              />
            )}
            {currentView === 'agenda' && (
              <AdminAgendaView
                events={events}
                announcements={announcements}
                onAddEvent={() => handleAddEventClick('09:00')}
                onEditEvent={handleEditEvent}
                onDeleteEvent={handleDeleteClick}
                onAddAnnouncement={() => setShowAnnouncementModal(true)}
                onEditAnnouncement={handleEditAnnouncement}
                onDeleteAnnouncement={handleDeleteAnnouncement}
                schedules={schedules}
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
          onClose={() => setShowAddEvent(false)}
          onAdd={handleAddEvent}
          hours={HOURS_LIST}
          departments={departments}
        />

        {/* Announcement Modal */}
        <CreateAnnouncementModal
          show={showAnnouncementModal}
          onClose={() => setShowAnnouncementModal(false)}
          onCreate={handleCreateAnnouncement}
          hours={HOURS_LIST}
        />

        {/* Edit Event Modal */}
        <EditEventModal
          show={showEditEvent}
          event={eventToEdit}
          onClose={() => {
            setShowEditEvent(false);
            setEventToEdit(null);
          }}
          // @ts-ignore
          onUpdate={handleUpdateEvent}
          hours={HOURS_LIST}
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
          // @ts-ignore
          onUpdate={handleUpdateAnnouncement}
          hours={HOURS_LIST}
        />

        <ScheduleModal
          show={showScheduleModal}
          onClose={() => setShowScheduleModal(false)}
          onCreate={(data) => createScheduleMutation.mutate(data)}
          hours={HOURS_LIST}
        />

        <EditScheduleModal 
          show={showEditSchedule}
          schedule={scheduleToEdit}
          onClose={() => setShowEditSchedule(false)}
          onUpdate={handleUpdateSchedule}
          hours={HOURS_LIST}
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