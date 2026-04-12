import { useMemo, useCallback } from 'react';

interface StatCardProps {
  title: string;
  data: string | number | unknown[];
  onClick?: (data: { title: string; data: string | number | unknown[] }) => void;
  isActive?: boolean;
}

export default function StatCard({ title, data, onClick, isActive = false }: StatCardProps) {
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
      className={`p-5 rounded-[var(--radius-sm)] border transition-all duration-200 text-left w-full relative overflow-hidden group
        ${isActive 
          ? 'bg-[var(--zed-bg-surface)] border-[var(--zed-accent)] shadow-[var(--zed-shadow-sm)]' 
          : 'bg-white border-[var(--zed-border-light)] hover:border-[var(--zed-border-dark)] hover:shadow-[var(--zed-shadow-sm)]'
        }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-[var(--zed-accent)]' : 'bg-[var(--zed-text-muted)] group-hover:bg-[var(--zed-text-dark)] transition-colors'}`}>
        </div>
        <span className={`text-[10px] tracking-[0.2em] transition-colors ${isActive ? 'text-[var(--zed-accent)] font-bold' : 'text-[var(--zed-text-muted)] font-medium group-hover:text-[var(--zed-text-dark)]'}`}>
          View Details
        </span>
      </div>
      <p className="text-3xl font-black text-[var(--zed-text-dark)] font-mono tracking-tight">{displayValue}</p>
      <h3 className="text-xs font-bold text-[var(--zed-text-muted)] mt-1.5 tracking-wide">{title}</h3>
      {isActive && (
          <div className="absolute top-0 left-0 w-full h-1 bg-[var(--zed-accent)]"></div>
      )}
    </button>
  );
}
