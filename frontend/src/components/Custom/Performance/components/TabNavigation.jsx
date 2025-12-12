/**
 * TabNavigation Component
 * Tab navigation for pending/completed reviews
 */

const TabNavigation = ({
  activeTab,
  onTabChange,
  pendingCount,
  completedCount
}) => {
  const tabs = [
    { id: 'pending', label: 'Pending', count: pendingCount },
    { id: 'completed', label: 'Completed', count: completedCount }
  ];

  return (
    <div className="flex gap-2 border-b border-gray-300 mb-6">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === tab.id 
              ? 'border-gray-800 text-gray-800' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          {tab.label} ({tab.count})
        </button>
      ))}
    </div>
  );
};

export default TabNavigation;
