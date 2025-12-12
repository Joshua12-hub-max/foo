export const AdminLeaveCreditTabs = ({ activeTab, onTabChange, pendingCount }) => {
  return (
    <div className="flex gap-4 mb-6">
      <button 
        onClick={() => onTabChange('credits')} 
        className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'credits' ? 'bg-gray-200 text-gray-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
      >
        Leave Credits
      </button>
      <button 
        onClick={() => onTabChange('requests')} 
        className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${activeTab === 'requests' ? 'bg-gray-200 text-gray-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
      >
        Credit Requests
        {pendingCount > 0 && <span className="px-2 py-0.5 bg-amber-500 text-white text-xs rounded-full">{pendingCount}</span>}
      </button>
    </div>
  );
};
