import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DTRFilterSchema, DTRFilterValues } from "@/schemas/dtrSchema";
import { useDTRStore } from "@/stores/dtrStore";
import Combobox from "@/components/Custom/Combobox";

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
  const { filters, setFilters, resetFilters } = useDTRStore();

  const { register, handleSubmit, reset, control } = useForm<DTRFilterValues>({
    resolver: zodResolver(DTRFilterSchema),
    defaultValues: filters
  });

  // Sync form with store
  useEffect(() => {
    reset(filters);
  }, [filters, reset]);

  const onSubmit = (data: DTRFilterValues) => {
    setFilters(data);
  };

  const handleClear = () => {
    resetFilters();
  };

  const departmentOptions = [
    { value: "", label: "Department" },
    ...uniqueDepartments.map(dept => ({ value: dept, label: dept }))
  ];

  const employeeOptions = [
    { value: "", label: "Employee" },
    ...uniqueEmployees.map(emp => ({ value: emp.id, label: emp.name }))
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6 items-start bg-[#F8F9FA] p-4 rounded-lg shadow-md">
        
        {/* Department Filter */}
        <div className="md:col-span-1">
          <Controller
            name="department"
            control={control}
            render={({ field }) => (
              <Combobox
                options={departmentOptions}
                value={field.value}
                onChange={(val) => {
                    field.onChange(val);
                    handleSubmit(onSubmit)();
                }}
                placeholder="Department"
                disabled={isLoading}
                buttonClassName="pl-3 bg-[#F8F9FA] border-gray-300 shadow-md"
              />
            )}
          />
        </div>

        {/* Employee Filter */}
        <div className="md:col-span-1">
          <Controller
            name="employeeId"
            control={control}
            render={({ field }) => (
              <Combobox
                options={employeeOptions}
                value={field.value}
                onChange={(val) => {
                    field.onChange(val);
                    handleSubmit(onSubmit)();
                }}
                placeholder="Employee"
                disabled={isLoading}
                buttonClassName="pl-3 bg-[#F8F9FA] border-gray-300 shadow-sm"
              />
            )}
          />
        </div>

        {/* Start Date */}
        <div className="md:col-span-1">
          <input
            type="date"
            {...register("startDate")}
            disabled={isLoading}
            onChange={(e) => {
                register("startDate").onChange(e);
                handleSubmit(onSubmit)();
            }}
            className="w-full px-3 bg-white border border-gray-200 rounded-lg shadow-sm py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-200 hover:border-gray-200 transition-all appearance-none cursor-pointer min-h-[38px]"
          />
        </div>

        {/* End Date */}
        <div className="md:col-span-1">
          <input
            type="date"
            {...register("endDate")}
            disabled={isLoading}
            onChange={(e) => {
                register("endDate").onChange(e);
                handleSubmit(onSubmit)();
            }}
            className="w-full px-3 bg-white border border-gray-200 rounded-lg shadow-sm py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-200 hover:border-gray-200 transition-all appearance-none cursor-pointer min-h-[38px]"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 md:col-span-2">
          <button
            type="button"
            onClick={handleSubmit(onSubmit)}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 bg-[#F8F9FA] text-gray-700 font-medium px-4 py-2 rounded-lg text-sm shadow-sm hover:bg-[#F8F9FA] transition-all active:scale-95 border border-gray-200 disabled:opacity-50"
          >
            Apply Filter
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={isLoading}
            className="flex-1 bg-[#F8F9FA] text-gray-700 font-medium px-4 py-2 rounded-lg text-sm shadow-sm hover:bg-[#F8F9FA] transition-all active:scale-95 border border-gray-200 disabled:opacity-50"
          >
             Clear
          </button>
        </div>
    </div>
  );
};
