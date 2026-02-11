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
import {
  useCalendarStore,
  useToastStore
} from '@/stores';
import { holidays } from '@utils';

export default function AdminCalendar() {
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);

  // Zustand Calendar State
  const { 
    modals, 
    setModal, 
    selectedItem, 
    selectedType, 
    setSelectedItem, 
    currentView, 
    setCurrentView,
    closeAllModals 
  } = useCalendarStore();

  // Calendar primitive state management (for current date/drawer)
  const calendarState = useCalendarState();
  const { today, currentDate, setCurrentDate, isDrawerOpen, setIsDrawerOpen, showHolidays, setShowHolidays, showEventDetails, setShowEventDetails } = calendarState;

  // Constants
  const HOURS_LIST = Object.values(HOURS_12);

  // Navigation handlers
  const navigation = useCalendarNav({ setCurrentDate });



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
        console.log('[createScheduleMutation] Raw data received:', data);
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
        console.log('[createScheduleMutation] Payload to send:', payload);
        const response = await scheduleApi.createSchedule(payload);
        console.log('[createScheduleMutation] Response:', response);
        return response;
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['schedules'] });
        setModal('schedule', false);
        showToast("Schedule created successfully!", "success");
    },
    onError: (error: any) => {
        console.error("Failed to create schedule:", error);
        const errorMsg = error?.response?.data?.message || "Failed to create schedule.";
        showToast(errorMsg, "error");
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
        setModal('editSchedule', false);
        setSelectedItem(null, null);
        showToast("Schedule updated successfully!", "success");
    },
    onError: (error) => {
        console.error("Failed to update schedule:", error);
        showToast("Failed to update schedule.", "error");
    }
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: async (id: string | number) => {
        await scheduleApi.deleteSchedule(id);
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['schedules'] });
        setModal('deleteConfirm', false);
        setSelectedItem(null, null);
        showToast("Schedule deleted successfully!", "success");
    },
    onError: (error) => {
        console.error("Failed to delete schedule:", error);
        showToast("Failed to delete schedule.", "error");
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
        setModal('addEvent', false);
        showToast("Event created successfully!", "success");
    },
    onError: (error: any) => {
        console.error("Failed to create event:", error);
        const errorMessage = error.message || error.response?.data?.error || "Failed to create event.";
        showToast(errorMessage.includes("fill in") ? errorMessage : `Failed to create event: ${errorMessage}`, "error");
    }
  });

  const updateEventMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string | number, data: any }) => {
        await eventApi.updateEvent(id, data);
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['events'] });
        setModal('editEvent', false);
        setSelectedItem(null, null);
        showToast("Event updated successfully!", "success");
    },
    onError: (error) => {
        console.error("Failed to update event:", error);
        showToast("Failed to update event. Please try again.", "error");
    }
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (id: string | number) => {
        await eventApi.deleteEvent(id);
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['events'] });
        setModal('deleteConfirm', false);
        setSelectedItem(null, null);
        showToast("Deleted successfully!", "success");
    },
    onError: (error) => {
        console.error("Failed to delete event:", error);
        showToast("Failed to delete. Please try again.", "error");
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
        setModal('createAnnouncement', false);
        showToast("Announcement created successfully!", "success");
    },
    onError: (error: any) => {
        console.error("Failed to create announcement:", error);
        const errorMessage = error.message || error.response?.data?.message || "Failed to create announcement.";
        showToast(errorMessage.includes("fill in") ? errorMessage : `Error: ${errorMessage}`, "error");
    }
  });

  const updateAnnouncementMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string | number, data: any }) => {
        await announcementApi.updateAnnouncement(id, data);
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['announcements'] });
        setModal('editAnnouncement', false);
        setSelectedItem(null, null);
        showToast('Announcement updated successfully!', 'success');
    },
    onError: (error) => {
        console.error('Failed to update announcement:', error);
        showToast('Failed to update announcement. Please try again.', 'error');
    }
  });

  const deleteAnnouncementMutation = useMutation({
    mutationFn: async (id: string | number) => {
        await announcementApi.deleteAnnouncement(id);
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['announcements'] });
        setModal('deleteConfirm', false);
        setSelectedItem(null, null);
        showToast("Deleted successfully!", "success");
    },
    onError: (error) => {
        console.error("Failed to delete announcement:", error);
        showToast("Failed to delete. Please try again.", "error");
    }
  });


  // --- HANDLERS ---

  const handleAddEventClick = useCallback((time = '09:00') => {
    setModal('addEvent', true);
  }, [setModal]);

  const handleAddEvent = useCallback((data: any) => {
    // RHF provides the data
    createEventMutation.mutate(data);
  }, [createEventMutation]);

  const handleCreateAnnouncement = useCallback((announcementData: any) => {
    createAnnouncementMutation.mutate(announcementData);
  }, [createAnnouncementMutation]);

  const handleEditEvent = useCallback((event: any) => {
    setSelectedItem(event, 'event');
    setShowEventDetails(null);
    setModal('editEvent', true);
  }, [setShowEventDetails, setSelectedItem, setModal]);

  const handleUpdateEvent = useCallback((updatedData: any) => {
    if (!selectedItem) return;
    updateEventMutation.mutate({ id: selectedItem.id, data: updatedData });
  }, [selectedItem, updateEventMutation]);

  const handleEditAnnouncement = useCallback((announcement: any) => {
    setSelectedItem(announcement, 'announcement');
    setModal('editAnnouncement', true);
  }, [setSelectedItem, setModal]);

  const handleUpdateAnnouncement = useCallback((id: string | number, updatedData: any) => {
    updateAnnouncementMutation.mutate({ id, data: updatedData });
  }, [updateAnnouncementMutation]);

  const handleDeleteAnnouncement = useCallback((item: any) => {
    setSelectedItem(item, 'announcement');
    setModal('deleteConfirm', true);
  }, [setSelectedItem, setModal]);

  const handleDeleteClick = useCallback((item: any) => {
    setSelectedItem(item, 'event');
    setShowEventDetails(null);
    setModal('deleteConfirm', true);
  }, [setShowEventDetails, setSelectedItem, setModal]);

  const handleConfirmDelete = useCallback(() => {
    if (!selectedItem) return;

    if (selectedType === 'announcement') {
      deleteAnnouncementMutation.mutate(selectedItem.id);
    } else if (selectedType === 'schedule') {
      deleteScheduleMutation.mutate(selectedItem.id);
    } else {
      deleteEventMutation.mutate(selectedItem.id);
    }
  }, [selectedItem, selectedType, deleteAnnouncementMutation, deleteEventMutation, deleteScheduleMutation]);

  const handleEditSchedule = useCallback((schedule: any) => {
    setSelectedItem(schedule, 'schedule');
    setModal('editSchedule', true);
  }, [setSelectedItem, setModal]);

  const handleUpdateSchedule = useCallback((id: string | number, updatedData: any) => {
    updateScheduleMutation.mutate({ id, data: updatedData });
  }, [updateScheduleMutation]);

  const handleDeleteSchedule = useCallback((item: any) => {
    setSelectedItem(item, 'schedule');
    setModal('deleteConfirm', true);
  }, [setSelectedItem, setModal]);


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
                    onAnnouncement: () => setModal('createAnnouncement', true),
                    onAddSchedule: () => setModal('schedule', true),
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
                onAddAnnouncement={() => setModal('createAnnouncement', true)}
                onEditAnnouncement={handleEditAnnouncement}
                onDeleteAnnouncement={handleDeleteAnnouncement}
                schedules={schedules}
                onAddSchedule={() => setModal('schedule', true)}
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
          show={modals.addEvent}
          onClose={() => setModal('addEvent', false)}
          onAdd={handleAddEvent}
          hours={HOURS_LIST}
          departments={departments}
        />

        {/* Announcement Modal */}
        <CreateAnnouncementModal
          show={modals.createAnnouncement}
          onClose={() => setModal('createAnnouncement', false)}
          onCreate={handleCreateAnnouncement}
          hours={HOURS_LIST}
        />

        {/* Edit Event Modal */}
        <EditEventModal
          show={modals.editEvent}
          event={selectedItem}
          onClose={() => {
            setModal('editEvent', false);
            setSelectedItem(null, null);
          }}
          // @ts-ignore
          onUpdate={handleUpdateEvent}
          hours={HOURS_LIST}
          departments={departments}
        />

        {/* Edit Announcement Modal */}
        <EditAnnouncementModal
          show={modals.editAnnouncement}
          announcement={selectedItem}
          onClose={() => {
            setModal('editAnnouncement', false);
            setSelectedItem(null, null);
          }}
          // @ts-ignore
          onUpdate={handleUpdateAnnouncement}
          hours={HOURS_LIST}
        />

        <ScheduleModal
          show={modals.schedule}
          onClose={() => setModal('schedule', false)}
          onCreate={(data) => createScheduleMutation.mutate(data)}
          hours={HOURS_LIST}
        />

        <EditScheduleModal 
          show={modals.editSchedule}
          schedule={selectedItem}
          onClose={() => setModal('editSchedule', false)}
          onUpdate={handleUpdateSchedule}
          hours={HOURS_LIST}
        />

        {/* Confirm Delete Modal */}
        <ConfirmDeleteModal
          show={modals.deleteConfirm}
          title="Confirm Deletion"
          message={`Are you sure you want to delete "${selectedItem?.title || 'this item'}"? This action cannot be undone.`}
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            setModal('deleteConfirm', false);
            setSelectedItem(null, null);
          }}
          isDeleting={isDeleting}
        />
      </div>
    </DndProvider>
  );
}