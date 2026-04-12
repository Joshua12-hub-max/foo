import { useCallback } from 'react';

interface StatCardProps {
  title: string;
  data?: unknown;
  value?: string | number;
  onClick?: (data: { title: string, data: unknown }) => void;
}

export default function StatCard({ title, data, value, onClick }: StatCardProps) {
  const handleClick = useCallback(() => {
    onClick?.({ title, data });
  }, [onClick, title, data]);

  const displayValue = value !== undefined ? value : (Array.isArray(data) ? data.length : 0);

  const cardContent = (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className={`w-2 h-2 rounded-full ${onClick ? 'bg-[var(--zed-text-muted)] group-hover:bg-[var(--zed-text-dark)] transition-colors' : 'bg-[var(--zed-text-muted)]'}`}>
        </div>
        {onClick && (
          <span className="text-[10px] tracking-[0.2em] transition-colors text-[var(--zed-text-muted)] font-medium group-hover:text-[var(--zed-text-dark)]">
            View Details
          </span>
        )}
      </div>
      <p className="text-3xl font-black text-[var(--zed-text-dark)] font-mono tracking-tight">{displayValue}</p>
      <h3 className="text-xs font-bold text-[var(--zed-text-muted)] mt-1.5 tracking-wide">{title}</h3>
    </>
  );

  const className = `p-5 rounded-[var(--radius-sm)] border transition-all duration-200 text-left w-full relative overflow-hidden group bg-white border-[var(--zed-border-light)] ${
    onClick ? 'hover:border-[var(--zed-border-dark)] hover:shadow-[var(--zed-shadow-sm)] cursor-pointer' : 'shadow-sm'
  }`;

  if (onClick) {
    return (
      <button onClick={handleClick} className={className}>
        {cardContent}
      </button>
    );
  }

  return (
    <div className={className}>
      {cardContent}
    </div>
  );
}
