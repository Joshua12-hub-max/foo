import { AlertCircle, CheckCircle, X } from 'lucide-react';

/**
 * ReportNotification Component
 * Renders success or error notifications for reports
 */
export const ReportNotification = ({ type, message, onClose }) => {
  if (!message) return null;

  const isError = type === 'error';
  const bgColor = isError ? 'bg-red-50' : 'bg-green-50';
  const borderColor = isError ? 'border-red-200' : 'border-green-200';
  const textColor = isError ? 'text-red-700' : 'text-green-700';
  const closeBtnColor = isError ? 'text-red-500 hover:text-red-700' : 'text-green-500 hover:text-green-700';
  const Icon = isError ? AlertCircle : CheckCircle;

  return (
    <div className={`mb-4 p-4 ${bgColor} border ${borderColor} rounded-lg ${textColor} flex justify-between items-center animate-in fade-in slide-in-from-top-4 duration-300`}>
      <div className="flex items-center gap-2">
        <Icon className="w-5 h-5" />
        <span className="font-medium">{message}</span>
      </div>
      <button 
        onClick={onClose} 
        className={`${closeBtnColor} transition-colors p-1 rounded-full hover:bg-black/5`}
        aria-label="Close notification"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
};

export default ReportNotification;
