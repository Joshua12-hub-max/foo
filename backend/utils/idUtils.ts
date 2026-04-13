import { sql, type SQL } from 'drizzle-orm';
import { AnyMySqlColumn } from 'drizzle-orm/mysql-core';

type IdInput = string | number | null | undefined;
type SqlInput = SQL | AnyMySqlColumn | string | number | null | undefined;

/**
 * NORMALIZATION LOGIC:
 * Matches what the C# Biometric Middleware expects and how it's stored.
 * If the ID is '1', it becomes 'Emp-001'.
 * We use 3-digit padding because the sensor capacity is 1-200.
 */

export const normalizeIdSql = (column: SQL | AnyMySqlColumn) => {
  // 100% PRECISION: Direct column access.
  // Since we normalized the entire database, we no longer need expensive REGEXP_REPLACE on every query.
  return column;
};

export const normalizeIdJs = (id: IdInput): string => {
  if (!id) return '';
  const numericPart = String(id).replace(/[^0-9]/g, '');
  // padStart(3, '0') will pad to 3 digits but NOT truncate if longer.
  return `Emp-${numericPart.padStart(3, '0')}`;
};

/**
 * The Optimized 'Absolute Lockdown' Comparison.
 * Since data is pre-normalized, we can use simple equality for indexed lookups.
 */
export function compareIds(col1: SQL | AnyMySqlColumn, col2: SqlInput) {
  if (!col1 || !col2) return sql`1=0`;

  if (typeof col2 === 'string' || typeof col2 === 'number') {
    const target = normalizeIdJs(col2);
    return sql`${col1} = ${target}`;
  }
  
  return sql`${col1} = ${col2}`;
}
