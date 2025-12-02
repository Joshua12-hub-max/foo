import { useState, useMemo, useCallback, useEffect } from "react";
import { filterData, getUniqueValues, calculatePagination } from "../Utils/dtrCorrections";
import { ITEMS_PER_PAGE, TABS, MESSAGES, DELAYS } from "../Constants/dtrCorrection.constant";
import { dtrCorrectionApi } from "../../../../api/dtrCorrectionApi";

export const useDTRCorrection = () => {
  const [activeTab, setActiveTab] = useState(TABS.EMPLOYEE);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  
  // Real data from API instead of mock data
  const [employeeData, setEmployeeData] = useState([]);
  const [adminData, setAdminData] = useState([]);
  
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

  // Fetch employee corrections on mount
  useEffect(() => {
    fetchEmployeeCorrections();
  }, []);

  // Fetch admin corrections when switching to admin tab
  useEffect(() => {
    if (activeTab === TABS.ADMIN) {
      fetchAdminCorrections();
    }
  }, [activeTab]);

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

  // Fetch employee corrections from API
  const fetchEmployeeCorrections = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await dtrCorrectionApi.getMyCorrections();
      const corrections = response.data.corrections || [];
      
      // Map API response to match component structure
      const mappedData = corrections.map(item => ({
        id: item.id,
        department: item.department || "N/A",
        employeeName: item.employee_name || "Unknown",
        employeeid: item.employee_id || "N/A",
        date: item.date_time,
        timeIn: item.in_time || "N/A",
        timeOut: item.out_time || "N/A",
        correctedTime: item.corrected_time,
        reason: item.reason,
        status: item.status,
      }));
      
      setEmployeeData(mappedData);
    } catch (err) {
      console.error("Error fetching employee corrections:", err);
      setError("Failed to load corrections. Please try again.");
      setEmployeeData([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch admin corrections from API
  const fetchAdminCorrections = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await dtrCorrectionApi.getAllCorrections();
      const empCorrections = response.data.employeeCorrections || [];
      const admCorrections = response.data.adminCorrections || [];
      
      // Combine both employee and admin corrections
      const allCorrections = [
        ...empCorrections.map(item => ({
          id: item.id,
          department: item.department || "N/A",
          employeeName: item.employee_name || "Unknown",
          employeeid: item.employee_id || "N/A",
          date: item.date_time,
          timeIn: item.in_time || "N/A",
          timeOut: item.out_time || "N/A",
          correctedTime: item.corrected_time,
          reason: item.reason,
          status: item.status,
          source: "employee"
        })),
        ...admCorrections.map(item => ({
          id: item.id,
          department: item.department || "N/A",
          employeeName: item.employee_name,
          employeeid: item.employee_id,
          date: item.date_time,
          timeIn: item.in_time || "N/A",
          timeOut: item.out_time || "N/A",
          correctedTime: item.corrected_time,
          reason: item.reason,
          status: item.status,
          source: "admin"
        }))
      ];
      
      setAdminData(allCorrections);
    } catch (err) {
      console.error("Error fetching admin corrections:", err);
      setError("Failed to load corrections. Please try again.");
      setAdminData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const currentData = useMemo(() => 
    activeTab === TABS.EMPLOYEE ? employeeData : adminData,
    [activeTab, employeeData, adminData]
  );

  const uniqueDepartments = useMemo(() => 
    getUniqueValues(currentData, 'department'),
    [currentData]
  );

  const uniqueEmployees = useMemo(() => 
    getUniqueValues(currentData, 'employeeName'),
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

  const handleApprove = useCallback(async (id, source = "employee") => {
    setActionLoading(id);
    setError(null);

    try {
      await dtrCorrectionApi.approveCorrection(id, "");
      
      // Update local state
      setAdminData(prev =>
        prev.map(item =>
          item.id === id && item.source === source 
            ? { ...item, status: "Approved" } 
            : item
        )
      );

      setSuccessMessage(MESSAGES.RECORD_APPROVED);
      return true;

    } catch (err) {
      console.error("Error approving correction:", err);
      setError(err.response?.data?.message || MESSAGES.ERROR_APPROVE);
      return false;

    } finally {
      setActionLoading(null);
    }
  }, []);

  const handleReject = useCallback(async (id, reason, source = "employee") => {
    setActionLoading(id);
    setError(null);

    try {
      await dtrCorrectionApi.rejectCorrection(id, reason);
      
      // Update local state
      setAdminData(prev =>
        prev.map(item =>
          item.id === id && item.source === source
            ? { ...item, status: "Rejected" }
            : item
        )
      );

      setSuccessMessage(MESSAGES.RECORD_REJECTED);
      return true;

    } catch (err) {
      console.error("Error rejecting correction:", err);
      setError(err.response?.data?.message || MESSAGES.ERROR_REJECT);
      return false;

    } finally {
      setActionLoading(null);
    }
  }, []);

  const handleSaveEdit = useCallback(async (updatedRecord) => {
    setActionLoading(updatedRecord.id);
    setError(null);
    
    try {
      const source = updatedRecord.source || 'employee'; // Default to employee if missing
      
      // Format data for API
      const apiData = {
          department: updatedRecord.department,
          employee_id: updatedRecord.employeeid, // Note: casing match with component data
          employee_name: updatedRecord.employeeName,
          date_time: updatedRecord.date,
          in_time: updatedRecord.timeIn === "N/A" ? null : updatedRecord.timeIn,
          out_time: updatedRecord.timeOut === "N/A" ? null : updatedRecord.timeOut,
          corrected_time: updatedRecord.correctedTime,
          reason: updatedRecord.reason
      };

      await dtrCorrectionApi.updateCorrectionByAdmin(updatedRecord.id, apiData, source);
      
      setAdminData((prev) =>
        prev.map((item) => (item.id === updatedRecord.id && item.source === source ? updatedRecord : item))
      );
      setSuccessMessage(MESSAGES.RECORD_UPDATED);
      return true;
    } catch (err) {
      console.error("Error updating correction:", err);
      setError(err.response?.data?.message || MESSAGES.ERROR_UPDATE);
      return false;
    } finally {
      setActionLoading(null);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (activeTab === TABS.EMPLOYEE) {
        await fetchEmployeeCorrections();
      } else {
        await fetchAdminCorrections();
      }
      setSuccessMessage(MESSAGES.DATA_REFRESHED);
    } catch (err) {
      console.error("Error refreshing data:", err);
      setError(MESSAGES.ERROR_REFRESH);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

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
    handleApprove,
    handleReject,
    handleSaveEdit,
    handleRefresh,
    fetchEmployeeCorrections,
    fetchAdminCorrections
  };
};