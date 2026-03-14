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
  return 'bg-gray-50 text-gray-500 border border-gray-100 uppercase text-[10px] font-bold tracking-wider';
};

/**
 * Get priority badge CSS classes
 * @param priority - Memo priority
 * @returns CSS class string
 */
export const getPriorityBadge = (priority: string): string => {
  return 'bg-gray-50 text-gray-400 border border-gray-100 uppercase text-[10px] font-bold tracking-wider';
};

/**
 *
 * @param memo - Memo object
 * @returns CSS class string
 */
export const getEmployeeStatusBadge = (memo: Memo): string => {
  return 'bg-gray-50 text-gray-500 border border-gray-100 uppercase text-[10px] font-bold tracking-wider';
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
