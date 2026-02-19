import React, { useEffect } from 'react';
import { X, Save, Clock, AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { dtrEditSchema, DtrEditSchema } from '@/schemas/dtr';
import { DTRRecord } from '../../Utils/adminDTRUtils';

export interface DTRUpdatePayload {
  time_in: string | null;
  time_out: string | null;
  status: string;
  late_minutes: number;
  undertime_minutes: number;
}

interface AdminDTREditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string | number, data: DTRUpdatePayload) => Promise<void>;
  record: DTRRecord | null;
}

export const AdminDTREditModal: React.FC<AdminDTREditModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  record 
}) => {
  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<DtrEditSchema>({
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
      // Reconstruct ISO DateTimes
      const baseDate = new Date(record.date); // "Dec 8, 2025" works in Date constructor
      
      let timeInISO = null;
      if (data.timeIn) {
        const [h, m] = data.timeIn.split(':');
        const d = new Date(baseDate);
        d.setHours(parseInt(h), parseInt(m));
        timeInISO = d.toISOString();
      }

      let timeOutISO = null;
      if (data.timeOut) {
        const [h, m] = data.timeOut.split(':');
        const d = new Date(baseDate);
        d.setHours(parseInt(h), parseInt(m));
        timeOutISO = d.toISOString();
      }

      await onSave(record.id, {
        time_in: timeInISO,
        time_out: timeOutISO,
        status: data.status,
        late_minutes: data.late ?? 0,
        undertime_minutes: data.undertime ?? 0
      });
      onClose();
    } catch (error) {
      console.error("Failed to save DTR", error);
    }
  };

  if (!isOpen || !record) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300" onClick={onClose}>
      <div 
        className="bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] w-full max-w-md border border-white/20 overflow-hidden animate-in fade-in zoom-in duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="bg-slate-50 p-2 rounded-lg">
                <Clock className="w-5 h-5 text-slate-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Correct Time Record</h2>
            </div>
            <button 
              type="button"
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

        {/* Body */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="px-6 pb-6 space-y-5">
            
            {/* Context Info */}
            <div className="text-sm text-gray-500">
              Editing record for <span className="font-medium text-gray-900">{record.name}</span> on <span className="font-medium text-gray-900">{record.date}</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Time In</label>
                <div className="relative">
                  <input
                    type="time"
                    {...register('timeIn')}
                    className="w-full pl-3 pr-3 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 text-gray-900"
                  />
                  <Clock className="absolute top-2.5 right-3 text-gray-400 pointer-events-none" size={16} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Time Out</label>
                <div className="relative">
                  <input
                    type="time"
                    {...register('timeOut')}
                    className="w-full pl-3 pr-3 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 text-gray-900"
                  />
                  <Clock className="absolute top-2.5 right-3 text-gray-400 pointer-events-none" size={16} />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Status</label>
              <select
                {...register('status')}
                className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 text-gray-900 appearance-none cursor-pointer"
              >
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
                <option value="Late">Late</option>
                <option value="Leave">Leave</option>
                <option value="Undertime">Undertime</option>
                <option value="Half Day">Half Day</option>
              </select>
              {errors.status && <p className="text-red-500 text-xs mt-1">{errors.status.message}</p>}
            </div>

            {/* Neutralized Alert */}
            <div className="flex items-start gap-3 p-3 bg-gray-50 text-gray-600 rounded-lg text-sm border border-gray-200">
              <AlertCircle size={18} className="shrink-0 mt-0.5 text-gray-400" />
              <p>Changing times may affect calculated hours automatically.</p>
            </div>
          </div>

          {/* Footer - No background, just spacing */}
          <div className="px-6 pb-6 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors shadow-lg shadow-gray-200 disabled:opacity-70 flex items-center justify-center gap-2"
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
