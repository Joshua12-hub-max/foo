import type { Response } from 'express';
import type { ValidationResult, IdValidationResult } from '../types/index.js';

/**
 * Performance Module Validation Utilities
 * Provides consistent input validation across performance management controllers
 */

/**
 * Validate required fields in request body
 * @param body - Request body object
 * @param requiredFields - Array of required field names
 */
export const validateRequired = (
  body: Record<string, unknown>,
  requiredFields: string[]
): ValidationResult => {
  const missing = requiredFields.filter((field) => {
    const value = body[field];
    return value === undefined || value === null || value === '';
  });

  if (missing.length > 0) {
    return {
      valid: false,
      message: `Missing required fields: ${missing.join(', ')}`
    };
  }
  return { valid: true };
};

/**
 * Validate numeric ID parameter
 * @param id - ID to validate (string or number)
 */
export const validateId = (id: string | number): IdValidationResult => {
  const numId = typeof id === 'string' ? parseInt(id, 10) : id;
  
  if (isNaN(numId) || numId <= 0) {
    return {
      valid: false,
      message: 'Invalid ID parameter'
    };
  }
  return { valid: true, id: numId };
};

/**
 * Validate date format (YYYY-MM-DD)
 * @param dateStr - Date string to validate
 */
export const validateDate = (dateStr: string | undefined): ValidationResult => {
  if (!dateStr) return { valid: true }; // Optional dates pass

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateStr)) {
    return {
      valid: false,
      message: 'Invalid date format. Use YYYY-MM-DD'
    };
  }

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return {
      valid: false,
      message: 'Invalid date value'
    };
  }

  return { valid: true };
};

/**
 * Validate rating score (1-5 CSC scale)
 * @param rating - Rating to validate
 */
export const validateRating = (rating: number | string): ValidationResult => {
  const numRating = typeof rating === 'string' ? parseFloat(rating) : rating;
  
  if (isNaN(numRating) || numRating < 1 || numRating > 5) {
    return {
      valid: false,
      message: 'Rating must be between 1 and 5'
    };
  }
  return { valid: true };
};

/**
 * Validate enum value
 * @param value - Value to validate
 * @param allowedValues - Array of allowed values
 * @param fieldName - Name of the field for error message
 */
export const validateEnum = (
  value: string | undefined,
  allowedValues: string[],
  fieldName: string
): ValidationResult => {
  if (!value) return { valid: true }; // Optional enums pass

  if (!allowedValues.includes(value)) {
    return {
      valid: false,
      message: `Invalid ${fieldName}. Allowed values: ${allowedValues.join(', ')}`
    };
  }
  return { valid: true };
};

/**
 * Validate percentage (0-100)
 * @param value - Value to validate
 */
export const validatePercentage = (value: number | string | undefined | null): ValidationResult => {
  if (value === undefined || value === null) return { valid: true };

  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue) || numValue < 0 || numValue > 100) {
    return {
      valid: false,
      message: 'Percentage must be between 0 and 100'
    };
  }
  return { valid: true };
};

/**
 * MySQL error codes for specific error handling
 */
interface MySQLError extends Error {
  code?: string;
}

/**
 * Standard error response helper
 * @param res - Express response object
 * @param error - Error object
 * @param operation - Operation that failed (for logging)
 */
export const handleError = (
  res: Response,
  error: Error | MySQLError,
  operation: string = 'Operation'
): Response => {
  console.error(`${operation} Error:`, error.message || error);

  const mysqlError = error as MySQLError;

  // Check for specific MySQL errors
  if (mysqlError.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      message: 'Duplicate entry. This record already exists.'
    });
  }

  if (mysqlError.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({
      success: false,
      message: 'Referenced record does not exist.'
    });
  }

  return res.status(500).json({
    success: false,
    message: `Failed to ${operation.toLowerCase()}`
  });
};

/**
 * User object for role validation
 */
interface UserWithRole {
  role?: string;
}

/**
 * Validate user has required role
 * @param user - User object from request
 * @param allowedRoles - Array of allowed roles
 */
export const validateRole = (
  user: UserWithRole | undefined,
  allowedRoles: string[]
): ValidationResult => {
  if (!user || !user.role) {
    return {
      valid: false,
      message: 'User authentication required'
    };
  }

  if (!allowedRoles.includes(user.role)) {
    return {
      valid: false,
      message: `Access denied. Required role: ${allowedRoles.join(' or ')}`
    };
  }

  return { valid: true };
};
