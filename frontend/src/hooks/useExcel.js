import { useState, useCallback, useRef } from 'react';
import {
  getExcelInstance,
  isExcelLibraryLoaded,
  EXCEL_STYLES,
  downloadWorkbook,
  applyHeaderStyle,
  applyBorders
} from '@/Service/ExcelExport.service';

/**
 * useExcel Hook - Dynamic Import Hook for Excel exports
 * 
 * Manages the lifecycle of the large ExcelJS chunk:
 * - State Management: isLoadingLibrary, isProcessing, error
 * - Memory Management: Session caching (load once, reuse)
 * - Error Handling: Graceful failures without app crash
 * 
 * @example
 * const { exportToExcel, isLoading, error } = useExcel();
 * 
 * const handleExport = async () => {
 *   await exportToExcel({
 *     data: myData,
 *     columns: [{ header: 'Name', key: 'name', width: 20 }],
 *     filename: 'MyReport',
 *     title: 'My Report Title'
 *   });
 * };
 */
export const useExcel = () => {
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  
  // Track if library is ready
  const libraryReadyRef = useRef(isExcelLibraryLoaded());

  /**
   * Combined loading state (library loading OR data processing)
   */
  const isLoading = isLoadingLibrary || isProcessing;

  /**
   * Preload the Excel library (optional - for background loading)
   */
  const preloadLibrary = useCallback(async () => {
    if (libraryReadyRef.current) return;

    try {
      setIsLoadingLibrary(true);
      setError(null);
      await getExcelInstance();
      libraryReadyRef.current = true;
    } catch (err) {
      setError(err.message || 'Failed to preload Excel library');
    } finally {
      setIsLoadingLibrary(false);
    }
  }, []);

  /**
   * Export data to Excel with professional formatting
   * @param {Object} options - Export options
   * @param {Array} options.data - Data to export
   * @param {Array} options.columns - Column definitions [{header, key, width}]
   * @param {string} options.filename - Filename without extension
   * @param {string} [options.sheetName='Sheet1'] - Sheet name
   * @param {string} [options.title] - Optional title row
   * @param {string} [options.subtitle] - Optional subtitle
   */
  const exportToExcel = useCallback(async (options) => {
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
      setError(null);

      // Step 1: Load library if not cached
      if (!libraryReadyRef.current) {
        setIsLoadingLibrary(true);
      }

      const ExcelJS = await getExcelInstance();
      libraryReadyRef.current = true;
      setIsLoadingLibrary(false);

      // Step 2: Process data
      setIsProcessing(true);

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
        worksheet.getRow(currentRow).font = EXCEL_STYLES.title.font;
        worksheet.mergeCells(currentRow, 1, currentRow, columns.length);
        currentRow++;
      }

      // Add subtitle if provided
      if (subtitle) {
        worksheet.addRow([subtitle]);
        worksheet.getRow(currentRow).font = EXCEL_STYLES.subtitle.font;
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
      applyHeaderStyle(worksheet.getRow(currentRow));
      currentRow++;

      // Add data rows
      if (data && Array.isArray(data)) {
        data.forEach((item, index) => {
          const rowData = columns.map(col => {
            const value = item[col.key];
            if (col.formatter && typeof col.formatter === 'function') {
              return col.formatter(value, item);
            }
            return value !== undefined && value !== null ? value : '-';
          });

          const row = worksheet.addRow(rowData);

          // Alternate row colors
          if (index % 2 === 1) {
            row.fill = EXCEL_STYLES.alternateRow.fill;
          }

          row.alignment = { vertical: 'middle' };
          currentRow++;
        });
      }

      // Add borders
      const dataStartRow = title || subtitle ? 4 : 1;
      applyBorders(worksheet, dataStartRow, currentRow - 1, 1, columns.length);

      // Step 3: Download
      await downloadWorkbook(workbook, filename);

      setIsProcessing(false);
      return true;
    } catch (err) {
      console.error('Excel export failed:', err);
      setError(err.message || 'Excel export failed');
      setIsLoadingLibrary(false);
      setIsProcessing(false);
      return false;
    }
  }, []);

  /**
   * Clear any error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    isLoading,
    isLoadingLibrary,
    isProcessing,
    error,
    isLibraryReady: libraryReadyRef.current,

    // Actions
    exportToExcel,
    preloadLibrary,
    clearError
  };
};

export default useExcel;
