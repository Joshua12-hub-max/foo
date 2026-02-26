import React from 'react';
import { DAYS_SHORT } from '../constants/calendarConstants';
import { getDaysInMonth, isToday, createDateForDay } from '../utils/dateUtils';
import { getEventStyles, filterEventsByDate } from '../utils/calendarItemUtils';
import DroppableCell from './DroppableCell';
import DraggableEvent from './DraggableEvent';

export interface GridItem {
  id?: string | number;
  type?: string;
  title: string;
  priority?: string;
  isHoliday?: boolean;
  isAnnouncement?: boolean;
  isSchedule?: boolean;
  date?: string;
  start_date?: string;
  end_date?: string;
  time?: string | number | null;
  notes?: string;
  description?: string | null;
  color?: string;
  month?: number;
  day?: number;
  created_at?: string;
  start_time?: string;
  content?: string;
  endTime?: string;
  recurring_pattern?: string | null;
  department?: string | null;
}

interface CalendarGridProps {
  currentDate: Date;
  today: Date;
  onDateClick: (date: Date) => void;
  showHolidays: boolean;
  holidays: GridItem[];
  announcements?: GridItem[];
  events?: GridItem[];
  schedules?: GridItem[];
  displayedEvents: GridItem[];
  onEventDrop?: (item: GridItem, date: Date) => void;
}

const CalendarGrid: React.FC<CalendarGridProps> = ({ currentDate, today, onDateClick, displayedEvents = [], onEventDrop }) => {
  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
  const cells: React.ReactElement[] = [];

  // Empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    cells.push(<div key={`empty-${i}`} className="aspect-square"></div>);
  }

  // Days of the month
  for (let d = 1; d <= daysInMonth; d++) {
    const currentDayDate = createDateForDay(currentDate, d); 
    
    // @ts-ignore
    const isTodayCell = isToday(currentDate, d, today);
    const isSelected = currentDate.getDate() === d;
    
    // Use displayedEvents which already contains combined and processed items (events, holidays, schedules)
    // Filter for this specific day
    // @ts-ignore
    const allDayItems = filterEventsByDate(displayedEvents, currentDayDate);

    // Limit display to prevent overflow
    const maxItems = 2; 
    const itemsToShow = allDayItems.slice(0, maxItems);

    cells.push(
      // @ts-ignore
      <DroppableCell key={d} date={currentDayDate} onDrop={onEventDrop}>
        <div
          className={`aspect-square border rounded-lg p-2 cursor-pointer hover:bg-gray-50 transition-all flex flex-col overflow-hidden ${
            isTodayCell
              ? 'bg-white border-2 border-gray-400'
              : isSelected
              ? 'bg-gray-100 border-gray-400'
              : 'border-gray-300'
          }`}
          onClick={() => onDateClick(currentDayDate)}
        >
          {/* Day Number - Enhanced Typography */}
          <div className={`text-base font-bold mb-1 ${
            isTodayCell 
              ? 'w-8 h-8 rounded-full bg-gray-400 text-white flex items-center justify-center shadow-md' 
              : isSelected 
                ? 'text-gray-900' 
                : 'text-gray-700'
          }`}>
            {d}
          </div>
          
          <div className="flex flex-col gap-1 w-full">
            {itemsToShow.map((item: GridItem, idx: number) => {
              // @ts-ignore
              const styles = getEventStyles(item.type, item.title, item.priority);
              
              if (item.type === 'holiday' || item.isHoliday) {
                return (
                  <div key={`h-${idx}`} className={`text-[11px] font-medium px-2 py-0.5 rounded-md truncate ${styles.badgeBg} ${styles.badgeText} shadow-sm`}>
                    {item.title}
                  </div>
                );
              } else if (item.type === 'announcement' || item.isAnnouncement) { 
                return (
                  <div key={`a-${idx}`} className={`text-[11px] font-medium px-2 py-0.5 rounded-md truncate ${styles.badgeBg} ${styles.badgeText} shadow-sm`}>
                    {item.title}
                  </div>
                );
              } else if (item.type === 'schedule' || item.isSchedule) {
                return (
                  <div key={`s-${idx}`} className={`text-[11px] font-medium px-2 py-0.5 rounded-md truncate ${styles.badgeBg} ${styles.badgeText} shadow-sm`}>
                    {item.title}
                  </div>
                );
              } else { // Regular Event - Uses DARK_NAVY from palette
                return (
                  // @ts-ignore
                  <DraggableEvent key={`e-${item.id}-${idx}`} event={item}>
                    <div 
                      className={`text-[11px] font-medium px-2 py-0.5 rounded-md truncate ${styles.badgeBg} ${styles.badgeText} cursor-move hover:opacity-80 transition-all shadow-sm`}
                      title={item.title}
                    >
                      {item.title}
                    </div>
                  </DraggableEvent>
                );
              }
            })}
            
            {allDayItems.length > maxItems && (
              <div className="text-[10px] text-gray-500 font-semibold pl-1 italic">
                +{allDayItems.length - maxItems} more
              </div>
            )}
          </div>
        </div>
      </DroppableCell>
    );
  }

  return (
    <div>
      {/* Day Headers - Enhanced Typography */}
      <div className="grid grid-cols-7 gap-2 mb-3">
        {DAYS_SHORT.map((d, i) => (
          <div 
            key={i} 
            className="text-center py-2 text-sm font-bold text-gray-700 bg-gray-100 rounded-lg tracking-wide uppercase"
          >
            {d}
          </div>
        ))}
      </div>
      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">{cells}</div>
    </div>
  );
};

export default CalendarGrid;
