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
      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1 ml-1">{error}</p>}
    </div>
  );
};

export default FormInput;
