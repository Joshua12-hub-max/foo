import React, { useState } from "react";
import { X, Upload, Download, CheckCircle } from "lucide-react";
import { leaveApi } from "@/api/leaveApi";
import { AdminLeaveRequest } from "@/components/Custom/Timekeeping/LeaveRequestComponents/Admin/types";
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface ProcessModalProps {
  isOpen: boolean;
  request: AdminLeaveRequest | null;
  onConfirm: () => void;
  onCancel: () => void;
}

const AdminLeaveRequestProcess: React.FC<ProcessModalProps> = ({ isOpen, request, onConfirm, onCancel }) => {
  const [adminForm, setAdminForm] = useState<File | null>(null);
  const [error, setError] = useState("");
  const queryClient = useQueryClient();

  const processMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      if (!request) return;
      await leaveApi.processLeave(Number(request.id), formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-leaves'] });
      setAdminForm(null);
      setError("");
      onConfirm();
    },
    onError: (err: unknown) => {
        console.error(err);
        setError("Failed to process request");
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setAdminForm(file);
  };

  const handleProcess = () => {
    if (!request) return;
    if (!adminForm) {
      setError("Please upload the processed leave form.");
      return;
    }
    
    // Creating formData for mutation
    const formData = new FormData();
    formData.append('adminForm', adminForm);
    
    processMutation.mutate(formData);
  };

  if (!isOpen || !request) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300" onClick={onCancel}>
      <div 
        className="bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] w-full max-w-md border border-white/20 overflow-hidden animate-in fade-in zoom-in duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="bg-indigo-50 p-2 rounded-lg">
                <Upload className="w-5 h-5 text-indigo-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Process Request</h2>
            </div>
            <button 
              type="button"
              onClick={onCancel} 
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            {error && <p className="text-red-500 text-sm">{error}</p>}
            
            {/* Details */}
            <div className="bg-gray-50 p-4 rounded-xl text-sm space-y-3 border border-gray-100">
                <div className="flex justify-between border-b border-gray-200/50 pb-2">
                  <span className="text-gray-500 font-medium">Employee:</span>
                  <span className="text-gray-900 font-semibold">{request?.first_name} {request?.last_name}</span>
                </div>
                <div className="flex justify-between border-b border-gray-200/50 pb-2">
                  <span className="text-gray-500 font-medium">Type:</span>
                  <span className="text-gray-900 font-semibold">{request?.leave_type} ({request?.with_pay ? 'With Pay' : 'Without Pay'})</span>
                </div>
                <div className="flex justify-between border-b border-gray-200/50 pb-2">
                  <span className="text-gray-500 font-medium">Dates:</span>
                  <span className="text-gray-900 font-semibold">{request?.start_date} to {request?.end_date}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-gray-500 font-medium">Reason:</span>
                  <span className="text-gray-900 font-medium bg-white/50 p-2 rounded-lg border border-gray-100">{request?.reason}</span>
                </div>
                {request?.attachment_path && (
                     <div className="mt-2 pt-2 border-t border-gray-100">
                        <a href={`${import.meta.env.VITE_API_URL.replace('/api', '')}/uploads/${request.attachment_path}`} target="_blank" rel="noreferrer" className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors text-xs font-medium border border-indigo-100">
                            <Download className="w-4 h-4" /> View Employee Attachment
                        </a>
                     </div>
                )}
            </div>

            {/* Upload Admin Form */}
            <div className="border-t border-gray-100 pt-4">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Upload Processed Form <span className="text-red-500">*</span>
                </label>
                <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${adminForm ? 'border-indigo-500 bg-indigo-50/30' : 'border-gray-200 hover:border-indigo-400 hover:bg-gray-50/50'}`}>
                    <input type="file" onChange={handleFileChange} className="hidden" id="adminFormUpload" accept=".pdf,.xlsx,.docx" />
                    <label htmlFor="adminFormUpload" className="cursor-pointer flex flex-col items-center gap-2">
                        <Upload className={`w-8 h-8 ${adminForm ? 'text-indigo-600' : 'text-gray-400'}`} />
                        <span className={`text-sm font-medium ${adminForm ? 'text-indigo-900' : 'text-gray-500'}`}>{adminForm ? adminForm.name : "Click to upload signed form"}</span>
                        <span className="text-[10px] text-gray-400">PDF, XLSX, or DOCX (Max 10MB)</span>
                    </label>
                </div>
            </div>

            <div className="flex gap-3 pt-4 shrink-0">
                <button onClick={onCancel} disabled={processMutation.isPending} className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm disabled:opacity-50 text-sm">Cancel</button>
                <button onClick={handleProcess} disabled={processMutation.isPending} className="flex-1 px-4 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-900/20 disabled:opacity-50 text-sm flex items-center justify-center gap-2">
                    {processMutation.isPending ? 'Processing...' : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Complete Process
                      </>
                    )}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLeaveRequestProcess;
