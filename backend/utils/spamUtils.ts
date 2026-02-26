/**
 * Shared Anti-Spam Utilities
 * Reusable across all public-facing endpoints (Chat, Inquiry, Recruitment)
 * 100% Type-Safe — No `any`, `as any`, or `unknown` usage.
 */

// Known disposable email domains
const DISPOSABLE_DOMAINS: readonly string[] = [
  'tempmail.com', '10minutemail.com', 'guerrillamail.com', 'sharklasers.com',
  'dispostable.com', 'mailinator.com', 'yopmail.com', 'throwaway.email',
  'trashmail.com', 'getnada.com', 'maildrop.cc', 'fakeinbox.com',
  'temp-mail.org', 'burnermail.io', 'guerrillamailblock.com', 'grr.la'
] as const;

// RFC 5322 compliant email regex
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

/**
 * Check if an email belongs to a known disposable email provider
 */
export const isDisposableEmail = (email: string): boolean => {
  try {
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) return false;
    return DISPOSABLE_DOMAINS.includes(domain);
  } catch {
    return false;
  }
};

/**
 * Validate email format using RFC 5322 regex
 */
export const isValidEmailFormat = (email: string): boolean => {
  return EMAIL_REGEX.test(email);
};

/**
 * Strip HTML tags from a string to prevent XSS injection
 * Particularly important for content that will be embedded in HTML emails
 */
export const sanitizeInput = (text: string): string => {
  return text
    .replace(/<[^>]*>/g, '') // Strip all HTML tags
    .replace(/&/g, '&amp;')  // Encode ampersands
    .replace(/</g, '&lt;')   // Encode less-than
    .replace(/>/g, '&gt;')   // Encode greater-than
    .replace(/"/g, '&quot;') // Encode double quotes
    .replace(/'/g, '&#039;') // Encode single quotes
    .trim();
};

/**
 * Validate that a string does not exceed a maximum length
 */
export const isWithinMaxLength = (text: string, maxLength: number): boolean => {
  return text.length <= maxLength;
};
