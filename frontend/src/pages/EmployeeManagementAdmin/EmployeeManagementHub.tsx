import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUIStore } from '@/stores';
import { Plus } from 'lucide-react';

import DepartmentList, { DepartmentListRef } from '@/pages/EmployeeManagementAdmin/DepartmentListPage';
import PlantillaManagement, { PlantillaManagementRef } from '@/pages/EmployeeManagementAdmin/PlantillaManagementPage';
import EmployeeMemos, { AdminMemoPageRef } from '@/pages/EmployeeManagementAdmin/AdminMemoPage';
import InternalPoliciesPage from '@/pages/InternalPolicies/InternalPoliciesPage';

interface OutletContext {
  sidebarOpen?: boolean;
}

interface Tab {
  id: string;
  label: string;
}

const EmployeeManagementHub: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const sidebarOpen = useUIStore((state) => state.sidebarOpen);

    // Refs for calling child functions
    const departmentRef = useRef<DepartmentListRef>(null);
    const plantillaRef = useRef<PlantillaManagementRef>(null);
    const memoRef = useRef<AdminMemoPageRef>(null);

    // Get active tab from URL hash or default to 'departments'
    const [activeTab, setActiveTab] = useState<string>(() => {
        const hash = location.hash.replace('#', '');
        return ['departments', 'plantilla', 'memos', 'policies'].includes(hash) ? hash : 'departments';
    });

    useEffect(() => {
        const hash = location.hash.replace('#', '');
        if (['departments', 'plantilla', 'memos', 'policies'].includes(hash)) {
            setActiveTab(hash);
        }
    }, [location.hash]);

    const handleTabChange = (tabId: string): void => {
        setActiveTab(tabId);
        navigate(`#${tabId}`);
    };

    const handleAddClick = (): void => {
        if (activeTab === 'departments' && departmentRef.current) {
            departmentRef.current.openAddModal();
        } else if (activeTab === 'plantilla' && plantillaRef.current) {
            plantillaRef.current.openAddModal();
        } else if (activeTab === 'memos' && memoRef.current) {
            memoRef.current.openAddModal();
        }
    };

    const tabs: Tab[] = [
        { id: 'departments', label: 'Departments' },
        { id: 'plantilla', label: 'Plantilla' },
        { id: 'memos', label: 'Memos' },
        { id: 'policies', label: 'Policies' }
    ];

    const getAddButtonLabel = (): string => {
        switch (activeTab) {
            case 'departments': return 'Add Department';
            case 'plantilla': return 'New Position';
            case 'memos': return 'New Memo';
            default: return 'Add';
        }
    };

    return (
        <div className={`flex flex-col bg-white rounded-2xl shadow-sm border border-gray-200 p-6 w-full overflow-hidden transition-all duration-300 ${!sidebarOpen ? 'max-w-[1600px] xl:max-w-[88vw]' : 'max-w-[1400px] xl:max-w-[77vw]'}`}>
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-xl font-bold text-gray-800">Employee Management</h1>
                    <p className="text-sm text-gray-500">Manage your organization's workforce, departments, and plantilla</p>
                </div>

                {activeTab !== 'policies' && (
                <button 
                    onClick={handleAddClick}
                    className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-sm transition-all active:scale-95 text-sm font-bold"
                >
                    <Plus size={18} />
                    {getAddButtonLabel()}
                </button>
                )}
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
                {activeTab === 'departments' && <DepartmentList ref={departmentRef} hideHeader={true} />}
                {activeTab === 'plantilla' && <PlantillaManagement ref={plantillaRef} hideHeader={true} />}
                {activeTab === 'memos' && <EmployeeMemos ref={memoRef} hideHeader={true} />}
                {activeTab === 'policies' && <InternalPoliciesPage hideHeader={true} />}
            </div>
        </div>
    );
};

export default EmployeeManagementHub;
