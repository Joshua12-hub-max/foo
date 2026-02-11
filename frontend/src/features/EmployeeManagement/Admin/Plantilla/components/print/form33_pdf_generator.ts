import jsPDF from 'jspdf';

interface Form33Data {
  agencyName: string;
  appointeeName: string;
  positionTitle: string;
  salaryGrade: string;
  status: string;
  department: string;
  compensationRate: string;
  natureOfAppointment: string;
  viceName: string;
  vacatedReason: string;
  plantillaItemNo: string;
  pageNo: string;
  signatoryName: string;
  signatoryTitle: string;
  appointmentDate: string;
  hrmoName?: string;
  chairpersonName?: string;
  publishedFrom?: string;
  publishedTo?: string;
  publishedAt?: string;
  deliberationDate?: string;
}

export const generateForm33PDF = (data: Form33Data) => {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'legal' // 216mm x 356mm (8.5" x 14")
    });

    const pageWidth = 216;
    const pageHeight = 356;
    const marginLeft = 15;
    const marginRight = 15;
    const contentWidth = pageWidth - marginLeft - marginRight;

    // ==================== PAGE 1: APPOINTMENT ====================
    
    // CS Form Header (top-left)
    doc.setFontSize(9);
    doc.setFont('times', 'bolditalic');
    doc.text('CS Form No. 33-A', marginLeft, 12);
    doc.setFont('times', 'italic');
    doc.setFontSize(8);
    doc.text('Revised 2018', marginLeft, 17);

    // For Regulated Agencies box (top-right)
    doc.setFontSize(8);
    doc.setFont('times', 'normal');
    doc.rect(pageWidth - marginRight - 45, 8, 45, 10);
    doc.text('For Regulated Agencies', pageWidth - marginRight - 43, 14);

    // Stamp of Date (top-right corner)
    doc.setFontSize(7);
    doc.setFont('times', 'italic');
    doc.text('(Stamp of Date of Receipt)', pageWidth - marginRight, 25, { align: 'right' });

    // Republic of the Philippines Header
    doc.setFontSize(12);
    doc.setFont('times', 'bold');
    doc.text('Republic of the Philippines', pageWidth / 2, 38, { align: 'center' });

    // Agency Name
    doc.setFontSize(11);
    doc.setFont('times', 'bold');
    doc.text(data.agencyName?.toUpperCase() || 'AGENCY NAME', pageWidth / 2, 48, { align: 'center' });
    doc.line(marginLeft + 25, 50, pageWidth - marginRight - 25, 50);
    doc.setFontSize(8);
    doc.setFont('times', 'italic');
    doc.text('(Name of Agency)', pageWidth / 2, 55, { align: 'center' });

    // Main Body
    let y = 68;
    const lineHeight = 8;

    // Name Row
    doc.setFontSize(11);
    doc.setFont('times', 'bold');
    doc.text('Mr./Mrs./Ms.:', marginLeft, y);
    doc.setFont('times', 'bold');
    doc.text(data.appointeeName?.toUpperCase() || '', pageWidth / 2, y, { align: 'center' });
    doc.line(marginLeft + 28, y + 2, pageWidth - marginRight, y + 2);
    y += lineHeight + 4;

    // Position Row
    doc.setFontSize(10);
    doc.setFont('times', 'normal');
    doc.text('You are hereby appointed as', marginLeft + 5, y);
    
    const posStart = marginLeft + 55;
    const posWidth = 60;
    doc.setFont('times', 'bold');
    doc.text(data.positionTitle?.toUpperCase() || '', posStart + posWidth / 2, y, { align: 'center' });
    doc.line(posStart, y + 2, posStart + posWidth, y + 2);
    
    doc.setFont('times', 'normal');
    doc.text('(', posStart + posWidth + 2, y);
    doc.setFont('times', 'bold');
    doc.text(data.salaryGrade || '', posStart + posWidth + 20, y, { align: 'center' });
    doc.line(posStart + posWidth + 5, y + 2, posStart + posWidth + 35, y + 2);
    doc.setFont('times', 'normal');
    doc.text(')', posStart + posWidth + 38, y);

    // Position label
    y += 5;
    doc.setFontSize(7);
    doc.setFont('times', 'italic');
    doc.text('(Position Title)', posStart + posWidth / 2, y, { align: 'center' });
    doc.text('(Salary Grade)', posStart + posWidth + 20, y, { align: 'center' });
    y += lineHeight;

    // Status Row
    doc.setFontSize(10);
    doc.setFont('times', 'normal');
    doc.text('under', marginLeft, y);
    
    doc.setFont('times', 'bold');
    doc.text(data.status?.toUpperCase() || '', marginLeft + 25, y, { align: 'center' });
    doc.line(marginLeft + 10, y + 2, marginLeft + 40, y + 2);
    
    doc.setFont('times', 'normal');
    doc.text('status at the', marginLeft + 45, y);
    
    doc.setFont('times', 'bold');
    doc.text(data.department?.toUpperCase() || '', marginLeft + 120, y, { align: 'center' });
    doc.line(marginLeft + 70, y + 2, pageWidth - marginRight, y + 2);

    // Status labels
    y += 5;
    doc.setFontSize(7);
    doc.setFont('times', 'italic');
    doc.text('(Permanent, Temporary, etc.)', marginLeft + 25, y, { align: 'center' });
    doc.text('(Office/Department/Unit)', marginLeft + 120, y, { align: 'center' });
    y += lineHeight;

    // Compensation Row
    doc.setFontSize(10);
    doc.setFont('times', 'normal');
    doc.text('with a compensation rate of', marginLeft, y);
    
    // Sanitize compensation rate - remove any special characters
    const cleanCompRate = (data.compensationRate || '')
      .replace(/[^\d.,]/g, '') // Keep only digits, dots, and commas
      .trim();
    
    doc.setFont('times', 'bold');
    doc.text(cleanCompRate, marginLeft + 85, y, { align: 'center' });
    doc.line(marginLeft + 50, y + 2, marginLeft + 120, y + 2);
    
    doc.setFont('times', 'normal');
    doc.text('pesos per month.', marginLeft + 125, y);
    y += lineHeight + 4;

    // Nature of Appointment Row
    doc.text('The nature of this appointment is', marginLeft + 5, y);
    
    doc.setFont('times', 'bold');
    doc.text(data.natureOfAppointment?.toUpperCase() || '', marginLeft + 85, y, { align: 'center' });
    doc.line(marginLeft + 60, y + 2, marginLeft + 110, y + 2);
    
    doc.setFont('times', 'normal');
    doc.text('vice', marginLeft + 115, y);
    
    doc.setFont('times', 'bold');
    doc.text(data.viceName?.toUpperCase() || '', marginLeft + 150, y, { align: 'center' });
    doc.line(marginLeft + 125, y + 2, pageWidth - marginRight, y + 2);

    // Nature labels
    y += 5;
    doc.setFontSize(7);
    doc.setFont('times', 'italic');
    doc.text('(Original, Promotion, etc.)', marginLeft + 85, y, { align: 'center' });
    y += lineHeight;

    // Vice/Plantilla Row
    doc.setFontSize(10);
    doc.setFont('times', 'normal');
    doc.text(', who', marginLeft, y);
    
    doc.setFont('times', 'bold');
    doc.text(data.vacatedReason?.toUpperCase() || '', marginLeft + 35, y, { align: 'center' });
    doc.line(marginLeft + 12, y + 2, marginLeft + 58, y + 2);
    
    doc.setFont('times', 'normal');
    doc.text('with Plantilla Item No.', marginLeft + 62, y);
    
    doc.setFont('times', 'bold');
    doc.text(data.plantillaItemNo || '', marginLeft + 140, y, { align: 'center' });
    doc.line(marginLeft + 105, y + 2, pageWidth - marginRight, y + 2);

    // Vice labels
    y += 5;
    doc.setFontSize(7);
    doc.setFont('times', 'italic');
    doc.text('(Transferred, Retired, etc.)', marginLeft + 35, y, { align: 'center' });
    y += lineHeight;

    // Page Number Row
    doc.setFontSize(10);
    doc.setFont('times', 'normal');
    doc.text('Page', marginLeft, y);
    doc.setFont('times', 'bold');
    doc.text(data.pageNo || '', marginLeft + 15, y, { align: 'center' });
    doc.line(marginLeft + 10, y + 2, marginLeft + 22, y + 2);
    doc.setFont('times', 'normal');
    doc.text('.', marginLeft + 24, y);
    y += lineHeight + 4;

    // Effectivity Statement
    doc.text('This appointment shall take effect on the date of signing by the appointing', marginLeft + 5, y);
    y += 5;
    doc.text('officer/authority.', marginLeft, y);
    y += 20;

    // Signatory Section (right-aligned)
    const sigX = pageWidth - marginRight - 60;
    doc.text('Very truly yours,', sigX, y);
    y += 18;

    doc.setFont('times', 'bold');
    doc.setFontSize(11);
    doc.text(data.signatoryName?.toUpperCase() || '', sigX + 30, y, { align: 'center' });
    doc.line(sigX, y + 2, pageWidth - marginRight, y + 2);
    y += 5;
    doc.setFontSize(9);
    doc.setFont('times', 'normal');
    doc.text(data.signatoryTitle || '', sigX + 30, y, { align: 'center' });
    y += 4;
    doc.setFontSize(8);
    doc.setFont('times', 'italic');
    doc.text('Appointing Officer/Authority', sigX + 30, y, { align: 'center' });
    y += 12;

    // Date of Signing
    doc.setFontSize(10);
    doc.setFont('times', 'bold');
    doc.text(data.appointmentDate || '', sigX + 30, y, { align: 'center' });
    doc.line(sigX + 5, y + 2, pageWidth - marginRight - 5, y + 2);
    y += 5;
    doc.setFontSize(8);
    doc.setFont('times', 'italic');
    doc.text('Date of Signing', sigX + 30, y, { align: 'center' });

    // CSC Action Box
    const cscBoxY = 260;
    const cscBoxHeight = 55;
    doc.setLineWidth(0.5);
    doc.rect(marginLeft, cscBoxY, contentWidth, cscBoxHeight);

    doc.setFontSize(10);
    doc.setFont('times', 'bold');
    doc.text('CSC ACTION:', marginLeft + 5, cscBoxY + 8);

    // Dry seal circle
    doc.setLineWidth(0.3);
    doc.circle(pageWidth / 2, cscBoxY + 28, 15);

    // Authorized Official
    doc.setFontSize(9);
    doc.line(marginLeft + 15, cscBoxY + 42, marginLeft + 60, cscBoxY + 42);
    doc.setFont('times', 'bold');
    doc.text('Authorized Official', marginLeft + 37, cscBoxY + 48, { align: 'center' });

    // Date
    doc.line(pageWidth - marginRight - 50, cscBoxY + 42, pageWidth - marginRight - 15, cscBoxY + 42);
    doc.text('Date', pageWidth - marginRight - 32, cscBoxY + 48, { align: 'center' });

    // ==================== PAGE 2: CERTIFICATIONS ====================
    doc.addPage('legal', 'portrait');

    // Certification 1 Box
    let y2 = 15;
    doc.setLineWidth(0.5);
    doc.rect(marginLeft, y2, contentWidth, 55);

    doc.setFontSize(11);
    doc.setFont('times', 'bold');
    doc.text('Certification', pageWidth / 2, y2 + 10, { align: 'center' });

    doc.setFontSize(9);
    doc.setFont('times', 'normal');
    const cert1 = 'This is to certify that all requirements and supporting papers pursuant to the 2017 Omnibus Rules on Appointments and Other Human Resource Actions, have been complied with, reviewed, and found to be in order.';
    const cert1Lines = doc.splitTextToSize(cert1, contentWidth - 10);
    doc.text(cert1Lines, marginLeft + 5, y2 + 18);

    const cert1b = `The position was published at ${data.publishedAt || '_______'} from ${data.publishedFrom || '_______'} to ${data.publishedTo || '_______'} in consonance with Republic Act No. 7041. The assessment by the Human Resource Merit Promotion and Selection Board (HRMPSB) started on ${data.deliberationDate || '_______'}.`;
    const cert1bLines = doc.splitTextToSize(cert1b, contentWidth - 10);
    doc.text(cert1bLines, marginLeft + 5, y2 + 32);

    // HRMO Signature
    doc.setFont('times', 'bold');
    doc.text(data.hrmoName?.toUpperCase() || '', pageWidth - marginRight - 35, y2 + 48, { align: 'center' });
    doc.line(pageWidth - marginRight - 55, y2 + 50, pageWidth - marginRight - 15, y2 + 50);
    doc.setFontSize(8);
    doc.text('HRMO', pageWidth - marginRight - 35, y2 + 55, { align: 'center' });

    // Certification 2 Box
    y2 = 75;
    doc.rect(marginLeft, y2, contentWidth, 45);

    doc.setFontSize(11);
    doc.setFont('times', 'bold');
    doc.text('Certification', pageWidth / 2, y2 + 10, { align: 'center' });

    doc.setFontSize(9);
    doc.setFont('times', 'normal');
    const cert2 = `This is to certify that the appointee has been screened and found qualified by at least the majority of the HRMPSB/Placement Committee during the deliberation held on ${data.deliberationDate || '____________'}.`;
    const cert2Lines = doc.splitTextToSize(cert2, contentWidth - 10);
    doc.text(cert2Lines, marginLeft + 5, y2 + 18);

    // Chairperson Signature
    doc.setFont('times', 'bold');
    doc.text(data.chairpersonName?.toUpperCase() || '', pageWidth - marginRight - 45, y2 + 36, { align: 'center' });
    doc.line(pageWidth - marginRight - 70, y2 + 38, pageWidth - marginRight - 20, y2 + 38);
    doc.setFontSize(7);
    doc.text('Chairperson, HRMPSB/Placement Committee', pageWidth - marginRight - 45, y2 + 43, { align: 'center' });

    // CSC Notation Box (gray background)
    y2 = 125;
    const notationHeight = 120;
    doc.setFillColor(220, 220, 220);
    doc.rect(marginLeft, y2, contentWidth, notationHeight, 'FD');
    doc.setFillColor(255, 255, 255);
    doc.rect(marginLeft + 2, y2 + 2, contentWidth - 4, notationHeight - 4, 'F');

    // CSC Notation Header
    doc.setFillColor(200, 200, 200);
    doc.rect(marginLeft + 5, y2 + 5, contentWidth - 10, 10, 'FD');
    doc.setFontSize(10);
    doc.setFont('times', 'bold');
    doc.text('CSC Notation', pageWidth / 2, y2 + 12, { align: 'center' });

    // Lines for notation
    for (let i = 0; i < 8; i++) {
      doc.line(marginLeft + 10, y2 + 25 + (i * 10), pageWidth - marginRight - 10, y2 + 25 + (i * 10));
    }

    // Warning Text
    doc.setFontSize(7);
    doc.setFont('times', 'bold');
    doc.rect(marginLeft + 5, y2 + notationHeight - 20, contentWidth - 10, 15);
    doc.text('ANY ERASURE OR ALTERATION ON THE CSC ACTION SHALL NULLIFY OR INVALIDATE THIS APPOINTMENT', pageWidth / 2, y2 + notationHeight - 12, { align: 'center' });
    doc.text('EXCEPT IF THE ALTERATION WAS AUTHORIZED BY THE COMMISSION.', pageWidth / 2, y2 + notationHeight - 7, { align: 'center' });

    // Acknowledgement Box
    y2 = 250;
    doc.rect(marginLeft, y2, contentWidth, 55);
    doc.line(pageWidth / 2, y2, pageWidth / 2, y2 + 55);

    // Left side - Copy info
    doc.setFontSize(8);
    doc.setFont('times', 'normal');
    doc.text('Original Copy - for the Agency', marginLeft + 5, y2 + 10);
    doc.text('Certified True Copy - for the Civil Service Commission', marginLeft + 5, y2 + 17);
    doc.text('Certified True Copy - for the Appointee', marginLeft + 5, y2 + 24);

    // Right side - Acknowledgement
    doc.setFontSize(9);
    doc.setFont('times', 'bold');
    doc.text('Acknowledgement', pageWidth / 2 + (contentWidth / 4), y2 + 10, { align: 'center' });
    doc.setFont('times', 'normal');
    doc.setFontSize(8);
    doc.text('Received original/photocopy of appointment on', pageWidth / 2 + 5, y2 + 20);
    doc.line(pageWidth / 2 + 10, y2 + 35, pageWidth - marginRight - 10, y2 + 35);
    doc.line(pageWidth / 2 + 20, y2 + 50, pageWidth - marginRight - 20, y2 + 50);
    doc.text('Appointee', pageWidth / 2 + (contentWidth / 4), y2 + 55, { align: 'center' });

    // Output
    const pdfBlob = doc.output('blob');
    const url = URL.createObjectURL(pdfBlob);
    window.open(url, '_blank');
  } catch (error) {
    console.error('Failed to generate CS Form 33 PDF:', error);
    throw error;
  }
};
