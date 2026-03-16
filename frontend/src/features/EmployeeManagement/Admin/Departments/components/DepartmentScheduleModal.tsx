import React, { useState, useEffect, useMemo } from 'react';
import { X, Clock, Calendar, Check, Loader2, Info } from 'lucide-react';
import { scheduleApi, ShiftTemplateData } from '@/api/scheduleApi';
import { Department } from '@/types/org';
import Combobox from '@/components/Custom/Combobox';

interface DepartmentScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  department: Department | null;
}

const RECURRENCE_OPTIONS = [
  { value: 'daily', label: 'Daily (Monday - Friday)' },
  { value: 'none', label: 'Specific Dates Only' }
];

const DepartmentScheduleModal: React.FC<DepartmentScheduleModalProps> = ({ isOpen, onClose, department }) => {
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<ShiftTemplateData[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    scheduleTitle: '',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    repeat: 'daily' as 'daily' | 'none'
  });

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
      if (department) {
        setFormData(prev => ({ 
            ...prev, 
            scheduleTitle: `${department.name} Schedule`,
            startDate: new Date().toISOString().split('T')[0]
        }));
      }
      setSuccess(false);
      setError(null);
    }
  }, [isOpen, department]);

  const fetchTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const response = await scheduleApi.getShiftTemplates();
      if (response && response.success) {
        setTemplates(response.templates || []);
      }
    } catch (err) {
      console.error('Failed to fetch shift templates:', err);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const templateOptions = useMemo(() => {
    return templates.map(t => ({
      value: t.id?.toString() || t.name,
      label: `${t.name} (${t.startTime.substring(0,5)} - ${t.endTime.substring(0,5)})`
    }));
  }, [templates]);

  const handleSelectTemplate = (value: string) => {
    const template = templates.find(t => t.id?.toString() === value || t.name === value);
    if (template) {
      setFormData(prev => ({
        ...prev,
        startTime: template.startTime,
        endTime: template.endTime
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!department) return;

    setLoading(true);
    setError(null);

    try {
      const response = await scheduleApi.createDepartmentSchedule({
        departmentId: department.id,
        ...formData
      });

      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setError(response.message || 'Failed to save schedule');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred while saving the schedule');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Static Backdrop (No Blur) */}
      <div className="absolute inset-0 bg-gray-900/40 transition-opacity" onClick={onClose} />
      
      {/* Modal Container */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
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

                {/* Templates Combobox */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Shift Template</label>
                  <Combobox
                    options={templateOptions}
                    value={null} // Keep null so it acts as a selector
                    onChange={handleSelectTemplate}
                    placeholder={loadingTemplates ? "Loading templates..." : "Search or Select Shift Template..."}
                    className="w-full"
                    buttonClassName="bg-gray-50 border-gray-200"
                    disabled={loadingTemplates}
                  />
                </div>

                {/* Schedule Title */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Schedule Title</label>
                  <input
                    type="text"
                    required
                    value={formData.scheduleTitle}
                    onChange={(e) => setFormData({ ...formData, scheduleTitle: e.target.value })}
                    placeholder="e.g. Next Cut-off Adjustment"
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-400 focus:outline-none transition-all bg-gray-50 font-medium text-gray-800"
                  />
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Start Date</label>
                    <div className="relative">
                      <input
                        type="date"
                        required
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-400 focus:outline-none transition-all bg-gray-50 font-medium text-gray-800"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">End Date</label>
                    <div className="relative">
                      <input
                        type="date"
                        required
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-400 focus:outline-none transition-all bg-gray-50 font-medium text-gray-800"
                      />
                    </div>
                  </div>
                </div>

                {/* Time Range */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Start Time</label>
                    <input
                      type="time"
                      required
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-400 focus:outline-none transition-all bg-gray-50 font-medium text-gray-800 font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">End Time</label>
                    <input
                      type="time"
                      required
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-400 focus:outline-none transition-all bg-gray-50 font-medium text-gray-800 font-mono"
                    />
                  </div>
                </div>

                {/* Recurrence Combobox */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Recurrence</label>
                  <Combobox
                    options={RECURRENCE_OPTIONS}
                    value={formData.repeat}
                    onChange={(val) => setFormData({ ...formData, repeat: val as 'daily' | 'none' })}
                    placeholder="Select Recurrence..."
                    className="w-full"
                    buttonClassName="bg-gray-50 border-gray-200"
                  />
                </div>
              </div>
            </form>

            {/* Footer */}
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
