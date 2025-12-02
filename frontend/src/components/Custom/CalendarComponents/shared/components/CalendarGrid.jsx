import { DAYS_SHORT, CALENDAR_STYLES, DAYS_FULL } from '../constants/calendarConstants';
import { getDaysInMonth, isToday, createDateForDay } from '../utils/dateUtils';
import { getHolidaysForDay, getEventStyles, filterEventsByDate } from '../utils/calendarItemUtils'; // Updated import
import DroppableCell from './DroppableCell';
import DraggableEvent from './DraggableEvent';

/**
 * Calendar Grid Component
 * Main month view with days and events
 */
const CalendarGrid = ({ currentDate, today, onDateClick, showHolidays, holidays, announcements = [], events = [], schedules = [], displayedEvents = [], onEventDrop }) => {
  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
  const cells = [];

  // Empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    cells.push(<div key={`empty-${i}`} className="aspect-square"></div>);
  }

  // Days of the month
  for (let d = 1; d <= daysInMonth; d++) {
    const currentDayDate = createDateForDay(currentDate, d); 
    
    const isTodayCell = isToday(currentDate, d, today);
    const isSelected = currentDate.getDate() === d;
    
    // Use displayedEvents which already contains combined and processed items (events, holidays, schedules)
    // Filter for this specific day
    const allDayItems = filterEventsByDate(displayedEvents, currentDayDate);

    // Limit display to prevent overflow
    const maxItems = 2; 
    const itemsToShow = allDayItems.slice(0, maxItems);

    cells.push(
      <DroppableCell key={d} date={currentDayDate} onDrop={onEventDrop}>
        <div
          className={`aspect-square border rounded-lg p-2 cursor-pointer hover:bg-gray-50 transition-all flex flex-col overflow-hidden ${
            isTodayCell && isSelected
              ? CALENDAR_STYLES.TODAY_SELECTED
              : isTodayCell
              ? 'bg-gray-100 border-gray-300'
              : isSelected
              ? 'bg-gray-300 border-gray-500'
              : 'border-gray-300'
          }`}
          onClick={() => onDateClick(currentDayDate)}
        >
          <div className={`text-sm font-semibold mb-1 ${
            isTodayCell ? 'text-[#F8F9FA]' : isSelected ? 'text-gray-900' : 'text-gray-700'
          }`}>
            {d}
          </div>
          
          <div className="flex flex-col gap-1 w-full">
            {itemsToShow.map((item, idx) => {
              const styles = getEventStyles(item.type, item.title, item.priority);
              
              if (item.type === 'holiday' || item.isHoliday) {
                return (
                  <div key={`h-${idx}`} className={`text-[10px] px-1 rounded truncate ${styles.badgeBg} ${styles.badgeText}`}>
                    {item.title}
                  </div>
                );
              } else if (item.type === 'announcement' || item.isAnnouncement) { 
                return (
                  <div key={`a-${idx}`} className={`text-[10px] px-1 rounded truncate ${styles.badgeBg} ${styles.badgeText}`}>
                    {item.title}
                  </div>
                );
              } else { // Regular Event
                return (
                  <DraggableEvent key={`e-${item.id}-${idx}`} event={item}>
                    <div 
                      className="text-[10px] px-1 rounded truncate bg-blue-100 text-blue-800 border border-blue-200 cursor-move hover:bg-blue-200 transition-colors"
                      title={item.title}
                    >
                      {item.title}
                    </div>
                  </DraggableEvent>
                );
              }
            })}
            
            {allDayItems.length > maxItems && (
              <div className="text-[9px] text-gray-500 font-medium pl-1">
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
      <div className="grid grid-cols-7 gap-2 mb-2">
        {DAYS_SHORT.map((d, i) => (
          <div key={i} className="text-center text-xs font-semibold text-gray-600">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2">{cells}</div>
    </div>
  );
};

export default CalendarGrid;

