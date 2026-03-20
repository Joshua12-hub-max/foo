export const ITEMS_PER_PAGE = 10;

export const TABLE_HEADERS = [
  'Status',
  'Employee ID',
  'Department',
  'Duties',
  'Shift',
  'Date',
  'Time In',
  'Time Out',
  'Late (m)',
  'UT (m)',
  'Hours Worked'
];

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
