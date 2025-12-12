import axios from './axios';

export const fetchDepartments = async () => {
  try {
    const response = await axios.get('/departments');
    return response.data;
  } catch (error) {
    return { success: false, departments: [] };
  }
};

export const fetchDepartmentById = async (id) => {
  try {
    const response = await axios.get(`/departments/${id}`);
    return response.data;
  } catch (error) {
    return { success: false, department: null, employees: [] };
  }
};

// Alias for fetchDepartmentById - returns department with employees
export const fetchDepartmentEmployees = async (id) => {
  try {
    const response = await axios.get(`/departments/${id}`);
    return response.data;
  } catch (error) {
    return { success: false, department: null, employees: [] };
  }
};

export const addDepartment = async (formData) => {
  try {
    const response = await axios.post('/departments', formData);
    return response.data;
  } catch (error) {
    return { success: false, message: error.response?.data?.message || 'Failed to add department' };
  }
};

export const updateDepartment = async (id, formData) => {
  try {
    const response = await axios.put(`/departments/${id}`, formData);
    return response.data;
  } catch (error) {
    return { success: false, message: error.response?.data?.message || 'Failed to update department' };
  }
};

export const deleteDepartment = async (id) => {
  try {
    const response = await axios.delete(`/departments/${id}`);
    return response.data;
  } catch (error) {
    return { success: false, message: error.response?.data?.message || 'Failed to delete department' };
  }
};

// Get employees available to add to a department (not already in it)
export const fetchAvailableEmployees = async (departmentId, searchTerm = '') => {
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
export const assignEmployeeToDepartment = async (departmentId, employeeId) => {
  try {
    const response = await axios.post(`/departments/${departmentId}/assign-employee`, { employeeId });
    return response.data;
  } catch (error) {
    return { success: false, message: error.response?.data?.message || 'Failed to assign employee' };
  }
};

// Remove an employee from a department
export const removeEmployeeFromDepartment = async (departmentId, employeeId) => {
  try {
    const response = await axios.delete(`/departments/${departmentId}/employees/${employeeId}`);
    return response.data;
  } catch (error) {
    return { success: false, message: error.response?.data?.message || 'Failed to remove employee' };
  }
};