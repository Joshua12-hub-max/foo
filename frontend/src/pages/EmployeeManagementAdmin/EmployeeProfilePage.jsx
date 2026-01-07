import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { ArrowLeft, User } from 'lucide-react';

import { fetchEmployeeProfile, revertEmployeeStatus } from '@api/employeeApi';
import { 
  ToastNotification, 
  useNotification 
} from '@components/Custom/EmployeeManagement/Admin';

import EmployeeProfileView from '@components/Custom/EmployeeManagement/Employee/Portal/Profile/EmployeeProfileView';

const EmployeeProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const outletContext = useOutletContext?.() || { sidebarOpen: true };
  const { sidebarOpen = true } = outletContext;
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const { notification, showNotification } = useNotification();
  
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const profileRes = await fetchEmployeeProfile(id);
      if (profileRes.success) {
        setProfile(profileRes.profile);
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
  const handleStatusChange = async (employeeId, newStatus) => {
    try {
      const result = await revertEmployeeStatus(employeeId, newStatus, 'Reverted by admin');
      if (result.success) {
        showNotification(result.message, 'success');
        // Reload profile to get updated status
        loadData();
      } else {
        showNotification(result.message || 'Failed to update status', 'error');
      }
    } catch (error) {
      showNotification('An error occurred while updating status', 'error');
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-gray-800 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 font-medium tracking-wide">Fetching Employee Record...</p>
      </div>
    </div>
  );
  
  if (!profile) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-gray-100 max-w-md">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <User size={32} />
        </div>
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
    <div className={`min-h-screen flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 p-6 w-full overflow-hidden text-gray-800 transition-all duration-300 ${sidebarOpen ? 'max-w-[1400px] xl:max-w-[77vw]' : 'max-w-[1600px] xl:max-w-[88vw]'}`}>
      <ToastNotification notification={notification} />

      {/* Navigation Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
        <button 
          onClick={() => navigate('/admin-dashboard/employees')}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft size={18} />
          <span className="font-bold text-sm">Return to Directory</span>
        </button>
      </div>

      {/* Unified Master Profile View - Pass isAdmin and onStatusChange */}
      <div className="mb-0">
        <EmployeeProfileView 
            profile={profile}
            loading={loading}
            error={null}
            onRefresh={loadData}
            isAdmin={true}
            onStatusChange={handleStatusChange}
        />
      </div>
    </div>
  );
};

export default EmployeeProfile;
