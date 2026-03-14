import { useCallback } from 'react';
import { AdminLeaveRequest } from '../../types';

export const useExport = () => {
  const exportToCSV = useCallback((data: AdminLeaveRequest[]) => {
    if (!data || data.length === 0) return;

    const headers = ['ID', 'Employee ID', 'Name', 'Department', 'Leave Type', 'Start Date', 'End Date', 'Working Days', 'Status', 'With Pay'];
    const rows = data.map(item => [
      item.id,
      item.employeeId,
      `${item.firstName} ${item.lastName}`,
      item.department,
      item.leaveType,
      item.startDate,
      item.endDate,
      item.workingDays,
      item.status,
      item.isWithPay ? 'Yes' : 'No'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `leave_requests_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  return { exportToCSV };
};
