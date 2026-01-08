/**
 * Map API response data to component format
 */
import { createWorkbook, downloadExcel } from '@/utils/excel';

export const mapCorrectionData = (apiData) => {
  return apiData.map(item => ({
    id: item.id,
    date: item.date_time,
    employeeId: item.employee_id,
    employeeName: item.employee_name,
    timeIn: item.in_time || "N/A",
    timeOut: item.out_time || "N/A",
    correctedTime: item.corrected_time,
    reason: item.reason,
    status: item.status,
    requestDate: item.created_at
  }));
};

/**
 * Extract employee info from corrections data
 */
export const getEmployeeInfo = (correctionsData) => {
  if (correctionsData.length > 0) {
    return {
      id: correctionsData[0].employeeId,
      name: correctionsData[0].employeeName,
      department: "N/A" 
    };
  }
  return { id: "", name: "", department: "" };
};

/**
 * Filter corrections data based on filters and search query
 */
export const filterCorrectionData = (data, filters, searchQuery) => {
  let filteredData = [...data];

  // Apply status filter
  if (filters.status) {
    filteredData = filteredData.filter((item) => item.status === filters.status);
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
      (String(item.id) ?? "").toLowerCase().includes(query) ||
      (item.status ?? "").toLowerCase().includes(query) ||
      (item.reason ?? "").toLowerCase().includes(query)
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
      <title>My DTR Corrections Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; font-size: 24px; margin-bottom: 10px; }
        .meta { color: #666; font-size: 14px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        th { background-color: #1e293b; color: white; padding: 8px; text-align: left; font-weight: bold; }
        td { padding: 6px; border-bottom: 1px solid #e2e8f0; }
        tr:hover { background-color: #f8fafc; }
        @media print {
          body { margin: 0; }
          @page { margin: 1cm; }
        }
      </style>
    </head>
    <body>
      <h1>My DTR Corrections Report</h1>
      <div class="meta">Employee: ${employeeInfo.name} (${employeeInfo.id})</div>
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
              <td>${row.timeIn}</td>
              <td>${row.timeOut}</td>
              <td>${row.correctedTime}</td>
              <td>${row.status}</td>
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
    const workbook = createWorkbook();
    const worksheet = workbook.addWorksheet('DTRCorrections');

    // Define Columns
    worksheet.columns = [
      { header: '', key: 'col1', width: 15 },
      { header: '', key: 'col2', width: 12 },
      { header: '', key: 'col3', width: 12 },
      { header: '', key: 'col4', width: 15 },
      { header: '', key: 'col5', width: 12 }
    ];

    // Title Row
    worksheet.addRow(['DTR CORRECTIONS REPORT']);
    worksheet.addRow([`Generated At: ${new Date().toLocaleString()}`]);
    worksheet.addRow([]);

    // Style Title
    worksheet.getRow(1).font = { bold: true, size: 14 };
    worksheet.mergeCells('A1:E1');
    worksheet.mergeCells('A2:E2');

    // Header Row
    const headerRow = worksheet.addRow([
      'Date', 'Time In', 'Time Out', 'Corrected Time', 'Status'
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
        row.timeIn || '-',
        row.timeOut || '-',
        row.correctedTime || '-',
        row.status || '-'
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
        newWindow.close();
        URL.revokeObjectURL(url);
      }, printDelay);
    };
  }
};
