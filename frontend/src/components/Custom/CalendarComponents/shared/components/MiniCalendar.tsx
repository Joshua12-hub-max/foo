import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DAYS_SHORT, CALENDAR_STYLES } from '../constants/calendarConstants';
import { getDaysInMonth, getPreviousMonth, isToday } from '../utils/dateUtils';
import { getHolidaysForDay } from '../utils/eventUtils';
import type { Holiday } from '@/types/calendar';

interface MiniCalendarProps {
  currentDate: Date;
  today: Date;
  month: string;
  year: number | string;
  onDateClick: (date: Date) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  showHolidays: boolean;
  holidays: Holiday[];
}

const MiniCalendar: React.FC<MiniCalendarProps> = ({ currentDate, today, month, year, onDateClick, onPrevMonth, onNextMonth, showHolidays, holidays }) => {
  const calendarDays = useMemo(() => {
    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
    const prevMonth = getPreviousMonth(currentDate);
    const { daysInMonth: prevMonthDays } = getDaysInMonth(prevMonth);
    const cells: React.ReactElement[] = [];

    // Previous month days
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDay = prevMonthDays - i;
      cells.push(
        <div
          key={`prev-${i}`}
          className="aspect-square border border-gray-300 rounded flex items-center justify-center text-gray-400 text-xs hover:bg-gray-100 cursor-pointer"
          onClick={() => onDateClick(new Date(prevMonth.getFullYear(), prevMonth.getMonth(), prevDay))}
        >
          {prevDay}
        </div>
      );
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      // @ts-ignore
      const isTodayCell = isToday(currentDate, d, today);
      const isSelected = currentDate.getDate() === d;
      
      const dayHolidays = showHolidays 
        // @ts-ignore
        ? getHolidaysForDay(holidays, currentDate.getMonth(), d) 
        : [];
      const hasHoliday = dayHolidays.length > 0;

      cells.push(
        <div
          key={`curr-${d}`}
          onClick={() => onDateClick(new Date(currentDate.getFullYear(), currentDate.getMonth(), d))}
          className={`aspect-square border rounded flex flex-col items-center justify-center text-xs font-medium cursor-pointer transition-all relative ${
            isTodayCell
              // @ts-ignore
              ? CALENDAR_STYLES.TODAY
              : isSelected
              // @ts-ignore
              ? CALENDAR_STYLES.SELECTED
              // @ts-ignore
              : CALENDAR_STYLES.DEFAULT
          }`}
        >
          {d}
          {hasHoliday && (
            <div className="w-1 h-1 rounded-full bg-red-500 mt-0.5"></div>
          )}
        </div>
      );
    }

    return cells;
  }, [currentDate, today, onDateClick, showHolidays, holidays]);

  return (
    <div className="mb-8 mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl-md font-bold text-gray-900">{month} {year}</h2>
        <div className="flex gap-1">
          <button
            onClick={onPrevMonth}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4 text-gray-700" />
          </button>
          <button
            onClick={onNextMonth}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4 text-gray-700" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAYS_SHORT.map((d, i) => (
          <div key={i} className="text-center text-xs font-semibold text-gray-600">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">{calendarDays}</div>
    </div>
  );
};

export default MiniCalendar;
