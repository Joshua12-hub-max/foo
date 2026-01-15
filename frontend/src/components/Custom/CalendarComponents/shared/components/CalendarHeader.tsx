import React from 'react';

interface CalendarHeaderProps {
  month: string;
  year: number | string;
}

/**
 * Calendar Header Component
 * Displays the current month and year
 */
const CalendarHeader: React.FC<CalendarHeaderProps> = ({ month, year }) => {
  return (
    <div className="bg-gray-200 shadow-md px-6 py-4">
      <h1 className="text-xl font-bold text-gray-700">
        {month} {year}
      </h1>
    </div>
  );
};

export default CalendarHeader;
