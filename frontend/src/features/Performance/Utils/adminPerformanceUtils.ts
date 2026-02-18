/**
 * Map API response data to component format
 */
// ExcelJS import removed

export interface PerformanceTableItem {
  id: string | number;
  systemId: number; // Added for backend operations (integer PK)
  reviewId?: string | number;
  status: string;
  name: string;
  department: string;
  jobTitle: string;
  position_title?: string;
  lastEvaluation: string;
  duties?: string;
  score: string | number;
  [key: string]: any;
}

export const mapPerformanceData = (apiData: any[]): PerformanceTableItem[] => {
  return apiData.map(item => ({
    id: item.employee_id || item.id,
    systemId: item.id, // Ensure we capture the integer PK
    name: item.name || `${item.first_name || ''} ${item.last_name || ''}`.trim(),
    department: item.department || 'N/A',
    jobTitle: item.job_title || 'N/A',
    position_title: item.position_title || 'N/A',
    lastEvaluation: item.last_evaluation_date 
      ? new Date(item.last_evaluation_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) 
      : 'Never',
    score: item.score !== null && item.score !== undefined ? parseFloat(item.score).toFixed(2) : 'N/A',
    status: item.status || 'Not Started',
    duties: item.duties || 'No Schedule',
    reviewId: item.review_id
  }));
};

/**
 * Filter Performance data based on filters and search query
 */
export const filterPerformanceData = (data: PerformanceTableItem[], filters: any, searchQuery: string): PerformanceTableItem[] => {
  let filteredData = [...data];

  // Apply department filter
  if (filters.department) {
    filteredData = filteredData.filter((item) => item.department === filters.department);
  }

  // Apply employee filter
  if (filters.employee) {
    filteredData = filteredData.filter((item) => item.name === filters.employee);
  }

  // Apply status filter
  if (filters.status && filters.status !== 'All Status') {
    filteredData = filteredData.filter((item) => item.status === filters.status);
  }

  // Apply search query
  const query = searchQuery.toLowerCase();
  if (query) {
    filteredData = filteredData.filter((item) =>
      (item.name ?? "").toLowerCase().includes(query) ||
      (item.id?.toString() ?? "").toLowerCase().includes(query) ||
      (item.department ?? "").toLowerCase().includes(query) ||
      (item.status ?? "").toLowerCase().includes(query)
    );
  }

  return filteredData;
};

/**
 * Calculate pagination data
 */
export const calculatePagination = (data: any[], currentPage: number, itemsPerPage: number) => {
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = data.slice(startIndex, endIndex);
  
  return { totalPages, startIndex, endIndex, currentItems };
};

/**
 * Get unique departments from data
 */
export const getUniqueDepartments = (data: PerformanceTableItem[]): string[] => {
  return [...new Set(data.map(item => item.department))].sort();
};

/**
 * Get unique employees from data
 */
export const getUniqueEmployees = (data: PerformanceTableItem[]): string[] => {
  return [...new Set(data.map(item => item.name))].sort();
};



/**
 * Generate PDF HTML content
 */
export const generatePDFContent = (data: any[], headers: string[], today: string): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Performance Evaluation Report</title>
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
      <h1>Performance Evaluation Report</h1>
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
              <td>${row.status || ''}</td>
              <td>${row.id || ''}</td>
              <td>${row.name || ''}</td>
              <td>${row.department || ''}</td>
              <td>${row.position_title || row.jobTitle || ''}</td>
              <td>${row.lastEvaluation || ''}</td>
              <td>${row.score || ''}</td>
              <td>View</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;
};

/**
 * Export data to Excel (matching departmentReportsExport.js format)
 */
// Native CSV export to remove dependency on ExcelJS
export const exportToCSV = async (data: any[], headers: string[], filename: string) => {
  try {
    const csvHeaders = ['Status', 'Employee ID', 'Name', 'Department', 'Position Title', 'Last Evaluation', 'Score'];
    const keys = ['status', 'id', 'name', 'department', 'position_title', 'lastEvaluation', 'score'];

    const csvRows = [csvHeaders.join(',')];

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
  } catch (err) {
    console.error('Error generating CSV:', err);
    throw err;
  }
};

/**
 * Export data to PDF
 */
export const exportToPDF = async (data: any[], headers: string[], today: string, printDelay = 250) => {
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
export const getStatusBadge = (status: string, statusStyles: Record<string, string>) => {
  return statusStyles[status] || 'bg-gray-100 text-gray-800';
};
