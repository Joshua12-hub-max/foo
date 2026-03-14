import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AttendanceFilterSchema, AttendanceFilterValues } from "@/schemas/attendanceSchema";
import { useAttendanceStore } from "@/stores/attendanceStore";
import Combobox from "@/components/Custom/Combobox";

interface EmployeeOption {
  id: string;
  name: string;
}

interface AttendanceFiltersProps {
  uniqueDepartments?: string[];
  uniqueEmployees?: EmployeeOption[];
  isLoading?: boolean;
}

const AttendanceFilters: React.FC<AttendanceFiltersProps> = ({ 
  uniqueDepartments = [], 
  uniqueEmployees = [], 
  isLoading = false 
}) => {
  const { filters, setFilters, resetFilters } = useAttendanceStore();
  
  const { register, handleSubmit, reset, control } = useForm<AttendanceFilterValues>({
    resolver: zodResolver(AttendanceFilterSchema),
    defaultValues: filters,
  });

  // Sync form with store if external changes happen (like clear all)
  useEffect(() => {
    reset(filters);
  }, [filters, reset]);

  const onSubmit = (data: AttendanceFilterValues) => {
    setFilters(data);
  };

  const handleClear = () => {
    resetFilters();
  };

  const departmentOptions = [
    { value: '', label: 'Department' },
    ...uniqueDepartments.map(dept => ({ value: dept, label: dept }))
  ];

  const employeeOptions = [
    { value: '', label: 'Employee' },
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
                  onChange={field.onChange}
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
                  onChange={field.onChange}
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
            <input
              type="date"
              {...register("startDate")}
              disabled={isLoading}
              className="w-full px-3 bg-white border border-gray-200 rounded-lg shadow-sm py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-200 hover:border-gray-200 transition-all disabled:opacity-50 appearance-none cursor-pointer h-[38px]"
              placeholder="Start Date"
            />
          </div>

          {/* To Date Filter */}
          <div className="w-full">
            <input
              type="date"
              {...register("endDate")}
              disabled={isLoading}
              className="w-full px-3 bg-white border border-gray-200 rounded-lg shadow-sm py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-200 hover:border-gray-200 transition-all disabled:opacity-50 appearance-none cursor-pointer h-[38px]"
              placeholder="End Date"
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

export default AttendanceFilters;


