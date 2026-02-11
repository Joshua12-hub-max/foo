import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { Position } from '@/api/plantillaApi';

export const generateCSCExcelReport = async (positions: Position[], departmentName: string = 'All Departments') => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Plantilla of Personnel');

    // Setup Page Layout
    worksheet.pageSetup = {
        paperSize: 9, // A4
        orientation: 'landscape',
        margins: {
            left: 0.5, right: 0.5,
            top: 0.5, bottom: 0.5,
            header: 0, footer: 0
        }
    };

    // Columns Setup (Approximate widths to match PDF)
    worksheet.columns = [
        { key: 'item_no', width: 10 },        // (3) Item No
        { key: 'position', width: 30 },       // (4) Position Title
        { key: 'sg', width: 5 },              // (5) SG
        { key: 'auth_salary', width: 12 },    // (6) Authorized Salary
        { key: 'actual_salary', width: 12 },  // (7) Actual Salary
        { key: 'step', width: 5 },            // (8) Step
        { key: 'area_code', width: 8 },       // (9) Area Code
        { key: 'area_type', width: 8 },       // (10) Area Type
        { key: 'area_level', width: 8 },      // (11) Area Level
        { key: 'last_name', width: 12 },      // (12) Last Name
        { key: 'first_name', width: 12 },     // (13) First Name
        { key: 'middle_name', width: 12 },    // (14) Middle Name
        { key: 'birth_date', width: 12 },     // (15) Birth Date
        { key: 'orig_appt', width: 12 },      // (16) Original Appt
        { key: 'last_promo', width: 12 },     // (17) Last Promo
        { key: 'status', width: 8 },          // (18) Status
    ];

    // Helper for Borders
    const borderStyle: Partial<ExcelJS.Borders> = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
    };

    const centerStyle: Partial<ExcelJS.Alignment> = { vertical: 'middle', horizontal: 'center', wrapText: true };
    const leftStyle: Partial<ExcelJS.Alignment> = { vertical: 'middle', horizontal: 'left', wrapText: true };
    const rightStyle: Partial<ExcelJS.Alignment> = { vertical: 'middle', horizontal: 'right', wrapText: true };

    // --- HEADER ---
    worksheet.mergeCells('A1:P1');
    worksheet.getCell('A1').value = 'Republic of the Philippines';
    worksheet.getCell('A1').alignment = centerStyle;
    worksheet.getCell('A1').font = { name: 'Arial Narrow', size: 9 };

    worksheet.mergeCells('A2:P2');
    worksheet.getCell('A2').value = 'Civil Service Commission';
    worksheet.getCell('A2').alignment = centerStyle;
    worksheet.getCell('A2').font = { name: 'Arial Narrow', size: 9 };

    worksheet.mergeCells('A3:P3');
    worksheet.getCell('A3').value = 'PLANTILLA OF PERSONNEL';
    worksheet.getCell('A3').alignment = centerStyle;
    worksheet.getCell('A3').font = { name: 'Arial Narrow', size: 14, bold: true };

    worksheet.mergeCells('A4:P4');
    worksheet.getCell('A4').value = 'for the Fiscal Year ____________';
    worksheet.getCell('A4').alignment = centerStyle;
    worksheet.getCell('A4').font = { name: 'Arial Narrow', size: 9 };

    // Dept/Agency Rows
    worksheet.mergeCells('A6:H6');
    worksheet.getCell('A6').value = `(1) Department/GOCC: ${departmentName}`;
    worksheet.getCell('A6').font = { name: 'Arial Narrow', size: 8, bold: true };
    worksheet.getCell('A6').border = { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };

    worksheet.mergeCells('I6:P6');
    worksheet.getCell('I6').value = `(2) Bureau/Agency/Subsidiary: LGU Ligao`; // Hardcoded as per preview logic
    worksheet.getCell('I6').font = { name: 'Arial Narrow', size: 8, bold: true };
    worksheet.getCell('I6').border = { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };

    // --- TABLE HEADERS ---
    const headerRowStart = 7;
    
    // Row 1 of Headers
    worksheet.getCell(`A${headerRowStart}`).value = 'ITEM NUMBER';
    worksheet.getCell(`B${headerRowStart}`).value = 'POSITION TITLE';
    worksheet.getCell(`C${headerRowStart}`).value = 'SG';
    worksheet.getCell(`D${headerRowStart}`).value = 'ANNUAL SALARY';
    worksheet.getCell(`F${headerRowStart}`).value = 'STEP';
    worksheet.getCell(`G${headerRowStart}`).value = 'AREA';
    worksheet.getCell(`J${headerRowStart}`).value = 'NAME OF INCUMBENT';
    worksheet.getCell(`M${headerRowStart}`).value = 'DATE OF BIRTH';
    worksheet.getCell(`N${headerRowStart}`).value = 'ORIGINAL APPT';
    worksheet.getCell(`O${headerRowStart}`).value = 'LAST PROMO';
    worksheet.getCell(`P${headerRowStart}`).value = 'STATUS';

    // Merges for Header Row 1
    worksheet.mergeCells(`A${headerRowStart}:A${headerRowStart + 1}`);
    worksheet.mergeCells(`B${headerRowStart}:B${headerRowStart + 1}`);
    worksheet.mergeCells(`C${headerRowStart}:C${headerRowStart + 1}`);
    worksheet.mergeCells(`D${headerRowStart}:E${headerRowStart}`); // Annual Salary Spans Auth/Actual
    worksheet.mergeCells(`F${headerRowStart}:F${headerRowStart + 1}`);
    worksheet.mergeCells(`G${headerRowStart}:I${headerRowStart}`); // Area Spans Code/Type/Level
    worksheet.mergeCells(`J${headerRowStart}:L${headerRowStart}`); // Name Spans Last/First/Mid
    worksheet.mergeCells(`M${headerRowStart}:M${headerRowStart + 1}`);
    worksheet.mergeCells(`N${headerRowStart}:N${headerRowStart + 1}`);
    worksheet.mergeCells(`O${headerRowStart}:O${headerRowStart + 1}`);
    worksheet.mergeCells(`P${headerRowStart}:P${headerRowStart + 1}`);

    // Row 2 of Headers (Sub-headers)
    worksheet.getCell(`D${headerRowStart + 1}`).value = 'AUTHORIZED';
    worksheet.getCell(`E${headerRowStart + 1}`).value = 'ACTUAL';
    worksheet.getCell(`G${headerRowStart + 1}`).value = 'CODE';
    worksheet.getCell(`H${headerRowStart + 1}`).value = 'TYPE';
    worksheet.getCell(`I${headerRowStart + 1}`).value = 'LEVEL';
    worksheet.getCell(`J${headerRowStart + 1}`).value = 'LAST NAME';
    worksheet.getCell(`K${headerRowStart + 1}`).value = 'FIRST NAME';
    worksheet.getCell(`L${headerRowStart + 1}`).value = 'MIDDLE NAME';

    // Row 3 (Column numbers)
    const colNumRow = headerRowStart + 2;
    const colNums = ['(3)', '(4)', '(5)', '(6)', '(7)', '(8)', '(9)', '(10)', '(11)', '(12)', '(13)', '(14)', '(15)', '(16)', '(17)', '(18)'];
    colNums.forEach((num, idx) => {
        const cell = worksheet.getCell(colNumRow, idx + 1);
        cell.value = num;
        cell.alignment = centerStyle;
        cell.font = { name: 'Arial Narrow', size: 7, italic: true };
        cell.border = borderStyle;
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } };
    });

    // Style Header Row 1 & 2
    for (let r = headerRowStart; r <= headerRowStart + 1; r++) {
        for (let c = 1; c <= 16; c++) {
            const cell = worksheet.getCell(r, c);
            cell.alignment = centerStyle;
            cell.font = { name: 'Arial Narrow', size: 8, bold: true };
            cell.border = borderStyle;
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } };
        }
    }

    // --- DATA ROWS ---
    let currentRow = colNumRow + 1;

    positions.forEach(pos => {
        const annualSalary = pos.monthly_salary ? (Number(pos.monthly_salary) * 12) : 0;
        
        let lastName = '', firstName = '', middleName = '';
        if (pos.incumbent_name) {
            const nameParts = pos.incumbent_name.split(',').map(s => s.trim());
            if (nameParts.length > 0) lastName = nameParts[0];
            if (nameParts.length > 1) {
                const firstParts = nameParts[1].split(' ');
                firstName = firstParts[0]; 
                if (firstParts.length > 1) middleName = firstParts.slice(1).join(' ');
            }
        }

        const formatDate = (dateStr?: string) => {
            if (!dateStr) return '';
            try {
                return new Date(dateStr).toLocaleDateString('en-US');
            } catch {
                return dateStr;
            }
        };

        const rowValues = [
            pos.item_number,
            pos.position_title,
            pos.salary_grade,
            annualSalary, // Authorized
            annualSalary, // Actual (Same for now per logic)
            pos.step_increment,
            pos.area_code || '',
            pos.area_type || '',
            pos.area_level || '',
            lastName,
            firstName,
            middleName,
            formatDate(pos.birth_date),
            formatDate(pos.original_appointment_date),
            formatDate(pos.last_promotion_date),
            pos.is_vacant ? 'Vacant' : (pos.status || 'Filled').substring(0, 2)
        ];

        const row = worksheet.getRow(currentRow);
        row.values = rowValues;
        
        // Style Data Row
        row.eachCell((cell, colNumber) => {
            cell.font = { name: 'Arial Narrow', size: 8 };
            cell.border = borderStyle;
            
            // Alignments
            if ([3, 6, 7, 8, 9, 13, 14, 15, 16].includes(colNumber)) { // Center: SG, Step, Areas, Dates, Status
                cell.alignment = centerStyle;
            } else if ([4, 5].includes(colNumber)) { // Right: Salaries
                cell.alignment = rightStyle;
                cell.numFmt = '#,##0.00';
            } else {
                cell.alignment = leftStyle; // Left: Item No, Title, Names
            }

            // Bold Item No
            if (colNumber === 1) cell.font = { name: 'Arial Narrow', size: 8, bold: true };
        });

        currentRow++;
    });

    // --- FOOTER ---
    currentRow += 2;
    const footerStartRow = currentRow;
    
    worksheet.mergeCells(`A${currentRow}:P${currentRow}`);
    worksheet.getCell(`A${currentRow}`).value = `(19) Total Number of Position Items: ${positions.length}`;
    worksheet.getCell(`A${currentRow}`).font = { name: 'Arial Narrow', size: 9, bold: true };

    currentRow += 2;
    worksheet.mergeCells(`A${currentRow}:P${currentRow}`);
    const certText = "I certify to the correctness of the entries and that above Position Items are duly approved and authorized by the agency and in compliance to existing rules and regulations. I further certify that employees whose names appears above are the incumbents of the position:";
    worksheet.getCell(`A${currentRow}`).value = certText;
    worksheet.getCell(`A${currentRow}`).alignment = { wrapText: true, vertical: 'top' };
    worksheet.getCell(`A${currentRow}`).font = { name: 'Arial Narrow', size: 9 };
    worksheet.getRow(currentRow).height = 30;

    currentRow += 3;

    // Signatures
    // HRMO
    worksheet.mergeCells(`B${currentRow}:E${currentRow}`);
    worksheet.getCell(`B${currentRow}`).value = '_________________________';
    worksheet.getCell(`B${currentRow}`).alignment = centerStyle;
    
    worksheet.mergeCells(`K${currentRow}:N${currentRow}`);
    worksheet.getCell(`K${currentRow}`).value = '_________________________';
    worksheet.getCell(`K${currentRow}`).alignment = centerStyle;

    currentRow++;
    
    worksheet.mergeCells(`B${currentRow}:E${currentRow}`);
    worksheet.getCell(`B${currentRow}`).value = 'Human Resource Management Officer';
    worksheet.getCell(`B${currentRow}`).alignment = centerStyle;
    worksheet.getCell(`B${currentRow}`).font = { name: 'Arial Narrow', size: 8 };

    worksheet.mergeCells(`K${currentRow}:N${currentRow}`);
    worksheet.getCell(`K${currentRow}`).value = 'Head Of Agency/Department';
    worksheet.getCell(`K${currentRow}`).alignment = centerStyle;
    worksheet.getCell(`K${currentRow}`).font = { name: 'Arial Narrow', size: 8 };

    currentRow += 2;
    
    worksheet.mergeCells(`B${currentRow}:E${currentRow}`);
    worksheet.getCell(`B${currentRow}`).value = 'Date: _________________';
    worksheet.getCell(`B${currentRow}`).alignment = centerStyle;
    worksheet.getCell(`B${currentRow}`).font = { name: 'Arial Narrow', size: 8 };

    worksheet.mergeCells(`K${currentRow}:N${currentRow}`);
    worksheet.getCell(`K${currentRow}`).value = 'Date: _________________';
    worksheet.getCell(`K${currentRow}`).alignment = centerStyle;
    worksheet.getCell(`K${currentRow}`).font = { name: 'Arial Narrow', size: 8 };


    // Generate Buffer
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `Plantilla_Report_${departmentName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
};
