import React from 'react';
import { Calendar as CalendarIcon, ChevronRight } from 'lucide-react';
import { CalendarEvent } from '@/types/calendar';
import { useNavigate } from 'react-router-dom';

interface EventListCardProps {
  events: CalendarEvent[];
  isLoading?: boolean;
}

export default function EventListCard({ events, isLoading }: EventListCardProps) {
  const navigate = useNavigate();
  
  // Get upcoming events (sorted by date)
  const upcomingEvents = [...events]
    .filter(e => new Date(e.start_date || e.date) >= new Date(new Date().setHours(0, 0, 0, 0)))
    .sort((a, b) => new Date(a.start_date || a.date).getTime() - new Date(b.start_date || b.date).getTime())
    .slice(0, 3);

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center">
          <CalendarIcon className="w-4 h-4 text-white" />
        </div>
        <button 
          onClick={() => navigate('/employee-dashboard/calendar')}
          className="text-[10px] text-gray-400 font-medium uppercase tracking-wide flex items-center hover:text-gray-600 transition-colors"
        >
          View Calendar <ChevronRight className="w-3 h-3 ml-1" />
        </button>
      </div>

      <h3 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-tight">Upcoming Events</h3>
      
      {isLoading ? (
        <div className="space-y-2 animate-pulse">
          <div className="h-4 bg-gray-100 rounded w-3/4"></div>
          <div className="h-4 bg-gray-100 rounded w-1/2"></div>
        </div>
      ) : upcomingEvents.length > 0 ? (
        <div className="space-y-2 flex-1">
          {upcomingEvents.map((event) => (
            <div key={event.id} className="group cursor-pointer" onClick={() => navigate('/employee-dashboard/calendar')}>
              <p className="text-[11px] font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                {event.title}
              </p>
              <p className="text-[10px] text-gray-500">
                {new Date(event.start_date || event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[10px] text-gray-400 italic">No upcoming events</p>
        </div>
      )}
    </div>
  );
}
