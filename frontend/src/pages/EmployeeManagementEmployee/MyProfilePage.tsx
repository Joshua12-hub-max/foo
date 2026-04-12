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
      <div className="w-10 h-10 border-4 border-gray-100 border-t-black rounded-full animate-spin mb-4" />
      <p className="text-xs font-bold text-gray-400">Loading your profile...</p>
    </div>
  );

  return (
    <div className="w-full h-full animate-in fade-in duration-500">
      {!hideHeader && (
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-[var(--zed-border-light)] bg-white/80 backdrop-blur-md px-8 pt-6 sticky top-0 z-10">
          <button 
            onClick={() => navigate('/employee-dashboard')}
            className="flex items-center gap-2 text-[var(--zed-text-muted)] hover:text-black transition-all group"
          >
            <div className="p-2 rounded-full group-hover:bg-gray-100 transition-all">
              <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
            </div>
            <span className="font-black text-xs tracking-widest uppercase">Back to Dashboard</span>
          </button>
        </div>
      )}

      <div className="px-8 pb-12">
        {profile && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 mb-8">
            <ProfileHeader 
                profile={profile as never}
                isAdmin={false}
                statusLoading={false}
            />
          </div>
        )}

        <div className="bg-white rounded-[var(--radius-lg)] border border-[var(--zed-border-light)] shadow-sm overflow-hidden">
          {profile && <PDSFormWizard employeeId={profile.id} />}
        </div>
      </div>
    </div>
  );
};

export default MyProfilePage;
