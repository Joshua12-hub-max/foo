import { sql } from 'drizzle-orm';
import { MySqlColumn } from 'drizzle-orm/mysql-core';

/**
 * SYMMETRICAL NORMALIZE:
 * Converts DB columns/values to strict 'Emp-XXX' format.
 * e.g., '1' -> 'Emp-001', 'Emp-1' -> 'Emp-001', 'Emp-001' -> 'Emp-001'
 */
export const normalizeIdSql = (column: MySqlColumn | string) => {
  if (typeof column === 'string') {
    const numericPart = column.replace(/\D/g, '');
    const padded = numericPart.padStart(3, '0');
    return `Emp-${padded}`;
  }
  
  // For SQL columns, we use MySQL functions to strip non-digits, pad, and re-prefix
  return sql`CONCAT('Emp-', LPAD(REGEXP_REPLACE(${column}, '[^0-9]', ''), 3, '0'))`;
};

/**
 * Normalizes a JS string to the strict 'Emp-XXX' format.
 */
export const normalizeIdJs = (id: string | null | undefined): string => {
  if (!id) return '';
  const numericPart = id.replace(/\D/g, '');
  if (!numericPart) return id; // Return original if no digits (like 'admin')
  return `Emp-${numericPart.padStart(3, '0')}`;
};

/**
 * The 'Absolute Lockdown' Comparison.
 * Compares both sides in the strict 'Emp-XXX' format.
 */
export const compareIds = (col1: MySqlColumn, col2: MySqlColumn | string) => {
  const normalizedCol1 = normalizeIdSql(col1);
  
  if (typeof col2 === 'string') {
    const target = normalizeIdJs(col2);
    return sql`${normalizedCol1} = ${target}`;
  }
  
  const normalizedCol2 = normalizeIdSql(col2);
  return sql`${normalizedCol1} = ${normalizedCol2}`;
};
