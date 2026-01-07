// Components
export { default as ColleaguesTable } from './components/ColleaguesTable';
export { default as DepartmentEmployeeTable } from './components/DepartmentEmployeeTable';
export { default as DepartmentHeader } from './components/DepartmentHeader';
export { default as DepartmentSearch } from './components/DepartmentSearch';
export { default as DepartmentStats } from './components/DepartmentStats';
export { default as DepartmentTable } from './components/DepartmentTable';
export { default as EmployeeDepartmentHeader } from './components/EmployeeDepartmentHeader';
export { default as AddEmployeeToDepartment } from './components/AddEmployeeToDepartment';
export { default as DepartmentModal } from './components/DepartmentModal';
export { default as DepartmentDeleteModal } from './components/DepartmentDeleteModal';
export { default as DepartmentFormModal } from './components/DepartmentFormModal';
export { default as RemoveEmployeeModal } from './components/RemoveEmployeeModal';

// Hooks
export { useDepartmentManagement as useDepartments } from './hooks/useDepartmentManagement';
export { useDepartmentDetail as useDepartmentDetails } from './hooks/useDepartmentDetail';

// Constants
export * from '@/components/Custom/EmployeeManagement/Admin/Departments/constants/departmentConstants';
