/**
 * ExcelExport Service - Isolated Service Wrapper
 * 
 * This service acts as the "Gatekeeper" for Excel generation.
 * 100% of the logic is contained here, but ZERO code is loaded
 * until a function is actually invoked (on-demand loading).
 * 
 * Features:
 * - Session caching: ExcelJS loaded once, reused across exports
 * - Memory cleanup: URL.revokeObjectURL after download
 * - Error boundaries: Graceful failure without app crash
 */

// Session cache for the ExcelJS library instance
let excelJSInstance = null;
let loadingPromise = null;

/**
 * Get the ExcelJS library instance (lazy loaded, session cached)
 * @returns {Promise<typeof import('exceljs')>}
 */
export const getExcelInstance = async () => {
  try {
    // Return cached instance if available
    if (excelJSInstance) {
      return excelJSInstance;
    }

    // If already loading, wait for that promise
    if (loadingPromise) {
      return loadingPromise;
    }

    // Start loading and cache the promise
    loadingPromise = import('exceljs').then((module) => {
      excelJSInstance = module;
      loadingPromise = null;
      return module;
    });

    return loadingPromise;
  } catch (error) {
    loadingPromise = null;
    console.error('Failed to load ExcelJS library:', error);
    throw new Error('Excel library failed to load. Please check your network connection.');
  }
};

/**
 * Check if ExcelJS is already loaded in session
 * @returns {boolean}
 */
export const isExcelLibraryLoaded = () => {
  return excelJSInstance !== null;
};

/**
 * Clear the cached ExcelJS instance (for memory management if needed)
 */
export const clearExcelCache = () => {
  excelJSInstance = null;
  loadingPromise = null;
};

/**
 * Default style configurations for consistent Excel exports
 */
export const EXCEL_STYLES = {
  header: {
    font: { bold: true, color: { argb: 'FFFFFFFF' } },
    fill: {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' } // Navy blue
    },
    alignment: { vertical: 'middle', horizontal: 'center' },
    height: 24
  },
  title: {
    font: { bold: true, size: 16 }
  },
  subtitle: {
    font: { italic: true, size: 11, color: { argb: 'FF666666' } }
  },
  subtotal: {
    font: { bold: true },
    fill: {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF1F5F9' } // Light gray
    }
  },
  grandTotal: {
    font: { bold: true },
    fill: {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFCBD5E1' } // Darker gray
    }
  },
  alternateRow: {
    fill: {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF8FAFC' } // Very light gray
    }
  },
  border: {
    top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
  }
};

/**
 * Create and download an Excel file
 * @param {Object} workbook - ExcelJS Workbook instance
 * @param {string} filename - Filename without extension
 */
export const downloadWorkbook = async (workbook, filename) => {
  try {
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${filename}_${new Date().getTime()}.xlsx`;
    anchor.click();

    // Memory cleanup - prevent memory leaks
    window.URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error('Failed to download workbook:', error);
    throw new Error('Failed to download Excel file.');
  }
};

/**
 * Apply standard header styling to a row
 * @param {Object} row - ExcelJS Row
 */
export const applyHeaderStyle = (row) => {
  row.font = EXCEL_STYLES.header.font;
  row.fill = EXCEL_STYLES.header.fill;
  row.alignment = EXCEL_STYLES.header.alignment;
  row.height = EXCEL_STYLES.header.height;
};

/**
 * Apply borders to a cell range
 * @param {Object} worksheet - ExcelJS Worksheet
 * @param {number} startRow - First row
 * @param {number} endRow - Last row
 * @param {number} startCol - First column
 * @param {number} endCol - Last column
 */
export const applyBorders = (worksheet, startRow, endRow, startCol, endCol) => {
  for (let r = startRow; r <= endRow; r++) {
    for (let c = startCol; c <= endCol; c++) {
      const cell = worksheet.getCell(r, c);
      cell.border = EXCEL_STYLES.border;
    }
  }
};
