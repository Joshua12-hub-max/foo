import React, { useState } from 'react';
import { FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { useToastStore } from '@/stores';
import { exportAttendanceToExcel } from './utils/attendanceExcelExport';
import { AttendanceRecord } from '../hooks/useAttendanceData';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface AttendanceExportProps {
  data: AttendanceRecord[];
  title: string;
  dateRange?: { startDate: string; endDate: string };
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
  if (record.first_name || record.last_name) {
    return `${record.first_name || ''} ${record.last_name || ''}`.trim();
  }
  return `Employee #${record.employee_id}`;
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

const AttendanceExport: React.FC<AttendanceExportProps> = ({ data, title, dateRange }) => {
  const showToast = useToastStore((state) => state.showToast);
  const showNotification = (message: string, type: 'success' | 'error') => showToast(message, type);
  const [isExporting, setIsExporting] = useState(false);
  const [groupByDepartment, setGroupByDepartment] = useState(false);
  
  const handleExportExcel = async () => {
    if (data.length === 0) {
      showNotification("No data to export", "error");
      return;
    }

    setIsExporting(true);
    try {
      await exportAttendanceToExcel(data, {
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

  const handleExportPDF = () => {
    if (data.length === 0) {
      showNotification("No data to export", "error");
      return;
    }

    try {
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
      doc.text(`Total Records: ${data.length}`, 14, 28);

      // Table data
      const tableData = data.map(record => [
        getEmployeeName(record),
        formatDate(record.date),
        formatTime(record.time_in),
        formatTime(record.time_out),
        formatMinutes(record.late),
        formatMinutes(record.undertime),
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
        disabled={isExporting || data.length === 0}
        className="flex items-center gap-1.5 text-sm font-semibold transition-colors hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ color: '#166534' }}
      >
        {isExporting ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <FileSpreadsheet size={16} />
        )}
        <span>{isExporting ? 'Exporting...' : 'Excel'}</span>
      </button>

      {/* PDF Export Button - DARK RED */}
      <button
        onClick={handleExportPDF}
        disabled={data.length === 0}
        className="flex items-center gap-1.5 text-sm font-semibold transition-colors hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ color: '#991B1B' }}
      >
        <FileText size={16} />
        <span>PDF</span>
      </button>

      {/* Record count */}
      <span className="text-xs text-gray-500 ml-auto">
        {data.length} {data.length === 1 ? 'record' : 'records'} available
      </span>
    </div>
  );
};

export default AttendanceExport;

