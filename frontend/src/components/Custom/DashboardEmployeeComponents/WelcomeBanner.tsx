import { useMemo } from 'react';
import { TrendingUp } from 'lucide-react';

interface WelcomeBannerProps {
  userName?: string;
}

export default function WelcomeBanner({ userName }: WelcomeBannerProps) {
  const date = useMemo(() => new Date(), []);
  const formattedDate = useMemo(() => date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }), [date]);

  return (
    <div className="flex justify-between items-center bg-[var(--zed-bg-surface)] border border-[var(--zed-border-light)] rounded-[var(--radius-sm)] p-4 mb-6 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="p-2.5 bg-white border border-[var(--zed-border-light)] rounded-[var(--radius-sm)] shadow-sm">
           <TrendingUp className="w-5 h-5 text-[var(--zed-accent)]" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[var(--zed-text-dark)] tracking-tight">
            Welcome, {userName || 'Employee'}
          </h2>
          <p className="text-xs font-medium text-[var(--zed-text-muted)] tracking-wide">{formattedDate}</p>
        </div>
      </div>

      <div className="bg-[var(--zed-primary)] border border-[var(--zed-primary-hover)] text-center rounded-[var(--radius-lg)] px-4 py-2 min-w-[60px] shadow-lg">
        <div className="text-[10px] font-bold text-blue-100 tracking-widest mb-0.5">
          {date.toLocaleString("en-US", { month: "short" })}
        </div>
        <div className="text-2xl font-black text-white leading-none font-mono">
          {date.getDate()}
        </div>
      </div>
    </div>
  );
}
