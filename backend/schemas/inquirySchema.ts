import { z } from 'zod';
import { STRICT_NAME_REGEX } from '../utils/spamUtils.js';

/**
 * Shared Validator for Names (Blocks symbolic characters)
 */
const nameValidator = (val: string) => {
  if (!val) return false;
  return STRICT_NAME_REGEX.test(val.trim());
};

const nameMsg = "Only letters, spaces, hyphens and dots are allowed. Avoid symbols and numbers.";

/**
 * Public Inquiry / Contact Form Schema
 */
export const inquirySchema = z.object({
  firstName: z.string()
    .min(1, 'First name is required')
    .max(100, 'First name is too long')
    .refine(nameValidator, nameMsg),
  lastName: z.string()
    .min(1, 'Last name is required')
    .max(100, 'Last name is too long')
    .refine(nameValidator, nameMsg),
  email: z.string()
    .email('Please provide a valid email address')
    .max(255, 'Email is too long'),
  // Optionals / Message
  subject: z.string().max(255).optional().nullable(),
  message: z.string()
    .min(10, 'Message must be at least 10 characters')
    .max(5000, 'Message is too long')
    .optional(), // Optional because chat onboarding might only need name/email
  category: z.string().optional().nullable(),
  // Anti-spam
  hpField: z.string().max(0).optional(),
  hToken: z.string().min(1, 'Verification token is required'),
});

/**
 * Chat Onboarding Schema (Subset of inquiry)
 */
export const chatOnboardingSchema = inquirySchema.pick({
  firstName: true,
  lastName: true,
  email: true,
});

/**
 * Chat Start Schema (Single name field)
 */
export const chatStartSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name is too long')
    .refine(nameValidator, nameMsg),
  email: z.string()
    .email('Please provide a valid email address')
    .max(255, 'Email is too long'),
});

export type InquiryInput = z.infer<typeof inquirySchema>;
export type ChatOnboardingInput = z.infer<typeof chatOnboardingSchema>;
export type ChatStartInput = z.infer<typeof chatStartSchema>;
