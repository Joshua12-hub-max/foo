import { exportToExcel } from '@/utils/excelExport';

/**
 * Export schedule data to Excel
 */
export const exportToCSV = async (filteredData, today) => {
  await exportToExcel({
    data: filteredData,
    columns: [
      { header: 'Schedule Name', key: 'scheduleName', width: 25 },
      { header: 'Schedule Task', key: 'scheduleTask', width: 25 },
      { header: 'Start Date', key: 'startDate', width: 12 },
      { header: 'Start Time', key: 'startTime', width: 12 },
      { header: 'End Date', key: 'endDate', width: 12 },
      { header: 'End Time', key: 'endTime', width: 12 },
      { header: 'Repeat', key: 'repeat', width: 12 },
      { header: 'Description', key: 'description', width: 30 }
    ],
    filename: `my_schedule_${today.replace(/\//g, '-')}`,
    title: 'My Schedule Report'
  });
};
