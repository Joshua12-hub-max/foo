export interface AttendanceHeader {
  key: string;
  label: string;
}

export const ADMIN_ATTENDANCE_HEADERS: AttendanceHeader[] = [
  { key: 'status', label: 'Status' },
  { key: 'employeeId', label: 'Employee ID' },
  { key: 'employeeName', label: 'Employee Name' },
  { key: 'date', label: 'Date' },
  { key: 'timeIn', label: 'Time In' },
  { key: 'timeOut', label: 'Time Out' },
  { key: 'late', label: 'Late' },
  { key: 'undertime', label: 'Undertime' },
];

export const EMPLOYEE_ATTENDANCE_HEADERS: AttendanceHeader[] = [
  { key: 'date', label: 'Date' },
  { key: 'timeIn', label: 'Time In' },
  { key: 'timeOut', label: 'Time Out' },
  { key: 'late', label: 'Late' },
  { key: 'undertime', label: 'Undertime' },
  { key: 'status', label: 'Status' },
];

export const PAGE_SIZE = 10;

export const STATUS_STYLES: Record<string, string> = {
  Present: 'bg-green-100 text-green-700',
  Absent: 'bg-red-100 text-red-700',
  Late: 'bg-orange-100 text-orange-700',
  Leave: 'bg-blue-100 text-blue-700',
  Rest: 'bg-gray-100 text-gray-700',
};
