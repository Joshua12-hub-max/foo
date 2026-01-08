import { createWorkbook, downloadExcel } from '@/utils/excel';

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const formatMinutes = (minutes) => {
  if (minutes === undefined || minutes === null || minutes === 0) return '0m';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

export const exportToExcel = async (exportData, filename = 'Department_Attendance_Report') => {
  try {
    const { data, grandTotals, meta } = exportData;
    
    const workbook = createWorkbook();
    const worksheet = workbook.addWorksheet('AttendanceSummary');

    worksheet.columns = [
      { header: '', key: 'col1', width: 25 },
      { header: '', key: 'col2', width: 15 },
      { header: '', key: 'col3', width: 25 },
      { header: '', key: 'col4', width: 20 },
      { header: '', key: 'col5', width: 15 },
      { header: '', key: 'col6', width: 12 },
      { header: '', key: 'col7', width: 12 },
      { header: '', key: 'col8', width: 12 },
      { header: '', key: 'col9', width: 12 },
      { header: '', key: 'col10', width: 12 }
    ];

    worksheet.addRow(['DEPARTMENT ATTENDANCE REPORT']);
    worksheet.addRow([`Period: ${formatDate(meta?.fromDate)} to ${formatDate(meta?.toDate)}`]);
    worksheet.addRow([`Generated At: ${meta?.generatedAt ? new Date(meta.generatedAt).toLocaleString() : new Date().toLocaleString()}`]);
    worksheet.addRow([]);

    worksheet.getRow(1).font = { bold: true, size: 14 };
    worksheet.mergeCells('A1:J1');
    worksheet.mergeCells('A2:J2');
    worksheet.mergeCells('A3:J3');

    const headerRow = worksheet.addRow([
      'Dept/Department', 'Employee ID', 'Name', 'Position', 'Date',
      'Time In', 'Time Out', 'Status', 'Late (m)', 'UT (m)'
    ]);
    
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' }
    };

    if (data && Array.isArray(data)) {
      data.forEach(dept => {
        if (dept.records && Array.isArray(dept.records)) {
          dept.records.forEach(record => {
            worksheet.addRow([
              dept.department || '-',
              record.employeeId || '-',
              record.employeeName || '-',
              record.jobTitle || '-',
              formatDate(record.date),
              record.timeIn || '-',
              record.timeOut || '-',
              record.status || '-',
              record.lateMinutes || 0,
              record.undertimeMinutes || 0
            ]);
          });
        }

        if (dept.totals) {
          const subRow = worksheet.addRow([
            `${(dept.department || 'DEPT').toUpperCase()} TOTALS`,
            `Employees: ${dept.employeeCount || 0}`,
            `P: ${dept.totals.present || 0}`,
            `A: ${dept.totals.absent || 0}`,
            `L: ${dept.totals.late || 0}`,
            `LV: ${dept.totals.leave || 0}`,
            '', '',
            dept.totals.lateMinutes || 0,
            dept.totals.undertimeMinutes || 0
          ]);
          subRow.font = { bold: true };
          subRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF1F5F9' }
          };
        }
        
        worksheet.addRow([]);
      });
    }

    worksheet.addRow(['GRAND TOTALS']).font = { bold: true, size: 12 };
    if (grandTotals) {
      const totalRow = worksheet.addRow([
        'Summary',
        `Depts: ${meta?.totalDepartments || 0}`,
        `Employees: ${grandTotals.totalEmployees || 0}`,
        `P: ${grandTotals.totalPresent || 0}`,
        `A: ${grandTotals.totalAbsent || 0}`,
        `L: ${grandTotals.totalLate || 0}`,
        `LV: ${grandTotals.totalLeave || 0}`,
        '',
        grandTotals.totalLateMinutes || 0,
        grandTotals.totalUndertimeMinutes || 0
      ]);
      totalRow.font = { bold: true };
      totalRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFCBD5E1' }
      };
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${filename}_${new Date().getTime()}.xlsx`;
    anchor.click();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Error generating Excel:', err);
    throw err;
  }
};

export const exportToPDF = async (exportData, filename = 'Department_Attendance_Report') => {
  if (!exportData || !exportData.data) {
    console.error('No data available for PDF export');
    return;
  }

  try {
    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable')
    ]);

    const { data, grandTotals, meta } = exportData;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('DEPARTMENT ATTENDANCE REPORT', 14, 18);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Reporting Period: ${formatDate(meta?.fromDate)} - ${formatDate(meta?.toDate)}`, 14, 28);
    doc.text(`Generated On: ${meta?.generatedAt ? new Date(meta.generatedAt).toLocaleString() : new Date().toLocaleString()}`, 14, 34);

    const headers = ['Department', 'ID', 'Employee Name', 'Position', 'Date', 'In', 'Out', 'Status', 'Late', 'UT'];
    const tableData = [];

    if (data && Array.isArray(data)) {
      data.forEach(dept => {
        if (dept.records && Array.isArray(dept.records)) {
          dept.records.forEach(record => {
            tableData.push([
              dept.department || '-',
              record.employeeId || '-',
              record.employeeName || '-',
              record.jobTitle || '-',
              formatDate(record.date),
              record.timeIn || '-',
              record.timeOut || '-',
              record.status || '-',
              record.lateMinutes ? `${record.lateMinutes}m` : '-',
              record.undertimeMinutes ? `${record.undertimeMinutes}m` : '-'
            ]);
          });
        }

        if (dept.totals) {
          tableData.push([
            { content: `${dept.department || 'Dept'} Summary`, colSpan: 4, styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
            { content: `P:${dept.totals.present || 0} | A:${dept.totals.absent || 0} | L:${dept.totals.late || 0} | LV:${dept.totals.leave || 0}`, colSpan: 4, styles: { fontStyle: 'bold', fillColor: [241, 245, 249], halign: 'center' } },
            { content: formatMinutes(dept.totals.lateMinutes), styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
            { content: formatMinutes(dept.totals.undertimeMinutes), styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } }
          ]);
        }
      });
    }

    autoTable(doc, {
      head: [headers],
      body: tableData,
      startY: 45,
      theme: 'grid',
      headStyles: { fillColor: [51, 65, 85], textColor: 255, fontSize: 9, fontStyle: 'bold', halign: 'center' },
      bodyStyles: { fontSize: 8, textColor: 50 },
      columnStyles: {
        0: { cellWidth: 35 }, 1: { cellWidth: 20 }, 2: { cellWidth: 40 },
        3: { cellWidth: 35 }, 4: { cellWidth: 25 }, 5: { cellWidth: 15 },
        6: { cellWidth: 15 }, 7: { cellWidth: 20, halign: 'center' },
        8: { cellWidth: 15, halign: 'center' }, 9: { cellWidth: 15, halign: 'center' }
      },
      didDrawPage: () => {
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Page ${doc.internal.getNumberOfPages()}`, pageWidth - 20, pageHeight - 10);
      }
    });

    const finalY = (doc).lastAutoTable?.finalY ? (doc).lastAutoTable.finalY + 10 : null;
    
    if (finalY && finalY < pageHeight - 40) {
      doc.setDrawColor(200);
      doc.line(14, finalY, pageWidth - 14, finalY);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text('GRAND TOTAL SUMMARY', 14, finalY + 10);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      
      const summaryText = [
        `Departments: ${meta?.totalDepartments || 0}`,
        `Total Employees: ${grandTotals.totalEmployees || 0}`,
        `Present: ${grandTotals.totalPresent || 0}`,
        `Absent: ${grandTotals.totalAbsent || 0}`,
        `Late: ${grandTotals.totalLate || 0}`,
        `Leave: ${grandTotals.totalLeave || 0}`,
        `Total Late: ${formatMinutes(grandTotals.totalLateMinutes)}`,
        `Total Undertime: ${formatMinutes(grandTotals.totalUndertimeMinutes)}`
      ].join('   |   ');
      doc.text(summaryText, 14, finalY + 20);
    }

    doc.save(`${filename}_${new Date().getTime()}.pdf`);
  } catch (err) {
    console.error('Error generating PDF:', err);
    throw err;
  }
};

export const exportToCSV = exportToExcel;
export const generateCSV = exportToExcel;
export const generatePDFHTML = exportToPDF;