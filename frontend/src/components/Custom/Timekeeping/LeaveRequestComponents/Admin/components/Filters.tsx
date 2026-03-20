import { LeaveFilters } from '../types';
import Combobox from '@/components/Custom/Combobox';

interface FiltersProps {
  filters: LeaveFilters;
  departments: string[];
  uniqueEmployees: string[];
  onFilterChange: (field: keyof LeaveFilters, value: string) => void;
  onApply: () => void;
  onClear: () => void;
}

const Filters: React.FC<FiltersProps> = ({ 
  filters, 
  departments, 
  uniqueEmployees, 
  onFilterChange, 
  onApply, 
  onClear 
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6 items-start bg-[#F8F9FA] p-4 rounded-lg shadow-md">
        {/* Department Filter */}
        <div className="md:col-span-1 relative z-[50]">
          <Combobox
            options={[
              { value: '', label: 'Department' },
              ...departments.map((dept) => ({ value: dept, label: dept }))
            ]}
            value={filters.department}
            onChange={(val) => onFilterChange('department', val)}
            placeholder="Department"
            buttonClassName="w-full bg-[#F8F9FA] border border-gray-300 rounded-lg shadow-md px-3 py-2 text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-200 transition-all font-bold h-[38px]"
          />
        </div>

        {/* Employee Filter */}
        <div className="md:col-span-1 relative z-[50]">
          <Combobox
            options={[
              { value: '', label: 'Employee' },
              ...uniqueEmployees.map((emp) => ({ value: emp, label: emp }))
            ]}
            value={filters.employee}
            onChange={(val) => onFilterChange('employee', val)}
            placeholder="Employee"
            buttonClassName="w-full bg-[#F8F9FA] border border-gray-200 rounded-lg shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-200 hover:border-gray-200 transition-all font-bold h-[38px]"
          />
        </div>

        {/* From Date Filter */}
        <div className="md:col-span-1">
          <input
            type="date"
            value={filters.fromDate}
            onChange={(e) => onFilterChange('fromDate', e.target.value)}
            className="w-full px-3 bg-white border border-gray-200 rounded-lg shadow-sm py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-200 hover:border-gray-200 transition-all appearance-none cursor-pointer"
          />
        </div>

        {/* To Date Filter */}
        <div className="md:col-span-1">
          <input
            type="date"
            value={filters.toDate}
            onChange={(e) => onFilterChange('toDate', e.target.value)}
            className="w-full px-3 bg-white border border-gray-200 rounded-lg shadow-sm py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-200 hover:border-gray-200 transition-all appearance-none cursor-pointer"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-2 md:col-span-2">
          <button
            onClick={onApply}
            className="flex-1 flex items-center justify-center gap-2 bg-[#F8F9FA] text-gray-700 font-medium px-4 py-2 rounded-lg text-sm shadow-sm hover:bg-[#F8F9FA] transition-all active:scale-95 border border-gray-200"
          >
            Apply Filter
          </button>
          <button
            onClick={onClear}
            className="flex-1 bg-[#F8F9FA] text-gray-700 font-medium px-4 py-2 rounded-lg text-sm shadow-sm hover:bg-[#F8F9FA] transition-all active:scale-95 border border-gray-200"
          >
             Clear
          </button>
        </div>
    </div>
  );
};

export default Filters;
