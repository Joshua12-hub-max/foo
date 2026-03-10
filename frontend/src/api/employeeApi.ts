import axios from './axios';
import { isApiError } from '../utils';
import { 
    Employee, 
    Skill, 
    Education, 
    EmergencyContact, 
    CustomField, 
    ApiError, 
    SkillData, 
    EducationData, 
    ContactData, 
    CustomFieldData,
    ApiResponse 
} from '../types';

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


import { UpdateEmployeeInput } from '../schemas/employeeSchema';

//Employee CRUD
export const fetchEmployees = async (deptParams: { department?: string | null, departmentId?: number | null } = {}): Promise<EmployeeResponse> => {
  const { department, departmentId } = deptParams;
  
  try {
    const response = await axios.get('/employees', { 
        params: { 
            departmentId,
            department: department && department !== 'All Departments' ? department : undefined
        }
    });
    const employees = response.data.employees;
    
    // Type guard/check
    if (!Array.isArray(employees)) {
        return { success: false, employees: [] };
    }
    
    return { success: true, employees };
  } catch (error: unknown) {
    return { success: false, employees: [] };
  }
};

export const fetchEmployeeProfile = async (id: string | number): Promise<EmployeeResponse> => {
  try {
    const response = await axios.get(`/employees/${id}`);
    const employee = response.data.employee;
    return { success: true, profile: employee as Employee };
  } catch (error: unknown) {
    return { success: false, profile: undefined };
  }
};

export const addEmployee = async (formData: FormData | UpdateEmployeeInput): Promise<EmployeeResponse> => {
  try {
    const response = await axios.post('/employees', formData);
    return { success: true, message: response.data.message, id: response.data.employeeId };
  } catch (error: unknown) {
    let message = 'Failed to add employee';
    if (isApiError(error)) {
        message = error.response?.data?.message || error.message || message;
    }
    return { success: false, message };
  }
};

export const deleteEmployee = async (id: string | number): Promise<EmployeeResponse> => {
  try {
    const response = await axios.delete(`/employees/${id}`);
    return { success: true, message: response.data.message };
  } catch (error: unknown) {
      let message = 'Failed to delete employee';
      if (isApiError(error)) {
        message = error.response?.data?.message || error.message || message;
      }
      return { success: false, message };
  }
};

export const updateEmployee = async (id: string | number, data: UpdateEmployeeInput): Promise<EmployeeResponse> => {
  try {
    const response = await axios.put(`/employees/${id}`, data);
    return { success: true, message: response.data.message };
  } catch (error: unknown) {
    console.error('Update Employee Error:', error);
    let message = 'Failed to update employee';
    if (isApiError(error)) {
        message = error.response?.data?.message || error.message || message;
    }
    return { success: false, message };
  }
};

// Revert employee status (Admin only) - For reversing memo effects
export const revertEmployeeStatus = async (id: string | number, newStatus: string = 'Active', reason: string = ''): Promise<EmployeeResponse> => {
  try {
    const response = await axios.patch(`/employees/${id}/revert-status`, { 
      newStatus, 
      reason 
    });
    return { 
      success: true, 
      message: response.data.message,
      previousStatus: response.data.previousStatus,
      newStatus: response.data.newStatus
    };
  } catch (error: unknown) {
    let message = 'Failed to revert employee status';
    if (isApiError(error)) {
        message = error.response?.data?.message || error.message || message;
    }
    return { success: false, message };
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
    let message = 'Failed to update profile';
    if (isApiError(error)) {
        message = error.response?.data?.message || error.message || message;
    }
    return { success: false, message };
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
    let message = 'Failed to add skill';
    if (isApiError(error)) {
        message = error.response?.data?.message || error.message || message;
    }
    return { success: false, message };
  }
};

export const updateEmployeeSkill = async (employeeId: string | number, skillId: string | number, skillData: Partial<SkillData>): Promise<EmployeeResponse> => {
  try {
    const response = await axios.put(`/employees/${employeeId}/skills/${skillId}`, skillData);
    return { success: true, message: 'Skill updated' };
  } catch (error: unknown) {
    let message = 'Failed to update skill';
    if (isApiError(error)) {
        message = error.response?.data?.message || error.message || message;
    }
    return { success: false, message };
  }
};

export const deleteEmployeeSkill = async (employeeId: string | number, skillId: string | number): Promise<EmployeeResponse> => {
  try {
    await axios.delete(`/employees/${employeeId}/skills/${skillId}`);
    return { success: true };
  } catch (error: unknown) {
    let message = 'Failed to delete skill';
    if (isApiError(error)) {
        message = error.response?.data?.message || error.message || message;
    }
    return { success: false, message };
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
    let message = 'Failed to add education';
    if (isApiError(error)) {
        message = error.response?.data?.message || error.message || message;
    }
    return { success: false, message };
  }
};

export const updateEmployeeEducation = async (employeeId: string | number, educationId: string | number, educationData: Partial<EducationData>): Promise<EmployeeResponse> => {
  try {
    const response = await axios.put(`/employees/${employeeId}/education/${educationId}`, educationData);
    return { success: true, message: 'Education updated' };
  } catch (error: unknown) {
    let message = 'Failed to update education';
    if (isApiError(error)) {
        message = error.response?.data?.message || error.message || message;
    }
    return { success: false, message };
  }
};

export const deleteEmployeeEducation = async (employeeId: string | number, educationId: string | number): Promise<EmployeeResponse> => {
  try {
    await axios.delete(`/employees/${employeeId}/education/${educationId}`);
    return { success: true };
  } catch (error: unknown) {
    let message = 'Failed to delete education';
    if (isApiError(error)) {
        message = error.response?.data?.message || error.message || message;
    }
    return { success: false, message };
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
    let message = 'Failed to add contact';
    if (isApiError(error)) {
        message = error.response?.data?.message || error.message || message;
    }
    return { success: false, message };
  }
};

export const updateEmployeeContact = async (employeeId: string | number, contactId: string | number, contactData: Partial<ContactData>): Promise<EmployeeResponse> => {
  try {
    const response = await axios.put(`/employees/${employeeId}/contacts/${contactId}`, contactData);
    return { success: true, message: 'Contact updated' };
  } catch (error: unknown) {
    let message = 'Failed to update contact';
    if (isApiError(error)) {
        message = error.response?.data?.message || error.message || message;
    }
    return { success: false, message };
  }
};

export const deleteEmployeeContact = async (employeeId: string | number, contactId: string | number): Promise<EmployeeResponse> => {
  try {
    await axios.delete(`/employees/${employeeId}/contacts/${contactId}`);
    return { success: true };
  } catch (error: unknown) {
    let message = 'Failed to delete contact';
    if (isApiError(error)) {
        message = error.response?.data?.message || error.message || message;
    }
    return { success: false, message };
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
    let message = 'Failed to add custom field';
    if (isApiError(error)) {
        message = error.response?.data?.message || error.message || message;
    }
    return { success: false, message };
  }
};

export const updateEmployeeCustomField = async (employeeId: string | number, fieldId: string | number, fieldData: Partial<CustomFieldData>): Promise<EmployeeResponse> => {
  try {
    const response = await axios.put(`/employees/${employeeId}/custom-fields/${fieldId}`, fieldData);
    return { success: true, message: 'Custom field updated' };
  } catch (error: unknown) {
    let message = 'Failed to update custom field';
    if (isApiError(error)) {
        message = error.response?.data?.message || error.message || message;
    }
    return { success: false, message };
  }
};

export const deleteEmployeeCustomField = async (employeeId: string | number, fieldId: string | number): Promise<EmployeeResponse> => {
  try {
    await axios.delete(`/employees/${employeeId}/custom-fields/${fieldId}`);
    return { success: true };
  } catch (error: unknown) {
    let message = 'Failed to delete custom field';
    if (isApiError(error)) {
        message = error.response?.data?.message || error.message || message;
    }
    return { success: false, message };
  }
};

// EMPLOYEE DOCUMENTS

//utility functions
export const fetchEmployeeOptions = async (): Promise<EmployeeResponse> => {
    try {
        const response = await axios.get('/departments');
        const depts = response.data.departments; 
        
        let departmentsList: { id: number; name: string }[] = [{ id: 0, name: 'General' }];
        if (Array.isArray(depts) && depts.length > 0) {
            departmentsList = depts;
        }

        return {
            success: true,
            departments: departmentsList,
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

    getNextStepIncrement,
    
    // Generic PDS Section Updates
    updatePdsSection: async (employeeId: string | number, section: string, items: unknown[]): Promise<ApiResponse<unknown>> => {
        try {
            const response = await axios.put(`/pds/${section}`, { items, employeeId });
            return { success: true, data: response.data, message: response.data.message };
        } catch (error: unknown) {
            let message = `Failed to update ${section}`;
            if (isApiError(error)) {
                message = error.response?.data?.message || error.message || message;
            }
            return { success: false, data: null, message };
        }
    }
};
