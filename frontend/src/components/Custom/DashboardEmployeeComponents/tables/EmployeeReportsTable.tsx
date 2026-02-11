import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText } from 'lucide-react';

interface EmployeeReportsTableProps {
  onClose: () => void;
}

const EmployeeReportsTable: React.FC<EmployeeReportsTableProps> = ({ onClose }) => {
  const navigate = useNavigate();

  return (
    <div className="p-4 h-full flex flex-col items-center justify-center text-center">
      <div className="bg-blue-50 p-4 rounded-full mb-4">
        <FileText className="w-10 h-10 text-blue-600" />
      </div>
      <h3 className="text-xl font-bold text-gray-800 mb-2">Reports Overview</h3>
      <p className="text-gray-600 max-w-sm mb-6">
        You can generate and download your Daily Time Records (DTR) and leave history in the respective sections.
      </p>
      
      <div className="flex gap-4">
        <button 
          onClick={() => navigate('/employee-dashboard/daily-time-record')}
          className="px-6 py-2 bg-gray-900 text-white rounded-xl shadow-lg hover:bg-gray-800 transition-all font-semibold"
        >
          Go to DTR
        </button>
        <button 
          onClick={onClose} 
          className="px-6 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all font-semibold"
        >
          Back
        </button>
      </div>
    </div>
  );
};

export default EmployeeReportsTable;
