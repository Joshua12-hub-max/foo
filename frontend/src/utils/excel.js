/**
 * Centralized Excel Helper
 * 
 * Uses static import of ExcelJS for reliable bundling with Vite.
 * All Excel exports should use this helper.
 */
import ExcelJS from 'exceljs';

/**
 * Create a new Excel workbook
 * @returns {ExcelJS.Workbook}
 */
export const createWorkbook = () => {
  return new ExcelJS.Workbook();
};

/**
 * Download workbook as Excel file
 * @param {ExcelJS.Workbook} workbook 
 * @param {string} filename - Filename without extension
 */
export const downloadExcel = async (workbook, filename) => {
  try {
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${filename}_${Date.now()}.xlsx`;
    anchor.click();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Excel download failed:', error);
    throw error;
  }
};

// Common styles for Excel exports
export const EXCEL_STYLES = {
  header: {
    font: { bold: true, color: { argb: 'FFFFFFFF' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } }
  },
  title: {
    font: { bold: true, size: 14 }
  },
  subtitle: {
    font: { size: 11, italic: true }
  }
};

/**
 * Apply header style to a row
 * @param {ExcelJS.Row} row 
 */
export const applyHeaderStyle = (row) => {
  row.font = EXCEL_STYLES.header.font;
  row.fill = EXCEL_STYLES.header.fill;
  row.alignment = { vertical: 'middle' };
};
