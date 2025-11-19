import { useState, useCallback, useMemo } from "react";

export const useFilters = (data) => {
  const [filters, setFilters] = useState({
    department: "",
    employee: "",
    fromDateTime: "",
    toDateTime: "",
  });
  const [searchQuery, setSearchQuery] = useState("");

  const handleFilterChange = useCallback((field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSearchChange = useCallback((e) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleClear = useCallback(() => {
    setFilters({
      department: "",
      employee: "",
      fromDateTime: "",
      toDateTime: "",
    });
    setSearchQuery("");
  }, []);

  const uniqueDepartments = useMemo(() => {
    return [...new Set(data.map(item => item.department || ""))].filter(Boolean).sort();
  }, [data]);

  const uniqueEmployees = useMemo(() => {
    return [...new Set(data.map(item => item.employeeName || ""))].filter(Boolean).sort();
  }, [data]);

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchesDepartment = filters.department ? item.department === filters.department : true;
      const matchesEmployee = filters.employee
        ? item.employeeName?.toLowerCase().includes(filters.employee.toLowerCase())
        : true;

      const matchesSearch = searchQuery
        ? Object.values(item).some(value => 
            String(value || "").toLowerCase().includes(searchQuery.toLowerCase())
          )
        : true;

      let matchesDateRange = true;
      if (filters.fromDateTime || filters.toDateTime) {
        const itemStartDateTime = new Date(`${item.startDate} ${item.startTime}`);
        const itemEndDateTime = new Date(`${item.endDate} ${item.endTime}`);

        if (filters.fromDateTime) {
          const fromDateTime = new Date(filters.fromDateTime);
          if (itemStartDateTime < fromDateTime) {
            matchesDateRange = false;
          }
        }

        if (filters.toDateTime && matchesDateRange) {
          const toDateTime = new Date(filters.toDateTime);
          if (itemEndDateTime > toDateTime) {
            matchesDateRange = false;
          }
        }
      }

      return matchesDepartment && matchesEmployee && matchesSearch && matchesDateRange;
    });
  }, [data, filters, searchQuery]);

  return {
    filters,
    searchQuery,
    uniqueDepartments,
    uniqueEmployees,
    filteredData,
    handleFilterChange,
    handleSearchChange,
    handleClear,
  };
};