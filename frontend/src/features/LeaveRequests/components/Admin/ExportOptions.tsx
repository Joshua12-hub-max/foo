import React from 'react';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';

interface ExportOptionsProps {
  onExportCSV: () => void;
  onExportPDF: () => void;
  isExporting?: boolean;
}

const ExportOptions: React.FC<ExportOptionsProps> = ({ onExportCSV, onExportPDF, isExporting }) => {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onExportCSV}
        disabled={isExporting}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-teal-700 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors disabled:opacity-50"
      >
        <FileSpreadsheet size={16} />
        <span>CSV</span>
      </button>
      <button
        onClick={onExportPDF}
        disabled={isExporting}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-rose-700 bg-rose-50 rounded-lg hover:bg-rose-100 transition-colors disabled:opacity-50"
      >
        <FileText size={16} />
        <span>PDF</span>
      </button>
    </div>
  );
};

export default ExportOptions;
