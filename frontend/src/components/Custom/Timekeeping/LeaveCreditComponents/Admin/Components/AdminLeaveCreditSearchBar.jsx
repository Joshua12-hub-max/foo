import { Search, Plus } from 'lucide-react';

export const AdminLeaveCreditSearchBar = ({ searchTerm, onSearchChange, activeTab, onOpenModal }) => {
  return (
    <div className="flex justify-between items-center mb-6 bg-gray-50 p-4 rounded-lg shadow-md">
      <div className="relative w-80">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400"/>
        <input 
          type="text" 
          value={searchTerm} 
          onChange={(e) => onSearchChange(e.target.value)} 
          placeholder="Search..." 
          className="pl-10 pr-4 py-2 bg-[#F8F9FA] border border-gray-300 rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
        />
      </div>
      {activeTab === 'credits' && (
        <button 
          onClick={onOpenModal} 
          className="bg-gray-200 text-gray-700 font-medium px-4 py-2 rounded-lg text-sm hover:bg-gray-300 flex items-center gap-2 shadow-md"
        >
          <Plus size={18}/>Add Credit
        </button>
      )}
    </div>
  );
};
