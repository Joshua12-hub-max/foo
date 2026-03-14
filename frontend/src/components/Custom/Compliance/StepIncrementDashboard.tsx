import React, { useState, useMemo, useEffect } from 'react';
import { Users, AlertCircle, ArrowRight, DollarSign, Table2, Car, Heart, ChevronDown, Upload, X, Plus, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEligibleEmployees, useProcessStepIncrement, useCreateStepIncrement } from '@/hooks/useStepIncrement';
import { type EligibleEmployee } from '@/api/complianceApi';
import { plantillaApi, type Tranche } from '@/api/plantillaApi';
import ConfirmDialog from '@/components/Custom/Shared/ConfirmDialog';
import { SalaryUploadModal } from './SalaryUploadModal';
type TabType = 'eligible' | 'salary-schedule';

interface SalaryScheduleEntry {
    salaryGrade: number;
    step: number;
    monthlySalary: number;
}

export const StepIncrementDashboard: React.FC = () => {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<TabType>('eligible');
    const [selectedEmployee, setSelectedEmployee] = useState<EligibleEmployee | null>(null);
    const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
    const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
    const [selectedTrancheNum, setSelectedTrancheNum] = useState<number>(2); // Default to 2nd Tranche
    const [showTrancheDropdown, setShowTrancheDropdown] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

    const formatCurrency = (amount: number): string => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const { data: eligibleData, isLoading: loadingEligible, error: errorEligible } = useEligibleEmployees();

    // Fetch all tranches
    const { data: tranchesData } = useQuery({
        queryKey: ['tranches'],
        queryFn: async () => {
            const response = await plantillaApi.getTranches();
            return response.data.tranches || [];
        }
    });

    // Fetch active tranche
    const { data: activeTranche } = useQuery({
        queryKey: ['active-tranche'],
        queryFn: async () => {
            const response = await plantillaApi.getActiveTranche();
            return response.data.tranche;
        }
    });

    // Get current tranche info
    const currentTranche = useMemo(() => {
        if (!tranchesData) return null;
        return tranchesData.find((t: Tranche) => t.trancheNumber === selectedTrancheNum) || activeTranche || null;
    }, [tranchesData, selectedTrancheNum, activeTranche]);

    // --- ALLOWANCE LOGIC DECOUPLED (Managed in Compensation Module) ---

    // Auto-select active tranche
    useEffect(() => {
        if (activeTranche) {
            setSelectedTrancheNum(activeTranche.trancheNumber);
        }
    }, [activeTranche]);

    // Fetch full salary schedule based on selected tranche
    const { data: salaryScheduleData, isLoading: loadingSchedule } = useQuery({
        queryKey: ['salary-schedule-full', selectedTrancheNum],
        queryFn: async () => {
            const response = await plantillaApi.getFullSalarySchedule(selectedTrancheNum);
            return response.data.schedule || [];
        },
        enabled: activeTab === 'salary-schedule'
    });

    const createIncrement = useCreateStepIncrement();
    const processIncrement = useProcessStepIncrement();
    const isMutating = createIncrement.isPending || processIncrement.isPending;

    // Transform salary schedule into a matrix format for display
    const salaryMatrix = useMemo(() => {
        if (!salaryScheduleData || salaryScheduleData.length === 0) return { grades: [], matrix: {} };
        const matrix: Record<number, Record<number, number>> = {};
        const gradesSet = new Set<number>();
        salaryScheduleData.forEach((entry: SalaryScheduleEntry) => {
            gradesSet.add(entry.salaryGrade);
            if (!matrix[entry.salaryGrade]) matrix[entry.salaryGrade] = {};
            matrix[entry.salaryGrade][entry.step] = entry.monthlySalary;
        });
        const grades = Array.from(gradesSet).sort((a, b) => a - b);
        return { grades, matrix };
    }, [salaryScheduleData]);

    const eligibleEmployees = eligibleData?.eligibleEmployees || [];
    const eligibleCount = eligibleData?.count || 0;

    const handleApproveClick = (employee: EligibleEmployee) => {
        setSelectedEmployee(employee);
        setIsApproveModalOpen(true);
    };

    const confirmApprove = async () => {
        if (!selectedEmployee) return;
        try {
            const request = await createIncrement.mutateAsync({
                employeeId: selectedEmployee.employeeId,
                positionId: selectedEmployee.positionId,
                currentStep: selectedEmployee.currentStep,
                eligibleDate: selectedEmployee.eligibleDate,
                status: 'Pending',
                remarks: 'Automated Batch Approval'
            });
            await processIncrement.mutateAsync({
                incrementId: request.id,
                status: 'Approved',
                remarks: 'System verified: 3 years continuous satisfactory service'
            });
            queryClient.invalidateQueries({ queryKey: ['eligible-employees'] });
        } catch (error) {
            console.error('Approval failed:', error);
        }
    };

    if (loadingEligible && activeTab === 'eligible') {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (errorEligible && activeTab === 'eligible') {
        return (
            <div className="p-12 text-center text-red-500 bg-red-50 rounded-lg border border-red-100">
                <AlertCircle className="mx-auto mb-4" size={40} />
                <h3 className="text-lg font-bold">Data Synchronization Error</h3>
                <p className="text-sm mt-1 max-w-md mx-auto">Unable to fetch tenure data. Please verify your connection to the database.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Step Increment Dashboard</h2>
                    <p className="text-sm text-gray-500">Tenure-based salary grade advancement management</p>
                </div>
                <div className="flex items-center gap-3">
                    {activeTab === 'salary-schedule' && (
                        <button 
                            onClick={() => setIsUploadModalOpen(true)}
                            className="bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg border border-gray-300 shadow-sm transition-all flex items-center gap-2 text-xs font-semibold"
                        >
                            <Upload size={14} />
                            Update Schedule
                        </button>
                    )}
                    <div className="relative">
                        <button 
                            onClick={() => setShowTrancheDropdown(!showTrancheDropdown)}
                            className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 px-4 py-2 rounded-lg shadow-sm flex items-center gap-3 transition-all"
                        >
                            <div className="text-left">
                                <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                    {currentTranche?.circularNumber || 'SSL Circular'}
                                </div>
                                <div className="text-sm font-bold">
                                    {currentTranche?.name || 'Select Tranche'}
                                </div>
                            </div>
                            <ChevronDown size={16} className={`text-gray-400 transition-transform ${showTrancheDropdown ? 'rotate-180' : ''}`} />
                        </button>
                        {showTrancheDropdown && tranchesData && (
                            <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
                                <div className="p-3 border-b border-gray-100 bg-gray-50 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                    Select Salary Tranche
                                </div>
                                <div className="max-h-80 overflow-y-auto">
                                    {tranchesData.map((tranche: Tranche) => (
                                        <button
                                            key={tranche.id}
                                            onClick={() => {
                                                setSelectedTrancheNum(tranche.trancheNumber);
                                                setShowTrancheDropdown(false);
                                            }}
                                            className={`w-full p-3 text-left hover:bg-gray-50 transition-colors flex justify-between items-center border-b border-gray-100 last:border-0 ${
                                                selectedTrancheNum === tranche.trancheNumber ? 'bg-indigo-50/50' : ''
                                            }`}
                                        >
                                            <div>
                                                <div className="text-sm font-semibold text-gray-900">{tranche.name}</div>
                                                <div className="text-[10px] text-gray-500">{tranche.circularNumber}</div>
                                            </div>
                                            {selectedTrancheNum === tranche.trancheNumber && (
                                                <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-gray-100 p-1 rounded-xl inline-flex gap-1">
                <button
                    onClick={() => setActiveTab('eligible')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                        activeTab === 'eligible' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <Users size={16} />
                    Eligible
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-indigo-100 text-indigo-700 font-bold">
                        {eligibleCount}
                    </span>
                </button>
                <button
                    onClick={() => setActiveTab('salary-schedule')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                        activeTab === 'salary-schedule' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <Table2 size={16} />
                    Salary Schedule
                </button>
            </div>

            <SalaryUploadModal 
                isOpen={isUploadModalOpen} 
                onClose={() => setIsUploadModalOpen(false)} 
                trancheId={selectedTrancheNum}
                setTrancheId={setSelectedTrancheNum}
                tranches={tranchesData || []}
                onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['salary-schedule-full'] });
                }}
            />

            {/* Tab Content: Eligible */}
            {activeTab === 'eligible' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 group">
                            <div className="flex items-center justify-between mb-2">
                                <div className="w-8 h-8 bg-gray-800 rounded-lg shadow-sm transition-transform"></div>
                            </div>
                            <div className="text-2xl font-bold text-gray-900">{eligibleCount}</div>
                            <div className="text-xs font-semibold text-gray-500 mt-1">Eligible Staff</div>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 group">
                            <div className="flex items-center justify-between mb-2">
                                <div className="w-8 h-8 bg-gray-700 rounded-lg shadow-sm transition-transform"></div>
                            </div>
                            <div className="text-2xl font-bold text-gray-900">+{eligibleEmployees.length}</div>
                            <div className="text-xs font-semibold text-gray-500 mt-1">Step Progress</div>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 group">
                            <div className="flex items-center justify-between mb-2">
                                <div className="w-8 h-8 bg-gray-600 rounded-lg shadow-sm transition-transform"></div>
                            </div>
                            <div className="text-2xl font-bold text-gray-900">
                                {eligibleEmployees.length > 0 ? (eligibleEmployees.reduce((s: number, e: EligibleEmployee) => s + (e.yearsInPosition || 0), 0) / eligibleEmployees.length).toFixed(1) : '0.0'}
                            </div>
                            <div className="text-xs font-semibold text-gray-500 mt-1">Tenure Avg</div>
 bitumen                        </div>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                        <div className="bg-[#F9FAFB] px-5 py-3 border-b border-gray-200 text-sm font-semibold text-gray-700">
                            Eligible Candidates
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-200 shadow-md text-gray-700">
                                    <tr>
                                        <th className="px-5 py-4 text-sm font-bold tracking-wide whitespace-nowrap">Employee</th>
                                        <th className="px-5 py-4 text-sm font-bold tracking-wide whitespace-nowrap">Position</th>
                                        <th className="px-5 py-4 text-sm font-bold tracking-wide text-center whitespace-nowrap">Step Progress</th>
                                        <th className="px-5 py-4 text-sm font-bold tracking-wide text-center whitespace-nowrap">Tenure</th>
                                        <th className="px-5 py-4 text-sm font-bold tracking-wide text-center whitespace-nowrap">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {eligibleEmployees.length > 0 ? (eligibleEmployees as EligibleEmployee[]).map((emp) => (
                                        <tr key={emp.employeeId} className="hover:bg-[#F8F9FA] hover:shadow-xl transition-colors group bg-white">
                                            <td className="px-5 py-4">
                                                <div className="font-bold text-gray-900">{emp.employeeName}</div>
                                                <div className="text-[10px] text-gray-400 font-mono">{emp.employeeId}</div>
                                            </td>
                                            <td className="px-5 py-4 text-gray-700">{emp.positionTitle}</td>
                                            <td className="px-5 py-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <span className="text-gray-500">Step {emp.currentStep}</span>
                                                    <ArrowRight size={10} className="text-gray-300" />
                                                    <span className="text-emerald-600 font-black">Step {emp.nextStep}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-center font-medium">{emp.yearsInPosition} Yrs</td>
                                            <td className="px-5 py-4 text-center">
                                                <button
                                                    onClick={() => handleApproveClick(emp)}
                                                    disabled={isMutating}
                                                    className="text-blue-600 hover:text-blue-800 font-bold text-xs"
                                                >
                                                    {isMutating ? 'Processing...' : 'Approve'}
                                                </button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={5} className="px-5 py-12 text-center text-gray-500 italic">No eligible candidates detected.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Tab Content: Salary Schedule */}
            {activeTab === 'salary-schedule' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: 'Salary Grades', value: salaryMatrix.grades.length, color: 'bg-gray-800' },
                            { label: 'Steps', value: 8, color: 'bg-gray-700' },
                            { label: 'Min Salary', value: salaryMatrix.matrix[1]?.[1] ? formatCurrency(salaryMatrix.matrix[1][1]) : '-', color: 'bg-gray-600' },
                            { label: 'Max Salary', value: salaryMatrix.matrix[33]?.[8] ? formatCurrency(salaryMatrix.matrix[33][8]) : '-', color: 'bg-gray-900' },
                        ].map((stat, i) => (
                            <div key={i} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all group">
                                <div className="flex items-center justify-between mb-2">
                                    <div className={`w-8 h-8 ${stat.color} rounded-lg shadow-sm transition-transform`}></div>
                                </div>
                                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                                <div className="text-xs font-semibold text-gray-500 mt-1">{stat.label}</div>
                            </div>
                        ))}
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm flex items-center gap-3 flex-wrap">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Jump to Grade:</span>
                        <div className="flex flex-wrap gap-1">
                            {salaryMatrix.grades.map((grade) => (
                                <button
                                    key={grade}
                                    onClick={() => setSelectedGrade(grade === selectedGrade ? null : grade)}
                                    className={`px-2 py-1 text-[10px] font-bold rounded ${
                                        selectedGrade === grade ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    SG{grade}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                        <div className="bg-[#F9FAFB] px-5 py-3 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                <DollarSign size={16} />
                                Salary Schedule Matrix (Steps 1-8)
                            </h3>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                {currentTranche?.name || ''} - {currentTranche?.circularNumber || ''}
                            </span>
                        </div>

                        {loadingSchedule ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="w-8 h-8 border-4 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-200 shadow-md text-gray-700 sticky top-0 z-20">
                                        <tr className="border-b border-gray-300/50">
                                            <th rowSpan={2} className="px-3 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap bg-gray-200 sticky left-0 z-30 border-r border-gray-300/50">
                                                SG
                                            </th>
                                            {[1, 2, 3, 4, 5, 6, 7, 8].map((step) => (
                                                <th key={step} colSpan={2} className="px-2 py-4 text-center text-sm font-bold tracking-wide whitespace-nowrap bg-indigo-50/50 border-x border-gray-300/50">
                                                    Step {step}
                                                </th>
                                            ))}
                                        </tr>
                                        <tr>
                                            {[1, 2, 3, 4, 5, 6, 7, 8].map((step) => (
                                                <React.Fragment key={step}>
                                                    <th className="px-2 py-2 text-center text-[10px] font-bold uppercase tracking-widest bg-blue-50/50 text-blue-700 border-l border-gray-300/50">
                                                        Monthly
                                                    </th>
                                                    <th className="px-2 py-2 text-center text-[10px] font-bold uppercase tracking-widest bg-green-50/50 text-green-700 border-r border-gray-300/50">
                                                        Annual
                                                    </th>
                                                </React.Fragment>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {(selectedGrade ? [selectedGrade] : salaryMatrix.grades).map((grade) => (
                                            <tr 
                                                key={grade} 
                                                className="hover:bg-[#F8F9FA] hover:shadow-xl transition-all group bg-white"
                                            >
                                                <td className={`px-3 py-3 text-sm font-bold text-gray-900 sticky left-0 border-r border-gray-200 z-10 bg-white group-hover:bg-[#F8F9FA] transition-colors ${
                                                    selectedGrade === grade ? 'bg-indigo-50' : 'bg-gray-50/30'
                                                }`}>
                                                    <span className="bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded text-xs font-bold">
                                                        {grade}
                                                    </span>
                                                </td>
                                                {[1, 2, 3, 4, 5, 6, 7, 8].map((step) => {
                                                    const monthly = salaryMatrix.matrix[grade]?.[step] || 0;
                                                    const annual = monthly * 12;
                                                    return (
                                                        <React.Fragment key={step}>
                                                            <td className={`px-2 py-3 text-center border-l border-gray-100/50 ${step === 1 ? 'bg-blue-50/20' : ''}`}>
                                                                <span className={`text-[11px] font-bold ${
                                                                    step === 1 ? 'text-blue-700' : 'text-gray-700'
                                                                }`}>
                                                                    {monthly > 0 ? formatCurrency(monthly) : '-'}
                                                                </span>
                                                            </td>
                                                            <td className={`px-2 py-3 text-center border-r border-gray-100/50 ${step === 1 ? 'bg-green-50/20' : ''}`}>
                                                                <span className={`text-[11px] font-bold ${
                                                                    step === 1 ? 'text-green-700' : 'text-gray-600'
                                                                }`}>
                                                                    {annual > 0 ? formatCurrency(annual) : '-'}
                                                                </span>
                                                            </td>
                                                        </React.Fragment>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}



            <ConfirmDialog 
                isOpen={isApproveModalOpen}
                onClose={() => {
                    setIsApproveModalOpen(false);
                    setSelectedEmployee(null);
                }}
                onConfirm={confirmApprove}
                title="Approve Step Increment"
                message={selectedEmployee ? `Approve step increment for ${selectedEmployee.employeeName}? They will move from Step ${selectedEmployee.currentStep} to Step ${selectedEmployee.nextStep}.` : ''}
                confirmText="Confirm"
                cancelText="Cancel"
            />
        </div>
    );
};

export default StepIncrementDashboard;
