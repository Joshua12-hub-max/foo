import React, { useState } from 'react';
import { FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { useToastStore } from '@/stores';
import { exportAttendanceToExcel } from './utils/attendanceExcelExport';
import { AttendanceRecord } from '@/types';
import { attendanceApi } from '@/api/attendanceApi';
import { employeeApi } from '@/api/employeeApi';
import { AttendanceQueryValues } from '@/schemas/attendanceSchema';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Employee } from '@/types';

interface AttendanceExportProps {
  data: AttendanceRecord[];
  title: string;
  dateRange?: { startDate: string; endDate: string };
  filters?: AttendanceQueryValues;
}

/**
 * Format date for display
 */
const formatDate = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return dateStr || '-';
  }
};

/**
 * Format time for display
 */
const formatTime = (timeStr: string): string => {
  if (!timeStr || timeStr === '-' || timeStr === '') return '-';
  try {
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
  if (record.employee_name) return record.employee_name;
  return `Employee #${record.employeeId || record.employee_id}`;
};

/**
 * Format minutes to readable format
 */
const formatMinutes = (value: string | number): string => {
  if (!value || value === 0 || value === '0') return '-';
  const mins = typeof value === 'string' ? parseInt(value, 10) : value;
  if (isNaN(mins) || mins === 0) return '-';
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  if (hours > 0) return `${hours}h ${remainingMins}m`;
  return `${remainingMins}m`;
};

const AttendanceExport: React.FC<AttendanceExportProps> = ({ data, title, dateRange, filters }) => {
  const showToast = useToastStore((state) => state.showToast);
  const showNotification = (message: string, type: 'success' | 'error') => showToast(message, type);
  const [isExporting, setIsExporting] = useState(false);
  const [groupByDepartment, setGroupByDepartment] = useState(false);
  
  const fetchAllData = async (): Promise<AttendanceRecord[]> => {
    if (!filters || !filters.startDate || !filters.endDate) return data;

    try {
      // 1. Fetch all matching LOGS
      const logsResponse = await attendanceApi.getLogs({
        ...filters,
        page: 1,
        limit: 100000 
      });

      // 2. Fetch all EMPLOYEES for the target department
      const departmentFilter = filters.department || 'All Departments';
      const employeesResponse = await employeeApi.fetchEmployees({ department: departmentFilter });

      if (logsResponse.data.success && Array.isArray(logsResponse.data.data) && employeesResponse.success && Array.isArray(employeesResponse.employees)) {
        
        const logs = logsResponse.data.data;
        const employees = employeesResponse?.employees || [];
        const fullRecords: AttendanceRecord[] = [];

        // 3. Generate Date Range
        const start = new Date(filters.startDate);
        const end = new Date(filters.endDate);
        const dateArray: string[] = [];
        
        // Clone start to avoid modifying it in loop
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            dateArray.push(d.toISOString().split('T')[0]);
        }

        // 4. Cross-Reference: Day x Employee
        // Create a lookup map for existing logs: "YYYY-MM-DD_EmployeeID" -> Record
        const logMap = new Map<string, AttendanceRecord>();
        
        // Transform api logs (DTRApiResponse) to AttendanceRecord
        logs.forEach((log: any) => {
             // Handle potential date format issues
            const logDate = new Date(log.date).toISOString().split('T')[0];
            const key = `${logDate}_${log.employee_id}`;
            
            const record: AttendanceRecord = {
              id: log.id,
              employeeId: log.employee_id,
              employee_id: log.employee_id,
              name: log.employee_name || `${log.first_name || ''} ${log.last_name || ''}`.trim(),
              date: logDate,
              timeIn: log.time_in,
              timeOut: log.time_out,
              lateMinutes: log.late_minutes,
              undertimeMinutes: log.undertime_minutes,
              status: log.status,
              department: log.department,
              duties: log.duties
            };
            
            logMap.set(key, record);
        });

        // Loop through every day (descending to match typical view)
        dateArray.reverse().forEach(dateStr => {
            employees.forEach((emp: Employee) => {
                const empId = emp.employee_id || emp.id;
                const key = `${dateStr}_${empId}`;
                const existingLog = logMap.get(key);

                if (existingLog) {
                    fullRecords.push(existingLog);
                } else {
                    // GENERATE ABSENT RECORD
                    // Check if today is future? (Optional: don't show absent for future dates)
                    const isFuture = new Date(dateStr) > new Date();

                    if (!isFuture) {
                         const firstName = emp.first_name || '';
                         const lastName = emp.last_name || '';
                         
                         fullRecords.push({
                            id: `gen-${Math.random()}`, // Temp ID
                            employee_id: empId,
                            employeeId: String(empId),
                            name: `${firstName} ${lastName}`.trim() || `Employee ${empId}`,
                            date: dateStr,
                            timeIn: '-',
                            timeOut: '-',
                            status: 'Absent', // Default to absent if no log
                            lateMinutes: 0,
                            undertimeMinutes: 0,
                            department: emp.department || 'N/A'
                        });
                    }
                }
            });
        });

        return fullRecords;

      } else {
        // Fallback if APIs fail
        console.warn("Could not fetch full datasets for gap filling, using raw logs only.");
        return logsResponse.data.success ? logsResponse.data.data : data; 
      }
    } catch (error) {
      console.error("Error fetching full export data:", error);
      throw error; // Let caller handle
    }
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const exportData = await fetchAllData();
      
      if (exportData.length === 0) {
        showNotification("No data to export", "error");
        setIsExporting(false);
        return;
      }

      await exportAttendanceToExcel(exportData, {
        title,
        dateRange,
        groupByDepartment
      });
      showNotification("Excel report exported successfully!", "success");
    } catch (error) {
      console.error('Export error:', error);
      showNotification("Failed to export Excel report", "error");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const exportData = await fetchAllData();

      if (exportData.length === 0) {
        showNotification("No data to export", "error");
        setIsExporting(false);
        return;
      }

      const doc = new jsPDF('landscape');
      
      // Title
      doc.setFontSize(16);
      doc.setTextColor(30, 58, 95);
      doc.text(title, 14, 15);
      
      // Subtitle
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      const dateText = dateRange 
        ? `Period: ${formatDate(dateRange.startDate)} - ${formatDate(dateRange.endDate)}`
        : `Generated: ${new Date().toLocaleDateString('en-PH')}`;
      doc.text(dateText, 14, 22);
      doc.text(`Total Records: ${exportData.length}`, 14, 28);

      // Table data
      const tableData = exportData.map(record => [
        getEmployeeName(record),
        formatDate(record.date),
        formatTime(record.timeIn || ''),
        formatTime(record.timeOut || ''),
        formatMinutes(record.lateMinutes || 0),
        formatMinutes(record.undertimeMinutes || 0),
        record.status || '-'
      ]);

      autoTable(doc, {
        startY: 35,
        head: [['Employee', 'Date', 'Time In', 'Time Out', 'Late', 'Undertime', 'Status']],
        body: tableData,
        styles: { fontSize: 8 },
        headStyles: { 
          fillColor: [30, 58, 95],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        columnStyles: {
          0: { cellWidth: 50 },
          6: { fontStyle: 'bold' }
        }
      });

      const fileName = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      showNotification("PDF exported successfully!", "success");
    } catch (error) {
      console.error('PDF Export error:', error);
      showNotification("Failed to export PDF", "error");
    } finally {
        setIsExporting(false);
    }
  };

  return (
    <div className="flex items-center gap-4 mb-4 flex-wrap">

      
      <span className="text-sm font-semibold text-gray-800">Export Report:</span>
      
      {/* Group by Department Toggle */}
      <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
        <input
          type="checkbox"
          checked={groupByDepartment}
          onChange={(e) => setGroupByDepartment(e.target.checked)}
          className="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
        />
        <span>Group by Department</span>
      </label>

      {/* Excel Export Button - DARK GREEN */}
      <button
        onClick={handleExportExcel}
        disabled={isExporting || (!filters && data.length === 0)}
        className="flex items-center gap-1.5 text-sm font-semibold transition-colors hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ color: '#166534' }}
      >
        {isExporting ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <FileSpreadsheet size={16} />
        )}
        <span>{isExporting ? 'Generating Report...' : 'Excel'}</span>
      </button>

      {/* PDF Export Button - DARK RED */}
      <button
        onClick={handleExportPDF}
        disabled={isExporting || (!filters && data.length === 0)}
        className="flex items-center gap-1.5 text-sm font-semibold transition-colors hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ color: '#991B1B' }}
      >
        {isExporting ? (
            <Loader2 size={16} className="animate-spin" />
        ) : (
            <FileText size={16} />
        )}
        <span>{isExporting ? 'Generating...' : 'PDF'}</span>
      </button>

      {/* Record count */}
      <span className="text-xs text-gray-500 ml-auto">
        {!filters && `${data.length} ${data.length === 1 ? 'record' : 'records'} visible`}
      </span>
    </div>
  );
};

export default AttendanceExport;
