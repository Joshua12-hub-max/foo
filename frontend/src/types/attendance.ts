export interface DTRApiResponse {
  id: number;
  employee_id: string;
  date: string;
  time_in: string | null;
  time_out: string | null;
  late_minutes: number;
  undertime_minutes: number;
  overtime_minutes: number;
  status: string;
  created_at: string | null;
  updated_at: string | null;
  employee_name?: string;
  department?: string;
  duties?: string;
}

export interface AttendanceLogApiResponse {
  id: number;
  employee_id: string;
  scan_time: string;
  type: 'IN' | 'OUT';
  source: string;
  first_name?: string;
  last_name?: string;
  department?: string;
  duties?: string;
  dtr_status?: string;
}

export interface TardinessSummaryApiResponse {
  id: number;
  employee_id: string;
  year: number;
  month: number;
  total_late_minutes: number;
  total_undertime_minutes: number;
  total_late_count: number;
  total_undertime_count: number;
  total_absence_count: number;
  days_equivalent: string;
  processed_at: string | null;
}
