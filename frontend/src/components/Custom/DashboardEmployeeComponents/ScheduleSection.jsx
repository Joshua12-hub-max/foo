import { useState, useEffect } from 'react';
import { CalendarCheck, Clock } from 'lucide-react';
import { scheduleApi } from '../../../api/scheduleApi';

export default function ScheduleSection() {
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const today = new Date();
  const monthShort = today.toLocaleString('default', { month: 'short' }).toUpperCase();
  const dayNumber = today.getDate();

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const response = await scheduleApi.getMySchedule();
        const schedules = response.data.schedule || [];
        
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const todayName = days[new Date().getDay()];

        const todaySchedule = schedules.find(s => s.days && s.days.includes(todayName));
        setSchedule(todaySchedule);
      } catch (error) {
        console.error("❌ [Dashboard Widget] Failed to fetch schedule:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, []);

  // Format time from HH:MM:SS to readable format
  const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  // Calculate duration between start and end time
  const calculateDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return '';
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    
    let totalMinutes = (endH * 60 + endM) - (startH * 60 + startM);
    if (totalMinutes < 0) totalMinutes += 24 * 60; // Handle overnight shifts
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (minutes === 0) return `${hours} hours`;
    return `${hours}h ${minutes}m`;
  };

  // Format date to readable format like "Dec 5"
  const formatDate = (dateStr) => {
    if (!dateStr || dateStr === 'Recurring') return dateStr;
    try {
      const date = new Date(dateStr);
      const month = date.toLocaleString('default', { month: 'short' });
      const day = date.getDate();
      return `${month} ${day}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-[#F8F9FA] rounded-lg shadow-md border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
        <CalendarCheck className="w-4 h-4 text-[#535C91]" />
        Today's Schedule
      </h3>
      
      {loading ? (
        <div className="text-center py-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#535C91] mx-auto"></div>
        </div>
      ) : schedule ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-3 flex items-center gap-3">
          {/* Date Box */}
          <div className="bg-gray-50 rounded-lg px-2.5 py-1.5 text-center min-w-[45px] border border-gray-200">
            <span className="text-[10px] font-medium text-[#535C91] block">{monthShort}</span>
            <span className="text-xl font-bold text-gray-800">{dayNumber}</span>
          </div>
          
          {/* Schedule Details */}
          <div className="flex-1 min-w-0">
            <span className={`text-[10px] font-semibold uppercase tracking-wide ${schedule.is_rest_day ? 'text-amber-600' : 'text-[#2a6b5d]'}`}>
              {schedule.is_rest_day ? 'REST DAY' : 'WORK SCHEDULE'}
            </span>
            <h4 className="text-sm font-bold text-gray-800 truncate">
              {schedule.schedule_title || schedule.scheduleName || 'Regular Shift'}
            </h4>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              <span>{formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}</span>
              <span className="text-gray-300 mx-1">|</span>
              <span className="text-[#535C91] font-medium">{calculateDuration(schedule.start_time, schedule.end_time)}</span>
            </div>
            {(schedule.start_date || schedule.startDate) && (
              <div className="text-[10px] text-gray-400 mt-0.5">
                {formatDate(schedule.start_date || schedule.startDate)} to {formatDate(schedule.end_date || schedule.endDate) || 'Ongoing'}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-3 flex items-center gap-3">
          <div className="bg-gray-50 rounded-lg px-2.5 py-1.5 text-center min-w-[45px] border border-gray-200">
            <span className="text-[10px] font-medium text-[#535C91] block">{monthShort}</span>
            <span className="text-xl font-bold text-gray-800">{dayNumber}</span>
          </div>
          <div className="flex-1">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">NO SCHEDULE</span>
            <h4 className="text-sm font-medium text-gray-500">No schedule assigned</h4>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Clock className="w-3 h-3" />
              <span>--:-- - --:--</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


