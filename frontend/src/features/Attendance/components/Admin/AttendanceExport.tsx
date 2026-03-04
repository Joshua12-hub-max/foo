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
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return dateStr || '-';
  }
};

/**
 * Format time for display — handles both Manila datetime strings ("2026-02-13 07:50:00")
 * and bare HH:MM:SS or HH:MM formats
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
  if ('employee_name' in record && typeof record.employee_name === 'string') return record.employee_name;
  return `Employee #${record.employeeId || record.employee_id}`;
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
  
  let appliedStartDate = filters?.startDate || dateRange?.startDate;
  let appliedEndDate = filters?.endDate || dateRange?.endDate;

  if (!appliedStartDate || !appliedEndDate) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const day = now.getDate();
    
    if (day <= 15) {
      appliedStartDate = new Date(year, month, 1).toISOString().split('T')[0];
      appliedEndDate = new Date(year, month, 15).toISOString().split('T')[0];
    } else {
      appliedStartDate = new Date(year, month, 16).toISOString().split('T')[0];
      appliedEndDate = new Date(year, month + 1, 0).toISOString().split('T')[0];
    }
  }

  const fetchAllData = async (): Promise<AttendanceRecord[]> => {
    try {
      const selectedDept = filters?.department && filters?.department !== 'All Departments' ? filters.department : null;

      // ═══════════════════════════════════════════════════════════════
      // 1. Fetch ALL data sources in parallel
      // ═══════════════════════════════════════════════════════════════
      const [logsResponse, employeesResponse, leavesResponse] = await Promise.all([
        // DTR Logs
        attendanceApi.getLogs({
          ...filters,
          startDate: appliedStartDate,
          endDate: appliedEndDate,
          page: 1,
          limit: 100000 
        }),
        // Employee list
        employeeApi.fetchEmployees({ department: filters?.department }),
        // Approved leaves for the date range
        leaveApi.getAllApplications({
          status: 'Approved',
          startDate: appliedStartDate,
          endDate: appliedEndDate,
          limit: 100000,
          page: 1,
        }).catch(() => ({ data: { applications: [] } })) // Graceful fallback
      ]);

      if (logsResponse.data.success && Array.isArray(logsResponse.data.data) && employeesResponse.success && Array.isArray(employeesResponse.employees)) {
        
        let logs = logsResponse.data.data;
        const employees = employeesResponse?.employees || [];
        const validEmpIds = new Set(employees.map((e: Employee) => String(e.employee_id || e.id)));
        
        // ═══════════════════════════════════════════════════════════════
        // 2. Build Leave Lookup: employeeId → Set of { date, leaveType }
        // ═══════════════════════════════════════════════════════════════
        const leaveMap = new Map<string, string>(); // key: "YYYY-MM-DD_empId" → leaveType
        
        const approvedLeaves: LeaveApplication[] = (leavesResponse as { data?: { applications?: LeaveApplication[] } })?.data?.applications || [];
        approvedLeaves.forEach((leave: LeaveApplication) => {
          if (leave.status !== 'Approved') return;
          const empId = String(leave.employee_id || leave.employee_id); // Ensure string ID
          const leaveStart = new Date(leave.start_date);
          const leaveEnd = new Date(leave.end_date);
          
          // Iterate each day of the leave period safely
          const d = new Date(leaveStart);
          while (d <= leaveEnd) {
            const dateStr = d.toISOString().split('T')[0];
            const key = `${dateStr}_${empId}`;
            leaveMap.set(key, leave.leave_type);
            d.setDate(d.getDate() + 1);
          }
        });
        
        // Strict Department Filtering
        if (selectedDept) {
            logs = logs.filter((log: AttendanceRecord) => validEmpIds.has(String(log.employee_id)));
        }

        const fullRecords: AttendanceRecord[] = [];

        // ═══════════════════════════════════════════════════════════════
        // 3. Generate Exact Date Range (timezone-safe)
        // ═══════════════════════════════════════════════════════════════
        const dateArray: string[] = [];
        let current = new Date(appliedStartDate! + 'T00:00:00');
        const end = new Date(appliedEndDate! + 'T00:00:00');
        
        while (current <= end) {
          dateArray.push(current.toISOString().split('T')[0]);
          current.setDate(current.getDate() + 1);
        }

        // ═══════════════════════════════════════════════════════════════
        // 4. Map DTR Logs by key: "date_employeeId"
        // Backend returns snake_case: employee_id, employee_name, late_minutes, etc.
        // ═══════════════════════════════════════════════════════════════
        const logMap = new Map<string, AttendanceRecord>();
        
        const empLookup = new Map<string, Employee>();
        employees.forEach((emp: Employee) => {
            const empId = String(emp.employee_id || emp.id);
            empLookup.set(empId, emp);
        });
        
        logs.forEach((log: DTRApiResponse) => {
            // Backend might return log.date as ISO string or YYYY-MM-DD
            const logDateVal = log.date ? (String(log.date).includes('T') ? log.date.split('T')[0] : log.date) : '';
            const empId = String(log.employee_id || '');
            if (!empId || !logDateVal) return;
            
            const key = `${logDateVal}_${empId}`;
            
            // Resolve name: prioritize exact match from employee DB
            const emp = empLookup.get(empId);
            const resolvedName = emp ? `${emp.first_name || ''} ${emp.last_name || ''}`.trim() : (log.employee_name || `Employee ${empId}`);
            
            const record: AttendanceRecord = {
              id: log.id,
              employeeId: empId,
              employee_id: empId as never, // Compatibility
              name: resolvedName,
              date: String(logDateVal),
              timeIn: log.time_in || undefined,
              timeOut: log.time_out || undefined,
              lateMinutes: Number(log.late_minutes ?? 0),
              undertimeMinutes: Number(log.undertime_minutes ?? 0),
              status: log.status || 'Present',
              department: log.department || emp?.department || selectedDept || undefined,
              duties: log.duties
            };
            
            logMap.set(key, record);
        });

        // ═══════════════════════════════════════════════════════════════
        // 5. Cross-Reference: For each date × employee, determine status
        // ═══════════════════════════════════════════════════════════════
        dateArray.reverse().forEach(dateStr => {
            employees.forEach((emp: Employee) => {
                const empId = String(emp.employee_id || emp.id);
                const key = `${dateStr}_${empId}`;
                const existingLog = logMap.get(key);
                const leaveType = leaveMap.get(key);
                const fullName = `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || `Employee ${empId}`;
                const isFuture = new Date(dateStr) > new Date();

                if (existingLog) {
                    // Robust check for Presence vs Absence
                    const hasTimes = existingLog.timeIn && existingLog.timeIn !== '-' && existingLog.timeIn !== 'null';
                    let finalStatus = existingLog.status;
                    if (!hasTimes && finalStatus === 'Present' && !leaveType) {
                        finalStatus = 'Absent';
                    }
                    if (leaveType) {
                        finalStatus = `On Leave (${getLeaveAbbreviation(leaveType)})`;
                    }

                    // Has DTR record — use it with corrected name
                    fullRecords.push({
                      ...existingLog,
                      name: fullName,
                      employeeId: empId,
                      department: existingLog.department || emp.department || selectedDept || 'N/A',
                      status: finalStatus,
                    });
                } else if (leaveType) {
                    // On approved leave — no DTR expected
                    fullRecords.push({
                        id: `leave-${Math.random()}`,
                        employee_id: (isNaN(Number(empId)) ? empId : Number(empId)) as never,
                        employeeId: empId,
                        name: fullName,
                        date: dateStr,
                        timeIn: '-',
                        timeOut: '-',
                        status: `On Leave (${getLeaveAbbreviation(leaveType)})`,
                        lateMinutes: 0,
                        undertimeMinutes: 0,
                        department: emp.department || selectedDept || 'N/A'
                    });
                } else if (!isFuture) {
                    // No DTR, no leave = Absent
                    fullRecords.push({
                        id: `absent-${Math.random()}`,
                        employee_id: (isNaN(Number(empId)) ? empId : Number(empId)) as never,
                        employeeId: empId,
                        name: fullName,
                        date: dateStr,
                        timeIn: '-',
                        timeOut: '-',
                        status: 'Absent',
                        lateMinutes: 0,
                        undertimeMinutes: 0,
                        department: emp.department || selectedDept || 'N/A'
                    });
                }
            });
        });

        return fullRecords;

      } else {
        console.warn("Could not fetch full datasets. Using raw logs.");
        return logsResponse?.data?.success ? logsResponse.data.data : data; 
      }
    } catch (error) {
      console.error("Error fetching full export data:", error);
      throw error; 
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
        dateRange: { startDate: appliedStartDate, endDate: appliedEndDate },
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
      const dateText = `Period: ${formatDate(appliedStartDate)} - ${formatDate(appliedEndDate)}`;
      doc.text(dateText, 14, 22);
      doc.text(`Total Records: ${exportData.length}`, 14, 28);

      // Table data — 13 columns
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
        headStyles: { 
          fillColor: [30, 58, 95],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'center',
          fontSize: 5.5
        },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        columnStyles: {
          0: { cellWidth: 16, halign: 'left' },
          1: { cellWidth: 28, halign: 'left' },
          2: { cellWidth: 28, halign: 'left' },
          3: { cellWidth: 18 },
          4: { cellWidth: 16 },
          5: { cellWidth: 16 },
          6: { cellWidth: 12 },
          7: { cellWidth: 12 },
          12: { cellWidth: 16 },
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
      <span className="text-xs text-gray-500 ml-auto bg-gray-100 px-2 py-1 rounded">
        {!filters?.startDate ? `Defaults to standard 15-day period` : `Filtered date range export`}
      </span>
    </div>
  );
};

export default AttendanceExport;
