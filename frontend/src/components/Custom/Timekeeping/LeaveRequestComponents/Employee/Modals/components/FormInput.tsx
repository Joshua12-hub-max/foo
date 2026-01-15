import React from 'react';

interface FormInputProps {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}

export const FormInput: React.FC<FormInputProps> = ({ label, error, required, children }) => {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
};

export default FormInput;
