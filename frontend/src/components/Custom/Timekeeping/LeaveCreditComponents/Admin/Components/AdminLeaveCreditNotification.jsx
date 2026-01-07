import { AlertCircle, Check } from 'lucide-react';

export const AdminLeaveCreditNotification = ({ error, successMessage }) => {
  return (
    <>
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />{error}
        </div>
      )}
      {successMessage && (
        <div className="bg-green-50 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded mb-4 flex items-center gap-2">
          <Check className="w-5 h-5" />{successMessage}
        </div>
      )}
    </>
  );
};
