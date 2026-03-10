/**
 * CSC Form Export Utilities (STYLED VERSION)
 * Uses ExcelJS for proper styling - borders, colors, fonts, merged cells
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';

// ============================================
// INTERFACES
// ============================================

export interface Form9Position {
  no: number;
  positionTitle: string;
  plantillaItemNo: string;
  salaryGrade: string;
  monthlySalary: string;
  education: string;
  training: string;
  experience: string;
  eligibility: string;
  competency: string;
  placeOfAssignment: string;
}

export interface Form9Header {
  agencyName: string;
  signatoryName: string;
  signatoryTitle: string;
  date: string;
  deadlineDate: string;
  officeAddress: string;
  contactInfo: string;
}

export interface PSIPOPPosition {
  itemNumber: string;
  positionTitle: string;
  salaryGrade: number | string;
  stepIncrement: number | string;
  monthlySalary?: number | string;
  department: string;
  isVacant: boolean | number;
  incumbentName?: string;
  employeeId?: string;
}

// ============================================
// COMMON STYLES
// ============================================

const headerFont: Partial<ExcelJS.Font> = { name: 'Times New Roman', size: 12, bold: true };
const normalFont: Partial<ExcelJS.Font> = { name: 'Times New Roman', size: 10 };
const smallFont: Partial<ExcelJS.Font> = { name: 'Times New Roman', size: 8 };
const tableHeaderFont: Partial<ExcelJS.Font> = { name: 'Times New Roman', size: 8, bold: true };

const thinBorder: Partial<ExcelJS.Border> = { style: 'thin', color: { argb: '000000' } };
const allBorders: Partial<ExcelJS.Borders> = {
  top: thinBorder,
  left: thinBorder,
  bottom: thinBorder,
  right: thinBorder
};

const headerFill: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'D9D9D9' }
};

const greenFill: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: '92D050' }
};

// ============================================
// CS FORM NO. 9 - Request for Publication of Vacant Positions (STYLED EXCEL)
// ============================================

export const exportForm9ToExcel = async (header: Form9Header, positions: Form9Position[]) => {
  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'NEBR System';
    workbook.created = new Date();
    
    const ws = workbook.addWorksheet('CS Form No. 9', {
      pageSetup: { 
        paperSize: 5, // Legal
        orientation: 'landscape',
        margins: { left: 0.3, right: 0.3, top: 0.3, bottom: 0.3, header: 0, footer: 0 }
      }
    });

    // Column widths matching Form9Modal preview percentages (total ~148 chars for legal landscape)
    // Based on: No.=3%, Title=15%, Plantilla=6%, SG=5%, Salary=7%, Edu=12%, Train=8%, Exp=8%, Elig=10%, Comp=10%, Place=8%
    ws.columns = [
      { key: 'no', width: 4 },              // A - No. (3%)
      { key: 'title', width: 22 },          // B - Position Title (15%)
      { key: 'item_no', width: 9 },         // C - Plantilla Item No. (6%)
      { key: 'sg', width: 7 },              // D - Salary/Job Pay Grade (5%)
      { key: 'salary', width: 10 },         // E - Monthly Salary (7%)
      { key: 'education', width: 18 },      // F - Education (12%)
      { key: 'training', width: 12 },       // G - Training (8%)
      { key: 'experience', width: 12 },     // H - Experience (8%)
      { key: 'eligibility', width: 15 },    // I - Eligibility (10%)
      { key: 'competency', width: 15 },     // J - Competency (10%)
      { key: 'assignment', width: 12 },     // K - Place of Assignment (8%)
    ];

    const centerAlign: Partial<ExcelJS.Alignment> = { vertical: 'middle', horizontal: 'center', wrapText: true };
    const leftAlign: Partial<ExcelJS.Alignment> = { vertical: 'middle', horizontal: 'left', wrapText: true };
    const rightAlign: Partial<ExcelJS.Alignment> = { vertical: 'middle', horizontal: 'right', wrapText: true };

    // ========== ROW 1: Form Label (Left) + Excel Note Box (Right) ==========
    ws.getCell('A1').value = 'CS Form No. 9';
    ws.getCell('A1').font = { name: 'Arial', size: 8, bold: true, italic: true };
    
    ws.getCell('A2').value = 'Revised 2025';
    ws.getCell('A2').font = { name: 'Arial', size: 8, italic: true };

    // Excel format note box (top right)
    ws.mergeCells('J1:K2');
    ws.getCell('J1').value = 'Electronic copy to be submitted to the\nCSC FO must be in MS Excel format';
    ws.getCell('J1').font = { name: 'Arial', size: 7, italic: true };
    ws.getCell('J1').alignment = { ...centerAlign, wrapText: true };
    ws.getCell('J1').border = allBorders;

    // ========== ROW 4-6: Center Header ==========
    ws.mergeCells('A4:K4');
    ws.getCell('A4').value = 'Republic of the Philippines';
    ws.getCell('A4').font = { name: 'Arial', size: 9 };
    ws.getCell('A4').alignment = centerAlign;

    ws.mergeCells('A5:K5');
    ws.getCell('A5').value = header.agencyName || 'AGENCY NAME';
    ws.getCell('A5').font = { name: 'Arial', size: 12, bold: true };
    ws.getCell('A5').alignment = centerAlign;

    ws.mergeCells('A6:K6');
    ws.getCell('A6').value = 'Request for Publication of Vacant Positions';
    ws.getCell('A6').font = { name: 'Arial', size: 10, bold: true };
    ws.getCell('A6').alignment = centerAlign;

    // ========== ROW 8: TO CSC ==========
    ws.mergeCells('A8:K8');
    ws.getCell('A8').value = 'To: CIVIL SERVICE COMMISSION (CSC)';
    ws.getCell('A8').font = { name: 'Arial', size: 9 };

    // ========== ROW 9: Request Text ==========
    ws.mergeCells('A9:K9');
    ws.getCell('A9').value = `We hereby request the publication in the CSC Job Portal of the following vacant positions, which are authorized to be filled at the ${header.agencyName}:`;
    ws.getCell('A9').font = { name: 'Arial', size: 8 };
    ws.getCell('A9').alignment = leftAlign;

    // ========== ROW 10-12: Signatory (Right Aligned) ==========
    ws.mergeCells('H10:K10');
    ws.getCell('H10').value = header.signatoryName || '';
    ws.getCell('H10').font = { name: 'Arial', size: 9, bold: true };
    ws.getCell('H10').alignment = rightAlign;

    ws.mergeCells('H11:K11');
    ws.getCell('H11').value = header.signatoryTitle || '';
    ws.getCell('H11').font = { name: 'Arial', size: 8 };
    ws.getCell('H11').alignment = rightAlign;

    ws.mergeCells('H12:K12');
    ws.getCell('H12').value = `Date: ${header.date || '_______________'}`;
    ws.getCell('H12').font = { name: 'Arial', size: 8 };
    ws.getCell('H12').alignment = rightAlign;

    // ========== ROW 14-15: TWO-ROW TABLE HEADER (Official Format) ==========
    const headerRow1 = 14;
    const headerRow2 = 15;
    
    // Row 1 Headers (with rowSpan via merge)
    ws.getCell(`A${headerRow1}`).value = 'No.';
    ws.mergeCells(`A${headerRow1}:A${headerRow2}`);
    
    ws.getCell(`B${headerRow1}`).value = 'Position Title\n(Parenthetical Title, if applicable)';
    ws.mergeCells(`B${headerRow1}:B${headerRow2}`);
    
    ws.getCell(`C${headerRow1}`).value = 'Plantilla\nItem No.';
    ws.mergeCells(`C${headerRow1}:C${headerRow2}`);
    
    ws.getCell(`D${headerRow1}`).value = 'Salary/\nJob Pay\nGrade';
    ws.mergeCells(`D${headerRow1}:D${headerRow2}`);
    
    ws.getCell(`E${headerRow1}`).value = 'Monthly\nSalary';
    ws.mergeCells(`E${headerRow1}:E${headerRow2}`);
    
    // QUALIFICATION STANDARDS spanning F-J (Official Format)
    ws.getCell(`F${headerRow1}`).value = 'Qualification Standards';
    ws.mergeCells(`F${headerRow1}:J${headerRow1}`);
    
    ws.getCell(`K${headerRow1}`).value = 'Place of\nAssignment';
    ws.mergeCells(`K${headerRow1}:K${headerRow2}`);
    
    // Row 2 Sub-headers for Qualification Standards
    ws.getCell(`F${headerRow2}`).value = 'Education';
    ws.getCell(`G${headerRow2}`).value = 'Training';
    ws.getCell(`H${headerRow2}`).value = 'Experience';
    ws.getCell(`I${headerRow2}`).value = 'Eligibility';
    ws.getCell(`J${headerRow2}`).value = 'Competency\n(if applicable)';

    // Style both header rows
    for (let r = headerRow1; r <= headerRow2; r++) {
      for (let c = 1; c <= 11; c++) {
        const cell = ws.getCell(r, c);
        cell.font = { name: 'Arial', size: 7, bold: true };
        cell.fill = headerFill;
        cell.border = allBorders;
        cell.alignment = centerAlign;
      }
    }
    ws.getRow(headerRow1).height = 25;
    ws.getRow(headerRow2).height = 20;

    // ========== DATA ROWS ==========
    let currentRow = headerRow2 + 1;

    if (positions.length === 0) {
      ws.mergeCells(`A${currentRow}:K${currentRow}`);
      ws.getCell(`A${currentRow}`).value = 'No vacant positions found';
      ws.getCell(`A${currentRow}`).font = normalFont;
      ws.getCell(`A${currentRow}`).alignment = centerAlign;
      ws.getCell(`A${currentRow}`).border = allBorders;
      currentRow++;
    } else {
      positions.forEach((pos, idx) => {
        const rowData = ws.getRow(currentRow);
        rowData.values = [
          idx + 1,
          pos.positionTitle || '',
          pos.plantillaItemNo || '',
          pos.salaryGrade || '',
          pos.monthlySalary || '',
          pos.education || '',
          pos.training || '',
          pos.experience || '',
          pos.eligibility || '',
          pos.competency || '',
          pos.placeOfAssignment || ''
        ];

        rowData.eachCell((cell, colNumber) => {
          cell.font = { name: 'Arial', size: 6 }; // Smaller font for data cells
          cell.border = allBorders;
          cell.alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
          
          // Center align specific columns
          if ([1, 3, 4, 11].includes(colNumber)) {
            cell.alignment = { vertical: 'top', horizontal: 'center', wrapText: true };
          }
          // Right align salary
          if (colNumber === 5) {
            cell.alignment = { vertical: 'top', horizontal: 'right', wrapText: true };
          }
        });
        
        currentRow++;
      });
    }

    // ========== FOOTER SECTION ==========
    currentRow += 1;

    // Requirement instruction
    ws.mergeCells(`A${currentRow}:K${currentRow}`);
    ws.getCell(`A${currentRow}`).value = `Interested and qualified applicants should signify their interest in writing. Attach the following documents to the application letter and send to the address below not later than ${header.deadlineDate || '_______________'}.`;
    ws.getCell(`A${currentRow}`).font = { name: 'Arial', size: 8 };
    ws.getCell(`A${currentRow}`).alignment = leftAlign;
    ws.getRow(currentRow).height = 28;
    currentRow++;

    // Requirements list
    const requirements = [
      '1. Fully accomplished Personal Data Sheet (PDS) with Work Experience Sheet and recent passport-sized or unfiltered digital picture (CS Form No. 212, Revised 2025);',
      '2. Hard copy or electronic copy of Performance rating in the last rating period (if applicable);',
      '3. Hard copy or electronic copy of proof of eligibility/rating/license; and',
      '4. Hard copy or electronic copy of Transcript of Records.'
    ];

    requirements.forEach(req => {
      ws.mergeCells(`A${currentRow}:K${currentRow}`);
      ws.getCell(`A${currentRow}`).value = req;
      ws.getCell(`A${currentRow}`).font = { name: 'Arial', size: 8 };
      currentRow++;
    });

    currentRow++;

    // EEO Statement
    ws.mergeCells(`A${currentRow}:K${currentRow}`);
    ws.getCell(`A${currentRow}`).value = 'This Office highly encourages all interested and qualified applicants to apply, including persons with disability (PWD) and members of indigenous communities, irrespective of sexual orientation and gender identities and/or expression, civil status, religion, and political affiliation.';
    ws.getCell(`A${currentRow}`).font = { name: 'Arial', size: 7, italic: true };
    ws.getCell(`A${currentRow}`).alignment = leftAlign;
    ws.getRow(currentRow).height = 25;
    currentRow++;

    ws.mergeCells(`A${currentRow}:K${currentRow}`);
    ws.getCell(`A${currentRow}`).value = 'This Office does not discriminate in the selection of employees based on the aforementioned pursuant to Equal Opportunities for Employment Principle (EOP).';
    ws.getCell(`A${currentRow}`).font = { name: 'Arial', size: 7, italic: true };
    ws.getCell(`A${currentRow}`).alignment = leftAlign;
    currentRow += 2;

    // Qualified applicants instruction
    ws.mergeCells(`A${currentRow}:K${currentRow}`);
    ws.getCell(`A${currentRow}`).value = 'QUALIFIED APPLICANTS are advised to hand in or send through courier/email their application to:';
    ws.getCell(`A${currentRow}`).font = { name: 'Arial', size: 8 };
    currentRow += 2;

    // Contact Info Box
    ws.mergeCells(`B${currentRow}:E${currentRow}`);
    ws.getCell(`B${currentRow}`).value = header.signatoryName || '';
    ws.getCell(`B${currentRow}`).font = { name: 'Arial', size: 8, bold: true };
    currentRow++;

    ws.mergeCells(`B${currentRow}:E${currentRow}`);
    ws.getCell(`B${currentRow}`).value = header.signatoryTitle || '';
    ws.getCell(`B${currentRow}`).font = { name: 'Arial', size: 8 };
    currentRow++;

    ws.mergeCells(`B${currentRow}:E${currentRow}`);
    ws.getCell(`B${currentRow}`).value = header.officeAddress || '';
    ws.getCell(`B${currentRow}`).font = { name: 'Arial', size: 8 };
    currentRow++;

    ws.mergeCells(`B${currentRow}:E${currentRow}`);
    ws.getCell(`B${currentRow}`).value = header.contactInfo || '';
    ws.getCell(`B${currentRow}`).font = { name: 'Arial', size: 8 };
    currentRow += 2;

    // Final warning
    ws.mergeCells(`A${currentRow}:K${currentRow}`);
    ws.getCell(`A${currentRow}`).value = 'APPLICATIONS WITH INCOMPLETE DOCUMENTS SHALL NOT BE ENTERTAINED.';
    ws.getCell(`A${currentRow}`).font = { name: 'Arial', size: 8, bold: true };
    ws.getCell(`A${currentRow}`).alignment = centerAlign;

    // Generate and download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CS_Form_No_9_${header.agencyName?.replace(/\s+/g, '_') || 'Report'}_${new Date().toISOString().split('T')[0]}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to generate CS Form 9 Excel:', error);
    throw error;
  }
};

// ============================================
// PSI-POP STYLED EXCEL
// ============================================

export const exportPSIPOPToExcel = async (positions: PSIPOPPosition[], department: string = 'All Departments') => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'NEBR System';
  workbook.created = new Date();
  
  const ws = workbook.addWorksheet('PSI-POP', {
    pageSetup: { paperSize: 5, orientation: 'landscape' }
  });

  ws.columns = [
    { width: 20 },  // Item No.
    { width: 35 },  // Position Title
    { width: 8 },   // SG
    { width: 8 },   // Step
    { width: 15 },  // Monthly Salary
    { width: 25 },  // Department
    { width: 12 },  // Status
    { width: 25 },  // Incumbent
    { width: 15 }   // Employee ID
  ];

  let row = 1;

  // Header
  ws.mergeCells(`A${row}:I${row}`);
  const titleCell = ws.getCell(`A${row}`);
  titleCell.value = 'PERSONAL SERVICES ITEMIZATION AND PLANTILLA OF PERSONNEL';
  titleCell.font = headerFont;
  titleCell.alignment = { horizontal: 'center' };
  row++;

  ws.mergeCells(`A${row}:I${row}`);
  ws.getCell(`A${row}`).value = `Department: ${department}`;
  ws.getCell(`A${row}`).font = normalFont;
  row++;

  ws.mergeCells(`A${row}:I${row}`);
  ws.getCell(`A${row}`).value = `As of: ${new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}`;
  ws.getCell(`A${row}`).font = smallFont;
  row += 2;

  // Table Header
  const headers = ['Item No.', 'Position Title', 'SG', 'Step', 'Monthly Salary', 'Department', 'Status', 'Incumbent', 'Employee ID'];
  headers.forEach((h, idx) => {
    const cell = ws.getCell(row, idx + 1);
    cell.value = h;
    cell.font = tableHeaderFont;
    cell.fill = greenFill;
    cell.border = allBorders;
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });
  ws.getRow(row).height = 25;
  row++;

  // Data rows
  positions.forEach(pos => {
    const data = [
      pos.itemNumber || '',
      pos.positionTitle || '',
      pos.salaryGrade || '',
      pos.stepIncrement || 1,
      typeof pos.monthlySalary === 'number' 
        ? pos.monthlySalary.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })
        : pos.monthlySalary || '',
      pos.department || '',
      pos.isVacant ? 'VACANT' : 'Filled',
      pos.incumbentName || (pos.isVacant ? '-' : 'Unknown'),
      pos.employeeId || '-'
    ];

    data.forEach((val, colIdx) => {
      const cell = ws.getCell(row, colIdx + 1);
      cell.value = val;
      cell.font = smallFont;
      cell.border = allBorders;
      cell.alignment = { vertical: 'middle' };
      
      // Highlight vacant rows
      if (pos.isVacant) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFF99' } // Light yellow
        };
      }
    });
    row++;
  });

  // Generate and download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `PSI-POP_${new Date().toISOString().split('T')[0]}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
};

// ============================================
// PDF EXPORTS (unchanged - already styled)
// ============================================

export const exportForm9ToPDF = (header: Form9Header, positions: Form9Position[]) => {
  try {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'in',
      format: 'legal'
    });

    const pageWidth = 14;
    const margin = 0.3;

    // ========== TOP HEADER ==========
    // Form Label (top-left)
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bolditalic');
    doc.text('CS Form No. 9', margin, 0.3);
    doc.setFont('helvetica', 'italic');
    doc.text('Revised 2025', margin, 0.45);

    // Excel format note box (top-right) - NO BLACK BORDER
    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    const boxX = pageWidth - margin - 2;
    // Removed: doc.rect() to eliminate black border
    doc.text('Electronic copy to be submitted to the', boxX + 0.05, 0.35);
    doc.text('CSC FO must be in MS Excel format', boxX + 0.05, 0.5);

    // ========== CENTER HEADER ==========
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Republic of the Philippines', pageWidth / 2, 0.55, { align: 'center' });
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(header.agencyName || 'AGENCY NAME', pageWidth / 2, 0.75, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Request for Publication of Vacant Positions', pageWidth / 2, 0.95, { align: 'center' });

    // ========== TO CSC & SIGNATORY ==========
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('To: CIVIL SERVICE COMMISSION (CSC)', margin, 1.15);

    doc.setFontSize(7);
    doc.text(
      `We hereby request the publication in the CSC Job Portal of the following vacant positions, which are authorized to be filled at the ${header.agencyName}:`,
      margin, 1.3, { maxWidth: 8 }
    );

    // Signatory (right-aligned)
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(header.signatoryName || '', pageWidth - margin, 1.15, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(header.signatoryTitle || '', pageWidth - margin, 1.3, { align: 'right' });
    doc.text(`Date: ${header.date || '_______________'}`, pageWidth - margin, 1.45, { align: 'right' });

    // ========== TWO-ROW TABLE HEADER (Official Format) ==========
    // First row: No., Position Title, Plantilla, SG, Salary, "Qualification Standards" (spanning), Place
    // Second row: empty for most, but Education, Training, Experience, Eligibility, Competency under QS

    const tableHeaders = [
      [
        { content: 'No.', rowSpan: 2, styles: { valign: 'middle' as const, halign: 'center' as const } },
        { content: 'Position Title\n(Parenthetical Title,\nif applicable)', rowSpan: 2, styles: { valign: 'middle' as const, halign: 'center' as const } },
        { content: 'Plantilla\nItem No.', rowSpan: 2, styles: { valign: 'middle' as const, halign: 'center' as const } },
        { content: 'Salary/\nJob Pay\nGrade', rowSpan: 2, styles: { valign: 'middle' as const, halign: 'center' as const } },
        { content: 'Monthly\nSalary', rowSpan: 2, styles: { valign: 'middle' as const, halign: 'center' as const } },
        { content: 'Qualification Standards', colSpan: 5, styles: { halign: 'center' as const } },
        { content: 'Place of\nAssignment', rowSpan: 2, styles: { valign: 'middle' as const, halign: 'center' as const } }
      ],
      [
        { content: 'Education', styles: { halign: 'center' as const } },
        { content: 'Training', styles: { halign: 'center' as const } },
        { content: 'Experience', styles: { halign: 'center' as const } },
        { content: 'Eligibility', styles: { halign: 'center' as const } },
        { content: 'Competency\n(if applicable)', styles: { halign: 'center' as const } }
      ]
    ];

    const tableData = positions.map((pos, idx) => [
      (idx + 1).toString(),
      pos.positionTitle || '',
      pos.plantillaItemNo || '',
      pos.salaryGrade || '',
      pos.monthlySalary || '',
      pos.education || '',
      pos.training || '',
      pos.experience || '',
      pos.eligibility || '',
      pos.competency || '',
      pos.placeOfAssignment || ''
    ]);

    if (tableData.length === 0) {
      tableData.push(['', 'No vacant positions found', '', '', '', '', '', '', '', '', '']);
    }

    autoTable(doc, {
      head: tableHeaders,
      body: tableData,
      startY: 1.55,
      margin: { left: margin, right: margin },
      theme: 'grid',
      styles: { fontSize: 7, cellPadding: 0.03, overflow: 'linebreak', lineWidth: 0.005 },
      headStyles: { fillColor: [230, 230, 230], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 7.5 },
      // Column widths matching Form9Modal percentages (13.4in usable = legal minus margins)
      // No.=3%, Title=15%, Plantilla=6%, SG=5%, Salary=7%, Edu=12%, Train=8%, Exp=8%, Elig=10%, Comp=10%, Place=8%
      columnStyles: {
        0: { cellWidth: 0.4, halign: 'center' },   // No. (3%)
        1: { cellWidth: 2.0 },                      // Position Title (15%)
        2: { cellWidth: 0.8, halign: 'center' },   // Plantilla Item No. (6%)
        3: { cellWidth: 0.67, halign: 'center' },  // Salary/Job Pay Grade (5%)
        4: { cellWidth: 0.94, halign: 'right' },   // Monthly Salary (7%)
        5: { cellWidth: 1.6 },                      // Education (12%)
        6: { cellWidth: 1.07, halign: 'center' },  // Training (8%)
        7: { cellWidth: 1.07, halign: 'center' },  // Experience (8%)
        8: { cellWidth: 1.34 },                     // Eligibility (10%)
        9: { cellWidth: 1.34 },                     // Competency (10%)
        10: { cellWidth: 1.07 }                     // Place of Assignment (8%)
      }
    });

    // ========== FOOTER SECTION ==========
    const finalY = doc.lastAutoTable.finalY + 0.15;

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Interested and qualified applicants should signify their interest in writing. Attach the following documents to the application letter and send to the address below not later than ${header.deadlineDate || '_______________'}.`,
      margin, finalY, { maxWidth: pageWidth - margin * 2 }
    );

    const requirements = [
      '1. Fully accomplished Personal Data Sheet (PDS) with Work Experience Sheet and recent passport-sized picture (CS Form No. 212, Revised 2025);',
      '2. Hard copy or electronic copy of Performance rating in the last rating period (if applicable);',
      '3. Hard copy or electronic copy of proof of eligibility/rating/license; and',
      '4. Hard copy or electronic copy of Transcript of Records.'
    ];

    let y = finalY + 0.2;
    requirements.forEach(req => {
      doc.text(req, margin, y, { maxWidth: pageWidth - margin * 2 });
      y += 0.15;
    });

    y += 0.1;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(6);
    doc.text(
      'This Office highly encourages all interested and qualified applicants to apply, including persons with disability (PWD) and members of indigenous communities, irrespective of sexual orientation and gender identities and/or expression, civil status, religion, and political affiliation.',
      margin, y, { maxWidth: pageWidth - margin * 2 }
    );
    y += 0.2;
    doc.text(
      'This Office does not discriminate in the selection of employees based on the aforementioned pursuant to Equal Opportunities for Employment Principle (EOP).',
      margin, y, { maxWidth: pageWidth - margin * 2 }
    );

    y += 0.25;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('QUALIFIED APPLICANTS are advised to hand in or send through courier/email their application to:', margin, y);

    y += 0.2;
    doc.setFont('helvetica', 'bold');
    doc.text(header.signatoryName || '', margin + 0.3, y);
    y += 0.12;
    doc.setFont('helvetica', 'normal');
    doc.text(header.signatoryTitle || '', margin + 0.3, y);
    y += 0.12;
    doc.text(header.officeAddress || '', margin + 0.3, y);
    y += 0.12;
    doc.text(header.contactInfo || '', margin + 0.3, y);

    y += 0.25;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text('APPLICATIONS WITH INCOMPLETE DOCUMENTS SHALL NOT BE ENTERTAINED.', pageWidth / 2, y, { align: 'center' });

    const pdfBlob = doc.output('blob');
    const url = URL.createObjectURL(pdfBlob);
    window.open(url, '_blank');
  } catch (error) {
    console.error('Failed to generate CS Form 9 PDF:', error);
    throw error;
  }
};

export const exportPSIPOPToPDF = (positions: PSIPOPPosition[], department: string = 'All Departments') => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'legal'
  });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('PERSONAL SERVICES ITEMIZATION AND PLANTILLA OF PERSONNEL', doc.internal.pageSize.width / 2, 15, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Department: ${department}`, 20, 25);
  doc.text(`As of: ${new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}`, 20, 30);

  const tableHeaders = [['Item No.', 'Position Title', 'SG', 'Step', 'Monthly Salary', 'Department', 'Status', 'Incumbent', 'Employee ID']];
  
  const tableData = positions.map(pos => [
    pos.itemNumber || '',
    pos.positionTitle || '',
    pos.salaryGrade?.toString() || '',
    pos.stepIncrement?.toString() || '1',
    typeof pos.monthlySalary === 'number' ? pos.monthlySalary.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' }) : pos.monthlySalary || '',
    pos.department || '',
    pos.isVacant ? 'VACANT' : 'Filled',
    pos.incumbentName || (pos.isVacant ? '-' : 'Unknown'),
    pos.employeeId || '-'
  ]);

  autoTable(doc, {
    head: tableHeaders,
    body: tableData,
    startY: 35,
    theme: 'grid',
    styles: { fontSize: 7, cellPadding: 1 },
    headStyles: { fillColor: [34, 139, 34], textColor: [255, 255, 255], fontStyle: 'bold' },
  });

  const pdfBlob = doc.output('blob');
  const url = URL.createObjectURL(pdfBlob);
  window.open(url, '_blank');
};
