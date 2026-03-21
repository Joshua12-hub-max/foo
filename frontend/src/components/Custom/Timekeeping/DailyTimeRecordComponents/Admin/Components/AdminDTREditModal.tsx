import React, { useEffect } from 'react';
import { X, Clock, AlertCircle } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Combobox from '@/components/Custom/Combobox';
import { dtrEditSchema, DtrEditSchema } from '@/schemas/dtr';
import { DTRRecord } from '../Utils/adminDTRUtils';

interface AdminDTREditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string | number, data: {
    timeIn: string | null;
    timeOut: string | null;
    status: string;
    lateMinutes: number;
    undertimeMinutes: number;
  }) => Promise<void>;
  record: DTRRecord | null;
}

export const AdminDTREditModal: React.FC<AdminDTREditModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  record 
}) => {
  const { register, handleSubmit, reset, watch, control, formState: { errors, isSubmitting } } = useForm<DtrEditSchema>({
    resolver: zodResolver(dtrEditSchema),
    defaultValues: {
      timeIn: '',
      timeOut: '',
      status: 'Present',
      late: 0,
      undertime: 0
    }
  });

  // Helper to convert formatted time (e.g. "08:00 AM") to "HH:mm" for input type="time"
  const toInputTime = (timeStr: string) => {
    if (!timeStr || timeStr === '--:--' || timeStr === '-') return '';
    try {
      const [time, period] = timeStr.split(' ');
      const [hours, minutes] = time.split(':');
      let h = parseInt(hours);
      
      if (period === 'PM' && h !== 12) h += 12;
      if (period === 'AM' && h === 12) h = 0;
      
      return `${h.toString().padStart(2, '0')}:${minutes}`;
    } catch (e) {
      return '';
    }
  };

  useEffect(() => {
    if (isOpen && record) {
      reset({
        timeIn: toInputTime(record.timeIn),
        timeOut: toInputTime(record.timeOut),
        status: record.status || 'Present',
        late: 0,
        undertime: 0
      });
    }
  }, [isOpen, record, reset]);

  const onSubmit = async (data: DtrEditSchema) => {
    if (!record) return;

    try {
      await onSave(record.id, {
        timeIn: data.timeIn || null,
        timeOut: data.timeOut || null,
        status: data.status,
        lateMinutes: data.late || 0,
        undertimeMinutes: data.undertime || 0
      });
      onClose();
    } catch (error) {
      console.error("Failed to save DTR", error);
    }
  };

  const getStatusColor = (status: string) => {
    const styles: Record<string, string> = {
      Present: 'bg-green-100 text-green-700',
      Absent: 'bg-red-100 text-red-700',
      Late: 'bg-orange-100 text-orange-700',
      Leave: 'bg-blue-100 text-blue-700',
      Undertime: 'bg-amber-100 text-amber-700',
      'Half Day': 'bg-purple-100 text-purple-700',
      Duty: 'bg-green-800 text-white',
    };
    return styles[status] || 'bg-gray-100 text-gray-700';
  };

  if (!isOpen || !record) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 transition-all duration-300" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] w-full max-w-md border border-white/20 overflow-hidden animate-in fade-in zoom-in duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg">
                <Clock className="w-5 h-5 text-gray-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">Correct Time Record</h2>
            </div>
            <button 
              type="button"
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

        {/* Body */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="px-6 pb-6 space-y-5">
            
            {/* Context Info */}
            <div className="text-sm text-gray-800 mt-4">
              Editing record for <span className="font-semibold text-gray-800">{record.name}</span> on <span className="font-semibold text-gray-800">{record.date}</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Time In</label>
                <div className="relative">
                  <input
                    type="time"
                    {...register('timeIn')}
                    className="w-full pl-3 pr-3 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 text-gray-800"
                  />
                  <Clock className="absolute top-2.5 right-3 text-gray-400 pointer-events-none" size={16} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Time Out</label>
                <div className="relative">
                  <input
                    type="time"
                    {...register('timeOut')}
                    className="w-full pl-3 pr-3 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 text-gray-800"
                  />
                  <Clock className="absolute top-2.5 right-3 text-gray-400 pointer-events-none" size={16} />
                </div>
              </div>
            </div>

            <div className="relative z-[60]">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Status</label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Combobox
                    options={[
                      { value: 'Present', label: 'Present' },
                      { value: 'Absent', label: 'Absent' },
                      { value: 'Late', label: 'Late' },
                      { value: 'Leave', label: 'Leave' },
                      { value: 'Undertime', label: 'Undertime' },
                      { value: 'Half Day', label: 'Half Day' },
                      { value: 'Duty', label: 'Duty' }
                    ]}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Select Status"
                    buttonClassName={`w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 font-bold h-[42px] ${getStatusColor(field.value)}`}
                  />
                )}
              />
              {errors.status && <p className="text-red-500 text-xs mt-1">{errors.status.message}</p>}
            </div>

            {/* Alert */}
            <div className="flex items-start gap-3 p-3 bg-gray-50 text-gray-800 rounded-lg text-sm border border-gray-200">
              <AlertCircle size={18} className="shrink-0 mt-0.5 text-gray-400" />
              <p className="font-medium">Changing times may affect calculated hours automatically.</p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg font-bold text-sm hover:bg-gray-50 transition-colors shadow-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 bg-gray-900 text-white rounded-lg font-bold text-sm hover:bg-gray-800 transition-colors shadow-md disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
