import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUIStore } from '@/stores';
import { ArrowLeft, Edit } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { fetchEmployeeProfile, revertEmployeeStatus } from '@/api/employeeApi';
import { fetchDepartments } from '@/api/departmentApi';
import { useToastStore } from '@/stores';

// @ts-ignore
import EmployeeProfileView from '@features/EmployeeManagement/Employee/Portal/Profile/EmployeeProfileView';
import { EditEmployeeModal } from '@features/EmployeeManagement/Admin';

interface Profile {
  id: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  department?: string;
  position_title?: string;
  employment_status?: string;
  [key: string]: any;
}

const EmployeeProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);

  const showToast = useToastStore((state) => state.showToast);
  const showNotification = useCallback((message: string, type: 'success' | 'error') => showToast(message, type), [showToast]);
  
  const loadData = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      if (!id) return;
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

  // Fetch Departments for Edit Modal
  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const data = await fetchDepartments();
      return data.success ? data.departments : [];
    },
    staleTime: 1000 * 60 * 60 // 1 hour
  });

  // Handle status change (revert/reactivate)
  const handleStatusChange = async (employeeId: number, newStatus: string): Promise<void> => {
    try {
      const result = await revertEmployeeStatus(employeeId, newStatus, 'Reverted by admin');
      if (result.success) {
        showNotification(result.message || 'Status updated', 'success');
        // Reload profile to get updated status
        loadData();
      } else {
        showNotification(result.message || 'Failed to update status', 'error');
      }
    } catch (error) {
      showNotification('An error occurred while updating status', 'error');
    }
  };

  const handleEditSuccess = () => {
      loadData();
      setShowEditModal(false);
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


      {/* Navigation Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
        <button 
          onClick={() => navigate('/admin-dashboard/employees')}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft size={18} />
          <span className="font-bold text-sm">Return to Directory</span>
        </button>
        
        <button 
          onClick={() => setShowEditModal(true)}
          className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-all text-sm font-semibold shadow-sm"
        >
          <Edit size={16} />
          Edit Profile
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

      {/* Edit Modal */}
      {profile && (
        <EditEmployeeModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          employee={profile}
          departments={departments}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
};

export default EmployeeProfile;
