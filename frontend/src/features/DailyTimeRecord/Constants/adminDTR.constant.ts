export const ITEMS_PER_PAGE = 10;

// Type-safe column configuration for DTR table
export interface TableColumn {
  header: string;
  key: 'status' | 'employeeId' | 'name' | 'duties' | 'date' | 'timeIn' | 'timeOut' | 'lateMinutes' | 'undertimeMinutes' | 'hoursWorked' | 'remarks';
  align?: 'left' | 'center' | 'right';
}

export const TABLE_COLUMNS: readonly TableColumn[] = [
  { header: 'Status', key: 'status', align: 'left' },
  { header: 'Employee ID', key: 'employeeId', align: 'left' },
  { header: 'Employee Name', key: 'name', align: 'left' },
  { header: 'Duties', key: 'duties', align: 'center' },
  { header: 'Date', key: 'date', align: 'center' },
  { header: 'Time In', key: 'timeIn', align: 'center' },
  { header: 'Time Out', key: 'timeOut', align: 'center' },
  { header: 'Late', key: 'lateMinutes', align: 'center' },
  { header: 'UT', key: 'undertimeMinutes', align: 'center' },
  { header: 'Hours', key: 'hoursWorked', align: 'center' }
] as const;

// Derived headers for backward compatibility
export const TABLE_HEADERS = TABLE_COLUMNS.map(col => col.header);

export const MESSAGES = {
  FILTERS_APPLIED: 'Filters applied successfully!',
  FILTERS_CLEARED: 'Filters cleared successfully!',
  DATA_REFRESHED: 'Data refreshed successfully!',
  ERROR_LOAD: 'Failed to load DTR records. Please try again.',
  ERROR_REFRESH: 'Failed to refresh data. Please try again.',
  ERROR_NO_DATA: 'No data available.'
} as const;

export const DELAYS = {
  ERROR_DISMISS: 5000,
  SUCCESS_DISMISS: 3000,
  SEARCH_DEBOUNCE: 300,
} as const;

export const STATUS_STYLES: Record<string, string> = {
  Present: 'bg-green-100 text-green-800',
  Absent: 'bg-red-100 text-red-800',
  Late: 'bg-yellow-100 text-yellow-800',
  Leave: 'bg-blue-100 text-blue-800',
  Holiday: 'bg-purple-100 text-purple-800',
  Pending: 'bg-blue-100 text-blue-800'
};
