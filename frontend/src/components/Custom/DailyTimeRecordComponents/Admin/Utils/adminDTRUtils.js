/**
 * Map API response data to component format
 */
export const mapDTRData = (apiData) => {
  return apiData.map(item => ({
    id: item.employee_id || item.id,
    name: item.employee_name || 'N/A',
    department: item.department || 'N/A',
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
export const filterDTRData = (data, filters, searchQuery) => {
  let filteredData = [...data];

  // Apply department filter
  if (filters.department) {
    filteredData = filteredData.filter((item) => item.department === filters.department);
  }

  // Apply employee filter
  if (filters.employee) {
    filteredData = filteredData.filter((item) => item.name === filters.employee);
  }

  // Apply date range filters
  if (filters.fromDate) {
    filteredData = filteredData.filter((item) => item.date >= filters.fromDate);
  }

  if (filters.toDate) {
    filteredData = filteredData.filter((item) => item.date <= filters.toDate);
  }

  // Apply search query
  const query = searchQuery.toLowerCase();
  if (query) {
    filteredData = filteredData.filter((item) =>
      (item.name ?? "").toLowerCase().includes(query) ||
      (item.id ?? "").toLowerCase().includes(query) ||
      (item.department ?? "").toLowerCase().includes(query) ||
      (item.status ?? "").toLowerCase().includes(query)
    );
  }

  return filteredData;
};

/**
 * Calculate pagination data
 */
export const calculatePagination = (data, currentPage, itemsPerPage) => {
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = data.slice(startIndex, endIndex);
  
  return { totalPages, startIndex, endIndex, currentItems };
};

/**
 * Get unique departments from data
 */
export const getUniqueDepartments = (data) => {
  return [...new Set(data.map(item => item.department))].sort();
};

/**
 * Get unique employees from data
 */
export const getUniqueEmployees = (data) => {
  return [...new Set(data.map(item => item.name))].sort();
};

/**
 * Generate CSV content from filtered data
 */
export const generateCSVContent = (data, headers) => {
  const csvContent = [
    headers.join(','),
    ...data.map(row => [
      row.status,
      row.id,
      row.name,
      row.department,
      row.date,
      row.timeIn,
      row.timeOut,
      row.hoursWorked,
      row.remarks
    ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  return csvContent;
};

/**
 * Generate PDF HTML content
 */
export const generatePDFContent = (data, headers, today) => {
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
 * Export data to CSV
 */
export const exportToCSV = async (data, headers, filename) => {
  const csvContent = generateCSVContent(data, headers);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Export data to PDF
 */
export const exportToPDF = async (data, headers, today, printDelay = 250) => {
  const htmlContent = generatePDFContent(data, headers, today);
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const newWindow = window.open(url, '_blank');
  
  if (newWindow) {
    newWindow.onload = () => {
      setTimeout(() => {
        newWindow.print();
        URL.revokeObjectURL(url);
      }, printDelay);
    };
  }
};

/**
 * Get status badge styles
 */
export const getStatusBadge = (status, statusStyles) => {
  return statusStyles[status] || 'bg-gray-100 text-gray-800';
};
