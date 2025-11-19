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

  return (
    <button
      onClick={handleClick}
      className="bg-[#34645c] p-5 rounded-lg border border-[#F8F9FA] shadow-[8px_0_10px_#274b46] hover:shadow-[0_0_10px_#305d56] transition"
    >
      <div className="flex justify-between items-center mb-3">
        <div className={`p-3 rounded-lg ${colorMap[title]}`}>
          <CheckSquare className="w-5 h-5 text-[#F8F9FA]" />
        </div>
        <span className="text-xs text-[#F8F9FA]">View details</span>
      </div>
      <h3 className="text-sm font-medium text-[#F8F9FA]">{title}</h3>
      <p className="text-2xl font-bold text-[#F8F9FA]">{data.length}</p>
    </button>
  );
}
