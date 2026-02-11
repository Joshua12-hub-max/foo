/**
 * PSI-POP PDF Generator (CSC Form No. 1, Revised 2018)
 * Official Plantilla of Personnel Format - Department of Budget and Management
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Position } from '@/api/plantillaApi';

export interface PSIPOPConfig {
  departmentGocc: string;
  bureauAgency: string;
  fiscalYear: string;
  preparedBy: string;
  preparedByTitle: string;
  approvedBy: string;
  approvedByTitle: string;
}

/**
 * Format date to mm/dd/yyyy
 */
const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  } catch {
    return dateStr;
  }
};

/**
 * Parse incumbent name into parts (Last, First Middle)
 */
const parseIncumbentName = (name?: string): { lastName: string; firstName: string; middleName: string } => {
  if (!name) return { lastName: '', firstName: '', middleName: '' };
  
  const parts = name.split(',').map(s => s.trim());
  let lastName = '', firstName = '', middleName = '';
  
  if (parts.length > 0) lastName = parts[0];
  if (parts.length > 1) {
    const firstParts = parts[1].split(' ');
    firstName = firstParts[0] || '';
    if (firstParts.length > 1) middleName = firstParts.slice(1).join(' ');
  }
  
  return { lastName, firstName, middleName };
};

/**
 * Generate PSI-POP PDF matching CSC Form No. 1 (Revised 2018)
 * Landscape, Legal Size with official table format
 */
export const generatePSIPOPPDF = (
  positions: Position[],
  config: PSIPOPConfig
): void => {
  try {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'legal' // 356mm x 216mm
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 8;
    const contentWidth = pageWidth - (margin * 2);

    // ========== FORM LABEL (TOP LEFT) ==========
    doc.setFontSize(7);
    doc.setFont('times', 'italic');
    doc.text('CSC Form No. 1', margin, 8);
    doc.text('(Revised 2018)', margin, 11);

    // ========== HEADER ==========
    doc.setFont('times', 'normal');
    doc.setFontSize(9);
    doc.text('Republic of the Philippines', pageWidth / 2, 10, { align: 'center' });
    doc.text('Civil Service Commission', pageWidth / 2, 14, { align: 'center' });

    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.text('Plantilla of Personnel', pageWidth / 2, 20, { align: 'center' });

    doc.setFont('times', 'normal');
    doc.setFontSize(9);
    doc.text(`for the Fiscal Year ${config.fiscalYear || '________'}`, pageWidth / 2, 25, { align: 'center' });

    // ========== DEPARTMENT/AGENCY INFO BOX ==========
    const infoBoxY = 29;
    doc.setDrawColor(0);
    doc.setLineWidth(0.3);
    
    // Left box - Department/GOCC
    doc.rect(margin, infoBoxY, contentWidth / 2, 8);
    doc.setFontSize(7);
    doc.setFont('times', 'bold');
    doc.text('(1) Department/GOCC:', margin + 2, infoBoxY + 4);
    doc.setFont('times', 'normal');
    doc.text(config.departmentGocc || '', margin + 35, infoBoxY + 4);
    
    // Right box - Bureau/Agency
    doc.rect(margin + contentWidth / 2, infoBoxY, contentWidth / 2, 8);
    doc.setFont('times', 'bold');
    doc.text('(2) Bureau/Agency/Subsidiary:', margin + contentWidth / 2 + 2, infoBoxY + 4);
    doc.setFont('times', 'normal');
    doc.text(config.bureauAgency || '', margin + contentWidth / 2 + 45, infoBoxY + 4);

    // ========== MAIN TABLE ==========
    // Column headers matching official CSC Form No. 1 format
    const headerRow1 = [
      { content: 'ITEM\nNo.', rowSpan: 2, styles: { valign: 'middle' as const, halign: 'center' as const, fontSize: 6 } },
      { content: 'Position Title', rowSpan: 2, styles: { valign: 'middle' as const, halign: 'center' as const, fontSize: 6 } },
      { content: 'SG', rowSpan: 2, styles: { valign: 'middle' as const, halign: 'center' as const, fontSize: 6 } },
      { content: 'Annual Salary', colSpan: 2, styles: { halign: 'center' as const, fontSize: 6 } },
      { content: 'S\nT\nE\nP', rowSpan: 2, styles: { valign: 'middle' as const, halign: 'center' as const, fontSize: 5 } },
      { content: 'Area', colSpan: 3, styles: { halign: 'center' as const, fontSize: 6 } },
      { content: 'Name of Incumbents', colSpan: 3, styles: { halign: 'center' as const, fontSize: 6 } },
      { content: 'Date of Birth\n(mm/dd/yyyy)', rowSpan: 2, styles: { valign: 'middle' as const, halign: 'center' as const, fontSize: 5 } },
      { content: 'Date of\nOriginal\nAppointment\n(mm/dd/yyyy)', rowSpan: 2, styles: { valign: 'middle' as const, halign: 'center' as const, fontSize: 5 } },
      { content: 'Date of\nLast\nPromotion\n(mm/dd/yyyy)', rowSpan: 2, styles: { valign: 'middle' as const, halign: 'center' as const, fontSize: 5 } },
      { content: 'S\nT\nA\nT\nU\nS', rowSpan: 2, styles: { valign: 'middle' as const, halign: 'center' as const, fontSize: 5 } }
    ];

    const headerRow2 = [
      { content: 'Authorized', styles: { halign: 'center' as const, fontSize: 5 } },
      { content: 'Actual', styles: { halign: 'center' as const, fontSize: 5 } },
      { content: 'C\nO\nD\nE', styles: { halign: 'center' as const, fontSize: 5 } },
      { content: 'T\nY\nP\nE', styles: { halign: 'center' as const, fontSize: 5 } },
      { content: 'L\nE\nV\nE\nL', styles: { halign: 'center' as const, fontSize: 5 } },
      { content: 'Last Name', styles: { halign: 'center' as const, fontSize: 5 } },
      { content: 'First Name', styles: { halign: 'center' as const, fontSize: 5 } },
      { content: 'Middle Name', styles: { halign: 'center' as const, fontSize: 5 } }
    ];

    // Column numbers row
    const columnNumbersRow = [
      '(3)', '(4)', '(5)', '(6)', '(7)', '(8)', '(9)', '(10)', '(11)',
      '(12)', '(13)', '(14)', '(15)', '(16)', '(17)', '(18)'
    ];

    // Transform positions data for table
    const tableData = positions.map(pos => {
      const annualSalary = pos.monthly_salary 
        ? (Number(pos.monthly_salary) * 12).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : '';
      const actualSalary = pos.is_vacant 
        ? '-' 
        : annualSalary;

      const { lastName, firstName, middleName } = parseIncumbentName(pos.incumbent_name);
      
      // Status abbreviation
      let statusCode = '';
      if (pos.is_vacant) {
        statusCode = 'V';
      } else if (pos.status) {
        statusCode = pos.status === 'Active' ? 'P' : pos.status.substring(0, 2).toUpperCase();
      } else {
        statusCode = 'P'; // Permanent by default
      }

      return [
        pos.item_number || '',
        pos.position_title || '',
        pos.salary_grade?.toString() || '',
        annualSalary,
        actualSalary,
        pos.step_increment?.toString() || '1',
        pos.area_code || '',
        pos.area_type || '',
        pos.area_level || '',
        lastName,
        firstName,
        middleName,
        formatDate(pos.birth_date),
        formatDate(pos.original_appointment_date),
        formatDate(pos.last_promotion_date),
        statusCode
      ];
    });

    // Generate table
    autoTable(doc, {
      head: [headerRow1, headerRow2, columnNumbersRow.map(h => ({ content: h, styles: { halign: 'center' as const, fontSize: 5, fontStyle: 'bold' as const } }))],
      body: tableData,
      startY: 38,
      margin: { left: margin, right: margin },
      theme: 'grid',
      styles: {
        font: 'times',
        fontSize: 6,
        cellPadding: 0.8,
        lineWidth: 0.2,
        lineColor: [0, 0, 0],
        overflow: 'linebreak',
        valign: 'middle'
      },
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        lineWidth: 0.3
      },
      columnStyles: {
        0: { cellWidth: 18, halign: 'center' },   // Item No.
        1: { cellWidth: 35 },                      // Position Title
        2: { cellWidth: 8, halign: 'center' },    // SG
        3: { cellWidth: 20, halign: 'right' },    // Authorized Salary
        4: { cellWidth: 20, halign: 'right' },    // Actual Salary
        5: { cellWidth: 7, halign: 'center' },    // Step
        6: { cellWidth: 8, halign: 'center' },    // Code
        7: { cellWidth: 7, halign: 'center' },    // Type
        8: { cellWidth: 8, halign: 'center' },    // Level
        9: { cellWidth: 25 },                      // Last Name
        10: { cellWidth: 22 },                     // First Name
        11: { cellWidth: 22 },                     // Middle Name
        12: { cellWidth: 18, halign: 'center' },  // DOB
        13: { cellWidth: 18, halign: 'center' },  // Original Appt
        14: { cellWidth: 18, halign: 'center' },  // Last Promo
        15: { cellWidth: 8, halign: 'center' }    // Status
      },
      didDrawPage: (data) => {
        // Add page number
        const pageCount = (doc as any).internal.getNumberOfPages();
        doc.setFontSize(7);
        doc.setFont('times', 'normal');
        doc.text(
          `Page ${data.pageNumber} of ${pageCount}`,
          pageWidth - margin - 20,
          pageHeight - 5
        );

        // Repeat header info on subsequent pages
        if (data.pageNumber > 1) {
          doc.setFontSize(7);
          doc.setFont('times', 'italic');
          doc.text('CSC Form No. 1 (Revised 2018) - Plantilla of Personnel', margin, 8);
        }
      }
    });

    // ========== FOOTER SECTION ==========
    const finalY = (doc as any).lastAutoTable.finalY + 5;

    // Check if we need a new page for footer
    if (finalY > pageHeight - 50) {
      doc.addPage();
    }

    const footerY = finalY > pageHeight - 50 ? 20 : finalY;

    // Total positions
    doc.setFontSize(8);
    doc.setFont('times', 'bold');
    doc.text(`(19) Total Number of Position Items: ${positions.length}`, margin, footerY);

    // Certification text
    doc.setFont('times', 'normal');
    doc.setFontSize(7);
    const certText = 'I certify to the correctness of the entries and that above Position Items are duly approved and authorized by the agency and in compliance to existing rules and regulations. I further certify that employees whose names appear above are the incumbents of the position.';
    doc.text(certText, margin, footerY + 8, { maxWidth: contentWidth });

    // Signature blocks
    const sigBlockY = footerY + 22;
    const sigBlockWidth = 80;

    // Prepared by (Left)
    doc.setFont('times', 'normal');
    doc.setFontSize(7);
    doc.text('Prepared by:', margin, sigBlockY);
    
    doc.line(margin, sigBlockY + 15, margin + sigBlockWidth, sigBlockY + 15);
    doc.setFont('times', 'bold');
    doc.text(config.preparedBy || '', margin + sigBlockWidth / 2, sigBlockY + 14, { align: 'center' });
    doc.setFont('times', 'normal');
    doc.text(config.preparedByTitle || 'Human Resource Management Officer', margin + sigBlockWidth / 2, sigBlockY + 19, { align: 'center' });
    
    doc.line(margin + 15, sigBlockY + 30, margin + sigBlockWidth - 15, sigBlockY + 30);
    doc.text('Date', margin + sigBlockWidth / 2, sigBlockY + 34, { align: 'center' });

    // Approved by (Right)
    const approvedX = pageWidth - margin - sigBlockWidth;
    doc.text('APPROVED BY:', approvedX, sigBlockY);
    
    doc.line(approvedX, sigBlockY + 15, approvedX + sigBlockWidth, sigBlockY + 15);
    doc.setFont('times', 'bold');
    doc.text(config.approvedBy || '', approvedX + sigBlockWidth / 2, sigBlockY + 14, { align: 'center' });
    doc.setFont('times', 'normal');
    doc.text(config.approvedByTitle || 'Head of Agency/Department', approvedX + sigBlockWidth / 2, sigBlockY + 19, { align: 'center' });
    
    doc.line(approvedX + 15, sigBlockY + 30, approvedX + sigBlockWidth - 15, sigBlockY + 30);
    doc.text('Date', approvedX + sigBlockWidth / 2, sigBlockY + 34, { align: 'center' });

    // Open in new window
    const pdfBlob = doc.output('blob');
    const url = URL.createObjectURL(pdfBlob);
    window.open(url, '_blank');
  } catch (error) {
    console.error('Failed to generate PSI-POP PDF:', error);
    throw error;
  }
};
