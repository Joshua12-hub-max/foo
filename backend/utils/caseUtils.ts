/**
 * Utility functions for recursive case conversion
 */

type JsonValue = string | number | boolean | null | undefined | { [key: string]: JsonValue } | JsonValue[];

/**
 * Convert string from snake_case to camelCase
 */
export const snakeToCamelCase = (str: string): string => {
  return str.replace(/(_\w)/g, (m) => m[1].toUpperCase());
};

/**
 * Convert string from camelCase to snake_case
 */
export const camelToSnakeCase = (str: string): string => {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
};

/**
 * Recursively convert object keys to camelCase
 */
export const toCamelCase = <T extends JsonValue>(obj: T): T => {
  if (Array.isArray(obj)) {
    return (obj as JsonValue[]).map((v) => toCamelCase(v)) as T;
  } else if (obj !== null && typeof obj === 'object') {
    const newObj: Record<string, JsonValue> = {};
    const oldObj = obj as Record<string, JsonValue>;
    for (const key in oldObj) {
      if (Object.prototype.hasOwnProperty.call(oldObj, key)) {
        newObj[snakeToCamelCase(key)] = toCamelCase(oldObj[key]);
      }
    }
    return newObj as T;
  }
  return obj;
};

/**
 * Recursively convert object keys to snake_case
 */
export const toSnakeCase = <T extends JsonValue>(obj: T): T => {
  if (Array.isArray(obj)) {
    return (obj as JsonValue[]).map((v) => toSnakeCase(v)) as T;
  } else if (obj !== null && typeof obj === 'object') {
    const newObj: Record<string, JsonValue> = {};
    const oldObj = obj as Record<string, JsonValue>;
    for (const key in oldObj) {
      if (Object.prototype.hasOwnProperty.call(oldObj, key)) {
        newObj[camelToSnakeCase(key)] = toSnakeCase(oldObj[key]);
      }
    }
    return newObj as T;
  }
  return obj;
};
