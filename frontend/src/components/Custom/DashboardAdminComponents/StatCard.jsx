import { useMemo, useCallback } from 'react';
import { CheckSquare } from 'lucide-react';

export default function StatCard({ title, data, onClick }) {
  const colorMap = useMemo(() => ({
    Present: 'bg-[#79B791]',
    Absent: 'bg-[#7A0000]',
    Late: 'bg-[#CF9033]',
    'On-Leave': 'bg-[#2C497F]',
    Hired: 'bg-[#778797]',
  }), []);

  const handleClick = useCallback(() => {
    onClick({ title, data });
  }, [onClick, title, data]);

  // Handle both array data (with .length) and number/string data
  const displayValue = useMemo(() => {
    if (Array.isArray(data)) {
      return data.length;
    }
    if (typeof data === 'number') {
      return data;
    }
    if (typeof data === 'string') {
      return data;
    }
    return 0;
  }, [data]);

  return (
    <button
      onClick={handleClick}
      className="bg-[#F8F9FA] p-5 rounded-lg border border-gray-200 shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
    >
      <div className="flex justify-between items-center mb-3">
        <div className={`p-3 rounded-lg ${colorMap[title]} shadow-sm`}>
          <CheckSquare className="w-5 h-5 text-white" />
        </div>
        <span className="text-xs text-[#274b46] font-medium opacity-80">View details</span>
      </div>
      <h3 className="text-sm font-bold text-[#274b46] tracking-wide">{title}</h3>
      <p className="text-3xl font-bold text-[#274b46] mt-2">{displayValue}</p>
    </button>
  );
}
