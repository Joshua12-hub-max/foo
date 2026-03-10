import axios from './axios';
import { Department } from '../types/org';
import { Employee } from '../types';
import { isApiError } from '../utils';

interface DepartmentResponse {
  success: boolean;
  departments?: Department[];
  department?: Department | null;
  employees?: Employee[];
  message?: string;
}

export const fetchDepartments = async (): Promise<DepartmentResponse> => {
  try {
    const response = await axios.get('/departments');
    return response.data;
  } catch (error) {
    return { success: false, departments: [] };
  }
};

export const fetchDepartmentById = async (id: string | number): Promise<DepartmentResponse> => {
  try {
    const response = await axios.get(`/departments/${id}`);
    return response.data;
  } catch (error) {
    return { success: false, department: null, employees: [] };
  }
};

// Alias for fetchDepartmentById - returns department with employees
export const fetchDepartmentEmployees = async (id: string | number): Promise<DepartmentResponse> => {
  try {
    const response = await axios.get(`/departments/${id}`);
    return response.data;
  } catch (error) {
    return { success: false, department: null, employees: [] };
  }
};

export const addDepartment = async (formData: Record<string, unknown>): Promise<DepartmentResponse> => {
  try {
    const response = await axios.post('/departments', formData);
    return response.data;
  } catch (error: unknown) {
    let message = 'Failed to add department';
    if (isApiError(error)) {
        message = error.response?.data?.message || error.message || message;
    }
    return { success: false, message };
  }
};

export const updateDepartment = async (id: string | number, formData: Record<string, unknown>): Promise<DepartmentResponse> => {
  try {
    const response = await axios.put(`/departments/${id}`, formData);
    return response.data;
  } catch (error: unknown) {
    let message = 'Failed to update department';
    if (isApiError(error)) {
        message = error.response?.data?.message || error.message || message;
    }
    return { success: false, message };
  }
};

export const deleteDepartment = async (id: string | number): Promise<DepartmentResponse> => {
  try {
    const response = await axios.delete(`/departments/${id}`);
    return response.data;
  } catch (error: unknown) {
    let message = 'Failed to delete department';
    if (isApiError(error)) {
        message = error.response?.data?.message || error.message || message;
    }
    return { success: false, message };
  }
};

// Get employees available to add to a department (not already in it)
export const fetchAvailableEmployees = async (departmentId: string | number, searchTerm: string = ''): Promise<DepartmentResponse> => {
  try {
    const url = searchTerm 
      ? `/departments/${departmentId}/available-employees?search=${encodeURIComponent(searchTerm)}`
      : `/departments/${departmentId}/available-employees`;
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    return { success: false, employees: [] };
  }
};

// Assign an employee to a department
export const assignEmployeeToDepartment = async (departmentId: string | number, employeeId: string | number): Promise<DepartmentResponse> => {
  try {
    const response = await axios.post(`/departments/${departmentId}/assign-employee`, { employeeId });
    return response.data;
  } catch (error: unknown) {
    let message = 'Failed to assign employee';
    if (isApiError(error)) {
        message = error.response?.data?.message || error.message || message;
    }
    return { success: false, message };
  }
};

// Remove an employee from a department
export const removeEmployeeFromDepartment = async (departmentId: string | number, employeeId: string | number): Promise<DepartmentResponse> => {
  try {
    const response = await axios.delete(`/departments/${departmentId}/employees/${employeeId}`);
    return response.data;
  } catch (error: unknown) {
    let message = 'Failed to remove employee';
    if (isApiError(error)) {
        message = error.response?.data?.message || error.message || message;
    }
    return { success: false, message };
  }
};

export const fetchPublicDepartments = async (): Promise<DepartmentResponse> => {
    try {
        const response = await axios.get('/departments/public');
        return response.data;
    } catch (error) {
        return { success: false, departments: [], message: 'Failed to fetch departments' };
    }
};

export const departmentApi = {
    fetchDepartments,
    fetchDepartmentById,
    fetchDepartmentEmployees,
    addDepartment,
    updateDepartment,
    deleteDepartment,
    fetchAvailableEmployees,
    assignEmployeeToDepartment,
    removeEmployeeFromDepartment,
    fetchPublicDepartments,
    
    // Aligned Aliases
    getDepartments: fetchDepartments,
    getDepartmentById: fetchDepartmentById,
    getDepartmentEmployees: fetchDepartmentEmployees,
    getAvailableEmployees: fetchAvailableEmployees,
    getPublicDepartments: fetchPublicDepartments
};

export default departmentApi;
