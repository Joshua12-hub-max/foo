import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';

export const useEmployeeProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, []);

  // Update profile function remains the same, targeting auth profile endpoint
  // Note: For updating specific sections like Skills/Education, we would need separate functions
  const updateProfile = useCallback(async (formData) => {
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
    } catch (err) {
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
