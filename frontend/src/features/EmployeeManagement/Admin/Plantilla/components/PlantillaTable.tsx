import React, { memo } from 'react';
import { SquarePen, Trash2, UserPlus, UserMinus, History, Printer } from 'lucide-react';

import { type Position } from '@api/plantillaApi';

interface PlantillaTableProps {
  loading: boolean;
  error?: string | null;
  positions: Position[];
  onAssign: (pos: Position) => void;
  onVacate: (pos: Position) => void;
  onViewHistory: (pos: Position) => void;
  onEdit: (pos: Position) => void;
  onDelete: (id: number) => void;
}

const PlantillaTable: React.FC<PlantillaTableProps> = ({ 
    loading, 
    error = null, 
    positions, 
    onAssign, 
    onVacate, 
    onViewHistory, 
    onEdit, 
    onDelete,
}) => {
    return (
        <div className="flex-1 overflow-hidden rounded-xl bg-[#F8F9FA] p-1 relative min-h-[400px]">
            {loading ? (
            <div className="w-full h-64 flex items-center justify-center bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-500 text-sm font-medium">Loading positions...</p>
                </div>
            </div>
            ) : error ? (
            <div className="w-full h-64 flex items-center justify-center bg-white rounded-xl shadow-sm border border-gray-100">
                <p className="text-red-500 font-medium">{error}</p>
            </div>
            ) : (
            <div className="overflow-x-auto bg-gray-50 rounded-lg">
                <table className="w-full min-w-[1000px]">
                <thead className="bg-gray-200 shadow-md text-gray-700">
                    <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">Item No.</th>
                    <th className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">Position Title</th>
                    <th className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">SG</th>
                    <th className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">Department</th>
                    <th className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">Area</th>
                    <th className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">Incumbent</th>
                    <th className="px-6 py-4 text-center text-sm font-bold tracking-wide whitespace-nowrap">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {positions.length > 0 ? positions.map(pos => {
                      if (!pos) return null;
                      return (
                    <tr key={pos.id} className="hover:bg-[#F8F9FA] hover:shadow-xl transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 text-[11px] font-bold rounded-full border transition-all ${
                                pos.isVacant 
                                    ? 'bg-transparent text-gray-400 border-gray-200 group-hover:bg-amber-50 group-hover:text-amber-700 group-hover:border-amber-100' 
                                    : 'bg-transparent text-gray-400 border-gray-200 group-hover:bg-green-50 group-hover:text-green-700 group-hover:border-green-100'
                            }`}>
                                {pos.isVacant ? 'VACANT' : 'FILLED'}
                            </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-700 whitespace-nowrap">{pos.itemNumber}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-800">{pos.positionTitle}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 font-medium">{pos.salaryGrade}-{pos.stepIncrement}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{pos.departmentName || pos.department || '-'}</td>
                        <td className="px-6 py-4 text-sm">
                            <div className="flex flex-col">
                                <span className="font-bold text-gray-700 text-xs">{pos.areaCode || '-'}</span>
                                {(pos.areaType || pos.areaLevel) && (
                                    <span className="text-[10px] text-gray-400 font-bold uppercase">
                                        {pos.areaType || '?'}/{pos.areaLevel || '?'}
                                    </span>
                                )}
                            </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                        {pos.incumbentName ? (
                            <span className="font-bold text-gray-900">{pos.incumbentName}</span>
                        ) : (
                            <span className="text-gray-300 italic">No appointee</span>
                        )}
                        </td>
                        <td className="px-6 py-4">
                        <div className="flex justify-center gap-3">
                            {pos.isVacant ? (
                            <button 
                                onClick={() => onAssign(pos)}
                                className="text-gray-500 hover:text-blue-600 transition-colors"
                                title="Assign Employee"
                            >
                                <UserPlus size={18} />
                            </button>
                            ) : (
                            <button 
                                onClick={() => onVacate(pos)}
                                className="text-gray-500 hover:text-amber-600 transition-colors"
                                title="Vacate Position"
                            >
                                <UserMinus size={18} />
                            </button>
                            )}
 
                            <button 
                                onClick={() => onViewHistory(pos)}
                                className="text-gray-500 hover:text-purple-600 transition-colors"
                                title="View History"
                            >
                                <History size={18} />
                            </button>
                            <button 
                                onClick={() => onEdit(pos)}
                                className="text-gray-500 hover:text-blue-600 transition-colors"
                                title="Edit"
                            >
                                <SquarePen size={18} />
                            </button>
                            <button 
                                onClick={() => onDelete(pos.id)}
                                className="text-gray-500 hover:text-red-600 transition-colors"
                                title="Delete"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                        </td>
                    </tr>
                    );
                    }) : (
                    <tr>
                        <td colSpan={8} className="p-8 text-center text-gray-400 text-sm font-medium">
                        No positions found matching your criteria.
                        </td>
                    </tr>
                    )}
                </tbody>
                </table>
            </div>
            )}
        </div>
    );
};

export default memo(PlantillaTable);
