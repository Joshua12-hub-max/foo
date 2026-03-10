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
  role: UserRole;
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
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * User/Authentication table row
 */
export interface UserRow extends BaseRow {
  employeeId: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  department: string;
  jobTitle?: string;
  positionTitle?: string;
  itemNumber?: string;
  salaryGrade?: number;
  stepIncrement?: number;
  dateHired?: Date;
  employmentStatus?: EmploymentStatus;
  avatarUrl?: string;
  phoneNumber?: string;
  birthDate?: Date;
  gender?: string;
  civilStatus?: string;
  nationality?: string;
  bloodType?: string;
  permanentAddress?: string;
  emergencyContact?: string;
  emergencyContactNumber?: string;
  umidId?: string;
  philsysId?: string;
  educationalBackground?: string;
  gsisNumber?: string;
  philhealthNumber?: string;
  pagibigNumber?: string;
  tinNumber?: string;
  managerId?: number;
  googleId?: string;
  isVerified: boolean;
  verificationToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  twoFactorEnabled: boolean;
  twoFactorOtp?: string;
  twoFactorOtpExpires?: Date;
}

// ============================================================================
// Enums and Constants
// ============================================================================

export type UserRole = 'Administrator' | 'Human Resource' | 'Employee';

export type EmploymentStatus = 
  | 'Active'
  | 'Probationary'
  | 'Terminated'
  | 'Resigned'
  | 'On Leave'
  | 'Suspended'
  | 'Verbal Warning'
  | 'Written Warning'
  | 'Show Cause';

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

export type MemoType = 
  | 'Verbal Warning'
  | 'Written Warning'
  | 'Suspension Notice'
  | 'Termination Notice'
  | 'Show Cause';

export type MemoStatus = 
  | 'Draft'
  | 'Sent'
  | 'Acknowledged'
  | 'Archived';

export type MemoPriority = 
  | 'Low'
  | 'Normal'
  | 'High'
  | 'Urgent';

export type Gender = 'Male' | 'Female';

export type CivilStatus = 
  | 'Single'
  | 'Married'
  | 'Widowed'
  | 'Separated'
  | 'Annulled';

export type AppointmentType = 
  | 'Permanent'
  | 'Contractual'
  | 'Casual'
  | 'Job Order'
  | 'Coterminous'
  | 'Temporary';





export type PerformanceRatingScale = 1 | 2 | 3 | 4 | 5;

export type EmploymentType = 
  | 'Full-time'
  | 'Part-time'
  | 'Contractual'
  | 'Job Order'
  | 'Coterminous'
  | 'Temporary'
  | 'Probationary'
  | 'Casual'
  | 'Permanent';

export type JobStatus = 
  | 'Open'
  | 'Closed'
  | 'On Hold';

export type ApplicantStage = 
  | 'Applied'
  | 'Screening'
  | 'Initial Interview'
  | 'Final Interview'
  | 'Offer'
  | 'Hired'
  | 'Rejected';

export type ApplicantStatus = 
  | 'Applied'
  | 'Screening'
  | 'Interview'
  | 'Offer'
  | 'Hired'
  | 'Rejected';

export type ApplicantSource = 'web' | 'email';

export type InterviewPlatform = 'Google Meet' | 'Zoom' | 'Other';

export type ReviewCycleStatus = 
  | 'Draft'
  | 'Active'
  | 'Completed'
  | 'Archived';

export type RatingPeriod = 
  | '1st_sem'
  | '2nd_sem'
  | 'annual';

export type ReviewStatus = 
  | 'Draft'
  | 'Self-Rated'
  | 'Submitted'
  | 'Acknowledged'
  | 'Approved'
  | 'Finalized';

export type SelfRatingStatus = 
  | 'pending'
  | 'submitted';

export type EvaluationMode = 
  | 'CSC'
  | 'IPCR'
  | 'Senior';

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
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  supportingDocument?: string;
}

export interface DTRCorrectionRequest {
  date: string;
  originalTimeIn?: string;
  originalTimeOut?: string;
  correctedTimeIn?: string;
  correctedTimeOut?: string;
  reason: string;
}

export interface UndertimeRequest {
  date: string;
  timeOut: string;
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

export type PerformanceCriteriaType = 
  | 'core_function'
  | 'support_function'
  | 'core_competency'
  | 'organizational_competency';

export interface MySQLError extends Error {
  code?: string;
  errno?: number;
  sqlState?: string;
  sqlMessage?: string;
  sql?: string;
}
