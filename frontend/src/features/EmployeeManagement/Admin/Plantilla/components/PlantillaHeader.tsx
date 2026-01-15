import React, { memo, ChangeEvent } from 'react';
import { Plus, Search } from 'lucide-react';

interface PlantillaHeaderProps {
  sidebarOpen?: boolean;
  onOpenGuide: () => void;
  onOpenCreate: () => void;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  selectedDept: string;
  setSelectedDept: (value: string) => void;
  departments: string[];
  hideHeader?: boolean;
}

const PlantillaHeader: React.FC<PlantillaHeaderProps> = ({ 
    sidebarOpen, 
    onOpenGuide, 
    onOpenCreate, 
    searchTerm, 
    setSearchTerm,
    selectedDept, 
    setSelectedDept, 
    departments,
    hideHeader = false
}) => {
    return (
        <>
            {/* Header */}
            {!hideHeader && (
                <>
                    <div className="flex justify-between items-center mb-6">
                        <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-bold text-gray-800">Plantilla</h2>
                            <button 
                            onClick={onOpenGuide}
                            className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded hover:bg-blue-200 transition-colors"
                            >
                            Guidelines 
                            </button>
                        </div>
                        </div>
                        <div className="flex gap-2">
                        <button 
                            onClick={onOpenCreate}
                            className="bg-gray-200 text-gray-700 font-bold px-4 py-2 rounded-lg text-sm shadow-md hover:bg-gray-300 transition-all flex items-center gap-2"
                        >
                            <Plus size={16} />
                            Add Position
                        </button>
                        </div>
                    </div>

                    <hr className="mb-6 border-[1px] border-gray-300" />
                </>
            )}

            {/* Filters */}
            <div className="bg-[#F8F9FA] p-4 rounded-lg shadow-md mb-6 flex flex-wrap gap-4 items-center">
                <div className="flex-1 min-w-[200px] relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                    type="text" 
                    placeholder="Search position or item number..." 
                    className="w-full pl-10 bg-white border border-gray-200 rounded-lg shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
                    value={searchTerm}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                />
                </div>
                <select 
                className="bg-white border border-gray-200 rounded-lg shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 cursor-pointer"
                value={selectedDept}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedDept(e.target.value)}
                >
                <option value="All">All Departments</option>
                {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                ))}
                </select>
            </div>
        </>
    );
};

export default memo(PlantillaHeader);
