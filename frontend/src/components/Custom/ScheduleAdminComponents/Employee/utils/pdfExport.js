export const exportToPDF = (filteredData, today) => {
  const headers = ['Schedule Name', 'Schedule Task', 'Start', 'End', 'Repeat', 'Description'];

  let htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>My Schedule Report</title>
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
      <h1>My Schedule Report</h1>
      <div class="meta">Generated on: ${today}</div>
      <table>
        <thead>
          <tr>
            ${headers.map(h => `<th>${h}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${filteredData.map(row => `
            <tr>
              <td>${row.scheduleName || ''}</td>
              <td>${row.scheduleTask || ''}</td>
              <td>${row.startDate || ''} ${row.startTime || ''}</td>
              <td>${row.endDate || ''} ${row.endTime || ''}</td>
              <td>${row.repeat || ''}</td>
              <td>${row.description || ''}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;

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
