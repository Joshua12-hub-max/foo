/**
 * Export data to PDF file (using browser print dialog)
 * @param {Array} data - Array of objects to export
 * @param {string} title - Title for the PDF document
 */
export const exportToPDF = (data, title = 'Leave Requests Report') => {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return false;
  }

  try {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
      console.error('Failed to open print window. Pop-up might be blocked.');
      return false;
    }

    // Get headers from first object
    const headers = Object.keys(data[0]);
    
    // Build HTML table
    const tableRows = data.map(row => `
      <tr>
        ${headers.map(header => `<td>${row[header] ?? ''}</td>`).join('')}
      </tr>
    `).join('');

    // Create HTML content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>${title}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
            }
            h1 {
              color: #274b46;
              margin-bottom: 20px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 12px;
              text-align: left;
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
              body {
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <p>Generated on: ${new Date().toLocaleString()}</p>
          <table>
            <thead>
              <tr>
                ${headers.map(header => `<th>${header}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </body>
      </html>
    `;

    // Write content and trigger print
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Wait for content to load, then print
    printWindow.onload = () => {
      printWindow.print();
    };

    return true;
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    return false;
  }
};

/**
 * Format leave request data for PDF export
 * @param {Array} leaveRequests - Array of leave request objects
 * @returns {Object} Formatted data with title and rows
 */
export const formatLeaveRequestsForPDF = (leaveRequests) => {
  return leaveRequests.map(request => ({
    'Employee ID': request.employeeId || '',
    'Employee Name': request.employeeName || '',
    'Leave Type': request.leaveType || '',
    'Start Date': request.startDate || '',
    'End Date': request.endDate || '',
    'Days': request.days || '',
    'Status': request.status || '',
    'Submitted': request.submittedDate || ''
  }));
};
