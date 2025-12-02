import { AlertCircle, Check, X } from "lucide-react";

export const BiometricsNotification = ({ type, message, onClose }) => {
  const styles = {
    error: "bg-red-50 border-red-500 text-red-700",
    success: "bg-green-50 border-[#274b46] text-green-700"
  };

  const Icon = type === "error" ? AlertCircle : Check;

  return (
    <div className={`${styles[type]} border-l-4 px-4 py-3 rounded mb-4 flex items-start gap-3 animate-slide-down`} role="alert">
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="font-medium capitalize">{type}</p>
        <p className="text-sm">{message}</p>
      </div>
      <button onClick={onClose} className={`hover:text-${type === 'error' ? 'red' : 'green'}-900`}>
        <X className="w-5 h-5" />
      </button>
    </div>
  );
};
