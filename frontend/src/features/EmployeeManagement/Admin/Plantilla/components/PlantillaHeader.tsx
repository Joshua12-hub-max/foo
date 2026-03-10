import React, { memo, ChangeEvent } from 'react';
import { Plus, Search } from 'lucide-react';

import { PlantillaSummary } from '../constants/plantillaConstants';

interface PlantillaHeaderProps {
  sidebarOpen?: boolean;
  onOpenGuide?: () => void;
  onCreateNew: () => void;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  selectedDept: string;
  setSelectedDept: (value: string) => void;
  departments: { id: number; name: string }[];
  hideHeader?: boolean;
  summary: PlantillaSummary;
  onExportPDF?: () => void;
  onExportExcel?: () => void;
}

const PlantillaHeader: React.FC<PlantillaHeaderProps> = ({ 
    sidebarOpen, 
    onOpenGuide, 
    onCreateNew, 
    searchTerm, 
    setSearchTerm,
    selectedDept, 
    setSelectedDept, 
    departments,
    summary,
    hideHeader = false,
    onExportPDF,
    onExportExcel,
}) => {
    return (
        <>
            {/* Header */}
            {!hideHeader && (
                <>
                    <div className="flex justify-between items-center mb-6">
                        <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-bold text-gray-800">Plantilla Management</h2>
                            {onOpenGuide && (
                                <button 
                                    onClick={onOpenGuide}
                                    className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded hover:bg-blue-200 transition-colors"
                                >
                                Guidelines 
                                </button>
                            )}
                        </div>
                        </div>
                        <div className="flex gap-2">
                        {onExportPDF && (
                            <button
                                onClick={onExportPDF}
                                className="bg-white text-rose-600 font-bold px-4 py-2 rounded-lg text-sm shadow border border-rose-100 hover:bg-rose-50 transition-all flex items-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                                Export PDF
                            </button>
                        )}
                        <button 
                            onClick={onCreateNew}
                            className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-sm transition-all active:scale-95 text-sm font-bold"
                        >
                            <Plus size={16} />
                            Add Position
                        </button>
                        </div>
                    </div>

                    <hr className="mb-6 border-[1px] border-gray-300" />
                </>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'Total Positions', value: summary.total, color: 'text-slate-900', bg: 'bg-slate-50' },
                    { label: 'Filled Positions', value: summary.filled, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Vacant Positions', value: summary.vacant, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'Vacancy Rate', value: `${summary.vacancyRate}%`, color: 'text-blue-600', bg: 'bg-blue-50' },
                ].map((stat, i) => (
                    <div key={i} className={`${stat.bg} p-4 rounded-xl border border-white/50 shadow-sm transition-transform hover:scale-[1.02]`}>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</div>
                        <div className={`text-xl font-black ${stat.color}`}>{stat.value}</div>
                    </div>
                ))}
            </div>

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
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
                </select>
            </div>
        </>
    );
};

export default memo(PlantillaHeader);
