import { useState } from 'react';
import { X, Send, FileText, AlertCircle, CheckCircle2, Upload } from 'lucide-react';

export default function SendFormModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    filledForm: null,
    description: ''
  });
  const [errors, setErrors] = useState({});
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setFormData(prev => ({
        ...prev,
        filledForm: file
      }));
      if (errors.filledForm) {
        setErrors(prev => ({ ...prev, filledForm: '' }));
      }
    } else if (file) {
      setErrors(prev => ({ ...prev, filledForm: 'Please upload a PDF file only' }));
    }
  };

  const handleDescriptionChange = (e) => {
    setFormData(prev => ({
      ...prev,
      description: e.target.value
    }));
    if (errors.description) {
      setErrors(prev => ({ ...prev, description: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.filledForm) {
      newErrors.filledForm = 'Please upload the filled form';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Please provide a description';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendClick = () => {
    if (validateForm()) {
      setShowConfirmation(true);
    }
  };

  const confirmSend = () => {
    setIsSending(true);

    setTimeout(() => {
      console.log('Filled form sent back:', formData);
      setIsSending(false);
      setShowConfirmation(false);
      onClose();
      alert('Form sent successfully!');
    }, 1000);
  };

  const handleXButtonClick = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const hasData = formData.filledForm || formData.description.trim();

    if (hasData) {
      if (window.confirm("You have unsaved changes. Are you sure you want to close?")) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const handleCancel = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const hasData = formData.filledForm || formData.description.trim();

    if (hasData) {
      if (window.confirm("You have unsaved changes. Are you sure you want to cancel?")) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleXButtonClick(e);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Main Modal */}
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={handleBackdropClick}
      >
        <div 
          className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden flex flex-col"
          style={{ height: 'auto', maxHeight: '90vh' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-950 to-green-700 flex items-center justify-between p-4 border-b relative">
            <div className="flex items-center gap-2 z-10">
              <Send className="text-white" size={24} />
              <h2 className="text-xl font-bold text-white">Send Filled Form</h2>
            </div>
            <button
              type="button"
              onClick={handleXButtonClick}
              className="text-white hover:text-gray-200 transition-colors absolute top-4 right-4 z-20"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 overflow-y-auto">
            <div className="bg-white border-2 border-gray-200 rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow">
              
              {/* Info Alert */}
              <div className="mb-5 bg-blue-50 border-2 border-blue-200 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={16} />
                <p className="text-xs text-blue-800">
                  Upload your completed leave request form to send it back to the admin for approval.
                </p>
              </div>

              {/* Upload Filled Form */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Upload Filled Form <span className="text-red-500">*</span>
                </label>
                
                {formData.filledForm ? (
                  <div className="border-2 border-green-200 rounded-xl p-4 bg-gradient-to-br from-green-50 to-white shadow-sm">
                    <div className="bg-white rounded-lg p-3 border-2 border-green-300">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="bg-green-100 p-2 rounded-lg">
                            <FileText className="text-green-600" size={20} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {formData.filledForm.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {(formData.filledForm.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, filledForm: null }))}
                          className="text-red-500 hover:text-red-700 transition-colors"
                          title="Remove file"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-green-700 mt-2 flex items-center gap-1">
                      <CheckCircle2 size={12} />
                      Ready to send
                    </p>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="hidden"
                      id="filledFormUpload"
                    />
                    <label
                      htmlFor="filledFormUpload"
                      className={`flex flex-col items-center justify-center gap-2 w-full px-4 py-6 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
                        errors.filledForm ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-green-400 hover:bg-green-50'
                      }`}
                    >
                      <Upload className="w-8 h-8 text-gray-400" />
                      <span className="text-sm text-gray-600 font-medium">
                        Click to upload filled PDF form
                      </span>
                      <span className="text-xs text-gray-400">
                        PDF files only
                      </span>
                    </label>
                  </div>
                )}
                
                {errors.filledForm && (
                  <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.filledForm}
                  </p>
                )}
              </div>

              {/* Description Box */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={handleDescriptionChange}
                  placeholder="Provide details about your leave request (reason, dates, etc.)"
                  rows={4}
                  className={`w-full px-3 py-2 border-2 rounded-lg text-sm focus:outline-none focus:ring-2 transition-all resize-none ${
                    errors.description 
                      ? 'border-red-500 focus:ring-red-200 bg-red-50' 
                      : 'border-gray-300 focus:ring-green-200 focus:border-green-400'
                  }`}
                />
                <div className="flex items-center justify-between mt-1">
                  {errors.description ? (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.description}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500">
                      Explain your leave request
                    </p>
                  )}
                  <span className="text-xs text-gray-400">
                    {formData.description.length} characters
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSending}
                  className="flex-1 px-3 py-2 text-sm border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 active:scale-95 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendClick}
                  disabled={isSending}
                  className="flex-1 px-3 py-2 text-sm border-2 border-green-600 text-green-700 rounded-lg font-semibold hover:bg-green-50 active:scale-95 transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={16} />
                  Send Form
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowConfirmation(false);
            }
          }}
        >
          <div 
            className="bg-white rounded-lg shadow-2xl max-w-sm w-full p-6 animate-in fade-in zoom-in duration-200 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button for confirmation */}
            <button
              type="button"
              onClick={() => setShowConfirmation(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
              aria-label="Close confirmation"
            >
              <X size={20} />
            </button>

            {isSending ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Sending Form...
                </h3>
                <p className="text-sm text-gray-600">
                  Please wait while we send your form
                </p>
              </div>
            ) : (
              <>
                <div className="text-center pt-4">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                    <Send className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    Confirm Send
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Are you sure you want to send this filled form to admin?
                  </p>
                  
                  {/* Summary */}
                  <div className="bg-gray-50 rounded-lg p-3 text-left mb-4">
                    <div className="text-xs space-y-1">
                      <p><span className="font-semibold">File:</span> {formData.filledForm?.name}</p>
                      <p><span className="font-semibold">Size:</span> {(formData.filledForm?.size / 1024).toFixed(1)} KB</p>
                      <div className="pt-2 border-t border-gray-200 mt-2">
                        <p className="font-semibold mb-1">Description:</p>
                        <p className="text-gray-600 max-h-20 overflow-y-auto">
                          {formData.description}
                        </p>
                      </div>
                      <p className="flex items-center gap-1 text-green-600 pt-1 border-t border-gray-200 mt-2">
                        <CheckCircle2 size={12} />
                        Ready to submit
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowConfirmation(false)}
                    className="px-4 py-2 text-sm border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all"
                  >
                    Go Back
                  </button>
                  <button
                    type="button"
                    onClick={confirmSend}
                    className="px-4 py-2 text-sm border-2 border-green-600 text-green-700 rounded-lg font-semibold hover:bg-green-50 transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={16} />
                    Confirm
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}