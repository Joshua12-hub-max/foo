import { exportToExcel } from '@/utils/excelExport';

/**
 * Export leave request data to Excel
 * @param {Array} data - Array of leave request objects
 * @param {string} filename - Name of the file
 */
export const exportToCSV = async (data, filename = 'leave_requests') => {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return false;
  }

  try {
    await exportToExcel({
      data,
      columns: [
        { header: 'Employee ID', key: 'employeeId', width: 15 },
        { header: 'Employee Name', key: 'employeeName', width: 25 },
        { header: 'Leave Type', key: 'leaveType', width: 15 },
        { header: 'Start Date', key: 'startDate', width: 15 },
        { header: 'End Date', key: 'endDate', width: 15 },
        { header: 'Days', key: 'days', width: 10 },
        { header: 'Reason', key: 'reason', width: 30 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Submitted Date', key: 'submittedDate', width: 15 },
        { header: 'Approved By', key: 'approvedBy', width: 20 }
      ],
      filename: filename.replace('.csv', ''),
      title: 'Leave Requests Report'
    });
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
export const formatLeaveRequestsForCSV = (leaveRequests) => {
  return leaveRequests.map(request => ({
    employeeId: request.employeeId || '',
    employeeName: request.employeeName || '',
    leaveType: request.leaveType || '',
    startDate: request.startDate || '',
    endDate: request.endDate || '',
    days: request.days || '',
    reason: request.reason || '',
    status: request.status || '',
    submittedDate: request.submittedDate || '',
    approvedBy: request.approvedBy || ''
  }));
};
