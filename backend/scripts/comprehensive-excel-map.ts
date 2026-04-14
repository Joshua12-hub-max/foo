/**
 * Comprehensive Excel Mapping Tool
 *
 * Analyzes EVERY cell in rows 1-60 (Personal Info, Family, Education sections)
 * to create an exact coordinate map.
 */

import ExcelJS from 'exceljs';
import fs from 'fs';

const filePath = process.argv[2];

if (!filePath) {
  console.error('❌ Usage: npm run map-excel <path-to-excel-file.xlsx>');
  process.exit(1);
}

async function mapExcel() {
  try {
    const buffer = await fs.promises.readFile(filePath);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const sheet = workbook.getWorksheet(1);
    if (!sheet) {
      console.error('❌ No sheets found');
      process.exit(1);
    }

    console.log('📊 COMPREHENSIVE EXCEL CELL MAPPING');
    console.log('='.repeat(100));
    console.log(`File: ${filePath}\n`);

    // Helper to get cell value
    const getVal = (cell: any): string => {
      if (!cell.value) return '';
      if (cell.value instanceof Date) return cell.value.toISOString().split('T')[0];
      if (typeof cell.value === 'object' && 'richText' in cell.value) {
        return (cell.value as any).richText.map((rt: any) => rt.text || '').join('');
      }
      if (typeof cell.value === 'object' && 'result' in cell.value) {
        return String((cell.value as any).result);
      }
      return String(cell.value);
    };

    // Map structure to find data
    const dataMap: any = {
      personalInfo: {},
      family: {},
      education: {}
    };

    console.log('\n📍 SECTION 1: PERSONAL INFORMATION (Rows 10-35)\n');
    console.log('-'.repeat(100));

    for (let row = 10; row <= 35; row++) {
      const rowData: string[] = [];
      for (let col = 1; col <= 16; col++) {
        const cell = sheet.getRow(row).getCell(col);
        const val = getVal(cell);
        const colLetter = String.fromCharCode(64 + col);

        if (val && val.trim().length > 0) {
          rowData.push(`${colLetter}=${val.substring(0, 30)}`);
        }
      }

      if (rowData.length > 0) {
        console.log(`Row ${row.toString().padStart(2)}: ${rowData.join(' | ')}`);
      }
    }

    console.log('\n📍 SECTION 2: FAMILY BACKGROUND (Rows 36-49)\n');
    console.log('-'.repeat(100));

    for (let row = 36; row <= 49; row++) {
      const rowData: string[] = [];
      for (let col = 1; col <= 16; col++) {
        const cell = sheet.getRow(row).getCell(col);
        const val = getVal(cell);
        const colLetter = String.fromCharCode(64 + col);

        if (val && val.trim().length > 0) {
          rowData.push(`${colLetter}=${val.substring(0, 30)}`);
        }
      }

      if (rowData.length > 0) {
        console.log(`Row ${row.toString().padStart(2)}: ${rowData.join(' | ')}`);
      }
    }

    console.log('\n📍 SECTION 3: EDUCATION BACKGROUND (Rows 50-65)\n');
    console.log('-'.repeat(100));

    for (let row = 50; row <= 65; row++) {
      const rowData: string[] = [];
      for (let col = 1; col <= 16; col++) {
        const cell = sheet.getRow(row).getCell(col);
        const val = getVal(cell);
        const colLetter = String.fromCharCode(64 + col);

        if (val && val.trim().length > 0) {
          rowData.push(`${colLetter}=${val.substring(0, 30)}`);
        }
      }

      if (rowData.length > 0) {
        console.log(`Row ${row.toString().padStart(2)}: ${rowData.join(' | ')}`);
      }
    }

    // Now create exact mapping
    console.log('\n' + '='.repeat(100));
    console.log('\n🎯 EXACT COORDINATE MAP\n');
    console.log('-'.repeat(100));

    const mapping: any = {
      'Surname (Row 10)': getVal(sheet.getCell('D10')),
      'First Name (Row 11)': getVal(sheet.getCell('D11')),
      'Middle Name (Row 12)': getVal(sheet.getCell('D12')),
      'Name Extension (Row 11)': getVal(sheet.getCell('P11')),
      'Birth Date (Row 13)': getVal(sheet.getCell('D13')),
      'Place of Birth (Row 15)': getVal(sheet.getCell('D15')),
      'Gender Male (Row 16, Col D)': getVal(sheet.getCell('D16')),
      'Gender Female (Row 16, Col P)': getVal(sheet.getCell('P16')),
      'Civil Status Married (Row 11, Col P)': getVal(sheet.getCell('P11')),
      'Civil Status Widowed (Row 12, Col P)': getVal(sheet.getCell('P12')),
      'Civil Status Separated (Row 13, Col P)': getVal(sheet.getCell('P13')),
      'Civil Status Solo Parent (Row 15, Col P)': getVal(sheet.getCell('P15')),
      'Height (Row 22)': getVal(sheet.getCell('D22')),
      'Weight (Row 24)': getVal(sheet.getCell('D24')),
      'Blood Type (Row 25)': getVal(sheet.getCell('D25')),
      'Blood Type (Row 26)': getVal(sheet.getCell('D26')),
      'UMID (Row 27)': getVal(sheet.getCell('D27')),
      'Pag-IBIG (Row 29)': getVal(sheet.getCell('D29')),
      'PhilHealth (Row 31)': getVal(sheet.getCell('D31')),
      'PhilSys (Row 32)': getVal(sheet.getCell('D32')),
      'TIN (Row 33)': getVal(sheet.getCell('D33')),
      'Agency Employee No (Row 34)': getVal(sheet.getCell('D34')),
      'Mobile (Row 33, Col I)': getVal(sheet.getCell('I33')),
      'Email (Row 34, Col I)': getVal(sheet.getCell('I34')),
      'Residential House/Lot (Row 17, Col I)': getVal(sheet.getCell('I17')),
      'Residential Street (Row 17, Col L)': getVal(sheet.getCell('L17')),
      'Residential Subdivision (Row 19, Col I)': getVal(sheet.getCell('I19')),
      'Residential Barangay (Row 19, Col L)': getVal(sheet.getCell('L19')),
      'Residential City (Row 22, Col I)': getVal(sheet.getCell('I22')),
      'Residential Province (Row 22, Col L)': getVal(sheet.getCell('L22')),
      'Residential ZIP (Row 24, Col I)': getVal(sheet.getCell('I24')),
      'Spouse Surname (Row 36, Col D)': getVal(sheet.getCell('D36')),
      'Spouse First (Row 37, Col D)': getVal(sheet.getCell('D37')),
      'Spouse Middle (Row 38, Col D)': getVal(sheet.getCell('D38')),
      'Spouse Occupation (Row 39, Col D)': getVal(sheet.getCell('D39')),
      'Spouse Employer (Row 40, Col D)': getVal(sheet.getCell('D40')),
      'Spouse Business Addr (Row 41, Col D)': getVal(sheet.getCell('D41')),
      'Spouse Tel (Row 42, Col D)': getVal(sheet.getCell('D42')),
      'Father Surname (Row 43, Col D)': getVal(sheet.getCell('D43')),
      'Father First (Row 44, Col D)': getVal(sheet.getCell('D44')),
      'Father Middle (Row 45, Col D)': getVal(sheet.getCell('D45')),
      'Mother Surname (Row 47, Col D)': getVal(sheet.getCell('D47')),
      'Mother First (Row 48, Col D)': getVal(sheet.getCell('D48')),
      'Mother Middle (Row 49, Col D)': getVal(sheet.getCell('D49')),
      'Elementary School (Row 52, Col D)': getVal(sheet.getCell('D52')),
      'Elementary Course (Row 52, Col G)': getVal(sheet.getCell('G52')),
      'Elementary From (Row 52, Col J)': getVal(sheet.getCell('J52')),
      'Elementary To (Row 52, Col K)': getVal(sheet.getCell('K52')),
      'Elementary Grad (Row 52, Col M)': getVal(sheet.getCell('M52')),
      'Elementary Honors (Row 52, Col N)': getVal(sheet.getCell('N52')),
      'Secondary School (Row 53, Col D)': getVal(sheet.getCell('D53')),
      'Secondary Course (Row 53, Col G)': getVal(sheet.getCell('G53')),
      'Secondary From (Row 53, Col J)': getVal(sheet.getCell('J53')),
      'Secondary To (Row 53, Col K)': getVal(sheet.getCell('K53')),
      'Secondary Grad (Row 53, Col M)': getVal(sheet.getCell('M53')),
      'Vocational School (Row 54, Col D)': getVal(sheet.getCell('D54')),
      'College School (Row 55, Col D)': getVal(sheet.getCell('D55')),
      'Graduate School (Row 56, Col D)': getVal(sheet.getCell('D56')),
    };

    for (const [key, value] of Object.entries(mapping)) {
      const status = value ? '✅' : '❌';
      const displayVal = value ? String(value).substring(0, 50) : '(empty)';
      console.log(`${status} ${key.padEnd(40)} = ${displayVal}`);
    }

    console.log('\n' + '='.repeat(100));

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

mapExcel();
