import { useQuery } from '@tanstack/react-query';
import { fetchDepartments, fetchPublicDepartments } from '@api/departmentApi';
import { fetchEmployees } from '@api/employeeApi';

export interface FilterEmployee {
  id: string;
  name: string;
}

export interface FilterOptions {
  departments: string[];
  employees: FilterEmployee[];
}

/**
 * Custom hook to fetch and standardize department and employee options for filters.
 * Ensures data is fetched reliably and mapped consistently across all administrative tables.
 */
export const useFilterOptions = () => {
  const query = useQuery<FilterOptions>({
    queryKey: ['centralized-filter-options'],
    queryFn: async () => {
      try {
        console.log('[useFilterOptions] Fetching options...');
        const [deptRes, empRes] = await Promise.all([
          fetchPublicDepartments(),
          fetchEmployees()
        ]);

        console.log('[useFilterOptions] Results:', { 
          depts: deptRes.success ? deptRes.departments?.length : 'failed',
          emps: empRes.success ? empRes.employees?.length : 'failed' 
        });

        // Standardize Departments: Extract names, remove empty/null, and sort alphabetically
        const departments = deptRes.success && deptRes.departments
          ? Array.from(new Set(
              deptRes.departments
                .map((d: { name?: string; department?: string }) => d.name || d.department || '')
                .filter(Boolean)
            )).sort() as string[]
          : [];

        // Standardize Employees: Map to consistent { id, name } objects and remove duplicates
        const rawEmps: FilterEmployee[] = empRes.success && empRes.employees
          ? empRes.employees.map((e: Employee) => ({
              id: String(e.employeeId || e.id),
              name: `${e.firstName || ''} ${e.lastName || ''}`.trim()
            })).filter((e): e is FilterEmployee => !!e.id && !!e.name)
          : [];


        // Remove duplicates by ID
        const employees = Array.from(
          new Map(rawEmps.map((item: FilterEmployee) => [item.id, item])).values()
        ).sort((a: FilterEmployee, b: FilterEmployee) => a.name.localeCompare(b.name));

        return { departments, employees };
      } catch (error) {
        console.error('Error fetching filter options:', error);
        return { departments: [], employees: [] };
      }
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60,
    refetchOnWindowFocus: true, // Allow refetch on focus to help with stale state
  });

  return {
    ...query,
    data: query.data || { departments: [], employees: [] }
  };
};

export default useFilterOptions;
