/**
 * Map API response data to component format
 */
import { createWorkbook, downloadExcel } from '@/utils/excel';

export const mapUndertimeData = (apiData) => {
  return apiData.map(item => ({
    id: item.id || item.request_id,
    date: item.date,
    timeOut: item.time_out || 'N/A',
    reason: item.reason || '-',
    status: item.status || 'Pending',
    submittedAt: item.submitted_at,
    reviewedAt: item.reviewed_at,
    reviewedBy: item.reviewed_by,
    rejectionReason: item.rejection_reason,
    createdAt: item.created_at,
    attachment_path: item.attachment_path || null
  }));
};

/**
 * Filter undertime data based on filters and search query
 */
export const filterUndertimeData = (data, filters, searchQuery) => {
  let filteredData = [...data];

  // Apply date range filters
  if (filters.fromDate) {
    filteredData = filteredData.filter((item) => item.date >= filters.fromDate);
  }

  if (filters.toDate) {
    filteredData = filteredData.filter((item) => item.date <= filters.toDate);
  }

  // Apply status filter
  if (filters.status) {
    filteredData = filteredData.filter((item) => 
      item.status.toLowerCase() === filters.status.toLowerCase()
    );
  }

  // Apply search query
  const query = searchQuery.toLowerCase();
  if (query) {
    filteredData = filteredData.filter((item) =>
      (item.reason ?? "").toLowerCase().includes(query) ||
      (item.status ?? "").toLowerCase().includes(query) ||
      (item.date ?? "").toLowerCase().includes(query)
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
export const generatePDFContent = (data, headers, employeeInfo, today) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>My Undertime Requests Report</title>
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
      <h1>My Undertime Requests Report</h1>
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
              <td>${row.date}</td>
              <td>${row.timeOut}</td>
              <td>${row.reason}</td>
              <td>${row.status}</td>
              <td>${row.submittedAt || 'N/A'}</td>
              <td>${row.reviewedAt || 'N/A'}</td>
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
export const exportToCSV = async (data, headers, employeeInfo, filename) => {
  try {
    const workbook = createWorkbook();
    const worksheet = workbook.addWorksheet('UndertimeRequests');

    // Define Columns
    worksheet.columns = [
      { header: '', key: 'col1', width: 15 },
      { header: '', key: 'col2', width: 12 },
      { header: '', key: 'col3', width: 30 },
      { header: '', key: 'col4', width: 12 },
      { header: '', key: 'col5', width: 18 },
      { header: '', key: 'col6', width: 18 }
    ];

    // Title Row
    worksheet.addRow(['UNDERTIME REQUESTS REPORT']);
    worksheet.addRow([employeeInfo ? `Employee: ${employeeInfo.name} | Department: ${employeeInfo.department}` : '']);
    worksheet.addRow([`Generated At: ${new Date().toLocaleString()}`]);
    worksheet.addRow([]);

    // Style Title
    worksheet.getRow(1).font = { bold: true, size: 14 };
    worksheet.mergeCells('A1:F1');
    worksheet.mergeCells('A2:F2');
    worksheet.mergeCells('A3:F3');

    // Header Row
    const headerRow = worksheet.addRow([
      'Date', 'Time Out', 'Reason', 'Status', 'Submitted At', 'Reviewed At'
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
        row.date || '-',
        row.timeOut || '-',
        row.reason || '-',
        row.status || '-',
        row.submittedAt || 'N/A',
        row.reviewedAt || 'N/A'
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
export const exportToPDF = async (data, headers, employeeInfo, today, printDelay = 250) => {
  const htmlContent = generatePDFContent(data, headers, employeeInfo, today);
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

/**
 * Format date for display
 */
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

/**
 * Format time for display
 */
export const formatTime = (timeString) => {
  if (!timeString) return 'N/A';
  // Assuming timeString is in HH:mm format
  return timeString;
};
