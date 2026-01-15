import React, { useState, useRef, ChangeEvent, DragEvent } from 'react';
import { Upload, X, FileText, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FileUploaderProps {
  onUpload: (fileOrFiles: File | File[]) => void;
  acceptedTypes?: string;
  maxSizeMB?: number;
  multiple?: boolean;
}

const FileUploader = ({ onUpload, acceptedTypes = "image/*,application/pdf", maxSizeMB = 10, multiple = false }: FileUploaderProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateFile = (file: File) => {
    const isSizeValid = file.size <= maxSizeMB * 1024 * 1024;
    // Simple type check based on acceptedTypes string
    // In production, use more robust checking
    return isSizeValid;
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (fileList: FileList) => {
    setError(null);
    const newFiles = Array.from(fileList);
    const validFiles = newFiles.filter(validateFile);

    if (validFiles.length !== newFiles.length) {
      setError(`Some files exceeded the ${maxSizeMB}MB limit.`);
    }

    if (validFiles.length > 0) {
      if (multiple) {
        setFiles(prev => [...prev, ...validFiles]);
        onUpload(validFiles);
      } else {
        setFiles([validFiles[0]]);
        onUpload(validFiles[0]);
      }
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="w-full">
      <div 
        className={`relative border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center transition-colors
          ${dragActive ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}
          ${error ? 'border-red-300 bg-red-50' : ''}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          multiple={multiple}
          accept={acceptedTypes}
          onChange={handleChange}
        />

        <div className="flex flex-col items-center text-center space-y-3">
          <div className="p-3 bg-white rounded-full shadow-sm">
            <Upload className="text-gray-600" size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">
              <span 
                onClick={() => inputRef.current?.click()}
                className="text-gray-600 hover:text-gray-800 cursor-pointer hover:underline"
              >
                Click to upload
              </span>
              {' '}or drag and drop
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {acceptedTypes.replace(/,/g, ', ')} (Max {maxSizeMB}MB)
            </p>
          </div>
        </div>

        {error && (
          <div className="absolute bottom-2 left-0 right-0 text-center">
            <p className="text-xs text-red-500 flex items-center justify-center gap-1">
              <AlertCircle size={12} /> {error}
            </p>
          </div>
        )}
      </div>

      {/* File List */}
      <AnimatePresence>
        {files.length > 0 && (
          <div className="mt-4 space-y-2">
            {files.map((file, index) => (
              <motion.div
                key={`${file.name}-${index}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg shadow-sm"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <FileText className="text-gray-400 flex-shrink-0" size={20} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <button 
                  onClick={() => removeFile(index)}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X size={18} />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FileUploader;
