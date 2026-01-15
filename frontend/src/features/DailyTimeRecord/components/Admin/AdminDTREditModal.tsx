import React, { useEffect } from 'react';
import { X, Save, Clock, AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { dtrEditSchema, DtrEditSchema } from '@/schemas/dtr';
import { DTRRecord } from '../../Utils/adminDTRUtils';

interface AdminDTREditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string | number, data: any) => Promise<void>;
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
        late_minutes: data.late,
        undertime_minutes: data.undertime
      });
      onClose();
    } catch (error) {
      console.error("Failed to save DTR", error);
    }
  };

  if (!isOpen || !record) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Correct Time Record</h3>
            <p className="text-xs text-gray-500 mt-1">
              {record.name} • {record.date}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Time In</label>
              <div className="relative">
                <input
                  type="time"
                  {...register('timeIn')}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-700 font-medium"
                />
                <Clock className="absolute left-3 top-2.5 text-gray-400" size={18} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Time Out</label>
              <div className="relative">
                <input
                  type="time"
                  {...register('timeOut')}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-700 font-medium"
                />
                <Clock className="absolute left-3 top-2.5 text-gray-400" size={18} />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Status</label>
            <select
              {...register('status')}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-700 font-medium appearance-none cursor-pointer"
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

          <div className="flex items-start gap-3 p-3 bg-blue-50 text-blue-700 rounded-lg text-sm border border-blue-100">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <p>Updates will be logged. Changing times may affect calculated hours automatically.</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Save Changes
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
