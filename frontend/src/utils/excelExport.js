/**
 * Centralized Excel Export Utility
 * 
 * Uses ExcelJS with dynamic import via ExcelExport.service.js.
 * Library is loaded on-demand and cached for session reuse.
 * 
 * @example
 * // From any module:
 * import { exportToExcel } from '@/utils/excelExport';
 * 
 * exportToExcel({
 *   data: myData,
 *   columns: [
 *     { header: 'Employee Name', key: 'name', width: 25 },
 *     { header: 'Date', key: 'date', width: 15 },
 *   ],
 *   filename: 'MyReport',
 *   sheetName: 'Data',
 *   title: 'My Report Title',
 *   subtitle: 'Period: Jan 2024'
 * });
 */

import {
  getExcelInstance,
  EXCEL_STYLES,
  downloadWorkbook,
  applyHeaderStyle,
  applyBorders
} from '@/Service/ExcelExport.service';

/**
 * Export data to Excel with professional formatting
 * @param {Object} options - Export options
 * @param {Array} options.data - Array of objects to export
 * @param {Array} options.columns - Column definitions [{header, key, width}]
 * @param {string} options.filename - Output filename (without extension)
 * @param {string} [options.sheetName='Sheet1'] - Excel sheet name
 * @param {string} [options.title] - Optional title row
 * @param {string} [options.subtitle] - Optional subtitle row
 * @param {Object} [options.styles] - Optional custom styles
 */
export const exportToExcel = async (options) => {
  const {
    data,
    columns,
    filename,
    sheetName = 'Sheet1',
    title,
    subtitle,
    styles = {}
  } = options;

  try {
    // Get cached ExcelJS instance from service (on-demand loaded)
    const ExcelJS = await getExcelInstance();
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    // Set up columns
    worksheet.columns = columns.map(col => ({
      header: '',
      key: col.key,
      width: col.width || 15
    }));

    let currentRow = 1;

    // Add title if provided
    if (title) {
      worksheet.addRow([title]);
      worksheet.getRow(currentRow).font = { bold: true, size: 16 };
      worksheet.mergeCells(currentRow, 1, currentRow, columns.length);
      currentRow++;
    }

    // Add subtitle if provided
    if (subtitle) {
      worksheet.addRow([subtitle]);
      worksheet.getRow(currentRow).font = { italic: true, size: 11, color: { argb: 'FF666666' } };
      worksheet.mergeCells(currentRow, 1, currentRow, columns.length);
      currentRow++;
    }

    // Add empty row after title/subtitle
    if (title || subtitle) {
      worksheet.addRow([]);
      currentRow++;
    }

    // Add header row
    const headers = columns.map(col => col.header);
    worksheet.addRow(headers);
    const headerRow = worksheet.getRow(currentRow);
    
    // Style header row with navy blue theme
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: styles.headerColor || 'FF1E293B' } // Navy blue default
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 24;
    currentRow++;

    // Add data rows
    if (data && Array.isArray(data)) {
      data.forEach((item, index) => {
        const rowData = columns.map(col => {
          const value = item[col.key];
          // Format value if formatter provided
          if (col.formatter && typeof col.formatter === 'function') {
            return col.formatter(value, item);
          }
          return value !== undefined && value !== null ? value : '-';
        });
        
        const row = worksheet.addRow(rowData);
        
        // Alternate row colors for readability
        if (index % 2 === 1) {
          row.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF8FAFC' } // Light gray
          };
        }
        
        // Apply alignment
        row.alignment = { vertical: 'middle' };
        currentRow++;
      });
    }

    // Add borders to all cells
    const lastRow = currentRow - 1;
    const lastCol = columns.length;
    const startDataRow = title || subtitle ? 4 : 1;
    
    for (let r = startDataRow; r <= lastRow; r++) {
      for (let c = 1; c <= lastCol; c++) {
        const cell = worksheet.getCell(r, c);
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        };
      }
    }

    // Generate and download file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${filename}_${new Date().getTime()}.xlsx`;
    anchor.click();
    window.URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error('Error generating Excel:', error);
    throw error;
  }
};

/**
 * Export data to Excel with grouped subtotals
 * For reports that need department/category grouping
 * @param {Object} options - Export options
 * @param {Array} options.groups - Array of groups with records and totals
 * @param {Array} options.columns - Column definitions
 * @param {string} options.filename - Output filename
 * @param {Object} [options.grandTotals] - Grand totals row
 */
export const exportToExcelWithGroups = async (options) => {
  const {
    groups,
    columns,
    filename,
    sheetName = 'Report',
    title,
    subtitle,
    grandTotals,
    groupLabelKey = 'label',
    recordsKey = 'records',
    totalsKey = 'totals'
  } = options;

  try {
    // Get cached ExcelJS instance from service (on-demand loaded)
    const ExcelJS = await getExcelInstance();
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    // Set up columns
    worksheet.columns = columns.map(col => ({
      header: '',
      key: col.key,
      width: col.width || 15
    }));

    let currentRow = 1;

    // Add title
    if (title) {
      worksheet.addRow([title]);
      worksheet.getRow(currentRow).font = { bold: true, size: 16 };
      worksheet.mergeCells(currentRow, 1, currentRow, columns.length);
      currentRow++;
    }

    // Add subtitle
    if (subtitle) {
      worksheet.addRow([subtitle]);
      worksheet.getRow(currentRow).font = { italic: true, size: 11 };
      worksheet.mergeCells(currentRow, 1, currentRow, columns.length);
      currentRow++;
    }

    if (title || subtitle) {
      worksheet.addRow([]);
      currentRow++;
    }

    // Add header row
    const headers = columns.map(col => col.header);
    worksheet.addRow(headers);
    const headerRow = worksheet.getRow(currentRow);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' }
    };
    currentRow++;

    // Add grouped data
    if (groups && Array.isArray(groups)) {
      groups.forEach(group => {
        // Add records
        const records = group[recordsKey] || [];
        records.forEach(item => {
          const rowData = columns.map(col => {
            const value = item[col.key];
            if (col.formatter) return col.formatter(value, item);
            return value !== undefined ? value : '-';
          });
          worksheet.addRow(rowData);
          currentRow++;
        });

        // Add subtotal row
        if (group[totalsKey]) {
          const totals = group[totalsKey];
          const subtotalData = columns.map(col => {
            if (col.key === columns[0].key) {
              return `${group[groupLabelKey] || 'Subtotal'} TOTALS`;
            }
            if (col.totalKey && totals[col.totalKey] !== undefined) {
              return totals[col.totalKey];
            }
            return '';
          });
          
          const subtotalRow = worksheet.addRow(subtotalData);
          subtotalRow.font = { bold: true };
          subtotalRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF1F5F9' }
          };
          currentRow++;
        }

        // Add gap between groups
        worksheet.addRow([]);
        currentRow++;
      });
    }

    // Add grand totals
    if (grandTotals) {
      const grandRow = worksheet.addRow(['GRAND TOTALS']);
      grandRow.font = { bold: true, size: 12 };
      worksheet.mergeCells(currentRow, 1, currentRow, columns.length);
      currentRow++;

      const totalData = columns.map(col => {
        if (col.grandTotalKey && grandTotals[col.grandTotalKey] !== undefined) {
          return grandTotals[col.grandTotalKey];
        }
        return '';
      });
      
      const totalRow = worksheet.addRow(totalData);
      totalRow.font = { bold: true };
      totalRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFCBD5E1' }
      };
    }

    // Generate and download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${filename}_${new Date().getTime()}.xlsx`;
    anchor.click();
    window.URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error('Error generating Excel:', error);
    throw error;
  }
};
