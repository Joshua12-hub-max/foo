import { useState } from "react";
import { X, FileText, Upload, CheckCircle, Download } from "lucide-react";
import { leaveApi } from "../../../../../api/leaveApi";

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
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gray-200 shadow-md p-6 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Finalize Leave Request</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
            {error && <p className="text-red-500 text-sm">{error}</p>}
            
            <div className="bg-green-50 p-4 rounded-lg text-sm space-y-2">
                <p>The HR/Admin has processed your request. Please download the form below, sign it, and upload it back to finalize your request.</p>
                {request.admin_form_path && (
                     <div className="mt-2">
                        <a href={`${import.meta.env.VITE_API_URL.replace('/api', '')}/uploads/${request.admin_form_path}`} target="_blank" rel="noreferrer" className="text-green-700 hover:underline flex items-center gap-1 font-semibold">
                            <Download className="w-4 h-4" /> Download Admin Form
                        </a>
                     </div>
                )}
            </div>

            {/* Upload Signed Form */}
            <div className="border-t pt-4">
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Upload Signed Form *
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-green-500 transition-colors">
                    <input type="file" onChange={handleFileChange} className="hidden" id="signedFormUpload" accept=".pdf,.jpg,.png,.docx" />
                    <label htmlFor="signedFormUpload" className="cursor-pointer flex flex-col items-center">
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-600">{signedForm ? signedForm.name : "Click to upload signed form"}</span>
                    </label>
                </div>
            </div>

            <div className="flex gap-3 pt-4">
                <button onClick={onCancel} className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-700 font-medium rounded-lg shadow-md hover:bg-gray-300 transition-colors">Cancel</button>
                <button onClick={handleFinalize} disabled={loading} className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-700 font-medium rounded-lg shadow-md hover:bg-gray-300 disabled:opacity-50 transition-colors">
                    {loading ? 'Uploading...' : 'Submit Signed Form'}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default FinalizeModal;
