import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
    <div className="min-h-screen flex flex-col bg-[var(--zed-bg-surface)] p-8">
      <ProfileSkeleton />
    </div>
  );
  
  if (!profile) return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--zed-bg-surface)] p-8">
      <div className="text-center p-10 bg-white rounded-[var(--radius-lg)] shadow-sm border border-[var(--zed-border-light)] max-w-md">
        <h2 className="text-xl font-bold text-[var(--zed-text-dark)] mb-2">Profile not found</h2>
        <p className="text-[var(--zed-text-muted)] mb-8 font-medium">The employee record you are looking for might have been removed or moved.</p>
        <button 
          onClick={() => navigate('/admin-dashboard/employees')}
          className="bg-[var(--zed-primary)] text-white px-8 py-3 rounded-[var(--radius-md)] font-black text-xs shadow-lg shadow-[var(--zed-primary)]/20 hover:bg-[var(--zed-primary-hover)] transition-all active:scale-95"
        >
          Return to directory
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[var(--zed-bg-surface)] animate-in fade-in duration-500">
      
      {/* Navigation Header - Fixed at top, aligned width with content below */}
      <div className="sticky top-0 z-20 bg-[var(--zed-bg-surface)]/80 backdrop-blur-md pt-6 pb-4 mb-4 border-b border-[var(--zed-border-light)] px-8">
        <button 
          onClick={() => navigate('/admin-dashboard/employees')}
          className="flex items-center gap-2 text-[var(--zed-text-muted)] hover:text-black transition-all group"
        >
          <div className="p-2 rounded-full group-hover:bg-white transition-all shadow-none group-hover:shadow-sm border border-transparent group-hover:border-[var(--zed-border-light)]">
            <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
          </div>
          <span className="font-black text-xs tracking-widest uppercase">Return to directory</span>
        </button>
      </div>

      {/* Main Content Area - px-8 padding matches the navigation header above */}
      <div className="px-8 pb-12 space-y-8">
        
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
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

        <div className="bg-white rounded-[var(--radius-lg)] border border-[var(--zed-border-light)] shadow-sm overflow-hidden">
          <PDSFormWizard employeeId={Number(id)} />
        </div>

      </div>
    </div>
  );
};

export default EmployeeProfile;
