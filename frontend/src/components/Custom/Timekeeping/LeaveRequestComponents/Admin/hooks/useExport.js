import { useState, useCallback } from 'react';

/**
 * Custom hook for exporting data to CSV and PDF
 * @returns {Object} Export state and handlers
 */
export const useExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState(null);

  const calculateDuration = useCallback((fromDate, toDate) => {
    if (!fromDate || !toDate) return 'N/A';
    const from = new Date(fromDate);
    const to = new Date(toDate);
    if (isNaN(from) || isNaN(to)) return 'Invalid';
    const diffTime = to - from;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays > 0 ? `${diffDays} day${diffDays > 1 ? 's' : ''}` : '0 days';
  }, []);

  const handleExportCSV = useCallback(async (data) => {
    if (data.length === 0) {
      setExportError('No data available to export.');
      return;
    }
    
    try {
      setIsExporting(true);
      setExportError(null);
      
      const { exportToExcel } = await import('@/utils/excelExport');
      
      // Transform data for export
      const exportData = data.map(item => ({
        employeeId: item.employee_id,
        employeeName: item.name,
        department: item.department,
        leaveType: item.leaveType,
        fromDate: item.fromDate,
        toDate: item.toDate,
        duration: calculateDuration(item.fromDate, item.toDate),
        status: item.status
      }));
      
      await exportToExcel({
        data: exportData,
        columns: [
          { header: 'Employee ID', key: 'employeeId', width: 15 },
          { header: 'Employee Name', key: 'employeeName', width: 25 },
          { header: 'Department', key: 'department', width: 20 },
          { header: 'Leave Type', key: 'leaveType', width: 15 },
          { header: 'From Date', key: 'fromDate', width: 12 },
          { header: 'To Date', key: 'toDate', width: 12 },
          { header: 'Duration', key: 'duration', width: 12 },
          { header: 'Status', key: 'status', width: 12 }
        ],
        filename: `leave_requests_${new Date().toISOString().split('T')[0]}`,
        title: 'Leave Requests Report (Admin)'
      });
    } catch (err) {
      console.error('Export to Excel failed:', err);
      setExportError(`Excel Export failed: ${err.message || 'Unknown error.'}`);
    } finally {
      setIsExporting(false);
    }
  }, [calculateDuration]);

  const handleExportPDF = useCallback(async (data) => {
    if (data.length === 0) {
      setExportError('No data available to export.');
      return;
    }
    
    try {
      setIsExporting(true);
      setExportError(null);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const today = new Date().toLocaleDateString('en-US');
      const headers = ['ID', 'Employee Name', 'Dept', 'Type', 'From', 'To', 'Days', 'Status'];
      
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
              ${data.map(row => `
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
    } catch (err) {
      console.error('Export to PDF failed:', err);
      setExportError(`PDF Export failed: ${err.message || 'Unknown error.'}`);
    } finally {
      setIsExporting(false);
    }
  }, [calculateDuration]);

  return {
    isExporting,
    exportError,
    handleExportCSV,
    handleExportPDF
  };
};
