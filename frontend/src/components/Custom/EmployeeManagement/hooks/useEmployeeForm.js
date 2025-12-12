import { useState, useCallback } from 'react';
import { DEFAULT_ADD_FORM, DEFAULT_EDIT_FORM, DEFAULT_PROFILE_FORM } from '../constants/employeeConstants';

/**
 * Custom hook for managing employee form state
 * Supports government worker fields
 * @param {string} formType - Type of form: 'add', 'edit', or 'profile'
 * @returns {Object} Form state and control functions
 */
export const useEmployeeForm = (formType = 'add') => {
  const getDefaultForm = () => {
    switch (formType) {
      case 'edit':
        return { ...DEFAULT_EDIT_FORM };
      case 'profile':
        return { ...DEFAULT_PROFILE_FORM };
      default:
        return { ...DEFAULT_ADD_FORM };
    }
  };

  const [formData, setFormData] = useState(getDefaultForm());

  /**
   * Update a single form field
   * @param {string} field - Field name to update
   * @param {any} value - New value for the field
   */
  const updateField = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  /**
   * Handle input change event
   * @param {Event} e - Input change event
   */
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  /**
   * Reset form to default values
   */
  const resetForm = useCallback(() => {
    setFormData(getDefaultForm());
  }, [formType]);

  /**
   * Set form data from an existing employee object
   * Supports all government worker fields
   * @param {Object} employee - Employee data object
   */
  const setFromEmployee = useCallback((employee) => {
    if (!employee) return;
    
    if (formType === 'edit') {
      setFormData({
        // Basic info
        first_name: employee.first_name || '',
        last_name: employee.last_name || '',
        email: employee.email || '',
        department: employee.department || '',
        job_title: employee.job_title || '',
        role: employee.role || 'employee',
        employment_status: employee.employment_status || 'Active',
        // Personal info
        birth_date: employee.birth_date || '',
        gender: employee.gender || '',
        civil_status: employee.civil_status || '',
        nationality: employee.nationality || 'Filipino',
        blood_type: employee.blood_type || '',
        height_cm: employee.height_cm || '',
        weight_kg: employee.weight_kg || '',
        phone_number: employee.phone_number || '',
        address: employee.address || '',
        permanent_address: employee.permanent_address || '',
        emergency_contact: employee.emergency_contact || '',
        emergency_contact_number: employee.emergency_contact_number || '',
        // Government IDs
        sss_number: employee.sss_number || '',
        philhealth_number: employee.philhealth_number || '',
        pagibig_number: employee.pagibig_number || '',
        tin_number: employee.tin_number || '',
        gsis_number: employee.gsis_number || '',
        // Employment details
        salary_grade: employee.salary_grade || '',
        step_increment: employee.step_increment || 1,
        appointment_type: employee.appointment_type || '',
        item_number: employee.item_number || '',
        station: employee.station || '',
        position_title: employee.position_title || ''
      });
    } else if (formType === 'profile') {
      setFormData({
        first_name: employee.first_name || '',
        last_name: employee.last_name || '',
        email: employee.email || '',
        phone_number: employee.phone_number || '',
        address: employee.address || ''
      });
    }
  }, [formType]);

  return {
    formData,
    setFormData,
    updateField,
    handleChange,
    resetForm,
    setFromEmployee
  };
};

export default useEmployeeForm;
