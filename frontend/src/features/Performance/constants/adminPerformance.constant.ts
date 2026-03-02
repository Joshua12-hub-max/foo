export const ITEMS_PER_PAGE = 10;
export const TABLE_HEADERS = [
  'Status',
  'Employee ID',
  'Employee Name',
  'Duties',
  'Department',
  'Position Title',
  'Last Evaluation',
  'Score'
];

export const EXPORT_HEADERS = TABLE_HEADERS;

export const MESSAGES = {
  FILTERS_APPLIED: 'Filters applied successfully!',
  FILTERS_CLEARED: 'Filters cleared successfully!',
  DATA_REFRESHED: 'Data refreshed successfully!',
  CSV_EXPORTED: 'CSV exported successfully!',
  PDF_EXPORTED: 'PDF print dialog opened!',
  ERROR_LOAD: 'Failed to load Performance records. Please try again.',
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

export const STATUS_STYLES: Record<string, string> = {
  'Finalized': 'bg-slate-900 text-white shadow-sm font-bold',
  'Approved': 'bg-slate-700 text-white font-bold',
  'Acknowledged': 'bg-slate-500 text-white font-bold',
  'Submitted': 'bg-slate-100 text-slate-700 border border-slate-200 font-bold',
  'Draft': 'bg-slate-50 text-slate-500 border border-slate-100 font-bold',
  'Self-Rated': 'bg-slate-200 text-slate-800 font-bold',
  'Not Started': 'bg-red-50 text-red-600 border border-red-100 font-bold',
  'Overdue': 'bg-red-600 text-white shadow-sm font-bold'
};
