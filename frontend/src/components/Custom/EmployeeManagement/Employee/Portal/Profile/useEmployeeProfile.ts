import { useState, useCallback, useEffect } from 'react';
import axiosInstance from '@/api/axios';
import axios from 'axios';

export interface Profile {
  id?: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  avatar?: string;
  department?: string;
  jobTitle?: string;
  positionTitle?: string;
  skills?: unknown[];
  education?: unknown[];
  [key: string]: unknown;
}

export interface UpdateResult {
  success: boolean;
  message?: string;
}

export interface UseEmployeeProfileReturn {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  updating: boolean;
  updateSuccess: boolean;
  fetchProfile: () => Promise<void>;
  updateProfile: (formData: FormData) => Promise<UpdateResult>;
}

export const useEmployeeProfile = (): UseEmployeeProfileReturn => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  // Fetch Profile (User Me)
  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 1. Get basic identity to know WHO we are
      const authRes = await axiosInstance.get('/auth/me');
      if (!authRes.data.success) throw new Error('Failed to authenticate');
      
      const userId = authRes.data.data.id;

      // 2. Fetch FULL detailed record (Skills, Education, Contacts) using Employee API
      // The backend allows this if req.user.id === params.id
      const fullProfileRes = await axiosInstance.get(`/employees/${userId}`);
      
      if (fullProfileRes.data.success) {
        setProfile(fullProfileRes.data.employee);
      } else {
        // Fallback to basic auth data if full fetch fails
        setProfile(authRes.data.data);
      }

    } catch (err: unknown) {
      console.error(err);
      const message = import.meta.env.DEV ? (err instanceof Error ? err.message : 'Unknown error') : 'Failed to load profile';
      setError(axios.isAxiosError(err) ? err.response?.data?.message || message : message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update profile function remains the same, targeting auth profile endpoint
  // Note: For updating specific sections like Skills/Education, we would need separate functions
  const updateProfile = useCallback(async (formData: FormData): Promise<UpdateResult> => {
    try {
      setUpdating(true);
      setUpdateSuccess(false);
      
      // Since we mainly update personal info here, auth/profile is still valid
      // or we could use /employees/:id update. using auth/profile for now as it handles avatar well.
      const res = await axiosInstance.put('/auth/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (res.data.success) {
        setUpdateSuccess(true);
        fetchProfile(); // Reload to show changes
        return { success: true };
      }
      return { success: false, message: res.data.message };
    } catch (err: unknown) {
      return { 
        success: false, 
        message: axios.isAxiosError(err) ? err.response?.data?.message || 'Update failed' : 'Update failed' 
      };
    } finally {
      setUpdating(false);
    }
  }, [fetchProfile]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    loading,
    error,
    updating,
    updateSuccess,
    fetchProfile,
    updateProfile
  };
};

export default useEmployeeProfile;
