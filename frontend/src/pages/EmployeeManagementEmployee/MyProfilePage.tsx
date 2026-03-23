import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import PDSFormWizard from '@features/EmployeeManagement/Employee/Portal/Profile/PDSFormWizard';
import { useEmployeeProfile } from '@features/EmployeeManagement/Employee/Portal/Profile/useEmployeeProfile';
import ProfileHeader from '@features/EmployeeManagement/Employee/Portal/Profile/ProfileHeader';

interface MyProfilePageProps {
  hideHeader?: boolean;
}

const MyProfilePage: React.FC<MyProfilePageProps> = ({ hideHeader = false }) => {
  const navigate = useNavigate();
  const { profile, loading } = useEmployeeProfile();

  if (loading) return (
    <div className="w-full flex flex-col items-center justify-center min-h-[400px]">
      <div className="w-10 h-10 border-4 border-gray-100 border-t-gray-900 rounded-full animate-spin mb-4" />
      <p className="text-xs font-bold text-gray-400">Loading your profile...</p>
    </div>
  );

  return (
    <div className="w-full space-y-6">
      {!hideHeader && (
        <button 
          onClick={() => navigate('/employee-dashboard')}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="font-bold text-sm">Back to Dashboard</span>
        </button>
      )}

      {profile && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
           <ProfileHeader 
              profile={profile as never}
              isAdmin={false}
              statusLoading={false}
          />
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {profile && <PDSFormWizard employeeId={profile.id} />}
      </div>
    </div>
  );
};

export default MyProfilePage;
