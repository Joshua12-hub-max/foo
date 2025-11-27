import { useMemo, useCallback } from 'react';

export default function StatCard({ icon: Icon, title, value = 0, loading = false, subtext = "View details", onClick }) {
  const colorMap = useMemo(() => ({
    'Present Days': 'bg-[#79B791]',
    'Absent Days': 'bg-[#7A0000]',
    'Late Arrivals': 'bg-[#CF9033]',
    'Reports Filed': 'bg-[#2C497F]',
    'Leave Balance': 'bg-[#778797]',
  }), []);

  const handleClick = useCallback(() => {
    if (onClick) onClick({ title, value });
  }, [onClick, title, value]);

  return (
    <button
      onClick={handleClick}
      className="bg-[#F8F9FA] p-5 rounded-lg border border-gray-200 shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-300 w-full text-left"
    >
      <div className="flex justify-between items-center mb-3">
        <div className={`p-3 rounded-lg ${colorMap[title] || 'bg-gray-500'} shadow-sm`}>
          {Icon && <Icon className="w-5 h-5 text-white" />}
        </div>
        <span className="text-xs text-[#274b46] font-medium opacity-80">{subtext}</span>
      </div>
      <h3 className="text-sm font-bold text-[#274b46] tracking-wide">{title}</h3>
      <p className="text-3xl font-bold text-[#274b46] mt-2">
        {loading ? (
            <span className="animate-pulse">...</span>
        ) : (
            value
        )}
      </p>
    </button>
  );
}
