export const ITEMS_PER_PAGE = 10;

// Type-safe column configuration for DTR table
export interface TableColumn {
  header: string;
  key: 'status' | 'employeeId' | 'name' | 'department' | 'date' | 'timeIn' | 'timeOut' | 'hoursWorked' | 'remarks';
  align?: 'left' | 'center' | 'right';
}

export const TABLE_COLUMNS: readonly TableColumn[] = [
  { header: 'Status', key: 'status', align: 'left' },
  { header: 'Employee ID', key: 'employeeId', align: 'left' },
  { header: 'Employee Name', key: 'name', align: 'left' },
  { header: 'Department', key: 'department', align: 'left' },
  { header: 'Date', key: 'date', align: 'center' },
  { header: 'Time In', key: 'timeIn', align: 'center' },
  { header: 'Time Out', key: 'timeOut', align: 'center' },
  { header: 'Hours Worked', key: 'hoursWorked', align: 'center' }
] as const;

// Derived headers for backward compatibility
export const TABLE_HEADERS = TABLE_COLUMNS.map(col => col.header);

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
} as const;

export const DELAYS = {
  ERROR_DISMISS: 5000,
  SUCCESS_DISMISS: 3000,
  SEARCH_DEBOUNCE: 300,
  EXPORT_DELAY: 100,
  PDF_PRINT_DELAY: 250
} as const;

export const STATUS_STYLES: Record<string, string> = {
  Present: 'bg-green-100 text-green-800',
  Absent: 'bg-red-100 text-red-800',
  Late: 'bg-yellow-100 text-yellow-800',
  Leave: 'bg-blue-100 text-blue-800',
  Holiday: 'bg-purple-100 text-purple-800'
};
