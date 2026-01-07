import { Download, FileText } from "lucide-react";

export const PerformanceExportButtons = ({ 
  handleExportCSV, 
  handleExportPDF, 
  isLoading, 
  filteredDataLength 
}) => {
  return (
    <div className="flex justify-between items-center mb-4">
      <div className="flex items-center space-x-3">
        <span className="text-sm font-semibold text-gray-800">Export Profile:</span>
        <button
          onClick={handleExportPDF}
          disabled={isLoading || filteredDataLength === 0}
          className="text-red-700 flex items-center text-sm font-medium space-x-1 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Export to PDF"
        >
          <FileText className="w-4 h-4" />
          <span>PDF Export</span>
        </button>
      </div>
    </div>
  );
};
