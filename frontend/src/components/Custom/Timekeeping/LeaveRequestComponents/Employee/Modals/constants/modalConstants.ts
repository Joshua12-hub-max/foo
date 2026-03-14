import { LEAVE_TYPES as CENTRAL_LEAVE_TYPES, SPECIAL_LEAVES_NO_DEDUCTION as CENTRAL_SPECIAL_LEAVES, CROSS_CHARGE_MAP as CENTRAL_CROSS_CHARGE, LEAVE_TO_CREDIT_MAP as CENTRAL_LEAVE_TO_CREDIT } from '@/types/leave.types';

export const LEAVE_TYPES = CENTRAL_LEAVE_TYPES;

export type ModalLeaveType = typeof LEAVE_TYPES[number];

// CSC Special Leaves - These DO NOT deduct from VL/SL credits
export const SPECIAL_LEAVES_NO_DEDUCTION = CENTRAL_SPECIAL_LEAVES;

// CSC Cross-Charging Rules: SL can use VL when SL exhausted, VL cannot use SL
export const CROSS_CHARGE_MAP = CENTRAL_CROSS_CHARGE;

// Map leave types to their credit type for display
export const LEAVE_TO_CREDIT_MAP = CENTRAL_LEAVE_TO_CREDIT;

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
