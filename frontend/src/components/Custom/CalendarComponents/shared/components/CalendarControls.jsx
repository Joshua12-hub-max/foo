import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Eye } from 'lucide-react';

/**
 * Calendar Controls Component
 * Navigation controls and view options for the calendar
 */
const CalendarControls = ({ 
  onPrevMonth, 
  onNextMonth, 
  onToday, 
  showHolidays, 
  onToggleHolidays,
  actions,
  currentView = 'month',
  onViewChange,
  allowedViews = ['month', 'week', 'day', 'agenda']
}) => {
  return (
    <div className="p-4 bg-white border-b border-gray-300 flex justify-between items-center gap-4 flex-wrap">
      {/* Navigation Controls - Left Side */}
      <div className="flex items-center gap-2">
        <button
          onClick={onPrevMonth}
          className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-5 h-5 text-gray-700" />
        </button>

        <button
          onClick={onToday}
          className="px-4 py-2 text-sm font-semibold text-gray-800 border border-gray-400 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Today
        </button>

        <button
          onClick={onNextMonth}
          className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="w-5 h-5 text-gray-700" />
        </button>
      </div>

      {/* Right Side - Holidays, View Switcher, Actions */}
      <div className="flex items-center gap-3">
        {/* Holidays Toggle */}
        <button
          onClick={onToggleHolidays}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 ${
            showHolidays 
              ? 'bg-gray-400 text-white' 
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
        >
          <CalendarIcon className="w-4 h-4" />
          Holidays
        </button>

        {/* View Switcher */}
        {onViewChange && (
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            {allowedViews.map(view => (
              <button
                key={view}
                onClick={() => onViewChange(view)}
                className={`px-3 py-1 text-sm font-medium rounded transition-colors capitalize ${
                  currentView === view
                    ? 'bg-white text-gray-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {view}
              </button>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        {actions}
      </div>
    </div>
  );
};

export default CalendarControls;

