import React from 'react';
import { SquarePen, Loader2 } from 'lucide-react';

interface ProfileHeaderProps {
  isEditing: boolean;
  setIsEditing: (isEditing: boolean) => void;
  handleCancel: () => void;
  handleSubmit: () => void;
  saving: boolean;
  hideEdit?: boolean;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ 
  isEditing, 
  setIsEditing, 
  handleCancel, 
  handleSubmit, 
  saving,
  hideEdit
}) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Profile Settings</h1>
        <p className="text-sm text-gray-500">Manage your personal information and preferences</p>
      </div>
      <div className="flex gap-2">
        {!isEditing ? (
          !hideEdit && (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-sm transition-all active:scale-95 text-sm font-bold"
            >
              <SquarePen size={18} />
              Edit Profile
            </button>
          )
        ) : (
          <>
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-bold shadow-sm transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm font-semibold transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {saving && <Loader2 size={16} className="animate-spin" />}
              Save Changes
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ProfileHeader;
