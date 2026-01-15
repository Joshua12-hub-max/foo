// Dynamic imports - jsPDF loaded on-demand to reduce initial bundle size

export interface LeaveRequest {
  id: string | number;
  name?: string;
  employee_id?: string | number;
  department?: string;
  leaveType?: string;
  status: string;
  fromDate: string | Date;
  toDate: string | Date;
  reason?: string;
  [key: string]: any;
}

export const generateLeaveRequestPDF = async (leaveRequest: LeaveRequest): Promise<void> => {
  try {
    // Dynamic imports - load jsPDF and autotable only when user generates PDF
    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable')
    ]);
    
    const doc = new jsPDF();

    // Add Logo (Placeholder or Text)
    doc.setFontSize(22);
    doc.setTextColor(40, 40, 40);
    doc.text('NEBR Leave Request Form', 105, 20, { align: 'center' });

    // Add Company Details
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('National Economic and Business Registry', 105, 28, { align: 'center' });
    doc.text('123 Business Road, City, Country', 105, 33, { align: 'center' });

    // Horizontal Line
    doc.setLineWidth(0.5);
    doc.line(20, 40, 190, 40);

    // Request Information
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Request Details', 20, 50);

    const requestData = [
      ['Request ID', leaveRequest.id || 'N/A'],
      ['Employee Name', leaveRequest.name || 'N/A'],
      ['Employee ID', leaveRequest.employee_id || 'N/A'],
      ['Department', leaveRequest.department || 'N/A'],
      ['Leave Type', leaveRequest.leaveType || 'N/A'],
      ['Status', leaveRequest.status || 'N/A'],
      ['From Date', new Date(leaveRequest.fromDate).toLocaleDateString()],
      ['To Date', new Date(leaveRequest.toDate).toLocaleDateString()],
      ['Reason', leaveRequest.reason || 'N/A'],
    ];

    autoTable(doc, {
      startY: 55,
      head: [['Field', 'Value']],
      body: requestData,
      theme: 'grid',
      headStyles: { fillColor: [39, 75, 70] }, // Matches theme color
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 60 },
        1: { cellWidth: 'auto' },
      },
    });

    // Approval Section
    const finalY = (doc as any).lastAutoTable.finalY + 20;

    doc.setFontSize(14);
    doc.text('Approval Status', 20, finalY);

    const approvalData = [
      ['Admin Action', leaveRequest.status === 'Approved' ? 'Approved' : leaveRequest.status === 'Rejected' ? 'Rejected' : 'Pending'],
      ['Processed By', 'Admin'], // Placeholder, can be dynamic if data available
      ['Date Processed', new Date().toLocaleDateString()], // Placeholder
    ];

    autoTable(doc, {
      startY: finalY + 5,
      head: [['Field', 'Value']],
      body: approvalData,
      theme: 'grid',
      headStyles: { fillColor: [39, 75, 70] },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 60 },
        1: { cellWidth: 'auto' },
      },
    });

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
      doc.text(
        `Generated on ${new Date().toLocaleString()}`,
        20,
        doc.internal.pageSize.height - 10
      );
    }

    // Save the PDF
    doc.save(`Leave_Request_${leaveRequest.id || 'Draft'}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Failed to generate PDF. Please try again.');
  }
};

export interface UndertimeRequest {
  id: string | number;
  employeeName?: string;
  name?: string;
  employeeId?: string | number;
  employee_id?: string | number;
  department?: string;
  date?: string | Date;
  timeOut?: string;
  time_out?: string;
  status: string;
  reason?: string;
  approved_by?: string;
  approvedBy?: string;
  rejection_reason?: string;
  rejectionReason?: string;
  reviewed_at?: string | Date;
  reviewedAt?: string | Date;
  [key: string]: any;
}

// Undertime Request PDF Generator
export const generateUndertimeRequestPDF = async (undertimeRequest: UndertimeRequest): Promise<void> => {
  try {
    // Dynamic imports - load jsPDF and autotable only when user generates PDF
    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable')
    ]);
    
    const doc = new jsPDF();

    // Add Logo (Placeholder or Text)
    doc.setFontSize(22);
    doc.setTextColor(40, 40, 40);
    doc.text('NEBR Undertime Request Form', 105, 20, { align: 'center' });

    // Add Company Details
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('National Economic and Business Registry', 105, 28, { align: 'center' });
    doc.text('123 Business Road, City, Country', 105, 33, { align: 'center' });

    // Horizontal Line
    doc.setLineWidth(0.5);
    doc.line(20, 40, 190, 40);

    // Request Information
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Undertime Request Details', 20, 50);

    const requestData = [
      ['Request ID', undertimeRequest.id || 'N/A'],
      ['Employee Name', undertimeRequest.employeeName || undertimeRequest.name || 'N/A'],
      ['Employee ID', undertimeRequest.employee_id || undertimeRequest.employeeId || 'N/A'],
      ['Department', undertimeRequest.department || 'N/A'],
      ['Date', undertimeRequest.date ? new Date(undertimeRequest.date).toLocaleDateString() : 'N/A'],
      ['Time Out', undertimeRequest.timeOut || undertimeRequest.time_out || 'N/A'],
      ['Status', undertimeRequest.status || 'Pending'],
      ['Reason', undertimeRequest.reason || 'N/A'],
    ];

    autoTable(doc, {
      startY: 55,
      head: [['Field', 'Value']],
      body: requestData,
      theme: 'grid',
      headStyles: { fillColor: [39, 75, 70] }, // Matches theme color #274b46
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 60 },
        1: { cellWidth: 'auto' },
      },
    });

    // Approval Section
    let finalY = (doc as any).lastAutoTable.finalY + 20;

    doc.setFontSize(14);
    doc.text('Approval Status', 20, finalY);

    const approvalData = [
      ['Admin Action', undertimeRequest.status === 'Approved' ? 'Approved' : undertimeRequest.status === 'Rejected' ? 'Rejected' : 'Pending'],
      ['Processed By', undertimeRequest.approved_by || undertimeRequest.approvedBy || 'Pending'],
      ['Rejection Reason', undertimeRequest.rejection_reason || undertimeRequest.rejectionReason || 'N/A'],
      ['Date Processed', undertimeRequest.reviewed_at || undertimeRequest.reviewedAt ? new Date(undertimeRequest.reviewed_at || undertimeRequest.reviewedAt).toLocaleDateString() : 'Pending'],
    ];

    autoTable(doc, {
      startY: finalY + 5,
      head: [['Field', 'Value']],
      body: approvalData,
      theme: 'grid',
      headStyles: { fillColor: [39, 75, 70] },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 60 },
        1: { cellWidth: 'auto' },
      },
    });

    // Signature Section
    finalY = (doc as any).lastAutoTable.finalY + 25;

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    
    // Employee Signature
    doc.text('Employee Signature:', 20, finalY);
    doc.line(20, finalY + 15, 90, finalY + 15);
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text('Date: _______________', 20, finalY + 22);

    // Supervisor Signature
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('Supervisor Signature:', 120, finalY);
    doc.line(120, finalY + 15, 190, finalY + 15);
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text('Date: _______________', 120, finalY + 22);

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
      doc.text(
        `Generated on ${new Date().toLocaleString()}`,
        20,
        doc.internal.pageSize.height - 10
      );
    }

    // Save the PDF
    doc.save(`Undertime_Request_${undertimeRequest.id || 'Draft'}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Failed to generate PDF. Please try again.');
  }
};
