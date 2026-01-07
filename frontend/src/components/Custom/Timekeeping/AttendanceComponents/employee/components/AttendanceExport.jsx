import React from 'react';
import { Download } from 'lucide-react';
import { useNotification, ToastNotification } from '@/components/Custom/EmployeeManagement/Admin';

const AttendanceExport = ({ data, title }) => {
  const { notification, showNotification } = useNotification();
  
  const handleExportCSV = () => {
    showNotification("CSV Export coming soon!", "success");
  };

  const handleExportPDF = () => {
    showNotification("PDF Export coming soon!", "success");
  };

  return (
    <div className="flex items-center gap-4 mb-4">
      <ToastNotification notification={notification} />
      <span className="text-sm font-semibold text-gray-800">Export Options:</span>
      
      <button
        onClick={handleExportCSV}
        className="flex items-center gap-1 text-sm text-green-600 hover:text-green-700 font-medium transition-colors"
      >
        <Download size={16} />
        <span>CSV</span>
      </button>

      <button
        onClick={handleExportPDF}
        className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 font-medium transition-colors"
      >
        <Download size={16} />
        <span>PDF</span>
      </button>
    </div>
  );
};

export default AttendanceExport;
