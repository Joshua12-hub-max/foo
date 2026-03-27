// Utility to convert string from camelCase to snake_case
export const camelToSnakeCase = (str: string): string => {
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
};

// Utility to convert string from snake_case to camelCase
export const snakeToCamelCase = (str: string): string => {
    return str.replace(/(_\w)/g, (m) => m[1].toUpperCase());
};

import { JsonValue } from '@/types';

/**
 * Recursively converts object keys to camelCase.
 * Handles arrays and nested objects.
 */
export function toCamelCase<T extends JsonValue>(obj: T): T {
    if (Array.isArray(obj)) {
        return obj.map((v) => toCamelCase(v as JsonValue)) as T;
    } else if (obj !== null && obj !== undefined && typeof obj === 'object' && !(obj instanceof Date) && !(obj instanceof File) && !(obj instanceof Blob)) {
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
}

/**
 * Recursively converts object keys to snake_case.
 * Handles arrays and nested objects.
 */
export function toSnakeCase<T extends JsonValue>(obj: T): T {
    if (Array.isArray(obj)) {
        return obj.map((v) => toSnakeCase(v as JsonValue)) as T;
    } else if (obj !== null && obj !== undefined && typeof obj === 'object' && !(obj instanceof Date) && !(obj instanceof File) && !(obj instanceof Blob)) {
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
}
