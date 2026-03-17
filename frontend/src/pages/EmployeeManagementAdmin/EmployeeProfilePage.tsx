import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUIStore } from '@/stores';
import { ArrowLeft } from 'lucide-react';

import { fetchEmployeeProfile, revertEmployeeStatus } from '@/api/employeeApi';
import { useToastStore } from '@/stores';
import { EmployeeDetailed } from '@/types';

// Profile Components
import ProfileHeader from '@features/EmployeeManagement/Employee/Portal/Profile/ProfileHeader';
import PDSFormWizard from '@features/EmployeeManagement/Employee/Portal/Profile/PDSFormWizard';

// Profile loading skeleton
import ProfileSkeleton from '@features/EmployeeManagement/Employee/Portal/Profile/ProfileSkeleton';

const EmployeeProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);
  
  const [profile, setProfile] = useState<EmployeeDetailed | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const showToast = useToastStore((state) => state.showToast);
  const showNotification = useCallback((message: string, type: 'success' | 'error') => showToast(message, type), [showToast]);
  
  const loadData = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      if (!id) return;
      const profileRes = await fetchEmployeeProfile(id);
      if (profileRes.success && profileRes.profile) {
        setProfile(profileRes.profile as EmployeeDetailed);
      } else {
        showNotification(profileRes.message || 'Failed to load profile', 'error');
      }
    } catch (error) {
      showNotification('An error occurred while loading profile', 'error');
    } finally {
      setLoading(false);
    }
  }, [id, showNotification]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle status change (revert/reactivate)
  const handleStatusChange = async (employeeId: number, newStatus: string): Promise<void> => {
    try {
      const result = await revertEmployeeStatus(employeeId, newStatus, 'Reverted by admin');
      if (result.success) {
        showNotification(result.message || 'Status updated', 'success');
        loadData();
      } else {
        showNotification(result.message || 'Failed to update status', 'error');
      }
    } catch (error) {
      showNotification('An error occurred while updating status', 'error');
    }
  };

  if (loading) return (
    <div className={`min-h-screen flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 p-0 w-full overflow-hidden text-gray-800 transition-all duration-300`}>
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100 px-6 pt-6">
        <button 
          onClick={() => navigate('/admin-dashboard/employees')}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft size={18} />
          <span className="font-bold text-sm">Return to Directory</span>
        </button>
      </div>
      <ProfileSkeleton />
    </div>
  );
  
  if (!profile) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-gray-100 max-w-md">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Profile Not Found</h2>
        <p className="text-gray-500 mb-6">The employee record you are looking for might have been removed or moved.</p>
        <button 
          onClick={() => navigate('/admin-dashboard/employees')}
          className="bg-gray-900 text-white px-6 py-2 rounded-xl font-bold"
        >
          Back to Directory
        </button>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen flex flex-col bg-gray-50 p-0 w-full overflow-hidden text-gray-800 transition-all duration-300`}>

      {/* Navigation Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 bg-white px-6 pt-6 sticky top-0 z-10">
        <button 
          onClick={() => navigate('/admin-dashboard/employees')}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft size={18} />
          <span className="font-bold text-sm">Return to Directory</span>
        </button>
      </div>

      {/* Profile Header with HR Details */}
      <div className="mb-6 px-6">
        <ProfileHeader 
            profile={profile}
            isAdmin={true}
            onStatusToggle={() => {
              const newStatus = profile.employmentStatus === 'Active' ? 'Suspended' : 'Active';
              handleStatusChange(profile.id, newStatus);
            }}
            statusLoading={false}
        />
      </div>

      {/* Primary Content: PDS Form Wizard */}
      <div className="px-6 pb-8">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <PDSFormWizard employeeId={Number(id)} />
        </div>
      </div>
    </div>
  );
};

export default EmployeeProfile;
