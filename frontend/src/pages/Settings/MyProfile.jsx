import { useOutletContext } from 'react-router-dom';
import { Check, X } from 'lucide-react';
import { 
  ProfileHeader, 
  ProfileAvatar, 
  InformationGrid, 
  useProfile 
} from '@components/Custom/Settings/Profile';

export default function MyProfile() {
  const outletContext = useOutletContext() || { sidebarOpen: true };
  const { sidebarOpen = true } = outletContext;
  
  const {
    user,
    profile,
    loading,
    saving,
    error,
    success,
    isEditing,
    formData,
    avatarPreview,
    setIsEditing,
    setError,
    setSuccess,
    handleChange,
    handleAvatarChange,
    handleSubmit,
    handleCancel
  } = useProfile();

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
      />

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
        profile={profile}
        formData={formData}
        isEditing={isEditing}
        avatarPreview={avatarPreview}
        handleAvatarChange={handleAvatarChange}
      />

      <InformationGrid 
        profile={profile}
        user={user}
        isEditing={isEditing}
        formData={formData}
        handleChange={handleChange}
        setIsEditing={setIsEditing}
      />
    </div>
  );
}
