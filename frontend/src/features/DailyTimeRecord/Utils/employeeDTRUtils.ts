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
  status: string;
  remarks: string;
  createdAt?: string;
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

export const mapDTRData = (apiData: any[]): EmployeeDTRRecord[] => {
  return apiData.map(item => ({
    id: item.id || item.record_id,
    date: item.date,
    timeIn: item.time_in || 'N/A',
    timeOut: item.time_out || 'N/A',
    hoursWorked: item.hours_worked || '0',
    status: item.status || 'Unknown',
    remarks: item.remarks || '-',
    createdAt: item.created_at
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
export const generatePDFContent = (data: EmployeeDTRRecord[], headers: string[], employeeInfo: EmployeeInfo | null, today: string): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Daily Time Record Report</title>
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
      <h1>Daily Time Record Report</h1>
      <div class="meta">Employee: ${employeeInfo?.name || 'N/A'} (${employeeInfo?.id || 'N/A'})</div>
      <div class="meta">Department: ${employeeInfo?.department || 'N/A'}</div>
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
              <td>${row.status}</td>
              <td>${employeeInfo?.id || '-'}</td>
              <td>${employeeInfo?.department || '-'}</td>
              <td>${row.date}</td>
              <td>${row.timeIn}</td>
              <td>${row.timeOut}</td>
              <td>${row.hoursWorked}</td>
              <td>${row.remarks}</td>
            </tr>
          `).join('')}
        </tbody>
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
    const headers = ['Status', 'Employee ID', 'Department', 'Date', 'Time In', 'Time Out', 'Hours Worked', 'Remarks'];
    const keys = ['status', 'date', 'timeIn', 'timeOut', 'hoursWorked', 'remarks'];

    const csvRows = [headers.join(',')];

    data.forEach(row => {
      // Prepend Employee Info
      const empId = `"${String(employeeInfo?.id || '').replace(/"/g, '""')}"`;
      const dept = `"${String(employeeInfo?.department || '').replace(/"/g, '""')}"`;
      
      const rowData = keys.map(key => {
        const val = String((row as unknown as Record<string, string>)[key] || '');
        return `"${String(val).replace(/"/g, '""')}"`;
      });
      // order: status (keys[0]), empId, dept, date (keys[1]), etc...
      // Wait, let's map it manually to be safe
      const status = `"${String(row.status || '').replace(/"/g, '""')}"`;
      const date = `"${String(row.date || '').replace(/"/g, '""')}"`;
      const timeIn = `"${String(row.timeIn || '').replace(/"/g, '""')}"`;
      const timeOut = `"${String(row.timeOut || '').replace(/"/g, '""')}"`;
      const hours = `"${String(row.hoursWorked || '').replace(/"/g, '""')}"`;
      const remarks = `"${String(row.remarks || '').replace(/"/g, '""')}"`;

      csvRows.push([status, empId, dept, date, timeIn, timeOut, hours, remarks].join(','));
    });

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    // Ensure filename ends with .csv
    const finalFilename = filename.endsWith('.csv') ? filename : `${filename}.csv`;
    link.setAttribute("download", finalFilename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
