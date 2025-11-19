import { useState, useMemo, useCallback, useEffect } from "react";
import { filterData, getUniqueValues, calculatePagination } from "../Utils/dtrCorrections";
import { ITEMS_PER_PAGE, TABS, MESSAGES, DELAYS } from "../Constants/dtrCorrection.constant";

export const useDTRCorrection = () => {
  const [activeTab, setActiveTab] = useState(TABS.EMPLOYEE);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [employeeData] = useState([
    {
      id: 1,
      department: "HR",
      employeeName: "John Doe",
      employeeid: "E001",
      date: "2025-11-17",
      timeIn: "08:00",
      timeOut: "17:00",
      correctedTime: "08:15",
      reason: "Forgot to clock in",
      status: "Pending",
    },
    {
      id: 2,
      department: "IT",
      employeeName: "Jane Smith",
      employeeid: "E002",
      date: "2025-11-17",
      timeIn: "09:30",
      timeOut: "18:30",
      correctedTime: "09:45",
      reason: "Meeting with client",
      status: "Pending",
    },
  ]);
  const [adminData, setAdminData] = useState([
    {
      id: 1,
      department: "HR",
      employeeName: "John Doe",
      employeeid: "E001",
      date: "2025-11-17",
      timeIn: "08:00",
      timeOut: "17:00",
      correctedTime: "08:15",
      reason: "Forgot to clock in",
      status: "Pending",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const [filters, setFilters] = useState({
    department: "",
    employee: "",
    fromDate: "",
    toDate: ""
  });

  const today = useMemo(() => new Date().toLocaleDateString("en-US"), []);

  // Auto-dismiss notifications
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), DELAYS.ERROR_DISMISS);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), DELAYS.SUCCESS_DISMISS);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const currentData = useMemo(() => 
    activeTab === TABS.EMPLOYEE ? employeeData : adminData,
    [activeTab, employeeData, adminData]
  );

  const uniqueDepartments = useMemo(() => 
    getUniqueValues(currentData, 'department'),
    [currentData]
  );

  const uniqueEmployees = useMemo(() => 
    getUniqueValues(currentData, 'name'),
    [currentData]
  );

  const filteredData = useMemo(() => 
    filterData(currentData, searchQuery, filters),
    [searchQuery, currentData, filters]
  );

  const paginationData = useMemo(() => 
    calculatePagination(filteredData, currentPage, ITEMS_PER_PAGE),
    [filteredData, currentPage]
  );

  const handleSearchChange = useCallback((e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  }, []);

  const handleFilterChange = useCallback((field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setCurrentPage(1);
  }, []);

  const handleTabChange = useCallback((tab) => {
    if (isLoading) return;
    
    setIsLoading(true);
    setSearchQuery("");
    setCurrentPage(1);
    setError(null);
    
    setTimeout(() => {
      setActiveTab(tab);
      setIsLoading(false);
    }, DELAYS.TAB_CHANGE);
  }, [isLoading]);

  const handleApplyFilters = useCallback(() => {
    setCurrentPage(1);
    setSuccessMessage(MESSAGES.FILTERS_APPLIED);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({
      department: "",
      employee: "",
      fromDate: "",
      toDate: ""
    });
    setSearchQuery("");
    setCurrentPage(1);
    setSuccessMessage(MESSAGES.FILTERS_CLEARED);
  }, []);

const handleApprove = useCallback(async (id) => {
  if (activeTab !== TABS.ADMIN) return false;

  setActionLoading(id);
  setError(null);

  try {
    await new Promise(resolve => setTimeout(resolve, DELAYS.APPROVE));

    setAdminData(prev =>
      prev.map(item =>
        item.id === id ? { ...item, status: "Approved" } : item
      )
    );

    setSuccessMessage(MESSAGES.RECORD_APPROVED);
    return true;

  } catch (err) {
    setError(MESSAGES.ERROR_APPROVE);
    return false;

  } finally {
    setActionLoading(null);
  }
}, [activeTab]);


  const handleReject = useCallback(async (id) => {
  if (activeTab !== TABS.ADMIN) return false;

  setActionLoading(id);
  setError(null);

  try {
    await new Promise(resolve => setTimeout(resolve, DELAYS.REJECT));

    setAdminData(prev =>
      prev.map(item =>
        item.id === id ? { ...item, status: "Rejected" } : item
      )
    );

    setSuccessMessage(MESSAGES.RECORD_REJECTED);
    return true;

  } catch (err) {
    setError(MESSAGES.ERROR_REJECT);
    return false;

  } finally {
    setActionLoading(null);
  }
}, [activeTab]);



  const handleSaveEdit = useCallback(async (updatedRecord) => {
    setActionLoading(updatedRecord.id);
    setError(null);
    
    try {
      await new Promise(resolve => setTimeout(resolve, DELAYS.UPDATE));
      
      setAdminData((prev) =>
        prev.map((item) => (item.id === updatedRecord.id ? updatedRecord : item))
      );
      setSuccessMessage(MESSAGES.RECORD_UPDATED);
      return true;
    } catch (err) {
      setError(MESSAGES.ERROR_UPDATE);
      return false;
    } finally {
      setActionLoading(null);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await new Promise(resolve => setTimeout(resolve, DELAYS.REFRESH));
      setSuccessMessage(MESSAGES.DATA_REFRESHED);
    } catch (err) {
      setError(MESSAGES.ERROR_REFRESH);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    today,
    activeTab,
    searchQuery,
    currentPage,
    employeeData,
    adminData,
    isLoading,
    error,
    successMessage,
    actionLoading,
    filters,
    uniqueDepartments,
    uniqueEmployees,
    filteredData,
    paginationData,
    setCurrentPage,
    setError,
    setSuccessMessage,
    handleSearchChange,
    handleFilterChange,
    handleTabChange,
    handleApplyFilters,
    handleClearFilters,
    handleSaveEdit,
    handleRefresh
  };
};