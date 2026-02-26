import { useMemo, useCallback } from 'react';

interface StatCardProps {
  title: string;
  data: string | number | unknown[];
  onClick?: (data: { title: string; data: string | number | unknown[] }) => void;
  isActive?: boolean;
}

export default function StatCard({ title, data, onClick, isActive = false }: StatCardProps) {
  // Unified gray-based color scheme - compact design
  const colorMap: Record<string, string> = useMemo(() => ({
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
      className={`p-4 rounded-lg border shadow-sm transition-all duration-200 text-left w-full
        ${isActive 
          ? 'bg-gray-50 border-gray-400 ring-2 ring-gray-200 shadow-md' 
          : 'bg-white border-gray-200 hover:shadow-md hover:border-gray-300'
        }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className={`w-8 h-8 ${colorMap[title] || 'bg-gray-400'} rounded-lg flex items-center justify-center`}>
        </div>
        <span className={`text-[10px] font-medium uppercase tracking-wide ${isActive ? 'text-gray-600 font-bold' : 'text-gray-400'}`}>
          View
        </span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{displayValue}</p>
      <h3 className="text-xs font-semibold text-gray-500 mt-1">{title}</h3>
    </button>
  );
}
