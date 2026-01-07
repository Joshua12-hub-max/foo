import { useState } from "react";
import { X, FileText, Upload, CheckCircle, Download } from "lucide-react";
import { leaveApi } from "@api";

const FinalizeModal = ({ isOpen, request, onConfirm, onCancel }) => {
  const [signedForm, setSignedForm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setSignedForm(file);
  };

  const handleFinalize = async () => {
    if (!signedForm) {
      setError("Please upload the signed leave form.");
      return;
    }
    
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('finalForm', signedForm);
      
      await leaveApi.finalizeLeave(request.id, formData);
      onConfirm();
    } catch (err) {
      console.error(err);
      setError("Failed to finalize request");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !request) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 transition-all">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Finalize Leave Request</h2>
          <button 
            onClick={onCancel} 
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
            {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm border border-red-100">
                    <X className="w-4 h-4" />
                    {error}
                </div>
            )}
            
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-sm space-y-3">
                <p className="text-blue-900 leading-relaxed font-medium">The HR/Admin has processed your request. Please download the form below, sign it, and upload it back to finalize your request.</p>
                {request.admin_form_path && (
                     <div>
                        <a href={`${import.meta.env.VITE_API_URL.replace('/api', '')}/uploads/${request.admin_form_path}`} target="_blank" rel="noreferrer" className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-blue-700 rounded-lg hover:bg-blue-50 transition-colors text-sm font-semibold border border-blue-200 shadow-sm">
                            <Download className="w-4 h-4" /> Download Admin Form
                        </a>
                     </div>
                )}
            </div>

            {/* Upload Signed Form */}
            <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                    Upload Signed Form <span className="text-red-500">*</span>
                </label>
                <div className={`border-2 border-dashed ${signedForm ? 'border-green-500 bg-green-50/30' : 'border-gray-200 hover:border-gray-300'} rounded-xl p-6 text-center transition-all cursor-pointer`}>
                    <input type="file" onChange={handleFileChange} className="hidden" id="signedFormUpload" accept=".pdf,.jpg,.png,.docx" />
                    <label htmlFor="signedFormUpload" className="cursor-pointer flex flex-col items-center gap-2">
                        <div className={`p-3 rounded-full ${signedForm ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                            {signedForm ? <CheckCircle className="w-6 h-6" /> : <Upload className="w-6 h-6" />}
                        </div>
                        <span className={`text-sm font-medium ${signedForm ? 'text-green-700' : 'text-gray-600'}`}>
                            {signedForm ? signedForm.name : "Click to upload signed form"}
                        </span>
                        {!signedForm && <span className="text-xs text-gray-400">PDF, JPG, PNG, DOCX</span>}
                    </label>
                </div>
            </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
            <button 
                onClick={onCancel} 
                className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm text-sm"
            >
                Cancel
            </button>
            <button 
                onClick={handleFinalize} 
                disabled={loading} 
                className="flex-1 px-4 py-2.5 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-all shadow-lg shadow-gray-900/20 text-sm"
            >
                {loading ? 'Uploading...' : 'Submit Signed Form'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default FinalizeModal;
