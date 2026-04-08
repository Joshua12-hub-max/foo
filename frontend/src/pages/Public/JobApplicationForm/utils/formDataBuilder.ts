import type { JobApplicationSchema } from '@/schemas/recruitment';

export const buildApplicationFormData = (data: JobApplicationSchema): FormData => {
  const formData = new FormData();

  // Add simple fields
  Object.entries(data).forEach(([key, value]) => {
    if (value instanceof File) {
      formData.append(key, value);
    } else if (typeof value === 'object' && value !== null && !(value instanceof File)) {
      formData.append(key, JSON.stringify(value));
    } else if (value !== undefined && value !== null && value !== '') {
      formData.append(key, String(value));
    }
  });

  return formData;
};

export const parseFormDataValue = (value: unknown): unknown => {
  if (typeof value === 'string') {
    // Try to parse as JSON if it looks like an object or array
    if ((value.startsWith('{') && value.endsWith('}')) || (value.startsWith('[') && value.endsWith(']'))) {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
  }
  return value;
};
