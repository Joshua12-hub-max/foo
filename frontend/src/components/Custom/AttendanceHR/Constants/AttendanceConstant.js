export const ITEMS_PER_PAGE = 10;

export const TABLE_HEADERS = [
  "Status",
  "Department",
  "Employee ID",
  "Employee Name",
  "Date",
  "Present",
  "Absent",
  "Late",
  "On Leave",
  "Leave With Pay",
  "Leave Without Pay",
  "Work From Home",
  "Undertime",
  "Time In",
  "Time Out",
  "Total Hours",
  "Total Work",
  "Remarks",
];

export const STATUS_STYLES = {
  "Present": "bg-green-100 text-green-800",
  "Late": "bg-yellow-100 text-yellow-800",
  "Absent": "bg-red-100 text-red-800",
  "Early Out": "bg-blue-100 text-blue-800"
};

export const LOADING_TYPES = {
  CSV: "CSV",
  PDF: "PDF",
  DATA: "data"
};