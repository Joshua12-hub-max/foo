import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export interface AppointmentData {
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

export const generateAppointmentExcel = async (data: AppointmentData) => {
    try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('CS Form 33-A');

    // Setup Page Layout - Legal Size
    worksheet.pageSetup = {
        paperSize: 5, // Legal
        orientation: 'portrait', // Legal Portrait usually
        margins: {
            left: 0.5, right: 0.5,
            top: 0.5, bottom: 0.5,
            header: 0, footer: 0
        }
    };

    // Columns - Grid System for flexible layout
    worksheet.columns = [
        { key: 'A', width: 5 },
        { key: 'B', width: 10 },
        { key: 'C', width: 10 },
        { key: 'D', width: 10 },
        { key: 'E', width: 15 }, // Center Area
        { key: 'F', width: 15 },
        { key: 'G', width: 10 },
        { key: 'H', width: 10 },
        { key: 'I', width: 5 },
    ];

    const centerStyle: Partial<ExcelJS.Alignment> = { vertical: 'middle', horizontal: 'center', wrapText: true };
    const leftStyle: Partial<ExcelJS.Alignment> = { vertical: 'middle', horizontal: 'left', wrapText: true };
    const bottomBorderStyle: Partial<ExcelJS.Borders> = { bottom: { style: 'thin' } };
    const allBorders: Partial<ExcelJS.Borders> = { 
        top: { style: 'thin' }, bottom: { style: 'thin' }, 
        left: { style: 'thin' }, right: { style: 'thin' } 
    };

    // --- FORM HEADER ---
    worksheet.mergeCells('A1:B2');
    worksheet.getCell('A1').value = 'CS Form No. 33-A\nRevised 2018';
    worksheet.getCell('A1').font = { name: 'Times New Roman', size: 9, italic: true, bold: true };
    worksheet.getCell('A1').alignment = { vertical: 'top', horizontal: 'left', wrapText: true };

    worksheet.mergeCells('H1:I1');
    worksheet.getCell('H1').value = 'For Regulated Agencies';
    worksheet.getCell('H1').border = allBorders;
    worksheet.getCell('H1').font = { name: 'Times New Roman', size: 8 };
    worksheet.getCell('H1').alignment = centerStyle;

    worksheet.mergeCells('G3:I3');
    worksheet.getCell('G3').value = '(Stamp of Date of Receipt)';
    worksheet.getCell('G3').font = { name: 'Times New Roman', size: 8, italic: true };
    worksheet.getCell('G3').alignment = { horizontal: 'right' };

    // REPUBLIC HEADER
    worksheet.mergeCells('A5:I5');
    worksheet.getCell('A5').value = 'Republic of the Philippines';
    worksheet.getCell('A5').alignment = centerStyle;
    worksheet.getCell('A5').font = { name: 'Arial', size: 12, bold: true };

    worksheet.mergeCells('A6:I6');
    worksheet.getCell('A6').value = data.agencyName || 'AGENCY NAME';
    worksheet.getCell('A6').alignment = centerStyle;
    worksheet.getCell('A6').font = { name: 'Arial', size: 11, bold: true, underline: true };

    worksheet.mergeCells('A7:I7');
    worksheet.getCell('A7').value = '(Name of Agency)';
    worksheet.getCell('A7').alignment = centerStyle;
    worksheet.getCell('A7').font = { name: 'Arial', size: 9 };

    // --- BODY CONTENT ---
    let row = 9;

    // Name
    worksheet.mergeCells(`A${row}:B${row}`);
    worksheet.getCell(`A${row}`).value = 'Mr./Mrs./Ms.:';
    worksheet.getCell(`A${row}`).font = { name: 'Arial', size: 10, bold: true };
    
    worksheet.mergeCells(`C${row}:I${row}`);
    worksheet.getCell(`C${row}`).value = data.appointeeName?.toUpperCase();
    worksheet.getCell(`C${row}`).font = { name: 'Arial', size: 11, bold: true };
    worksheet.getCell(`C${row}`).alignment = centerStyle;
    worksheet.getCell(`C${row}`).border = bottomBorderStyle;
    row += 2;

    // Position
    worksheet.mergeCells(`A${row}:B${row}`);
    worksheet.getCell(`A${row}`).value = 'You are hereby appointed as';
    worksheet.getCell(`A${row}`).alignment = { horizontal: 'right' };
    
    worksheet.mergeCells(`C${row}:G${row}`);
    worksheet.getCell(`C${row}`).value = data.positionTitle?.toUpperCase();
    worksheet.getCell(`C${row}`).font = { name: 'Arial', size: 10, bold: true };
    worksheet.getCell(`C${row}`).alignment = centerStyle;
    worksheet.getCell(`C${row}`).border = bottomBorderStyle;

    worksheet.getCell(`H${row}`).value = '(';
    worksheet.getCell(`H${row}`).alignment = { horizontal: 'right' };
    worksheet.getCell(`I${row}`).value = data.salaryGrade + ')';
    worksheet.getCell(`I${row}`).border = bottomBorderStyle;
    worksheet.getCell(`I${row}`).font = { bold: true };
    row += 1;

    worksheet.mergeCells(`C${row}:I${row}`);
    worksheet.getCell(`C${row}`).value = '(Position Title)';
    worksheet.getCell(`C${row}`).font = { size: 8, italic: true };
    worksheet.getCell(`C${row}`).alignment = centerStyle;
    row += 2;

    // Status / Dept
    worksheet.getCell(`A${row}`).value = 'under';
    worksheet.getCell(`A${row}`).alignment = { horizontal: 'right' };
    
    worksheet.mergeCells(`B${row}:D${row}`);
    worksheet.getCell(`B${row}`).value = data.status?.toUpperCase();
    worksheet.getCell(`B${row}`).font = { bold: true };
    worksheet.getCell(`B${row}`).alignment = centerStyle;
    worksheet.getCell(`B${row}`).border = bottomBorderStyle;

    worksheet.mergeCells(`E${row}:F${row}`);
    worksheet.getCell(`E${row}`).value = 'status at the';
    worksheet.getCell(`E${row}`).alignment = centerStyle;

    worksheet.mergeCells(`G${row}:I${row}`);
    worksheet.getCell(`G${row}`).value = data.department?.toUpperCase();
    worksheet.getCell(`G${row}`).font = { bold: true };
    worksheet.getCell(`G${row}`).alignment = centerStyle;
    worksheet.getCell(`G${row}`).border = bottomBorderStyle;
    row += 1;

    worksheet.mergeCells(`B${row}:D${row}`);
    worksheet.getCell(`B${row}`).value = '(Permanent, Temporary, etc)';
    worksheet.getCell(`B${row}`).font = { size: 8, italic: true };
    worksheet.getCell(`B${row}`).alignment = centerStyle;
    
    worksheet.mergeCells(`G${row}:I${row}`);
    worksheet.getCell(`G${row}`).value = '(Office/Department/Unit)';
    worksheet.getCell(`G${row}`).font = { size: 8, italic: true };
    worksheet.getCell(`G${row}`).alignment = centerStyle;
    row += 2;

    // Compensation
    worksheet.mergeCells(`A${row}:C${row}`);
    worksheet.getCell(`A${row}`).value = 'with a compensation rate of';
    worksheet.getCell(`A${row}`).alignment = { horizontal: 'right' };
    
    worksheet.mergeCells(`D${row}:G${row}`);
    worksheet.getCell(`D${row}`).value = data.compensationRate;
    worksheet.getCell(`D${row}`).font = { bold: true };
    worksheet.getCell(`D${row}`).alignment = centerStyle;
    worksheet.getCell(`D${row}`).border = bottomBorderStyle;
    
    worksheet.mergeCells(`H${row}:I${row}`);
    worksheet.getCell(`H${row}`).value = 'pesos per month.';
    row += 2;

    // Nature
    worksheet.mergeCells(`A${row}:C${row}`);
    worksheet.getCell(`A${row}`).value = 'The nature of this appointment is';
    worksheet.getCell(`A${row}`).alignment = { horizontal: 'right' };

    worksheet.mergeCells(`D${row}:F${row}`);
    worksheet.getCell(`D${row}`).value = data.natureOfAppointment?.toUpperCase();
    worksheet.getCell(`D${row}`).font = { bold: true };
    worksheet.getCell(`D${row}`).alignment = centerStyle;
    worksheet.getCell(`D${row}`).border = bottomBorderStyle;

    worksheet.getCell(`G${row}`).value = 'vice';
    worksheet.getCell(`G${row}`).alignment = centerStyle;

    worksheet.mergeCells(`H${row}:I${row}`);
    worksheet.getCell(`H${row}`).value = data.viceName?.toUpperCase();
    worksheet.getCell(`H${row}`).alignment = centerStyle;
    worksheet.getCell(`H${row}`).border = bottomBorderStyle;
    row += 1;

    worksheet.mergeCells(`D${row}:F${row}`);
    worksheet.getCell(`D${row}`).value = '(Original, Promotion, etc)';
    worksheet.getCell(`D${row}`).font = { size: 8, italic: true };
    worksheet.getCell(`D${row}`).alignment = centerStyle;

    worksheet.mergeCells(`H${row}:I${row}`);
    worksheet.getCell(`H${row}`).value = '(Name of Predecessor)';
    worksheet.getCell(`H${row}`).font = { size: 8, italic: true };
    worksheet.getCell(`H${row}`).alignment = centerStyle;
    row += 2;

    // Reason
    worksheet.getCell(`A${row}`).value = ', who';
    worksheet.getCell(`A${row}`).alignment = { horizontal: 'right' };

    worksheet.mergeCells(`B${row}:D${row}`);
    worksheet.getCell(`B${row}`).value = data.vacatedReason?.toUpperCase();
    worksheet.getCell(`B${row}`).alignment = centerStyle;
    worksheet.getCell(`B${row}`).border = bottomBorderStyle;

    worksheet.mergeCells(`E${row}:G${row}`);
    worksheet.getCell(`E${row}`).value = 'with Plantilla Item No.';
    worksheet.getCell(`E${row}`).alignment = { horizontal: 'right' };

    worksheet.mergeCells(`H${row}:I${row}`);
    worksheet.getCell(`H${row}`).value = data.plantillaItemNo;
    worksheet.getCell(`H${row}`).font = { bold: true };
    worksheet.getCell(`H${row}`).alignment = centerStyle;
    worksheet.getCell(`H${row}`).border = bottomBorderStyle;
    row += 1;

    worksheet.mergeCells(`B${row}:D${row}`);
    worksheet.getCell(`B${row}`).value = '(Transferred, Retired, etc)';
    worksheet.getCell(`B${row}`).font = { size: 8, italic: true };
    worksheet.getCell(`B${row}`).alignment = centerStyle;
    row += 2;

    // Page
    worksheet.getCell(`A${row}`).value = 'Page';
    worksheet.getCell(`A${row}`).alignment = { horizontal: 'right' };
    
    worksheet.getCell(`B${row}`).value = data.pageNo;
    worksheet.getCell(`B${row}`).alignment = centerStyle;
    worksheet.getCell(`B${row}`).border = bottomBorderStyle;
    row += 2;

    // Effectivity
    worksheet.mergeCells(`A${row}:I${row}`);
    worksheet.getCell(`A${row}`).value = 'This appointment shall take effect on the date of signing by the appointing officer/authority.';
    worksheet.getCell(`A${row}`).alignment = centerStyle;
    row += 4;

    // Signatory
    worksheet.mergeCells(`F${row}:I${row}`);
    worksheet.getCell(`F${row}`).value = 'Very truly yours,';
    row += 2;

    worksheet.mergeCells(`F${row}:I${row}`);
    worksheet.getCell(`F${row}`).value = data.signatoryName?.toUpperCase();
    worksheet.getCell(`F${row}`).font = { bold: true };
    worksheet.getCell(`F${row}`).alignment = centerStyle;
    worksheet.getCell(`F${row}`).border = bottomBorderStyle;
    row += 1;

    worksheet.mergeCells(`F${row}:I${row}`);
    worksheet.getCell(`F${row}`).value = data.signatoryTitle;
    worksheet.getCell(`F${row}`).font = { bold: true };
    worksheet.getCell(`F${row}`).alignment = centerStyle;
    row += 1;

    worksheet.mergeCells(`F${row}:I${row}`);
    worksheet.getCell(`F${row}`).value = 'Appointing Officer/Authority';
    worksheet.getCell(`F${row}`).font = { size: 9 };
    worksheet.getCell(`F${row}`).alignment = centerStyle;
    row += 3;

    // Date Signing
    worksheet.mergeCells(`F${row}:I${row}`);
    worksheet.getCell(`F${row}`).value = data.appointmentDate;
    worksheet.getCell(`F${row}`).alignment = centerStyle;
    worksheet.getCell(`F${row}`).border = bottomBorderStyle;
    row += 1;

    worksheet.mergeCells(`F${row}:I${row}`);
    worksheet.getCell(`F${row}`).value = 'Date of Signing';
    worksheet.getCell(`F${row}`).font = { name: 'Times New Roman', size: 9, bold: true };
    worksheet.getCell(`F${row}`).alignment = centerStyle;

    // Generate Buffer
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `Appointment_Form_${data.appointeeName || 'New'}.xlsx`);
  } catch (error) {
    console.error('Failed to generate CS Form 33 Excel:', error);
    throw error;
  }
};
