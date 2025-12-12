import axios from './axios';

//Employee CRUD
export const fetchEmployees = async (department = null) => {
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

export const fetchEmployeeProfile = async (id) => {
  try {
    const response = await axios.get(`/employees/${id}`);
    return { success: true, profile: response.data.employee };
  } catch (error) {
    return { success: false, profile: null };
  }
};

export const addEmployee = async (formData) => {
  try {
    const response = await axios.post('/employees', formData);
    return { success: true, message: response.data.message, id: response.data.employeeId };
  } catch (error) {
    return { success: false, message: error.response?.data?.message || 'Failed to add employee' };
  }
};

export const updateEmployee = async (id, formData) => {
  try {
    const response = await axios.put(`/employees/${id}`, formData);
    return { success: true, message: 'Employee updated successfully', data: response.data };
  } catch (error) {
    return { success: false, message: error.response?.data?.message || 'Failed to update employee' };
  }
};

export const deleteEmployee = async (id) => {
  try {
    const response = await axios.delete(`/employees/${id}`);
    return { success: true, message: response.data.message };
  } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to delete employee' };
  }
};

// Update own profile (for logged in user) - still uses auth route
export const updateMyProfile = async (formData) => {
  try {
    const response = await axios.post('/auth/profile', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return { success: true, message: 'Profile updated successfully', data: response.data.data };
  } catch (error) {
    return { success: false, message: error.response?.data?.message || 'Failed to update profile' };
  }
};


// EMPLOYEE SKILLS
export const fetchEmployeeSkills = async (employeeId) => {
  try {
    const response = await axios.get(`/employees/${employeeId}/skills`);
    return { success: true, skills: response.data.skills };
  } catch (error) {
    return { success: false, skills: [] };
  }
};

export const addEmployeeSkill = async (employeeId, skillData) => {
  try {
    const response = await axios.post(`/employees/${employeeId}/skills`, skillData);
    return { success: true, message: 'Skill added', skillId: response.data.skillId };
  } catch (error) {
    return { success: false, message: error.response?.data?.message || 'Failed to add skill' };
  }
};

export const deleteEmployeeSkill = async (employeeId, skillId) => {
  try {
    await axios.delete(`/employees/${employeeId}/skills/${skillId}`);
    return { success: true };
  } catch (error) {
    return { success: false, message: error.response?.data?.message || 'Failed to delete skill' };
  }
};

// ==========================================
// EMPLOYEE EDUCATION
// ==========================================

export const fetchEmployeeEducation = async (employeeId) => {
  try {
    const response = await axios.get(`/employees/${employeeId}/education`);
    return { success: true, education: response.data.education };
  } catch (error) {
    return { success: false, education: [] };
  }
};

export const addEmployeeEducation = async (employeeId, educationData) => {
  try {
    const response = await axios.post(`/employees/${employeeId}/education`, educationData);
    return { success: true, message: 'Education added', educationId: response.data.educationId };
  } catch (error) {
    return { success: false, message: error.response?.data?.message || 'Failed to add education' };
  }
};

export const deleteEmployeeEducation = async (employeeId, educationId) => {
  try {
    await axios.delete(`/employees/${employeeId}/education/${educationId}`);
    return { success: true };
  } catch (error) {
    return { success: false, message: error.response?.data?.message || 'Failed to delete education' };
  }
};

// ==========================================
// EMPLOYEE EMERGENCY CONTACTS
// ==========================================

export const fetchEmployeeContacts = async (employeeId) => {
  try {
    const response = await axios.get(`/employees/${employeeId}/contacts`);
    return { success: true, contacts: response.data.contacts };
  } catch (error) {
    return { success: false, contacts: [] };
  }
};

export const addEmployeeContact = async (employeeId, contactData) => {
  try {
    const response = await axios.post(`/employees/${employeeId}/contacts`, contactData);
    return { success: true, message: 'Contact added', contactId: response.data.contactId };
  } catch (error) {
    return { success: false, message: error.response?.data?.message || 'Failed to add contact' };
  }
};

export const deleteEmployeeContact = async (employeeId, contactId) => {
  try {
    await axios.delete(`/employees/${employeeId}/contacts/${contactId}`);
    return { success: true };
  } catch (error) {
    return { success: false, message: error.response?.data?.message || 'Failed to delete contact' };
  }
};

// ==========================================
// EMPLOYEE DOCUMENTS
// ==========================================

export const fetchEmployeeDocuments = async (employeeId) => {
  try {
    const response = await axios.get(`/employees/${employeeId}/documents`);
    return { success: true, documents: response.data.documents };
  } catch (error) {
    return { success: false, documents: [] };
  }
};

export const addEmployeeDocument = async (employeeId, documentData) => {
  try {
    const response = await axios.post(`/employees/${employeeId}/documents`, documentData);
    return { success: true, message: 'Document added', documentId: response.data.documentId };
  } catch (error) {
    return { success: false, message: error.response?.data?.message || 'Failed to add document' };
  }
};

export const deleteEmployeeDocument = async (employeeId, documentId) => {
  try {
    await axios.delete(`/employees/${employeeId}/documents/${documentId}`);
    return { success: true };
  } catch (error) {
    return { success: false, message: error.response?.data?.message || 'Failed to delete document' };
  }
};


//utility functions
export const fetchEmployeeOptions = async () => {
    try {
        const response = await axios.get('/departments');
        const departments = response.data.departments.map(d => d.name);
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
export const startFingerprintEnrollment = async (employeeId) => {
    try {
        const response = await axios.post('/biometrics/enroll', { employeeId });
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || "Enrollment failed";
    }
};

export const checkEnrollmentStatus = async (employeeId) => {
    try {
        const response = await axios.get(`/biometrics/status/${employeeId}`);
        return response.data;
    } catch (error) {
        return { isEnrolled: false };
    }
};