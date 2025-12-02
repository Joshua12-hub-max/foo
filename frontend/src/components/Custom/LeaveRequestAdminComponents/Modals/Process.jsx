import React, { useState, useEffect } from "react";
import { X, FileText, Upload, CheckCircle, Download, CreditCard } from "lucide-react";
import { leaveApi } from "../../../../api/leaveApi";

const AdminLeaveRequestProcess = ({ isOpen, request, onConfirm, onCancel }) => {
  const [adminForm, setAdminForm] = useState(null);
  const [credits, setCredits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && request?.employee_id) {
      fetchCredits();
    }
  }, [isOpen, request]);

  const fetchCredits = async () => {
    try {
      const res = await leaveApi.getCredits(request.employee_id);
      setCredits(res.data.credits || []);
    } catch (err) {
      console.error("Failed to fetch credits", err);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setAdminForm(file);
  };

  const handleProcess = async () => {
    if (!adminForm) {
      setError("Please upload the processed leave form.");
      return;
    }
    
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('adminForm', adminForm);
      
      await leaveApi.processLeave(request.id, formData);
      onConfirm();
    } catch (err) {
      console.error(err);
      setError("Failed to process request");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !request) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 to-blue-600 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-white" />
            <div>
              <h2 className="text-lg font-bold text-white">Process Leave Request</h2>
              <p className="text-blue-100 text-sm">Review credits and upload form</p>
            </div>
          </div>
          <button onClick={onCancel} className="text-blue-100 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            {error && <p className="text-red-500 text-sm">{error}</p>}
            
            {/* Details */}
            <div className="bg-gray-50 p-4 rounded-lg text-sm space-y-2">
                <p><strong>Employee:</strong> {request.first_name} {request.last_name}</p>
                <p><strong>Type:</strong> {request.leave_type} ({request.with_pay ? 'With Pay' : 'Without Pay'})</p>
                <p><strong>Dates:</strong> {request.start_date} to {request.end_date}</p>
                <p><strong>Reason:</strong> {request.reason}</p>
                {request.attachment_path && (
                     <div className="mt-2">
                        <p className="mb-1 font-semibold">Attachment:</p>
                        {/* Note: In a real app, you'd have a proper download URL */}
                        <a href={`${import.meta.env.VITE_API_URL.replace('/api', '')}/uploads/${request.attachment_path}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                            <Download className="w-4 h-4" /> Download Employee Attachment
                        </a>
                     </div>
                )}
            </div>

            {/* Credits */}
            <div className="border-t pt-4">
                <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
                    <CreditCard className="w-4 h-4" /> Leave Credits
                </h3>
                {credits.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                        {credits.map(c => (
                            <div key={c.credit_type} className="bg-blue-50 p-2 rounded text-center">
                                <p className="text-xs text-gray-500">{c.credit_type}</p>
                                <p className="font-bold text-blue-700">{c.balance}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-gray-500 italic">No credit records found.</p>
                )}
            </div>

            {/* Upload Admin Form */}
            <div className="border-t pt-4">
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Upload Processed Form *
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-500 transition-colors">
                    <input type="file" onChange={handleFileChange} className="hidden" id="adminFormUpload" accept=".pdf,.xlsx,.docx" />
                    <label htmlFor="adminFormUpload" className="cursor-pointer flex flex-col items-center">
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-600">{adminForm ? adminForm.name : "Click to upload form"}</span>
                    </label>
                </div>
            </div>

            <div className="flex gap-3 pt-4">
                <button onClick={onCancel} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                <button onClick={handleProcess} disabled={loading} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                    {loading ? 'Processing...' : 'Send for Signature'}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLeaveRequestProcess;
