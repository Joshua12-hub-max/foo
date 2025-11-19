import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { ITEMS_PER_PAGE } from '../Constants/AttendanceConstant';

export const useAttendanceData = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [filters, setFilters] = useState({
    department: "",
    employee: "",
    fromDate: "",
    toDate: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, debouncedSearchQuery]);

  const handleFilterChange = useCallback((field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setCurrentPage(1);
  }, []);

  const handleSearchChange = useCallback((e) => {
    setSearchQuery(e.target.value);
  }, []);

  const uniqueDepartments = useMemo(() => {
    return [...new Set(attendanceData.map(item => item.department))].sort();
  }, [attendanceData]);

  const uniqueEmployees = useMemo(() => {
    return [...new Set(attendanceData.map(item => item.name))].sort();
  }, [attendanceData]);

  const filteredData = useMemo(() => {
    let data = [...attendanceData];

    if (filters.department) {
      data = data.filter((item) => item.department === filters.department);
    }

    if (filters.employee) {
      data = data.filter((item) => item.name === filters.employee);
    }

    if (filters.fromDate) {
      const from = new Date(filters.fromDate);
      data = data.filter((item) => new Date(item.date) >= from);
    }

    if (filters.toDate) {
      const to = new Date(filters.toDate);
      data = data.filter((item) => new Date(item.date) <= to);
    }

    const query = debouncedSearchQuery.toLowerCase();
    if (query) {
      data = data.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.id.toLowerCase().includes(query) ||
          item.department.toLowerCase().includes(query) ||
          item.status.toLowerCase().includes(query)
      );
    }

    return data;
  }, [filters, debouncedSearchQuery, attendanceData]);

  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const currentItems = filteredData.slice(startIndex, endIndex);
    return { totalPages, startIndex, endIndex, currentItems };
  }, [filteredData, currentPage]);

  return {
    attendanceData,
    setAttendanceData,
    filters,
    setFilters,
    searchQuery,
    setSearchQuery,
    debouncedSearchQuery,
    currentPage,
    setCurrentPage,
    handleFilterChange,
    handleSearchChange,
    uniqueDepartments,
    uniqueEmployees,
    filteredData,
    paginationData,
  };
};