
import ExcelJS from 'exceljs';
import path from 'path';

// SG 1 Step 1 values for 2024 (Tranche 1 - EO 64)
const sg1Values: Record<number, number> = {
  1: 13530,
  2: 14372,
  3: 15265,
  4: 16209,
  5: 17205,
  6: 18255,
  7: 19365,
  8: 20440,
  9: 21790,
  10: 23176, // Estimated
  11: 27000,
  12: 29165,
  13: 31320,
  14: 33843,
  15: 36619,
  16: 39672,
  17: 43030,
  18: 46725,
  19: 51357,
  20: 57347,
  21: 63997,
  22: 71511,
  23: 79890,
  24: 89296,
  25: 100788,
  26: 113891,
  27: 128696,
  28: 145427,
  29: 164324,
  30: 185695,
  31: 273278,
  32: 325807,
  33: 411312
};

const STEP_INCREMENT_RATE = 0.011; 

const generateExcel = async () => {
    console.log('Generating Excel File...');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Salary Schedule');

    // Define Columns
    worksheet.columns = [
        { header: 'Grade', key: 'grade', width: 10 },
        { header: 'Step 1', key: 'step1', width: 15 },
        { header: 'Step 2', key: 'step2', width: 15 },
        { header: 'Step 3', key: 'step3', width: 15 },
        { header: 'Step 4', key: 'step4', width: 15 },
        { header: 'Step 5', key: 'step5', width: 15 },
        { header: 'Step 6', key: 'step6', width: 15 },
        { header: 'Step 7', key: 'step7', width: 15 },
        { header: 'Step 8', key: 'step8', width: 15 },
    ];

    // Add Rows
    for (let sg = 1; sg <= 33; sg++) {
        // Fallback for missing grades?
        const step1 = sg1Values[sg] || (sg1Values[sg-1] ? Math.round(sg1Values[sg-1] * 1.1) : 10000);
        
        const rowData: any = { grade: sg };

        for (let step = 1; step <= 8; step++) {
            // Apply increment
            let monthly = Math.round(step1 * Math.pow(1 + STEP_INCREMENT_RATE, step - 1));
            rowData[`step${step}`] = monthly;
        }

        worksheet.addRow(rowData);
    }

    // Write to file
    const filename = 'salary_schedule_full.xlsx';
    // Save to frontend public folder for easy download
    const filePath = path.resolve(process.cwd(), '../frontend/public', filename);
    
    await workbook.xlsx.writeFile(filePath);
    console.log(`✅ Excel file generated successfully at: ${filePath}`);
};

generateExcel();
