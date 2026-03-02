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
  rawDate?: string; // ISO date (YYYY-MM-DD) for accurate filtering
  timeIn: string;
  timeOut: string;
  hoursWorked: string | number;
  lateMinutes?: number;
  undertimeMinutes?: number;
  status: string;
  remarks: string;
  duties?: string;
  createdAt?: string;
  correctionId?: number | null;
  correctionStatus?: string | null;
  correctionReason?: string | null;
  correctionTimeIn?: string | null;
  correctionTimeOut?: string | null;
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

export const mapDTRData = (apiData: {
  id?: string | number;
  employee_id?: string | number;
  employee_name?: string;
  first_name?: string;
  last_name?: string;
  middle_name?: string | null;
  suffix?: string | null;
  department?: string;
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
  correction_id?: number | null;
  correction_status?: string | null;
  correction_reason?: string | null;
  correction_time_in?: string | null;
  correction_time_out?: string | null;
}[]): DTRRecord[] => {
  return apiData.map(item => ({
    id: item.employee_id || item.id || '',
    employeeId: item.employee_id || '',
    name: item.employee_name || 'N/A',
    department: item.department || 'N/A',
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
    correctionId: item.correction_id,
    correctionStatus: item.correction_status,
    correctionReason: item.correction_reason,
    correctionTimeIn: item.correction_time_in,
    correctionTimeOut: item.correction_time_out
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
    filteredData = filteredData.filter((item) => item.date >= filters.fromDate!);
  }

  if (filters.toDate) {
    filteredData = filteredData.filter((item) => item.date <= filters.toDate!);
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
export const generatePDFContent = (data: DTRRecord[], _headers: string[], today: string): string => {
  const statusColors: Record<string, string> = {
    Present: '#dcfce7', // bg-green-100
    Absent: '#fee2e2',  // bg-red-100
    Late: '#fef9c3',    // bg-yellow-100
    Undertime: '#ffedd5', // bg-orange-100
    'Late/Undertime': '#ffedd5',
    Leave: '#dbeafe',   // bg-blue-100
    Holiday: '#f3e8ff'  // bg-purple-100
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

  const headers = ['Status', 'Employee ID', 'Name', 'Department', 'Duties', 'Date', 'Time In', 'Time Out', 'Late (m)', 'UT (m)', 'Hours'];

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
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
        h1 { color: #0f172a; font-size: 24px; margin: 0; }
        .meta { color: #64748b; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; font-size: 10px; table-layout: auto; }
        th { background-color: #1e293b; color: white; padding: 8px 4px; text-align: left; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; }
        td { padding: 6px 4px; border-bottom: 1px solid #e2e8f0; }
        .status-pill { padding: 2px 6px; border-radius: 9999px; font-weight: bold; font-size: 9px; display: inline-block; }
        .summary-row { background-color: #f1f5f9 !important; font-weight: bold; }
        .summary-label { text-align: right; padding-right: 20px; }
        tr:nth-child(even) { background-color: #f8fafc; }
        @media print {
          body { margin: 0; }
          @page { margin: 1cm; size: landscape; }
          .header { margin-top: 0; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Daily Time Record Report</h1>
        <div class="meta">Generated on: ${today}</div>
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
              <td style="font-weight: bold;">${row.employeeId}</td>
              <td>${row.name}</td>
              <td>${row.department}</td>
              <td>${row.duties || 'N/A'}</td>
              <td>${row.date}</td>
              <td style="font-family: monospace;">${row.timeIn}</td>
              <td style="font-family: monospace;">${row.timeOut}</td>
              <td style="text-align: center; color: ${row.lateMinutes ? '#991b1b' : '#64748b'}">${row.lateMinutes || 0}</td>
              <td style="text-align: center; color: ${row.undertimeMinutes ? '#991b1b' : '#64748b'}">${row.undertimeMinutes || 0}</td>
              <td style="font-weight: bold; text-align: center;">${row.hoursWorked}</td>
            </tr>
          `}).join('')}
        </tbody>
        <tfoot>
          <tr class="summary-row">
            <td colspan="8" class="summary-label">TOTALS</td>
            <td style="text-align: center;">${totalLate}</td>
            <td style="text-align: center;">${totalUT}</td>
            <td style="text-align: center;">${totalHours.toFixed(2)}</td>
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
export const exportToCSV = async (data: DTRRecord[], _headers: string[], filename: string): Promise<void> => {
  try {
    const headers = ['Status', 'Employee ID', 'Name', 'Department', 'Duties', 'Date', 'Time In', 'Time Out', 'Late (Minutes)', 'Undertime (Minutes)', 'Hours Worked', 'Remarks'];
    const keys = ['status', 'employeeId', 'name', 'department', 'duties', 'date', 'timeIn', 'timeOut', 'lateMinutes', 'undertimeMinutes', 'hoursWorked', 'remarks'];

    const csvRows = [headers.join(',')];

    data.forEach(row => {
      const rowData = keys.map(key => {
        const val = String(row[key as keyof DTRRecord] ?? '');
        return `"${String(val).replace(/"/g, '""')}"`;
      });
      csvRows.push(rowData.join(','));
    });

    // Add Summary Row to CSV
    const totalLate = data.reduce((sum, row) => sum + (Number(row.lateMinutes) || 0), 0);
    const totalUT = data.reduce((sum, row) => sum + (Number(row.undertimeMinutes) || 0), 0);
    const totalHours = data.reduce((sum, row) => sum + (Number(row.hoursWorked) || 0), 0);
    
    const summaryRow = Array(8).fill('""'); // Empty cells before Late
    summaryRow[7] = '"TOTALS"';
    summaryRow.push(`"${totalLate}"`);
    summaryRow.push(`"${totalUT}"`);
    summaryRow.push(`"${totalHours.toFixed(2)}"`);
    summaryRow.push('""'); // Remarks

    csvRows.push(summaryRow.join(','));

    const csvContent = "\uFEFF" + csvRows.join('\n'); // Add BOM for Excel UTF-8 support
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    // Ensure filename ends with .csv
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
  // Try exact match first
  if (statusStyles[status]) return statusStyles[status];
  
  // Try Title Case (e.g. "present" -> "Present")
  const titleCase = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  if (statusStyles[titleCase]) return statusStyles[titleCase];
  
  // Try all lowercase
  const lowerCase = status.toLowerCase();
  if (statusStyles[lowerCase]) return statusStyles[lowerCase];

  return 'bg-gray-100 text-gray-800';
};
