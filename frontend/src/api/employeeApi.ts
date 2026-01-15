import axios from './axios';
import { ApiResponse } from '../types';

interface EmployeeResponse {
  success: boolean;
  employees?: any[];
  profile?: any;
  message?: string;
  id?: string | number;
  data?: any;
  previousStatus?: string;
  newStatus?: string;
  skills?: any[];
  skillId?: string | number;
  education?: any[];
  educationId?: string | number;
  contacts?: any[];
  contactId?: string | number;
  departments?: string[];
  jobTitles?: string[];
  isEnrolled?: boolean;
}


//Employee CRUD
export const fetchEmployees = async (department: string | null = null): Promise<EmployeeResponse> => {
  try {
    const url = department && department !== 'All Departments' 
        ? `/employees?department=${encodeURIComponent(department)}` 
        : '/employees';
    
    const response = await axios.get(url);
    return { success: true, employees: response.data.employees };
  } catch (error) {
    return { success: false, employees: [] };
  }
};

export const fetchEmployeeProfile = async (id: string | number): Promise<EmployeeResponse> => {
  try {
    const response = await axios.get(`/employees/${id}`);
    return { success: true, profile: response.data.employee };
  } catch (error) {
    return { success: false, profile: null };
  }
};

export const addEmployee = async (formData: FormData | any): Promise<EmployeeResponse> => {
  try {
    const response = await axios.post('/employees', formData);
    return { success: true, message: response.data.message, id: response.data.employeeId };
  } catch (error: any) {
    return { success: false, message: error.response?.data?.message || 'Failed to add employee' };
  }
};

export const deleteEmployee = async (id: string | number): Promise<EmployeeResponse> => {
  try {
    const response = await axios.delete(`/employees/${id}`);
    return { success: true, message: response.data.message };
  } catch (error: any) {
      return { success: false, message: error.response?.data?.message || 'Failed to delete employee' };
  }
};

export const updateEmployee = async (id: string | number, formData: FormData | any): Promise<EmployeeResponse> => {
  try {
    const response = await axios.put(`/employees/${id}`, formData);
    return { success: true, message: response.data.message };
  } catch (error: any) {
    return { success: false, message: error.response?.data?.message || 'Failed to update employee' };
  }
};

// Revert employee status (Admin only) - For reversing memo effects
export const revertEmployeeStatus = async (id: string | number, newStatus: string = 'Active', reason: string = ''): Promise<EmployeeResponse> => {
  try {
    const response = await axios.patch(`/employees/${id}/revert-status`, { 
      new_status: newStatus, 
      reason 
    });
    return { 
      success: true, 
      message: response.data.message,
      previousStatus: response.data.previousStatus,
      newStatus: response.data.newStatus
    };
  } catch (error: any) {
    return { success: false, message: error.response?.data?.message || 'Failed to revert employee status' };
  }
};

// Update own profile (for logged in user) - still uses auth route
export const updateMyProfile = async (formData: FormData | any): Promise<EmployeeResponse> => {
  try {
    const response = await axios.post('/auth/profile', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return { success: true, message: 'Profile updated successfully', data: response.data.data };
  } catch (error: any) {
    return { success: false, message: error.response?.data?.message || 'Failed to update profile' };
  }
};


// EMPLOYEE SKILLS
export const fetchEmployeeSkills = async (employeeId: string | number): Promise<EmployeeResponse> => {
  try {
    const response = await axios.get(`/employees/${employeeId}/skills`);
    return { success: true, skills: response.data.skills };
  } catch (error) {
    return { success: false, skills: [] };
  }
};

export const addEmployeeSkill = async (employeeId: string | number, skillData: any): Promise<EmployeeResponse> => {
  try {
    const response = await axios.post(`/employees/${employeeId}/skills`, skillData);
    return { success: true, message: 'Skill added', skillId: response.data.skillId };
  } catch (error: any) {
    return { success: false, message: error.response?.data?.message || 'Failed to add skill' };
  }
};

export const deleteEmployeeSkill = async (employeeId: string | number, skillId: string | number): Promise<EmployeeResponse> => {
  try {
    await axios.delete(`/employees/${employeeId}/skills/${skillId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.response?.data?.message || 'Failed to delete skill' };
  }
};

// ==========================================
// EMPLOYEE EDUCATION
// ==========================================

export const fetchEmployeeEducation = async (employeeId: string | number): Promise<EmployeeResponse> => {
  try {
    const response = await axios.get(`/employees/${employeeId}/education`);
    return { success: true, education: response.data.education };
  } catch (error) {
    return { success: false, education: [] };
  }
};

export const addEmployeeEducation = async (employeeId: string | number, educationData: any): Promise<EmployeeResponse> => {
  try {
    const response = await axios.post(`/employees/${employeeId}/education`, educationData);
    return { success: true, message: 'Education added', educationId: response.data.educationId };
  } catch (error: any) {
    return { success: false, message: error.response?.data?.message || 'Failed to add education' };
  }
};

export const deleteEmployeeEducation = async (employeeId: string | number, educationId: string | number): Promise<EmployeeResponse> => {
  try {
    await axios.delete(`/employees/${employeeId}/education/${educationId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.response?.data?.message || 'Failed to delete education' };
  }
};

// ==========================================
// EMPLOYEE EMERGENCY CONTACTS
// ==========================================

export const fetchEmployeeContacts = async (employeeId: string | number): Promise<EmployeeResponse> => {
  try {
    const response = await axios.get(`/employees/${employeeId}/contacts`);
    return { success: true, contacts: response.data.contacts };
  } catch (error) {
    return { success: false, contacts: [] };
  }
};

export const addEmployeeContact = async (employeeId: string | number, contactData: any): Promise<EmployeeResponse> => {
  try {
    const response = await axios.post(`/employees/${employeeId}/contacts`, contactData);
    return { success: true, message: 'Contact added', contactId: response.data.contactId };
  } catch (error: any) {
    return { success: false, message: error.response?.data?.message || 'Failed to add contact' };
  }
};

export const deleteEmployeeContact = async (employeeId: string | number, contactId: string | number): Promise<EmployeeResponse> => {
  try {
    await axios.delete(`/employees/${employeeId}/contacts/${contactId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.response?.data?.message || 'Failed to delete contact' };
  }
};

// ==========================================
// EMPLOYEE DOCUMENTS
// ==========================================




//utility functions
export const fetchEmployeeOptions = async (): Promise<EmployeeResponse> => {
    try {
        const response = await axios.get('/departments');
        const departments = response.data.departments.map((d: any) => d.name);
        return {
            success: true,
            departments: departments.length > 0 ? departments : ['General'],
            jobTitles: ['Developer', 'Manager', 'Accountant', 'Specialist', 'Analyst', 'Clerk', 'Officer', 'HR Officer']
        };
    } catch (e) {
         return {
            success: true,
            departments: ['Engineering', 'Human Resources', 'Finance', 'Marketing', 'Operations', 'General', 'IT', 'Admin'],
            jobTitles: ['Developer', 'Manager', 'Accountant', 'Specialist', 'Analyst', 'Clerk', 'Officer']
        };
    }
};

// Biometrics
export const startFingerprintEnrollment = async (employeeId: string | number): Promise<any> => {
    try {
        const response = await axios.post('/biometrics/enroll/start', { employeeId });
        return response.data;
    } catch (error: any) {
        throw error.response?.data?.message || "Enrollment failed";
    }
};

export const checkEnrollmentStatus = async (employeeId: string | number): Promise<{ isEnrolled: boolean }> => {
    try {
        const response = await axios.get(`/biometrics/enroll/status/${employeeId}`);
        return response.data;
    } catch (error) {
        return { isEnrolled: false };
    }
};

export const employeeApi = {
    fetchEmployees,
    fetchEmployeeProfile,
    addEmployee,
    deleteEmployee,
    updateEmployee,
    revertEmployeeStatus,
    updateMyProfile,
    fetchEmployeeSkills,
    addEmployeeSkill,
    deleteEmployeeSkill,
    fetchEmployeeEducation,
    addEmployeeEducation,
    deleteEmployeeEducation,
    fetchEmployeeContacts,
    addEmployeeContact,
    deleteEmployeeContact,
    fetchEmployeeOptions,
    startFingerprintEnrollment,
    checkEnrollmentStatus
};
