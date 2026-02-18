import { useState, useCallback, useEffect } from 'react';
import axios from '@/api/axios';
import { Education, Skill } from '@/types';

export interface Profile {
  id: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone_number?: string;
  address?: string;
  avatar?: string;
  department?: string;
  job_title?: string;
  position_title?: string;
  skills?: Skill[];
  education?: Education[];
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
      const authRes = await axios.get('/auth/me');
      if (!authRes.data.success) throw new Error('Failed to authenticate');
      
      const userId = authRes.data.data.id;

      // 2. Fetch FULL detailed record (Skills, Education, Contacts) using Employee API
      // The backend allows this if req.user.id === params.id
      const fullProfileRes = await axios.get(`/employees/${userId}`);
      
      if (fullProfileRes.data.success) {
        setProfile(fullProfileRes.data.employee);
      } else {
        // Fallback to basic auth data if full fetch fails
        setProfile(authRes.data.data);
      }

    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load profile');
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
      const res = await axios.put('/auth/profile', formData, {
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
    } catch (err: any) {
      return { 
        success: false, 
        message: err.response?.data?.message || 'Update failed' 
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
