import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { leaveFiltersSchema, LeaveFiltersInput } from '@/schemas/leave';
import { useLeaveStore } from '@/stores/leaveStore';
import Combobox from '@/components/Custom/Combobox';

interface FiltersProps {
  onNewRequest: () => void;
  isLoading: boolean;
  hasCredits?: boolean;
}

export const Filters: React.FC<FiltersProps> = ({ 
  onNewRequest,
  isLoading 
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
      status: data.status || undefined,
      leaveType: data.leaveType || undefined,
      startDate: data.startDate || undefined,
      endDate: data.endDate || undefined,
    };
    setFilters(cleanedFilters);
  };

  const handleClearClick = () => {
    const initialFilters = {
        status: '',
        leaveType: '',
        startDate: '',
        endDate: '',
    };
    reset(initialFilters); // Reset local form state
    resetFilters();        // Reset Zustand store
  };

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'Pending', label: 'Pending' },
    { value: 'Approved', label: 'Approved' },
    { value: 'Rejected', label: 'Rejected' },
    { value: 'Cancelled', label: 'Cancelled' },
  ];

  const typeOptions = [
    { value: '', label: 'All Types' },
    { value: 'Vacation Leave', label: 'Vacation Leave' },
    { value: 'Sick Leave', label: 'Sick Leave' },
    { value: 'Emergency Leave', label: 'Emergency Leave' },
    { value: 'Maternity Leave', label: 'Maternity Leave' },
    { value: 'Paternity Leave', label: 'Paternity Leave' },
  ];

  return (
    <div className="bg-[#F8F9FA] p-4 rounded-lg shadow-md mb-6">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-center">
          {/* Status Filter */}
          <div className="w-full">
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Combobox
                  options={statusOptions}
                  value={field.value}
                  onChange={(val) => field.onChange(val)}
                  placeholder="All Status"
                  disabled={isLoading}
                  className="w-full"
                  buttonClassName="px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm"
                />
              )}
            />
          </div>

          {/* Type Filter */}
          <div className="w-full">
            <Controller
              name="leaveType"
              control={control}
              render={({ field }) => (
                <Combobox
                  options={typeOptions}
                  value={field.value}
                  onChange={(val) => field.onChange(val)}
                  placeholder="All Types"
                  disabled={isLoading}
                  className="w-full"
                  buttonClassName="px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm"
                />
              )}
            />
          </div>

          {/* Start Date Filter */}
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
                  className="w-full bg-white border border-gray-200 rounded-lg shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-200 hover:border-gray-200 transition-all appearance-none cursor-pointer h-[38px]"
                />
              )}
            />
          </div>

          {/* End Date Filter */}
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
                  className="w-full bg-white border border-gray-200 rounded-lg shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-200 hover:border-gray-200 transition-all appearance-none cursor-pointer h-[38px]"
                />
              )}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-2 w-full md:col-span-2 lg:col-span-1">
            <button
              type="button"
              onClick={handleClearClick}
              disabled={isLoading}
              className="flex-1 bg-white text-gray-700 font-medium py-2 rounded-lg text-sm shadow-sm hover:bg-gray-50 transition-all disabled:opacity-50 active:scale-95 border border-gray-200"
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-gray-900 text-white font-medium py-2 rounded-lg text-sm shadow-sm hover:bg-gray-800 transition-all disabled:opacity-50 active:scale-95 border border-transparent"
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

