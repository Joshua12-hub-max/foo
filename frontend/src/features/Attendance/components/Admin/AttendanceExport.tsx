import React, { useState } from 'react';
import { FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { useToastStore } from '@/stores';
import { exportAttendanceToExcel } from './utils/attendanceExcelExport';
import { AttendanceRecord } from '@/types';
import { attendanceApi } from '@/api/attendanceApi';
import { employeeApi } from '@/api/employeeApi';
import { leaveApi } from '@/api/leaveApi';
import { AttendanceQueryValues } from '@/schemas/attendanceSchema';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Employee } from '@/types';
import { DTRApiResponse } from '@/types/attendance';
import type { LeaveApplication } from '@/types/leave.types';

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
  if (!dateStr || dateStr === '-') return '-';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return dateStr || '-';
  }
};

/**
 * Format time for display
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
  if ('employeeName' in record && typeof record.employeeName === 'string') return record.employeeName;
  return `Employee #${record.employeeId}`;
};

/**
 * Format minutes to readable format  
 */
const formatMinutes = (value: string | number): string => {
  if (!value || value === 0 || value === '0') return '0';
  const mins = typeof value === 'string' ? parseInt(value, 10) : value;
  if (isNaN(mins) || mins === 0) return '0';
  return String(mins);
};

/**
 * Get a short leave type abbreviation for display
 */
const getLeaveAbbreviation = (leaveType: string): string => {
  const map: Record<string, string> = {
    'Vacation Leave': 'VL',
    'Sick Leave': 'SL',
    'Special Privilege Leave': 'SPL',
    'Forced Leave': 'FL',
    'Maternity Leave': 'ML',
    'Paternity Leave': 'PL',
    'Solo Parent Leave': 'SOLO',
    'Study Leave': 'STL',
    'Special Emergency Leave': 'SEL',
    'VAWC Leave': 'VAWC',
    'Rehabilitation Leave': 'RL',
    'Special Leave Benefits for Women': 'SLBW',
    'Wellness Leave': 'WL',
    'Adoption Leave': 'AL',
  };
  return map[leaveType] || 'LV';
};

const AttendanceExport: React.FC<AttendanceExportProps> = ({ data, title, dateRange, filters }) => {
  const showToast = useToastStore((state) => state.showToast);
  const showNotification = (message: string, type: 'success' | 'error') => showToast(message, type);
  const [isExporting, setIsExporting] = useState(false);
  const [groupByDepartment, setGroupByDepartment] = useState(false);
  
  // ═══════════════════════════════════════════════════════════════
  // Period Logic: 1-15 or 16-End of Month (Katapusan)
  // ═══════════════════════════════════════════════════════════════
  let appliedStartDate = filters?.startDate || dateRange?.startDate;
  let appliedEndDate = filters?.endDate || dateRange?.endDate;

  if (!appliedStartDate || !appliedEndDate) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const day = now.getDate();
    
    if (day <= 15) {
      // First Period: 1st to 15th
      appliedStartDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
      appliedEndDate = `${year}-${String(month + 1).padStart(2, '0')}-15`;
    } else {
      // Second Period: 16th to Katapusan (Last day of month)
      appliedStartDate = `${year}-${String(month + 1).padStart(2, '0')}-16`;
      const lastDay = new Date(year, month + 1, 0).getDate();
      appliedEndDate = `${year}-${String(month + 1).padStart(2, '0')}-${lastDay}`;
    }
  }

  const fetchAllData = async (): Promise<AttendanceRecord[]> => {
    const transformLogs = (logs: DTRApiResponse[]): AttendanceRecord[] => {
        return logs.map(l => ({
            id: l.id,
            employeeId: String(l.employeeId),
            employeeName: l.employeeName || 'Unknown',
            name: l.employeeName || 'Unknown',
            date: String(l.date),
            timeIn: l.timeIn || undefined,
            timeOut: l.timeOut || undefined,
            lateMinutes: Number(l.lateMinutes || 0),
            undertimeMinutes: Number(l.undertimeMinutes || 0),
            status: l.status || 'Present',
            department: l.department || 'N/A',
            duties: l.duties
        }));
    };

    try {
      const selectedDept = filters?.department && filters?.department !== 'All Departments' && filters?.department !== 'all' ? filters.department : undefined;

      // 1. Fetch data in parallel
      const [logsResponse, employeesResponse, leavesResponse] = await Promise.all([
        attendanceApi.getLogs({
          ...filters,
          startDate: appliedStartDate,
          endDate: appliedEndDate,
          page: 1,
          limit: 100000 
        }),
        employeeApi.fetchEmployees({ department: selectedDept } as { department?: string | null }),
        leaveApi.getAllApplications({
          status: 'Approved',
          startDate: appliedStartDate,
          endDate: appliedEndDate,
          limit: 100000,
          page: 1,
        }).catch(() => ({ data: { applications: [] } }))
      ]);

      const rawLogs = logsResponse.data.success && Array.isArray(logsResponse.data.data) ? logsResponse.data.data : [];
      const employees = employeesResponse.success && Array.isArray(employeesResponse.employees) ? employeesResponse.employees : [];
      
      // Leave Lookup: key: "YYYY-MM-DD_empId" → leaveType
      const leaveMap = new Map<string, string>(); 
      const approvedLeavesResponse = leavesResponse.data as { applications?: LeaveApplication[] };
      const approvedLeaves = approvedLeavesResponse.applications || [];
      
      approvedLeaves.forEach((leave: LeaveApplication) => {
        if (leave.status !== 'Approved') return;
        const empId = String(leave.employeeId);

        // Timezone-safe date range generation for leaves
        const start = parseDateStr(leave.startDate);
        const end = parseDateStr(leave.endDate);

        const d = new Date(start);
        while (d <= end) {
          const dateStr = d.toISOString().split('T')[0];
          leaveMap.set(`${dateStr}_${empId}`, leave.leaveType);
          d.setUTCDate(d.getUTCDate() + 1);
        }
      });


      const empLookup = new Map<string, Employee>();
      employees.forEach((emp: Employee) => {
          const empId = String(emp.employeeId || emp.id);
          empLookup.set(empId, emp);
      });

      const logMap = new Map<string, AttendanceRecord>();
      rawLogs.forEach((log: DTRApiResponse) => {
          const logDateVal = log.date ? (String(log.date).includes('T') ? log.date.split('T')[0] : log.date) : '';
          const empId = String(log.employeeId || '');
          if (!empId || !logDateVal) return;
          
          const key = `${logDateVal}_${empId}`;
          const emp = empLookup.get(empId);
          const fullName = emp ? `${emp.firstName || ''} ${emp.lastName || ''}`.trim() : (log.employeeName || `Employee ${empId}`);
          
          logMap.set(key, {
            id: log.id,
            employeeId: empId,
            name: fullName,
            date: String(logDateVal),
            timeIn: log.timeIn || undefined,
            timeOut: log.timeOut || undefined,
            lateMinutes: Number(log.lateMinutes ?? 0),
            undertimeMinutes: Number(log.undertimeMinutes ?? 0),
            status: log.status || 'Present',
            department: log.department || emp?.department || selectedDept || 'N/A',
            duties: log.duties
          });
      });

      // 3. Generate Date Array (UTC safe)
      const parseDateStr = (str: string) => {
          const parts = str.split(/[-/]/).map(Number);
          if (parts[0] > 1000) return new Date(Date.UTC(parts[0], parts[1] - 1, parts[2])); 
          if (parts[2] > 1000) return new Date(Date.UTC(parts[2], parts[0] - 1, parts[1]));
          return new Date(str);
      };

      const dateArray: string[] = [];
      try {
          const current = parseDateStr(appliedStartDate!);
          const end = parseDateStr(appliedEndDate!);
          while (current <= end) {
            dateArray.push(current.toISOString().split('T')[0]);
            current.setUTCDate(current.getUTCDate() + 1);
          }
      } catch (e) {
          console.error("Date parsing failed", e);
          return transformLogs(rawLogs);
      }

      // 4. Build Final Data
      const fullRecords: AttendanceRecord[] = [];
      let targetEmployeesList: { employeeId: string, name: string, department: string }[] = [];
      
      if (employees.length > 0) {
          targetEmployeesList = employees.map(e => ({
              employeeId: String(e.employeeId || e.id),
              name: `${e.firstName || ''} ${e.lastName || ''}`.trim(),
              department: e.department || selectedDept || 'N/A'
          }));
      } else {
          const uniqueIds = Array.from(new Set(rawLogs.map(l => String(l.employeeId))));
          targetEmployeesList = uniqueIds.map(id => {
              const log = rawLogs.find(l => String(l.employeeId) === id);
              return {
                  employeeId: id,
                  name: log?.employeeName || `Employee ${id}`,
                  department: log?.department || selectedDept || 'N/A'
              };
          });
      }

      if (targetEmployeesList.length === 0 && rawLogs.length > 0) {
          return rawLogs.map(l => ({
              id: l.id,
              employeeId: String(l.employeeId),
              name: l.employeeName || 'Unknown',
              date: String(l.date),
              timeIn: l.timeIn || undefined,
              timeOut: l.timeOut || undefined,
              lateMinutes: Number(l.lateMinutes || 0),
              undertimeMinutes: Number(l.undertimeMinutes || 0),
              status: l.status || 'Present',
              department: l.department || 'N/A',
              duties: l.duties
          }));
      }

      const manilaToday = new Date().toLocaleString("en-US", {timeZone: "Asia/Manila"});
      const todayStr = new Date(manilaToday).toISOString().split('T')[0];

      dateArray.forEach(dateStr => {
          targetEmployeesList.forEach(emp => {
              const empId = emp.employeeId;
              const key = `${dateStr}_${empId}`;
              const existingLog = logMap.get(key);
              const leaveType = leaveMap.get(key);
              const isFuture = dateStr > todayStr;

              if (existingLog) {
                  const hasTimes = existingLog.timeIn && existingLog.timeIn !== '-' && existingLog.timeIn !== 'null';
                  let finalStatus = existingLog.status;
                  if (!hasTimes && (finalStatus === 'Present' || !finalStatus) && !leaveType) finalStatus = 'Absent';
                  if (leaveType) finalStatus = `On Leave (${getLeaveAbbreviation(leaveType)})`;

                  fullRecords.push({
                    ...existingLog,
                    name: emp.name,
                    status: finalStatus,
                    department: emp.department
                  });
              } else if (leaveType) {
                  fullRecords.push({
                      id: `leave-${dateStr}-${empId}`,
                      employeeId: empId,
                      name: emp.name,
                      date: dateStr,
                      timeIn: '-',
                      timeOut: '-',
                      status: `On Leave (${getLeaveAbbreviation(leaveType)})`,
                      lateMinutes: 0,
                      undertimeMinutes: 0,
                      department: emp.department
                  });
              } else if (!isFuture) {
                  fullRecords.push({
                      id: `absent-${dateStr}-${empId}`,
                      employeeId: empId,
                      name: emp.name,
                      date: dateStr,
                      timeIn: '-',
                      timeOut: '-',
                      status: 'Absent',
                      lateMinutes: 0,
                      undertimeMinutes: 0,
                      department: emp.department
                  });
              }
          });
      });

      return fullRecords;
    } catch (error) {
      console.error("Error fetching export data:", error);
      return data; 
    }
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const exportData = await fetchAllData();
      if (exportData.length === 0) {
        showNotification("No data to export", "error");
        return;
      }
      await exportAttendanceToExcel(exportData, {
        title,
        dateRange: { startDate: appliedStartDate || '', endDate: appliedEndDate || '' },
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
        return;
      }

      const doc = new jsPDF('landscape');
      doc.setFontSize(16);
      doc.setTextColor(30, 58, 95);
      doc.text(title, 14, 15);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Period: ${formatDate(appliedStartDate || '') || '-'} to ${formatDate(appliedEndDate || '') || '-'}`, 14, 22);
      doc.text(`Total Records: ${exportData.length}`, 14, 28);

      const tableData = exportData.map(record => {
        const hasTimes = record.timeIn && record.timeIn !== '-' && record.timeIn !== 'null';
        const isOnLeave = (record.status || '').startsWith('On Leave');
        const isAbsent = record.status === 'Absent' || (!isOnLeave && !hasTimes);
        const isLate = Number(record.lateMinutes) > 0;
        const isUndertime = Number(record.undertimeMinutes) > 0;
        const isPresent = !isAbsent && !isOnLeave && hasTimes;
        
        return [
          record.employeeId || '',
          getEmployeeName(record),
          record.department || 'N/A',
          formatDate(record.date),
          formatTime(record.timeIn || ''),
          formatTime(record.timeOut || ''),
          formatMinutes(record.lateMinutes || 0),
          formatMinutes(record.undertimeMinutes || 0),
          isPresent ? 'X' : '',
          isLate ? 'X' : '',
          isUndertime ? 'X' : '',
          isAbsent ? 'X' : '',
          isOnLeave ? record.status?.replace('On Leave ', '').replace('(', '').replace(')', '') || 'LV' : ''
        ]
      });

      autoTable(doc, {
        startY: 35,
        head: [['ID', 'Employee Name', 'Dept', 'Date', 'Time In', 'Time Out', 'Late', 'UT', 'Present', 'Late', 'UT', 'Absent', 'On Leave']],
        body: tableData,
        styles: { fontSize: 5.5, halign: 'center', cellPadding: 1.5 },
        headStyles: { fillColor: [30, 58, 95], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        columnStyles: {
          0: { cellWidth: 16, halign: 'left' },
          1: { cellWidth: 28, halign: 'left' },
          2: { cellWidth: 28, halign: 'left' }
        }
      });

      doc.save(`${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
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
      <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
        <input
          type="checkbox"
          checked={groupByDepartment}
          onChange={(e) => setGroupByDepartment(e.target.checked)}
          className="w-4 h-4 text-green-600 rounded border-gray-300"
        />
        <span>Group by Department</span>
      </label>

      <button
        onClick={handleExportExcel}
        disabled={isExporting}
        className="flex items-center gap-1.5 text-sm font-semibold transition-colors hover:opacity-80 disabled:opacity-50"
        style={{ color: '#166534' }}
      >
        {isExporting ? <Loader2 size={16} className="animate-spin" /> : <FileSpreadsheet size={16} />}
        <span>Excel</span>
      </button>

      <button
        onClick={handleExportPDF}
        disabled={isExporting}
        className="flex items-center gap-1.5 text-sm font-semibold transition-colors hover:opacity-80 disabled:opacity-50"
        style={{ color: '#991B1B' }}
      >
        {isExporting ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
        <span>PDF</span>
      </button>

      <span className="text-xs text-gray-500 ml-auto bg-gray-100 px-2 py-1 rounded">
        {filters?.startDate ? `Filtered range export` : `Default 15-day period`}
      </span>
    </div>
  );
};

export default AttendanceExport;
