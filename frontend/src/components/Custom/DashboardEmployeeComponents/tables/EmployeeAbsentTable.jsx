import React from 'react';

const EmployeeAbsentTable = ({ onClose }) => {
  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">Employee Absent Records</h3>
      <p>This is a placeholder for Employee Absent Records.</p>
      <button 
        onClick={onClose} 
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Close
      </button>
    </div>
  );
};

export default EmployeeAbsentTable;
