import { AlertCircle } from 'lucide-react';

const ErrorAlert = ({ error, onDismiss }) => {
  if (!error) return null;

  return (
    <div 
      className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded mb-4 flex items-start gap-3 animate-slide-down" 
      role="alert" 
      aria-live="assertive"
    >
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
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

export default ErrorAlert;
