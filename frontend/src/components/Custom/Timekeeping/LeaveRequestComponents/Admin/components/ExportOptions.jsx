import { Download, FileText } from 'lucide-react';

/**
 * Export options component
 */
const ExportOptions = ({ onExportCSV, onExportPDF }) => {
  return (
    <div className="flex items-center space-x-3 mb-6">
      <span className="text-sm font-medium text-gray-700">Export Options:</span>
      <button
        onClick={onExportCSV}
        className="text-green-700 text-sm font-medium flex items-center gap-1 hover:text-gray-800 transition-colors"
      >
        <Download className="w-4 h-4" /> CSV
      </button>
      <button
        onClick={onExportPDF}
        className="text-red-700 text-sm font-medium flex items-center gap-1 hover:text-red-800 transition-colors"
      >
        <FileText className="w-4 h-4" /> PDF
      </button>
    </div>
  );
};

export default ExportOptions;
