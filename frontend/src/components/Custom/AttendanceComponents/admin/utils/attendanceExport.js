import { formatDate } from './attendanceUtils';

// Export configuration constants
const EXPORT_CONFIG = {
  CSV_MIME_TYPE: 'text/csv;charset=utf-8;',
  PDF_LOAD_DELAY: 500,
  DEFAULT_CSV_FILENAME: 'attendance_report',
  DEFAULT_PDF_TITLE: 'Attendance Report'
};

/**
 * Validates export data
 * @param {Array} data - Data to validate
 * @returns {boolean} - True if valid
 */
const validateExportData = (data) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    console.warn('No data available to export');
    return false;
  }
  return true;
};

/**
 * Formats header for display (converts snake_case to Title Case)
 * @param {string} header - Header key
 * @returns {string} - Formatted header
 */
const formatHeader = (header) => {
  return header
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Export attendance data to CSV format
 * @param {Array} data - Array of attendance records
 * @param {string} filename - Output filename (without extension)
 */
export const exportToCSV = (data, filename = EXPORT_CONFIG.DEFAULT_CSV_FILENAME) => {
  if (!validateExportData(data)) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => {
      let value = row[header];
      if (header === 'date') value = formatDate(value);
      return `"${value}"`;
    }).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: EXPORT_CONFIG.CSV_MIME_TYPE });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url); // Clean up
  }
};

/**
 * Export attendance data to PDF format
 * Opens a new window with printable table layout
 * @param {Array} data - Array of attendance records
 * @param {string} title - PDF document title
 */
export const exportToPDF = (data, title = EXPORT_CONFIG.DEFAULT_PDF_TITLE) => {
  if (!validateExportData(data)) return;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    console.warn('Unable to open print window. Please check popup blocker settings.');
    return;
  }

  const headers = Object.keys(data[0]);
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            padding: 20px; 
            margin: 0;
          }
          h1 { 
            text-align: center; 
            color: #333; 
            margin-bottom: 10px;
          }
          p {
            text-align: center;
            color: #666;
            margin-bottom: 20px;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 20px; 
          }
          th, td { 
            border: 1px solid #ddd; 
            padding: 8px; 
            text-align: left;
            font-size: 12px;
          }
          th { 
            background-color: #274b46;
            color: white;
            font-weight: bold;
          }
          tr:nth-child(even) { 
            background-color: #f9f9f9; 
          }
          @media print {
            body { padding: 10px; }
            th, td { padding: 6px; font-size: 10px; }
          }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <p>Generated on: ${new Date().toLocaleString()}</p>
        <table>
          <thead>
            <tr>
              ${headers.map(h => `<th>${formatHeader(h)}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${data.map(row => `
              <tr>
                ${headers.map(h => {
                  let value = row[h];
                  if (h === 'date') value = formatDate(value);
                  return `<td>${value || '-'}</td>`;
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  
  // Allow styles to load before printing
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, EXPORT_CONFIG.PDF_LOAD_DELAY);
};
