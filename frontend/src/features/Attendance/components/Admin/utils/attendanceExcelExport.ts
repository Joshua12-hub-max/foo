import ExcelJS from 'exceljs';
import { AttendanceRecord } from '@/types';

interface ExportOptions {
  title?: string;
  dateRange?: { startDate: string; endDate: string };
  groupByDepartment?: boolean;
}

/**
 * Format date string for display
 */
const formatDate = (dateStr: string): string => {
  if (!dateStr || dateStr === '-') return '-';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
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
  if (!timeStr || timeStr === '-' || timeStr === '' || timeStr === 'null') return '-';
  try {
    const date = new Date(timeStr);
    if (!isNaN(date.getTime())) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    }
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
  if (record.employeeName) return record.employeeName;
  return `Employee #${record.employeeId}`;
};

/**
 * Make minutes readable but retain numeric value in excel formulas if possible
 * Since this function returns a string for display in other formats, we'll
 * keep it for CSV, but in Excel we will pass raw numbers.
 */
const formatMinutes = (value: string | number): string => {
  const mins = typeof value === 'string' ? parseInt(value, 10) : Number(value || 0);
  if (isNaN(mins) || mins <= 0) return '0';
  
  const hours = Math.floor(mins / 60);
  const remainingMinutes = mins % 60;
  
  if (hours > 0) {
    return `${hours}h${remainingMinutes > 0 ? ` ${remainingMinutes}m` : ''}`;
  }
  return `${remainingMinutes}m`;
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

    // Set column widths (13 columns: A-M)
    worksheet.columns = [
      { header: 'Employee ID', key: 'employeeId', width: 15 },
      { header: 'Employee Name', key: 'employee', width: 25 },
      { header: 'Department', key: 'department', width: 30 },
      { header: 'Date', key: 'date', width: 14 },
      { header: 'Time In', key: 'timeIn', width: 12 },
      { header: 'Time Out', key: 'timeOut', width: 12 },
      { header: 'Late (min)', key: 'late', width: 10 },
      { header: 'Undertime (min)', key: 'undertime', width: 14 },
      { header: 'Present', key: 'present', width: 10 },
      { header: 'Late', key: 'lateStatus', width: 10 },
      { header: 'Undertime', key: 'undertimeStatus', width: 12 },
      { header: 'Absent', key: 'absent', width: 10 },
      { header: 'On Leave', key: 'onLeave', width: 14 }
    ];

    // Add title row
    worksheet.mergeCells('A1:M1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = title;
    titleCell.font = { bold: true, size: 16, color: { argb: 'FF1E3A5F' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(1).height = 30;

    // Add report metadata
    const dateRangeText = dateRange 
      ? `Period: ${formatDate(dateRange.startDate)} - ${formatDate(dateRange.endDate)}`
      : `Generated: ${new Date().toLocaleDateString('en-PH')}`;
    
    worksheet.mergeCells('A2:M2');
    const metaCell = worksheet.getCell('A2');
    metaCell.value = dateRangeText;
    metaCell.font = { size: 10, italic: true, color: { argb: 'FF666666' } };
    metaCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(2).height = 18;

    // Add record count
    worksheet.mergeCells('A3:M3');
    const countCell = worksheet.getCell('A3');
    countCell.value = `Total Records: ${data.length}`;
    countCell.font = { size: 10, color: { argb: 'FF666666' } };
    countCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(3).height = 18;

    // Add header row
    const headerRow = worksheet.addRow(['Employee ID', 'Employee Name', 'Department', 'Date', 'Time In', 'Time Out', 'Late (min)', 'Undertime (min)', 'Present', 'Late', 'Undertime', 'Absent', 'On Leave']);
    applyHeaderStyle(headerRow);

    // Group data by department if requested
    const sortedData = [...data];
    if (groupByDepartment) {
      sortedData.sort((a, b) => {
        const deptA = a.department || '';
        const deptB = b.department || '';
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
        const dept = record.department || 'Unassigned';
        if (dept !== currentDepartment) {
          currentDepartment = dept;
          const deptRow = worksheet.addRow([`Department: ${dept}`]);
          worksheet.mergeCells(`A${deptRow.number}:M${deptRow.number}`);
          deptRow.getCell(1).font = { bold: true, size: 11, color: { argb: 'FF1E3A5F' } };
          deptRow.getCell(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE8EEF4' }
          };
          deptRow.height = 24;
        }
      }

      const rawLate = record.lateMinutes || 0;
      const rawUndertime = record.undertimeMinutes || 0;
      const hasTimes = record.timeIn && record.timeIn !== '-' && record.timeIn !== 'null';
      const isOnLeave = (record.status || '').startsWith('On Leave');
      const isAbsent = record.status === 'Absent' || (!isOnLeave && !hasTimes);
      const isLate = Number(rawLate) > 0;
      const isUndertime = Number(rawUndertime) > 0;
      const isPresent = !isAbsent && !isOnLeave && hasTimes;

      // Extract leave abbreviation from status like "On Leave (VL)"
      const leaveAbbr = isOnLeave ? (record.status || '').replace('On Leave ', '').replace('(', '').replace(')', '') : '';

      const row = worksheet.addRow([
        record.employeeId || '',
        getEmployeeName(record),
        record.department || 'N/A',
        formatDate(record.date),
        formatTime(record.timeIn || ''),
        formatTime(record.timeOut || ''),
        rawLate,
        rawUndertime,
        isPresent ? 'X' : '',
        isLate ? 'X' : '',
        isUndertime ? 'X' : '',
        isAbsent ? 'X' : '',
        leaveAbbr
      ]);
      
      applyDataStyle(row, index % 2 === 0);

      // Apply specific background colors to the X markings
      const markColorMap: Record<number, string> = {
        9: 'FF28A745', // Green (Present)
        10: 'FFFD7E14', // Orange (Late)
        11: 'FF007BFF', // Blue (Undertime)
        12: 'FFDC3545', // Red (Absent)
        13: 'FF6F42C1'  // Purple (On Leave)
      };

      for (let col = 9; col <= 13; col++) {
        const cell = row.getCell(col);
        if (cell.value && cell.value !== '') {
          cell.font = { size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: markColorMap[col] }
          };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }
      }
    });

    // Add a final Auto-Calculation row at the very bottom
    const totalRow = worksheet.addRow([
      'TOTALS',
      '',
      '',
      '',
      '',
      '',
      { formula: `SUM(G5:G${worksheet.rowCount})`, result: 0 },
      { formula: `SUM(H5:H${worksheet.rowCount})`, result: 0 },
      { formula: `COUNTIF(I5:I${worksheet.rowCount},"X")`, result: 0 },
      { formula: `COUNTIF(J5:J${worksheet.rowCount},"X")`, result: 0 },
      { formula: `COUNTIF(K5:K${worksheet.rowCount},"X")`, result: 0 },
      { formula: `COUNTIF(L5:L${worksheet.rowCount},"X")`, result: 0 },
      { formula: `COUNTA(M5:M${worksheet.rowCount})-COUNTBLANK(M5:M${worksheet.rowCount})`, result: 0 }
    ]);
    
    // Style the Total Row
    totalRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E3A5F' } 
      };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'medium', color: { argb: 'FF000000' } },
        bottom: { style: 'medium', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      };
    });
    totalRow.getCell(1).alignment = { horizontal: 'right', vertical: 'middle' };
    worksheet.mergeCells(`A${totalRow.number}:F${totalRow.number}`);

    // Add warning if data was truncated
    if (data.length > MAX_ROWS) {
      const warnRow = worksheet.addRow([`Note: Showing ${MAX_ROWS} of ${data.length} records to optimize file size.`]);
      worksheet.mergeCells(`A${warnRow.number}:M${warnRow.number}`);
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
    const headers = ['Employee ID', 'Employee Name', 'Department', 'Date', 'Time In', 'Time Out', 'Late', 'Undertime', 'Present', 'Late', 'Undertime', 'Absent', 'On Leave'];
    
    // Build CSV content
    const csvContent = [
      headers.join(','),
      ...data.map(record => {
        const isOnLeave = (record.status || '').startsWith('On Leave');
        const isAbsent = record.status === 'Absent' || (!isOnLeave && (record.timeIn === '-' || record.timeIn === null));
        const isLate = Number(record.lateMinutes || 0) > 0;
        const isUndertime = Number(record.undertimeMinutes || 0) > 0;
        const isPresent = !isAbsent && !isOnLeave && !isLate && !isUndertime;
        const leaveAbbr = isOnLeave ? (record.status || '').replace('On Leave ', '').replace('(', '').replace(')', '') : '';
        
        return [
          `"${record.employeeId || ''}"`,
          `"${getEmployeeName(record)}"`,
          `"${record.department || 'N/A'}"`,
          `"${formatDate(record.date)}"`,
          `"${formatTime(record.timeIn || '')}"`,
          `"${formatTime(record.timeOut || '')}"`,
          `"${formatMinutes(record.lateMinutes || 0)}"`,
          `"${formatMinutes(record.undertimeMinutes || 0)}"`,
          `"${isPresent ? 'X' : ''}"`,
          `"${isLate ? 'X' : ''}"`,
          `"${isUndertime ? 'X' : ''}"`,
          `"${isAbsent ? 'X' : ''}"`,
          `"${leaveAbbr}"`
        ].join(',')
      })
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
