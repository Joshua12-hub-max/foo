import { Calendar, ArrowRight } from 'lucide-react';
import { EventsList } from "../../CustomUI";

interface DashboardEvent {
  id?: string | number;
  title: string;
  date: string;
  type: string;
  priority?: string;
}

interface EventsAndHolidaysProps {
  events?: DashboardEvent[];
}

export default function EventsAndHolidays({ events = [] }: EventsAndHolidaysProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          Events & Holidays
        </h3>
        <button className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors group">
          View Calendar
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
      
      <div className="flex-1 overflow-hidden">
        <EventsList events={events} />
      </div>
    </div>
  );
}
