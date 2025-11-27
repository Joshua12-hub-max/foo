import { useState, useCallback, useMemo, useEffect, useRef } from "react";

const ITEMS_PER_PAGE = 10;

const useEmployeedata = () => {
    const [attendanceData, setAttendanceData] = useState([]);
    const [filters, setFilters] = useState({
        department: "",
        employee: "",
        status: "",
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

    const statusOptions = ["Present", "Absent", "Late", "On Leave", "Work From Home", "Undertime", "Overtime", "Half Day"];
    
    const filteredData = useMemo(() => {
        let data = attendanceData;
    
        if (filters.department) {
            data = data.filter((item) => item.department === filters.department);
        }
    
        if (filters.employee) {
            data = data.filter((item) => item.name === filters.employee);
        }
    
        if (filters.status) {
            data = data.filter((item) => item.status === filters.status);
        }
    
        if (filters.fromDate) {
            data = data.filter((item) => item.date >= filters.fromDate);
        }
    
        if (filters.toDate) {
            data = data.filter((item) => item.date <= filters.toDate);
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

    const attendanceStats = useMemo(() => {
        const present = filteredData.filter(item => item.status === "Present").length;
        const absent = filteredData.filter(item => item.status === "Absent").length;
        const late = filteredData.filter(item => item.status === "Late").length;
        const onLeave = filteredData.filter(item => item.status === "On Leave").length;
        const workFromHome = filteredData.filter(item => item.status === "Work From Home").length;
        const undertime = filteredData.filter(item => item.status === "Undertime").length;
        const overtime = filteredData.filter(item => item.status === "Overtime").length;
        const halfDay = filteredData.filter(item => item.status === "Half Day").length;
        const total = filteredData.length;
        
        return { present, absent, late, onLeave, workFromHome, undertime, overtime, halfDay, total };
    }, [filteredData]);

    return {
        filters,
        setFilters,
        attendanceData,
        setAttendanceData,
        searchQuery,
        setSearchQuery,
        debouncedSearchQuery,
        currentPage,
        setCurrentPage,
        searchTimeoutRef,
        handleFilterChange,
        handleSearchChange,
        statusOptions,
        filteredData,
        paginationData,
        attendanceStats
    };
};

export default useEmployeedata;