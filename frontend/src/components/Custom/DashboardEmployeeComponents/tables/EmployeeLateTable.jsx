import React from 'react';

const EmployeeLateTable = ({ onClose }) => {
  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">Employee Late Records</h3>
      <p>This is a placeholder for Employee Late Records.</p>
      <button 
        onClick={onClose} 
        className="mt-4 px-4 py-2 bg-[#F8F9FA] text-gray-700 rounded shadow-md hover:bg-gray-100"
      >
        Close
      </button>
    </div>
  );
};

export default EmployeeLateTable;
