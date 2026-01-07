import { useMemo, useCallback } from 'react';

export default function StatCard({ title, data, onClick }) {
  // Unified gray-based color scheme - compact design
  const colorMap = useMemo(() => ({
    Present: 'bg-gray-800',
    Absent: 'bg-gray-700',
    Late: 'bg-gray-600',
    'On-Leave': 'bg-gray-500',
    Hired: 'bg-gray-900',
  }), []);

  const handleClick = useCallback(() => {
    onClick?.({ title, data });
  }, [onClick, title, data]);

  // Handle both array data (with .length) and number/string data
  const displayValue = useMemo(() => {
    if (Array.isArray(data)) return data.length;
    if (typeof data === 'number') return data;
    if (typeof data === 'string') return data;
    return 0;
  }, [data]);

  return (
    <button
      onClick={handleClick}
      className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-200 text-left w-full"
    >
      <div className="flex items-center justify-between mb-2">
        <div className={`w-8 h-8 ${colorMap[title]} rounded-lg flex items-center justify-center`}>
        </div>
        <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">View</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{displayValue}</p>
      <h3 className="text-xs font-semibold text-gray-500 mt-1">{title}</h3>
    </button>
  );
}
