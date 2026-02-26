import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/api/axios';
import { updateMyProfile } from '@/api/employeeApi';
import { User, Employee, ApiResponse } from '@/types';

interface FormData {
  first_name: string;
  last_name: string;
  email: string;
}

export const useProfile = () => {
  const { user, setUser, updateProfile } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({first_name: '', last_name: '', email: ''});
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await api.get('/auth/me');
        if (response.data.success) {
          const userData = response.data.data;
          setProfile(userData);
          
          // Use firstName/lastName directly if available, fallback to splitting name
          setFormData({
            first_name: userData.firstName || userData.name?.split(' ')[0] || '',
            last_name: userData.lastName || userData.name?.split(' ').slice(1).join(' ') || '',
            email: userData.email || ''
          });
          setAvatarPreview(userData.avatarUrl || userData.avatar || null);
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const data = new FormData();
      data.append('first_name', formData.first_name);
      data.append('last_name', formData.last_name);
      data.append('email', formData.email);
      if (avatarFile) {
        data.append('avatar', avatarFile);
      }

      const result = await updateMyProfile(data);
      
      if (result.success) {
        const userData = result.data as Employee & { name?: string; avatarUrl?: string; firstName?: string; lastName?: string };
        const newName = userData?.name || `${userData?.first_name || formData.first_name} ${userData?.last_name || formData.last_name}`.trim();
        const newAvatar = userData?.avatarUrl || userData?.avatar_url || avatarPreview || profile?.avatarUrl;
        
        setSuccess('Profile updated successfully!');
        
        // Update local state
        setProfile(prev => {
          if (!prev) return null;
          return {
            ...prev,
            ...userData,
            name: newName,
            email: formData.email,
            avatarUrl: newAvatar
          } as User;
        });
        
        // Use updateProfile from useAuth for partial updates
        const updates: Partial<User> = {
          firstName: userData?.firstName || userData?.first_name || formData.first_name,
          lastName: userData?.lastName || userData?.last_name || formData.last_name,
          name: newName,
          email: userData?.email || formData.email,
          avatarUrl: newAvatar
        };

        // Use updateProfile from useAuth for partial updates
        updateProfile(updates);
        
        setIsEditing(false);
        setAvatarFile(null);
        setTimeout(() => setSuccess(null), 3000);
        return { success: true };
      }
 else {
        setError(result.message || 'Failed to update profile');
        return { success: false, message: result.message };
      }
    } catch (err) {
      setError('An error occurred while updating profile');
      return { success: false };
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (profile) {
      const nameParts = profile.name?.split(' ') || ['', ''];
      setFormData({
        first_name: nameParts[0] || '',
        last_name: nameParts.slice(1).join(' ') || '',
        email: profile.email || ''
      });
      setAvatarPreview(profile.avatarUrl || null);
    }
    setAvatarFile(null);
    setError(null);
  };

  return {
    user,
    profile,
    loading,
    saving,
    error,
    success,
    isEditing,
    formData,
    avatarPreview,
    setIsEditing,
    setError,
    setSuccess,
    handleChange,
    handleAvatarChange,
    handleSubmit,
    handleCancel,
    setProfile
  };
};
