export const ITEMS_PER_PAGE = 10;

export const TABLE_HEADERS = [
  'Status',
  'Department',
  'Employee ID',
  'Employee Name',
  'Date',
  'Time Out',
  'Reason',
  'Actions'
];

export const EXPORT_HEADERS = [
  'Status',
  'Department',
  'Employee ID',
  'Employee Name',
  'Date',
  'Time Out',
  'Reason'
];

export const MESSAGES = {
  FILTERS_APPLIED: 'Filters applied successfully!',
  FILTERS_CLEARED: 'Filters cleared successfully!',
  DATA_REFRESHED: 'Data refreshed successfully!',
  CSV_EXPORTED: 'CSV exported successfully!',
  PDF_EXPORTED: 'PDF print dialog opened!',
  ERROR_LOAD: 'Failed to load undertime requests. Please try again.',
  ERROR_REFRESH: 'Failed to refresh data. Please try again.',
  ERROR_EXPORT_CSV: 'CSV Export failed',
  ERROR_EXPORT_PDF: 'PDF Export failed',
  ERROR_NO_DATA: 'No data available to export.',
  ERROR_APPROVE: 'Failed to approve request. Please try again.',
  ERROR_REJECT: 'Failed to reject request. Please try again.',
  SUCCESS_APPROVE: 'Request approved successfully!',
  SUCCESS_REJECT: 'Request rejected successfully!'
};

export const DELAYS = {
  ERROR_DISMISS: 5000,
  SUCCESS_DISMISS: 3000,
  SEARCH_DEBOUNCE: 300,
  EXPORT_DELAY: 100,
  PDF_PRINT_DELAY: 250
};

export const STATUS_STYLES = {
  Pending: 'bg-yellow-100 text-yellow-800',
  Approved: 'bg-green-100 text-green-800',
  Rejected: 'bg-red-100 text-red-800'
};
