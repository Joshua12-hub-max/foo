/**
 * Performance Evaluation Constants
 * Centralized configuration for performance management module
 */

import { UI_COLORS, STATUS_GREEN, STATUS_AMBER, STATUS_RED, SLATE_BLUE, DEEP_NAVY } from '../../../../utils/colorPalette';

// CSC Rating Scale (Civil Service Commission MC 6-2012)
export const CSC_RATING_SCALE = [
  { value: 5, label: 'Outstanding', description: 'Performance represents an extraordinary level of achievement' },
  { value: 4, label: 'Very Satisfactory', description: 'Performance exceeded expectations' },
  { value: 3, label: 'Satisfactory', description: 'Performance met expectations' },
  { value: 2, label: 'Unsatisfactory', description: 'Performance failed to meet expectations' },
  { value: 1, label: 'Poor', description: 'Performance was consistently below expectations' }
];

// Review Status Options
export const REVIEW_STATUSES = {
  DRAFT: 'Draft',
  SELF_RATED: 'Self-Rated',
  SUBMITTED: 'Submitted',
  ACKNOWLEDGED: 'Acknowledged',
  APPROVED: 'Approved',
  FINALIZED: 'Finalized'
};

// Status color configurations for badges
export const STATUS_COLORS = {
  Draft: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Self-Rated': 'bg-purple-100 text-purple-800 border-purple-200',
  Submitted: 'bg-blue-100 text-blue-800 border-blue-200',
  Acknowledged: 'bg-green-100 text-green-800 border-green-200',
  Approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Finalized: 'bg-green-100 text-green-800 border-green-200',
  default: 'bg-gray-100 text-gray-600 border-gray-200'
};

// Get status color helper
export const getStatusColor = (status) => {
  return STATUS_COLORS[status] || STATUS_COLORS.default;
};

// Get adjectival rating from numerical score
export const getAdjectivalRating = (score) => {
  const numScore = parseFloat(score);
  if (numScore >= 4.5) return { rating: 'Outstanding', color: 'text-green-600' };
  if (numScore >= 3.5) return { rating: 'Very Satisfactory', color: 'text-blue-600' };
  if (numScore >= 2.5) return { rating: 'Satisfactory', color: 'text-gray-600' };
  if (numScore >= 1.5) return { rating: 'Unsatisfactory', color: 'text-orange-600' };
  return { rating: 'Poor', color: 'text-red-600' };
};

// Initial form state for reviews
export const INITIAL_REVIEW_FORM = {
  employee_id: '',
  review_cycle_id: '',
  reviewer_id: '',
  status: 'Draft',
  items: [],
  strengths: '',
  improvements: '',
  goals: '',
  additional_comments: ''
};

// Tab configurations
export const REVIEW_TABS = [
  { id: 'pending', label: 'Pending', filter: ['Draft', 'Self-Rated', 'Submitted'] },
  { id: 'completed', label: 'Completed', filter: ['Acknowledged', 'Approved', 'Finalized'] }
];

// Score color helper for criteria items
export const getScoreColor = (score) => {
  const numScore = parseInt(score);
  if (numScore >= 4) return 'bg-green-100 text-green-700 border-green-200';
  if (numScore >= 3) return 'bg-blue-100 text-blue-700 border-blue-200';
  return 'bg-red-100 text-red-700 border-red-200';
};
