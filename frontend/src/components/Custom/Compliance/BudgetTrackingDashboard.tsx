import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { AlertCircle, CheckCircle, ChevronLeft, ChevronRight, Plus, Pencil } from 'lucide-react';

const BudgetFormModal = React.lazy(() => import('@/components/Custom/Compliance/BudgetFormModal'));

// --- Types ---
interface BudgetAllocation {
    id: number;
    year: number;
    department: string;
    totalBudget: number | string;
    utilizedBudget: number | string;
    remainingBudget: number | string;
    utilizationRate: number | string;
    notes?: string;
    updatedAt: string;
}

interface BudgetDashboardProps {
    selectedDeptName?: string; // "CHRMO" or "All"
}

interface BudgetSummary {
    total: number;
    utilized: number;
    remaining: number;
    dept: string;
    rate: number;
}

interface BudgetParams {
    year: number;
    department?: string;
}

const ITEMS_PER_PAGE = 10;

const BudgetTrackingDashboard: React.FC<BudgetDashboardProps> = ({ selectedDeptName = 'All' }) => {
    const currentYear = new Date().getFullYear();
    const [currentPage, setCurrentPage] = useState(1);
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [selectedBudget, setSelectedBudget] = useState<BudgetAllocation | undefined>(undefined);
    const [isProcessing, setIsProcessing] = useState(false);

    // Fetch Budget Data
    const { data: budgetData, isLoading, error, refetch } = useQuery<BudgetAllocation[]>({
        queryKey: ['budget-tracking', selectedDeptName],
        queryFn: async () => {
            const params: BudgetParams = { year: currentYear };
            if (selectedDeptName && selectedDeptName !== 'All') {
                params.department = selectedDeptName;
            }

            const response = await api.get('/budget-allocation', { 
                params
            });
            return response.data.allocations || [];
        }
    });

    // Fetch Departments for Dropdown
    const { data: departments = [] } = useQuery<{id: number, name: string}[]>({
        queryKey: ['departments-simple'],
        queryFn: async () => {
             const response = await api.get('/departments');
             return response.data.departments || [];
        }
    });

    // Reset pagination when filter changes
    React.useEffect(() => {
        setCurrentPage(1);
    }, [selectedDeptName]);

    // Derived Data Calculation
    const { summary, activeBudget } = useMemo(() => {
        if (!budgetData) return { summary: null, activeBudget: null };

        const firstBudget = budgetData.length > 0 ? budgetData[0] : null;
        
        // Calculate totals for "All" view
        const totalSummary = budgetData.reduce((acc, curr) => ({
            total: acc.total + Number(curr.totalBudget || 0),
            utilized: acc.utilized + Number(curr.utilizedBudget || 0),
            remaining: acc.remaining + Number(curr.remainingBudget || 0),
        }), { total: 0, utilized: 0, remaining: 0 });

        return { 
            activeBudget: firstBudget,
            summary: totalSummary
        };
    }, [budgetData]);

    const displayData: BudgetSummary = useMemo(() => {
        if (selectedDeptName !== 'All' && activeBudget) {
            return { 
                total: Number(activeBudget.totalBudget), 
                utilized: Number(activeBudget.utilizedBudget), 
                remaining: Number(activeBudget.remainingBudget),
                dept: activeBudget.department,
                rate: Number(activeBudget.utilizationRate)
            };
        }
        return {
            total: summary?.total || 0,
            utilized: summary?.utilized || 0,
            remaining: summary?.remaining || 0,
            dept: 'All Departments',
            rate: (summary?.total || 0) > 0 ? ((summary?.utilized || 0) / (summary?.total || 1)) * 100 : 0
        };
    }, [selectedDeptName, activeBudget, summary]);

    // Pagination Logic
    const paginatedData = useMemo(() => {
        if (!budgetData) return [];
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return budgetData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [budgetData, currentPage]);

    const totalPages = budgetData ? Math.ceil(budgetData.length / ITEMS_PER_PAGE) : 0;

    const chartData = [
        { name: 'Utilized', value: displayData.utilized, color: '#d97706' }, // Amber-600
        { name: 'Remaining', value: displayData.remaining, color: '#059669' } // Emerald-600
    ];

    // --- Actions ---
    const handleAddBudget = () => {
        setModalMode('create');
        setSelectedBudget(undefined);
        setIsModalOpen(true);
    };

    const handleEditBudget = (budget: BudgetAllocation) => {
        setModalMode('edit');
        setSelectedBudget(budget);
        setIsModalOpen(true);
    };

    const handleFormSubmit = async (data: any) => {
        setIsProcessing(true);
        try {
            if (modalMode === 'create') {
                await api.post('/budget-allocation', data);
            } else {
                if (!selectedBudget?.id) return;
                await api.put(`/budget-allocation/${selectedBudget.id}`, data);
            }
            // Success
            setIsModalOpen(false);
            refetch();
        } catch (err) {
            console.error("Failed to save budget", err);
            alert("Failed to save budget allocation. Please check inputs.");
        } finally {
            setIsProcessing(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center text-red-500 bg-red-50 rounded-lg border border-red-100">
                <AlertCircle className="mx-auto mb-2 text-red-400" size={32} />
                <p>Failed to load budget data. Please try again later.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        Budget Tracking ({currentYear})
                    </h3>
                    <p className="text-sm text-gray-600">
                        {displayData.dept} • Monitor allocation and utilization in real-time.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-semibold border border-blue-100 shadow-sm">
                        Fiscal Year {currentYear}
                    </div>
                    {(selectedDeptName === 'All' || !activeBudget) && (
                        <button 
                            onClick={handleAddBudget}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-semibold shadow-md hover:bg-gray-800 transition-all hover:scale-[1.02] active:scale-95"
                        >
                            <Plus size={16} />
                            Set Budget
                        </button>
                    )}
                </div>
            </div>

            {/* Main Stats Cards - Master Design */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Allocated */}
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 group">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-8 h-8 bg-gray-800 rounded-lg shadow-sm transition-transform"></div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">₱{displayData.total.toLocaleString()}</div>
                    <div className="text-xs font-semibold text-gray-500 mt-1">Total Allocation</div>
                    <p className="text-[11px] text-gray-400 mt-1 font-medium">Approved Annual Budget</p>
                </div>

                {/* Utilized */}
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 group">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-8 h-8 bg-gray-700 rounded-lg shadow-sm transition-transform"></div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">₱{displayData.utilized.toLocaleString()}</div>
                    <div className="text-xs font-semibold text-gray-500 mt-1">Utilized Budget</div>
                    <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-red-500 rounded-full transition-all duration-500" 
                                style={{ width: `${Math.min(displayData.rate, 100)}%` }}
                            />
                        </div>
                        <span className="text-[10px] font-bold text-gray-700">{displayData.rate.toFixed(1)}%</span>
                    </div>
                </div>

                {/* Remaining */}
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 group">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-8 h-8 bg-gray-600 rounded-lg shadow-sm transition-transform"></div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">₱{displayData.remaining.toLocaleString()}</div>
                    <div className="text-xs font-semibold text-gray-500 mt-1">Remaining Balance</div>
                     <p className="text-[10px] text-gray-500 mt-1 font-medium flex items-center gap-1">
                        <CheckCircle size={10} /> Available for disbursement
                     </p>
                </div>
            </div>

            {/* Charts & Details */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm lg:col-span-1 flex flex-col items-center justify-center">
                    <h4 className="text-sm font-bold text-gray-800 w-full mb-6 border-b border-gray-100 pb-2">Utilization Breakdown</h4>
                    <div className="h-64 w-full relative" style={{ width: '100%', height: '256px' }}>
                        <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={200}>
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="value"
                                    cornerRadius={5}
                                    stroke="none"
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    formatter={(value: any) => [`₱${Number(value || 0).toLocaleString()}`, 'Amount']}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Center Text */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-xs text-gray-400 font-medium">Utilization</span>
                            <span className={`text-xl font-bold ${displayData.rate > 90 ? 'text-red-600' : 'text-green-600'}`}>
                                {displayData.rate.toFixed(1)}%
                            </span>
                        </div>
                    </div>
                </div>

                {/* Allocations List */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm lg:col-span-2 flex flex-col">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                        <h4 className="text-sm font-bold text-gray-800">Department Allocations</h4>
                        <div className="text-xs text-gray-500 font-medium">
                            Page {currentPage} of {totalPages}
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-200 shadow-md text-gray-700">
                                <tr>
                                    <th className="px-6 py-4 text-sm font-bold tracking-wide whitespace-nowrap">Department</th>
                                    <th className="px-6 py-4 text-sm font-bold tracking-wide text-right whitespace-nowrap">Total Budget</th>
                                    <th className="px-6 py-4 text-sm font-bold tracking-wide text-right whitespace-nowrap">Utilized</th>
                                    <th className="px-6 py-4 text-sm font-bold tracking-wide text-right whitespace-nowrap">Remaining</th>
                                    <th className="px-6 py-4 text-sm font-bold tracking-wide text-center whitespace-nowrap">% Used</th>
                                    <th className="px-6 py-4 text-sm font-bold tracking-wide text-center whitespace-nowrap">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {paginatedData.map((item: BudgetAllocation) => (
                                    <tr key={item.id} className="hover:bg-[#F8F9FA] hover:shadow-xl transition-colors group bg-white">
                                        <td className="px-6 py-4 font-semibold text-gray-900 border-l-2 border-transparent group-hover:border-blue-500 transition-all">
                                            {item.department}
                                        </td>
                                        <td className="px-6 py-4 text-right tabular-nums text-gray-700 font-medium">
                                            ₱{Number(item.totalBudget).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-right tabular-nums text-red-600 font-bold">
                                            ₱{Number(item.utilizedBudget).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-right tabular-nums text-green-600 font-bold">
                                            ₱{Number(item.remainingBudget).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-block min-w-[3.5rem] text-center ${
                                                Number(item.utilizationRate) > 90 ? 'bg-red-100 text-red-700' : 
                                                Number(item.utilizationRate) > 70 ? 'bg-amber-100 text-amber-700' : 
                                                'bg-green-100 text-green-700'
                                            }`}>
                                                {Number(item.utilizationRate).toFixed(1)}%
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button 
                                                onClick={() => handleEditBudget(item)}
                                                className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                                                title="Edit Allocation"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {(!budgetData || budgetData.length === 0) && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic bg-gray-50/30">
                                            No allocations found. <button onClick={handleAddBudget} className="text-blue-600 font-bold hover:underline">Set a budget</button> to get started.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50 flex justify-end items-center gap-2">
                             {/* ... pagination UI same as before ... */}
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded-lg hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200 text-gray-500 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none transition-all"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <span className="text-xs font-medium text-gray-600">
                                {currentPage} / {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-lg hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200 text-gray-500 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none transition-all"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
             <React.Suspense fallback={null}>
                <BudgetFormModal 
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    mode={modalMode}
                    departments={departments}
                    initialData={selectedBudget as unknown as { year: number; department: string; totalBudget: number; notes?: string; id?: number }}
                    onSubmit={handleFormSubmit}
                    isProcessing={isProcessing}
                />
            </React.Suspense>
        </div>
    );
};

export default BudgetTrackingDashboard;
