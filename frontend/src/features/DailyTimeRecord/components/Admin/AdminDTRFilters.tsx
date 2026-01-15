import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DTRFilterSchema, DTRFilterValues } from "@/schemas/dtrSchema";
import { useDTRStore } from "@/stores/dtrStore";
import { Calendar } from "lucide-react";

interface AdminDTRFiltersProps {
  uniqueDepartments?: string[];
  uniqueEmployees?: { id: string; name: string }[];
  isLoading?: boolean;
}

export const AdminDTRFilters: React.FC<AdminDTRFiltersProps> = ({ 
  uniqueDepartments = [], 
  uniqueEmployees = [], 
  isLoading 
}) => {
  const { setFilters, resetFilters } = useDTRStore();

  const { register, handleSubmit, reset } = useForm<DTRFilterValues>({
    resolver: zodResolver(DTRFilterSchema),
    defaultValues: {
      department: '',
      employeeId: '',
      startDate: '',
      endDate: ''
    }
  });

  const onSubmit = (data: DTRFilterValues) => {
    setFilters(data);
  };

  const handleClear = () => {
    reset();
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
              className="w-full bg-white border border-gray-300 rounded-lg shadow-sm px-3 py-2 text-sm focus:ring-2 focus:ring-[#274b46] focus:border-transparent outline-none transition-all"
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
              className="w-full bg-white border border-gray-300 rounded-lg shadow-sm px-3 py-2 text-sm focus:ring-2 focus:ring-[#274b46] focus:border-transparent outline-none transition-all"
            >
              <option value="">All Employees</option>
              {uniqueEmployees.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          </div>

          {/* From Date */}
          <div className="relative w-full">
            <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#274b46] pointer-events-none z-10" />
            <input
              type="date"
              {...register("startDate")}
              disabled={isLoading}
              className="w-full pl-10 bg-white border border-gray-300 rounded-lg shadow-sm px-3 py-2 text-sm focus:ring-2 focus:ring-[#274b46] focus:border-transparent outline-none transition-all placeholder-gray-400"
            />
          </div>

          {/* To Date */}
          <div className="relative w-full">
            <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#274b46] pointer-events-none z-10" />
            <input
              type="date"
              {...register("endDate")}
              disabled={isLoading}
              className="w-full pl-10 bg-white border border-gray-300 rounded-lg shadow-sm px-3 py-2 text-sm focus:ring-2 focus:ring-[#274b46] focus:border-transparent outline-none transition-all placeholder-gray-400"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end lg:justify-start w-full">
            <button
              type="button"
              onClick={handleClear}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#274b46] transition-colors shadow-sm"
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-[#274b46] rounded-lg hover:bg-[#1f3d39] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#274b46] transition-colors shadow-sm"
            >
              Apply Filter
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
