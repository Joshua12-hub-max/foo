import { useMemo } from 'react';

export default function StatCard({ icon: Icon, title, value = 0, loading = false, subtext = "View details" }) {
  const bgColor = useMemo(() => {
    switch (title) {
      case 'Present Days':
        return 'bg-green-700';
      case 'Absent Days':
        return 'bg-red-700';
      case 'Late Arrivals':
        return 'bg-yellow-600';
      case 'Reports Filed':
        return 'bg-orange-600';
      default:
        return 'bg-blue-700';
    }
  }, [title]);

  return (
    <div
      className="bg-[#34645c] p-5 rounded-lg border border-[#FFFFFF] shadow-[8px_0_10px_#274b46] hover:shadow-[0_0_15px_#4a8f83] hover:scale-105 transition-all duration-300 cursor-pointer group"
    >
      <div className="flex justify-between items-center mb-3">
        <div className={`p-3 rounded-lg ${bgColor} group-hover:brightness-110 transition-all`}>
          {Icon && <Icon className="w-5 h-5 text-[#F8F9FA]" />}
        </div>
        <span className="text-xs text-[#F8F9FA] opacity-75 group-hover:opacity-100 transition-opacity">
            {subtext}
        </span>
      </div>
      <h3 className="text-sm font-medium text-[#F8F9FA] opacity-90">{title}</h3>
      <p className="text-2xl font-bold text-[#F8F9FA] mt-1">
        {loading ? (
            <span className="animate-pulse">...</span>
        ) : (
            value
        )}
      </p>
    </div>
  );
}