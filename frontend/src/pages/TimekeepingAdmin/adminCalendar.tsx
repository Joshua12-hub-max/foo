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
import { eventApi, fetchEmployees, fetchDepartments, announcementApi } from '@api';
import {
  AddEventModal,
  EditEventModal,
  CreateAnnouncementModal,
  EditAnnouncementModal,
} from '@components/Custom/CalendarComponents/admin/Modals';
import { 
  CalendarEvent, 
  Announcement, 
  EventFormData, 
  AnnouncementFormData,
  CalendarItem
} from '@/types/calendar';
import { ApiError } from '@/types';
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

  const { data: announcements = [] } = useQuery<Announcement[]>({
    queryKey: ['announcements'],
    queryFn: async () => {
      const response = await announcementApi.getAnnouncements();
      return response.data?.announcements || [];
    }
  });



  const { data: events = [] } = useQuery<CalendarEvent[]>({
    queryKey: ['events'],
    queryFn: async () => {
      const response = await eventApi.getEvents();
      return response.data?.events?.map((e: CalendarEvent) => ({
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




  const createEventMutation = useMutation({
    mutationFn: async (data: EventFormData) => {
        // Validation check before API call to mimic original logic behavior if needed, 
        // though typically this should be in the submit handler.
        if (!data.title?.trim() || !data.date) {
            throw new Error("Please fill in the Event Title and Date.");
        }
        await eventApi.createEvent(data as unknown as Record<string, unknown>);
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['events'] });
        setModal('addEvent', false);
        showToast("Event created successfully!", "success");
    },
    onError: (error: Error | ApiError) => {
        console.error("Failed to create event:", error);
        const errorMessage = error.message || (error as ApiError).response?.data?.message || "Failed to create event.";
        showToast(errorMessage.includes("fill in") ? errorMessage : `Failed to create event: ${errorMessage}`, "error");
    }
  });

  const updateEventMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string | number, data: EventFormData }) => {
        await eventApi.updateEvent(id, data as unknown as Record<string, unknown>);
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
    mutationFn: async (data: AnnouncementFormData) => {
        if (!data.title || !data.content) {
             throw new Error("Please fill in the Title and Content.");
        }
        await announcementApi.createAnnouncement(data as unknown as Record<string, unknown>);
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['announcements'] });
        setModal('createAnnouncement', false);
        showToast("Announcement created successfully!", "success");
    },
    onError: (error: Error | ApiError) => {
        console.error("Failed to create announcement:", error);
        const errorMessage = error.message || (error as ApiError).response?.data?.message || "Failed to create announcement.";
        showToast(errorMessage.includes("fill in") ? errorMessage : `Error: ${errorMessage}`, "error");
    }
  });

  const updateAnnouncementMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string | number, data: AnnouncementFormData }) => {
        await announcementApi.updateAnnouncement(id, data as unknown as Record<string, unknown>);
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

  const handleAddEvent = useCallback((data: EventFormData) => {
    // RHF provides the data
    createEventMutation.mutate(data);
  }, [createEventMutation]);

  const handleCreateAnnouncement = useCallback((announcementData: AnnouncementFormData) => {
    createAnnouncementMutation.mutate(announcementData);
  }, [createAnnouncementMutation]);

  const handleEditEvent = useCallback((event: CalendarEvent) => {
    setSelectedItem(event, 'event');
    setShowEventDetails(null);
    setModal('editEvent', true);
  }, [setShowEventDetails, setSelectedItem, setModal]);

  const handleUpdateEvent = useCallback((updatedData: EventFormData) => {
    if (!selectedItem) return;
    updateEventMutation.mutate({ id: (selectedItem as CalendarEvent).id, data: updatedData });
  }, [selectedItem, updateEventMutation]);

  const handleEditAnnouncement = useCallback((announcement: Announcement) => {
    setSelectedItem(announcement, 'announcement');
    setModal('editAnnouncement', true);
  }, [setSelectedItem, setModal]);

  const handleUpdateAnnouncement = useCallback((id: string | number, updatedData: AnnouncementFormData) => {
    updateAnnouncementMutation.mutate({ id, data: updatedData });
  }, [updateAnnouncementMutation]);

  const handleDeleteAnnouncement = useCallback((item: Announcement) => {
    setSelectedItem(item, 'announcement');
    setModal('deleteConfirm', true);
  }, [setSelectedItem, setModal]);

  const handleDeleteClick = useCallback((item: CalendarEvent) => {
    setSelectedItem(item, 'event');
    setShowEventDetails(null);
    setModal('deleteConfirm', true);
  }, [setShowEventDetails, setSelectedItem, setModal]);

  const handleConfirmDelete = useCallback(() => {
    if (!selectedItem) return;

    if (selectedType === 'announcement') {
      deleteAnnouncementMutation.mutate((selectedItem as Announcement).id);
    } else {
      deleteEventMutation.mutate((selectedItem as CalendarEvent).id);
    }
  }, [selectedItem, selectedType, deleteAnnouncementMutation, deleteEventMutation]);


  const handleEventDrop = useCallback((event: CalendarEvent, newDate: Date) => {
      const formattedDate = newDate.toISOString().split('T')[0];
      // Optimistic update or just simple mutation
      updateEventMutation.mutate({ id: event.id, data: { ...event, date: formattedDate } as EventFormData });
  }, [updateEventMutation]);

  // Calendar data processing
  const calendarData = useCalendarData({ currentDate, events, showHolidays, holidays, announcements });
  const { month, day, year, dayName, displayedEvents } = calendarData;
  
  const isDeleting = deleteEventMutation.isPending || deleteAnnouncementMutation.isPending;

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
          event={selectedItem as CalendarEvent}
          onClose={() => {
            setModal('editEvent', false);
            setSelectedItem(null, null);
          }}
          onUpdate={handleUpdateEvent}
          hours={HOURS_LIST}
          departments={departments}
        />

        {/* Edit Announcement Modal */}
        <EditAnnouncementModal
          show={modals.editAnnouncement}
          announcement={selectedItem as Announcement}
          onClose={() => {
            setModal('editAnnouncement', false);
            setSelectedItem(null, null);
          }}
          onUpdate={(id, data) => handleUpdateAnnouncement(id, data)}
          hours={HOURS_LIST}
        />



        {/* Confirm Delete Modal */}
        <ConfirmDeleteModal
          show={modals.deleteConfirm}
          title="Confirm Deletion"
          message={`Are you sure you want to delete "${(selectedItem as CalendarItem)?.title || 'this item'}"? This action cannot be undone.`}
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