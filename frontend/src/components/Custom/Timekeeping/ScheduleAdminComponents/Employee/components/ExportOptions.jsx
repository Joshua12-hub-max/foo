import { Download, FileText } from "lucide-react";

const ExportOptions = ({ isLoading, dataCount, onExportCSV, onExportPDF }) => (
  <div className="flex justify-between items-center mb-4">
    <div className="flex items-center space-x-3">
      <span className="text-sm font-semibold text-gray-800">Export Options:</span>
      <button
        onClick={onExportCSV}
        disabled={isLoading || dataCount === 0}
        className="text-green-700 flex items-center text-sm font-medium space-x-1 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Export to CSV"
      >
        <Download className="w-4 h-4" />
        <span>CSV</span>
      </button>
      <button
        onClick={onExportPDF}
        disabled={isLoading || dataCount === 0}
        className="text-red-700 flex items-center text-sm font-medium space-x-1 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Export to PDF"
      >
        <FileText className="w-4 h-4" />
        <span>PDF</span>
      </button>
    </div>
  </div>
);

export default ExportOptions;
