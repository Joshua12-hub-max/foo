export const ADMIN_ATTENDANCE_HEADERS = [
  "department",
  "employee_id",
  "employee_name",
  "present",
  "absent",
  "late",
  "wfh",
  "undertime",
  "date",
  "overtime",
  "on_leave",
  "lunch_break_in",
  "lunch_break_out",
  "total_hours",
  "time_in",
  "time_out",
  "total_work",
  "daily_status",
  "notes"
];


export const EMPLOYEE_ATTENDANCE_HEADERS = [
  "department",
  "employee_id",
  "employee_name",
  "present",
  "absent",
  "late",
  "wfh",
  "undertime",
  "date",
  "overtime",
  "on_leave",
  "lunch_break_in",
  "lunch_break_out",
  "total_hours",
  "time_in",
  "time_out",
  "total_work",
  "daily_status",
  "notes"
];

// Items per page for pagination
export const PAGE_SIZE = 10;

// Status badge styles
export const STATUS_STYLES = {
  Present: 'bg-green-100 text-green-800',
  Late: 'bg-yellow-100 text-yellow-800',
  Absent: 'bg-red-100 text-red-800',
  Leave: 'bg-blue-100 text-blue-800',
  Holiday: 'bg-purple-100 text-purple-800',
  'Day Off': 'bg-gray-100 text-gray-800',
  Approved: 'bg-green-100 text-green-800',
  Pending: 'bg-yellow-100 text-yellow-800',
  Rejected: 'bg-red-100 text-red-800',
};

// Mock Data for development (can be removed later)
export const MOCK_ATTENDANCE_DATA = Array.from({ length: 50 }, (_, i) => ({
  id: `ATT-${i + 1}`,
  department: ['IT', 'HR', 'Finance', 'Sales'][Math.floor(Math.random() * 4)],
  employee_id: `EMP-${1000 + i}`,
  employee_name: `Employee ${i + 1}`,
  present: Math.random() > 0.2 ? 'Yes' : 'No',
  absent: Math.random() > 0.8 ? 'Yes' : 'No',
  late: Math.floor(Math.random() * 15),
  wfh: Math.random() > 0.9 ? 'Yes' : 'No',
  undertime: 0,
  date: new Date(Date.now() - i * 86400000).toISOString(),
  overtime: 0,
  on_leave: Math.random() > 0.95 ? 'Yes' : 'No',
  lunch_break_in: '12:00 PM',
  lunch_break_out: '01:00 PM',
  total_hours: 8,
  time_in: '08:00 AM',
  time_out: '05:00 PM',
  total_work: '8h',
  daily_status: ['Present', 'Late', 'Absent', 'Leave'][Math.floor(Math.random() * 4)],
  notes: 'Regular shift'
}));
