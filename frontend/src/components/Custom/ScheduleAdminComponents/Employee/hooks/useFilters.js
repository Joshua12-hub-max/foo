import { useState, useCallback, useMemo } from "react";

export const useFilters = (data) => {
  const [filters, setFilters] = useState({
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
      fromDateTime: "",
      toDateTime: "",
    });
    setSearchQuery("");
  }, []);

  const filteredData = useMemo(() => {
    return data.filter((item) => {
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

      return matchesSearch && matchesDateRange;
    });
  }, [data, filters, searchQuery]);

  return {
    filters,
    searchQuery,
    filteredData,
    handleFilterChange,
    handleSearchChange,
    handleClear,
  };
};
