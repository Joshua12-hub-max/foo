import { Check } from "lucide-react";

export const SuccessBanner = ({ message, onDismiss }) => {
  if (!message) return null;

  return (
    <div className="bg-green-50 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded mb-4 flex items-start gap-3" role="alert">
      <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="font-medium">Success</p>
        <p className="text-sm">{message}</p>
      </div>
      <button
        onClick={onDismiss}
        className="text-green-700 hover:text-green-900"
        aria-label="Dismiss success message"
      >
        ×
      </button>
    </div>
  );
};