import { useQuery } from '@tanstack/react-query';
import { attendanceApi } from '@/api/attendanceApi';

export interface AttendanceRecord {
  id: string | number;
  employeeId: string | number;
  name?: string;
  firstName?: string;
  lastName?: string;
  date: string;
  timeIn: string;
  timeOut: string;
  late: string | number;
  undertime: string | number;
  department?: string;
  departmentName?: string;
  status: string;
}

// 1. Pure Type Guards for zero-loophole runtime checks
const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

// 2. Strict Extractors to guarantee primitives
const getString = (val: unknown, fallback: string = ''): string => 
  typeof val === 'string' ? val : fallback;

const getStringOrUndefined = (val: unknown): string | undefined => 
  typeof val === 'string' ? val : undefined;

const getStringOrNumber = (val: unknown, fallback: string | number = 0): string | number => 
  (typeof val === 'string' || typeof val === 'number') ? val : fallback;


export const useAttendanceData = (isAdmin: boolean = false) => {
  // 3. Define the explicit Generics for useQuery to prevent 'as' casting later
  const { data, isLoading, error, refetch } = useQuery<AttendanceRecord[], Error>({
    queryKey: ['attendance', { isAdmin }],
    queryFn: async (): Promise<AttendanceRecord[]> => {
      // Treat the response strictly as unknown instead of 'any'
      const response: unknown = await attendanceApi.getLogs({});
      
      let apiData: unknown[] =[];

      // Safely drill into the unknown response structure
      if (Array.isArray(response)) {
        apiData = response;
      } else if (isRecord(response)) {
        if (Array.isArray(response.data)) {
          apiData = response.data;
        } else if (isRecord(response.data) && Array.isArray(response.data.data)) {
          apiData = response.data.data;
        }
      }
      
      // 4. Force the map function to strictly return an AttendanceRecord
      return apiData.map((rawItem: unknown): AttendanceRecord => {
        // Fallback to empty object if item isn't an object
        const item = isRecord(rawItem) ? rawItem : {};

        const firstName = getStringOrUndefined(item.firstName);
        const lastName = getStringOrUndefined(item.lastName);
        const providedName = getStringOrUndefined(item.name);
        
        const computedName = `${firstName || ''} ${lastName || ''}`.trim();
        const finalName = providedName || (computedName.length > 0 ? computedName : undefined);

        const late = getStringOrNumber(item.lateMinutes, 0) || getStringOrNumber(item.late, 0) || 0;
        const undertime = getStringOrNumber(item.undertimeMinutes, 0) || getStringOrNumber(item.undertime, 0) || 0;
        
        const status = getString(item.status, 'Present');

        return {
          id: getStringOrNumber(item.id, ''),
          employeeId: getStringOrNumber(item.employeeId, ''),
          name: finalName,
          firstName: firstName,
          lastName: lastName,
          date: getString(item.date),
          timeIn: getString(item.timeIn),
          timeOut: getString(item.timeOut),
          late,
          undertime,
          status: status.trim() === '' ? 'Present' : status
        };
      });
    },
    initialData: [] 
  });

  return { 
    data, // Already strictly typed as AttendanceRecord[] via useQuery Generic
    isLoading, 
    error: error ? error.message : null, 
    refetch 
  };
};
