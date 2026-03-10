/**
 * Map API response data to component format
 */
// ExcelJS import removed

export interface EmployeeDTRRecord {
  id: string | number;
  date: string;
  timeIn: string;
  timeOut: string;
  hoursWorked: string | number;
  lateMinutes?: number;
  undertimeMinutes?: number;
  status: string;
  remarks: string;
  duties?: string;
  createdAt?: string;
  firstName?: string;
  lastName?: string;
  middleName?: string | null;
  suffix?: string | null;
}

export interface EmployeeInfo {
  id: string | number;
  name: string;
  department: string;
}

export interface EmployeeDTRFilters {
  fromDate?: string;
  toDate?: string;
}

export interface EmployeePaginationResult {
  totalPages: number;
  startIndex: number;
  endIndex: number;
  currentItems: EmployeeDTRRecord[];
}

export const mapDTRData = (apiData: {
  id?: string | number;
  recordId?: string | number;
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
  firstName?: string;
  lastName?: string;
  middleName?: string | null;
  suffix?: string | null;
}[]): EmployeeDTRRecord[] => {
  return apiData.map(item => ({
    id: item.id || item.recordId || '',
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
    firstName: item.firstName,
    lastName: item.lastName,
    middleName: item.middleName,
    suffix: item.suffix
  }));
};

/**
 * Filter DTR data based on filters and search query
 */
export const filterDTRData = (data: EmployeeDTRRecord[], filters: EmployeeDTRFilters, searchQuery: string): EmployeeDTRRecord[] => {
  let filteredData = [...data];

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
      (item.date ?? "").toLowerCase().includes(query) ||
      (item.status ?? "").toLowerCase().includes(query) ||
      (item.remarks ?? "").toLowerCase().includes(query)
    );
  }

  return filteredData;
};

/**
 * Calculate pagination data
 */
export const calculatePagination = (data: EmployeeDTRRecord[], currentPage: number, itemsPerPage: number): EmployeePaginationResult => {
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = data.slice(startIndex, endIndex);
  
  return { totalPages, startIndex, endIndex, currentItems };
};

/**
 * Get status badge styles
 */
export const getStatusBadge = (status: string, statusStyles: Record<string, string>): string => {
  return statusStyles[status] || 'bg-gray-100 text-gray-800';
};
