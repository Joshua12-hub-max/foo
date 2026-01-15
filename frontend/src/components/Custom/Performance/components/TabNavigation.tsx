import React from 'react';

interface Tab {
  id: string | number;
  label: string;
}

interface TabNavigationProps {
  tabs: Tab[];
  activeTab: string | number;
  onTabChange: (tabId: string | number) => void;
}

// Improved type definition for the component to handle generic types if needed, 
// but for now strict types are fine.
const TabNavigation: React.FC<TabNavigationProps> = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div className="flex space-x-1 bg-gray-200/50 p-1 rounded-xl mb-6 border border-gray-200">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`
            flex-1 py-2.5 px-4 rounded-lg text-sm font-bold transition-all duration-200
            ${activeTab === tab.id 
              ? 'bg-white text-gray-800 shadow-sm border border-gray-200' 
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
            }
          `}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default TabNavigation;
