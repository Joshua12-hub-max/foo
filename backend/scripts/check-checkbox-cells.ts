import ExcelJS from 'exceljs';
import fs from 'fs';

const filePath = process.argv[2];

if (!filePath) {
  console.error('Usage: node check-checkbox-cells.ts <excel-file>');
  process.exit(1);
}

async function checkCells() {
  const wb = new ExcelJS.Workbook();
  const buffer = await fs.promises.readFile(filePath);
  await wb.xlsx.load(buffer);
  const sheet = wb.getWorksheet(1);

  const getCellVal = (addr: string) => {
    const cell = sheet.getCell(addr);
    if (!cell.value) return '(empty)';
    if (cell.value instanceof Date) return cell.value.toISOString().split('T')[0];
    if (typeof cell.value === 'object' && 'richText' in cell.value) {
      return (cell.value as any).richText.map((rt: any) => rt.text || '').join('');
    }
    if (typeof cell.value === 'object' && 'result' in cell.value) {
      return String((cell.value as any).result);
    }
    if (typeof cell.value === 'object' && 'text' in cell.value) {
      return String((cell.value as any).text);
    }
    return String(cell.value);
  };

  console.log('=== GENDER (Row 16) ===');
  console.log('D16 (Male):', getCellVal('D16'));
  console.log('E16:', getCellVal('E16'));
  console.log('F16 (Female):', getCellVal('F16'));
  console.log('G16:', getCellVal('G16'));
  console.log('P16:', getCellVal('P16'));

  console.log('\n=== CIVIL STATUS ===');
  console.log('P10 (Single):', getCellVal('P10'));
  console.log('P11 (Married):', getCellVal('P11'));
  console.log('P12 (Widowed):', getCellVal('P12'));
  console.log('P13 (Separated):', getCellVal('P13'));
  console.log('P15 (Solo Parent):', getCellVal('P15'));
  console.log('P16 (Others):', getCellVal('P16'));

  console.log('\n=== CITIZENSHIP ===');
  console.log('G13 (Filipino):', getCellVal('G13'));
  console.log('G15 (Dual):', getCellVal('G15'));

  console.log('\n=== EMAIL ===');
  console.log('I34:', getCellVal('I34'));
  console.log('I34 type:', typeof sheet.getCell('I34').value);
  console.log('I34 raw:', JSON.stringify(sheet.getCell('I34').value));
}

checkCells();
