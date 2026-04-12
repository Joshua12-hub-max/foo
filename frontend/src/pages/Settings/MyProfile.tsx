import React from 'react';
import { useUIStore } from '@/stores';
import { Check, X } from 'lucide-react';
import { ProfileHeader, ProfileAvatar, InformationGrid, useProfile } from '@settings/Profile';
import type { Profile } from '@settings/Profile';
import { employeeApi } from '@/api/employeeApi';
import DocumentGallery from '@/features/Settings/Profile/components/DocumentGallery';

import MyMemosPage from '@pages/EmployeeManagementEmployee/MyMemosPage';

export default function MyProfile() {
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);
  const [activeTab, setActiveTab] = React.useState<'info' | 'docs' | 'memos'>('info');

  const {
    user, profile, loading, saving, error, success,
    isEditing, formData, avatarPreview, setIsEditing,
    setError, setSuccess, handleChange, handleAvatarChange,
    handleSubmit, handleCancel, setProfile
  } = useProfile();

  // Handle document refresh
  const refreshDocs = React.useCallback(async () => {
    if (!profile?.id) return;
    try {
      const res = await employeeApi.fetchEmployeeDocuments(profile.id);
      if (res.success && res.documents) {
        setProfile(prev => prev ? { ...prev, documents: res.documents } : null);
      }
    } catch (err) {
      console.error("Failed to refresh documents:", err);
    }
  }, [profile?.id, setProfile]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-white rounded-2xl shadow-sm border border-gray-200 p-8 min-h-[400px] w-full transition-all duration-300 ${!sidebarOpen ? 'max-w-[1600px] xl:max-w-[88vw]' : 'max-w-[1400px] xl:max-w-[77vw]'}`}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          <p className="text-gray-500 font-medium text-sm">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col bg-white rounded-2xl shadow-sm border border-gray-200 p-6 w-full overflow-hidden transition-all duration-300 ${!sidebarOpen ? 'max-w-[1600px] xl:max-w-[88vw]' : 'max-w-[1400px] xl:max-w-[77vw]'}`}>
      
      <ProfileHeader 
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        handleCancel={handleCancel}
        handleSubmit={handleSubmit}
        saving={saving}
        hideEdit={activeTab !== 'info'} // Only show Edit on Info tab
      />

      {/* Navigation Tabs */}
      <div className="flex items-center gap-6 border-b border-gray-100 mb-6">
        <button
          onClick={() => { setActiveTab('info'); }}
          className={`pb-3 text-sm font-bold tracking-wide transition-all border-b-2 ${
            activeTab === 'info' 
              ? 'text-navy-900 border-navy-900' 
              : 'text-gray-400 border-transparent hover:text-navy-700'
          }`}
        >
          Personal Information
        </button>
        <button
          onClick={() => { setActiveTab('docs'); setIsEditing(false); }}
          className={`pb-3 text-sm font-bold tracking-wide transition-all border-b-2 ${
            activeTab === 'docs' 
              ? 'text-navy-900 border-navy-900' 
              : 'text-gray-400 border-transparent hover:text-navy-700'
          }`}
        >
          Document Repository
        </button>
        <button
          onClick={() => { setActiveTab('memos'); setIsEditing(false); }}
          className={`pb-3 text-sm font-bold tracking-wide transition-all border-b-2 ${
            activeTab === 'memos' 
              ? 'text-navy-900 border-navy-900' 
              : 'text-gray-400 border-transparent hover:text-navy-700'
          }`}
        >
          My Memos
        </button>
      </div>

      {activeTab === 'info' && (
        <>
          {/* Alerts */}
          {success && (
            <div className="mb-6 flex items-center gap-3 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl animate-in fade-in slide-in-from-top-2">
              <Check size={18} />
              <span className="text-sm font-medium">{success}</span>
            </div>
          )}
          {error && (
            <div className="mb-6 flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl animate-in fade-in slide-in-from-top-2">
              <X size={18} />
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          <ProfileAvatar 
            profile={profile as Profile | null}
            formData={formData}
            isEditing={isEditing}
            avatarPreview={avatarPreview}
            handleAvatarChange={handleAvatarChange}
          />

          <InformationGrid 
            profile={profile as Profile | null}
            user={user}
            isEditing={isEditing}
            formData={formData}
            handleChange={handleChange}
            setIsEditing={setIsEditing}
            setProfile={setProfile}
          />
        </>
      )}

      {activeTab === 'docs' && (
        <div className="p-4 bg-slate-50/30 rounded-2xl border border-gray-100 animate-in fade-in slide-in-from-bottom-2">
           <div className="mb-8">
              <h3 className="text-lg font-black text-gray-800 uppercase tracking-tight">Personal Document Repository</h3>
              <p className="text-sm text-gray-500 font-medium">Manage your official 2x2 photo, PDS, Resume, and Eligibility certificates.</p>
           </div>
           <DocumentGallery 
              employeeId={profile?.id || 0} 
              documents={profile?.documents || []} 
              onDocumentChange={refreshDocs} 
           />
        </div>
      )}

      {activeTab === 'memos' && (
        /* Memos Tab Content */
        <div className="min-h-[500px]">
           <MyMemosPage hideHeader={false} />
        </div>
      )}
    </div>
  );
}
