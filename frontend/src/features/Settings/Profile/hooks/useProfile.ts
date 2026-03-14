import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/api/axios';
import { updateMyProfile, employeeApi } from '@/api/employeeApi';
import { User, Employee, ApiResponse, EmployeeDetailed } from '@/types';

import { Profile, ProfileFormData } from '../types';

export const useProfile = () => {
  const { user, setUser, updateProfile } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  const initialFormData: ProfileFormData = {
    firstName: '',
    lastName: '',
    middleName: '',
    suffix: '',
    email: '',
    phoneNumber: '',
    mobileNo: '',
    telephoneNo: '',
    birthDate: '',
    gender: '',
    civilStatus: '',
    nationality: '',
    placeOfBirth: '',
    residentialAddress: '',
    permanentAddress: '',
    religion: '',
    citizenship: '',
    citizenshipType: '',
    officeAddress: '',
    station: '',
    educationalBackground: '',
    schoolName: '',
    course: '',
    yearGraduated: '',
    umidNumber: '',
    philsysId: '',
    philhealthNumber: '',
    pagibigNumber: '',
    tinNumber: '',
    gsisNumber: '',
    heightM: '',
    weightKg: '',
    bloodType: '',
    eligibilityType: '',
    eligibilityNumber: '',
    eligibilityDate: '',
    yearsOfExperience: '',
  };

  const [formData, setFormData] = useState<ProfileFormData>(initialFormData);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await api.get('/auth/me');
        if (response.data.success) {
          const userData = response.data.data.user || response.data.data;
          
          let detailedData: Partial<Profile> = {};
          // Use the primary key ID for fetching detailed profile
          const fetchId = userData.id;
          
          if (fetchId) {
            try {
              const [employeeRes, docsRes] = await Promise.all([
                employeeApi.fetchEmployeeProfile(fetchId),
                employeeApi.fetchEmployeeDocuments(fetchId)
              ]);

              if (employeeRes.success && employeeRes.profile) {
                detailedData = employeeRes.profile as Partial<Profile>;
              }

              if (docsRes.success && docsRes.documents) {
                detailedData.documents = docsRes.documents;
              }
            } catch (empErr) {
              console.error('Failed to fetch detailed employee profile/documents:', empErr);
            }
          }

          const mergedData = { ...userData, ...detailedData };
          setProfile(mergedData);
          
          // Populate Form Data
          setFormData({
            firstName: mergedData.firstName || mergedData.name?.split(' ')[0] || '',
            lastName: mergedData.lastName || mergedData.name?.split(' ').slice(1).join(' ') || '',
            middleName: mergedData.middleName || '',
            suffix: mergedData.suffix || '',
            email: mergedData.email || '',
            phoneNumber: mergedData.phoneNumber || '',
            mobileNo: mergedData.mobileNo || '',
            telephoneNo: mergedData.telephoneNo || '',
            birthDate: mergedData.birthDate || '',
            gender: mergedData.gender || '',
            civilStatus: mergedData.civilStatus || '',
            nationality: mergedData.nationality || '',
            placeOfBirth: mergedData.placeOfBirth || '',
            residentialAddress: mergedData.residentialAddress || mergedData.address || '',
            permanentAddress: mergedData.permanentAddress || '',
            religion: mergedData.religion || '',
            citizenship: mergedData.citizenship || '',
            citizenshipType: mergedData.citizenshipType || '',
            officeAddress: mergedData.officeAddress || '',
            station: mergedData.station || '',
            educationalBackground: mergedData.educationalBackground || '',
            schoolName: mergedData.schoolName || '',
            course: mergedData.course || '',
            yearGraduated: mergedData.yearGraduated || '',
            umidNumber: mergedData.umidNumber || '',
            philsysId: mergedData.philsysId || '',
            philhealthNumber: mergedData.philhealthNumber || '',
            pagibigNumber: mergedData.pagibigNumber || '',
            tinNumber: mergedData.tinNumber || '',
            gsisNumber: mergedData.gsisNumber || '',
            heightM: String(mergedData.heightM || ''),
            weightKg: String(mergedData.weightKg || ''),
            bloodType: mergedData.bloodType || '',
            eligibilityType: mergedData.eligibilityType || '',
            eligibilityNumber: mergedData.eligibilityNumber || '',
            eligibilityDate: mergedData.eligibilityDate || '',
            yearsOfExperience: String(mergedData.yearsOfExperience || ''),
          });
          setAvatarPreview(mergedData.avatarUrl || mergedData.avatar || null);
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
      // Add all fields to FormData
      Object.entries(formData).forEach(([key, value]) => {
        data.append(key, String(value || ''));
      });
      
      if (avatarFile) {
        data.append('avatar', avatarFile);
      }

      const result = await updateMyProfile(data);
      
      if (result.success) {
        const userData = result.data as Partial<User>;
        const newName = (userData?.name as string) || `${formData.firstName} ${formData.lastName}`.trim();
        const newAvatar = (userData?.avatarUrl as string) || avatarPreview || profile?.avatarUrl;
        
        setSuccess('Profile updated successfully!');
        
        // Update local state
        setProfile(prev => {
          if (!prev) return null;
          return {
            ...prev,
            ...userData,
            ...formData, // Spread all form fields back into profile
            yearsOfExperience: formData.yearsOfExperience ? Number(formData.yearsOfExperience) : null,
            name: newName,
            avatarUrl: newAvatar
          } as Profile;
        });
        
        // Prepare updates for useAuth
        const updates: Partial<User> = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          name: newName,
          email: formData.email,
          avatarUrl: newAvatar
        };

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
      setFormData({
        firstName: profile.firstName || profile.name?.split(' ')[0] || '',
        lastName: profile.lastName || profile.name?.split(' ').slice(1).join(' ') || '',
        middleName: profile.middleName || '',
        suffix: profile.suffix || '',
        email: profile.email || '',
        phoneNumber: profile.phoneNumber || '',
        mobileNo: profile.mobileNo || '',
        telephoneNo: profile.telephoneNo || '',
        birthDate: profile.birthDate || '',
        gender: profile.gender || '',
        civilStatus: profile.civilStatus || '',
        nationality: profile.nationality || '',
        placeOfBirth: profile.placeOfBirth || '',
        residentialAddress: profile.residentialAddress || profile.address || '',
        permanentAddress: profile.permanentAddress || '',
        religion: profile.religion || '',
        citizenship: profile.citizenship || '',
        citizenshipType: profile.citizenshipType || '',
        officeAddress: profile.officeAddress || '',
        station: profile.station || '',
        educationalBackground: profile.educationalBackground || '',
        schoolName: profile.schoolName || '',
        course: profile.course || '',
        yearGraduated: profile.yearGraduated || '',
        umidNumber: profile.umidNumber || '',
        philsysId: profile.philsysId || '',
        philhealthNumber: profile.philhealthNumber || '',
        pagibigNumber: profile.pagibigNumber || '',
        tinNumber: profile.tinNumber || '',
        gsisNumber: profile.gsisNumber || '',
        heightM: String(profile.heightM || ''),
        weightKg: String(profile.weightKg || ''),
        bloodType: profile.bloodType || '',
        eligibilityType: profile.eligibilityType || '',
        eligibilityNumber: profile.eligibilityNumber || '',
        eligibilityDate: profile.eligibilityDate || '',
        yearsOfExperience: String(profile.yearsOfExperience || ''),
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
