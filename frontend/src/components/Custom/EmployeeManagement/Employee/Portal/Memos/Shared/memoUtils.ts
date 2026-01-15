import { STATUS_BADGE_STYLES, PRIORITY_BADGE_STYLES } from '../Constants/memoConstants';

export interface Memo {
  id: number;
  memo_number: string;
  memo_type: string;
  subject: string;
  content: string;
  priority: string;
  status: string;
  created_at: string;
  acknowledged_at?: string;
  acknowledgment_required?: boolean;
}

/**
 * Format date string to readable format
 * @param dateStr - ISO date string
 * @returns Formatted date or placeholder
 */
export const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Get status badge CSS classes
 * @param status - Memo status
 * @returns CSS class string
 */
export const getStatusBadge = (status: string): string => {
  return STATUS_BADGE_STYLES[status] || 'bg-gray-100 text-gray-700';
};

/**
 * Get priority badge CSS classes
 * @param priority - Memo priority
 * @returns CSS class string
 */
export const getPriorityBadge = (priority: string): string => {
  return PRIORITY_BADGE_STYLES[priority] || 'bg-gray-100 text-gray-600';
};

/**
 * Get employee status badge for employee memo view
 * Uses acknowledgment status rather than memo status
 * @param memo - Memo object
 * @returns CSS class string
 */
export const getEmployeeStatusBadge = (memo: Memo): string => {
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
 * @param memo - Memo object
 * @returns Status text
 */
export const getEmployeeStatusText = (memo: Memo): string => {
  if (memo.acknowledged_at) return 'Acknowledged';
  if (memo.acknowledgment_required) return 'Pending Acknowledgment';
  return memo.status;
};
