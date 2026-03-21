import { useState, useEffect } from 'react';
import { eventApi } from '../../../api/eventApi';
import { leaveApi } from '@/api/leaveApi';
import EventsList from '@/components/CustomUI/EventsList';
import { Holiday } from '@/types/leave.types';

interface DashboardEvent {
  id: string | number;
  title: string;
  date: string;
  type: string;
  priority?: string;
  isHoliday?: boolean;
}

export default function EventsAndHolidays() {
  const [events, setEvents] = useState<DashboardEvent[]>([]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        // Fetch Events from API
        const eventResponse = await eventApi.getEvents();
        const apiEvents: DashboardEvent[] = (eventResponse.data && eventResponse.data.events) ? eventResponse.data.events : [];

        // Get current year holidays
        const currentYear = new Date().getFullYear();
        const holidayResponse = await leaveApi.getHolidays(currentYear);
        const holidays = holidayResponse.data?.holidays || [];

        const holidayEvents: DashboardEvent[] = holidays.map((h: Holiday) => ({
            id: `holiday-${h.id}-${currentYear}`,
            title: h.name,
            date: h.date?.split('T')[0] || new Date(currentYear, 0, 1).toISOString().split('T')[0],
            type: h.type,
            priority: 'medium',
            isHoliday: true
        }));

        // Combine API events and holidays
        const combinedEvents = [...apiEvents, ...holidayEvents].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // Filter for upcoming events
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const upcomingEvents = combinedEvents.filter(e => new Date(e.date) >= today);

        setEvents(upcomingEvents.slice(0, 5)); // Show top 5 upcoming
      } catch (error) {
        console.error("Failed to fetch events:", error);
      }
    };

    fetchEvents();
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-all duration-300">
      <EventsList events={events} />
    </div>
  );
}
