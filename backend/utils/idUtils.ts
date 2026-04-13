import { sql, type SQL } from 'drizzle-orm';
import { MySqlColumn } from 'drizzle-orm/mysql-core';

type IdInput = string | number | null | undefined;
type SqlInput = SQL | MySqlColumn | string | number;

/**
 * NORMALIZATION LOGIC:
 * Matches what the C# Biometric Middleware expects and how it's stored.
 * If the ID is '1', it becomes 'Emp-001'.
 * We use 3-digit padding because the sensor capacity is 1-200.
 */

export const normalizeIdSql = (column: SQL | MySqlColumn) => {
  // 100% PRECISION: Reverting to 3-digit padding as requested by User.
  // Within the 1-200 range, 3-digit LPAD is completely safe from truncation.
  return sql`CONCAT('Emp-', LPAD(REGEXP_REPLACE(${column}, '[^0-9]', ''), 3, '0'))`;
};

export const normalizeIdJs = (id: IdInput): string => {
  if (!id) return '';
  const numericPart = String(id).replace(/[^0-9]/g, '');
  // padStart(3, '0') will pad to 3 digits but NOT truncate if longer.
  return `Emp-${numericPart.padStart(3, '0')}`;
};

/**
 * The 'Absolute Lockdown' Comparison.
 * Compares both sides in the strict 'Emp-XXX' format.
 * 100% PRECISE: Fixes the 'Join Explosion' and 'Data Vanishing' bugs.
 */
export const compareIds = (col1: SQL | MySqlColumn, col2: SqlInput) => {
  if (!col1 || !col2) return sql`1=0`;

  const normalizedCol1 = normalizeIdSql(col1);
  
  if (typeof col2 === 'string' || typeof col2 === 'number') {
    const target = normalizeIdJs(col2);
    return sql`${normalizedCol1} = ${target}`;
  }
  
  const normalizedCol2 = normalizeIdSql(col2 as SQL | MySqlColumn);
  return sql`${normalizedCol1} = ${normalizedCol2}`;
};
