export const ITEMS_PER_PAGE = 10;

export const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Approved', label: 'Approved' },
  { value: 'Rejected', label: 'Rejected' }
];

export const TABLE_HEADERS = ['Date', 'Time In', 'Time Out', 'Corrected Time', 'Reason', 'Status', 'Actions'];

export const EXPORT_HEADERS = ['Date', 'Time In', 'Time Out', 'Corrected Time', 'Status'];

export const MESSAGES = {
  FILTERS_APPLIED: 'Filters applied successfully!',
  FILTERS_CLEARED: 'Filters cleared successfully!',
  DATA_REFRESHED: 'Data refreshed successfully!',
  CSV_EXPORTED: 'CSV exported successfully!',
  PDF_EXPORTED: 'PDF print dialog opened!',
  CORRECTION_UPDATED: 'DTR correction updated successfully!',
  ERROR_LOAD: 'Failed to load corrections. Please try again.',
  ERROR_UPDATE: 'Failed to update correction. Please try again.',
  ERROR_EXPORT_CSV: 'CSV Export failed',
  ERROR_EXPORT_PDF: 'PDF Export failed',
  ERROR_NO_DATA: 'No data available to export.'
};

export const DELAYS = {
  ERROR_DISMISS: 5000,
  SUCCESS_DISMISS: 3000,
  SEARCH_DEBOUNCE: 300,
  EXPORT_DELAY: 100,
  PDF_PRINT_DELAY: 250
};
