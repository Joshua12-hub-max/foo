import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUIStore } from '@/stores';

// Import components
import EmployeeDepartment from './MyDepartmentPage';
import EmployeeMemos from './MyMemosPage';

interface OutletContext {
  sidebarOpen?: boolean;
}

interface Tab {
  id: string;
  label: string;
}

const OrganizationalHubPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const sidebarOpen = useUIStore((state) => state.sidebarOpen);

    // Get active tab from URL hash or default to 'department'
    const [activeTab, setActiveTab] = useState<string>(() => {
        const hash = location.hash.replace('#', '');
        return ['department', 'memos'].includes(hash) ? hash : 'department';
    });

    useEffect(() => {
        const hash = location.hash.replace('#', '');
        if (['department', 'memos'].includes(hash)) {
            setActiveTab(hash);
        }
    }, [location.hash]);

    const handleTabChange = (tabId: string): void => {
        setActiveTab(tabId);
        navigate(`#${tabId}`);
    };

    const tabs: Tab[] = [
        { id: 'department', label: 'My Department' },
        { id: 'memos', label: 'My Memos' }
    ];

    return (
        <div className={`flex flex-col bg-white rounded-2xl shadow-sm border border-gray-200 p-6 w-full overflow-hidden transition-all duration-300 ${!sidebarOpen ? 'max-w-[1600px] xl:max-w-[88vw]' : 'max-w-[1400px] xl:max-w-[77vw]'}`}>
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-xl font-bold text-gray-800">Employee Portal</h1>
                    <p className="text-sm text-gray-500">Access your department information and official memos</p>
                </div>
            </div>

            {/* Segmented Tab Navigation */}
            <div className="bg-gray-100 p-1 rounded-xl mb-6 inline-flex gap-1 w-fit">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => handleTabChange(tab.id)}
                            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                                isActive 
                                    ? 'text-gray-900 bg-white shadow-sm' 
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Content Area */}
            <div className="w-full">
                {activeTab === 'department' && <EmployeeDepartment hideHeader={true} />}
                {activeTab === 'memos' && <EmployeeMemos hideHeader={true} />}
            </div>
        </div>
    );
};

export default OrganizationalHubPage;
