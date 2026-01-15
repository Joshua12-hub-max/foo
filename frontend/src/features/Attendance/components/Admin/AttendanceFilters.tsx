import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AttendanceFilterSchema, AttendanceFilterValues } from "@/schemas/attendanceSchema";
import { useAttendanceStore } from "@/stores/attendanceStore";

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
  
  const { register, handleSubmit, reset } = useForm<AttendanceFilterValues>({
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

  return (
    <div className="bg-[#F8F9FA] p-4 rounded-lg shadow-md mb-6">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 gap-4 items-center md:grid-cols-2 lg:grid-cols-5">
          
          {/* Department Filter */}
          <div className="w-full">
            <select
              {...register("department")}
              disabled={isLoading}
              className="w-full px-3 bg-white border border-gray-200 rounded-lg shadow-sm py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-200 hover:border-gray-200 transition-all disabled:opacity-50 appearance-none cursor-pointer"
            >
              <option value="">All Departments</option>
              {uniqueDepartments.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          {/* Employee Filter */}
          <div className="w-full">
            <select
              {...register("employeeId")}
              disabled={isLoading}
              className="w-full px-3 bg-white border border-gray-200 rounded-lg shadow-sm py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-200 hover:border-gray-200 transition-all disabled:opacity-50 appearance-none cursor-pointer"
            >
              <option value="">All Employees</option>
              {uniqueEmployees.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          </div>

          {/* From Date Filter */}
          <div className="w-full">
            <input
              type="date"
              {...register("startDate")}
              disabled={isLoading}
              className="w-full px-3 bg-white border border-gray-200 rounded-lg shadow-sm py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-200 hover:border-gray-200 transition-all disabled:opacity-50 appearance-none cursor-pointer"
              placeholder="Start Date"
            />
          </div>

          {/* To Date Filter */}
          <div className="w-full">
            <input
              type="date"
              {...register("endDate")}
              disabled={isLoading}
              className="w-full px-3 bg-white border border-gray-200 rounded-lg shadow-sm py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-200 hover:border-gray-200 transition-all disabled:opacity-50 appearance-none cursor-pointer"
              placeholder="End Date"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end lg:justify-start w-full md:col-span-2 lg:col-span-1">
            <button
              type="button"
              onClick={handleClear}
              disabled={isLoading}
              className="bg-white text-gray-700 font-medium px-4 py-2 rounded-lg text-sm shadow-sm hover:bg-gray-50 transition-all disabled:opacity-50 active:scale-95 border border-gray-200"
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="bg-gray-900 text-white font-medium px-4 py-2 rounded-lg text-sm shadow-sm hover:bg-gray-800 transition-all disabled:opacity-50 active:scale-95 border border-transparent"
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


