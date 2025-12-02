/**
 * Calendar Header Component
 * Displays the current month and year
 */
const CalendarHeader = ({ month, year }) => {
  return (
    <div className="bg-[#274b46] border-b border-[#305d56] px-6 py-4 shadow-sm">
      <h1 className="text-xl-md font-bold text-[#F8F9FA]">
        {month} {year}
      </h1>
    </div>
  );
};

export default CalendarHeader;

