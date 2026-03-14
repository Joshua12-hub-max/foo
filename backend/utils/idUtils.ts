import { sql } from 'drizzle-orm';
import { MySqlColumn } from 'drizzle-orm/mysql-core';

/**
 * Normalizes an employee ID by removing common prefixes like 'EMP-' or 'CHRMO-'
 * and any other non-digit characters, then casting to unsigned integer for robust joining.
 * 
 * @param column The Drizzle column containing the employee ID
 * @returns A SQL fragment that evaluates to the numeric ID
 */
export const normalizeIdSql = (column: MySqlColumn | string) => {
  if (typeof column === 'string') {
    return sql<number>`CAST(REGEXP_REPLACE(${sql.raw(column)}, '[^0-9]', '') AS UNSIGNED)`;
  }
  return sql<number>`CAST(REGEXP_REPLACE(${column}, '[^0-9]', '') AS UNSIGNED)`;
};

/**
 * Creates a robust comparison between two employee ID columns or a value.
 * Handles format mismatches like 'EMP-001' vs '1'.
 */
export const compareIds = (col1: MySqlColumn, col2: MySqlColumn | string) => {
  if (typeof col2 === 'string') {
    // If col2 is a literal value (string), we normalize it in JS then compare
    const numericId = col2.replace(/\D/g, '');
    if (!numericId) return sql`FALSE`;
    return sql`${normalizeIdSql(col1)} = ${parseInt(numericId)}`;
  }
  return sql`${normalizeIdSql(col1)} = ${normalizeIdSql(col2)}`;
};
