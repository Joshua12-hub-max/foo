import React, { useEffect } from 'react';
import { X, Send, Clock, AlertCircle, Info } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { dtrCorrectionSchema, DtrCorrectionSchema } from '@/schemas/dtr';
import { EmployeeDTRRecord } from '../../Utils/employeeDTRUtils';
import { dtrApi } from '@/api/dtrApi';
import { toast } from 'react-hot-toast';

interface DTRCorrectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: EmployeeDTRRecord | null;
  onSuccess: () => void;
}

export const DTRCorrectionModal: React.FC<DTRCorrectionModalProps> = ({ 
  isOpen, 
  onClose, 
  record,
  onSuccess
}) => {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<DtrCorrectionSchema>({
    resolver: zodResolver(dtrCorrectionSchema),
    defaultValues: {
      timeIn: '',
      timeOut: '',
      reason: ''
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
        reason: ''
      });
    }
  }, [isOpen, record, reset]);

  const onSubmit = async (data: DtrCorrectionSchema) => {
    if (!record) return;

    try {
      // Reconstruct ISO DateTimes for the submission
      // We send the date and the new times
      const payload = {
        date: record.date, // Assumes record.date is "YYYY-MM-DD" or similar stable format
        originalTimeIn: record.timeIn !== '-' ? record.timeIn : null,
        originalTimeOut: record.timeOut !== '-' ? record.timeOut : null,
        correctedTimeIn: data.timeIn || null,
        correctedTimeOut: data.timeOut || null,
        reason: data.reason
      };

      const res = await dtrApi.requestCorrection(payload);
      
      if (res.data.success) {
        toast.success(res.data.message);
        onSuccess();
        onClose();
      } else {
        toast.error(res.data.message || 'Failed to submit request');
      }
    } catch (error: any) {
      console.error("Failed to submit DTR correction", error);
      toast.error(error.response?.data?.message || 'Something went wrong');
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
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="bg-slate-50 p-2.5 rounded-xl">
                <Clock className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 leading-tight">Request Correction</h2>
                <p className="text-xs text-gray-500 font-medium">For {record.date}</p>
              </div>
            </div>
            <button 
              type="button"
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

        {/* Body */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="px-6 py-6 space-y-6">
            
            {/* Info Box */}
            <div className="flex items-start gap-3 p-3.5 bg-slate-50 text-slate-600 rounded-xl text-sm border border-slate-200">
              <Info size={18} className="shrink-0 mt-0.5 text-slate-400" />
              <p className="font-medium leading-relaxed">
                Provide the correct times and a valid reason. Your request will be reviewed by HR/Admin.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-700 mb-1.5 block uppercase tracking-wider">Corrected Time In</label>
                <div className="relative">
                  <input
                    type="time"
                    {...register('timeIn')}
                    className="w-full pl-3 pr-3 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-slate-500/10 focus:border-slate-500 text-gray-900 transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Corrected Time Out</label>
                <div className="relative">
                  <input
                    type="time"
                    {...register('timeOut')}
                    className="w-full pl-3 pr-3 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-slate-500/10 focus:border-slate-500 text-gray-900 transition-all font-medium"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Reason for Correction</label>
              <textarea
                {...register('reason')}
                rows={3}
                placeholder="Why is a correction needed? (e.g., system glitch, forgot to scan)"
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-slate-500/10 focus:border-slate-500 text-gray-900 transition-all font-medium placeholder:text-gray-400 resize-none text-sm"
              />
              {errors.reason && <p className="text-red-500 text-[10px] mt-1.5 font-bold uppercase tracking-wide px-1">{errors.reason.message}</p>}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 pb-8 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-50 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-100 transition-all border border-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all shadow-lg shadow-gray-200 disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit Request
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
