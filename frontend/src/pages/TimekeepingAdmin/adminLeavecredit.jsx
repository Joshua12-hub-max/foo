import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Download, FileText, RefreshCw, Plus, AlertCircle, Check, Search } from "lucide-react";

// API
import { leaveApi } from "../../api/leaveApi";
import { getEmployees } from "../../api/employeeApi";

// Modal
import AddCreditModal from "../../components/Custom/LeaveCreditAdminComponents/Modals/AddCreditModal";

const ITEMS_PER_PAGE = 10;

const LeaveCredit = () => {
  const today = useMemo(() => new Date().toLocaleDateString("en-US"), []);
  
  const [leaveData, setLeaveData] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingType, setLoadingType] = useState("");
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [creditForm, setCreditForm] = useState({
    employeeId: "",
    employeeName: "",
    department: "",
    creditType: "Vacation",
    credits: "",
  });

  const searchTimeoutRef = useRef(null);

  // Fetch Data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setLoadingType("data");
    setError(null);
    try {
        const [creditsRes, employeesRes] = await Promise.all([
            leaveApi.getAllCredits(),
            getEmployees()
        ]);

        if (creditsRes.data && creditsRes.data.credits) {
            const mapped = creditsRes.data.credits.map(c => ({
                id: c.id,
                employeeId: c.employee_id,
                employeeName: `${c.first_name} ${c.last_name}`,
                department: c.department,
                creditType: c.credit_type,
                balance: c.balance
            }));
            setLeaveData(mapped);
        }

        if (employeesRes.data && employeesRes.data.employees) {
            setEmployees(employeesRes.data.employees);
        }

    } catch (err) {
        console.error("Failed to fetch data:", err);
        setError("Failed to load data.");
    } finally {
        setIsLoading(false);
        setLoadingType("");
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
  }, [debouncedSearchTerm]);

  const filteredData = useMemo(() => {
    let data = leaveData;
    const query = debouncedSearchTerm.toLowerCase();
    if (query) {
      data = data.filter(
        (item) =>
          item.employeeName.toLowerCase().includes(query) ||
          item.employeeId.toLowerCase().includes(query) ||
          item.department.toLowerCase().includes(query) ||
          item.creditType.toLowerCase().includes(query)
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
    await fetchData();
    setSuccessMessage("Data refreshed successfully!");
  }, [fetchData]);

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
      const headers = ['Employee ID', 'Employee Name', 'Department', 'Credit Type', 'Balance'];
      const csvContent = [
        headers.join(','),
        ...filteredData.map(row => [
          row.employeeId,
          row.employeeName,
          row.department,
          row.creditType,
          row.balance
        ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `leave_credits_${today.replace(/\//g, '-')}.csv`);
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
      
      const headers = ['Employee ID', 'Employee Name', 'Department', 'Credit Type', 'Balance'];
      
      let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Leave Credits Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; font-size: 24px; margin-bottom: 10px; }
            .meta { color: #666; font-size: 14px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th { background-color: #274b46; color: white; padding: 10px; text-align: left; font-weight: bold; }
            td { padding: 8px; border-bottom: 1px solid #e2e8f0; }
            tr:hover { background-color: #f8fafc; }
            @media print {
              body { margin: 0; }
              @page { margin: 1cm; }
            }
          </style>
        </head>
        <body>
          <h1>Leave Credits Report</h1>
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
                  <td>${row.creditType}</td>
                  <td>${row.balance}</td>
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
    
    // If employee selected, fill in details
    if (name === 'employeeId') {
        const selectedEmp = employees.find(emp => emp.employee_id === value);
        if (selectedEmp) {
            setCreditForm(prev => ({
                ...prev,
                employeeId: value,
                employeeName: `${selectedEmp.first_name} ${selectedEmp.last_name}`,
                department: selectedEmp.department || ''
            }));
        }
    } else {
        setCreditForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSaveCredit = async () => {
    try {
        await leaveApi.addOrUpdateCredit({
            employeeId: creditForm.employeeId,
            creditType: creditForm.creditType,
            balance: parseInt(creditForm.credits, 10)
        });

        setSuccessMessage("Leave credit updated successfully!");
        setIsModalOpen(false);
        setCreditForm({
            employeeId: "",
            employeeName: "",
            department: "",
            creditType: "Vacation",
            credits: "",
        });
        await fetchData();
    } catch (err) {
        console.error("Failed to save credit:", err);
        setError("Failed to save credit.");
    }
  };

  const { startIndex, endIndex, currentItems } = paginationData;

  if (isLoading && loadingType === "data") {
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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-neutral-100 to-stone-50 rounded-xl shadow-xl p-7 w-full overflow-hidden text-gray-800">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Leave Credits</h2>
          <p className="text-sm text-gray-800 mt-1">Manage employee leave balances</p>
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
          <span className="text-sm text-gray-800 bg-[#F8F9FA] px-4 py-2 border-[2px] border-[#274b46] rounded-lg shadow-sm">
            Date today: <span className="text-gray-800 font-semibold">{today}</span>
          </span>
        </div>
      </div>

      <hr className="mb-6 border-[#274b46]" />

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded mb-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 mt-0.5" />
          <div>
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border-l-4 border-[#274b46] text-green-700 px-4 py-3 rounded mb-4 flex items-start gap-3">
          <Check className="w-5 h-5 mt-0.5" />
          <div>
            <p className="font-medium">Success</p>
            <p className="text-sm">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Search and Actions */}
      <div className="flex justify-between items-center mb-6 bg-[#274b46] p-4 rounded-lg shadow-md">
        <div className="relative w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#274b46]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search..."
            disabled={isLoading}
            className="pl-10 pr-4 py-2 bg-[#F8F9FA] border border-gray-300 rounded-lg shadow-md w-full text-sm focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-[#F8F9FA] border border-gray-300 text-gray-800 font-semibold px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition-all shadow-md flex items-center gap-2"
          >
            <Plus size={18} />
            Add/Update Credit
          </button>
        </div>
      </div>

      {/* Export */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-3">
          <span className="text-sm font-semibold text-gray-800">Export:</span>
          <button onClick={handleExportCSV} disabled={isLoading || filteredData.length === 0} className="text-green-700 text-sm hover:underline flex items-center gap-1">
            <Download className="w-4 h-4" /> CSV
          </button>
          <button onClick={handleExportPDF} disabled={isLoading || filteredData.length === 0} className="text-red-700 text-sm hover:underline flex items-center gap-1">
            <FileText className="w-4 h-4" /> PDF
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-hidden rounded-xl bg-[#F8F9FA] p-1">
        <div className="overflow-x-auto bg-[#F8F9FA] rounded-lg">
          <table className="w-full">
            <thead className="bg-[#274b46] text-[#F8F9FA]">
              <tr>
                {["Employee ID", "Employee Name", "Department", "Credit Type", "Balance"].map((header) => (
                  <th key={header} className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentItems.length ? (
                currentItems.map((item) => (
                  <tr key={`${item.employeeId}-${item.creditType}`} className="hover:bg-[#34645c] transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-800">{item.employeeId}</td>
                    <td className="px-6 py-4 text-sm text-gray-800 font-medium">{item.employeeName}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">{item.department}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">{item.creditType}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-800">{item.balance}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <p className="text-gray-500">No records found</p>
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
            Showing {startIndex + 1}–{Math.min(endIndex, filteredData.length)} of {filteredData.length}
          </div>
          <div className="flex gap-2">
            <button onClick={handlePrevPage} disabled={currentPage === 1} className="px-4 py-2 border rounded-lg">Previous</button>
            <button onClick={handleNextPage} disabled={currentPage === paginationData.totalPages} className="px-4 py-2 border rounded-lg">Next</button>
          </div>
        </div>
      )}

      {/* Modal */}
      <AddCreditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveCredit}
        formData={creditForm}
        onChange={handleModalChange}
        employees={employees}
      />
    </div>
  );
}

export default LeaveCredit;
