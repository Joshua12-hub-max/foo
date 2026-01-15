import { LeaveStatus } from "@/components/Custom/Timekeeping/LeaveRequestComponents/Employee/constants/leaveConstants";

export interface EmployeeLeaveRequest {
  id: number;
  employee_id: string;
  leaveType: string;
  fromDate: string;
  toDate: string;
  reason: string;
  status: LeaveStatus;
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
