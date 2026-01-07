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
    <div className="flex justify-between items-center bg-white border border-gray-200 rounded-lg p-3 mb-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gray-100 rounded-lg">
           <TrendingUp className="w-4 h-4 text-gray-700" />
        </div>
        <div>
          <h2 className="text-base font-bold text-gray-900">
            Welcome, {userName || 'Employee'}
          </h2>
          <p className="text-xs text-gray-500">{formattedDate}</p>
        </div>
      </div>

      <div className="bg-gray-900 text-center rounded-lg px-3 py-2 min-w-[50px]">
        <div className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">
          {date.toLocaleString("en-US", { month: "short" })}
        </div>
        <div className="text-xl font-bold text-white leading-none">
          {date.getDate()}
        </div>
      </div>
    </div>
  );
}
