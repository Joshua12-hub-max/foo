import { RefreshCw, Plus } from 'lucide-react';

export const EmployeeLeaveCreditHeader = ({ onRefresh, onOpenModal }) => {
  return (
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-xl font-bold text-gray-800">Leave Credits</h2>
      <div className="flex gap-2">
        <button 
          onClick={onRefresh} 
          className="p-2 text-gray-600 hover:text-gray-800" 
          title="Refresh"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
        <button 
          onClick={onOpenModal} 
          className="flex items-center gap-1 px-3 py-2 bg-gray-200 text-gray-700 rounded shadow-md text-sm hover:bg-gray-200"
        >
          <Plus className="w-4 h-4" /> Request Credit
        </button>
      </div>
    </div>
  );
};
