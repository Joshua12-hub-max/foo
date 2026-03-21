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
  employeeName?: string;
  department?: string;
  duties?: string;
  shift?: string;
  dutyType?: string;
  correctionId?: number | null;
  correctionStatus?: string | null;
  correctionReason?: string | null;
  correctionTimeIn?: string | null;
  correctionTimeOut?: string | null;
  remarks?: string | null;
}

export interface AttendanceLogApiResponse {
  id: number;
  employeeId: string;
  scanTime: string;
  type: 'IN' | 'OUT';
  source: string;
  firstName?: string;
  lastName?: string;
  department?: string;
  duties?: string;
  dtrStatus?: string;
  dutyType?: string;
  shift?: string;
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

export interface DTRCorrectionRequest {
  id: number;
  employeeId: string;
  firstName: string;
  lastName: string;
  date: string;
  originalTimeIn: string | null;
  originalTimeOut: string | null;
  correctedTimeIn: string | null;
  correctedTimeOut: string | null;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  rejectionReason?: string | null;
  createdAt: string;
}
