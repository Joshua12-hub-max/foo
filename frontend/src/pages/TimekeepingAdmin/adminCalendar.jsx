import { useState, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays, Clock, Menu, X, Plus, Calendar as CalendarIcon } from 'lucide-react';

import AddEventModal from '../../components/Modal UI/adminCalendar/addevent';
import ScheduleModal from '../../components/Modal UI/adminCalendar/schedule';

export default function AdminCalendar() {
  // ─────────────────────────────
  // STATE MANAGEMENT
  // ─────────────────────────────
  const today = useMemo(() => new Date(), []);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [events, setEvents] = useState([
    { id: 1, title: 'Team Meeting', time: 7, color: 'bg-gray-200 border-gray-400 text-gray-800', type: 'meeting' },
    { id: 2, title: 'Lunch Break', time: 12, color: 'bg-gray-300 border-gray-500 text-gray-900', type: 'break' },
    { id: 3, title: 'Project Review', time: 14, color: 'bg-gray-200 border-gray-400 text-gray-800', type: 'meeting' },
  ]);

  const [showEventDetails, setShowEventDetails] = useState(null);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  const [newEvent, setNewEvent] = useState({ title: '', time: 9 });
  const [newSchedule, setNewSchedule] = useState({
    title: '', startDate: '', endDate: '', startTime: 9, endTime: 10, description: '', repeat: 'none',});

  // ─────────────────────────────
  // CONSTANTS
  // ─────────────────────────────
  const months = useMemo(
    () => [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ],
    []
  );

  const days = useMemo(() => ['Su', 'M', 'Tu', 'W', 'Th', 'F', 'Sa'], []);

  const hours = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => {
        const hour = i % 12 || 12;
        const period = i < 12 ? 'AM' : 'PM';
        return `${hour}${period}`;
      }),
    []
  );

  const colors = useMemo(
    () => [
      'bg-blue-100 border-blue-300 text-blue-800',
      'bg-green-100 border-green-300 text-green-800',
      'bg-purple-100 border-purple-300 text-purple-800',
      'bg-pink-100 border-pink-300 text-pink-800',
      'bg-yellow-100 border-yellow-300 text-yellow-800',
      'bg-red-100 border-red-300 text-red-800',
    ],
    []
  );

  // ─────────────────────────────
  // HELPERS
  // ─────────────────────────────
  const getDaysInMonth = useCallback((date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    return { daysInMonth, startingDayOfWeek };
  }, []);

  const formatDate = useCallback((date) => {
    const dayNames = ['Su', 'M', 'Tu', 'W', 'Th', 'F', 'Sa'];
    return {
      month: months[date.getMonth()],
      day: date.getDate(),
      year: date.getFullYear(),
      dayName: dayNames[date.getDay()],
    };
  }, [months]);

  // ─────────────────────────────
  // NAVIGATION HANDLERS
  // ─────────────────────────────
  const handlePrevMonth = useCallback(() => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, prev.getDate()));
  }, []);

  const handleNextMonth = useCallback(() => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, prev.getDate()));
  }, []);

  const handleToday = useCallback(() => setCurrentDate(new Date()), []);

  // ─────────────────────────────
  // EVENT HANDLERS
  // ─────────────────────────────
  const handleAddEventClick = useCallback((time) => {
    setNewEvent({ title: '', time });
    setShowAddEvent(true);
  }, []);

  const handleAddEvent = useCallback(() => {
    if (newEvent.title.trim()) {
      setEvents((prev) => [
        ...prev,
        {
          id: Date.now(),
          title: newEvent.title,
          time: parseInt(newEvent.time),
          color: colors[Math.floor(Math.random() * colors.length)],
        },
      ]);
      setNewEvent({ title: '', time: 9 });
      setShowAddEvent(false);
    }
  }, [newEvent, colors]);

  const handleDeleteEvent = useCallback((id) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const handleCreateSchedule = useCallback(() => {
    if (newSchedule.title && newSchedule.startDate && newSchedule.endDate)
    { console.log('Creating schedule:', newSchedule);
      setNewSchedule({ title: '', startDate: '', endDate: '', startTime: 9, endTime: 10, description: '', repeat: 'none', });
      setShowScheduleModal(false);
    }}, [newSchedule]);

  // ─────────────────────────────
  // MEMOIZED DATA
  // ─────────────────────────────
  const { month, day, year, dayName } = useMemo(() => formatDate(currentDate), [currentDate, formatDate]);
  const sortedEvents = useMemo(() => [...events].sort((a, b) => a.time - b.time), [events]);

  // Render mini calendar for sidebar
  const renderCalendarDays = useMemo(() => {
    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
    const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const { daysInMonth: prevMonthDays } = getDaysInMonth(prevMonth);
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const cells = [];

    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDay = prevMonthDays - i;
      cells.push(
        <div
          key={`prev-${i}`}
          className="aspect-square border border-gray-300 rounded flex items-center justify-center text-gray-400 text-xs hover:bg-gray-100 cursor-pointer"
          onClick={() => setCurrentDate(new Date(prevMonth.getFullYear(), prevMonth.getMonth(), prevDay))}
        >
          {prevDay}
        </div>
      );
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const isToday = today.getDate() === d && today.getMonth() === month;
      const isSelected = currentDate.getDate() === d;
      cells.push(
        <div
          key={`curr-${d}`}
          onClick={() => setCurrentDate(new Date(year, month, d))}
          className={`aspect-square border rounded flex items-center justify-center text-xs font-medium cursor-pointer transition-all ${
            isToday
              ? 'bg-[#274b46] text-[#F8F9FA] border-gray-700'
              : isSelected
              ? 'bg-[#274b46] text-gray-900 border-gray-400'
              : 'border-[#274b46] text-gray-700 hover:border-gray-400 hover:bg-gray-100'
          }`}
        >
          {d}
        </div>
      );
    }

    return cells;
  }, [currentDate, today, getDaysInMonth]);

  // ─────────────────────────────
  // RENDER VIEWS
  // ─────────────────────────────
  const renderMonthView = () => {
    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
    const cells = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      cells.push(<div key={`empty-${i}`} className="aspect-square"></div>);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const isToday = today.getDate() === d && today.getMonth() === currentDate.getMonth();
      const isSelected = currentDate.getDate() === d;
      cells.push(
        <div
          key={d}
          className={`aspect-square border rounded-lg p-2 cursor-pointer hover:text-[#F8F9FA] transition-all ${
            isToday && isSelected
              ? 'bg-[#274b46] border-gray-400'
              : isToday
              ? 'bg-gray-100 border-gray-300'
              : isSelected
              ? 'bg-gray-300 border-gray-500'
              : 'border-gray-300'
          }`}
          onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), d))}
        >
          <div className={`text-sm font-semibold ${isToday ? 'text-[#F8F9FA]' : isSelected ? 'text-gray-900' : 'text-gray-700'}`}>{d}</div>
        </div>
      );
    }

    return (
      <div>
        <div className="grid grid-cols-7 gap-2 mb-2">
          {days.map((d, i) => (
            <div key={i} className="text-center text-xs font-semibold text-gray-600">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">{cells}</div>
      </div>
    );
  };

  // ─────────────────────────────
  // RENDER
  // ─────────────────────────────
  return (
    <div className="flex h-screen bg-[#274b46] overflow-hidden">
      {/* MAIN CALENDAR AREA */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-[#274b46] border-b border-[#305d56] px-6 py-4 shadow-sm">
          <h1 className="text-xl-md font-bold text-[#F8F9FA]">
            {month} {year}
          </h1>
        </div>

        {/* Controls */}
        <div className="bg-gray-200 border-b border-gray-300 px-8 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrevMonth}
              className="p-2 border border-gray-400 rounded-lg hover:bg-gray-300 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>
            <button
              onClick={handleToday}
              className="px-4 py-2 text-sm font-semibold text-gray-800 border border-gray-400 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Today
            </button>
            <button
              onClick={handleNextMonth}
              className="p-2 border border-gray-400 rounded-lg hover:bg-gray-300 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-700" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowScheduleModal(true)}
              className="px-4 py-2 text-sm font-semibold text-gray-800 border border-gray-400 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
            >
              <CalendarIcon className="w-4 h-4" />
              Schedule
            </button>

            <button
              onClick={() => handleAddEventClick(9)}
              className="px-4 py-2 text-sm font-semibold text-gray-800 border border-gray-400 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add event
            </button>

            <button
              onClick={() => setIsDrawerOpen(true)}
              className="p-2 border border-gray-400 rounded-lg hover:bg-gray-300 transition-colors"
            >
              <Menu className="w-5 h-5 text-gray-700" />
            </button>
          </div>
        </div>

        {/* Calendar Body */}
        <div className="flex-1 overflow-auto p-8 bg-[#F8F9FA]">
          {renderMonthView()}
        </div>
      </div>

      {/* DRAWER OVERLAY */}
      {isDrawerOpen && (
        <div 
          className="fixed inset-0 z-40 transition-opacity"
          onClick={() => setIsDrawerOpen(false)}
        />
      )}

      {/* RIGHT DRAWER SIDEBAR */}
      <div 
        className={`fixed top-0 right-0 h-full w-80 bg-gray-100 border-l border-gray-300 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full overflow-auto p-6">
          {/* Close Button */}
          <button
            onClick={() => setIsDrawerOpen(false)}
            className="absolute top-4 right-4 p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-700" />
          </button>

          {/* Mini Calendar */}
          <div className="mb-8 mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl-md font-bold text-gray-900">{month} {year}</h2>
              <div className="flex gap-1">
                <button
                  onClick={handlePrevMonth}
                  className="p-1 hover:bg-[#274b46] rounded transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-700" />
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-1 hover:bg-[#274b46] rounded transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-gray-700" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {days.map((d, i) => (
                <div key={i} className="text-center text-xs font-semibold text-gray-600">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">{renderCalendarDays}</div>
          </div>

          {/* Today's Schedule */}
          <div>
            <h2 className="text-xl-md font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#274b46]" />
              Today's Schedule
            </h2>
            {sortedEvents.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No events scheduled</p>
            ) : (
              <div className="space-y-3">
                {sortedEvents.map((event) => (
                  <div
                    key={event.id}
                    className={`p-3 rounded-lg border-l-4 ${event.color} cursor-pointer hover:shadow-md transition-shadow`}
                    onClick={() => setShowEventDetails(event)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-sm">{event.title}</div>
                        <div className="text-xs mt-1 opacity-70">{hours[event.time]}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Event Details Modal */}
      {showEventDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowEventDetails(null)}>
          <div className="bg-[#F8F9FA] rounded-lg shadow-xl p-6 w-96" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-gray-900 mb-4">{showEventDetails.title}</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="w-4 h-4" />
                <span className="text-sm">{hours[showEventDetails.time]}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <CalendarDays className="w-4 h-4" />
                <span className="text-sm">{dayName}, {month} {day}</span>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowEventDetails(null)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

        <AddEventModal
          show={showAddEvent}
          newEvent={newEvent}
          setNewEvent={setNewEvent}
          onClose={() => setShowAddEvent(false)}
          onAdd={handleAddEvent}
          hours={hours}
        />

        <ScheduleModal
          show={showScheduleModal}
          newSchedule={newSchedule}
          setNewSchedule={setNewSchedule}
          onClose={() => setShowScheduleModal(false)}
          onCreate={handleCreateSchedule}
          hours={hours}
        />
    </div>
  );
}
