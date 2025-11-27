import { body } from 'express-validator';

export const registerValidation = [
  body('employeeId', 'Employee ID is required').not().isEmpty().trim().escape(),
  body('name', 'Name is required').not().isEmpty().trim().escape(),
  // Allow both capitalized and lowercase roles
  body('role', 'Role is required').isIn(['Employee', 'Admin', 'employee', 'admin', 'hr', 'HR']),
  body('department', 'Department is required').not().isEmpty().trim().escape(),
  body('password', 'Password must be at least 6 characters long').isLength({ min: 6 }),
];

export const loginValidation = [
  body('employeeId', 'Employee ID is required').not().isEmpty().trim().escape(),
  body('password', 'Password is required').not().isEmpty(),
];
