import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { Form9Data } from '@/schemas/compliance';

export const generateForm9Excel = async (data: Form9Data) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('CS Form No. 9');

    // ... (rest of the implementation)
    // Setup Page Layout
    worksheet.pageSetup = {
        paperSize: 5, // Legal
        orientation: 'landscape',
        margins: {
            left: 0.3, right: 0.3,
            top: 0.3, bottom: 0.3,
            header: 0, footer: 0
        }
    };

    // Columns Setup
    worksheet.columns = [
        { key: 'no', width: 5 },              // No.
        { key: 'title', width: 25 },          // Position Title
        { key: 'item_no', width: 10 },        // Plantilla Item No.
        { key: 'sg', width: 6 },              // SG
        { key: 'salary', width: 12 },         // Monthly Salary
        { key: 'education', width: 20 },      // Education
        { key: 'training', width: 15 },       // Training
        { key: 'experience', width: 15 },     // Experience
        { key: 'eligibility', width: 20 },    // Eligibility
        { key: 'competency', width: 15 },     // Competency
        { key: 'assignment', width: 15 },     // Place of Assignment
    ];

    const borderStyle: Partial<ExcelJS.Borders> = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
    };

    const centerStyle: Partial<ExcelJS.Alignment> = { vertical: 'middle', horizontal: 'center', wrapText: true };
    const leftStyle: Partial<ExcelJS.Alignment> = { vertical: 'middle', horizontal: 'left', wrapText: true };

    // --- HEADER ---
    worksheet.mergeCells('A1:K1');
    worksheet.getCell('A1').value = 'Republic of the Philippines';
    worksheet.getCell('A1').alignment = centerStyle;
    worksheet.getCell('A1').font = { name: 'Arial', size: 9 };

    worksheet.mergeCells('A2:K2');
    worksheet.getCell('A2').value = data.header.agencyName || 'AGENCY NAME';
    worksheet.getCell('A2').alignment = centerStyle;
    worksheet.getCell('A2').font = { name: 'Arial', size: 12, bold: true };

    worksheet.mergeCells('A3:K3');
    worksheet.getCell('A3').value = 'Request for Publication of Vacant Positions';
    worksheet.getCell('A3').alignment = centerStyle;
    worksheet.getCell('A3').font = { name: 'Arial', size: 10, bold: true };

    worksheet.mergeCells('A5:K5');
    worksheet.getCell('A5').value = 'To: CIVIL SERVICE COMMISSION (CSC)';
    worksheet.getCell('A5').font = { name: 'Arial', size: 9 };

    worksheet.mergeCells('A6:K6');
    worksheet.getCell('A6').value = `We hereby request the publication in the CSC Job Portal of the following vacant positions, which are authorized to be filled at the ${data.header.agencyName}:`;
    worksheet.getCell('A6').font = { name: 'Arial', size: 8 };
    worksheet.getCell('A6').alignment = { wrapText: true, vertical: 'middle' };

    // Signatory Header (Right Aligned)
    worksheet.mergeCells('H8:K8');
    worksheet.getCell('H8').value = data.header.signatoryName;
    worksheet.getCell('H8').alignment = { horizontal: 'right' };
    worksheet.getCell('H8').font = { name: 'Arial', size: 9, bold: true };
    
    worksheet.mergeCells('H9:K9');
    worksheet.getCell('H9').value = data.header.signatoryTitle;
    worksheet.getCell('H9').alignment = { horizontal: 'right' };
    worksheet.getCell('H9').font = { name: 'Arial', size: 8 };

    worksheet.mergeCells('H10:K10');
    worksheet.getCell('H10').value = `Date: ${data.header.date}`;
    worksheet.getCell('H10').alignment = { horizontal: 'right' };
    worksheet.getCell('H10').font = { name: 'Arial', size: 8 };

    // --- TABLE HEADERS ---
    const headerRow = 12;
    
    // Header Data
    worksheet.getCell(`A${headerRow}`).value = 'No.';
    worksheet.getCell(`B${headerRow}`).value = 'Position Title (Parenthetical Title, if applicable)';
    worksheet.getCell(`C${headerRow}`).value = 'Plantilla Item No.';
    worksheet.getCell(`D${headerRow}`).value = 'Salary/ Job Pay Grade';
    worksheet.getCell(`E${headerRow}`).value = 'Monthly Salary';
    worksheet.getCell(`F${headerRow}`).value = 'Qualification Standards';
    worksheet.getCell(`K${headerRow}`).value = 'Place of Assignment';

    // Merging Headers
    worksheet.mergeCells(`A${headerRow}:A${headerRow + 1}`);
    worksheet.mergeCells(`B${headerRow}:B${headerRow + 1}`);
    worksheet.mergeCells(`C${headerRow}:C${headerRow + 1}`);
    worksheet.mergeCells(`D${headerRow}:D${headerRow + 1}`);
    worksheet.mergeCells(`E${headerRow}:E${headerRow + 1}`);
    worksheet.mergeCells(`F${headerRow}:J${headerRow}`); // QS Spanning
    worksheet.mergeCells(`K${headerRow}:K${headerRow + 1}`);

    // Sub Headers for QS
    const subHeaderRow = headerRow + 1;
    worksheet.getCell(`F${subHeaderRow}`).value = 'Education';
    worksheet.getCell(`G${subHeaderRow}`).value = 'Training';
    worksheet.getCell(`H${subHeaderRow}`).value = 'Experience';
    worksheet.getCell(`I${subHeaderRow}`).value = 'Eligibility';
    worksheet.getCell(`J${subHeaderRow}`).value = 'Competency (if applicable)';

    // Styling Headers
    for (let r = headerRow; r <= subHeaderRow; r++) {
        for (let c = 1; c <= 11; c++) {
            const cell = worksheet.getCell(r, c);
            cell.alignment = centerStyle;
            cell.font = { name: 'Arial', size: 7, bold: true };
            cell.border = borderStyle;
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } };
        }
    }

    // --- DATA ROWS ---
    let currentRow = subHeaderRow + 1;

    data.positions.forEach(pos => {
        const row = worksheet.getRow(currentRow);
        row.values = [
            pos.no,
            pos.positionTitle,
            pos.plantillaItemNo,
            pos.salaryGrade,
            pos.monthlySalary,
            pos.education,
            pos.training,
            pos.experience,
            pos.eligibility,
            pos.competency,
            pos.placeOfAssignment
        ];

        row.eachCell((cell, colNumber) => {
            cell.font = { name: 'Arial', size: 7 };
            cell.border = borderStyle;
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

    // --- FOOTER ---
    currentRow += 1;
    
    // Requirements Text
    worksheet.mergeCells(`A${currentRow}:K${currentRow}`);
    const reqText = `Interested and qualified applicants should signify their interest in writing. Attach the following documents to the application letter and send to the address below not later than ${data.header.deadlineDate}.`;
    worksheet.getCell(`A${currentRow}`).value = reqText;
    worksheet.getCell(`A${currentRow}`).font = { name: 'Arial', size: 8 };
    worksheet.getCell(`A${currentRow}`).alignment = { wrapText: true };
    worksheet.getRow(currentRow).height = 30;

    currentRow += 1;
    const requirements = [
        "1. Fully accomplished Personal Data Sheet (PDS) with Work Experience Sheet (CS Form No. 212, Revised 2017);",
        "2. Performance rating in the last rating period (if applicable);",
        "3. Photocopy of certificate of eligibility/rating/license; and",
        "4. Photocopy of Transcript of Records."
    ];
    
    requirements.forEach(req => {
        worksheet.mergeCells(`A${currentRow}:K${currentRow}`);
        worksheet.getCell(`A${currentRow}`).value = req;
        worksheet.getCell(`A${currentRow}`).font = { name: 'Arial', size: 8 };
        currentRow++;
    });

    currentRow += 1;
    worksheet.mergeCells(`A${currentRow}:K${currentRow}`);
    worksheet.getCell(`A${currentRow}`).value = "QUALIFIED APPLICANTS are advised to hand in or send through courier/email their application to:";
    worksheet.getCell(`A${currentRow}`).font = { name: 'Arial', size: 8 };

    currentRow += 2;
    
    // Contact Info Box
    worksheet.mergeCells(`B${currentRow}:E${currentRow}`);
    worksheet.getCell(`B${currentRow}`).value = data.header.signatoryName;
    worksheet.getCell(`B${currentRow}`).font = { name: 'Arial', size: 8, bold: true };

    currentRow++;
    worksheet.mergeCells(`B${currentRow}:E${currentRow}`);
    worksheet.getCell(`B${currentRow}`).value = data.header.signatoryTitle;
    worksheet.getCell(`B${currentRow}`).font = { name: 'Arial', size: 8 };

    currentRow++;
    worksheet.mergeCells(`B${currentRow}:E${currentRow}`);
    worksheet.getCell(`B${currentRow}`).value = data.header.officeAddress;
    worksheet.getCell(`B${currentRow}`).font = { name: 'Arial', size: 8 };

    currentRow++;
    worksheet.mergeCells(`B${currentRow}:E${currentRow}`);
    worksheet.getCell(`B${currentRow}`).value = data.header.contactInfo;
    worksheet.getCell(`B${currentRow}`).font = { name: 'Arial', size: 8 };

    currentRow += 2;
    worksheet.mergeCells(`A${currentRow}:K${currentRow}`);
    worksheet.getCell(`A${currentRow}`).value = "APPLICATIONS WITH INCOMPLETE DOCUMENTS SHALL NOT BE ENTERTAINED.";
    worksheet.getCell(`A${currentRow}`).font = { name: 'Arial', size: 8, bold: true };
    worksheet.getCell(`A${currentRow}`).alignment = centerStyle;


    // Generate Buffer
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `CSForm9_Publication_${data.header.agencyName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
  } catch (error) {
    console.error('Failed to generate Form 9 Excel:', error);
    throw error;
  }
};
