export default function MonthView({ currentDate, today,events, getDaysInMonth,setCurrentDate}) 
  {
    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const cells = [];

    const prevMonthLastDay = new Date(year, month, 0).getDate();

    // Fill previous month
    for (let i = 0; i < startingDayOfWeek; i++) {
      const dayNum = prevMonthLastDay - (startingDayOfWeek - 1 - i);
      cells.push(
        <div
          key={`prev-${i}`}
          className="border border-gray-200 bg-gray-50 text-gray-400 rounded-lg p-3 min-h-28"
        >
          {dayNum}
        </div>
      );
    }

    // Current month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isToday = date.toDateString() === today.toDateString();
      const isSelected = date.toDateString() === currentDate.toDateString();

      const dayEvents = events.slice(0, 3);

      cells.push(
        <div
          key={day}
          onClick={() => setCurrentDate(date)}
          className={`border rounded-lg p-3 min-h-28 cursor-pointer hover:shadow transition-all ${
            isToday
              ? "border-indigo-600 bg-indigo-50"
              : isSelected
              ? "border-blue-400 bg-blue-50"
              : "border-gray-300 bg-white"
          }`}
        >
          <div
            className={`text-sm font-bold mb-2 ${
              isToday ? "text-indigo-600" : "text-gray-800"
            }`}
          >
            {day}
          </div>

          <div className="space-y-1">
            {dayEvents.map(ev => (
              <div
                key={ev.id}
                className={`${ev.color} border rounded px-2 py-0.5 text-xs font-semibold truncate`}
              >
                {ev.title}
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Fill next month until 42 cells
    const totalCells = cells.length;
    const nextMonthDaysNeeded = 42 - totalCells;

    for (let i = 1; i <= nextMonthDaysNeeded; i++) {
      cells.push(
        <div
          key={`next-${i}`}
          className="border border-gray-200 bg-gray-50 text-gray-400 rounded-lg p-3 min-h-28"
        >
          {i}
        </div>
      );
    }

    return (
      <div className="h-full">
        <div className="grid grid-cols-7 gap-3 mb-3">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => (
            <div
              key={d}
              className="text-center text-sm font-bold text-gray-600"
            >
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-3">{cells}</div>
      </div>
   );
}
