export const ITEMS_PER_PAGE = 10;

export const TABS = {EMPLOYEE: "employee"};

export const TABLE_HEADERS = ["Department", "Employee ID",  "Employee Name",  "Date",  "Time In", "Time Out", "Corrected Time", "Reason", "Status", "Actions"];

export const STATUS = { APPROVED: "Approved", PENDING: "Pending"};

export const MESSAGES = {
  FILTERS_APPLIED: "Filters applied successfully!",
  FILTERS_CLEARED: "Filters cleared successfully!",
  RECORD_APPROVED: "Record approved successfully!",
  RECORD_REJECTED: "Record rejected successfully!",
  RECORD_DELETED: "Record deleted successfully!",
  RECORD_UPDATED: "Record updated successfully!",
  DATA_REFRESHED: "Data refreshed successfully!",
  ERROR_APPROVE: "Failed to approve record. Please try again.",
  ERROR_REJECT: "Failed to reject crecord. Please try again.",
  ERROR_DELETE: "Failed to delete record. Please try again.",
  ERROR_UPDATE: "Failed to update record. Please try again.",
  ERROR_REFRESH: "Failed to refresh data. Please try again."
};

export const DELAYS = {TAB_CHANGE: 300, APPROVE: 800, DELETE: 600, UPDATE: 800, REFRESH: 1000, ERROR_DISMISS: 5000, SUCCESS_DISMISS: 3000};