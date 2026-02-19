/**
 * Map API response data to component format
 */
// ExcelJS import removed

export interface EmployeePerformanceData {
  id: string | number;
  reviewPeriod: string;
  cycleTitle: string;
  reviewer: string;
  score: string | number;
  lastUpdate: string;
  status: string;
  selfRatingStatus: string;
  [key: string]: string | number | null | undefined;
}

export const mapEmployeePerformanceData = (apiData: Record<string, string | number | null | undefined>[]): EmployeePerformanceData[] => {
  return apiData.map(item => ({
    id: item.id ?? 0,
    reviewPeriod: item.review_period_start && item.review_period_end 
      ? `${new Date(String(item.review_period_start)).toLocaleDateString()} - ${new Date(String(item.review_period_end)).toLocaleDateString()}`
      : 'N/A',
    cycleTitle: String(item.cycle_title || 'Regular Review'),
    reviewer: item.reviewer_first_name 
      ? `${item.reviewer_first_name} ${item.reviewer_last_name}`.trim() 
      : 'Not Assigned',
    score: item.computed_score !== null && item.computed_score !== undefined ? parseFloat(String(item.computed_score)).toFixed(2) : 'N/A',
    lastUpdate: item.updated_at 
      ? new Date(String(item.updated_at)).toLocaleDateString() 
      : new Date(String(item.created_at || '')).toLocaleDateString(),
    status: String(item.status || 'Draft'),
    selfRatingStatus: String(item.self_rating_status || 'pending')
  }));
};

/**
 * Filter Performance data based on filters and search query
 */
export const filterEmployeePerformanceData = (data: EmployeePerformanceData[], filters: { status?: string }, searchQuery: string): EmployeePerformanceData[] => {
  let filteredData = [...data];

  // Apply status filter
  if (filters.status && filters.status !== 'All Status') {
    filteredData = filteredData.filter((item) => item.status === filters.status);
  }

  // Apply search query
  const query = searchQuery.toLowerCase();
  if (query) {
    filteredData = filteredData.filter((item) =>
      (item.cycleTitle ?? "").toLowerCase().includes(query) ||
      (item.reviewer ?? "").toLowerCase().includes(query) ||
      (item.status ?? "").toLowerCase().includes(query)
    );
  }

  return filteredData;
};

/**
 * Calculate pagination data
 */
export const calculatePagination = <T>(data: T[], currentPage: number, itemsPerPage: number) => {
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = data.slice(startIndex, endIndex);
  
  return { totalPages, startIndex, endIndex, currentItems };
};



/**
 * Generate PDF HTML content
 */
export const generatePDFContent = (data: EmployeePerformanceData[], headers: string[], today: string): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Performance Reviews</title>
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
      <h1>Performance Reviews</h1>
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
              <td>${row.reviewPeriod || ''}</td>
              <td>${row.cycleTitle || ''}</td>
              <td>${row.reviewer || ''}</td>
              <td>${row.score || ''}</td>
              <td>${row.lastUpdate || ''}</td>
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
export const exportToCSV = async (data: EmployeePerformanceData[], headers: string[], filename: string) => {
  try {
    const csvHeaders = ['Status', 'Review Period', 'Cycle Title', 'Reviewer', 'Score', 'Last Update'];
    const keys = ['status', 'reviewPeriod', 'cycleTitle', 'reviewer', 'score', 'lastUpdate'];

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
export const exportToPDF = async (data: EmployeePerformanceData[], headers: string[], today: string, printDelay = 250) => {
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
