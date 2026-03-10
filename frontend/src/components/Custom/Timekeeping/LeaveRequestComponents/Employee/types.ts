import { LeaveStatus } from "@/components/Custom/Timekeeping/LeaveRequestComponents/Employee/constants/leaveConstants";

export interface EmployeeLeaveRequest {
  id: number;
  employeeId: string;
  leaveType: string;
  fromDate: string;
  toDate: string;
  reason: string;
  status: LeaveStatus;
  isWithPay: boolean | number;
  attachmentPath: string | null;
  department: string;
  name: string;
  firstName?: string;
  lastName?: string;
  startDate?: string;
  endDate?: string;
}

export interface EmployeeLeaveFilters {
  status: string;
  type: string;
  date: string;
}
