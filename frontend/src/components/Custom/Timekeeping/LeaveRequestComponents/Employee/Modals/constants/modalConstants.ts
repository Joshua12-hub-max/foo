export const LEAVE_TYPES = [
  'Vacation Leave',
  'Sick Leave',
  'Maternity Leave',
  'Paternity Leave',
  'Solo Parent Leave',
  'Special Leave Benefits for Women',
  'Special Emergency Leave',
  'Rehabilitation Leave',
  'Study Leave',
  'VAWC Leave',
  'Special Privilege Leave',
  'Wellness Leave',           // CSC 2025/2026 Memo - 5 days
  'Forced/Mandatory Leave',
  'Official Business',
  'Other'
] as const;

export type ModalLeaveType = typeof LEAVE_TYPES[number];

// CSC Special Leaves - These DO NOT deduct from VL/SL credits
export const SPECIAL_LEAVES_NO_DEDUCTION = [
  'Special Privilege Leave',      // 3 days/year (SLP)
  'Special Emergency Leave',      // 5 days (calamity)
  'Wellness Leave',               // 5 days (2025/2026 CSC Memo)
  'Official Business',            // No credit deduction
  'Study Leave',                  // CSC-approved, separate allocation
  'VAWC Leave',                   // Violence Against Women and Children
  'Rehabilitation Leave',         // Separate allocation
  'Maternity Leave',              // 105/60 days, separate
  'Paternity Leave',              // 7 days, separate
  'Solo Parent Leave',            // 7 days, separate
  'Special Leave Benefits for Women' // 60 days (gynecological disorders)
] as const;

// CSC Cross-Charging Rules: SL can use VL when SL exhausted, VL cannot use SL
export const CROSS_CHARGE_MAP: Record<string, string | null> = {
  'Sick Leave': 'Vacation Leave',      // SL can fallback to VL
  'Vacation Leave': null,               // VL cannot use SL
  'Forced/Mandatory Leave': 'Vacation Leave' // Deducted from VL
};

// Map leave types to their credit type for display
export const LEAVE_TO_CREDIT_MAP: Record<string, string | null> = {
  'Vacation Leave': 'Vacation Leave',
  'Sick Leave': 'Sick Leave',
  'Special Privilege Leave': 'Special Privilege Leave',
  'Special Emergency Leave': null,
  'Wellness Leave': null,
  'Official Business': null,
  'Forced/Mandatory Leave': 'Vacation Leave',
  'Maternity Leave': 'Maternity Leave',
  'Paternity Leave': 'Paternity Leave',
  'Solo Parent Leave': 'Solo Parent Leave'
};

export const FILE_CONFIG = {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ],
  allowedExtensions: '.pdf'
} as const;
