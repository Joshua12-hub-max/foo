/**
 * Export buttons component for Department Reports
 * Simple text-link style matching existing design
 */
export const DepartmentReportsExportButtons = ({
  handleExportCSV,
  handleExportPDF,
  isLoading,
  dataLength
}) => {
  return (
    <div className="flex justify-between items-center mb-4">
      <div className="flex items-center space-x-4">
        <span className="text-sm font-semibold text-gray-800">Export Options:</span>
        <button
          onClick={handleExportCSV}
          disabled={isLoading || dataLength === 0}
          className="text-green-600 text-sm font-medium hover:text-green-700 hover:underline transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Export to Excel"
        >
          Excel
        </button>
        <button
          onClick={handleExportPDF}
          disabled={isLoading || dataLength === 0}
          className="text-red-600 text-sm font-medium hover:text-red-700 hover:underline transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Export to PDF"
        >
          PDF
        </button>
      </div>
      <div className="text-sm text-gray-600">
        {dataLength} department{dataLength !== 1 ? 's' : ''} found
      </div>
    </div>
  );
};

export default DepartmentReportsExportButtons;
