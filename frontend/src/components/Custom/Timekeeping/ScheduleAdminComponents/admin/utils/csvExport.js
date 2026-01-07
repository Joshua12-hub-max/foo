import { exportToExcel } from '@/utils/excelExport';

/**
 * Export schedule data to Excel
 */
export const exportToCSV = async (filteredData, today) => {
  await exportToExcel({
    data: filteredData,
    columns: [
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Department', key: 'department', width: 20 },
      { header: 'Employee ID', key: 'employeeId', width: 15 },
      { header: 'Employee Name', key: 'employeeName', width: 25 },
      { header: 'Schedule Name', key: 'scheduleName', width: 20 },
      { header: 'Schedule Task', key: 'scheduleTask', width: 20 },
      { header: 'Start Date', key: 'startDate', width: 12 },
      { header: 'Start Time', key: 'startTime', width: 12 },
      { header: 'End Date', key: 'endDate', width: 12 },
      { header: 'End Time', key: 'endTime', width: 12 },
      { header: 'Repeat', key: 'repeat', width: 12 },
      { header: 'Description', key: 'description', width: 30 }
    ],
    filename: `schedule_${today.replace(/\//g, '-')}`,
    title: 'Employee Schedule Report (Admin)'
  });
};