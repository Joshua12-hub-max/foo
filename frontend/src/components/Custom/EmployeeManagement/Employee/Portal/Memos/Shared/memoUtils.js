
import { STATUS_BADGE_STYLES, PRIORITY_BADGE_STYLES } from '../Constants/memoConstants';

/**
 * Format date string to readable format
 * @param {string} dateStr - ISO date string
 * @returns {string} Formatted date or placeholder
 */
export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Get status badge CSS classes
 * @param {string} status - Memo status
 * @returns {string} CSS class string
 */
export const getStatusBadge = (status) => {
  return STATUS_BADGE_STYLES[status] || 'bg-gray-100 text-gray-700';
};

/**
 * Get priority badge CSS classes
 * @param {string} priority - Memo priority
 * @returns {string} CSS class string
 */
export const getPriorityBadge = (priority) => {
  return PRIORITY_BADGE_STYLES[priority] || 'bg-gray-100 text-gray-600';
};

/**
 * Get employee status badge for employee memo view
 * Uses acknowledgment status rather than memo status
 * @param {object} memo - Memo object
 * @returns {string} CSS class string
 */
export const getEmployeeStatusBadge = (memo) => {
  if (memo.acknowledged_at) {
    return 'bg-green-100 text-green-700';
  }
  if (memo.acknowledgment_required) {
    return 'bg-yellow-100 text-yellow-700';
  }
  return 'bg-blue-100 text-blue-700';
};

/**
 * Get employee status text
 * @param {object} memo - Memo object
 * @returns {string} Status text
 */
export const getEmployeeStatusText = (memo) => {
  if (memo.acknowledged_at) return 'Acknowledged';
  if (memo.acknowledgment_required) return 'Pending Acknowledgment';
  return memo.status;
};
