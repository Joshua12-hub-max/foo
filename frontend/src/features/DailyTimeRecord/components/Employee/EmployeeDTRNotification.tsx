import React from "react";
import { AlertCircle, Check } from "lucide-react";

interface EmployeeDTRNotificationProps {
  type: "error" | "success";
  message: string;
  onClose: () => void;
}

export const EmployeeDTRNotification: React.FC<EmployeeDTRNotificationProps> = ({ 
  type, 
  message, 
  onClose 
}) => {
  const isError = type === "error";
  const bgColor = isError ? "bg-red-50" : "bg-green-50";
  const borderColor = isError ? "border-red-500" : "border-green-500";
  const textColor = isError ? "text-red-700" : "text-green-700";
  const hoverColor = isError ? "hover:text-red-900" : "hover:text-green-900";
  const Icon = isError ? AlertCircle : Check;
  const title = isError ? "Error" : "Success";
  const ariaLive = isError ? "assertive" : "polite";

  return (
    <div 
      className={`${bgColor} border-l-4 ${borderColor} ${textColor} px-4 py-3 rounded mb-4 flex items-start gap-3 animate-slide-down`} 
      role="alert" 
      aria-live={ariaLive}
    >
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="font-medium">{title}</p>
        <p className="text-sm">{message}</p>
      </div>
      <button
        onClick={onClose}
        className={`${textColor} ${hoverColor}`}
        aria-label={`Dismiss ${type} message`}
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};
