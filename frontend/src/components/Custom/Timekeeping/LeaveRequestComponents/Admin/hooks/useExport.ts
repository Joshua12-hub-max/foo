import { useState, useCallback } from 'react';
import { AdminLeaveRequest } from '../types';

/**
 * Custom hook for exporting data to CSV and PDF
 * @returns {Object} Export state and handlers
 */
export const useExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const calculateDuration = useCallback((fromDate: string, toDate: string): string => {
    if (!fromDate || !toDate) return 'N/A';
    const from = new Date(fromDate);
    const to = new Date(toDate);
    if (isNaN(from.getTime()) || isNaN(to.getTime())) return 'Invalid';
    const diffTime = to.getTime() - from.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays > 0 ? `${diffDays} day${diffDays > 1 ? 's' : ''}` : '0 days';
  }, []);

  const handleExportCSV = useCallback(async (data: AdminLeaveRequest[]) => {
    if (data.length === 0) {
      setExportError('No data available to export.');
      return;
    }
    
    try {
      setIsExporting(true);
      setExportError(null);
      
      // Native CSV Export
      const headers = ['Employee ID', 'Employee Name', 'Department', 'Leave Type', 'From Date', 'To Date', 'Duration', 'Status'];
      const keys = ['employeeId', 'employeeName', 'department', 'leaveType', 'fromDate', 'toDate', 'duration', 'status'];
      
      const transformData = data.map(item => ({
        employeeId: item.employee_id,
        employeeName: item.name,
        department: item.department,
        leaveType: item.leaveType,
        fromDate: item.fromDate,
        toDate: item.toDate,
        duration: calculateDuration(item.fromDate, item.toDate),
        status: item.status
      }));

      const csvRows = [headers.join(',')];

      transformData.forEach(row => {
        const rowData = keys.map(key => {
          const val = (row as unknown as Record<string, string>)[key] || '';
          return `"${String(val).replace(/"/g, '""')}"`;
        });
        csvRows.push(rowData.join(','));
      });

      const csvContent = "data:text/csv;charset=utf-8," + csvRows.join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      const filename = `leave_requests_${new Date().toISOString().split('T')[0]}.csv`;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: unknown) {
      console.error('Export to Excel failed:', err);
      setExportError(`Excel Export failed: ${err instanceof Error ? err.message : 'Unknown error.'}`);
    } finally {
      setIsExporting(false);
    }
  }, [calculateDuration]);

  const handleExportPDF = useCallback(async (data: AdminLeaveRequest[]) => {
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
      
      const htmlContent = `
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
            if (newWindow.print) {
              newWindow.print();
            }
            URL.revokeObjectURL(url);
          }, 250);
        };
      }
    } catch (err: unknown) {
      console.error('Export to PDF failed:', err);
      setExportError(`PDF Export failed: ${err instanceof Error ? err.message : 'Unknown error.'}`);
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
