import { Download, FileText } from 'lucide-react';

export const NotificationHistoryExportButtons = ({ 
  handleExportCSV, 
  handleExportPDF, 
  isLoading, 
  filteredDataLength 
}) => {
  return (
    <div className="flex items-center gap-4 mb-4">
      <span className="text-sm font-semibold text-gray-800">Export Options:</span>
      <button
        onClick={handleExportCSV}
        disabled={isLoading || filteredDataLength === 0}
        className="flex items-center gap-1 text-sm text-green-700 hover:text-green-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Export CSV"
      >
        <Download className="w-4 h-4" />
        CSV
      </button>
      <button
        onClick={handleExportPDF}
        disabled={isLoading || filteredDataLength === 0}
        className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Export PDF"
      >
        <FileText className="w-4 h-4" />
        PDF
      </button>
    </div>
  );
};
