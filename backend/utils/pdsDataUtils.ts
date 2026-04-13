/**
 * Unified PDS Data Sanitization Utilities
 *
 * This module provides canonical helper functions for normalizing and validating
 * PDS (Personal Data Sheet) data across all services. All PDS-related services
 * MUST use these helpers to ensure consistent data transformation.
 *
 * Created: 2025-04-14
 * Purpose: Eliminate data sanitization inconsistencies across PDSParserService,
 *          pds.service, and RegistrationService
 */

import { normalizeToIsoDate, excelSerialToIsoDate } from './dateUtils.js';

// ==========================================
// COMPREHENSIVE GARBAGE PATTERNS
// ==========================================

/**
 * Comprehensive list of patterns that indicate a cell contains form labels,
 * headers, or invalid data rather than actual user data.
 *
 * These patterns are aggregated from:
 * - PDSParserService GARBAGE_PATTERNS
 * - RegistrationService isPlaceholder()
 * - Common CS Form 212 placeholders
 */
const COMPREHENSIVE_GARBAGE_PATTERNS = [
  // Form instructions and labels
  /^(continue on separate sheet|cs form 212|signature|date filed|status of case)/i,
  /^(wet signature|e-signature|digital certificate)/i,
  /^(inclusive dates|dd\/mm|number of hours|conducted.*sponsored)/i,
  /^(position title|department.*agency|name of school|basic education)/i,
  /^(name.*address.*organization|scholarship|highest level)/i,
  /^(gov't service|status of appointment|rating|if applicable)/i,
  /^(from$|to$|period of attendance|level$)/i,
  /^(name extension|jr\.,? sr|pls\. indicate)/i,
  /^(if yes|if holder|please indicate|pursuant to)/i,
  /^(are you|have you|do you|were you)/i,
  /^(special skills|non-academic|membership in)/i,
  /^(ces\/csee|career service|board.*bar)/i,
  /^(license|valid until|place of exam)/i,
  /^(name$|office.*residential address|contact no)/i,

  // Address field placeholders
  /^(house\/block|subdivision\/village|city\/municipality|province$|street$|barangay$|zip code)/i,
  /^(House\/Block\/Lot No\.|Street|Subdivision\/Village|Barangay|City\/Municipality|Province|ZIP CODE)/i,

  // Numbered section headers (e.g., "23. NAME of CHILDREN")
  /^\d{1,2}\.\s*[A-Z\s]+/,

  // Section markers (e.g., "VII. ")
  /^[ivx]+\.\s/i,

  // Instructional text
  /Write full name|list all|Continue on separate sheet if necessary/i,

  // Common placeholder values
  /^(N\/A|n\/a|NA|na|NONE|none|None|---+|_+|\s*$)/,
];

/**
 * Check if a value is garbage (form labels, placeholders, empty, or invalid)
 *
 * @param val - Value to check
 * @returns true if garbage, false if valid data
 *
 * @example
 * isPdsGarbage("N/A") // true
 * isPdsGarbage("John Doe") // false
 * isPdsGarbage("23. NAME of CHILDREN") // true
 * isPdsGarbage("") // true
 */
export const isPdsGarbage = (val: unknown): boolean => {
  if (val === null || val === undefined) return true;

  const str = String(val).trim();

  if (str.length === 0) return true;
  if (str === '[object Object]') return true;
  if (str.toLowerCase() === 'null') return true;
  if (str.toLowerCase() === 'undefined') return true;

  return COMPREHENSIVE_GARBAGE_PATTERNS.some((pattern) => pattern.test(str));
};

/**
 * Check if an entire row/object is garbage (all key fields are empty or invalid)
 *
 * @param rowData - Object to check
 * @param keyFields - Array of field names that must have valid values
 * @returns true if all key fields are garbage
 *
 * @example
 * isPdsGarbageRow({ name: "N/A", date: "" }, ["name", "date"]) // true
 * isPdsGarbageRow({ name: "John", date: "" }, ["name"]) // false
 */
export const isPdsGarbageRow = (
  rowData: Record<string, unknown>,
  keyFields: string[]
): boolean => {
  if (!rowData || typeof rowData !== 'object') return true;

  return keyFields.every((field) => {
    const value = rowData[field];
    return isPdsGarbage(value);
  });
};

// ==========================================
// DATE NORMALIZATION
// ==========================================

/**
 * Canonical date parser for PDS data.
 *
 * Handles multiple input formats:
 * - ISO format: "2022-07-14" → "2022-07-14"
 * - Excel serial: 44562 → "2022-01-01"
 * - MM/DD/YYYY: "07/14/2022" → "2022-07-14"
 * - Date objects → "2022-07-14"
 * - Empty/null → null
 * - "Present" → "Present" (for current employment)
 *
 * @param val - Date value in any supported format
 * @returns ISO date string (YYYY-MM-DD), "Present", or null
 *
 * @example
 * normalizePdsDate("2022-07-14") // "2022-07-14"
 * normalizePdsDate(44562) // "2022-01-01"
 * normalizePdsDate("Present") // "Present"
 * normalizePdsDate("") // null
 */
export const normalizePdsDate = (val: unknown): string | null => {
  if (val === null || val === undefined) return null;

  const str = String(val).trim();

  // Empty or placeholder
  if (str.length === 0 || isPdsGarbage(str)) return null;

  // Special case: "Present" for current employment
  if (str.toLowerCase() === 'present') return 'Present';

  // Handle Excel serial numbers (e.g., 44562)
  if (/^\d{5}(\.\d+)?$/.test(str)) {
    const serial = parseFloat(str);
    // Reasonable range for dates (1930-2100)
    if (serial > 10000 && serial < 60000) {
      const isoDate = excelSerialToIsoDate(serial);
      if (isoDate) return isoDate;
    }
  }

  // Use existing date normalization utility
  const normalized = normalizeToIsoDate(str);
  return normalized || null;
};

/**
 * Extract year from a date value (for education dateFrom/dateTo which are VARCHAR(4))
 *
 * @param val - Date value
 * @returns Year as string (YYYY) or null
 *
 * @example
 * extractPdsYear("2022-07-14") // "2022"
 * extractPdsYear(44562) // "2022"
 * extractPdsYear("2022") // "2022"
 */
export const extractPdsYear = (val: unknown): string | null => {
  if (val === null || val === undefined) return null;

  const str = String(val).trim();

  // Empty or placeholder
  if (str.length === 0 || isPdsGarbage(str)) return null;

  // Already a 4-digit year
  if (/^\d{4}$/.test(str)) {
    const year = parseInt(str, 10);
    // Sanity check: reasonable year range (1900-2100)
    if (year >= 1900 && year <= 2100) return str;
    return null;
  }

  // First try to normalize to ISO date
  const isoDate = normalizePdsDate(val);
  if (!isoDate || isoDate === 'Present') return null;

  // Extract year from ISO format (YYYY-MM-DD)
  const match = isoDate.match(/^(\d{4})/);
  return match ? match[1] : null;
};

// ==========================================
// NUMBER NORMALIZATION
// ==========================================

/**
 * Canonical number parser for PDS integer fields (age, hours, yearGraduated, etc.)
 *
 * Handles:
 * - Integers: 25 → 25
 * - Strings with commas: "1,500" → 1500
 * - Negative numbers: "-5" → -5
 * - Empty/null → defaultVal
 * - Invalid → defaultVal
 *
 * @param val - Number value
 * @param defaultVal - Default value if parsing fails
 * @returns Parsed integer or default
 *
 * @example
 * normalizePdsInt("25") // 25
 * normalizePdsInt("1,500") // 1500
 * normalizePdsInt("N/A", null) // null
 */
export const normalizePdsInt = (
  val: unknown,
  defaultVal: number | null = null
): number | null => {
  if (val === null || val === undefined) return defaultVal;

  const str = String(val).trim();

  if (str.length === 0 || isPdsGarbage(str)) return defaultVal;

  // Remove non-numeric characters except minus sign
  const cleaned = str.replace(/[^0-9-]/g, '');

  if (!cleaned || cleaned === '-') return defaultVal;

  const parsed = parseInt(cleaned, 10);

  return isNaN(parsed) ? defaultVal : parsed;
};

/**
 * Canonical number parser for PDS decimal fields (salary, height, weight, rating, etc.)
 *
 * Handles:
 * - Decimals: 1.75 → "1.75"
 * - Strings with commas: "50,000.50" → "50000.50"
 * - Negative numbers: "-1.5" → "-1.5"
 * - Empty/null → null
 * - Invalid → null
 *
 * NOTE: Returns string to preserve precision for database DECIMAL fields
 *
 * @param val - Number value
 * @returns Decimal as string or null
 *
 * @example
 * normalizePdsFloat("1.75") // "1.75"
 * normalizePdsFloat("50,000.50") // "50000.5"
 * normalizePdsFloat("N/A") // null
 */
export const normalizePdsFloat = (val: unknown): string | null => {
  if (val === null || val === undefined) return null;

  const str = String(val).trim();

  if (str.length === 0 || isPdsGarbage(str)) return null;

  // Check for negative sign
  const isNegative = str.startsWith('-');

  // Remove all non-numeric characters except decimal point
  const cleaned = str.replace(/[^0-9.]/g, '');

  if (!cleaned || cleaned === '.') return null;

  const parsed = parseFloat(cleaned);

  if (isNaN(parsed)) return null;

  const result = isNegative ? -parsed : parsed;

  return result.toString();
};

// ==========================================
// STRING NORMALIZATION
// ==========================================

/**
 * Canonical string parser for PDS text fields
 *
 * Handles:
 * - Trims whitespace
 * - Converts empty strings to null
 * - Filters out placeholder text
 * - Enforces max length
 * - Handles null/"null"/"undefined" strings
 *
 * @param val - String value
 * @param maxLen - Maximum length (optional)
 * @returns Sanitized string or null
 *
 * @example
 * normalizePdsString("  John Doe  ") // "John Doe"
 * normalizePdsString("N/A") // null
 * normalizePdsString("Very long text", 5) // "Very "
 */
export const normalizePdsString = (
  val: unknown,
  maxLen?: number
): string | null => {
  if (val === null || val === undefined) return null;

  const str = String(val).trim();

  if (str.length === 0 || isPdsGarbage(str)) return null;

  // Truncate if max length specified
  const result = maxLen && str.length > maxLen
    ? str.substring(0, maxLen)
    : str;

  return result;
};

/**
 * Canonical boolean parser for checkbox/yes-no fields
 *
 * Handles:
 * - Checkboxes: "X", "✓", "/" → true
 * - Yes/No: "yes", "y", "no", "n" → true/false
 * - Boolean: true, false → true/false
 * - Numbers: 1, 0 → true/false
 * - Empty → false
 *
 * @param val - Boolean-like value
 * @returns Boolean
 *
 * @example
 * normalizePdsBoolean("X") // true
 * normalizePdsBoolean("yes") // true
 * normalizePdsBoolean("") // false
 */
export const normalizePdsBoolean = (val: unknown): boolean => {
  if (val === null || val === undefined || val === '') return false;

  if (typeof val === 'boolean') return val;

  const str = String(val).toLowerCase().trim();

  // Checkbox markers
  if (str === 'x' || str === '/' || str === '✓' || str === '\u2713' ||
      str === '\u00fc' || str === '\u00fe') {
    return true;
  }

  // Yes/No
  if (str === 'yes' || str === 'y' || str === 'true' || str === '1') {
    return true;
  }

  return false;
};

// ==========================================
// COMPOSITE SANITIZATION
// ==========================================

/**
 * Sanitize an entire object by applying normalization to all fields
 *
 * @param obj - Object to sanitize
 * @returns Sanitized object with null values for empty/placeholder strings
 *
 * @example
 * sanitizePdsObject({ name: "  John  ", age: "N/A" })
 * // { name: "John", age: null }
 */
export const sanitizePdsObject = <T extends Record<string, unknown>>(
  obj: T
): T => {
  const result = { ...obj };

  for (const key in result) {
    const value = result[key];

    // Only sanitize string values (preserve numbers, booleans, etc.)
    if (typeof value === 'string') {
      const sanitized = normalizePdsString(value);
      result[key] = sanitized as T[Extract<keyof T, string>];
    }
  }

  return result;
};

// ==========================================
// VALIDATION HELPERS
// ==========================================

/**
 * Check if a date string is in valid ISO format (YYYY-MM-DD)
 *
 * @param val - Value to check
 * @returns true if valid ISO date
 */
export const isValidIsoDate = (val: unknown): boolean => {
  if (typeof val !== 'string') return false;

  const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;

  if (!isoDateRegex.test(val)) return false;

  // Verify it's a valid date
  const date = new Date(val);
  return !isNaN(date.getTime());
};

/**
 * Check if a value is a valid year (YYYY)
 *
 * @param val - Value to check
 * @returns true if valid year
 */
export const isValidYear = (val: unknown): boolean => {
  if (typeof val === 'number') {
    return val >= 1900 && val <= 2100;
  }

  if (typeof val === 'string') {
    if (!/^\d{4}$/.test(val)) return false;
    const year = parseInt(val, 10);
    return year >= 1900 && year <= 2100;
  }

  return false;
};
