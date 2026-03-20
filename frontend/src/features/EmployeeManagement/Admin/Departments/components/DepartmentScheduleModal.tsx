import React, { useState, useEffect } from 'react';
import { X, Calendar, Check, Loader2, Info, Sparkles } from 'lucide-react';
import Combobox from '@/components/Custom/Combobox';
import { scheduleApi, ShiftTemplateData } from '@/api/scheduleApi';
import { Department } from '@/types/org';
import axios from 'axios';

interface DepartmentScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  department: Department | null;
}

const DepartmentScheduleModal: React.FC<DepartmentScheduleModalProps> = ({ isOpen, onClose, department }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<ShiftTemplateData[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  const [formData, setFormData] = useState({
    scheduleTitle: '',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: ''
  });
  const [defaultShift, setDefaultShift] = useState<{ startTime: string; endTime: string; name: string } | null>(null);

  useEffect(() => {
     const fetchDefaultShift = async () => {
         try {
             const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/schedules/shift-templates/default`);
             if (res.data.success) setDefaultShift(res.data.data);
         } catch (err) {
             console.error('Failed to fetch default shift:', err);
         }
     };
     fetchDefaultShift();
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
      if (department) {
        setFormData(prev => ({ 
            ...prev, 
            scheduleTitle: `${department.name} Schedule`,
            startDate: new Date().toISOString().split('T')[0],
            // Default to system default or fallback to 8-5
            startTime: defaultShift?.startTime.substring(0, 5) || '08:00',
            endTime: defaultShift?.endTime.substring(0, 5) || '17:00'
        }));
      }
      setSuccess(false);
      setError(null);
    }
  }, [isOpen, department, defaultShift]);

  const fetchTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const res = await scheduleApi.getShiftTemplates();
      if (res.success) {
        const filtered = (res.templates || []).filter(t => 
            t.departmentId === null || (department && t.departmentId === department.id)
        );
        setTemplates(filtered);
      }
    } catch (err) {
      console.error('Failed to fetch templates:', err);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleSelectTemplate = (templateId: string) => {
    const template = templates.find(t => String(t.id) === templateId);
    if (template) {
      setFormData(prev => ({
        ...prev,
        startTime: template.startTime.substring(0, 5),
        endTime: template.endTime.substring(0, 5),
        scheduleTitle: template.name
      }));
    }
  };

  const handleSetStandard = () => {
    setFormData(prev => ({
        ...prev,
        startTime: defaultShift?.startTime.substring(0, 5) || '08:00',
        endTime: defaultShift?.endTime.substring(0, 5) || '17:00',
        scheduleTitle: department ? `${department.name} ${defaultShift?.name || 'Standard'} Shift` : (defaultShift?.name || 'Standard Shift')
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!department) return;

    setLoading(true);
    setError(null);

    try {
      const response = await scheduleApi.createDepartmentSchedule({
        departmentId: department.id,
        ...formData,
        repeat: 'daily'
      });

      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setError(response.message || 'Failed to save schedule');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while saving the schedule';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/40 transition-opacity" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Set Dept. Schedule</h2>
            <p className="text-xs text-gray-500 font-medium">{department?.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        {success ? (
          <div className="p-12 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-500">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Check className="text-green-600 w-8 h-8" />
            </div>
            <h4 className="text-xl font-bold text-gray-900">Schedule Applied!</h4>
            <p className="text-gray-500 mt-2 text-sm">The new department schedule has been successfully set.</p>
          </div>
        ) : (
          <>
            <form id="dept-schedule-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-5">
                {error && (
                  <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-lg text-xs flex items-center gap-2">
                    <Info size={14} />
                    {error}
                  </div>
                )}

                <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Quick Actions</label>
                    <button 
                        type="button"
                        onClick={handleSetStandard}
                        className="text-[10px] font-black uppercase px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded hover:bg-emerald-100 transition-all"
                    >
                        Set to {defaultShift?.name || 'Standard'} ({defaultShift ? `${defaultShift.startTime.substring(0, 5)}-${defaultShift.endTime.substring(0, 5)}` : '8-5'})
                    </button>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-1.5 ml-1">
                    <Sparkles size={14} className="text-blue-500" />
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Use Shift Template</label>
                  </div>
                  <div className="relative z-[60]">
                    <Combobox
                      options={[
                        { value: '', label: loadingTemplates ? 'Loading templates...' : 'Select a shift from library...' },
                        ...templates.map(t => ({
                          value: String(t.id),
                          label: `${t.name} (${t.startTime.substring(0, 5)} - ${t.endTime.substring(0, 5)})`
                        }))
                      ]}
                      value=""
                      onChange={(val) => handleSelectTemplate(val)}
                      placeholder="Select a shift from library..."
                      buttonClassName="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-semibold text-gray-800 transition-all bg-blue-50/30 border-blue-100/50 outline-none focus:ring-2 focus:ring-blue-500/20 h-[42px]"
                    />
                  </div>
                  <p className="text-[9px] text-gray-400 italic ml-1 leading-tight">Selecting a template auto-fills the fields below.</p>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Schedule Title</label>
                  <input
                    type="text"
                    required
                    value={formData.scheduleTitle}
                    onChange={(e) => setFormData({ ...formData, scheduleTitle: e.target.value })}
                    placeholder="e.g. Next Cut-off Adjustment"
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-semibold text-gray-800 transition-all bg-gray-50 border-gray-200"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Start Date</label>
                    <input
                      type="date"
                      required
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-semibold text-gray-800 transition-all bg-gray-50 border-gray-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">End Date</label>
                    <input
                      type="date"
                      required
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-semibold text-gray-800 transition-all bg-gray-50 border-gray-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Start Time</label>
                    <input
                      type="time"
                      required
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-semibold text-gray-800 transition-all bg-gray-50 border-gray-200 font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">End Time</label>
                    <input
                      type="time"
                      required
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-semibold text-gray-800 transition-all bg-gray-50 border-gray-200 font-mono"
                    />
                  </div>
                </div>


              </div>
            </form>

            <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end gap-3 z-10">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                form="dept-schedule-form"
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-bold text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2 min-w-[140px]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    <Calendar size={16} />
                    <span>Apply Schedule</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DepartmentScheduleModal;
