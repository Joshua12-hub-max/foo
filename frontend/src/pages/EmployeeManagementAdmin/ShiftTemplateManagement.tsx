import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, Clock, Info, Check, Loader2, Sparkles, X, Building2 } from 'lucide-react';
import { scheduleApi, ShiftTemplateData } from '@/api/scheduleApi';
import { departmentApi } from '@/api/departmentApi';
import { useToastStore } from '@/stores';
import Combobox from '@/components/Custom/Combobox';

const ShiftTemplateManagement: React.FC = () => {
    const [templates, setTemplates] = useState<ShiftTemplateData[]>([]);
    const [departments, setDepartments] = useState<{ id: number; name: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<ShiftTemplateData | null>(null);
    const [submitting, setSubmitting] = useState(false);
    
    const showToast = useToastStore(state => state.showToast);

    const [formData, setFormData] = useState({
        name: '',
        startTime: '08:00',
        endTime: '17:00',
        departmentId: null as number | null,
        description: '',
        isDefault: false,
        workingDays: 'Monday,Tuesday,Wednesday,Thursday,Friday'
    });

    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    const toggleDay = (day: string) => {
        const currentDays = formData.workingDays ? formData.workingDays.split(',').map(d => d.trim()).filter(d => d) : [];
        let newDays;
        if (currentDays.includes(day)) {
            newDays = currentDays.filter(d => d !== day);
        } else {
            // Keep order
            newDays = daysOfWeek.filter(d => currentDays.includes(d) || d === day);
        }
        setFormData({ ...formData, workingDays: newDays.join(',') });
    };

    useEffect(() => {
        fetchTemplates();
        fetchDepartments();
    }, []);

    const fetchTemplates = async () => {
        setLoading(true);
        try {
            const res = await scheduleApi.getShiftTemplates();
            if (res.success) {
                setTemplates(res.templates || []);
            }
        } catch (err) {
            console.error(err);
            showToast('Failed to load shift templates', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchDepartments = async () => {
        try {
            const res = await departmentApi.getDepartments();
            if (res.success) {
                setDepartments(res.departments || []);
            }
        } catch (err) {
            console.error('Failed to load departments:', err);
        }
    };

    const handleOpenModal = (template?: ShiftTemplateData) => {
        if (template) {
            setEditingTemplate(template);
            setFormData({
                name: template.name,
                startTime: template.startTime.substring(0, 5),
                endTime: template.endTime.substring(0, 5),
                departmentId: template.departmentId || null,
                description: template.description || '',
                isDefault: !!template.isDefault,
                workingDays: template.workingDays || 'Monday,Tuesday,Wednesday,Thursday,Friday'
            });
        } else {
            setEditingTemplate(null);
            setFormData({
                name: '',
                startTime: '08:00',
                endTime: '17:00',
                departmentId: null,
                description: '',
                isDefault: false,
                workingDays: 'Monday,Tuesday,Wednesday,Thursday,Friday'
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editingTemplate?.id) {
                await scheduleApi.updateShiftTemplate(editingTemplate.id, formData);
                showToast('Shift template updated', 'success');
            } else {
                await scheduleApi.createShiftTemplate(formData);
                showToast('Shift template created', 'success');
            }
            setIsModalOpen(false);
            fetchTemplates();
        } catch (err) {
            console.error(err);
            showToast('Failed to save template', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this template?')) return;
        try {
            await scheduleApi.deleteShiftTemplate(id);
            showToast('Template deleted', 'success');
            fetchTemplates();
        } catch (err) {
            console.error(err);
            showToast('Failed to delete template', 'error');
        }
    };

    const deptOptions = [
        { value: 'all', label: 'All Departments (Global)' },
        ...departments.map(d => ({ value: String(d.id), label: d.name }))
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                        <Sparkles size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-800">Shift Templates</h2>
                        <p className="text-xs text-gray-500 font-medium">Standardized work hours for quick scheduling</p>
                    </div>
                </div>
                <button 
                    onClick={() => handleOpenModal()}
                    className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-800 transition-all flex items-center gap-2 shadow-md shadow-gray-900/20 active:scale-95"
                >
                    <Plus size={16} />
                    Create Template
                </button>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <Loader2 className="w-8 h-8 text-gray-400 animate-spin mb-3" />
                    <p className="text-sm font-bold text-gray-400 tracking-widest">Loading Templates...</p>
                </div>
            ) : templates.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <Info className="mx-auto text-gray-300 mb-4" size={48} />
                    <h3 className="text-gray-500 font-bold">No templates found</h3>
                    <p className="text-gray-400 text-sm mt-1">Start by creating a new shift template.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {templates.map(temp => (
                        <div key={temp.id} className={`bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition-all group border-l-4 ${temp.isDefault ? 'border-amber-500 bg-amber-50/10' : 'border-blue-500'}`}>
                            <div className="flex justify-between items-start mb-4">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold text-gray-800 group-hover:text-blue-600 transition-colors truncate">{temp.name}</h3>
                                        {temp.isDefault && (
                                            <span className="bg-amber-100 text-amber-700 text-[8px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5 shrink-0">
                                                <Check size={8} strokeWidth={4} /> Default
                                            </span>
                                        )}
                                    </div>
                                    {temp.departmentName ? (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded mt-1">
                                            <Building2 size={10} />
                                            {temp.departmentName}
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-500 bg-gray-50 px-2 py-0.5 rounded mt-1">
                                            Global Shift
                                        </span>
                                    )}
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
                                    <button onClick={() => handleOpenModal(temp)} className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all border border-gray-100"><Edit size={14} /></button>
                                    <button onClick={() => handleDelete(temp.id!)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all border border-gray-100"><Trash2 size={14} /></button>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-xs font-bold text-gray-600 bg-gray-50 p-2 rounded-lg">
                                    <Clock size={14} className="text-blue-500" />
                                    <span>{temp.startTime.substring(0,5)} — {temp.endTime.substring(0,5)}</span>
                                </div>
                                
                                {temp.workingDays && (
                                    <div className="flex flex-wrap gap-1">
                                        {temp.workingDays.split(',').map(day => (
                                            <span key={day} className="text-[9px] font-bold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{day.substring(0,3)}</span>
                                        ))}
                                    </div>
                                )}

                                {temp.description && (
                                    <p className="text-xs text-gray-500 italic leading-relaxed line-clamp-2">"{temp.description}"</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Template Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/40" onClick={() => setIsModalOpen(false)} />
                    <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h2 className="text-lg font-bold text-gray-800">{editingTemplate ? 'Edit Shift Template' : 'New Shift Template'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto custom-scrollbar">
                            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-blue-50/30 p-3 rounded-xl border border-blue-100/50">
                                <div className="space-y-0.5">
                                    <p className="text-sm font-bold text-gray-800">System Default Shift</p>
                                    <p className="text-[10px] text-gray-500 font-medium">Auto-assigned to every new employee upon registration</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only peer" 
                                        checked={formData.isDefault}
                                        onChange={e => setFormData({...formData, isDefault: e.target.checked})}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                                </label>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 block ml-1">Template Name</label>
                                <input 
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                    placeholder="e.g. Regular (8am-5pm)"
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm font-semibold"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 block ml-1">Applicable Department</label>
                                <Combobox 
                                    options={deptOptions}
                                    value={formData.departmentId ? String(formData.departmentId) : 'all'}
                                    onChange={(val) => setFormData({ ...formData, departmentId: val === 'all' ? null : Number(val) })}
                                    placeholder="Select department or 'Global'..."
                                    className="w-full"
                                    buttonClassName="bg-white border-gray-200"
                                />
                                <p className="text-[9px] text-gray-400 italic ml-1">Templates assigned to a department only show up for that department's scheduling.</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 block ml-1">Work Days Selection</label>
                                <div className="flex flex-wrap gap-2">
                                    {daysOfWeek.map(day => {
                                        const isSelected = formData.workingDays?.split(',').map(d => d.trim()).includes(day);
                                        return (
                                            <button
                                                key={day}
                                                type="button"
                                                onClick={() => toggleDay(day)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                                                    isSelected 
                                                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                                                        : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
                                                }`}
                                            >
                                                {day.substring(0, 3)}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 block ml-1">Start Time</label>
                                    <input 
                                        type="time"
                                        required
                                        value={formData.startTime}
                                        onChange={e => setFormData({...formData, startTime: e.target.value})}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg outline-none text-sm font-mono font-bold"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 block ml-1">End Time</label>
                                    <input 
                                        type="time"
                                        required
                                        value={formData.endTime}
                                        onChange={e => setFormData({...formData, endTime: e.target.value})}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg outline-none text-sm font-mono font-bold"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 block ml-1">Description (Optional)</label>
                                <textarea 
                                    value={formData.description}
                                    onChange={e => setFormData({...formData, description: e.target.value})}
                                    rows={3}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg outline-none text-sm resize-none"
                                />
                            </div>
                            <div className="pt-2 flex gap-3 sticky bottom-0 bg-white pb-2">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2.5 border-2 border-gray-100 rounded-lg text-sm font-bold text-gray-500 hover:bg-gray-50 transition-all">Cancel</button>
                                <button type="submit" disabled={submitting} className="flex-1 px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-bold hover:bg-gray-800 transition-all shadow-lg flex justify-center items-center gap-2">
                                    {submitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                                    {editingTemplate ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ShiftTemplateManagement;
