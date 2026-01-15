import React from 'react';
import { Check } from 'lucide-react';

interface SuccessAlertProps {
  message: string | null;
}

const SuccessAlert: React.FC<SuccessAlertProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div className="bg-green-50 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded mb-4 flex items-start gap-3">
      <Check className="w-5 h-5 mt-0.5 flex-shrink-0" />
      <p>{message}</p>
    </div>
  );
};

export default SuccessAlert;
