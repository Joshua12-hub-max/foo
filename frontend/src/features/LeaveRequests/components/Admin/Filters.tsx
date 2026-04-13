import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { leaveFiltersSchema, LeaveFiltersInput } from '@/schemas/leave';
import { useLeaveStore } from '@/stores/leaveStore';
import Combobox from '@/components/Custom/Combobox';

interface FiltersProps {
  departments: string[];
  uniqueEmployees: { id: string; name: string }[];
  isLoading?: boolean;
}

const Filters: React.FC<FiltersProps> = ({ 
  departments = [], 
  uniqueEmployees = [],
  isLoading = false 
}) => {
  const { filters, setFilters, resetFilters } = useLeaveStore();

  const { handleSubmit, reset, control } = useForm<LeaveFiltersInput>({
    resolver: zodResolver(leaveFiltersSchema),
    defaultValues: filters,
  });

  // Sync form with store only when INITIALIZING 
  useEffect(() => {
    reset(filters);
  }, []); // Only run once on mount

  const onSubmit = (data: LeaveFiltersInput) => {
    // 100% SUCCESS Logic: Transform empty strings to undefined for clean API calls
    const cleanedFilters = {
      department: data.department || undefined,
      employeeId: data.employeeId || undefined,
      startDate: data.startDate || undefined,
      endDate: data.endDate || undefined,
      status: data.status || undefined,
      leaveType: data.leaveType || undefined,
    };
    setFilters(cleanedFilters);
  };

  const handleClear = () => {
    const initialFilters = {
        status: '',
        leaveType: '',
        department: '',
        employeeId: '',
        startDate: '',
        endDate: '',
    };
    reset(initialFilters); // Reset local form state
    resetFilters();        // Reset Zustand store
  };

  const departmentOptions = [
    { value: '', label: 'All Departments' },
    ...departments.map(dept => ({ value: dept, label: dept }))
  ];

  const employeeOptions = [
    { value: '', label: 'All Employees' },
    ...uniqueEmployees.map(emp => ({ value: emp.id, label: emp.name }))
  ];

  return (
    <div className="bg-[#F8F9FA] p-4 rounded-lg shadow-md mb-6">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-center">
          {/* Department Filter */}
          <div className="w-full">
            <Controller
              name="department"
              control={control}
              render={({ field }) => (
                <Combobox
                  options={departmentOptions}
                  value={field.value}
                  onChange={(val) => field.onChange(val)}
                  placeholder="Department"
                  disabled={isLoading}
                  className="w-full"
                  buttonClassName="px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm"
                />
              )}
            />
          </div>

          {/* Employee Filter */}
          <div className="w-full">
            <Controller
              name="employeeId"
              control={control}
              render={({ field }) => (
                <Combobox
                  options={employeeOptions}
                  value={field.value}
                  onChange={(val) => field.onChange(val)}
                  placeholder="Employee"
                  disabled={isLoading}
                  className="w-full"
                  buttonClassName="px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm"
                />
              )}
            />
          </div>

          {/* From Date Filter */}
          <div className="w-full">
            <Controller
              name="startDate"
              control={control}
              render={({ field }) => (
                <input
                  type="date"
                  {...field}
                  value={field.value || ''}
                  disabled={isLoading}
                  className="w-full px-3 bg-white border border-gray-200 rounded-lg shadow-sm py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-200 hover:border-gray-200 transition-all appearance-none cursor-pointer h-[38px]"
                />
              )}
            />
          </div>

          {/* To Date Filter */}
          <div className="w-full">
            <Controller
              name="endDate"
              control={control}
              render={({ field }) => (
                <input
                  type="date"
                  {...field}
                  value={field.value || ''}
                  disabled={isLoading}
                  className="w-full px-3 bg-white border border-gray-200 rounded-lg shadow-sm py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-200 hover:border-gray-200 transition-all appearance-none cursor-pointer h-[38px]"
                />
              )}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-2 md:col-span-2 lg:col-span-1 w-full">
            <button
              type="button"
              onClick={handleClear}
              disabled={isLoading}
              className="flex-1 bg-white text-gray-700 font-medium py-2 rounded-lg text-sm shadow-sm hover:bg-gray-50 transition-all active:scale-95 border border-gray-200"
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-gray-900 text-white font-medium py-2 rounded-lg text-sm shadow-sm hover:bg-gray-800 transition-all active:scale-95 border border-transparent"
            >
              Apply Filter
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Filters;

