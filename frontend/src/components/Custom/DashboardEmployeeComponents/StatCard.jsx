import { useMemo } from 'react';

export default function StatCard({ icon, title }) {
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
      className="bg-[#34645c] p-5 rounded-lg border border-[#FFFFFF] shadow-[8px_0_10px_#274b46] hover:shadow-[0_0_10px_#305d56] transition"
    >
      <div className="flex justify-between items-center mb-3">
        <div className={`p-3 rounded-lg ${bgColor}`}>
          {icon && <icon className="w-5 h-5 text-[#F8F9FA]" />}
        </div>
        <span className="text-xs text-[#F8F9FA]">No data</span>
      </div>
      <h3 className="text-sm font-medium text-[#F8F9FA]">{title}</h3>
      <p className="text-2xl font-bold text-[#F8F9FA]">0</p>
    </div>
  );
}