import { AlertCircle, CheckCircle } from 'lucide-react';

export const EmployeeLeaveCreditNotification = ({ error, success }) => {
  return (
    <>
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />{error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 rounded flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />{success}
        </div>
      )}
    </>
  );
};
