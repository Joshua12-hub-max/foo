/**
 * Export utilities for Department Reports
 * Uses xlsx for Excel and jspdf + jspdf-autotable for PDF
 */
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * Format date for display
 * @param {string} dateStr - Date string  
 * @returns {string} - Formatted date
 */
const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

/**
 * Format minutes to hours and minutes string
 * @param {number} minutes - Total minutes
 * @returns {string} - Formatted string (e.g., "2h 30m")
 */
const formatMinutes = (minutes) => {
  if (!minutes || minutes === 0) return '0';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

/**
 * Export to Excel (XLSX) with proper formatting
 * @param {Object} exportData - Data from export API
 * @param {string} filename - Output filename (without extension)
 */
export const exportToExcel = (exportData, filename = 'department_attendance_report') => {
  const { data, grandTotals, meta } = exportData;
  
  // Create workbook
  const wb = XLSX.utils.book_new();
  
  // Prepare data rows
  const wsData = [];
  
  // Title row
  wsData.push(['DEPARTMENT ATTENDANCE REPORT']);
  wsData.push([`Period: ${formatDate(meta.fromDate)} to ${formatDate(meta.toDate)}`]);
  wsData.push([`Generated: ${new Date(meta.generatedAt).toLocaleString()}`]);
  wsData.push([]); // Empty row
  
  // Headers
  const headers = [
    'Department',
    'Employee ID',
    'Employee Name',
    'Position',
    'Date',
    'Time In',
    'Time Out',
    'Status',
    'Late (mins)',
    'Undertime (mins)'
  ];
  wsData.push(headers);
  
  // Data rows grouped by department
  data.forEach(dept => {
    // Add records for this department
    dept.records.forEach(record => {
      wsData.push([
        dept.department,
        record.employeeId,
        record.employeeName,
        record.jobTitle,
        formatDate(record.date),
        record.timeIn,
        record.timeOut,
        record.status,
        record.lateMinutes || 0,
        record.undertimeMinutes || 0
      ]);
    });
    
    // Department subtotal row
    wsData.push([
      `${dept.department} - SUBTOTAL`,
      `Employees: ${dept.employeeCount}`,
      `Present: ${dept.totals.present}`,
      `Absent: ${dept.totals.absent}`,
      `Late: ${dept.totals.late}`,
      `Leave: ${dept.totals.leave}`,
      '',
      '',
      dept.totals.lateMinutes || 0,
      dept.totals.undertimeMinutes || 0
    ]);
    
    // Empty row between departments
    wsData.push([]);
  });
  
  // Grand total
  wsData.push([]);
  wsData.push(['GRAND TOTAL']);
  wsData.push([
    `Total Employees: ${grandTotals.totalEmployees}`,
    `Present: ${grandTotals.totalPresent}`,
    `Absent: ${grandTotals.totalAbsent}`,
    `Late: ${grandTotals.totalLate}`,
    `Leave: ${grandTotals.totalLeave}`,
    '',
    '',
    '',
    grandTotals.totalLateMinutes || 0,
    grandTotals.totalUndertimeMinutes || 0
  ]);
  
  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  
  // Set column widths
  ws['!cols'] = [
    { wch: 20 }, // Department
    { wch: 15 }, // Employee ID
    { wch: 25 }, // Employee Name
    { wch: 20 }, // Position
    { wch: 15 }, // Date
    { wch: 12 }, // Time In
    { wch: 12 }, // Time Out
    { wch: 12 }, // Status
    { wch: 12 }, // Late
    { wch: 14 }  // Undertime
  ];
  
  // Merge title cells
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 9 } }, // Title
    { s: { r: 1, c: 0 }, e: { r: 1, c: 9 } }, // Period
    { s: { r: 2, c: 0 }, e: { r: 2, c: 9 } }  // Generated
  ];
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Attendance Report');
  
  // Generate and download file
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

/**
 * Export to PDF with proper table formatting
 * @param {Object} exportData - Data from export API
 * @param {string} filename - Output filename (without extension)
 */
export const exportToPDF = (exportData, filename = 'department_attendance_report') => {
  const { data, grandTotals, meta } = exportData;
  
  // Create PDF document (landscape for more columns)
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });
  
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('DEPARTMENT ATTENDANCE REPORT', pageWidth / 2, 15, { align: 'center' });
  
  // Subtitle
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Period: ${formatDate(meta.fromDate)} to ${formatDate(meta.toDate)}`, pageWidth / 2, 22, { align: 'center' });
  doc.text(`Generated: ${new Date(meta.generatedAt).toLocaleString()}`, pageWidth / 2, 27, { align: 'center' });
  
  // Table headers
  const headers = [
    'Department',
    'Employee ID',
    'Name',
    'Position',
    'Date',
    'Time In',
    'Time Out',
    'Status',
    'Late',
    'UT'
  ];
  
  // Prepare table data
  const tableData = [];
  
  data.forEach(dept => {
    // Add records
    dept.records.forEach(record => {
      tableData.push([
        dept.department,
        record.employeeId,
        record.employeeName,
        record.jobTitle,
        formatDate(record.date),
        record.timeIn,
        record.timeOut,
        record.status,
        record.lateMinutes ? `${record.lateMinutes}m` : '-',
        record.undertimeMinutes ? `${record.undertimeMinutes}m` : '-'
      ]);
    });
    
    // Department subtotal
    tableData.push([
      { content: `${dept.department} Subtotal`, colSpan: 6, styles: { fontStyle: 'bold', fillColor: [255, 243, 205] } },
      { content: `P:${dept.totals.present} A:${dept.totals.absent} L:${dept.totals.late}`, colSpan: 2, styles: { fontStyle: 'bold', fillColor: [255, 243, 205] } },
      { content: formatMinutes(dept.totals.lateMinutes), styles: { fontStyle: 'bold', fillColor: [255, 243, 205] } },
      { content: formatMinutes(dept.totals.undertimeMinutes), styles: { fontStyle: 'bold', fillColor: [255, 243, 205] } }
    ]);
  });
  
  // Generate table
  doc.autoTable({
    head: [headers],
    body: tableData,
    startY: 32,
    theme: 'grid',
    headStyles: {
      fillColor: [75, 85, 99], // Gray-600
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 8
    },
    bodyStyles: {
      fontSize: 7,
      cellPadding: 2
    },
    columnStyles: {
      0: { cellWidth: 28 },  // Department
      1: { cellWidth: 22 },  // Employee ID
      2: { cellWidth: 35 },  // Name
      3: { cellWidth: 30 },  // Position
      4: { cellWidth: 22 },  // Date
      5: { cellWidth: 18 },  // Time In
      6: { cellWidth: 18 },  // Time Out
      7: { cellWidth: 18, halign: 'center' },  // Status
      8: { cellWidth: 15, halign: 'center' },  // Late
      9: { cellWidth: 15, halign: 'center' }   // UT
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251]
    },
    didDrawPage: function(data) {
      // Footer
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text(
        `Page ${doc.internal.getNumberOfPages()}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }
  });
  
  // Grand Total section at the end
  const finalY = doc.lastAutoTable.finalY + 10;
  
  doc.setFillColor(209, 250, 229); // Green-100
  doc.rect(14, finalY, pageWidth - 28, 20, 'F');
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text('GRAND TOTAL', 20, finalY + 8);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  const totalsText = [
    `Employees: ${grandTotals.totalEmployees}`,
    `Present: ${grandTotals.totalPresent}`,
    `Absent: ${grandTotals.totalAbsent}`,
    `Late: ${grandTotals.totalLate}`,
    `Leave: ${grandTotals.totalLeave}`,
    `Total Late: ${formatMinutes(grandTotals.totalLateMinutes)}`,
    `Total UT: ${formatMinutes(grandTotals.totalUndertimeMinutes)}`
  ].join('   |   ');
  
  doc.text(totalsText, 20, finalY + 16);
  
  // Save PDF
  doc.save(`${filename}.pdf`);
};

// Legacy exports for backward compatibility
export const exportToCSV = exportToExcel;
export const generateCSV = exportToExcel;
export const generatePDFHTML = exportToPDF;
