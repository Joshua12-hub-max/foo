import { Calendar } from 'lucide-react';

export default function EventsAndHolidays() {
  return (
    <div className="bg-[#F8F9FA] rounded-lg shadow-md border border-[#34645c] min-h-[600px] flex flex-col p-4">
      
      {/* Header */}
      <div className="bg-[#274b46] rounded-lg px-6 py-3 flex items-center justify-between shadow-md mb-4">
        <h3 className="text-sm font-semibold text-[#F8F9FA] flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#F8F9FA]" />
          Events & Holidays
        </h3>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <Calendar className="w-8 h-8 text-[#34645c] mx-auto mb-3" />
          <p className="text-sm text-[#34645c]">No upcoming events</p>
        </div>
      </div>
    </div>
  );
}
