/**
 * Map API response data to component format
 */
// ExcelJS import removed

export interface DTRRecord {
  id: string | number;
  employeeId: string | number;
  name: string;
  department: string;
  date: string;
  rawDate?: string; // For filtering
  timeIn: string;
  timeOut: string;
  hoursWorked: string | number;
  status: string;
  remarks: string;
  createdAt?: string;
}

export interface DTRFilters {
  department?: string;
  employeeId?: string; // Filter by ID
  employee?: string; // Legacy name filter
  fromDate?: string;
  toDate?: string;
}

export interface PaginationResult {
  totalPages: number;
  startIndex: number;
  endIndex: number;
  currentItems: DTRRecord[];
  totalRecords: number;
}

export const mapDTRData = (apiData: any[]): DTRRecord[] => {
  return apiData.map(item => ({
    id: item.employee_id || item.id,
    employeeId: item.employee_id,
    name: item.employee_name || 'N/A',
    department: item.department || 'N/A',
    date: item.date,
    rawDate: item.date, // Assuming API gives ISO, logic elsewhere might format 'date' display
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
export const filterDTRData = (data: DTRRecord[], filters: DTRFilters, searchQuery: string): DTRRecord[] => {
  let filteredData = [...data];

  // Apply department filter
  if (filters.department) {
    filteredData = filteredData.filter((item) => item.department === filters.department);
  }

  // Apply employee filter
  if (filters.employeeId) {
    filteredData = filteredData.filter((item) => String(item.employeeId) === filters.employeeId);
  }
  
  // Legacy support
  if (filters.employee) {
    filteredData = filteredData.filter((item) => item.name === filters.employee);
  }

  // Apply date range filters
  if (filters.fromDate) {
    filteredData = filteredData.filter((item) => (item.rawDate || item.date) >= filters.fromDate!);
  }

  if (filters.toDate) {
    filteredData = filteredData.filter((item) => (item.rawDate || item.date) <= filters.toDate!);
  }

  // Apply search query
  const query = searchQuery.toLowerCase();
  if (query) {
    filteredData = filteredData.filter((item) =>
      (item.name ?? "").toLowerCase().includes(query) ||
      (String(item.id) ?? "").toLowerCase().includes(query) ||
      (item.department ?? "").toLowerCase().includes(query) ||
      (item.status ?? "").toLowerCase().includes(query)
    );
  }

  return filteredData;
};

/**
 * Calculate pagination data
 */
export const calculatePagination = (data: DTRRecord[], currentPage: number, itemsPerPage: number): PaginationResult => {
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = data.slice(startIndex, endIndex);
  
  return { totalPages, startIndex, endIndex, currentItems, totalRecords: data.length };
};

/**
 * Get unique departments from data
 */
export const getUniqueDepartments = (data: DTRRecord[]): string[] => {
  return [...new Set(data.map(item => item.department))].sort();
};

/**
 * Get unique employees from data
 */
export const getUniqueEmployees = (data: DTRRecord[]): { id: string; name: string }[] => {
  const uniqueEmps = new Map<string, string>();
  data.forEach(item => {
    if (item.employeeId && item.name) {
      uniqueEmps.set(String(item.employeeId), item.name);
    }
  });
  
  return Array.from(uniqueEmps.entries()).map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
};

/**
 * Generate PDF HTML content
 */
export const generatePDFContent = (data: DTRRecord[], headers: string[], today: string): string => {
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
              <td>${row.id}</td>
              <td>${row.name}</td>
              <td>${row.department}</td>
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
export const exportToCSV = async (data: DTRRecord[], _headers: string[], filename: string): Promise<void> => {
  try {
    const headers = ['Status', 'Employee ID', 'Name', 'Department', 'Date', 'Time In', 'Time Out', 'Hours Worked', 'Remarks'];
    const keys = ['status', 'employeeId', 'name', 'department', 'date', 'timeIn', 'timeOut', 'hoursWorked', 'remarks'];

    const csvRows = [headers.join(',')];

    data.forEach(row => {
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
export const exportToPDF = async (data: DTRRecord[], headers: string[], today: string, printDelay = 250): Promise<void> => {
  const htmlContent = generatePDFContent(data, headers, today);
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
