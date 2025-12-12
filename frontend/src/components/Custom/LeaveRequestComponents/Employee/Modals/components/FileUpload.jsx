import { Upload, FileText, X } from 'lucide-react';
import { FILE_CONFIG } from '../constants/modalConstants';

export const FileUpload = ({ file, onFileChange, onRemove, error }) => {
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      onFileChange(selectedFile);
    }
  };

  return (
    <div>
      <label className="block text-xs font-semibold text-gray-700 mb-1.5">
        Attach Supporting Documents
      </label>
      
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 hover:border-[#274b46] transition-colors">
        <input
          type="file"
          id="fileUpload"
          onChange={handleFileChange}
          accept={FILE_CONFIG.allowedExtensions}
          className="hidden"
        />
        
        {!file && (
          <label htmlFor="fileUpload" className="cursor-pointer block text-center">
            <Upload className="w-6 h-6 mx-auto text-gray-400 mb-1.5" />
            <p className="text-xs text-gray-600">Click to upload or drag and drop</p>
            <p className="text-xs text-gray-500 mt-0.5">
              <span className="text-red-500 font-medium">PDF</span> only (max 5MB)
            </p>
          </label>
        )}

        {file && (
          <div className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <FileText className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
              <span className="text-xs text-gray-700 truncate">{file.name}</span>
              <span className="text-xs text-gray-500 flex-shrink-0">
                ({(file.size / 1024).toFixed(1)} KB)
              </span>
            </div>
            <button
              type="button"
              onClick={onRemove}
              className="text-red-500 hover:text-red-700 p-1"
              aria-label="Remove file"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
};

export default FileUpload;
