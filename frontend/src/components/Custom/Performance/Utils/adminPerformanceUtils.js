/**
 * Map API response data to component format
 */
export const mapPerformanceData = (apiData) => {
  return apiData.map(item => ({
    id: item.employee_id || item.id,
    name: item.name || `${item.first_name || ''} ${item.last_name || ''}`.trim(),
    department: item.department || 'N/A',
    jobTitle: item.job_title || 'N/A',
    lastEvaluation: item.last_evaluation_date 
      ? new Date(item.last_evaluation_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) 
      : 'Never',
    score: item.score !== null && item.score !== undefined ? parseFloat(item.score).toFixed(2) : 'N/A',
    status: item.status || 'Not Started',
    reviewId: item.review_id
  }));
};

/**
 * Filter Performance data based on filters and search query
 */
export const filterPerformanceData = (data, filters, searchQuery) => {
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
 * Generate PDF HTML content
 */
export const generatePDFContent = (data, headers, today) => {
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
              <td>${row.jobTitle || ''}</td>
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
export const exportToCSV = async (data, headers, filename) => {
  try {
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('PerformanceEvaluation');

    // Define Columns
    worksheet.columns = [
      { header: '', key: 'col1', width: 12 },
      { header: '', key: 'col2', width: 15 },
      { header: '', key: 'col3', width: 25 },
      { header: '', key: 'col4', width: 20 },
      { header: '', key: 'col5', width: 20 },
      { header: '', key: 'col6', width: 15 },
      { header: '', key: 'col7', width: 10 }
    ];

    // Title Row
    worksheet.addRow(['PERFORMANCE EVALUATION REPORT (ADMIN)']);
    worksheet.addRow([`Generated At: ${new Date().toLocaleString()}`]);
    worksheet.addRow([]);

    // Style Title
    worksheet.getRow(1).font = { bold: true, size: 14 };
    worksheet.mergeCells('A1:G1');
    worksheet.mergeCells('A2:G2');

    // Header Row
    const headerRow = worksheet.addRow([
      'Status', 'Employee ID', 'Name', 'Department', 'Job Title', 'Last Evaluation', 'Score'
    ]);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' }
    };

    // Data Rows
    data.forEach(row => {
      worksheet.addRow([
        row.status || '-',
        row.id || '-',
        row.name || '-',
        row.department || '-',
        row.jobTitle || '-',
        row.lastEvaluation || '-',
        row.score || 'N/A'
      ]);
    });

    // Write and Download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${filename.replace('.csv', '')}_${new Date().getTime()}.xlsx`;
    anchor.click();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Error generating Excel:', err);
    throw err;
  }
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
