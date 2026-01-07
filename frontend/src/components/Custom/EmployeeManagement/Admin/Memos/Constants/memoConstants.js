/**
 * Memo Constants
 * Centralized constants for employee memo management
 */

// Memo type options - must match database ENUM
export const MEMO_TYPES = [
  { value: 'Verbal Warning', label: 'Verbal Warning' },
  { value: 'Written Warning', label: 'Written Warning' },
  { value: 'Suspension Notice', label: 'Suspension Notice' },
  { value: 'Termination Notice', label: 'Termination Notice' },
  { value: 'Show Cause', label: 'Show Cause' }
];

// Priority levels
export const MEMO_PRIORITIES = [
  { value: 'Low', label: 'Low' },
  { value: 'Normal', label: 'Normal' },
  { value: 'High', label: 'High' },
  { value: 'Urgent', label: 'Urgent' }
];

// Memo status options
export const MEMO_STATUSES = [
  { value: 'Draft', label: 'Draft' },
  { value: 'Sent', label: 'Sent' },
  { value: 'Acknowledged', label: 'Acknowledged' },
  { value: 'Reverted', label: 'Reverted' },
  { value: 'Archived', label: 'Archived' }
];

// Status badge styles
export const STATUS_BADGE_STYLES = {
  Draft: 'bg-gray-100 text-gray-700',
  Sent: 'bg-blue-100 text-blue-700',
  Acknowledged: 'bg-green-100 text-green-700',
  Reverted: 'bg-purple-100 text-purple-700',
  Archived: 'bg-yellow-100 text-yellow-700'
};

// Priority badge styles
export const PRIORITY_BADGE_STYLES = {
  Low: 'bg-gray-100 text-gray-600',
  Normal: 'bg-blue-100 text-blue-600',
  High: 'bg-orange-100 text-orange-600',
  Urgent: 'bg-red-100 text-red-600'
};

// Initial form data for creating new memos
export const INITIAL_FORM_DATA = {
  employee_id: '',
  memo_type: 'Written Warning',
  subject: '',
  content: '',
  priority: 'Normal',
  effective_date: '',
  acknowledgment_required: false,
  status: 'Draft'
};

// Initial filter state
export const INITIAL_FILTERS = {
  memo_type: '',
  status: '',
  search: ''
};
