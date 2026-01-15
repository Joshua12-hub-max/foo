export interface LeaveCredit {
  id: number;
  employee_id: string;
  first_name: string;
  last_name: string;
  department: string;
  credit_type: string;
  balance: number;
}

export interface AdminLeaveRequest {
  id: string | number;
  employee_id: string;
  name: string;
  department: string;
  leaveType: string;
  fromDate: string;
  toDate: string;
  reason: string;
  status: string;
  with_pay: boolean;
  attachment_path?: string;
  final_attachment_path?: string;
  first_name: string;
  last_name: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  current_balance?: number;
}

export interface LeaveFilters {
  department: string;
  employee: string;
  fromDate: string;
  toDate: string;
}

export interface EmployeeLeaveRequest {
  id: number;
  employee_id: string;
  leaveType: string;
  fromDate: string;
  toDate: string;
  reason: string;
  status: string;
  with_pay: boolean | number;
  attachment_path: string | null;
  department: string;
  name: string;
  first_name?: string;
  last_name?: string;
  start_date?: string;
  end_date?: string;
  leave_type?: string;
}

export interface EmployeeLeaveFilters {
  status: string;
  type: string;
  date: string;
}
