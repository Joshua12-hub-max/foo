import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Download, FileText, RefreshCw, AlertCircle, Check, Search, Plus } from "lucide-react";
import AddCreditModal from "../../components/Modal UI/adminleavecredit/Addcredit";

const ITEMS_PER_PAGE = 10;

export default function LeaveCredit() {
  const today = useMemo(() => new Date().toLocaleDateString("en-US"), []);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingType, setLoadingType] = useState("");
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const searchTimeoutRef = useRef(null);

  // Modal form state
  const [creditForm, setCreditForm] = useState({
    employeeName: "",
    department: "",
    credits: "",
    date: new Date().toISOString().split("T")[0],
  });

  // Sample data as state
  const [leaveData, setLeaveData] = useState([]);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  // Auto-dismiss error
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Auto-dismiss success
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  // Search + filter logic
  const filteredData = useMemo(() => {
    let data = leaveData;

    const query = debouncedSearchTerm.toLowerCase();
    if (query) {
      data = data.filter(
        (item) =>
          item.employeeName.toLowerCase().includes(query) ||
          item.employeeId.toLowerCase().includes(query) ||
          item.department.toLowerCase().includes(query) ||
          item.date.toLowerCase().includes(query) ||
          String(item.totalCredits).includes(query)
      );
    }

    return data;
  }, [debouncedSearchTerm, leaveData]);

  // Pagination
  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const currentItems = filteredData.slice(startIndex, endIndex);
    return { totalPages, startIndex, endIndex, currentItems };
  }, [filteredData, currentPage]);

  const handlePrevPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(prev + 1, paginationData.totalPages));
  }, [paginationData.totalPages]);

  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    setLoadingType("data");
    setError(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setSuccessMessage("Data refreshed successfully!");
    } catch (err) {
      console.error('Refresh failed:', err);
      setError(`Refresh failed: ${err.message || 'Unknown error. Please try again.'}`);
    } finally {
      setIsLoading(false);
      setLoadingType("");
    }
  }, []);

  // Export CSV
  const handleExportCSV = useCallback(async () => {
    if (filteredData.length === 0) {
      setError("No data available to export.");
      return;
    }
    setIsLoading(true);
    setLoadingType("CSV");
    setError(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      const headers = ['Employee ID', 'Employee Name', 'Department', 'Date', 'Total Credits'];
      const csvContent = [
        headers.join(','),
        ...filteredData.map(row => [
          row.employeeId,
          row.employeeName,
          row.department,
          row.date,
          row.totalCredits
        ].map(field => `"${field.replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `leave_information_${today.replace(/\//g, '-')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setSuccessMessage("CSV exported successfully!");
    } catch (err) {
      console.error('Export to CSV failed:', err);
      setError(`CSV Export failed: ${err.message || 'Unknown error. Please try again.'}`);
    } finally {
      setIsLoading(false);
      setLoadingType("");
    }
  }, [filteredData, today]);

  // Export PDF
  const handleExportPDF = useCallback(async () => {
    if (filteredData.length === 0) {
      setError("No data available to export.");
      return;
    }
    setIsLoading(true);
    setLoadingType("PDF");
    setError(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const headers = ['Employee ID', 'Employee Name', 'Department', 'Date', 'Total Credits'];
      
      let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Leave Information Report</title>
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
          <h1>Leave Information Report</h1>
          <div class="meta">Generated on: ${today}</div>
          <table>
            <thead>
              <tr>
                ${headers.map(h => `<th>${h}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${filteredData.map(row => `
                <tr>
                  <td>${row.employeeId}</td>
                  <td>${row.employeeName}</td>
                  <td>${row.department}</td>
                  <td>${row.date}</td>
                  <td>${row.totalCredits}</td>
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
      setError(`PDF Export failed: ${err.message || 'Unknown error. Please try again.'}`);
    } finally {
      setIsLoading(false);
      setLoadingType("");
    }
  }, [filteredData, today]);

  // Modal Handlers
  const handleModalChange = (e) => {
    const { name, value } = e.target;
    setCreditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveCredit = () => {
    const newId = Date.now();
    const newEmployeeId = `EMP${(leaveData.length + 1).toString().padStart(3, '0')}`;
    const newCredit = {
      id: newId,
      employeeId: newEmployeeId,
      employeeName: creditForm.employeeName,
      department: creditForm.department,
      date: creditForm.date,
      totalCredits: parseInt(creditForm.credits, 10) || 0,
    };

    console.log("Saved Leave Credit:", newCredit);
    setLeaveData((prev) => [...prev, newCredit]);
    setIsModalOpen(false);
    setCreditForm({
      employeeName: "",
      department: "",
      credits: "",
      date: new Date().toISOString().split("T")[0],
    });
    setSuccessMessage("Leave credit added successfully!");
  };

  const { totalPages, startIndex, endIndex, currentItems } = paginationData;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#274b46] mx-auto mb-4"></div>
          <p className="text-gray-800">Processing {loadingType}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-neutral-100 to-stone-100 rounded-xl p-6 mx-auto w-full max-w-[95vw] text-gray-800">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Leave Credits</h2>
          <p className="text-sm text-gray-800 mt-1">Employee leave management</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="text-[#274b46] hover:text-gray-800 transition-colors disabled:opacity-50"
            title="Refresh data"
            aria-label="Refresh data"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <span className="text-sm text-gray-800 bg-[#F8F9FA] px-4 py-2 border border-gray-300 rounded-lg shadow-md">
            Date today: <span className="text-gray-800 font-semibold">{today}</span>
          </span>
        </div>
      </div>

      <hr className="mb-6 border-[1px] border-[#274b46]" />

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded mb-4 flex items-start gap-3 animate-slide-down" role="alert" aria-live="assertive">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-700 hover:text-red-900"
            aria-label="Dismiss error"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border-l-4 border-[#274b46] text-green-700 px-4 py-3 rounded mb-4 flex items-start gap-3 animate-slide-down" role="alert" aria-live="polite">
          <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium">Success</p>
            <p className="text-sm">{successMessage}</p>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-green-700 hover:text-green-900"
            aria-label="Dismiss success message"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Search and Actions */}
      <div className="flex justify-between items-center mb-6 bg-[#F8F9FA] p-4 rounded-lg shadow-md">
        {/* Search */}
        <div className="relative w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#274b46]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, ID, department..."
            disabled={isLoading}
            className="pl-10 pr-4 py-2 bg-[#F8F9FA] border border-gray-300 rounded-lg shadow-md w-full text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
            aria-label="Search employees"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4">
          {searchTerm && (
            <div className="text-sm text-gray-800">
              Found <span className="font-semibold text-gray-800">{filteredData.length}</span> result{filteredData.length !== 1 ? 's' : ''}
            </div>
          )}
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-[#F8F9FA] border border-gray-300 text-gray-800 font-semibold px-4 py-2 rounded-lg text-sm transition-all hover:bg-[#FFFFFF] active:scale-95 shadow-md flex items-center gap-2"
          >
            <Plus size={18} />
            Add Credits
          </button>
        </div>
      </div>

      {/* Export Section */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-3">
          <span className="text-sm font-semibold text-gray-800">Export Options:</span>
          <button
            onClick={handleExportCSV}
            disabled={isLoading || filteredData.length === 0}
            className="text-green-700 flex items-center text-sm font-medium space-x-1 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Export to CSV"
          >
            <Download className="w-4 h-4" />
            <span>CSV</span>
          </button>
          <button
            onClick={handleExportPDF}
            disabled={isLoading || filteredData.length === 0}
            className="text-red-700 flex items-center text-sm font-medium space-x-1 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Export to PDF"
          >
            <FileText className="w-4 h-4" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-hidden rounded-xl bg-[#F8F9FA] p-1">
        <div className="overflow-x-auto bg-gray-50 rounded-lg">
          <table className="w-full">
            <thead className="bg-[#274b46] text-[#F8F9FA]">
              <tr>
                {["Employee ID", "Employee Name", "Department", "Date", "Total Credits"].map((header) => (
                  <th key={header} className="px-6 py-4 text-left text-sm font-bold  tracking-wide whitespace-nowrap">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentItems.length ? (
                currentItems.map((item) => (
                  <tr key={item.id} className="hover:bg-[#34645c]  transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-800">{item.employeeId}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">{item.employeeName}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">{item.department}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">{item.date}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-800">{item.totalCredits}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <Search className="w-12 h-12 mb-3 opacity-50" />
                      <p className="text-lg font-medium">No records found</p>
                      <p className="text-sm mt-1">
                        {debouncedSearchTerm
                          ? "Try adjusting your filters or search terms" 
                          : "No data available"}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {!isLoading && filteredData.length > 0 && (
        <div className="flex justify-between items-center mt-6">
          <div className="text-sm text-gray-800">
            Showing <span className="font-semibold text-gray-800">{startIndex + 1}–{Math.min(endIndex, filteredData.length)}</span> of <span className="font-semibold text-gray-800">{filteredData.length}</span> records
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1 || isLoading}
              className="px-4 py-2 bg-#F8F9FA border border-gray-300 rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all text-sm font-medium text-gray-800"
              aria-label="Previous page"
            >
              Previous
            </button>
            <span className="text-sm px-4 py-2 bg-gray-50 text-gray-800 rounded-lg font-semibold">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages || totalPages === 0 || isLoading}
              className="px-4 py-2 bg-[#F8F9FA] border border-gray-300 rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all text-sm font-medium text-gray-800"
              aria-label="Next page"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Add Credit Modal */}
      <AddCreditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveCredit}
        formData={creditForm}
        onChange={handleModalChange}
      />
    </div>
  );
}