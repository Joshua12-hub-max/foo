export const ITEMS_PER_PAGE = 6 as const;

export const MESSAGES = {
  SUCCESS_ADD: 'Biometric added successfully',
  SUCCESS_UPDATE: 'Biometric updated successfully',
  SUCCESS_DELETE: 'Biometric deleted successfully',
  SUCCESS_REFRESH: 'Data refreshed successfully',
  ERROR_SAVE: 'Failed to save biometrics data',
  ERROR_REFRESH: 'Failed to refresh data',
  CONFIRM_DELETE: 'Are you sure you want to delete this biometric entry?',
} as const;

export const DELAYS = {
  NOTIFICATION_DISMISS: 3000,
} as const;

export type MessageKey = keyof typeof MESSAGES;
