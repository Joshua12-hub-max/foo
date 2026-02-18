import axios from './axios';
import { ApiResponse } from '../types';

import { Employee, Skill, Education, EmergencyContact, CustomField, ApiError, SkillData, EducationData, ContactData, CustomFieldData } from '../types';

interface EmployeeResponse {
  success: boolean;
  employees?: Employee[];
  profile?: Employee;
  message?: string;
  id?: string | number;
  data?: Employee; // Profile data returned from auth endpoint
  previousStatus?: string;
  newStatus?: string;
  skills?: Skill[];
  skillId?: string | number;
  education?: Education[];
  educationId?: string | number;
  contacts?: EmergencyContact[];
  contactId?: string | number;
  fieldId?: string | number;
  departments?: { id: number; name: string }[] | string[];
  jobTitles?: string[];

}


//Employee CRUD
export const fetchEmployees = async (deptParams: { department?: string | null, department_id?: number | null } = {}): Promise<EmployeeResponse> => {
  try {
    const { department, department_id } = deptParams;
    let url = '/employees';
    const params = new URLSearchParams();
    
    if (department_id) {
      params.append('department_id', department_id.toString());
    } else if (department && department !== 'All Departments') {
      params.append('department', department);
    }
    
    const queryString = params.toString();
    if (queryString) url += `?${queryString}`;
    
    const response = await axios.get(url);
    return { success: true, employees: response.data.employees };
  } catch (error: unknown) {
    return { success: false, employees: [] };
  }
};

export const fetchEmployeeProfile = async (id: string | number): Promise<EmployeeResponse> => {
  try {
    const response = await axios.get(`/employees/${id}`);
    return { success: true, profile: response.data.employee };
  } catch (error: unknown) {
    return { success: false, profile: undefined };
  }
};

export const addEmployee = async (formData: FormData | Record<string, unknown>): Promise<EmployeeResponse> => {
  try {
    const response = await axios.post('/employees', formData);
    return { success: true, message: response.data.message, id: response.data.employeeId };
  } catch (error: unknown) {
    const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to add employee';
    return { success: false, message };
  }
};

export const deleteEmployee = async (id: string | number): Promise<EmployeeResponse> => {
  try {
    const response = await axios.delete(`/employees/${id}`);
    return { success: true, message: response.data.message };
  } catch (error: unknown) {
      const err = error as ApiError;
      return { success: false, message: err.response?.data?.message || err.message || 'Failed to delete employee' };
  }
};

export const updateEmployee = async (id: string | number, data: Record<string, unknown>): Promise<EmployeeResponse> => {
  try {
    const response = await axios.put(`/employees/${id}`, data);
    return { success: true, message: response.data.message };
  } catch (error: unknown) {
    console.error('Update Employee Error:', error);
    throw error;
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
  } catch (error: unknown) {
    const err = error as ApiError;
    return { success: false, message: err.response?.data?.message || err.message || 'Failed to revert employee status' };
  }
};

// Update own profile (for logged in user) - still uses auth route
export const updateMyProfile = async (formData: FormData): Promise<EmployeeResponse> => {
  try {
    const response = await axios.post('/auth/profile', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return { success: true, message: 'Profile updated successfully', data: response.data.data };
  } catch (error: unknown) {
    const err = error as ApiError;
    return { success: false, message: err.response?.data?.message || err.message || 'Failed to update profile' };
  }
};


// EMPLOYEE SKILLS
export const fetchEmployeeSkills = async (employeeId: string | number): Promise<EmployeeResponse> => {
  try {
    const response = await axios.get(`/employees/${employeeId}/skills`);
    return { success: true, skills: response.data.skills };
  } catch (error: unknown) {
    return { success: false, skills: [] };
  }
};

export const addEmployeeSkill = async (employeeId: string | number, skillData: SkillData): Promise<EmployeeResponse> => {
  try {
    const response = await axios.post(`/employees/${employeeId}/skills`, skillData);
    return { success: true, message: 'Skill added', skillId: response.data.skillId };
  } catch (error: unknown) {
    const err = error as ApiError;
    return { success: false, message: err.response?.data?.message || err.message || 'Failed to add skill' };
  }
};

export const updateEmployeeSkill = async (employeeId: string | number, skillId: string | number, skillData: Partial<SkillData>): Promise<EmployeeResponse> => {
  try {
    const response = await axios.put(`/employees/${employeeId}/skills/${skillId}`, skillData);
    return { success: true, message: 'Skill updated' };
  } catch (error: unknown) {
    const err = error as ApiError;
    return { success: false, message: err.response?.data?.message || err.message || 'Failed to update skill' };
  }
};

export const deleteEmployeeSkill = async (employeeId: string | number, skillId: string | number): Promise<EmployeeResponse> => {
  try {
    await axios.delete(`/employees/${employeeId}/skills/${skillId}`);
    return { success: true };
  } catch (error: unknown) {
    const err = error as ApiError;
    return { success: false, message: err.response?.data?.message || err.message || 'Failed to delete skill' };
  }
};

// ==========================================
// EMPLOYEE EDUCATION
// ==========================================

export const fetchEmployeeEducation = async (employeeId: string | number): Promise<EmployeeResponse> => {
  try {
    const response = await axios.get(`/employees/${employeeId}/education`);
    return { success: true, education: response.data.education };
  } catch (error: unknown) {
    return { success: false, education: [] };
  }
};

export const addEmployeeEducation = async (employeeId: string | number, educationData: EducationData): Promise<EmployeeResponse> => {
  try {
    const response = await axios.post(`/employees/${employeeId}/education`, educationData);
    return { success: true, message: 'Education added', educationId: response.data.educationId };
  } catch (error: unknown) {
    const err = error as ApiError;
    return { success: false, message: err.response?.data?.message || err.message || 'Failed to add education' };
  }
};

export const updateEmployeeEducation = async (employeeId: string | number, educationId: string | number, educationData: Partial<EducationData>): Promise<EmployeeResponse> => {
  try {
    const response = await axios.put(`/employees/${employeeId}/education/${educationId}`, educationData);
    return { success: true, message: 'Education updated' };
  } catch (error: unknown) {
    const err = error as ApiError;
    return { success: false, message: err.response?.data?.message || err.message || 'Failed to update education' };
  }
};

export const deleteEmployeeEducation = async (employeeId: string | number, educationId: string | number): Promise<EmployeeResponse> => {
  try {
    await axios.delete(`/employees/${employeeId}/education/${educationId}`);
    return { success: true };
  } catch (error: unknown) {
    const err = error as ApiError;
    return { success: false, message: err.response?.data?.message || err.message || 'Failed to delete education' };
  }
};

// ==========================================
// EMPLOYEE EMERGENCY CONTACTS
// ==========================================

export const fetchEmployeeContacts = async (employeeId: string | number): Promise<EmployeeResponse> => {
  try {
    const response = await axios.get(`/employees/${employeeId}/contacts`);
    return { success: true, contacts: response.data.contacts };
  } catch (error: unknown) {
    return { success: false, contacts: [] };
  }
};

export const addEmployeeContact = async (employeeId: string | number, contactData: ContactData): Promise<EmployeeResponse> => {
  try {
    const response = await axios.post(`/employees/${employeeId}/contacts`, contactData);
    return { success: true, message: 'Contact added', contactId: response.data.contactId };
  } catch (error: unknown) {
    const err = error as ApiError;
    return { success: false, message: err.response?.data?.message || err.message || 'Failed to add contact' };
  }
};

export const updateEmployeeContact = async (employeeId: string | number, contactId: string | number, contactData: Partial<ContactData>): Promise<EmployeeResponse> => {
  try {
    const response = await axios.put(`/employees/${employeeId}/contacts/${contactId}`, contactData);
    return { success: true, message: 'Contact updated' };
  } catch (error: unknown) {
    const err = error as ApiError;
    return { success: false, message: err.response?.data?.message || err.message || 'Failed to update contact' };
  }
};

export const deleteEmployeeContact = async (employeeId: string | number, contactId: string | number): Promise<EmployeeResponse> => {
  try {
    await axios.delete(`/employees/${employeeId}/contacts/${contactId}`);
    return { success: true };
  } catch (error: unknown) {
    const err = error as ApiError;
    return { success: false, message: err.response?.data?.message || err.message || 'Failed to delete contact' };
  }
};


// ==========================================
// EMPLOYEE CUSTOM FIELDS
// ==========================================

export const addEmployeeCustomField = async (employeeId: string | number, fieldData: CustomFieldData): Promise<EmployeeResponse> => {
  try {
    const response = await axios.post(`/employees/${employeeId}/custom-fields`, fieldData);
    return { success: true, message: 'Custom field added', fieldId: response.data.fieldId };
  } catch (error: unknown) {
    const err = error as ApiError;
    return { success: false, message: err.response?.data?.message || err.message || 'Failed to add custom field' };
  }
};

export const updateEmployeeCustomField = async (employeeId: string | number, fieldId: string | number, fieldData: Partial<CustomFieldData>): Promise<EmployeeResponse> => {
  try {
    const response = await axios.put(`/employees/${employeeId}/custom-fields/${fieldId}`, fieldData);
    return { success: true, message: 'Custom field updated' };
  } catch (error: unknown) {
    const err = error as ApiError;
    return { success: false, message: err.response?.data?.message || err.message || 'Failed to update custom field' };
  }
};

export const deleteEmployeeCustomField = async (employeeId: string | number, fieldId: string | number): Promise<EmployeeResponse> => {
  try {
    await axios.delete(`/employees/${employeeId}/custom-fields/${fieldId}`);
    return { success: true };
  } catch (error: unknown) {
    const err = error as ApiError;
    return { success: false, message: err.response?.data?.message || err.message || 'Failed to delete custom field' };
  }
};

// EMPLOYEE DOCUMENTS

//utility functions
export const fetchEmployeeOptions = async (): Promise<EmployeeResponse> => {
    try {
        const response = await axios.get('/departments');
        const departments = response.data.departments; // Expecting { id, name }[]
        return {
            success: true,
            departments: departments.length > 0 ? departments : [{ id: 0, name: 'General' }],
            jobTitles: ['Developer', 'Manager', 'Accountant', 'Specialist', 'Analyst', 'Clerk', 'Officer', 'HR Officer']
        };
    } catch (e: unknown) {
         return {
            success: true,
            departments: [{ id: 0, name: 'General' }], // Fallback
            jobTitles: ['Developer', 'Manager', 'Accountant', 'Specialist', 'Analyst', 'Clerk', 'Officer']
        };
    }
};


// Next Step Increment
export const getNextStepIncrement = async (id: string | number): Promise<{ success: boolean; nextStepDate?: string | null; totalLwopDays?: number }> => {
    try {
        const response = await axios.get(`/step-increment/${id}/next`);
        return response.data;
    } catch (error: unknown) {
        return { success: false, nextStepDate: null };
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
    updateEmployeeSkill,
    deleteEmployeeSkill,
    fetchEmployeeEducation,
    addEmployeeEducation,
    updateEmployeeEducation,
    deleteEmployeeEducation,
    fetchEmployeeContacts,
    addEmployeeContact,
    updateEmployeeContact,
    deleteEmployeeContact,
    addEmployeeCustomField,
    updateEmployeeCustomField,
    deleteEmployeeCustomField,
    fetchEmployeeOptions,

    getNextStepIncrement
};
