import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Plus, 
  Settings, 
  Calendar, 
  ClipboardList, 
  CheckCircle2, 
  AlertCircle,
  Edit2,
  Trash2,
  ChevronRight,
  ShieldCheck,
  Search
} from 'lucide-react';
import { allowanceApi, type AllowanceSchedule, type AllowanceDefinition } from '@/api/allowanceApi';
import { useAllowanceStore } from '@/stores/allowanceStore';
import toast from 'react-hot-toast';

// --- Zod Schemas ---
const scheduleSchema = z.object({
  name: z.string().min(3, 'Name at least 3 characters'),
  effectivity_date: z.string().min(1, 'Date is required'),
  legal_basis: z.string().optional(),
});

const allowanceSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  description: z.string().optional(),
  category: z.enum(['Monthly', 'Annual', 'Bonus']),
  amount: z.number().optional(),
  is_matrix: z.boolean(),
  rates: z.array(z.object({
    condition_key: z.string(),
    amount: z.number(),
    value_type: z.enum(['FIXED', 'PERCENTAGE'])
  })).optional()
});

type ScheduleFormValues = z.infer<typeof scheduleSchema>;
type AllowanceFormValues = z.infer<typeof allowanceSchema>;

// --- Main Component ---
const CompensationDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isAllowanceModalOpen, setIsAllowanceModalOpen] = useState(false);
  const [editingAllowance, setEditingAllowance] = useState<AllowanceDefinition | null>(null);

  // --- Queries ---
  const { data: schedules, isLoading: isLoadingSchedules } = useQuery({
    queryKey: ['allowance-schedules'],
    queryFn: allowanceApi.getSchedules
  });

  const { data: allowances, isLoading: isLoadingAllowances } = useQuery({
    queryKey: ['allowance-definitions', selectedScheduleId],
    queryFn: () => selectedScheduleId ? allowanceApi.getScheduleAllowances(selectedScheduleId) : Promise.resolve([]),
    enabled: !!selectedScheduleId
  });

  // --- Mutations ---
  const createScheduleMutation = useMutation({
    mutationFn: allowanceApi.createSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allowance-schedules'] });
       toast.success('Schedule created successfully');
      setIsScheduleModalOpen(false);
    }
  });

  const activateScheduleMutation = useMutation({
    mutationFn: allowanceApi.setActiveSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allowance-schedules'] });
      toast.success('Schedule activated');
    }
  });

  const upsertAllowanceMutation = useMutation({
    mutationFn: allowanceApi.upsertAllowance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allowance-definitions'] });
      toast.success('Allowance saved');
      setIsAllowanceModalOpen(false);
      setEditingAllowance(null);
    }
  });

  // --- Forms ---
  const scheduleForm = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleSchema)
  });

  const allowanceForm = useForm<AllowanceFormValues>({
    resolver: zodResolver(allowanceSchema),
    defaultValues: {
      category: 'Monthly',
      is_matrix: false,
      rates: []
    }
  });

  const onSubmitSchedule: SubmitHandler<ScheduleFormValues> = (data) => {
    createScheduleMutation.mutate(data);
  };

  const onSubmitAllowance: SubmitHandler<AllowanceFormValues> = (data) => {
    if (!selectedScheduleId) return;
    upsertAllowanceMutation.mutate({
      ...data,
      id: editingAllowance?.id,
      allowance_schedule_id: selectedScheduleId
    });
  };

  const handleEditAllowance = (allowance: AllowanceDefinition) => {
    setEditingAllowance(allowance);
    allowanceForm.reset({
      name: allowance.name,
      description: allowance.description || '',
      category: allowance.category,
      amount: allowance.amount,
      is_matrix: allowance.is_matrix,
      rates: allowance.rates || []
    });
    setIsAllowanceModalOpen(true);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen bg-slate-50">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Compensation & Allowances</h1>
          <p className="text-slate-500 text-sm">Manage allowance schedules and legal benefit bases independently from salary tranches.</p>
        </div>
        <button 
          onClick={() => setIsScheduleModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium"
        >
          <Plus size={18} />
          New Schedule
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Sidebar: Schedules */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h2 className="font-semibold text-slate-700 flex items-center gap-2">
                <Calendar size={18} className="text-indigo-500" />
                Allowance Schedules
              </h2>
            </div>
            
            <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto font-human">
              {isLoadingSchedules ? (
                <div className="p-8 text-center text-slate-400">Loading schedules...</div>
              ) : schedules?.length === 0 ? (
                <div className="p-8 text-center text-slate-400">No schedules found. Create one to get started.</div>
              ) : schedules?.map((schedule) => (
                <div 
                  key={schedule.id}
                  onClick={() => setSelectedScheduleId(schedule.id)}
                  className={`p-4 cursor-pointer hover:bg-indigo-50/30 transition-colors relative ${selectedScheduleId === schedule.id ? 'bg-indigo-50 border-l-4 border-indigo-500' : ''}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h3 className={`font-medium ${selectedScheduleId === schedule.id ? 'text-indigo-700' : 'text-slate-800'}`}>
                      {schedule.name}
                    </h3>
                    {schedule.is_active && (
                      <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                        <ShieldCheck size={10} />
                        Active
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 space-y-1">
                    <p className="flex items-center gap-1">
                      <span className="font-semibold text-slate-400 uppercase text-[9px]">Basis:</span> {schedule.legal_basis || 'N/A'}
                    </p>
                    <p className="flex items-center gap-1">
                      <span className="font-semibold text-slate-400 uppercase text-[9px]">Effective:</span> {new Date(schedule.effectivity_date).toLocaleDateString()}
                    </p>
                  </div>
                  
                  {!schedule.is_active && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        activateScheduleMutation.mutate(schedule.id);
                      }}
                      className="mt-3 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 underline uppercase tracking-tight"
                    >
                      Set as Active
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main: Allowances */}
        <div className="col-span-12 lg:col-span-8 space-y-4">
          {selectedScheduleId ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 min-h-[400px]">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                <div>
                  <h2 className="font-semibold text-slate-700 flex items-center gap-2">
                    <ClipboardList size={18} className="text-indigo-500" />
                    Allowance Definitions
                  </h2>
                  <p className="text-[11px] text-slate-400 mt-0.5 uppercase font-bold tracking-widest">
                    {schedules?.find(s => s.id === selectedScheduleId)?.name}
                  </p>
                </div>
                <button 
                  onClick={() => {
                    setEditingAllowance(null);
                    allowanceForm.reset({
                        category: 'Monthly',
                        is_matrix: false,
                        rates: []
                    });
                    setIsAllowanceModalOpen(true);
                  }}
                  className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-semibold flex items-center gap-1.5 border border-indigo-200"
                >
                  <Plus size={16} />
                  Add Allowance
                </button>
              </div>

              <div className="p-6">
                {isLoadingAllowances ? (
                  <div className="p-8 text-center text-slate-400 font-human">Loading allowances...</div>
                ) : allowances?.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                        <AlertCircle size={32} className="text-slate-300" />
                    </div>
                    <h3 className="text-slate-600 font-bold text-lg">No Allowances Defined</h3>
                    <p className="text-slate-400 text-sm max-w-sm mt-1">
                      Start adding allowances (PERA, RATA, Hazard Pay) to this schedule to begin tracking them.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-human">
                    {allowances?.map((allowance) => (
                      <div key={allowance.id} className="p-4 rounded-xl border border-slate-100 hover:border-indigo-200 group transition-all duration-300 hover:shadow-md bg-white relative overflow-hidden">
                        <div className={`absolute top-0 left-0 w-1 h-full ${allowance.category === 'Bonus' ? 'bg-amber-400' : allowance.category === 'Annual' ? 'bg-indigo-400' : 'bg-emerald-400'}`}></div>
                        
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                                    allowance.category === 'Bonus' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 
                                    allowance.category === 'Annual' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 
                                    'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                }`}>
                                    {allowance.category}
                                </span>
                                {allowance.is_matrix && (
                                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                                        <Settings size={10} />
                                        Matrix
                                    </span>
                                )}
                            </div>
                            <h4 className="font-bold text-slate-800 text-lg group-hover:text-indigo-600 transition-colors uppercase tracking-tight leading-tight">
                              {allowance.name}
                            </h4>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                                onClick={() => handleEditAllowance(allowance)}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        <p className="text-xs text-slate-500 mb-4 line-clamp-2 min-h-[32px] font-medium leading-relaxed italic">
                          {allowance.description || 'No description provided.'}
                        </p>

                        <div className="flex items-end justify-between pt-3 border-t border-slate-50">
                          <div>
                            {allowance.is_matrix ? (
                              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider italic">
                                Rates Vary per SG/Position
                              </div>
                            ) : (
                              <div className="flex items-baseline gap-1">
                                <span className="text-xl font-black text-indigo-600 tracking-tighter">
                                  ₱{Number(allowance.amount).toLocaleString()}
                                </span>
                                <span className="text-[10px] text-slate-400 font-bold uppercase">
                                  {allowance.category === 'Monthly' ? '/mo' : '/yr'}
                                </span>
                              </div>
                            )}
                          </div>
                          <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-400 transition-colors" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border-2 border-dashed border-slate-200 min-h-[500px] flex flex-col items-center justify-center p-12 text-center group transition-all duration-300 hover:bg-slate-50/50">
              <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-500 mb-6 group-hover:scale-110 transition-transform shadow-inner">
                <ClipboardList size={40} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 tracking-tight">Select a Schedule</h3>
              <p className="text-slate-400 text-sm max-w-sm mt-3 font-medium leading-relaxed">
                Please select an allowance schedule from the left sidebar to view or manage its benefits and definitions.
              </p>
              <div className="mt-8 flex gap-3">
                 <div className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2 shadow-sm">
                    <Search size={14} />
                    Browse Existing
                 </div>
                 <span className="text-slate-300 self-center">or</span>
                 <button 
                  onClick={() => setIsScheduleModalOpen(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-[11px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                 >
                    <Plus size={14} />
                    Create New
                 </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- Modals --- */}
      {/* Schedule Modal */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 transform animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
                 <Calendar className="text-indigo-600" size={20} />
                 Create Allowance Schedule
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Define a new legal basis for benefits.</p>
            </div>
            <form onSubmit={scheduleForm.handleSubmit(onSubmitSchedule)} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-0.5">Schedule Name</label>
                <input 
                  {...scheduleForm.register('name')}
                  placeholder="e.g. Budget Circular 2024 - Standard"
                  className={`w-full px-4 py-2.5 bg-slate-50 border ${scheduleForm.formState.errors.name ? 'border-rose-300' : 'border-slate-200'} rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none font-medium`}
                />
                {scheduleForm.formState.errors.name && (
                   <p className="text-rose-500 text-[10px] mt-1 font-bold ml-1">{scheduleForm.formState.errors.name.message}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-0.5">Effectivity Date</label>
                    <input 
                    type="date"
                    {...scheduleForm.register('effectivity_date')}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-0.5">Legal Basis</label>
                    <input 
                    {...scheduleForm.register('legal_basis')}
                    placeholder="LBC No. 123"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-medium"
                    />
                  </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="flex-1 py-2.5 text-slate-500 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={createScheduleMutation.isPending}
                  className="flex-1 py-2.5 bg-indigo-600 text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
                >
                  {createScheduleMutation.isPending ? 'Creating...' : 'Create Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Allowance Modal */}
      {isAllowanceModalOpen && (
         <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 transform animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
                             <Plus className="text-indigo-600" size={20} />
                             {editingAllowance ? 'Edit Allowance' : 'New Allowance'}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">Define metadata and value for this benefit.</p>
                    </div>
                    <button onClick={() => setIsAllowanceModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <Trash2 size={20} />
                    </button>
                </div>
                <form onSubmit={allowanceForm.handleSubmit(onSubmitAllowance)} className="p-6 space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                             <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-0.5">Allowance Name</label>
                             <input 
                                {...allowanceForm.register('name')}
                                placeholder="e.g. Personnel Economic Relief Assistance (PERA)"
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                             />
                        </div>
                        <div className="col-span-2">
                             <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-0.5">Description</label>
                             <textarea 
                                {...allowanceForm.register('description')}
                                rows={2}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                             />
                        </div>
                        <div>
                             <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-0.5">Category</label>
                             <select 
                                {...allowanceForm.register('category')}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                             >
                                <option value="Monthly">Monthly</option>
                                <option value="Annual">Annual</option>
                                <option value="Bonus">Bonus</option>
                             </select>
                        </div>
                        <div>
                             <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-0.5">Type</label>
                             <div className="flex bg-slate-100 p-1 rounded-xl">
                                <button 
                                    type="button"
                                    onClick={() => allowanceForm.setValue('is_matrix', false)}
                                    className={`flex-1 py-1.5 text-[10px] uppercase font-black rounded-lg transition-all ${!allowanceForm.watch('is_matrix') ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                                >
                                    Fixed
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => allowanceForm.setValue('is_matrix', true)}
                                    className={`flex-1 py-1.5 text-[10px] uppercase font-black rounded-lg transition-all ${allowanceForm.watch('is_matrix') ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                                >
                                    Matrix
                                </button>
                             </div>
                        </div>
                    </div>

                    {!allowanceForm.watch('is_matrix') ? (
                        <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 animate-in fade-in duration-300">
                             <label className="block text-[11px] font-bold text-indigo-500 uppercase tracking-widest mb-1.5 ml-0.5">Fixed Amount (₱)</label>
                             <input 
                                type="number"
                                {...allowanceForm.register('amount', { valueAsNumber: true })}
                                className="w-full px-4 py-3 bg-white border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-black text-xl text-indigo-700"
                                placeholder="0.00"
                             />
                        </div>
                    ) : (
                        <div className="bg-purple-50/50 p-4 rounded-2xl border border-purple-100 animate-in slide-in-from-bottom-2 duration-300">
                             <div className="flex justify-between items-center mb-3">
                                 <label className="block text-[11px] font-bold text-purple-600 uppercase tracking-widest ml-0.5">Matrix Configuration</label>
                                 <button 
                                    type="button"
                                    onClick={() => {
                                        const current = allowanceForm.getValues('rates') || [];
                                        allowanceForm.setValue('rates', [...current, { condition_key: '', amount: 0, value_type: 'FIXED' }]);
                                    }}
                                    className="text-[10px] font-black uppercase text-purple-700 flex items-center gap-1 hover:underline"
                                 >
                                    <Plus size={12} /> Add Row
                                 </button>
                             </div>
                             
                             <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                                {allowanceForm.watch('rates')?.map((_, index) => (
                                    <div key={index} className="flex gap-2 items-center group">
                                        <input 
                                            {...allowanceForm.register(`rates.${index}.condition_key`)}
                                            placeholder="SG 1-10"
                                            className="flex-[2] px-2 py-2 bg-white border border-purple-100 rounded-lg text-xs font-semibold outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400"
                                        />
                                        <input 
                                            type="number"
                                            {...allowanceForm.register(`rates.${index}.amount`, { valueAsNumber: true })}
                                            placeholder="Rate"
                                            className="flex-1 px-2 py-2 bg-white border border-purple-100 rounded-lg text-xs font-bold font-human outline-none"
                                        />
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                const current = allowanceForm.getValues('rates');
                                                allowanceForm.setValue('rates', current?.filter((_, i) => i !== index));
                                            }}
                                            className="p-1 px-1.5 bg-rose-50 text-rose-500 rounded-md hover:bg-rose-100 transition-colors"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                ))}
                                {(!allowanceForm.watch('rates') || allowanceForm.watch('rates')?.length === 0) && (
                                    <div className="py-6 text-center text-[10px] text-purple-400 font-bold uppercase tracking-wider italic">
                                        No matrix rows defined.
                                    </div>
                                )}
                             </div>
                        </div>
                    )}

                    <div className="flex gap-3 pt-4">
                        <button 
                            type="button"
                            onClick={() => setIsAllowanceModalOpen(false)}
                            className="flex-1 py-2.5 text-slate-500 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 rounded-xl transition-all"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            disabled={upsertAllowanceMutation.isPending}
                            className="flex-1 py-2.5 bg-indigo-600 text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
                        >
                            {upsertAllowanceMutation.isPending ? 'Saving...' : 'Save Allowance'}
                        </button>
                    </div>
                </form>
            </div>
         </div>
      )}
    </div>
  );
};

export default CompensationDashboard;
