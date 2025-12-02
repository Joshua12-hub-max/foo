export const exportToCSV = (filteredData, today) => {
  const headers = ['Status', 'Department', 'Employee ID', 'Employee Name', 'Schedule Name', 'Schedule Task', 'Start Date', 'Start Time', 'End Date', 'End Time', 'Repeat', 'Description'];
  const csvContent = [
    headers.join(','),
    ...filteredData.map(row => [
      row.status || '',
      row.department || '',
      row.employeeId || '',
      row.employeeName || '',
      row.scheduleName || '',
      row.scheduleTask || '',
      row.startDate || '',
      row.startTime || '',
      row.endDate || '',
      row.endTime || '',
      row.repeat || '',
      row.description || ''
    ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `schedule_${today.replace(/\//g, '-')}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};