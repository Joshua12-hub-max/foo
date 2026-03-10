/**
 * Map API response data to component format
 */
// ExcelJS import removed

export interface DTRRecord {
  id: string | number;
  employeeId: string | number;
  name: string;
  department: string;
  date: string;
  rawDate?: string; // ISO date (YYYY-MM-DD) for accurate filtering
  timeIn: string;
  timeOut: string;
  hoursWorked: string | number;
  lateMinutes?: number;
  undertimeMinutes?: number;
  status: string;
  remarks: string;
  duties?: string;
  createdAt?: string;
  correctionId?: number | null;
  correctionStatus?: string | null;
  correctionReason?: string | null;
  correctionTimeIn?: string | null;
  correctionTimeOut?: string | null;
}

export interface DTRFilters {
  department?: string;
  employeeId?: string; // Filter by ID
  employee?: string; // Legacy name filter
  fromDate?: string;
  toDate?: string;
}

export interface PaginationResult {
  totalPages: number;
  startIndex: number;
  endIndex: number;
  currentItems: DTRRecord[];
  totalRecords: number;
}

export const mapDTRData = (apiData: {
  id?: string | number;
  employeeId?: string | number;
  employeeName?: string;
  firstName?: string;
  lastName?: string;
  middleName?: string | null;
  suffix?: string | null;
  department?: string;
  date: string;
  timeIn?: string;
  timeOut?: string;
  hoursWorked?: string | number;
  lateMinutes?: number;
  undertimeMinutes?: number;
  status?: string;
  remarks?: string;
  duties?: string;
  createdAt?: string;
  correctionId?: number | null;
  correctionStatus?: string | null;
  correction_reason?: string | null;
  correction_time_in?: string | null;
  correction_time_out?: string | null;
}[]): DTRRecord[] => {
  return apiData.map(item => ({
    id: item.employeeId || item.id || '',
    employeeId: item.employeeId || '',
    name: item.employeeName || 'N/A',
    department: item.department || 'N/A',
    date: item.date,
    timeIn: item.timeIn || 'N/A',
    timeOut: item.timeOut || 'N/A',
    hoursWorked: item.hoursWorked || '0',
    lateMinutes: item.lateMinutes || 0,
    undertimeMinutes: item.undertimeMinutes || 0,
    status: item.status || 'Unknown',
    remarks: item.remarks || '-',
    duties: item.duties || 'N/A',
    createdAt: item.createdAt,
    correctionId: item.correctionId,
    correctionStatus: item.correctionStatus,
    correctionReason: item.correction_reason,
    correctionTimeIn: item.correction_time_in,
    correctionTimeOut: item.correction_time_out
  }));
};

/**
 * Filter DTR data based on filters and search query
 */
export const filterDTRData = (data: DTRRecord[], filters: DTRFilters, searchQuery: string): DTRRecord[] => {
  let filteredData = [...data];

  // Apply department filter
  if (filters.department) {
    filteredData = filteredData.filter((item) => item.department === filters.department);
  }

  // Apply employee filter
  if (filters.employeeId) {
    filteredData = filteredData.filter((item) => String(item.employeeId) === filters.employeeId);
  }
  
  // Legacy support
  if (filters.employee) {
    filteredData = filteredData.filter((item) => item.name === filters.employee);
  }

  // Apply date range filters
  if (filters.fromDate) {
    filteredData = filteredData.filter((item) => item.date >= filters.fromDate!);
  }

  if (filters.toDate) {
    filteredData = filteredData.filter((item) => item.date <= filters.toDate!);
  }

  // Apply search query
  const query = searchQuery.toLowerCase();
  if (query) {
    filteredData = filteredData.filter((item) =>
      (item.name ?? "").toLowerCase().includes(query) ||
      (String(item.id) ?? "").toLowerCase().includes(query) ||
      (item.department ?? "").toLowerCase().includes(query) ||
      (item.status ?? "").toLowerCase().includes(query)
    );
  }

  return filteredData;
};

/**
 * Calculate pagination data
 */
export const calculatePagination = (data: DTRRecord[], currentPage: number, itemsPerPage: number): PaginationResult => {
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = data.slice(startIndex, endIndex);
  
  return { totalPages, startIndex, endIndex, currentItems, totalRecords: data.length };
};

/**
 * Get unique departments from data
 */
export const getUniqueDepartments = (data: DTRRecord[]): string[] => {
  return [...new Set(data.map(item => item.department))].sort();
};

/**
 * Get unique employees from data
 */
export const getUniqueEmployees = (data: DTRRecord[]): { id: string; name: string }[] => {
  const uniqueEmps = new Map<string, string>();
  data.forEach(item => {
    if (item.employeeId && item.name) {
      uniqueEmps.set(String(item.employeeId), item.name);
    }
  });
  
  return Array.from(uniqueEmps.entries()).map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
};

/**
 * Get status badge styles
 */
export const getStatusBadge = (status: string, statusStyles: Record<string, string>): string => {
  // Try exact match first
  if (statusStyles[status]) return statusStyles[status];
  
  // Try Title Case (e.g. "present" -> "Present")
  const titleCase = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  if (statusStyles[titleCase]) return statusStyles[titleCase];
  
  // Try all lowercase
  const lowerCase = status.toLowerCase();
  if (statusStyles[lowerCase]) return statusStyles[lowerCase];

  return 'bg-gray-100 text-gray-800';
};
