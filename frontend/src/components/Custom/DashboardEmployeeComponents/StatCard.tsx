import { useMemo, useCallback } from 'react';

interface StatCardProps {
  title: string;
  data?: any;
  value?: string | number;
  onClick?: (data: { title: string, data: any }) => void;
}

export default function StatCard({ title, data, value, onClick }: StatCardProps) {
  // Unified gray-based color scheme
  const colorMap: Record<string, string> = useMemo(() => ({
    'Present Days': 'bg-gray-800',
    'Absent Days': 'bg-gray-700',
    'Late Arrivals': 'bg-gray-600',
    'Reports Filed': 'bg-gray-500',
    'Leave Balance': 'bg-gray-900',
  }), []);

  const handleClick = useCallback(() => {
    onClick?.({ title, data });
  }, [onClick, title, data]);

  const Container = onClick ? 'button' : 'div';

  return (
    // @ts-ignore
    <Container
      onClick={onClick ? handleClick : undefined}
      className={`bg-white p-4 rounded-lg border border-gray-200 shadow-sm transition-all duration-200 ${
        onClick ? 'hover:shadow-md hover:border-gray-300 cursor-pointer text-left w-full' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className={`w-8 h-8 ${colorMap[title] || 'bg-gray-700'} rounded-lg flex items-center justify-center`}>
        </div>
        {onClick && (
          <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">View</span>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900">
        {value !== undefined ? value : data?.length || 0}
      </p>
      <h3 className="text-xs font-semibold text-gray-500 mt-1">{title}</h3>
    </Container>
  );
}
