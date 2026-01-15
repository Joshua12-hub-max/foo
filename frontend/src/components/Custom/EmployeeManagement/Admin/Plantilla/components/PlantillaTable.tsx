import React, { memo } from 'react';
import { SquarePen, Trash2, UserPlus, UserMinus, History } from 'lucide-react';

interface Position {
  id: number;
  item_number: string;
  position_title: string;
  salary_grade: string;
  step_increment?: number;
  department?: string;
  incumbent_name?: string;
  is_vacant: boolean;
}

interface PlantillaTableProps {
  loading: boolean;
  error: string | null;
  positions: Position[];
  onOpenAssign: (pos: Position) => void;
  onOpenVacate: (pos: Position) => void;
  onViewHistory: (pos: Position) => void;
  onOpenEdit: (pos: Position) => void;
  onDelete: (id: number) => void;
}

const PlantillaTable: React.FC<PlantillaTableProps> = ({ 
    loading, 
    error, 
    positions, 
    onOpenAssign, 
    onOpenVacate, 
    onViewHistory, 
    onOpenEdit, 
    onDelete 
}) => {
    return (
        <div className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden flex-1">
            {loading ? (
            <div className="p-8 text-center text-gray-500 flex flex-col items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-gray-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                Loading positions...
            </div>
            ) : error ? (
            <div className="p-8 text-center text-red-500">{error}</div>
            ) : (
            <div className="overflow-x-auto">
                <table className="w-full">
                <thead className="bg-gray-100 text-gray-700">
                    <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Item No.</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Position Title</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">SG</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Department</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Incumbent</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {positions.length > 0 ? positions.map(pos => {
                      if (!pos) return null;
                      return (
                    <tr key={pos.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium">{pos.item_number}</td>
                        <td className="px-4 py-3 text-sm">{pos.position_title}</td>
                        <td className="px-4 py-3 text-sm">{pos.salary_grade}-{pos.step_increment}</td>
                        <td className="px-4 py-3 text-sm">{pos.department || '-'}</td>
                        <td className="px-4 py-3 text-sm">
                        {pos.incumbent_name || <span className="text-gray-400 italic">Vacant</span>}
                        </td>
                        <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            pos.is_vacant ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                        }`}>
                            {pos.is_vacant ? 'Vacant' : 'Filled'}
                        </span>
                        </td>
                        <td className="px-4 py-3">
                        <div className="flex justify-center gap-1">
                            {pos.is_vacant ? (
                            <button 
                                onClick={() => onOpenAssign(pos)}
                                className="text-gray-600 hover:text-gray-800 p-1.5 rounded hover:bg-gray-100 transition"
                                title="Assign Employee"
                            >
                                <UserPlus size={16} />
                            </button>
                            ) : (
                            <button 
                                onClick={() => onOpenVacate(pos)}
                                className="text-amber-600 hover:text-amber-800 p-1.5 rounded hover:bg-amber-50 transition"
                                title="Vacate Position"
                            >
                                <UserMinus size={16} />
                            </button>
                            )}
                            <button 
                            onClick={() => onViewHistory(pos)}
                            className="text-purple-600 hover:text-purple-800 p-1.5 rounded hover:bg-purple-50 transition"
                            title="View History"
                            >
                            <History size={16} />
                            </button>
                            <button 
                            onClick={() => onOpenEdit(pos)}
                            className="text-blue-600 hover:text-blue-800 p-1.5 rounded hover:bg-blue-50 transition"
                            title="Edit"
                            >
                            <SquarePen size={16} />
                            </button>
                            <button 
                            onClick={() => onDelete(pos.id)}
                            className="text-red-600 hover:text-red-800 p-1.5 rounded hover:bg-red-50 transition"
                            title="Delete"
                            >
                            <Trash2 size={16} />
                            </button>
                        </div>
                        </td>
                    </tr>
                    );
                    }) : (
                    <tr>
                        <td colSpan={7} className="p-8 text-center text-gray-500">
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
