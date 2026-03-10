export interface AdminLeaveRequest {
  id: string | number;
  employeeId: string;
  name: string;
  department: string;
  leaveType: string;
  fromDate: string;
  toDate: string;
  reason: string;
  status: string;
  isWithPay: boolean;
  attachmentPath?: string;
  finalAttachmentPath?: string;
  firstName: string;
  lastName: string;
  currentBalance?: number;
}

export interface LeaveFilters {
  department: string;
  employee: string;

  fromDate: string;
  toDate: string;
}
