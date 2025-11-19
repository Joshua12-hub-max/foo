import { STATUS_STYLES, TABLE_HEADERS } from '../Constants/AttendanceConstant';

export const getStatusBadge = (status) => {
  return STATUS_STYLES[status] || "bg-gray-100 text-gray-800";
};

export const exportToCSV = (data, filename) => {
  const csvContent = [
    TABLE_HEADERS.join(','),
    ...data.map(row => [
      row.status,
      row.department,
      row.id,
      row.name,
      row.date,
      row.present,
      row.absent,
      row.late,
      row.onLeave,
      row.leaveWithPay,
      row.leaveWithoutPay,
      row.workFromHome,
      row.undertime,
      row.timeIn,
      row.timeOut,
      row.totalHours,
      row.totalWork,
      row.remarks
    ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

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

export const generatePDFHTML = (data, today) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Attendance Report</title>
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
      <h1>Attendance Report</h1>
      <div class="meta">Generated on: ${today}</div>
      <table>
        <thead>
          <tr>
            ${TABLE_HEADERS.map(h => `<th>${h}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data.map(row => `
            <tr>
              <td>${row.status}</td>
              <td>${row.department}</td>
              <td>${row.id}</td>
              <td>${row.name}</td>
              <td>${row.date}</td>
              <td>${row.present}</td> 
              <td>${row.absent}</td>
              <td>${row.late}</td>
              <td>${row.onLeave}</td>
              <td>${row.leaveWithPay}</td>
              <td>${row.leaveWithoutPay}</td>
              <td>${row.workFromHome}</td>
              <td>${row.undertime}</td>
              <td>${row.timeIn}</td>
              <td>${row.timeOut}</td>
              <td>${row.totalHours}</td>
              <td>${row.totalWork}</td>
              <td>${row.remarks}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;
  // This function was not fully implemented in the original monolithic component.
  // You can expand this based on the logic from the original `handleExportPDF`.
  // For now, it's a placeholder.
  console.log("Generating PDF for", data, "on", today);
  // The complex HTML string generation from AttendanceHR.jsx would go here.
  return `<html><body><h1>PDF Report</h1><p>Data length: ${data.length}</p></body></html>`;
};

export const openPrintWindow = (htmlContent) => {
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const newWindow = window.open(url, '_blank');
  
  if (newWindow) {
    newWindow.onload = () => {
      setTimeout(() => {
        newWindow.print();
        URL.revokeObjectURL(url);
      }, 250);
    };
  }
};