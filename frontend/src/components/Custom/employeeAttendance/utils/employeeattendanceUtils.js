import { STATUS_STYLES, TABLE_HEADERS } from "../Constants/employeeattendanceConstant";

export const getStatusBadge = (status) => {
    return STATUS_STYLES[status] || "bg-gray-100 text-gray-800";
};

const exportToCSV = (data, filename) => {
    const csvContent = [
        TABLE_HEADERS.join(','),
        ...data.map(row => [
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
            row.status,
            row.notes
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

export const generatePDFHTML = (data, today, attendanceStats) => {
    const headers = ['Department', 'Employee ID', 'Employee Name', 'Date', 'Status', 'Time In', 'Time Out', 'Notes'];
    
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
            .stats { margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px; }
            .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
            .stat-item { text-align: center; }
            .stat-label { font-size: 12px; color: #666; }
            .stat-value { font-size: 20px; font-weight: bold; color: #333; }
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
          <div class="stats">
            <div class="stats-grid">
              <div class="stat-item">
                <div class="stat-label">Present</div>
                <div class="stat-value">${attendanceStats.present}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">Absent</div>
                <div class="stat-value">${attendanceStats.absent}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">Late</div>
                <div class="stat-value">${attendanceStats.late}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">Half Day</div>
                <div class="stat-value">${attendanceStats.halfDay}</div>
              </div>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                ${headers.map(h => `<th>${h}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${data.map(row => `
                <tr>
                  <td>${row.department}</td>
                  <td>${row.id}</td>
                  <td>${row.name}</td>
                  <td>${row.date}</td>
                  <td>${row.status}</td>
                  <td>${row.timeIn}</td>
                  <td>${row.timeOut}</td>
                  <td>${row.notes}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
        </html>
    `;
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