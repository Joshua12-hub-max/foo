import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DTRFilterSchema, DTRFilterValues } from "@/schemas/dtrSchema";

interface EmployeeDTRFiltersProps {
  filters: DTRFilterValues;
  handleFilterChange: (field: string, value: string) => void;
  handleApply: () => void;
  handleClear: () => void;
  isLoading: boolean;
}

export const EmployeeDTRFilters: React.FC<EmployeeDTRFiltersProps> = ({ 
  filters, 
  handleFilterChange, 
  handleApply, 
  handleClear, 
  isLoading 
}) => {
  const { handleSubmit, reset, control } = useForm<DTRFilterValues>({
    resolver: zodResolver(DTRFilterSchema),
    defaultValues: filters,
  });

  // Sync form with store only when INITIALIZING 
  useEffect(() => {
    reset(filters);
  }, []); // Only run once on mount

  const onSubmit = (data: DTRFilterValues) => {
    // Update store values via provided handler
    handleFilterChange("startDate", data.startDate || "");
    handleFilterChange("endDate", data.endDate || "");
    handleApply();
  };

  const onClearClick = () => {
    const cleared = { startDate: "", endDate: "" };
    reset(cleared);
    handleClear();
  };

  return (
    <div className="bg-[#F8F9FA] p-4 rounded-lg shadow-md mb-6">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 gap-4 items-center md:grid-cols-2 lg:grid-cols-4">
          
          {/* From Date Filter */}
          <div className="w-full">
            <Controller
              name="startDate"
              control={control}
              render={({ field }) => (
                <div className="relative">
                  <input
                    type="date"
                    {...field}
                    value={field.value || ''}
                    disabled={isLoading}
                    className="w-full px-3 bg-white border border-gray-200 rounded-lg shadow-sm py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-200 hover:border-gray-200 transition-all disabled:opacity-50 appearance-none cursor-pointer h-[38px]"
                    placeholder="Start Date"
                  />
                </div>
              )}
            />
          </div>

          {/* To Date Filter */}
          <div className="w-full">
            <Controller
              name="endDate"
              control={control}
              render={({ field }) => (
                <div className="relative">
                  <input
                    type="date"
                    {...field}
                    value={field.value || ''}
                    disabled={isLoading}
                    className="w-full px-3 bg-white border border-gray-200 rounded-lg shadow-sm py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-200 hover:border-gray-200 transition-all disabled:opacity-50 appearance-none cursor-pointer h-[38px]"
                    placeholder="End Date"
                  />
                </div>
              )}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 w-full md:col-span-2">
            <button
              type="button"
              onClick={onClearClick}
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

