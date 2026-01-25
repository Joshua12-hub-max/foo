import type { Request, Response, NextFunction } from 'express';
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

// ============================================================================
// Express Extensions
// ============================================================================

/**
 * JWT Token Payload structure
 */
export interface JwtPayload {
  id: number;
  employeeId: string;
  role: string;
  iat?: number;
  exp?: number;
}

/**
 * Express Request with authenticated user attached by middleware
 */
export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

/**
 * Express handler type for async controllers
 */
export type AsyncHandler = (
  req: Request,
  res: Response,
  next?: NextFunction
) => Promise<void>;

/**
 * Express handler type for authenticated routes
 */
export type AuthenticatedHandler = (
  req: AuthenticatedRequest,
  res: Response,
  next?: NextFunction
) => Promise<void>;

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

/**
 * Paginated API response
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================================================
// Database Types
// ============================================================================

/**
 * Base database row with common fields
 */
export interface BaseRow extends RowDataPacket {
  id: number;
  created_at?: Date;
  updated_at?: Date;
}

/**
 * User/Authentication table row
 */
export interface UserRow extends BaseRow {
  employee_id: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  department: string;
  job_title?: string;
  position_title?: string;
  item_number?: string;
  salary_grade?: number;
  step_increment?: number;
  date_hired?: Date;
  employment_status?: EmploymentStatus;
  avatar_url?: string;
  phone_number?: string;
  birth_date?: Date;
  gender?: string;
  civil_status?: string;
  nationality?: string;
  blood_type?: string;
  permanent_address?: string;
  emergency_contact?: string;
  emergency_contact_number?: string;
  sss_number?: string;
  gsis_number?: string;
  philhealth_number?: string;
  pagibig_number?: string;
  tin_number?: string;
  manager_id?: number;
  google_id?: string;
  is_verified: boolean;
  verification_token?: string;
  reset_password_token?: string;
  reset_password_expires?: Date;
  two_factor_enabled: boolean;
  two_factor_otp?: string;
  two_factor_otp_expires?: Date;
}

// ============================================================================
// Enums and Constants
// ============================================================================

export type UserRole = 'admin' | 'hr' | 'employee';

export type EmploymentStatus = 
  | 'regular'
  | 'probationary'
  | 'contractual'
  | 'casual'
  | 'job_order'
  | 'consultant'
  | 'Terminated'
  | 'Suspended'
  | 'Resigned'
  | 'Active';

export type LeaveType =
  | 'vacation'
  | 'sick'
  | 'maternity'
  | 'paternity'
  | 'special'
  | 'bereavement'
  | 'study'
  | 'rehabilitation'
  | 'solo_parent'
  | 'vawc'
  | 'calamity'
  | 'adoption'
  | 'special_emergency'
  | 'monetization'
  | 'terminal';

export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export type AttendanceLogType = 'IN' | 'OUT';

export type AttendanceSource = 'BIOMETRIC' | 'MANUAL' | 'WEB';

export type AttendanceStatus = 
  | 'present'
  | 'absent'
  | 'late'
  | 'undertime'
  | 'half_day'
  | 'on_leave'
  | 'holiday';

export type MemoType = 'general' | 'disciplinary' | 'commendation' | 'policy';

export type MemoStatus = 'draft' | 'published' | 'archived';

export type ApplicantStatus =
  | 'new'
  | 'screening'
  | 'interview'
  | 'evaluation'
  | 'reference'
  | 'offer'
  | 'hired'
  | 'rejected'
  | 'withdrawn';

export type PerformanceRatingScale = 1 | 2 | 3 | 4 | 5;

// ============================================================================
// Request Body Types
// ============================================================================

export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  department: string;
  password: string;
  role?: UserRole;
}

export interface OTPVerifyRequest {
  identifier: string;
  otp: string;
}

export interface PasswordResetRequest {
  token: string;
  newPassword: string;
}

export interface LeaveApplicationRequest {
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  reason: string;
  supporting_document?: string;
}

export interface DTRCorrectionRequest {
  date: string;
  original_time_in?: string;
  original_time_out?: string;
  corrected_time_in?: string;
  corrected_time_out?: string;
  reason: string;
}

export interface UndertimeRequest {
  date: string;
  time_out: string;
  reason: string;
}

// ============================================================================
// Entity Types (for responses)
// ============================================================================

export interface Employee {
  id: number;
  employeeId: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  role: UserRole;
  department: string;
  jobTitle?: string;
  employmentStatus?: EmploymentStatus;
  dateHired?: string;
  avatar?: string;
}

export interface Department {
  id: number;
  name: string;
  code: string;
  description?: string;
  headId?: number;
  headName?: string;
  employeeCount?: number;
}

export interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: Date;
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  authorId: number;
  authorName: string;
  publishDate: Date;
  expiryDate?: Date;
  isPinned: boolean;
}

// ============================================================================
// Validation Types
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  message?: string;
}

export interface IdValidationResult extends ValidationResult {
  id?: number;
}

// ============================================================================
// Database Query Result Types
// ============================================================================

export type QueryResult<T extends RowDataPacket> = [T[], ResultSetHeader[]];
export type InsertResult = [ResultSetHeader, undefined];
export type UpdateResult = [ResultSetHeader, undefined];

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Make specific properties optional
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Make specific properties required
 */
export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>;
