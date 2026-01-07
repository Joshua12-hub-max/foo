import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { leaveApi } from "@api";
import { fetchEmployees } from "@api";
import { ITEMS_PER_PAGE } from '../Constants/adminLeaveCredit.constants';

export const useAdminLeaveCredit = () => {
  const today = useMemo(() => {
    const date = new Date().toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' });
    return `Date today: ${date}`;
  }, []);
  
  const [activeTab, setActiveTab] = useState('credits');
  const [leaveData, setLeaveData] = useState([]);
  const [rawCredits, setRawCredits] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [creditRequests, setCreditRequests] = useState([]);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingType, setLoadingType] = useState("");
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionModal, setActionModal] = useState({ isOpen: false, request: null, action: null });
  
  const [creditForm, setCreditForm] = useState({ employeeId: "", employeeName: "", department: "", creditType: "Vacation", credits: "" });

  const searchTimeoutRef = useRef(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setLoadingType("data");
    setError(null);
    try {
      const [creditsRes, employeesRes, requestsRes] = await Promise.all([
        leaveApi.getAllCredits(),
        fetchEmployees(),
        leaveApi.getAllCreditRequests()
      ]);

      if (creditsRes.data && creditsRes.data.credits) {
        setRawCredits(creditsRes.data.credits);
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

      if (employeesRes.employees) {
        setEmployees(employeesRes.employees);
      }
      
      if (requestsRes.data && requestsRes.data.requests) {
        setCreditRequests(requestsRes.data.requests);
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
      setError("Failed to load data.");
    } finally {
      setIsLoading(false);
      setLoadingType("");
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => setDebouncedSearchTerm(searchTerm), 300);
    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
  }, [searchTerm]);

  useEffect(() => { if (error) { const t = setTimeout(() => setError(null), 5000); return () => clearTimeout(t); } }, [error]);
  useEffect(() => { if (successMessage) { const t = setTimeout(() => setSuccessMessage(null), 3000); return () => clearTimeout(t); } }, [successMessage]);
  useEffect(() => { setCurrentPage(1); }, [debouncedSearchTerm, activeTab]);

  const filteredData = useMemo(() => {
    const query = debouncedSearchTerm.toLowerCase();
    if (!query) return leaveData;
    return leaveData.filter(item =>
      item.employeeName.toLowerCase().includes(query) ||
      item.employeeId.toLowerCase().includes(query) ||
      item.department.toLowerCase().includes(query) ||
      item.creditType.toLowerCase().includes(query)
    );
  }, [debouncedSearchTerm, leaveData]);
  
  const filteredRequests = useMemo(() => {
    const query = debouncedSearchTerm.toLowerCase();
    if (!query) return creditRequests;
    return creditRequests.filter(req =>
      `${req.first_name} ${req.last_name}`.toLowerCase().includes(query) ||
      req.employee_id?.toLowerCase().includes(query) ||
      req.credit_type?.toLowerCase().includes(query)
    );
  }, [debouncedSearchTerm, creditRequests]);

  const paginationData = useMemo(() => {
    const dataToUse = activeTab === 'credits' ? filteredData : filteredRequests;
    const totalPages = Math.ceil(dataToUse.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const currentItems = dataToUse.slice(startIndex, endIndex);
    return { totalPages, startIndex, endIndex, currentItems, total: dataToUse.length };
  }, [filteredData, filteredRequests, currentPage, activeTab]);

  const handlePrevPage = useCallback(() => setCurrentPage(p => Math.max(p - 1, 1)), []);
  const handleNextPage = useCallback(() => setCurrentPage(p => Math.min(p + 1, paginationData.totalPages)), [paginationData.totalPages]);
  const handleRefresh = useCallback(async () => { await fetchData(); setSuccessMessage("Data refreshed!"); }, [fetchData]);

  const handleExportCSV = useCallback(async () => {
    if (filteredData.length === 0) { setError("No data to export."); return; }
    try {
      const ExcelJS = await import('exceljs');
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('LeaveCredits');

      // Define Columns
      worksheet.columns = [
        { header: '', key: 'col1', width: 15 },
        { header: '', key: 'col2', width: 25 },
        { header: '', key: 'col3', width: 20 },
        { header: '', key: 'col4', width: 15 },
        { header: '', key: 'col5', width: 12 }
      ];

      // Title Row
      worksheet.addRow(['LEAVE CREDITS REPORT']);
      worksheet.addRow([`Generated At: ${new Date().toLocaleString()}`]);
      worksheet.addRow([]);

      // Style Title
      worksheet.getRow(1).font = { bold: true, size: 14 };
      worksheet.mergeCells('A1:E1');
      worksheet.mergeCells('A2:E2');

      // Header Row
      const headerRow = worksheet.addRow([
        'Employee ID', 'Employee Name', 'Department', 'Credit Type', 'Balance'
      ]);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E293B' }
      };

      // Data Rows
      filteredData.forEach(row => {
        worksheet.addRow([
          row.employeeId || '-',
          row.employeeName || '-',
          row.department || '-',
          row.creditType || '-',
          row.balance || 0
        ]);
      });

      // Write and Download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `Leave_Credits_${new Date().getTime()}.xlsx`;
      anchor.click();
      window.URL.revokeObjectURL(url);

      setSuccessMessage("Excel exported!");
    } catch (err) {
      console.error('Export failed:', err);
      setError("Export failed.");
    }
  }, [filteredData]);

  const handleModalChange = (e) => {
    const { name, value } = e.target;
    if (name === 'employeeId') {
      const emp = employees.find(em => em.employee_id === value);
      if (emp) setCreditForm(p => ({ ...p, employeeId: value, employeeName: `${emp.first_name} ${emp.last_name}`, department: emp.department || '' }));
    } else {
      setCreditForm(p => ({ ...p, [name]: value }));
    }
  };

  const handleSaveCredit = async () => {
    try {
      await leaveApi.addOrUpdateCredit({ employeeId: creditForm.employeeId, creditType: creditForm.creditType, balance: parseInt(creditForm.credits, 10) });
      setSuccessMessage("Leave credit updated!");
      setIsModalOpen(false);
      setCreditForm({ employeeId: "", employeeName: "", department: "", creditType: "Vacation", credits: "" });
      await fetchData();
    } catch (err) { setError("Failed to save credit."); }
  };

  const handleApprove = async (id, remarks) => {
    try { await leaveApi.approveCreditRequest(id, remarks); setSuccessMessage("Request approved!"); await fetchData(); } catch (err) { setError("Failed to approve."); throw err; }
  };

  const handleReject = async (id, remarks) => {
    try { await leaveApi.rejectCreditRequest(id, remarks); setSuccessMessage("Request rejected."); await fetchData(); } catch (err) { setError("Failed to reject."); throw err; }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-';
  const pendingCount = creditRequests.filter(r => r.status === 'Pending').length;

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  const openActionModal = (request, action) => setActionModal({ isOpen: true, request, action });
  const closeActionModal = () => setActionModal({ isOpen: false, request: null, action: null });

  return { today, activeTab, setActiveTab, leaveData, rawCredits, employees, creditRequests, searchTerm, setSearchTerm, currentPage, isLoading, loadingType,
    error, successMessage, setError, setSuccessMessage, isModalOpen, actionModal, creditForm, filteredData, filteredRequests,
    paginationData, pendingCount, fetchData, handleRefresh, handlePrevPage, handleNextPage, handleExportCSV, handleModalChange, handleSaveCredit, 
    handleApprove, handleReject, formatDate, openModal, closeModal, openActionModal, closeActionModal
  };
};
