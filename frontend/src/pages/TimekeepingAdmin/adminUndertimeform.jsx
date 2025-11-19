import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { Download, FileText, Send, RefreshCw, AlertCircle, Check, Search, Plus, ClipboardList, X } from "lucide-react";
import { useOutletContext } from 'react-router-dom';

// Modal imports
import SendFormModal from "../../components/Modal UI/adminUndertime/SendForm";
import ReceiveFormModal from "../../components/Modal UI/adminUndertime/Recieved";
import ProcessModal from "../../components/Modal UI/adminUndertime/Process";
import ReviewModal from "../../components/Modal UI/adminUndertime/Reviewed";

const ITEMS_PER_PAGE = 10;

const TABLE_HEADERS = ["Department", "Employee ID", "Employee Name", "Review Request", "Process", "Send Form", "Receive Form"];

const Undertimeform = () => {
  const today = useMemo(() => new Date().toLocaleDateString("en-US"), []);
  const outletContext = useOutletContext?.() || { sidebarOpen: true };
  const { sidebarOpen = true } = outletContext;

  const [undertimeForms, setUndertimeForms] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingType, setLoadingType] = useState("");
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isSendFormModalOpen, setIsSendFormModalOpen] = useState(false);
  const [isReceivedModalOpen, setIsReceivedModalOpen] = useState(false);
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [selectedForm, setSelectedForm] = useState(null);
  const [sendFormRemarks, setSendFormRemarks] = useState("");
  const [receiveFormRemarks, setReceiveFormRemarks] = useState("");

  const searchTimeoutRef = useRef(null);

  // TODO: Add useEffect to fetch data from backend
  // useEffect(() => {
  //   const fetchUndertimeForms = async () => {
  //     setIsLoading(true);
  //     setLoadingType("data");
  //     try {
  //       const response = await fetch('YOUR_API_ENDPOINT');
  //       const data = await response.json();
  //       setUndertimeForms(data);
  //     } catch (err) {
  //       setError("Failed to load undertime forms");
  //     } finally {
  //       setIsLoading(false);
  //       setLoadingType("");
  //     }
  //   };
  //   fetchUndertimeForms();
  // }, []);

  const handleProcessNewUndertime = (newUndertime) => {
    // TODO: Send newUndertime to backend before updating state
    setUndertimeForms((prevForms) => [newUndertime, ...prevForms]);
    setSuccessMessage(`New undertime request for ${newUndertime.employeeName} has been processed and is pending review.`);
  };

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => setDebouncedSearchQuery(searchQuery), 300);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
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

  useEffect(() => setCurrentPage(1), [debouncedSearchQuery]);

  const handleSearchChange = useCallback((e) => setSearchQuery(e.target.value), []);

  const filteredForms = useMemo(() => {
    const query = debouncedSearchQuery.toLowerCase();
    if (!query) return undertimeForms;
    return undertimeForms.filter(item =>
      item.employeeName.toLowerCase().includes(query) ||
      item.id.toLowerCase().includes(query) ||
      item.reason.toLowerCase().includes(query) ||
      item.status.toLowerCase().includes(query)
    );
  }, [undertimeForms, debouncedSearchQuery]);

  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(filteredForms.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const currentItems = filteredForms.slice(startIndex, endIndex);
    return { totalPages, startIndex, endIndex, currentItems };
  }, [filteredForms, currentPage]);

  const handleExportCSV = useCallback(async () => {
    if (filteredForms.length === 0) {
      setError("No data available to export.");
      return;
    }
    setIsLoading(true);
    setLoadingType("CSV");
    setError(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      const headers = ["Employee ID", "Employee Name", "Reason", "Status", "Sent Date", "Received Date"];
      const csvContent = [
        headers.join(","),
        ...filteredForms.map(item => `${item.id},${item.employeeName},${item.reason},${item.status},${item.sentDate || 'N/A'},${item.receivedDate || 'N/A'}`)
      ].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `undertime_requests_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      setSuccessMessage("CSV exported successfully!");
    } catch (err) {
      console.error('Export to CSV failed:', err);
      setError(`CSV Export failed: ${err.message || 'Unknown error. Please try again.'}`);
    } finally {
      setIsLoading(false);
      setLoadingType("");
    }
  }, [filteredForms]);

  const handleExportPDF = useCallback(async () => {
    if (filteredForms.length === 0) {
      setError("No data available to export.");
      return;
    }
    setIsLoading(true);
    setLoadingType("PDF");
    setError(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      const headers = ["Employee ID", "Employee Name", "Reason", "Status", "Sent Date", "Received Date"];
      const htmlContent = `
        <html><head><title>Undertime Requests Report</title></head><body>
          <h1>Undertime Requests Report</h1>
          <p>Generated on: ${today}</p>
          <table border="1" style="border-collapse: collapse; width:100%;">
            <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
            <tbody>${filteredForms.map(row => `<tr><td>${row.id}</td><td>${row.employeeName}</td><td>${row.reason}</td><td>${row.status}</td><td>${row.sentDate || 'N/A'}</td><td>${row.receivedDate || 'N/A'}</td></tr>`).join('')}</tbody>
          </table>
        </body></html>
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
  }, [filteredForms, today]);

  const handlePrevPage = useCallback(() => setCurrentPage(prev => Math.max(prev - 1, 1)), []);
  const handleNextPage = useCallback(() => setCurrentPage(prev => Math.min(prev + 1, paginationData.totalPages)), [paginationData.totalPages]);

  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setLoadingType("data");
    try {
      // TODO: Re-fetch data from backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccessMessage("Data refreshed successfully!");
    } catch (err) {
      setError("Failed to refresh data. Please try again.");
    } finally {
      setIsLoading(false);
      setLoadingType("");
    }
  }, []);

  const handleOpenSendModal = useCallback((form) => {
    setSelectedForm(form);
    setSendFormRemarks("");
    setIsSendFormModalOpen(true);
  }, []);

  const handleOpenReceiveModal = useCallback((form) => {
    setSelectedForm(form);
    setReceiveFormRemarks("");
    setIsReceivedModalOpen(true);
  }, []);

  const handleConfirmSendForm = useCallback(() => {
    if (!selectedForm) return;
    // TODO: Send update to backend
    setUndertimeForms(prevForms => prevForms.map(form => 
      form.id === selectedForm.id 
        ? { ...form, status: "Form Sent", sentForm: "Sent", sentDate: new Date().toISOString().split('T')[0] } 
        : form 
    ));
    setSuccessMessage(`Form sent successfully for ${selectedForm.employeeName}`);
    setIsSendFormModalOpen(false);
    setSelectedForm(null);
    setSendFormRemarks("");
  }, [selectedForm]);

  const handleConfirmReceiveForm = useCallback(() => {
    if (!selectedForm) return;
    // TODO: Send update to backend
    setUndertimeForms(prevForms => prevForms.map(form => 
      form.id === selectedForm.id 
        ? { ...form, status: "Form Received", receivedForm: "Received", receivedDate: new Date().toISOString().split('T')[0] } 
        : form 
    ));
    setSuccessMessage(`Form received successfully for ${selectedForm.employeeName}`);
    setIsReceivedModalOpen(false);
    setSelectedForm(null);
    setReceiveFormRemarks("");
  }, [selectedForm]);

  const handleCancelSendForm = useCallback(() => {
    setIsSendFormModalOpen(false);
    setSelectedForm(null);
    setSendFormRemarks("");
  }, []);

  const handleCancelReceiveForm = useCallback(() => {
    setIsReceivedModalOpen(false);
    setSelectedForm(null);
    setReceiveFormRemarks("");
  }, []);


  const handleApprove = useCallback((id) => {
    // TODO: Send approval to backend
    setUndertimeForms(prevForms => prevForms.map(form => 
      form.id === id ? { ...form, reviewRequest: "Approved" } : form 
    ));
    setSuccessMessage(`Request for ${id} has been approved.`);
  }, []);

  const handleReject = useCallback((id, reason) => {
    // TODO: Send rejection to backend
    setUndertimeForms(prevForms => prevForms.map(form => 
      form.id === id ? { ...form, reviewRequest: "Rejected", rejectionReason: reason } : form 
    ));
    setSuccessMessage(`Request for ${id} has been rejected. Reason: ${reason}`);
  }, []);

  const getReviewStatusColor = useCallback((status) => ({
    "Approved": "bg-green-100 text-green-800",
    "Rejected": "bg-red-100 text-red-800",
    "Pending": "bg-yellow-100 text-yellow-800",
  }[status] || "bg-gray-100 text-gray-800"), []);

  const { totalPages, startIndex, endIndex, currentItems } = paginationData;

  if (isLoading && loadingType === "data") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800 mx-auto mb-4"></div>
          <p className="text-gray-800">Processing data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col bg-gradient-to-br from-neutral-100 to-stone-50 rounded-xl shadow-xl p-7 w-full overflow-hidden text-gray-800 transition-all duration-300 ${sidebarOpen ? 'max-w-[1400px] xl:max-w-[77vw]' : 'max-w-[1600px] xl:max-w-[88vw]'}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Undertime forms</h2>
          <p className="text-sm text-gray-800 mt-1">Employee undertime request form </p>
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
          <span className="text-sm text-gray-800 bg-[#F8F9FA] px-4 py-2 rounded-lg shadow-sm">
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
          <button onClick={() => setError(null)} className="text-red-700 hover:text-red-900" aria-label="Dismiss error">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded mb-4 flex items-start gap-3 animate-slide-down" role="alert" aria-live="polite">
          <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium">Success</p>
            <p className="text-sm">{successMessage}</p>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-green-700 hover:text-green-900" aria-label="Dismiss success message">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Action Buttons */}
      <div className="bg-[#F8F9FA] p-4 rounded-lg shadow-md mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          <button
            onClick={() => setIsReviewModalOpen(true)}
            className="bg-[#F8F9FA] border border-gray-300 text-gray-800 font-semibold px-4 py-2 rounded-lg text-sm hover:bg-[#FFFFFF] transition-all shadow-md flex items-center gap-2 justify-center"
          >
            <ClipboardList size={18} />
            Review Requests
          </button>

          <button
            onClick={() => setIsProcessModalOpen(true)}
            className="bg-[#F8F9FA] border border-gray-300 text-gray-800 font-semibold px-4 py-2 rounded-lg text-sm hover:bg-[#FFFFFF] transition-all shadow-md flex items-center gap-2 justify-center"
          >
            <Plus size={18} />
            Process
          </button>

          {(() => {
            const pendingSendForm = undertimeForms.find(f => f.status === "Pending Send");
            if (pendingSendForm) {
              return (
                <button
                  onClick={() => handleOpenSendModal(pendingSendForm)}
                  className="bg-[#F8F9FA] border border-gray-300 text-gray-800 font-semibold px-4 py-2 rounded-lg text-sm hover:bg-[#FFFFFF] transition-all shadow-md flex items-center gap-2 justify-center"
                >
                  <Send size={18} />
                  Send Form
                </button>
              );
            } else {
              return (
                <button
                  onClick={() => setError("No pending forms to send")}
                  disabled
                  className="bg-[#F8F9FA] border border-gray-300 text-gray-800 font-semibold px-4 py-2 rounded-lg text-sm hover:bg-[#FFFFFF] transition-all shadow-md flex items-center gap-2 justify-center opacity-50"
                >
                  <Send size={18} />
                  Send Form
                </button>
              );
            }
          })()}

          {(() => {
            const sentForm = undertimeForms.find(f => f.status === "Form Sent");
            if (sentForm) {
              return (
                <button
                  onClick={() => handleOpenReceiveModal(sentForm)}
                  className="bg-[#F8F9FA] border border-gray-300 text-gray-800 font-semibold px-4 py-2 rounded-lg text-sm hover:bg-[#FFFFFF] transition-all shadow-md flex items-center gap-2 justify-center"
                >
                  <FileText size={18} />
                  Received Request
                </button>
              );
            } else {
              return (
                <button
                  onClick={() => setError("No sent forms to receive")}
                  disabled
                  className="bg-[#F8F9FA] border border-gray-300 text-gray-800 font-semibold px-4 py-2 rounded-lg text-sm hover:bg-[#FFFFFF] transition-all shadow-md flex items-center gap-2 justify-center opacity-50"
                >
                  <FileText size={18} />
                  Received Request
                </button>
              );
            }
          })()}
        </div>
      </div>

      {/* Search */}
      <div className="flex justify-between items-center mb-6">
        <div className="relative w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#274b46]" />
          <input
            type="text"
            placeholder="Search by name, date, or reason..."
            value={searchQuery}
            onChange={handleSearchChange}
            disabled={isLoading}
            className="pl-10 pr-4 py-2 bg-[#F8F9FA] border border-gray-300 rounded-lg shadow-md w-full text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-200 transition-all disabled:opacity-50"
            aria-label="Search undertime requests"
          />
        </div>
        {searchQuery && (
          <div className="text-sm text-gray-600">
            Found <span className="font-semibold text-gray-800">{filteredForms.length}</span> result{filteredForms.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Export Options */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-3">
          <span className="text-sm font-semibold text-gray-800">Export Options:</span>
          <button
            onClick={handleExportCSV}
            disabled={isLoading || filteredForms.length === 0}
            className="text-green-700 flex items-center text-sm font-medium space-x-1 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Export to CSV"
          >
            <Download className="w-4 h-4" />
            <span>CSV</span>
          </button>
          <button
            onClick={handleExportPDF}
            disabled={isLoading || filteredForms.length === 0}
            className="text-red-700 flex items-center text-sm font-medium space-x-1 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Export to PDF"
          >
            <FileText className="w-4 h-4" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* Modern Table with Horizontal Scroll */}
      <div className="flex-1 overflow-hidden rounded-xl bg-[#F8F9FA] p-1">
        <div className="overflow-x-auto bg-[#F8F9FA] rounded-lg">
          <table className="w-full min-w-[1400px]">
            <thead className="bg-[#274b46] text-[#F8F9FA]">
              <tr>
                {TABLE_HEADERS.map((header, index) => (
                  <th key={index} className="px-6 py-4 text-left text-sm font-bold tracking-wide">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentItems.length ? (
                currentItems.map((item) => (
                  <tr key={item.id} className="hover:bg-[#34645c] transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-800">{item.department || "N/A"}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">{item.id}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">{item.employeeName}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-sm font-medium inline-block ${getReviewStatusColor(item.reviewRequest)}`} style={{ borderRadius: '20px' }}>
                        {item.reviewRequest || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800">{item.process || "N/A"}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">{item.sentForm || "N/A"}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">{item.receivedForm || "N/A"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <ClipboardList className="w-12 h-12 mb-3 opacity-50" />
                      <p className="text-lg font-medium">No undertime requests found</p>
                      <p className="text-sm mt-1">
                        {debouncedSearchQuery 
                          ? "Try adjusting your search terms" 
                          : "Create a new request to get started"}
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
      {!isLoading && filteredForms.length > 0 && (
        <div className="flex justify-between items-center mt-6">
          <div className="text-sm text-gray-800">
            Showing <span className="font-semibold text-gray-800">{startIndex + 1}–{Math.min(endIndex, filteredForms.length)}</span> of <span className="font-semibold text-gray-800">{filteredForms.length}</span> records
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1 || isLoading}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all text-sm font-medium text-gray-800"
              aria-label="Previous page"
            >
              Previous
            </button>
            <span className="text-sm px-4 py-2 bg-gray-50 text-gray-800 rounded-lg font-semibold">
              Page {currentPage} of {totalPages || 1}
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages || totalPages === 0 || isLoading}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all text-sm font-medium text-gray-800"
              aria-label="Next page"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        undertimeForms={undertimeForms}
        handleApprove={handleApprove}
        handleReject={handleReject}
      />
      <ProcessModal
        isOpen={isProcessModalOpen}
        onClose={() => setIsProcessModalOpen(false)}
        onProcess={handleProcessNewUndertime}
      />
      <SendFormModal
        isOpen={isSendFormModalOpen}
        form={selectedForm}
        remarks={sendFormRemarks}
        onRemarksChange={(e) => setSendFormRemarks(e.target.value)}
        onSend={handleConfirmSendForm}
        onCancel={handleCancelSendForm}
      />
      <ReceiveFormModal
        isOpen={isReceivedModalOpen}
        form={selectedForm}
        remarks={receiveFormRemarks}
        onRemarksChange={(e) => setReceiveFormRemarks(e.target.value)}
        onReceive={handleConfirmReceiveForm}
        onCancel={handleCancelReceiveForm}
      />
    </div>
  );
};

export default Undertimeform;