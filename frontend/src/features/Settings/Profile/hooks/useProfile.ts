import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/api/axios';
import { updateMyProfile } from '@/api/employeeApi';

interface Profile {
  id?: number;
  name?: string;
  email?: string;
  avatar?: string;
  role?: string;
  department?: string;
  employmentStatus?: string;
}

interface FormData {
  first_name: string;
  last_name: string;
  email: string;
}

export const useProfile = () => {
  const { user, setUser } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
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
          const nameParts = userData.name?.split(' ') || ['', ''];
          setFormData({
            first_name: nameParts[0] || '', 
            last_name: nameParts.slice(1).join(' ') || '', 
            email: userData.email || ''
          });
          setAvatarPreview(userData.avatar || null);
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

      const result = await (updateMyProfile as any)(data);
      
      if (result.success) {
        const newName = `${formData.first_name} ${formData.last_name}`;
        const newAvatar = result.data?.avatar || avatarPreview || profile?.avatar;
        
        setSuccess('Profile updated successfully!');
        setProfile(prev => ({
          ...prev,
          name: newName,
          email: formData.email,
          avatar: newAvatar
        }));
        
        (setUser as any)((prev: any) => ({
          ...prev,
          name: result.data?.name || newName,
          email: result.data?.email || formData.email,
          avatar: newAvatar,
          profilePicture: newAvatar
        }));
        
        setIsEditing(false);
        setAvatarFile(null);
        setTimeout(() => setSuccess(null), 3000);
        return { success: true };
      } else {
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
      setAvatarPreview(profile.avatar || null);
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
