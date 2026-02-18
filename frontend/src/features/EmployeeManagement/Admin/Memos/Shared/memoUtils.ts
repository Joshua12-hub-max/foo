import { STATUS_BADGE_STYLES, PRIORITY_BADGE_STYLES } from '../Constants/memoConstants';

export interface Memo {
  id: number;
  memoNumber: string;
  memoType: string;
  subject: string;
  content: string;
  priority: string;
  status: string;
  createdAt: string;
  acknowledgedAt?: string;
  acknowledgmentRequired?: boolean;
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
  const normalizedStatus = Object.keys(STATUS_BADGE_STYLES).find(key => key.toLowerCase() === status.toLowerCase());
  return STATUS_BADGE_STYLES[normalizedStatus || ''] || 'bg-gray-100 text-gray-700';
};

/**
 * Get priority badge CSS classes
 * @param priority - Memo priority
 * @returns CSS class string
 */
export const getPriorityBadge = (priority: string): string => {
  const normalizedPriority = Object.keys(PRIORITY_BADGE_STYLES).find(key => key.toLowerCase() === priority.toLowerCase());
  return PRIORITY_BADGE_STYLES[normalizedPriority || ''] || 'bg-gray-100 text-gray-600';
};

/**
 *
 * @param memo - Memo object
 * @returns CSS class string
 */
export const getEmployeeStatusBadge = (memo: Memo): string => {
  if (memo.acknowledgedAt) {
    return 'bg-green-100 text-green-700';
  }
  if (memo.acknowledgmentRequired) {
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
  if (memo.acknowledgedAt) return 'Acknowledged';
  if (memo.acknowledgmentRequired) return 'Pending Acknowledgment';
  return memo.status;
};
