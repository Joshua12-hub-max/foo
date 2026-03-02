/**
 * Map API response data to component format
 */
// ExcelJS import removed

export interface EmployeeDTRRecord {
  id: string | number;
  date: string;
  timeIn: string;
  timeOut: string;
  hoursWorked: string | number;
  lateMinutes?: number;
  undertimeMinutes?: number;
  status: string;
  remarks: string;
  duties?: string;
  createdAt?: string;
  firstName?: string;
  lastName?: string;
  middleName?: string | null;
  suffix?: string | null;
}

export interface EmployeeInfo {
  id: string | number;
  name: string;
  department: string;
}

export interface EmployeeDTRFilters {
  fromDate?: string;
  toDate?: string;
}

export interface EmployeePaginationResult {
  totalPages: number;
  startIndex: number;
  endIndex: number;
  currentItems: EmployeeDTRRecord[];
}

export const mapDTRData = (apiData: {
  id?: string | number;
  record_id?: string | number;
  date: string;
  time_in?: string;
  time_out?: string;
  hours_worked?: string | number;
  late_minutes?: number;
  undertime_minutes?: number;
  status?: string;
  remarks?: string;
  duties?: string;
  created_at?: string;
  first_name?: string;
  last_name?: string;
  middle_name?: string | null;
  suffix?: string | null;
}[]): EmployeeDTRRecord[] => {
  return apiData.map(item => ({
    id: item.id || item.record_id || '',
    date: item.date,
    timeIn: item.time_in || 'N/A',
    timeOut: item.time_out || 'N/A',
    hoursWorked: item.hours_worked || '0',
    lateMinutes: item.late_minutes || 0,
    undertimeMinutes: item.undertime_minutes || 0,
    status: item.status || 'Unknown',
    remarks: item.remarks || '-',
    duties: item.duties || 'N/A',
    createdAt: item.created_at,
    firstName: item.first_name,
    lastName: item.last_name,
    middleName: item.middle_name,
    suffix: item.suffix
  }));
};

/**
 * Filter DTR data based on filters and search query
 */
export const filterDTRData = (data: EmployeeDTRRecord[], filters: EmployeeDTRFilters, searchQuery: string): EmployeeDTRRecord[] => {
  let filteredData = [...data];

  // Apply date range filters
  if (filters.fromDate) {
    filteredData = filteredData.filter((item) => item.date >= filters.fromDate!);
  }

  if (filters.toDate) {
    filteredData = filteredData.filter((item) => item.date <= filters.toDate!);
  }

  // Apply search query
  const query = searchQuery.toLowerCase();
  if (query) {
    filteredData = filteredData.filter((item) =>
      (item.date ?? "").toLowerCase().includes(query) ||
      (item.status ?? "").toLowerCase().includes(query) ||
      (item.remarks ?? "").toLowerCase().includes(query)
    );
  }

  return filteredData;
};

/**
 * Calculate pagination data
 */
export const calculatePagination = (data: EmployeeDTRRecord[], currentPage: number, itemsPerPage: number): EmployeePaginationResult => {
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = data.slice(startIndex, endIndex);
  
  return { totalPages, startIndex, endIndex, currentItems };
};

/**
 * Generate PDF HTML content
 */
export const generatePDFContent = (data: EmployeeDTRRecord[], _headers: string[], employeeInfo: EmployeeInfo | null, today: string): string => {
  const statusColors: Record<string, string> = {
    Present: '#dcfce7',
    Absent: '#fee2e2',
    Late: '#fef9c3',
    Undertime: '#ffedd5',
    'Late/Undertime': '#ffedd5',
    Leave: '#dbeafe',
    Holiday: '#f3e8ff'
  };

  const statusTextColors: Record<string, string> = {
    Present: '#166534',
    Absent: '#991b1b',
    Late: '#854d0e',
    Undertime: '#9a3412',
    'Late/Undertime': '#9a3412',
    Leave: '#1e40af',
    Holiday: '#6b21a8'
  };

  const headers = ['Status', 'Date', 'Time In', 'Time Out', 'Late (m)', 'UT (m)', 'Hours', 'Remarks'];

  // Calculate totals
  const totalLate = data.reduce((sum, row) => sum + (Number(row.lateMinutes) || 0), 0);
  const totalUT = data.reduce((sum, row) => sum + (Number(row.undertimeMinutes) || 0), 0);
  const totalHours = data.reduce((sum, row) => sum + (Number(row.hoursWorked) || 0), 0);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Daily Time Record Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; color: #1e293b; }
        .header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 20px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
        h1 { color: #0f172a; font-size: 24px; margin: 0; }
        .emp-info { margin-bottom: 20px; font-size: 14px; }
        .meta { color: #64748b; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        th { background-color: #1e293b; color: white; padding: 10px 8px; text-align: left; font-weight: bold; text-transform: uppercase; }
        td { padding: 8px; border-bottom: 1px solid #e2e8f0; }
        .status-pill { padding: 2px 8px; border-radius: 9999px; font-weight: bold; font-size: 10px; display: inline-block; }
        .summary-row { background-color: #f1f5f9 !important; font-weight: bold; }
        .summary-label { text-align: right; padding-right: 20px; }
        tr:nth-child(even) { background-color: #f8fafc; }
        @media print {
          body { margin: 0; }
          @page { margin: 1cm; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Daily Time Record Report</h1>
        <div class="meta">Generated on: ${today}</div>
      </div>
      <div class="emp-info">
        <strong>Employee:</strong> ${employeeInfo?.name || 'N/A'} (${employeeInfo?.id || 'N/A'})<br>
        <strong>Department:</strong> ${employeeInfo?.department || 'N/A'}
      </div>
      <table>
        <thead>
          <tr>
            ${headers.map(h => `<th>${h}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data.map(row => {
            const bgColor = statusColors[row.status] || '#f1f5f9';
            const textColor = statusTextColors[row.status] || '#475569';
            return `
            <tr>
              <td><span class="status-pill" style="background-color: ${bgColor}; color: ${textColor};">${row.status}</span></td>
              <td>${row.date}</td>
              <td style="font-family: monospace;">${row.timeIn}</td>
              <td style="font-family: monospace;">${row.timeOut}</td>
              <td style="text-align: center; color: ${row.lateMinutes ? '#991b1b' : '#64748b'}">${row.lateMinutes || 0}</td>
              <td style="text-align: center; color: ${row.undertimeMinutes ? '#991b1b' : '#64748b'}">${row.undertimeMinutes || 0}</td>
              <td style="font-weight: bold; text-align: center;">${row.hoursWorked}</td>
              <td>${row.remarks}</td>
            </tr>
          `}).join('')}
        </tbody>
        <tfoot>
          <tr class="summary-row">
            <td colspan="4" class="summary-label">TOTALS</td>
            <td style="text-align: center;">${totalLate}</td>
            <td style="text-align: center;">${totalUT}</td>
            <td style="text-align: center;">${totalHours.toFixed(2)}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </body>
    </html>
  `;
};

/**
 * Export data to Excel
 */
// Native CSV export to remove dependency on ExcelJS
export const exportToCSV = async (data: EmployeeDTRRecord[], _headers: string[], employeeInfo: EmployeeInfo | null, filename: string): Promise<void> => {
  try {
    const headers = ['Status', 'Employee ID', 'Name', 'Department', 'Date', 'Time In', 'Time Out', 'Late (m)', 'UT (m)', 'Hours Worked', 'Remarks'];
    const csvRows = [headers.join(',')];

    data.forEach(row => {
      const rowData = [
        `"${String(row.status || '').replace(/"/g, '""')}"`,
        `"${String(employeeInfo?.id || '').replace(/"/g, '""')}"`,
        `"${String(employeeInfo?.name || '').replace(/"/g, '""')}"`,
        `"${String(employeeInfo?.department || '').replace(/"/g, '""')}"`,
        `"${String(row.date || '').replace(/"/g, '""')}"`,
        `"${String(row.timeIn || '').replace(/"/g, '""')}"`,
        `"${String(row.timeOut || '').replace(/"/g, '""')}"`,
        `"${String(row.lateMinutes || 0).replace(/"/g, '""')}"`,
        `"${String(row.undertimeMinutes || 0).replace(/"/g, '""')}"`,
        `"${String(row.hoursWorked || '').replace(/"/g, '""')}"`,
        `"${String(row.remarks || '').replace(/"/g, '""')}"`
      ];
      csvRows.push(rowData.join(','));
    });

    // Add totals to CSV
    const totalLate = data.reduce((sum, row) => sum + (Number(row.lateMinutes) || 0), 0);
    const totalUT = data.reduce((sum, row) => sum + (Number(row.undertimeMinutes) || 0), 0);
    const totalHours = data.reduce((sum, row) => sum + (Number(row.hoursWorked) || 0), 0);
    
    const summaryRow = Array(7).fill('""');
    summaryRow[6] = '"TOTALS"';
    summaryRow.push(`"${totalLate}"`);
    summaryRow.push(`"${totalUT}"`);
    summaryRow.push(`"${totalHours.toFixed(2)}"`);
    summaryRow.push('""');

    csvRows.push(summaryRow.join(','));

    const csvContent = "\uFEFF" + csvRows.join('\n'); // Add BOM
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const finalFilename = filename.endsWith('.csv') ? filename : `${filename}.csv`;
    link.setAttribute("download", finalFilename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Error generating CSV:', err);
    throw err;
  }
};

/**
 * Export data to PDF
 */
export const exportToPDF = async (data: EmployeeDTRRecord[], headers: string[], employeeInfo: EmployeeInfo | null, today: string, printDelay = 250): Promise<void> => {
  const htmlContent = generatePDFContent(data, headers, employeeInfo, today);
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
      }, printDelay);
    };
  }
};

/**
 * Get status badge styles
 */
export const getStatusBadge = (status: string, statusStyles: Record<string, string>): string => {
  return statusStyles[status] || 'bg-gray-100 text-gray-800';
};
