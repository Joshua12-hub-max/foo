import React, { useState, useEffect } from "react";
import { X, FileText, Upload, CheckCircle, Download, CreditCard } from "lucide-react";
import { leaveApi } from "@api";

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
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gray-200 shadow-md p-6 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Process Leave Request</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors">
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
                        <a href={`${import.meta.env.VITE_API_URL.replace('/api', '')}/uploads/${request.attachment_path}`} target="_blank" rel="noreferrer" className="text-[#274b46] hover:underline flex items-center gap-1">
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
                            <div key={c.credit_type} className="bg-green-50 p-2 rounded text-center">
                                <p className="text-xs text-gray-500">{c.credit_type}</p>
                                <p className="font-bold text-[#274b46]">{c.balance}</p>
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
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-green-500 transition-colors">
                    <input type="file" onChange={handleFileChange} className="hidden" id="adminFormUpload" accept=".pdf,.xlsx,.docx" />
                    <label htmlFor="adminFormUpload" className="cursor-pointer flex flex-col items-center">
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-600">{adminForm ? adminForm.name : "Click to upload form"}</span>
                    </label>
                </div>
            </div>

            <div className="flex gap-3 pt-4">
                <button onClick={onCancel} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                <button onClick={handleProcess} disabled={loading} className="flex-1 px-4 py-2 bg-[#274b46] text-white font-medium rounded-lg hover:bg-[#1f3d39] disabled:opacity-50 transition-colors">
                    {loading ? 'Processing...' : 'Send for Signature'}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLeaveRequestProcess;
