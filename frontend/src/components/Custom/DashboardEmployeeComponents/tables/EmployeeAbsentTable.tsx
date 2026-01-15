import React from 'react';

interface EmployeeAbsentTableProps {
  onClose: () => void;
}

const EmployeeAbsentTable: React.FC<EmployeeAbsentTableProps> = ({ onClose }) => {
  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">Employee Absent Records</h3>
      <p>This is a placeholder for Employee Absent Records.</p>
      <button 
        onClick={onClose} 
        className="mt-4 px-4 py-2 bg-[#F8F9FA] text-gray-700 rounded shadow-md hover:bg-gray-100"
      >
        Close
      </button>
    </div>
  );
};

export default EmployeeAbsentTable;
