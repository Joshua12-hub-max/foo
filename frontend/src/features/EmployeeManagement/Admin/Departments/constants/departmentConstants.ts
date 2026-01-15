export interface TableHeader {
  label: string;
  key: string;
  align?: string;
}

export interface DepartmentForm {
  name: string;
  description: string;
  head_of_department: string;
}

export const DEPARTMENT_TABLE_HEADERS: TableHeader[] = [
  { label: 'ID', key: 'id' },
  { label: 'Department Info', key: 'name' }, // Combined Icon, Name, Desc
  { label: 'Head of Department', key: 'head_of_department' },
  { label: 'Workforce', key: 'employee_count' },
  { label: 'Actions', key: 'actions', align: 'right' },
];

export const INITIAL_DEPARTMENT_FORM: DepartmentForm = {
  name: '',
  description: '',
  head_of_department: '',
};
