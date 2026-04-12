import React from 'react';
import { ActiveTab } from '../Hooks/useApplicantFilters';

interface ApplicantTabsProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

const TABS: ActiveTab[] = ['All', 'Pending', 'Reviewed', 'Initial Interview', 'Final Interview', 'Hired', 'Archive'];

const ApplicantTabs: React.FC<ApplicantTabsProps> = ({ activeTab, setActiveTab }) => {
  return (
    <div className="flex justify-between w-full mb-6 border-b border-gray-200 overflow-x-auto">
      {TABS.map(tab => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`flex-1 pb-3 px-1 text-sm font-medium whitespace-nowrap transition-all duration-200 ${activeTab === tab ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
};

export default ApplicantTabs;
