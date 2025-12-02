import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { Download, FileText, RefreshCw, AlertCircle, Check, Calendar, Search } from "lucide-react";
import { useOutletContext } from 'react-router-dom';
import { leaveApi } from "../../api/leaveApi";

// Modals
import ApproveModal from "../../components/Custom/LeaveRequestAdminComponents/Modals/Approve";
import RejectModal from "../../components/Custom/LeaveRequestAdminComponents/Modals/Reject";
import ProcessModal from "../../components/Custom/LeaveRequestAdminComponents/Modals/Process";

const ITEMS_PER_PAGE = 10;

const LeaveRequestsTable = () => {
  const today = useMemo(() => new Date().toLocaleDateString("en-US"), []);
  
  const outletContext = useOutletContext?.() || { sidebarOpen: true };
  const { sidebarOpen = true } = outletContext;
  
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [filters, setFilters] = useState({ department: "", employee: "", fromDate: "", toDate: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingType, setLoadingType] = useState("");
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  
  // Modal states
  const [approveModal, setApproveModal] = useState({ isOpen: false, request: null, remarks: "" });
  const [rejectModal, setRejectModal] = useState({ isOpen: false, request: null, remarks: "" });
  const [processModal, setProcessModal] = useState({ isOpen: false, request: null });

  const searchTimeoutRef = useRef(null);

  // Fetch Data
  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const res = await leaveApi.getAllLeaves();
      // Map API data to component structure
      const mapped = res.data.leaves.map(l => ({
        id: l.id,
        employee_id: l.employee_id,
        name: `${l.first_name} ${l.last_name}`,
        department: l.department || 'N/A',
        leaveType: l.leave_type,
        fromDate: l.start_date, // Keep raw for filtering, format for display
        toDate: l.end_date,
        reason: l.reason,
        status: l.status,
        with_pay: l.with_pay,
        attachment_path: l.attachment_path,
        final_attachment_path: l.final_attachment_path,
        first_name: l.first_name,
        last_name: l.last_name,
        leave_type: l.leave_type,
        start_date: l.start_date,
        end_date: l.end_date
      }));
      setLeaveRequests(mapped);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch leave requests.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const calculateDuration = useCallback((fromDate, toDate) => {
    if (!fromDate || !toDate) return 'N/A';
    const from = new Date(fromDate);
    const to = new Date(toDate);
    if (isNaN(from) || isNaN(to)) return 'Invalid';
    const diffTime = to - from;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive days
    return diffDays > 0 ? `${diffDays} day${diffDays > 1 ? 's' : ''}` : '0 days';
  }, []);

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
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, debouncedSearchQuery]);

  const departments = useMemo(() => [...new Set(leaveRequests.map(item => item.department))].sort(), [leaveRequests]);
  const uniqueEmployees = useMemo(() => [...new Set(leaveRequests.map(item => item.name))].sort(), [leaveRequests]);

  const handleFilterChange = useCallback((field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleApplyFilters = useCallback(() => {
    setSuccessMessage("Filters applied successfully!");
  }, [filters]);

  const handleClear = useCallback(() => {
    setFilters({ department: "", employee: "", fromDate: "", toDate: "" });
    setSearchQuery("");
    setSuccessMessage("Filters cleared successfully!");
  }, []);

  const handleSearchChange = useCallback((e) => {
    setSearchQuery(e.target.value);
  }, []);

  const filteredRequests = useMemo(() => {
    let data = leaveRequests;
    if (filters.department) {
      data = data.filter((item) => item.department === filters.department);
    }
    if (filters.employee) {
      data = data.filter((item) => item.name === filters.employee);
    }
    if (filters.fromDate) {
      data = data.filter((item) => item.fromDate >= filters.fromDate);
    }
    if (filters.toDate) {
      data = data.filter((item) => item.toDate <= filters.toDate);
    }

    const query = debouncedSearchQuery.toLowerCase();
    if (query) {
      data = data.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          String(item.id).toLowerCase().includes(query) ||
          item.department.toLowerCase().includes(query) ||
          item.leaveType.toLowerCase().includes(query) ||
          item.status.toLowerCase().includes(query)
      );
    }

    return data;
  }, [leaveRequests, filters, debouncedSearchQuery]);

  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(filteredRequests.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const currentItems = filteredRequests.slice(startIndex, endIndex);
    return { totalPages, startIndex, endIndex, currentItems };
  }, [filteredRequests, currentPage]);

  const handleExportCSV = useCallback(async () => {
    if (filteredRequests.length === 0) {
      setError("No data available to export.");
      return;
    }
    setIsLoading(true);
    setLoadingType("CSV");
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      const headers = ["Employee ID", "Employee Name", "Department", "Leave Type", "From Date", "To Date", "Duration", "Status"];
      const csvContent = [
        headers.join(","),
        ...filteredRequests.map(item => 
          `${item.employee_id},${item.name},${item.department},${item.leaveType},${item.fromDate},${item.toDate},${calculateDuration(item.fromDate, item.toDate)},${item.status}`
        )
      ].join("\n");
      
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `leave_requests_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      setSuccessMessage("CSV exported successfully!");
    } catch (err) {
      console.error('Export to CSV failed:', err);
      setError(`CSV Export failed: ${err.message || 'Unknown error.'}`);
    } finally {
      setIsLoading(false);
      setLoadingType("");
    }
  }, [filteredRequests, calculateDuration]);

  const handleExportPDF = useCallback(async () => {
    if (filteredRequests.length === 0) {
      setError("No data available to export.");
      return;
    }
    setIsLoading(true);
    setLoadingType("PDF");
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const headers = ["ID", "Employee Name", "Dept", "Type", "From", "To", "Days", "Status"];
      
      let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Leave Requests Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; font-size: 24px; margin-bottom: 10px; }
            .meta { color: #666; font-size: 14px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th { background-color: #1e293b; color: white; padding: 10px; text-align: left; font-weight: bold; }
            td { padding: 8px; border-bottom: 1px solid #e2e8f0; }
            tr:hover { background-color: #f8fafc; }
            @media print {
              body { margin: 0; }
              @page { margin: 1cm; }
            }
          </style>
        </head>
        <body>
          <h1>Leave Requests Report</h1>
          <div class="meta">Generated on: ${today}</div>
          <table>
            <thead>
              <tr>
                ${headers.map(h => `<th>${h}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${filteredRequests.map(row => `
                <tr>
                  <td>${row.employee_id}</td>
                  <td>${row.name}</td>
                  <td>${row.department}</td>
                  <td>${row.leaveType}</td>
                  <td>${new Date(row.fromDate).toLocaleDateString()}</td>
                  <td>${new Date(row.toDate).toLocaleDateString()}</td>
                  <td>${calculateDuration(row.fromDate, row.toDate)}</td>
                  <td>${row.status}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `;

      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const newWindow = window.open(url, '_blank');
      
      if (newWindow) {
        newWindow.onload = () => {
          setTimeout(() => {
            newWindow.print();
            URL.revokeObjectURL(url);
          }, 250);
        };
      }
      
      setSuccessMessage("PDF print dialog opened!");
    } catch (err) {
      console.error('Export to PDF failed:', err);
      setError(`PDF Export failed: ${err.message || 'Unknown error.'}`);
    } finally {
      setIsLoading(false);
      setLoadingType("");
    }
  }, [filteredRequests, today, calculateDuration]);

  const handlePrevPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(prev + 1, paginationData.totalPages));
  }, [paginationData.totalPages]);

  const handleRefresh = useCallback(async () => {
    setLoadingType("data");
    await fetchRequests();
    setLoadingType("");
    setSuccessMessage("Data refreshed!");
  }, []);

  // Modal Openers
  const openApproveModal = (request) => setApproveModal({ isOpen: true, request, remarks: "" });
  const openRejectModal = (request) => setRejectModal({ isOpen: true, request, remarks: "" });
  const openProcessModal = (request) => setProcessModal({ isOpen: true, request });

  // Modal Closers
  const closeApproveModal = () => setApproveModal({ isOpen: false, request: null, remarks: "" });
  const closeRejectModal = () => setRejectModal({ isOpen: false, request: null, remarks: "" });
  const closeProcessModal = () => setProcessModal({ isOpen: false, request: null });

  // Handlers (Refresh data after action)
  const handleActionSuccess = () => {
    closeApproveModal();
    closeRejectModal();
    closeProcessModal();
    fetchRequests();
    setSuccessMessage("Action completed successfully!");
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      Approved: "bg-green-100 text-green-800",
      Rejected: "bg-red-100 text-red-800",
      Pending: "bg-yellow-100 text-yellow-800",
      Processing: "bg-blue-100 text-blue-800",
      Finalizing: "bg-purple-100 text-purple-800",
    };
    return statusStyles[status] || "bg-gray-100 text-gray-800";
  };

  const { totalPages, startIndex, endIndex, currentItems } = paginationData;

  if (isLoading && loadingType !== "CSV" && loadingType !== "PDF") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800 mx-auto mb-4"></div>
          <p className="text-gray-800">Loading leave requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col bg-gradient-to-br from-neutral-100 to-stone-50 rounded-xl shadow-xl p-7 w-full overflow-hidden text-gray-800 transition-all duration-300 ${sidebarOpen ? 'max-w-[1400px] xl:max-w-[77vw]' : 'max-w-[1600px] xl:max-w-[88vw]'}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Leave Requests</h2>
          <p className="text-sm text-gray-800 mt-1">Manage employee leave requests</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
            title="Refresh data"
            aria-label="Refresh data"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <span className="text-sm text-gray-800 bg-[#F8F9FA] px-4 py-2 rounded-lg shadow-md">
            Date today: <span className="text-gray-800 font-semibold">{today}</span>
          </span>
        </div>
      </div>

      <hr className="mb-6 border-[1px] border-[#274b46]" />

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded mb-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 mt-0.5" />
          <p>{error}</p>
        </div>
      )}
      {successMessage && (
        <div className="bg-green-50 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded mb-4 flex items-start gap-3">
          <Check className="w-5 h-5 mt-0.5" />
          <p>{successMessage}</p>
        </div>
      )}

      {/* Filters & Search (Same UI as before) */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6 items-start bg-[#F8F9FA] p-4 rounded-lg shadow-md">
        <div className="md:col-span-1">
          <select
            value={filters.department}
            onChange={(e) => handleFilterChange("department", e.target.value)}
            className="w-full bg-[#F8F9FA] border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Department</option>
            {departments.map((dept) => <option key={dept} value={dept}>{dept}</option>)}
          </select>
        </div>
        <div className="md:col-span-1">
          <select
            value={filters.employee}
            onChange={(e) => handleFilterChange("employee", e.target.value)}
            className="w-full bg-[#F8F9FA] border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Employee</option>
            {uniqueEmployees.map((emp) => <option key={emp} value={emp}>{emp}</option>)}
          </select>
        </div>
        {/* Date Filters */}
        <div className="relative md:col-span-1">
           <input type="date" value={filters.fromDate} onChange={(e) => handleFilterChange("fromDate", e.target.value)} className="w-full bg-[#F8F9FA] border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div className="relative md:col-span-1">
           <input type="date" value={filters.toDate} onChange={(e) => handleFilterChange("toDate", e.target.value)} className="w-full bg-[#F8F9FA] border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div className="flex gap-2 md:col-span-2">
          <button onClick={handleApplyFilters} className="flex-1 bg-white border px-3 py-2 rounded-lg text-sm">Apply</button>
          <button onClick={handleClear} className="flex-1 bg-white border px-3 py-2 rounded-lg text-sm">Clear</button>
        </div>
      </div>

      {/* Search & Export */}
      <div className="flex justify-between items-center mb-6">
         <div className="relative w-80">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
            <input type="text" value={searchQuery} onChange={handleSearchChange} placeholder="Search..." className="pl-10 pr-4 py-2 bg-[#F8F9FA] border rounded-lg w-full text-sm" />
         </div>
         <div className="flex items-center space-x-3">
             <button onClick={handleExportCSV} className="text-green-700 text-sm font-medium flex items-center gap-1"><Download className="w-4 h-4" /> CSV</button>
             <button onClick={handleExportPDF} className="text-red-700 text-sm font-medium flex items-center gap-1"><FileText className="w-4 h-4" /> PDF</button>
         </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-hidden rounded-xl bg-[#F8F9FA] p-1">
        <div className="overflow-x-auto bg-[#F8F9FA] rounded-lg">
          <table className="w-full min-w-[1400px]">
            <thead className="bg-[#274b46] text-[#F8F9FA]">
              <tr>
                {["Status", "Department", "Employee ID", "Employee Name", "Leave Type", "From Date", "To Date", "Duration", "Actions"].map((header) => (
                  <th key={header} className="px-6 py-4 text-left text-sm font-bold tracking-wide">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentItems.length ? (
                currentItems.map((item) => (
                  <tr key={item.id} className="hover:bg-[#34645c] transition-colors">
                    <td className="px-6 py-4">
                      <span className={`${getStatusBadge(item.status)} px-3 py-1 text-sm font-medium inline-block`} style={{borderRadius: '20px'}}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800">{item.department}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">{item.employee_id}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">{item.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">{item.leaveType}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">{new Date(item.fromDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">{new Date(item.toDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">{calculateDuration(item.fromDate, item.toDate)}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {item.status === "Pending" && (
                          <>
                            <button onClick={() => openProcessModal(item)} className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-semibold">Process</button>
                            <button onClick={() => openRejectModal(item)} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded text-xs font-semibold">Reject</button>
                          </>
                        )}
                        {item.status === "Processing" && (
                             <span className="text-blue-600 text-xs italic">Waiting for employee</span>
                        )}
                        {item.status === "Finalizing" && (
                          <>
                            <button onClick={() => openApproveModal(item)} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded text-xs font-semibold">Approve</button>
                            <button onClick={() => openRejectModal(item)} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded text-xs font-semibold">Reject</button>
                          </>
                        )}
                        {(item.status === "Approved" || item.status === "Rejected") && (
                            <span className="text-gray-400 text-xs italic">Completed</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="9" className="px-6 py-12 text-center">No records found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {!isLoading && filteredRequests.length > 0 && (
        <div className="flex justify-between items-center mt-6">
          <div className="text-sm text-gray-800">Showing {startIndex + 1}–{Math.min(endIndex, filteredRequests.length)} of {filteredRequests.length}</div>
          <div className="flex items-center space-x-2">
            <button onClick={handlePrevPage} disabled={currentPage === 1} className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50">Previous</button>
            <span className="text-sm px-4 py-2 bg-gray-50 rounded-lg font-semibold">Page {currentPage}</span>
            <button onClick={handleNextPage} disabled={currentPage === totalPages} className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50">Next</button>
          </div>
        </div>
      )}

      <ApproveModal
        isOpen={approveModal.isOpen}
        request={approveModal.request}
        remarks={approveModal.remarks}
        onRemarksChange={(remarks) => setApproveModal(prev => ({ ...prev, remarks }))}
        onConfirm={handleActionSuccess}
        onCancel={closeApproveModal}
      />

      <RejectModal
        isOpen={rejectModal.isOpen}
        request={rejectModal.request}
        remarks={rejectModal.remarks}
        onRemarksChange={(remarks) => setRejectModal(prev => ({ ...prev, remarks }))}
        onConfirm={handleActionSuccess}
        onCancel={closeRejectModal}
      />

      <ProcessModal
        isOpen={processModal.isOpen}
        request={processModal.request}
        onConfirm={handleActionSuccess}
        onCancel={closeProcessModal}
      />
    </div>
  );
};

export default LeaveRequestsTable;
