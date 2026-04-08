import React, { useState, useEffect } from 'react';
import { UseFormRegister, FieldErrors, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import type { JobApplicationSchema } from '@/schemas/recruitment';

interface FileUploadSectionProps {
  register: UseFormRegister<JobApplicationSchema>;
  errors: FieldErrors<JobApplicationSchema>;
  setValue: UseFormSetValue<JobApplicationSchema>;
  watch: UseFormWatch<JobApplicationSchema>;
  dutyType?: 'Standard' | 'Irregular';
}

interface FileInfo {
  name: string;
  size: number;
  type: string;
}

const FileUploadSection: React.FC<FileUploadSectionProps> = ({
  register,
  errors,
  setValue,
  watch,
  dutyType = 'Standard'
}) => {
  const [resumeFile, setResumeFile] = useState<FileInfo | null>(null);
  const [photoFile, setPhotoFile] = useState<FileInfo | null>(null);
  const [certFile, setCertFile] = useState<FileInfo | null>(null);

  // Register file fields with react-hook-form
  useEffect(() => {
    register('resume');
    register('photo');
    register('eligibilityCert');
  }, [register]);

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const RESUME_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  const CERT_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const validateFile = (file: File, allowedTypes: string[], maxSize: number): string | null => {
    if (!allowedTypes.includes(file.type)) {
      return `Invalid file type. Allowed: ${allowedTypes.map(t => t.split('/')[1].toUpperCase()).join(', ')}`;
    }
    if (file.size > maxSize) {
      return `File too large. Maximum size: ${formatFileSize(maxSize)}`;
    }
    return null;
  };

  const handleResumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validateFile(file, RESUME_TYPES, MAX_FILE_SIZE);
    if (error) {
      alert(error);
      e.target.value = '';
      setResumeFile(null);
      setValue('resume', undefined as any);
      return;
    }

    console.log('[FileUpload] Resume selected:', file.name, file.size, file.type);
    setResumeFile({ name: file.name, size: file.size, type: file.type });
    setValue('resume', file as any, { shouldValidate: true, shouldDirty: true });
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validateFile(file, PHOTO_TYPES, MAX_FILE_SIZE);
    if (error) {
      alert(error);
      e.target.value = '';
      setPhotoFile(null);
      setValue('photo', undefined as any);
      return;
    }

    console.log('[FileUpload] Photo selected:', file.name, file.size, file.type);
    setPhotoFile({ name: file.name, size: file.size, type: file.type });
    setValue('photo', file as any, { shouldValidate: true, shouldDirty: true });
  };

  const handleCertChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validateFile(file, CERT_TYPES, MAX_FILE_SIZE);
    if (error) {
      alert(error);
      e.target.value = '';
      setCertFile(null);
      setValue('eligibilityCert', undefined as any);
      return;
    }

    console.log('[FileUpload] Certificate selected:', file.name, file.size, file.type);
    setCertFile({ name: file.name, size: file.size, type: file.type });
    setValue('eligibilityCert', file as any, { shouldValidate: true, shouldDirty: true });
  };

  const removeFile = (type: 'resume' | 'photo' | 'cert') => {
    console.log('[FileUpload] Removing file:', type);
    if (type === 'resume') {
      setResumeFile(null);
      setValue('resume', undefined as any, { shouldValidate: true });
    } else if (type === 'photo') {
      setPhotoFile(null);
      setValue('photo', undefined as any, { shouldValidate: true });
    } else {
      setCertFile(null);
      setValue('eligibilityCert', undefined as any, { shouldValidate: true });
    }
  };

  // Watch file values
  const currentResume = watch('resume');
  const currentPhoto = watch('photo');
  const currentCert = watch('eligibilityCert');

  // Log current file state
  useEffect(() => {
    console.log('[FileUpload] Current file state:', {
      resume: currentResume instanceof File ? `File: ${currentResume.name}` : currentResume,
      photo: currentPhoto instanceof File ? `File: ${currentPhoto.name}` : currentPhoto,
      cert: currentCert instanceof File ? `File: ${currentCert.name}` : currentCert
    });
  }, [currentResume, currentPhoto, currentCert]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-black text-slate-900 mb-1 uppercase tracking-widest flex items-center gap-3">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
          File Uploads
        </h3>
        <p className="text-xs text-slate-500 font-semibold mb-6">Upload required documents (max 10MB per file)</p>
      </div>

      {/* File Status Debug */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs">
        <p className="font-bold text-gray-700 mb-2">📎 Current Files:</p>
        <div className="space-y-1 text-gray-600">
          <div>Resume: {currentResume instanceof File ? `✅ ${currentResume.name}` : '❌ Not uploaded'}</div>
          <div>Photo: {currentPhoto instanceof File ? `✅ ${currentPhoto.name}` : '⚪ Optional'}</div>
          <div>Certificate: {currentCert instanceof File ? `✅ ${currentCert.name}` : dutyType === 'Standard' ? '❌ Required for Standard' : '⚪ Optional'}</div>
        </div>
      </div>

      {/* Resume Upload */}
      <div className="space-y-3">
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
          Resume/CV <span className="text-red-500">*</span>
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-500 transition-all">
          {!resumeFile ? (
            <div>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleResumeChange}
                className="hidden"
                id="resume-upload"
              />
              <label
                htmlFor="resume-upload"
                className="cursor-pointer inline-flex flex-col items-center"
              >
                <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span className="text-sm font-bold text-gray-600">Click to upload resume</span>
                <span className="text-xs text-gray-500 mt-1">PDF, DOC, DOCX (Max 10MB)</span>
              </label>
            </div>
          ) : (
            <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-800">{resumeFile.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(resumeFile.size)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeFile('resume')}
                className="text-red-600 hover:text-red-800 text-xs font-bold"
              >
                Remove
              </button>
            </div>
          )}
        </div>
        {errors.resume && (
          <p className="text-red-500 text-xs mt-1 ml-1">{errors.resume.message as string}</p>
        )}
      </div>

      {/* 2x2 ID Photo Upload */}
      <div className="space-y-3">
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
          2x2 ID Photo {dutyType === 'Standard' && <span className="text-red-500">*</span>}
          {dutyType === 'Irregular' && <span className="text-gray-400">(Optional)</span>}
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-500 transition-all">
          {!photoFile ? (
            <div>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                onChange={handlePhotoChange}
                className="hidden"
                id="photo-upload"
              />
              <label
                htmlFor="photo-upload"
                className="cursor-pointer inline-flex flex-col items-center"
              >
                <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm font-bold text-gray-600">Click to upload photo</span>
                <span className="text-xs text-gray-500 mt-1">JPG, PNG, WEBP (Max 10MB)</span>
              </label>
            </div>
          ) : (
            <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-800">{photoFile.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(photoFile.size)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeFile('photo')}
                className="text-red-600 hover:text-red-800 text-xs font-bold"
              >
                Remove
              </button>
            </div>
          )}
        </div>
        {errors.photo && (
          <p className="text-red-500 text-xs mt-1 ml-1">{errors.photo.message as string}</p>
        )}
      </div>

      {/* Eligibility Certificate Upload */}
      {dutyType === 'Standard' && (
        <div className="space-y-3">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
            Eligibility Certificate <span className="text-red-500">*</span>
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-500 transition-all">
            {!certFile ? (
              <div>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleCertChange}
                  className="hidden"
                  id="cert-upload"
                />
                <label
                  htmlFor="cert-upload"
                  className="cursor-pointer inline-flex flex-col items-center"
                >
                  <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-sm font-bold text-gray-600">Click to upload certificate</span>
                  <span className="text-xs text-gray-500 mt-1">PDF, JPG, PNG (Max 10MB)</span>
                </label>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-800">{certFile.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(certFile.size)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile('cert')}
                  className="text-red-600 hover:text-red-800 text-xs font-bold"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
          {errors.eligibilityCert && (
            <p className="text-red-500 text-xs mt-1 ml-1">{errors.eligibilityCert.message as string}</p>
          )}
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-xs text-blue-700 font-semibold">
          File Requirements: Maximum file size is 10MB. Accepted formats are listed for each upload type.
        </p>
      </div>
    </div>
  );
};

export default FileUploadSection;
