export const ITEMS_PER_PAGE = 10;

export const TABLE_HEADERS = [
  'Date',
  'Time In',
  'Time Out',
  'Hours Worked',
  'Status',
  'Remarks'
];

export const EXPORT_HEADERS = TABLE_HEADERS;

export const MESSAGES = {
  FILTERS_APPLIED: 'Filters applied successfully!',
  FILTERS_CLEARED: 'Filters cleared successfully!',
  DATA_REFRESHED: 'Data refreshed successfully!',
  CSV_EXPORTED: 'CSV exported successfully!',
  PDF_EXPORTED: 'PDF print dialog opened!',
  ERROR_LOAD: 'Failed to load DTR records. Please try again.',
  ERROR_REFRESH: 'Failed to refresh data. Please try again.',
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

export const STATUS_STYLES = {
  Present: 'bg-green-100 text-green-800',
  Absent: 'bg-red-100 text-red-800',
  Late: 'bg-yellow-100 text-yellow-800',
  Leave: 'bg-blue-100 text-blue-800',
  Holiday: 'bg-purple-100 text-purple-800'
};
