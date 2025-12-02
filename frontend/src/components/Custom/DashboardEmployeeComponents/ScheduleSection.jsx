import { useState, useEffect } from 'react';
import { CalendarCheck, Clock } from 'lucide-react';
import { scheduleApi } from '../../../api/scheduleApi';

export default function ScheduleSection() {
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="bg-[#F8F9FA] rounded-lg shadow-md border border-gray-200 p-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Today's Schedule</h3>
      
      {loading ? (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#535C91] mx-auto"></div>
        </div>
      ) : schedule ? (
        <div className="text-center">
          <div className="bg-[#535C91] text-white rounded-full p-3 inline-block mb-3">
            <Clock className="w-6 h-6" />
          </div>
          <h4 className="text-lg font-bold text-[#535C91]">{schedule.start_time} - {schedule.end_time}</h4>
          <p className="text-sm mt-1" style={{ color: schedule.is_rest_day ? '#A27B5C' : '#535C91' }}>{schedule.is_rest_day ? 'Rest Day' : 'Regular Shift'}</p>
        </div>
      ) : (
        <div className="text-center">
          <CalendarCheck className="w-8 h-8 text-gray-400 mx-auto mb-3" />
          <p className="text-sm text-gray-600">No schedule found for today</p>
        </div>
      )}
    </div>
  );
}
