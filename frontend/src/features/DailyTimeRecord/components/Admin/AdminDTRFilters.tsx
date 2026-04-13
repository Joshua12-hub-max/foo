import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DTRFilterSchema, DTRFilterValues } from "@/schemas/dtrSchema";
import { useDTRStore } from "@/stores/dtrStore";
import Combobox from "@/components/Custom/Combobox";

interface EmployeeOption {
  id: string;
  name: string;
}

interface AdminDTRFiltersProps {
  uniqueDepartments?: string[];
  uniqueEmployees?: EmployeeOption[];
  isLoading?: boolean;
}

export const AdminDTRFilters: React.FC<AdminDTRFiltersProps> = ({ 
  uniqueDepartments = [], 
  uniqueEmployees = [], 
  isLoading = false 
}) => {
  const { filters, setFilters, resetFilters } = useDTRStore();
  
  const { handleSubmit, reset, control } = useForm<DTRFilterValues>({
    resolver: zodResolver(DTRFilterSchema),
    defaultValues: filters,
  });

  // Sync form with store only when INITIALIZING 
  useEffect(() => {
    reset(filters);
  }, []); // Only run once on mount to populate initial state

  const onSubmit = (data: DTRFilterValues) => {
    // 100% SUCCESS Logic: Transform empty strings to undefined for clean API calls
    const cleanedFilters = {
      department: data.department || undefined,
      employeeId: data.employeeId || undefined,
      startDate: data.startDate || undefined,
      endDate: data.endDate || undefined,
    };
    setFilters(cleanedFilters);
  };

  const handleClear = () => {
    const initialFilters = {
        employeeId: '',
        department: '',
        startDate: '',
        endDate: '',
    };
    reset(initialFilters); // Reset local form state
    resetFilters();        // Reset Zustand store
  };

  const departmentOptions = [
    { value: '', label: 'All Departments' },
    ...uniqueDepartments.map(dept => ({ value: dept, label: dept }))
  ];

  const employeeOptions = [
    { value: '', label: 'All Employees' },
    ...uniqueEmployees.map(emp => ({ value: emp.id, label: emp.name }))
  ];

  return (
    <div className="bg-[#F8F9FA] p-4 rounded-lg shadow-md mb-6">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 gap-4 items-center md:grid-cols-2 lg:grid-cols-5">
          
          {/* Department Filter */}
          <div className="w-full">
            <Controller
              name="department"
              control={control}
              render={({ field }) => (
                <Combobox
                  options={departmentOptions}
                  value={field.value}
                  onChange={(val) => {
                    field.onChange(val);
                  }}
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
                  onChange={(val) => {
                    field.onChange(val);
                  }}
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
                  className="w-full px-3 bg-white border border-gray-200 rounded-lg shadow-sm py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-200 hover:border-gray-200 transition-all disabled:opacity-50 appearance-none cursor-pointer h-[38px]"
                  placeholder="Start Date"
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
                  className="w-full px-3 bg-white border border-gray-200 rounded-lg shadow-sm py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-200 hover:border-gray-200 transition-all disabled:opacity-50 appearance-none cursor-pointer h-[38px]"
                  placeholder="End Date"
                />
              )}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 w-full md:col-span-2 lg:col-span-1">
            <button
              type="button"
              onClick={handleClear}
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

