import React from 'react';
import { ActiveTab } from '../Hooks/useApplicantFilters';

interface ApplicantTabsProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

const TABS: ActiveTab[] = ['All', 'Pending', 'Reviewed', 'Interview', 'Hired', 'Archive', 'Inquiries', 'Chat'];

const ApplicantTabs: React.FC<ApplicantTabsProps> = ({ activeTab, setActiveTab }) => {
  return (
    <div className="flex justify-between w-full mb-6 border-b border-gray-200">
      {TABS.map(tab => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`flex-1 pb-2 px-1 text-sm font-medium transition-colors ${activeTab === tab ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
};

export default ApplicantTabs;
