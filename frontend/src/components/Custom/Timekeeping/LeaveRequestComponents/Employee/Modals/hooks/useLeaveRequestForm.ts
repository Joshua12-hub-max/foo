import { useState, useCallback } from 'react';
import { useAuth } from "@/hooks/useAuth";

interface LeaveRequestFormData {
  leaveType: string;
  isPaid: boolean;
  startDate: string;
  endDate: string;
  description: string;
  attachment: File | null;
}

interface LeaveRequestFormErrors {
  leaveType?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  attachment?: string;
  submit?: string;
}

/**
 * Custom hook for managing leave request form state and submission
 */
export const useLeaveRequestForm = () => {
  const { user, department: userDepartment } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<LeaveRequestFormErrors>({});

  const initialFormData: LeaveRequestFormData = {
    leaveType: '',
    isPaid: true,
    startDate: '',
    endDate: '',
    description: '',
    attachment: null,
  };

  const [formData, setFormData] = useState<LeaveRequestFormData>(initialFormData);

  // Calculate duration automatically
  const calculateDuration = useCallback((startDate: string, endDate: string) => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays > 0 ? diffDays : 0;
  }, []);

  const duration = calculateDuration(formData.startDate, formData.endDate);

  const handleChange = useCallback((field: keyof LeaveRequestFormData | 'submit', value: string | boolean | File | null) => {
    if (field === 'submit') {
        setErrors(prev => ({ ...prev, submit: typeof value === 'string' ? value : undefined }));
        return;
    }
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field as keyof LeaveRequestFormErrors]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [errors]);

  const handleFileChange = useCallback((file: File | null) => {
    if (!file) return null;

    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (file.size > maxSize) {
      return { error: `File exceeds 5MB limit` };
    }
    if (!allowedTypes.includes(file.type)) {
      return { error: `Invalid file type. Only PDF, JPG, PNG, DOCX allowed` };
    }

    handleChange('attachment', file);
    return { success: true };
  }, [handleChange]);

  const validate = useCallback(() => {
    const newErrors: LeaveRequestFormErrors = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!formData.leaveType) {
      newErrors.leaveType = 'Leave type is required';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    } else {
      const startDate = new Date(formData.startDate);
      if (startDate < today) {
        newErrors.startDate = 'Start date cannot be in the past';
      }
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    } else if (formData.startDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (end < start) {
        newErrors.endDate = 'End date must be on or after start date';
      }
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Reason for leave is required';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Reason must be at least 10 characters';
    }

    if (!formData.attachment) {
      newErrors.attachment = 'Supporting document is required';
    }

    return newErrors;
  }, [formData]);

  const resetForm = useCallback(() => {
    setFormData(initialFormData);
    setErrors({});
  }, []);

  return {
    formData,
    duration,
    isSubmitting,
    errors,
    user,
    userDepartment,
    handleChange,
    handleFileChange,
    validate,
    resetForm,
    setIsSubmitting,
    setErrors
  };
};
