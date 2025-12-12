import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Trash2, Eye } from 'lucide-react';
import { fetchDocuments, uploadDocument, deleteDocument } from '../../../../api/employeeApi';
import FileUploader from '../../Shared/FileUploader';

const ProfileDocuments = ({ profile }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const data = await fetchDocuments(profile.id);
      if (data.success) {
        setDocuments(data.documents);
      }
    } catch (err) {
      // Error handled silently
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [profile.id]);

  const handleUpload = async (file) => {
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('document_type', 'General'); // Default type for now
      
      await uploadDocument(profile.id, formData);
      loadDocuments();
    } catch (err) {
      // Error handled silently
      alert("Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId) => {
    if (window.confirm("Delete this document permanently?")) {
      try {
        await deleteDocument(profile.id, docId);
        loadDocuments();
      } catch (err) {
        // Error handled silently
      }
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Upload Documents</h2>
        <FileUploader onUpload={handleUpload} maxSizeMB={10} />
        {uploading && <p className="text-sm text-green-600 mt-2 animate-pulse">Uploading...</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.map((doc) => (
          <motion.div
            key={doc.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group flex flex-col justify-between"
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                <FileText size={24} />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-gray-800 truncate" title={doc.document_name}>
                  {doc.document_name}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(doc.created_at).toLocaleDateString()} • {formatFileSize(doc.file_size)}
                </p>
              </div>
            </div>

            <div className="flex gap-2 mt-2 pt-3 border-t border-gray-50">
              <button 
                className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                onClick={() => window.open(`http://localhost:5000/${doc.file_path}`, '_blank')}
              >
                <Eye size={16} />
                View
              </button>
              <button 
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                onClick={() => handleDelete(doc.id)}
              >
                <Trash2 size={18} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {documents.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500">No documents uploaded yet.</p>
        </div>
      )}
    </div>
  );
};

export default ProfileDocuments;
