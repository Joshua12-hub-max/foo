import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import { Plus } from 'lucide-react';

// Import components
import EmployeeList from './EmployeeDirectoryPage';
import DepartmentList from './DepartmentListPage';
import PlantillaManagement from './PlantillaManagementPage';
import EmployeeMemos from './AdminMemoPage';

const EmployeeManagementHub = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const outletContext = useOutletContext() || { sidebarOpen: true };
    const { sidebarOpen = true } = outletContext;

    // Refs for calling child functions
    const employeeRef = useRef();
    const departmentRef = useRef();
    const plantillaRef = useRef();
    const memoRef = useRef();

    // Get active tab from URL hash or default to 'departments'
    const [activeTab, setActiveTab] = useState(() => {
        const hash = location.hash.replace('#', '');
        return ['departments', 'employees', 'plantilla', 'memos'].includes(hash) ? hash : 'departments';
    });

    useEffect(() => {
        const hash = location.hash.replace('#', '');
        if (['departments', 'employees', 'plantilla', 'memos'].includes(hash)) {
            setActiveTab(hash);
        }
    }, [location.hash]);

    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        navigate(`#${tabId}`);
    };

    const handleAddClick = () => {
        if (activeTab === 'employees' && employeeRef.current) {
            employeeRef.current.openAddModal();
        } else if (activeTab === 'departments' && departmentRef.current) {
            departmentRef.current.openAddModal();
        } else if (activeTab === 'plantilla' && plantillaRef.current) {
            plantillaRef.current.openAddModal();
        } else if (activeTab === 'memos' && memoRef.current) {
            memoRef.current.openAddModal();
        }
    };

    const tabs = [
        { id: 'departments', label: 'Departments' },
        { id: 'employees', label: 'Employees' },
        { id: 'plantilla', label: 'Plantilla' },
        { id: 'memos', label: 'Memos' }
    ];

    const getAddButtonLabel = () => {
        switch (activeTab) {
            case 'employees': return 'Onboard Member';
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

                <button 
                    onClick={handleAddClick}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition-all active:scale-95 text-sm font-semibold"
                >
                    <Plus size={18} />
                    {getAddButtonLabel()}
                </button>
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
                {activeTab === 'employees' && <EmployeeList ref={employeeRef} hideHeader={true} />}
                {activeTab === 'plantilla' && <PlantillaManagement ref={plantillaRef} hideHeader={true} />}
                {activeTab === 'memos' && <EmployeeMemos ref={memoRef} hideHeader={true} />}
            </div>
        </div>
    );
};

export default EmployeeManagementHub;
