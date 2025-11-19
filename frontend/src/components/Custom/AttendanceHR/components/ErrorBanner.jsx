//Para saan ba tong Notification banner "Explain:{''}"

import { AlertCircle,} from "lucide-react";

export const ErrorBanner = ({ error, onDismiss }) => {
  if (!error) return null;

  return (
    <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded mb-4 flex items-start gap-3" role="alert">
      <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="font-medium">Error</p>
        <p className="text-sm">{error}</p>
      </div>
      <button
        onClick={onDismiss}
        className="text-red-700 hover:text-red-900"
        aria-label="Dismiss error"
      >
        ×
      </button>
    </div>
  );
};

