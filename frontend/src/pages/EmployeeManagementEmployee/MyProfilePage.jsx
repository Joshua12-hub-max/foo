import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import EmployeeProfileView from '@components/Custom/EmployeeManagement/Employee/Portal/Profile/EmployeeProfileView';
import { useEmployeeProfile } from '@components/Custom/EmployeeManagement/Employee/Portal/Profile/useEmployeeProfile';

const MyProfilePage = ({ hideHeader = false }) => {
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
          <span>Back to My Department</span>
        </button>
      )}

      <EmployeeProfileView 
        profile={profile}
        loading={loading}
        error={error}
        onRefresh={fetchProfile}
      />
    </div>
  );
};

export default MyProfilePage;
