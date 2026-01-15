// ExcelJS import removed
import { EmployeeLeaveRequest } from '../types';

/**
 * Export leave request data to Excel
 * @param {Array} data - Array of leave request objects
 * @param {string} filename - Name of the file
 */
export const exportToCSV = async (data: any[], filename = 'leave_requests') => {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return false;
  }

  try {
    // Native CSV Export
    const headers = ['Employee ID', 'Employee Name', 'Leave Type', 'Start Date', 'End Date', 'Reason', 'Status'];
    const keys = ['employee_id', 'name', 'leaveType', 'fromDate', 'toDate', 'reason', 'status'];
    
    const csvRows = [headers.join(',')];

    data.forEach(row => {
      const rowData = keys.map(key => {
        const val = row[key] || '';
        return `"${String(val).replace(/"/g, '""')}"`;
      });
      csvRows.push(rowData.join(','));
    });

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const finalFilename = filename.endsWith('.csv') ? filename : `${filename}.csv`;
    link.setAttribute("download", finalFilename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
    return true;
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    return false;
  }
};

/**
 * Format leave request data for export
 * @param {Array} leaveRequests - Array of leave request objects
 * @returns {Array} Formatted data ready for export
 */
export const formatLeaveRequestsForCSV = (leaveRequests: EmployeeLeaveRequest[]) => {
  return leaveRequests.map(request => ({
    employee_id: request.employee_id || '',
    name: request.name || '',
    leaveType: request.leaveType || '',
    fromDate: request.fromDate || '',
    toDate: request.toDate || '',
    reason: request.reason || '',
    status: request.status || ''
  }));
};
