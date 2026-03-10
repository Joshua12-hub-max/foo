/**
 * PSI-POP Excel Generator (CSC Form No. 1, Revised 2018)
 * Official Plantilla of Personnel Format - Department of Budget and Management
 */

import ExcelJS from 'exceljs';
import type { Position } from '@/api/plantillaApi';

export interface PSIPOPConfig {
  departmentGocc?: string;
  bureauAgency?: string;
  fiscalYear?: string;
  preparedBy?: string;
  preparedByTitle?: string;
  approvedBy?: string;
  approvedByTitle?: string;
}

// ============================================
// STYLE CONSTANTS
// ============================================

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

const vacantFill: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFFF99' }
};

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
 * Generate PSI-POP Excel matching CSC Form No. 1 (Revised 2018)
 * Landscape, Legal Size with official table format
 */
export const generatePSIPOPExcel = async (positions: Position[], config: PSIPOPConfig = {}) => {
    const departmentName = config.departmentGocc || 'All Departments';
  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'NEBR System';
    workbook.created = new Date();

    const ws = workbook.addWorksheet('Plantilla of Personnel', {
      pageSetup: {
        paperSize: 5, // Legal
        orientation: 'landscape',
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        margins: { left: 0.25, right: 0.25, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3 }
      },
      views: [{ state: 'frozen', ySplit: 7 }]
    });

    // Column widths matching official format
    ws.columns = [
      { key: 'item_no', width: 14 },       // A - Item No.
      { key: 'position', width: 28 },      // B - Position Title
      { key: 'sg', width: 5 },             // C - SG
      { key: 'auth_salary', width: 14 },   // D - Authorized Salary
      { key: 'actual_salary', width: 14 }, // E - Actual Salary
      { key: 'step', width: 5 },           // F - Step
      { key: 'code', width: 6 },           // G - Area Code
      { key: 'type', width: 5 },           // H - Area Type
      { key: 'level', width: 5 },          // I - Area Level
      { key: 'lastName', width: 18 },     // J - Last Name
      { key: 'firstName', width: 16 },    // K - First Name
      { key: 'middleName', width: 16 },   // L - Middle Name
      { key: 'dob', width: 12 },           // M - Date of Birth
      { key: 'orig_appt', width: 12 },     // N - Original Appointment
      { key: 'last_promo', width: 12 },    // O - Last Promotion
      { key: 'status', width: 6 }          // P - Status
    ];

    const centerAlign: Partial<ExcelJS.Alignment> = { horizontal: 'center', vertical: 'middle', wrapText: true };
    const rightAlign: Partial<ExcelJS.Alignment> = { horizontal: 'right', vertical: 'middle', wrapText: true };
    const leftAlign: Partial<ExcelJS.Alignment> = { horizontal: 'left', vertical: 'middle', wrapText: true };

    // ========== ROW 1: FORM LABEL ==========
    ws.getCell('A1').value = 'CSC Form No. 1';
    ws.getCell('A1').font = { name: 'Times New Roman', size: 8, italic: true };

    ws.getCell('A2').value = '(Revised 2018)';
    ws.getCell('A2').font = { name: 'Times New Roman', size: 8, italic: true };

    // ========== ROW 1-2: HEADER ==========
    ws.mergeCells('E1:L1');
    ws.getCell('E1').value = 'Republic of the Philippines';
    ws.getCell('E1').font = { name: 'Times New Roman', size: 10 };
    ws.getCell('E1').alignment = centerAlign;

    ws.mergeCells('E2:L2');
    ws.getCell('E2').value = 'Civil Service Commission';
    ws.getCell('E2').font = { name: 'Times New Roman', size: 10 };
    ws.getCell('E2').alignment = centerAlign;

    ws.mergeCells('A3:P3');
    ws.getCell('A3').value = 'Plantilla of Personnel';
    ws.getCell('A3').font = { name: 'Times New Roman', size: 14, bold: true };
    ws.getCell('A3').alignment = centerAlign;
    ws.getRow(3).height = 20;

    ws.mergeCells('A4:P4');
    ws.getCell('A4').value = `for the Fiscal Year ${config.fiscalYear || '________'}`;
    ws.getCell('A4').font = { name: 'Times New Roman', size: 10 };
    ws.getCell('A4').alignment = centerAlign;

    // ========== ROW 5: DEPARTMENT/AGENCY INFO ==========
    ws.mergeCells('A5:H5');
    ws.getCell('A5').value = `(1) Department/GOCC: ${config.departmentGocc || ''}`;
    ws.getCell('A5').font = { name: 'Times New Roman', size: 9, bold: true };
    ws.getCell('A5').border = allBorders;

    ws.mergeCells('I5:P5');
    ws.getCell('I5').value = `(2) Bureau/Agency/Subsidiary: ${config.bureauAgency || ''}`;
    ws.getCell('I5').font = { name: 'Times New Roman', size: 9, bold: true };
    ws.getCell('I5').border = allBorders;
    ws.getRow(5).height = 18;

    // ========== ROW 6-7: TABLE HEADER (TWO ROWS) ==========
    const headerRow1 = 6;
    const headerRow2 = 7;

    // Row 6: Main headers with rowSpan/colSpan
    ws.getCell(`A${headerRow1}`).value = 'ITEM\nNo.';
    ws.mergeCells(`A${headerRow1}:A${headerRow2}`);

    ws.getCell(`B${headerRow1}`).value = 'Position Title';
    ws.mergeCells(`B${headerRow1}:B${headerRow2}`);

    ws.getCell(`C${headerRow1}`).value = 'SG';
    ws.mergeCells(`C${headerRow1}:C${headerRow2}`);

    ws.getCell(`D${headerRow1}`).value = 'Annual Salary';
    ws.mergeCells(`D${headerRow1}:E${headerRow1}`);

    ws.getCell(`F${headerRow1}`).value = 'S\nT\nE\nP';
    ws.mergeCells(`F${headerRow1}:F${headerRow2}`);

    ws.getCell(`G${headerRow1}`).value = 'Area';
    ws.mergeCells(`G${headerRow1}:I${headerRow1}`);

    ws.getCell(`J${headerRow1}`).value = 'Name of Incumbents';
    ws.mergeCells(`J${headerRow1}:L${headerRow1}`);

    ws.getCell(`M${headerRow1}`).value = 'Date of Birth\n(mm/dd/yyyy)';
    ws.mergeCells(`M${headerRow1}:M${headerRow2}`);

    ws.getCell(`N${headerRow1}`).value = 'Date of\nOriginal\nAppointment\n(mm/dd/yyyy)';
    ws.mergeCells(`N${headerRow1}:N${headerRow2}`);

    ws.getCell(`O${headerRow1}`).value = 'Date of\nLast\nPromotion\n(mm/dd/yyyy)';
    ws.mergeCells(`O${headerRow1}:O${headerRow2}`);

    ws.getCell(`P${headerRow1}`).value = 'S\nT\nA\nT\nU\nS';
    ws.mergeCells(`P${headerRow1}:P${headerRow2}`);

    // Row 7: Sub-headers
    ws.getCell(`D${headerRow2}`).value = 'Authorized';
    ws.getCell(`E${headerRow2}`).value = 'Actual';
    ws.getCell(`G${headerRow2}`).value = 'C\nO\nD\nE';
    ws.getCell(`H${headerRow2}`).value = 'T\nY\nP\nE';
    ws.getCell(`I${headerRow2}`).value = 'L\nE\nV\nE\nL';
    ws.getCell(`J${headerRow2}`).value = 'Last Name';
    ws.getCell(`K${headerRow2}`).value = 'First Name';
    ws.getCell(`L${headerRow2}`).value = 'Middle Name';

    // Style header rows
    for (let r = headerRow1; r <= headerRow2; r++) {
      for (let c = 1; c <= 16; c++) {
        const cell = ws.getCell(r, c);
        cell.font = { name: 'Times New Roman', size: 7, bold: true };
        cell.fill = headerFill;
        cell.border = allBorders;
        cell.alignment = centerAlign;
      }
    }
    ws.getRow(headerRow1).height = 25;
    ws.getRow(headerRow2).height = 35;

    // ========== ROW 8: COLUMN NUMBERS ==========
    const colNumRow = 8;
    const colNumbers = ['(3)', '(4)', '(5)', '(6)', '(7)', '(8)', '(9)', '(10)', '(11)', '(12)', '(13)', '(14)', '(15)', '(16)', '(17)', '(18)'];
    colNumbers.forEach((num, idx) => {
      const cell = ws.getCell(colNumRow, idx + 1);
      cell.value = num;
      cell.font = { name: 'Times New Roman', size: 6, bold: true };
      cell.fill = headerFill;
      cell.border = allBorders;
      cell.alignment = centerAlign;
    });
    ws.getRow(colNumRow).height = 12;

    // ========== DATA ROWS ==========
    let currentRow = 9;

    positions.forEach(pos => {
      const annualSalary = pos.monthlySalary
        ? Number(pos.monthlySalary) * 12
        : 0;
      const actualSalary = pos.isVacant ? null : annualSalary;
      const { lastName, firstName, middleName } = parseIncumbentName(pos.incumbent_name);

      // Status abbreviation
      let statusCode = '';
      if (pos.isVacant) {
        statusCode = 'V';
      } else if (pos.status) {
        statusCode = pos.status === 'Active' ? 'P' : pos.status.substring(0, 2).toUpperCase();
      } else {
        statusCode = 'P';
      }

      const rowData = [
        pos.itemNumber || '',
        pos.positionTitle || '',
        pos.salaryGrade?.toString() || '',
        annualSalary,
        actualSalary,
        pos.stepIncrement?.toString() || '1',
        pos.area_code || '',
        pos.area_type || '',
        pos.area_level || '',
        lastName,
        firstName,
        middleName,
        formatDate(pos.birthDate),
        formatDate(pos.original_appointment_date),
        formatDate(pos.last_promotion_date),
        statusCode
      ];

      rowData.forEach((val, idx) => {
        const cell = ws.getCell(currentRow, idx + 1);
        
        // Format salary cells
        if (idx === 3 || idx === 4) {
          if (typeof val === 'number') {
            cell.value = val;
            cell.numFmt = '#,##0.00';
          } else {
            cell.value = val === null ? '-' : val;
          }
        } else {
          cell.value = val;
        }

        cell.font = { name: 'Times New Roman', size: 8 };
        cell.border = allBorders;

        // Apply alignment based on column
        if ([0, 2, 5, 6, 7, 8, 12, 13, 14, 15].includes(idx)) {
          cell.alignment = centerAlign;
        } else if ([3, 4].includes(idx)) {
          cell.alignment = rightAlign;
        } else {
          cell.alignment = leftAlign;
        }

        // Highlight vacant positions
        if (pos.isVacant) {
          cell.fill = vacantFill;
        }
      });

      currentRow++;
    });

    // ========== FOOTER SECTION ==========
    currentRow += 1;

    // Total positions
    ws.mergeCells(`A${currentRow}:P${currentRow}`);
    ws.getCell(`A${currentRow}`).value = `(19) Total Number of Position Items: ${positions.length}`;
    ws.getCell(`A${currentRow}`).font = { name: 'Times New Roman', size: 9, bold: true };
    currentRow += 2;

    // Certification text
    ws.mergeCells(`A${currentRow}:P${currentRow}`);
    ws.getCell(`A${currentRow}`).value = 'I certify to the correctness of the entries and that above Position Items are duly approved and authorized by the agency and in compliance to existing rules and regulations. I further certify that employees whose names appear above are the incumbents of the position.';
    ws.getCell(`A${currentRow}`).font = { name: 'Times New Roman', size: 8 };
    ws.getCell(`A${currentRow}`).alignment = { ...leftAlign, wrapText: true };
    ws.getRow(currentRow).height = 30;
    currentRow += 2;

    // Signature blocks
    // Prepared by (Left)
    ws.getCell(`A${currentRow}`).value = 'Prepared by:';
    ws.getCell(`A${currentRow}`).font = { name: 'Times New Roman', size: 8 };
    currentRow += 3;

    ws.mergeCells(`A${currentRow}:D${currentRow}`);
    ws.getCell(`A${currentRow}`).value = config.preparedBy || '';
    ws.getCell(`A${currentRow}`).font = { name: 'Times New Roman', size: 9, bold: true };
    ws.getCell(`A${currentRow}`).alignment = centerAlign;
    ws.getCell(`A${currentRow}`).border = { bottom: thinBorder };
    currentRow++;

    ws.mergeCells(`A${currentRow}:D${currentRow}`);
    ws.getCell(`A${currentRow}`).value = config.preparedByTitle || 'Human Resource Management Officer';
    ws.getCell(`A${currentRow}`).font = { name: 'Times New Roman', size: 8 };
    ws.getCell(`A${currentRow}`).alignment = centerAlign;
    currentRow += 2;

    ws.mergeCells(`B${currentRow}:C${currentRow}`);
    ws.getCell(`B${currentRow}`).value = '';
    ws.getCell(`B${currentRow}`).border = { bottom: thinBorder };
    currentRow++;

    ws.mergeCells(`B${currentRow}:C${currentRow}`);
    ws.getCell(`B${currentRow}`).value = 'Date';
    ws.getCell(`B${currentRow}`).font = { name: 'Times New Roman', size: 8 };
    ws.getCell(`B${currentRow}`).alignment = centerAlign;

    // Approved by (Right) - go back up
    const approvedRow = currentRow - 7;
    ws.getCell(`L${approvedRow}`).value = 'APPROVED BY:';
    ws.getCell(`L${approvedRow}`).font = { name: 'Times New Roman', size: 8, bold: true };

    ws.mergeCells(`L${approvedRow + 3}:O${approvedRow + 3}`);
    ws.getCell(`L${approvedRow + 3}`).value = config.approvedBy || '';
    ws.getCell(`L${approvedRow + 3}`).font = { name: 'Times New Roman', size: 9, bold: true };
    ws.getCell(`L${approvedRow + 3}`).alignment = centerAlign;
    ws.getCell(`L${approvedRow + 3}`).border = { bottom: thinBorder };

    ws.mergeCells(`L${approvedRow + 4}:O${approvedRow + 4}`);
    ws.getCell(`L${approvedRow + 4}`).value = config.approvedByTitle || 'Head of Agency/Department';
    ws.getCell(`L${approvedRow + 4}`).font = { name: 'Times New Roman', size: 8 };
    ws.getCell(`L${approvedRow + 4}`).alignment = centerAlign;

    ws.mergeCells(`M${approvedRow + 6}:N${approvedRow + 6}`);
    ws.getCell(`M${approvedRow + 6}`).value = '';
    ws.getCell(`M${approvedRow + 6}`).border = { bottom: thinBorder };

    ws.mergeCells(`M${approvedRow + 7}:N${approvedRow + 7}`);
    ws.getCell(`M${approvedRow + 7}`).value = 'Date';
    ws.getCell(`M${approvedRow + 7}`).font = { name: 'Times New Roman', size: 8 };
    ws.getCell(`M${approvedRow + 7}`).alignment = centerAlign;

    // ========== GENERATE AND DOWNLOAD ==========
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PSI-POP_CSC_Form_1_${config.fiscalYear || new Date().getFullYear()}_${new Date().toISOString().split('T')[0]}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to generate PSI-POP Excel:', error);
    throw error;
  }
};
