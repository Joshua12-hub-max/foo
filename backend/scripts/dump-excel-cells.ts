/**
 * Excel Cell Dumper
 *
 * This script shows what data is in each cell of an Excel file
 * so we can verify/fix the PDS coordinate map.
 *
 * Usage:
 * npm run dump-excel <path-to-excel-file.xlsx>
 */

import ExcelJS from 'exceljs';
import fs from 'fs';

const filePath = process.argv[2];

if (!filePath) {
  console.error('❌ Usage: npm run dump-excel <path-to-excel-file.xlsx>');
  process.exit(1);
}

async function dumpExcelCells() {
  try {
    if (!fs.existsSync(filePath)) {
      console.error(`❌ File not found: ${filePath}`);
      process.exit(1);
    }

    const buffer = await fs.promises.readFile(filePath);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    console.log('📊 EXCEL FILE CELL DUMP');
    console.log('='.repeat(80));
    console.log(`File: ${filePath}\n`);

    // Process first sheet only (where personal info should be)
    const sheet = workbook.getWorksheet(1);
    if (!sheet) {
      console.error('❌ No sheets found in workbook');
      process.exit(1);
    }

    console.log(`Sheet: ${sheet.name || 'Sheet 1'}`);
    console.log('='.repeat(80));

    // Scan rows 1-50, columns A-P (most relevant area)
    console.log('\n🔍 SCANNING ROWS 1-50 for key data...\n');

    const searchTerms = [
      'surname', 'first name', 'middle', 'birth', 'place of birth',
      'gender', 'height', 'weight', 'blood',  'civil status',
      'gsis', 'pagibig', 'philhealth', 'sss', 'tin', 'umid', 'philsys',
      'residential', 'permanent', 'telephone', 'mobile', 'email',
      'spouse', 'father', 'mother', 'children'
    ];

    for (let row = 1; row <= 50; row++) {
      for (let col = 1; col <= 16; col++) { // A to P
        const cell = sheet.getRow(row).getCell(col);
        const value = cell.value;

        if (!value) continue;

        let displayValue = '';
        if (value instanceof Date) {
          displayValue = value.toISOString().split('T')[0];
        } else if (typeof value === 'object' && 'richText' in value) {
          displayValue = (value as any).richText.map((rt: any) => rt.text || '').join('');
        } else if (typeof value === 'object' && 'result' in value) {
          displayValue = String((value as any).result);
        } else {
          displayValue = String(value);
        }

        if (!displayValue || displayValue.trim().length === 0) continue;

        // Convert column number to letter
        const colLetter = String.fromCharCode(64 + col);
        const cellRef = `${colLetter}${row}`;

        // Check if this might be a label or important data
        const lowerValue = displayValue.toLowerCase();
        const isInteresting = searchTerms.some(term => lowerValue.includes(term));

        if (isInteresting || displayValue.length > 2) {
          const marker = isInteresting ? '⭐' : '  ';
          console.log(`${marker} ${cellRef.padEnd(6)} = ${displayValue.substring(0, 60)}`);
        }
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n💡 KEY CELLS TO CHECK:\n');
    console.log('Expected Locations vs Actual:');
    console.log('-'.repeat(80));

    const keyCells = [
      { label: 'Surname', expected: 'D7', sheet: 1 },
      { label: 'First Name', expected: 'D8', sheet: 1 },
      { label: 'Middle Name', expected: 'D9', sheet: 1 },
      { label: 'Birth Date', expected: 'D11', sheet: 1 },
      { label: 'Place of Birth', expected: 'D12', sheet: 1 },
      { label: 'Height (m)', expected: 'D15', sheet: 1 },
      { label: 'Weight (kg)', expected: 'D16', sheet: 1 },
      { label: 'Blood Type', expected: 'D17', sheet: 1 },
      { label: 'GSIS Number', expected: 'D19', sheet: 1 },
      { label: 'Pag-IBIG Number', expected: 'D20', sheet: 1 },
      { label: 'PhilHealth Number', expected: 'D21', sheet: 1 },
      { label: 'SSS Number', expected: 'D22', sheet: 1 },
      { label: 'TIN Number', expected: 'D23', sheet: 1 },
      { label: 'UMID Number', expected: 'D25', sheet: 1 },
      { label: 'PhilSys ID', expected: 'D26', sheet: 1 },
    ];

    for (const key of keyCells) {
      const cell = sheet.getCell(key.expected);
      let actualValue = '';

      if (cell.value instanceof Date) {
        actualValue = cell.value.toISOString().split('T')[0];
      } else if (typeof cell.value === 'object' && cell.value && 'richText' in cell.value) {
        actualValue = (cell.value as any).richText.map((rt: any) => rt.text || '').join('');
      } else if (typeof cell.value === 'object' && cell.value && 'result' in cell.value) {
        actualValue = String((cell.value as any).result);
      } else {
        actualValue = String(cell.value || '');
      }

      const status = actualValue && actualValue !== 'null' ? '✅' : '❌';
      console.log(`${status} ${key.label.padEnd(20)} | Expected: ${key.expected.padEnd(6)} | Actual: ${actualValue.substring(0, 40)}`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n📝 ACTION NEEDED:');
    console.log('1. Review the cell dump above');
    console.log('2. Find where the actual data is located');
    console.log('3. Update backend/config/pdsCoordinateMap.ts with correct cell references');
    console.log('4. Re-run the parser test\n');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

dumpExcelCells();
