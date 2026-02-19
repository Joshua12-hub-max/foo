import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import EditableProfileView from '@features/EmployeeManagement/Employee/Portal/Profile/EditableProfileView';
import { useEmployeeProfile } from '@features/EmployeeManagement/Employee/Portal/Profile/useEmployeeProfile';

interface MyProfilePageProps {
  hideHeader?: boolean;
}

const MyProfilePage: React.FC<MyProfilePageProps> = ({ hideHeader = false }) => {
  const navigate = useNavigate();
  const { profile, loading, error, fetchProfile } = useEmployeeProfile();

  return (
    <div className="w-full">
      {!hideHeader && (
        <button 
          onClick={() => navigate('/employee-dashboard/my-department')}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors mb-6"
        >
          <ArrowLeft size={20} />
          <span>Back to Department</span>
        </button>
      )}

      <EditableProfileView 
        profile={profile ?? undefined}
        loading={loading}
        error={error || undefined}
        onRefresh={fetchProfile}
      />
    </div>
  );
};

export default MyProfilePage;
