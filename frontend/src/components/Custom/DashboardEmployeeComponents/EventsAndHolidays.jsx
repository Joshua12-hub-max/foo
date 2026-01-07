import { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { eventApi } from '../../../api/eventApi';
import { holidays } from '../../../utils/holidays';
import EventsList from '../../CustomUI/EventsList';

export default function EventsAndHolidays() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        // Fetch Events from API
        const eventResponse = await eventApi.getEvents();
        const apiEvents = (eventResponse.data && eventResponse.data.events) ? eventResponse.data.events : [];

        // Get current year holidays
        const currentYear = new Date().getFullYear();
        const holidayEvents = holidays.map(h => ({
            id: `holiday-${h.id}-${currentYear}`,
            title: h.title,
            date: new Date(currentYear, h.month, h.day).toISOString().split('T')[0],
            type: h.type,
            priority: 'medium',
            isHoliday: true
        }));

        // Combine API events and holidays
        const combinedEvents = [...apiEvents, ...holidayEvents].sort((a, b) => new Date(a.date) - new Date(b.date));

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
