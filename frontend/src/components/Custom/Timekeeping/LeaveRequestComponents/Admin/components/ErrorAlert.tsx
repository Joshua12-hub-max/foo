import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorAlertProps {
  message: string | null;
}


const ErrorAlert: React.FC<ErrorAlertProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded mb-4 flex items-start gap-3">
      <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
      <p>{message}</p>
    </div>
  );
};

export default ErrorAlert;
