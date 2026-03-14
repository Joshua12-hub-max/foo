import React, { useState, memo, useMemo } from 'react';
import { 
  TrendingUp, Wallet, CheckCircle, Calculator, 
  Plus, Edit2, RotateCw, AlertTriangle, Search
} from 'lucide-react';
import { useBudget } from '../hooks/useBudget';
import BudgetAllocationModal from './BudgetAllocationModal';
import type { BudgetAllocation, DepartmentBudget } from '@/api/complianceApi';
import type { BudgetAllocationFormData } from '@/schemas/compliance';

interface BudgetDashboardProps {
  departments: string[];
}

const BudgetDashboard: React.FC<BudgetDashboardProps> = memo(({ departments }) => {
  const currentYear = new Date().getFullYear();
  const {
    year, setYear, loading, summary, departmentBudgets, 
    allocations, createAllocation, updateAllocation, recalculate, refresh
  } = useBudget(currentYear);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAllocation, setSelectedAllocation] = useState<BudgetAllocation | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Filtered department list based on search
  const filteredDepartments = useMemo(() => {
    return departmentBudgets.filter(db => 
      db.department.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [departmentBudgets, searchTerm]);

  const handleOpenAdd = () => {
    setSelectedAllocation(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (deptName: string) => {
    const existing = allocations.find(a => a.department === deptName);
    if (existing) {
      setSelectedAllocation(existing);
      setIsModalOpen(true);
    } else {
      // If no allocation exists yet for this dept, we skip or handle as add
      setSelectedAllocation(null);
      setIsModalOpen(true);
    }
  };

  const handleSubmit = async (data: BudgetAllocationFormData) => {
    try {
      if (selectedAllocation) {
        await updateAllocation(selectedAllocation.id, {
          totalBudget: data.totalBudget,
          notes: data.notes
        });
      } else {
        await createAllocation(data);
      }
      setIsModalOpen(false);
    } catch (error) {
      // Error handled by hook toast
    }
  };

  const formatPHP = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3 bg-gray-100 p-1 rounded-lg">
          {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
            <button
              key={y}
              onClick={() => setYear(y)}
              className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${
                year === y 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              FY {y}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-2">
            <button 
                onClick={refresh}
                className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                title="Refresh Data"
            >
                <RotateCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={handleOpenAdd}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl flex items-center gap-2 shadow-md transition-all active:scale-95 text-sm font-bold"
            >
              <Plus size={18} />
              Set Department Budget
            </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard 
          label="Total Allocated" 
          value={formatPHP(summary?.totalAllocated || 0)} 
          icon={<Wallet className="text-blue-600" size={20} />}
          bg="bg-blue-50"
          border="border-blue-100"
        />
        <SummaryCard 
          label="Total Utilized" 
          value={formatPHP(summary?.totalUtilized || 0)} 
          icon={<TrendingUp className="text-emerald-600" size={20} />}
          bg="bg-emerald-50"
          border="border-emerald-100"
        />
        <SummaryCard 
          label="Remaining Balance" 
          value={formatPHP(summary?.totalRemaining || 0)} 
          icon={<CheckCircle className="text-indigo-600" size={20} />}
          bg="bg-indigo-50"
          border="border-indigo-100"
        />
        <SummaryCard 
          label="Avg. Utilization" 
          value={`${(summary?.avgUtilizationRate || 0).toFixed(2)}%`} 
          icon={<Calculator className="text-amber-600" size={20} />}
          bg="bg-amber-50"
          border="border-amber-100"
        />
      </div>

      {/* Department Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                Departmental Budget Breakdown
                <span className="text-xs font-medium text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">
                    {filteredDepartments.length} Departments
                </span>
            </h3>
            <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input 
                    type="text"
                    placeholder="Search department..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-1.5 bg-white border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500/20 outline-none"
                />
            </div>
        </div>
        
        <div className="overflow-x-auto bg-gray-50 rounded-lg">
          <table className="w-full min-w-[800px]">
            <thead className="bg-gray-200 shadow-md text-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap uppercase">Department</th>
                <th className="px-6 py-4 text-right text-sm font-bold tracking-wide whitespace-nowrap uppercase">Allocation</th>
                <th className="px-6 py-4 text-right text-sm font-bold tracking-wide whitespace-nowrap uppercase">Utilized (Annual)</th>
                <th className="px-6 py-4 text-center text-sm font-bold tracking-wide whitespace-nowrap uppercase">Utilization %</th>
                <th className="px-6 py-4 text-center text-sm font-bold tracking-wide whitespace-nowrap uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDepartments.map((dept) => (
                <tr key={dept.department} className="hover:bg-[#F8F9FA] hover:shadow-xl transition-colors group bg-white">
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-700 text-sm">{dept.department}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="font-bold text-gray-900 text-sm">{formatPHP(dept.totalBudget)}</div>
                    {dept.totalBudget === 0 && (
                        <div className="text-[10px] text-amber-600 font-bold flex items-center justify-end gap-1">
                            <AlertTriangle size={10} /> NOT SET
                        </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium text-gray-600">
                    {formatPHP(dept.utilizedBudget)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center flex-col gap-1.5">
                        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden max-w-[120px] border border-gray-200">
                            <div 
                                className={`h-full rounded-full transition-all duration-1000 ${
                                    dept.utilizationRate > 90 ? 'bg-red-500' : 
                                    dept.utilizationRate > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${Math.min(dept.utilizationRate, 100)}%` }}
                            />
                        </div>
                        <span className={`text-[11px] font-black ${
                            dept.utilizationRate > 90 ? 'text-red-600' : 
                            dept.utilizationRate > 70 ? 'text-amber-600' : 'text-emerald-600'
                        }`}>
                            {dept.utilizationRate.toFixed(1)}%
                        </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-3">
                        <button
                          onClick={() => recalculate(year, dept.department)}
                          className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          title="Recalculate Utilization"
                        >
                          <RotateCw size={18} />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(dept.department)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="Adjust Budget"
                        >
                          <Edit2 size={18} />
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredDepartments.length === 0 && (
                  <tr>
                      <td colSpan={5} className="px-6 py-16 text-center">
                          <div className="text-gray-400 font-bold uppercase tracking-widest text-xs">No department allocations found for FY {year}</div>
                      </td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Allocation Modal */}
      <BudgetAllocationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        initialData={selectedAllocation}
        departments={departments}
        year={year}
      />
    </div>
  );
});

// Helper Components
const SummaryCard = ({ label, value, icon, bg, border }: { 
  label: string; value: string; icon: React.ReactNode; bg: string; border: string 
}) => (
  <div className={`${bg} ${border} border p-5 rounded-2xl shadow-sm transition-transform hover:scale-[1.02]`}>
    <div className="flex justify-between items-start mb-3">
        <div className="p-2 bg-white rounded-xl shadow-sm border border-black/5">
            {icon}
        </div>
        <div className="bg-white/50 px-2 py-0.5 rounded-full border border-black/5 text-[10px] font-black text-gray-400">
            FY2026
        </div>
    </div>
    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</div>
    <div className="text-xl font-black text-slate-900 tracking-tight">{value}</div>
  </div>
);

BudgetDashboard.displayName = 'BudgetDashboard';

export default BudgetDashboard;
