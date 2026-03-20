import { InferSelectModel } from 'drizzle-orm';
import { dailyTimeRecords, attendanceLogs, tardinessSummary } from '../db/schema.js';

// --- Database Models ---
export type DTRDbModel = InferSelectModel<typeof dailyTimeRecords>;
export type AttendanceLogDbModel = InferSelectModel<typeof attendanceLogs>;
export type TardinessSummaryDbModel = InferSelectModel<typeof tardinessSummary>;

// --- API Response Models (camelCase for Project Consistency) ---

export interface DTRApiResponse {
  id: number;
  employeeId: string;
  date: string;
  timeIn: string | null;
  timeOut: string | null;
  lateMinutes: number;
  undertimeMinutes: number;
  overtimeMinutes: number;
  status: string;
  createdAt: string | null;
  updatedAt: string | null;
  employeeName: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  suffix: string | null;
  department: string;
  duties: string; // Shows "Standard" or "Irregular"
  shift: string;  // Shows the actual shift (e.g. "8:00 AM - 5:00 PM")
  dutyType: string;
  correctionId?: number | null;
  correctionStatus?: string | null;
  correctionReason?: string | null;
  correctionTimeIn?: string | null;
  correctionTimeOut?: string | null;
}

export interface AttendanceLogApiResponse {
  id: number;
  employeeId: string;
  scanTime: string;
  type: 'IN' | 'OUT';
  source: string;
  firstName: string | null;
  lastName: string | null;
  department: string;
  duties: string; // Shows "Standard" or "Irregular"
  shift: string;  // Shows the actual shift
  dutyType: string;
  dtrStatus: string;
}

export interface TardinessSummaryApiResponse {
  id: number;
  employeeId: string;
  year: number;
  month: number;
  totalLateMinutes: number;
  totalUndertimeMinutes: number;
  totalLateCount: number;
  totalUndertimeCount: number;
  totalAbsenceCount: number;
  daysEquivalent: string;
  processedAt: string | null;
}
