/**
 * Performance Module Validation Utilities
 * Provides consistent input validation across performance management controllers
 */

/**
 * Validate required fields in request body
 * @param {Object} body - Request body
 * @param {Array} requiredFields - Array of required field names
 * @returns {Object} { valid: boolean, message?: string }
 */
export const validateRequired = (body, requiredFields) => {
  const missing = requiredFields.filter(field => {
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
 * @param {string|number} id - ID to validate
 * @returns {Object} { valid: boolean, message?: string, id?: number }
 */
export const validateId = (id) => {
  const numId = parseInt(id, 10);
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
 * @param {string} dateStr - Date string to validate
 * @returns {Object} { valid: boolean, message?: string }
 */
export const validateDate = (dateStr) => {
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
 * @param {number} rating - Rating to validate
 * @returns {Object} { valid: boolean, message?: string }
 */
export const validateRating = (rating) => {
  const numRating = parseFloat(rating);
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
 * @param {string} value - Value to validate
 * @param {Array} allowedValues - Array of allowed values
 * @param {string} fieldName - Name of the field for error message
 * @returns {Object} { valid: boolean, message?: string }
 */
export const validateEnum = (value, allowedValues, fieldName) => {
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
 * @param {number} value - Value to validate
 * @returns {Object} { valid: boolean, message?: string }
 */
export const validatePercentage = (value) => {
  if (value === undefined || value === null) return { valid: true };
  
  const numValue = parseFloat(value);
  if (isNaN(numValue) || numValue < 0 || numValue > 100) {
    return {
      valid: false,
      message: 'Percentage must be between 0 and 100'
    };
  }
  return { valid: true };
};

/**
 * Standard error response helper
 * @param {Object} res - Express response object
 * @param {Error} error - Error object
 * @param {string} operation - Operation that failed
 */
export const handleError = (res, error, operation = 'Operation') => {
  console.error(`${operation} Error:`, error.message || error);
  
  // Check for specific MySQL errors
  if (error.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      message: 'Duplicate entry. This record already exists.'
    });
  }
  
  if (error.code === 'ER_NO_REFERENCED_ROW_2') {
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
 * Validate user has required role
 * @param {Object} user - User object from request
 * @param {Array} allowedRoles - Array of allowed roles
 * @returns {Object} { valid: boolean, message?: string }
 */
export const validateRole = (user, allowedRoles) => {
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
