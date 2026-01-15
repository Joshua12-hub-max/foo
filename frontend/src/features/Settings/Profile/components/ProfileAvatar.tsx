import React from 'react';
import { Camera } from 'lucide-react';
import EmploymentStatusBadge from '@/components/Custom/Common/EmploymentStatusBadge';

interface Profile {
  name?: string;
  role?: string;
  department?: string;
  employmentStatus?: string;
  avatar?: string;
}

interface FormData {
  first_name: string;
  last_name: string;
  email: string;
}

interface ProfileAvatarProps {
  profile: Profile | null;
  formData: FormData;
  isEditing: boolean;
  avatarPreview: string | null;
  handleAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const ProfileAvatar: React.FC<ProfileAvatarProps> = ({ profile, formData, isEditing, avatarPreview, handleAvatarChange }) => {
  return (
    <div className="bg-gray-50 rounded-2xl border border-gray-100 p-6 mb-6">
      <div className="flex items-center gap-5">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-gray-200 overflow-hidden shadow-inner">
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500 text-xl font-bold">
                {formData.first_name?.[0]?.toUpperCase()}{formData.last_name?.[0]?.toUpperCase()}
              </div>
            )}
          </div>
          {isEditing && (
            <label className="absolute -bottom-1 -right-1 w-7 h-7 bg-gray-900 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-800 transition-all shadow-lg border-2 border-white">
              <Camera size={14} className="text-white" />
              <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </label>
          )}
        </div>
        
        <div className="flex-1">
          <h2 className="text-lg font-bold text-gray-900">{profile?.name || 'User'}</h2>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
              profile?.role === 'admin' || profile?.role === 'hr' 
                ? 'bg-purple-100 text-purple-700' 
                : 'bg-gray-200 text-gray-700'
            }`}>
              {profile?.role?.charAt(0).toUpperCase() + (profile?.role?.slice(1) || '') || 'Employee'}
            </span>
            {profile?.department && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700">
                {profile.department}
              </span>
            )}
            <EmploymentStatusBadge status={profile?.employmentStatus || 'Active'} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileAvatar;
