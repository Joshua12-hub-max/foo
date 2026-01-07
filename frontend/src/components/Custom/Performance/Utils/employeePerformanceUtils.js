/**
 * Map API response data to component format
 */
export const mapEmployeePerformanceData = (apiData) => {
  return apiData.map(item => ({
    id: item.id,
    reviewPeriod: item.review_period_start && item.review_period_end 
      ? `${new Date(item.review_period_start).toLocaleDateString()} - ${new Date(item.review_period_end).toLocaleDateString()}`
      : 'N/A',
    cycleTitle: item.cycle_title || 'Regular Review',
    reviewer: item.reviewer_first_name 
      ? `${item.reviewer_first_name} ${item.reviewer_last_name}`.trim() 
      : 'Not Assigned',
    score: item.computed_score !== null && item.computed_score !== undefined ? parseFloat(item.computed_score).toFixed(2) : 'N/A',
    lastUpdate: item.updated_at 
      ? new Date(item.updated_at).toLocaleDateString() 
      : new Date(item.created_at).toLocaleDateString(),
    status: item.status || 'Draft',
    selfRatingStatus: item.self_rating_status || 'pending'
  }));
};

/**
 * Filter Performance data based on filters and search query
 */
export const filterEmployeePerformanceData = (data, filters, searchQuery) => {
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
export const calculatePagination = (data, currentPage, itemsPerPage) => {
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = data.slice(startIndex, endIndex);
  
  return { totalPages, startIndex, endIndex, currentItems };
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
export const exportToCSV = async (data, headers, filename) => {
  try {
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('PerformanceReviews');

    // Define Columns
    worksheet.columns = [
      { header: '', key: 'col1', width: 12 },
      { header: '', key: 'col2', width: 25 },
      { header: '', key: 'col3', width: 20 },
      { header: '', key: 'col4', width: 25 },
      { header: '', key: 'col5', width: 10 },
      { header: '', key: 'col6', width: 15 }
    ];

    // Title Row
    worksheet.addRow(['PERFORMANCE REVIEWS REPORT']);
    worksheet.addRow([`Generated At: ${new Date().toLocaleString()}`]);
    worksheet.addRow([]);

    // Style Title
    worksheet.getRow(1).font = { bold: true, size: 14 };
    worksheet.mergeCells('A1:F1');
    worksheet.mergeCells('A2:F2');

    // Header Row
    const headerRow = worksheet.addRow([
      'Status', 'Review Period', 'Cycle Title', 'Reviewer', 'Score', 'Last Update'
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
        row.reviewPeriod || '-',
        row.cycleTitle || '-',
        row.reviewer || '-',
        row.score || 'N/A',
        row.lastUpdate || '-'
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
