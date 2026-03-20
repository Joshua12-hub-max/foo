import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { confirmHiredSchema, type ConfirmHiredData } from '@/schemas/recruitmentSchema';
import type { Applicant } from '@/types/recruitment';

interface ConfirmHiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicant: Applicant | null;
  onConfirm: (id: number, startDate: string, selectedDocs: string[], customNotes: string) => Promise<void>;
}

const ConfirmHiredModal: React.FC<ConfirmHiredModalProps> = ({
  isOpen,
  onClose,
  applicant,
  onConfirm
}) => {
  const [selectedDocs, setSelectedDocs] = React.useState<string[]>([]);
  const [customNotes, setCustomNotes] = React.useState<string>('');
  const [defaultShift, setDefaultShift] = React.useState<{ startTime: string } | null>(null);
  
  React.useEffect(() => {
    const fetchDefaultShift = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/schedules/shift-templates/default`, { withCredentials: true });
        if (response.data.success) setDefaultShift(response.data.data);
      } catch (err) {
        console.error('Failed to fetch default shift:', err);
      }
    };
    fetchDefaultShift();
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue
  } = useForm<ConfirmHiredData>({
    resolver: zodResolver(confirmHiredSchema),
    defaultValues: {
      startDate: new Date().toISOString().split('T')[0] + 'T08:00'
    }
  });

  React.useEffect(() => {
    if (defaultShift) {
      const timePart = defaultShift.startTime.substring(0, 5);
      setValue('startDate', new Date().toISOString().split('T')[0] + 'T' + timePart);
    }
  }, [defaultShift, setValue]);

  if (!isOpen || !applicant) return null;

  const onSubmit = async (data: ConfirmHiredData) => {
    await onConfirm(applicant.id, data.startDate, selectedDocs, customNotes);
    setSelectedDocs([]);
    setCustomNotes('');
    reset();
    onClose();
  };

  const toggleDoc = (path: string) => {
    setSelectedDocs(prev => 
      prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-gray-900 px-6 py-4 flex justify-between items-center">
          <h3 className="text-white font-bold flex items-center gap-2">
            <CheckCircle size={20} className="text-emerald-400" />
            Confirm for Duty & Document Audit
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 overflow-y-auto max-h-[85vh]">
          <div className="mb-6 bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex gap-3">
            <AlertCircle className="text-emerald-600 flex-shrink-0" size={20} />
            <div className="text-sm text-emerald-800">
              <p className="font-bold mb-1">Confirmation for {applicant.firstName} {applicant.lastName}</p>
              <p>Verify uploads below. Selected files will be attached to the official "Start of Duty" email.</p>
            </div>
          </div>

          <div className="space-y-5">
            {/* 1. Date & Time */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">
                Official Start Date & Time
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="datetime-local"
                  {...register('startDate')}
                  className={`w-full pl-10 pr-4 py-2.5 bg-gray-50 border ${
                    errors.startDate ? 'border-red-500' : 'border-gray-200'
                  } rounded-xl focus:ring-2 focus:ring-gray-900 outline-none transition-all font-medium`}
                />
              </div>
              {errors.startDate && (
                <p className="text-red-500 text-[10px] mt-1 font-bold ml-1">{errors.startDate.message}</p>
              )}
            </div>

            {/* 2. Document Selection */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">
                Include Uploaded Requirements in Email
              </label>
              <div className="grid grid-cols-1 gap-2">
                {applicant.resumePath && (
                  <label className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all ${selectedDocs.includes(applicant.resumePath) ? 'bg-gray-900 border-gray-900 text-white' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}>
                    <input type="checkbox" className="hidden" checked={selectedDocs.includes(applicant.resumePath)} onChange={() => toggleDoc(applicant.resumePath!)} />
                    <CheckCircle size={16} className={selectedDocs.includes(applicant.resumePath) ? 'text-emerald-400' : 'text-gray-300'} />
                    <span className="text-xs font-bold">Resume / PDS</span>
                  </label>
                )}
                {applicant.eligibilityPath && (
                  <label className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all ${selectedDocs.includes(applicant.eligibilityPath) ? 'bg-gray-900 border-gray-900 text-white' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}>
                    <input type="checkbox" className="hidden" checked={selectedDocs.includes(applicant.eligibilityPath)} onChange={() => toggleDoc(applicant.eligibilityPath!)} />
                    <CheckCircle size={16} className={selectedDocs.includes(applicant.eligibilityPath) ? 'text-emerald-400' : 'text-gray-300'} />
                    <span className="text-xs font-bold">Eligibility Certificate</span>
                  </label>
                )}
              </div>
            </div>

            {/* 3. Custom Instructions */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">
                Manual Instructions / Missing Requirements
              </label>
              <textarea
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder="Example: Please bring original copies of your NBI clearance and Birth Certificate..."
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none transition-all font-medium text-sm min-h-[100px]"
              />
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-gray-200"
            >
              {isSubmitting ? 'Processing...' : 'Confirm & Send Email'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConfirmHiredModal;
