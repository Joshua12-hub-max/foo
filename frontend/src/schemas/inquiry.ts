import { z } from 'zod';

const gibberishRegex = /^(.)\1{5,}|^[bcdfghjklmnpqrstvwxzBCDFGHJKLMNPQRSTVWXZ]{12,}$|qwertyuiop|asdfghjkl|zxcvbnm|qwqewrwff/;

const validateGibberish = (val: string | undefined | null) => {
  if (!val || val === "") return true;
  if (/(.)\1{7,}/.test(val)) return false;
  if (/[bcdfghjklmnpqrstvwxzBCDFGHJKLMNPQRSTVWXZ]{15,}/.test(val)) return false;
  if (/[!@#$%^&*()_+={}[\]:;"'<>,.?/\\|`~]{4,}/.test(val)) return false;
  return !gibberishRegex.test(val.toLowerCase());
};

const nameValidator = (val: string | undefined | null) => {
  if (!val || val === "") return true;
  // Strict name regex: letters, spaces, hyphens, dots, and 'ñ'
  const nameRegex = /^[a-zA-Z\s\-.ñÑ]{2,100}$/;
  if (!nameRegex.test(val)) return false;
  return validateGibberish(val);
};

const nameMsg = "Only letters, spaces, hyphens, and dots are allowed. Avoid symbols and numbers.";
const gibberishMsg = "Please enter valid text, avoid random characters and excessive symbols.";

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
  subject: z.string()
    .max(255, 'Subject is too long')
    .optional()
    .nullable(),
  message: z.string()
    .min(10, 'Message must be at least 10 characters')
    .max(5000, 'Message is too long')
    .refine(validateGibberish, gibberishMsg),
  category: z.string()
    .optional()
    .nullable(),
  // Anti-spam
  hpField: z.string().max(0).optional(),
  hToken: z.string().min(1, 'Verification token is required').optional(),
});

export type InquiryInput = z.infer<typeof inquirySchema>;

export const chatStartSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name is too long')
    .refine(nameValidator, nameMsg),
  email: z.string()
    .email('Please provide a valid email address')
    .max(255, 'Email is too long'),
});

export type ChatStartInput = z.infer<typeof chatStartSchema>;
