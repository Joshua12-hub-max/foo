export const DEFAULT_FILTERS = {
  department: 'all',
  status: 'all',
};

export const DETAIL_FILTERS_DEFAULT = {
  status: 'all',
  search: '',
  page: 1,
  limit: 20
};

export const NOTIFICATION_DURATION = 3000;

export const EXPORT_FILENAMES = {
  EXCEL: (dateRange) => `department_attendance_${dateRange}`,
  PDF: (dateRange) => `department_attendance_${dateRange}`,
};

export const STATUS_LABELS = {
  ALL: 'all',
  PRESENT: 'Present',
  ABSENT: 'Absent',
  LATE: 'Late',
  LEAVE: 'Leave',
};
