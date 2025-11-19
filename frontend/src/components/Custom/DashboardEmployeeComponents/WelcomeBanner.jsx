import { useMemo } from 'react';
import { TrendingUp } from 'lucide-react';

export default function WelcomeBanner({ userName }) {
  const date = useMemo(() => new Date(), []);
  const formattedDate = useMemo(() => date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }), [date]);

  return (
    <div className="bg-[#274b46] text-[#F8F9FA] rounded-lg p-4 shadow-md flex justify-between items-center mb-6">
      <div className="flex items-center gap-3">
        <TrendingUp className="w-6 h-6 text-[#F8F9FA]" />
        <div>
          <h2 className="text-lg font-semibold">
            Welcome, {userName || 'Employee'}
          </h2>
          <p className="text-xs text-[#F8F9FA]">{formattedDate}</p>
        </div>
      </div>

      <div className="bg-white text-center rounded-md p-2 min-w-[65px] shadow">
        <div className="text-[10px] font-semibold text-[#274b46] uppercase">
          {date.toLocaleString("en-US", { month: "short" })}
        </div>
        <div className="text-2xl font-bold text-[#274b46] leading-none">
          {date.getDate()}
        </div>
        <div className="text-[10px] text-[#274b46]">{date.getFullYear()}</div>
      </div>
    </div>
  );
}
