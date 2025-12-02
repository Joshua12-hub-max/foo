/**
 * Export data to CSV file
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Name of the CSV file
 */
export const exportToCSV = (data, filename = 'export.csv') => {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return false;
  }

  try {
    // Get headers from first object
    const headers = Object.keys(data[0]);
    
    // Create CSV content
    const csvContent = [
      // Header row
      headers.join(','),
      // Data rows
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Handle values with commas or quotes
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value ?? '';
        }).join(',')
      )
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    return true;
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    return false;
  }
};

/**
 * Format leave request data for CSV export
 * @param {Array} leaveRequests - Array of leave request objects
 * @returns {Array} Formatted data ready for CSV export
 */
export const formatLeaveRequestsForCSV = (leaveRequests) => {
  return leaveRequests.map(request => ({
    'Employee ID': request.employeeId || '',
    'Employee Name': request.employeeName || '',
    'Leave Type': request.leaveType || '',
    'Start Date': request.startDate || '',
    'End Date': request.endDate || '',
    'Days': request.days || '',
    'Reason': request.reason || '',
    'Status': request.status || '',
    'Submitted Date': request.submittedDate || '',
    'Approved By': request.approvedBy || '',
    'Approved Date': request.approvedDate || ''
  }));
};
