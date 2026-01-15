import ExcelJS from 'exceljs';
import { AttendanceRecord } from '../hooks/useAttendanceData';

interface ExportOptions {
  title?: string;
  dateRange?: { startDate: string; endDate: string };
  groupByDepartment?: boolean;
}

/**
 * Format date string for display
 */
const formatDate = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-PH', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  } catch {
    return dateStr || '-';
  }
};

/**
 * Format time string for display
 */
const formatTime = (timeStr: string): string => {
  if (!timeStr || timeStr === '-' || timeStr === '') return '-';
  try {
    // Handle HH:MM:SS or HH:MM format
    const parts = timeStr.split(':');
    if (parts.length >= 2) {
      const hours = parseInt(parts[0], 10);
      const minutes = parts[1];
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      return `${displayHours}:${minutes} ${ampm}`;
    }
    return timeStr;
  } catch {
    return timeStr || '-';
  }
};

/**
 * Get employee name from record
 */
const getEmployeeName = (record: AttendanceRecord): string => {
  if (record.name) return record.name;
  if (record.first_name || record.last_name) {
    return `${record.first_name || ''} ${record.last_name || ''}`.trim();
  }
  return `Employee #${record.employee_id}`;
};

/**
 * Format late/undertime values
 */
const formatMinutes = (value: string | number): string => {
  if (!value || value === 0 || value === '0') return '-';
  const mins = typeof value === 'string' ? parseInt(value, 10) : value;
  if (isNaN(mins) || mins === 0) return '-';
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  if (hours > 0) {
    return `${hours}h ${remainingMins}m`;
  }
  return `${remainingMins}m`;
};

/**
 * Apply header styling to a row
 */
const applyHeaderStyle = (row: ExcelJS.Row): void => {
  row.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E3A5F' } // Dark blue
    };
    cell.font = {
      bold: true,
      color: { argb: 'FFFFFFFF' },
      size: 11
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } }
    };
  });
  row.height = 22;
};

/**
 * Apply data cell styling
 */
const applyDataStyle = (row: ExcelJS.Row, isAlternate: boolean): void => {
  row.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: isAlternate ? 'FFF5F5F5' : 'FFFFFFFF' }
    };
    cell.font = { size: 10 };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
      left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
      bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
      right: { style: 'thin', color: { argb: 'FFE0E0E0' } }
    };
  });
  row.height = 20;
};

/**
 * Get status cell fill color
 */
const getStatusColor = (status: string): string => {
  const statusLower = status?.toLowerCase() || '';
  if (statusLower.includes('present')) return 'FF28A745'; // Green
  if (statusLower.includes('absent')) return 'FFDC3545'; // Red
  if (statusLower.includes('late')) return 'FFFD7E14'; // Orange
  if (statusLower.includes('leave')) return 'FF007BFF'; // Blue
  return 'FF6C757D'; // Gray
};

/**
 * Export attendance records to Excel format
 * Optimized for file size < 400KB
 */
export const exportAttendanceToExcel = async (
  data: AttendanceRecord[],
  options: ExportOptions = {}
): Promise<void> => {
  try {
    const { title = 'Attendance Report', dateRange, groupByDepartment = false } = options;

    // Create workbook with optimization settings
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'CHRMO System';
    workbook.created = new Date();

    // Create worksheet
    const worksheet = workbook.addWorksheet('Attendance Report', {
      views: [{ state: 'frozen', ySplit: 4 }] // Freeze top rows
    });

    // Set column widths (optimized for content)
    worksheet.columns = [
      { header: 'Employee', key: 'employee', width: 25 },
      { header: 'Date', key: 'date', width: 14 },
      { header: 'Time In', key: 'timeIn', width: 12 },
      { header: 'Time Out', key: 'timeOut', width: 12 },
      { header: 'Late', key: 'late', width: 10 },
      { header: 'Undertime', key: 'undertime', width: 12 },
      { header: 'Status', key: 'status', width: 12 }
    ];

    // Add title row
    worksheet.mergeCells('A1:G1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = title;
    titleCell.font = { bold: true, size: 16, color: { argb: 'FF1E3A5F' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(1).height = 30;

    // Add report metadata
    const dateRangeText = dateRange 
      ? `Period: ${formatDate(dateRange.startDate)} - ${formatDate(dateRange.endDate)}`
      : `Generated: ${new Date().toLocaleDateString('en-PH')}`;
    
    worksheet.mergeCells('A2:G2');
    const metaCell = worksheet.getCell('A2');
    metaCell.value = dateRangeText;
    metaCell.font = { size: 10, italic: true, color: { argb: 'FF666666' } };
    metaCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(2).height = 18;

    // Add record count
    worksheet.mergeCells('A3:G3');
    const countCell = worksheet.getCell('A3');
    countCell.value = `Total Records: ${data.length}`;
    countCell.font = { size: 10, color: { argb: 'FF666666' } };
    countCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(3).height = 18;

    // Add header row
    const headerRow = worksheet.addRow(['Employee', 'Date', 'Time In', 'Time Out', 'Late', 'Undertime', 'Status']);
    applyHeaderStyle(headerRow);

    // Group data by department if requested
    const sortedData = [...data];
    if (groupByDepartment) {
      sortedData.sort((a, b) => {
        const deptA = a.department_name || a.department || '';
        const deptB = b.department_name || b.department || '';
        return deptA.localeCompare(deptB);
      });
    }

    // Add data rows - limit to prevent file size bloat
    const MAX_ROWS = 5000; // Limit to maintain file size
    const limitedData = sortedData.slice(0, MAX_ROWS);
    
    let currentDepartment = '';
    limitedData.forEach((record, index) => {
      // Add department separator if grouping
      if (groupByDepartment) {
        const dept = record.department_name || record.department || 'Unassigned';
        if (dept !== currentDepartment) {
          currentDepartment = dept;
          const deptRow = worksheet.addRow([`Department: ${dept}`]);
          worksheet.mergeCells(`A${deptRow.number}:G${deptRow.number}`);
          deptRow.getCell(1).font = { bold: true, size: 11, color: { argb: 'FF1E3A5F' } };
          deptRow.getCell(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE8EEF4' }
          };
          deptRow.height = 24;
        }
      }

      const row = worksheet.addRow([
        getEmployeeName(record),
        formatDate(record.date),
        formatTime(record.time_in),
        formatTime(record.time_out),
        formatMinutes(record.late),
        formatMinutes(record.undertime),
        record.status || '-'
      ]);
      
      applyDataStyle(row, index % 2 === 0);

      // Apply status color
      const statusCell = row.getCell(7);
      statusCell.font = { 
        size: 10, 
        bold: true,
        color: { argb: 'FFFFFFFF' }
      };
      statusCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: getStatusColor(record.status) }
      };
    });

    // Add warning if data was truncated
    if (data.length > MAX_ROWS) {
      const warnRow = worksheet.addRow([`Note: Showing ${MAX_ROWS} of ${data.length} records to optimize file size.`]);
      worksheet.mergeCells(`A${warnRow.number}:G${warnRow.number}`);
      warnRow.getCell(1).font = { italic: true, color: { argb: 'FFFF6600' } };
    }

    // Generate buffer and download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });

    // Check file size (should be < 400KB)
    const fileSizeKB = blob.size / 1024;
    console.log(`Excel file size: ${fileSizeKB.toFixed(2)} KB`);

    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    const fileName = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw new Error('Failed to export attendance to Excel');
  }
};

/**
 * Export attendance records to CSV format (lightweight alternative)
 */
export const exportAttendanceToCSV = (
  data: AttendanceRecord[],
  options: ExportOptions = {}
): void => {
  try {
    const { title = 'Attendance Report' } = options;

    // CSV header
    const headers = ['Employee', 'Date', 'Time In', 'Time Out', 'Late', 'Undertime', 'Status'];
    
    // Build CSV content
    const csvContent = [
      headers.join(','),
      ...data.map(record => [
        `"${getEmployeeName(record)}"`,
        `"${formatDate(record.date)}"`,
        `"${formatTime(record.time_in)}"`,
        `"${formatTime(record.time_out)}"`,
        `"${formatMinutes(record.late)}"`,
        `"${formatMinutes(record.undertime)}"`,
        `"${record.status || '-'}"`
      ].join(','))
    ].join('\n');

    // Create and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    const fileName = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

  } catch (error) {
    console.error('Error exporting to CSV:', error);
    throw new Error('Failed to export attendance to CSV');
  }
};
