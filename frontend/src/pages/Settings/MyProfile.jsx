import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { User, Mail, Building, Shield, Camera, Save, Loader2, Pencil, X, Check, Calendar, Briefcase } from 'lucide-react';
import { updateMyProfile } from '../../api/employeeApi';
import api from '../../api/axios';

export default function MyProfile() {
  const outletContext = useOutletContext?.() || { sidebarOpen: true };
  const { sidebarOpen = true } = outletContext;
  const { user, setUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState({first_name: '', last_name: '', email: ''});
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  // Fetch current user profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await api.get('/auth/me');
        if (response.data.success) {
          const userData = response.data.data;
          setProfile(userData);
          const nameParts = userData.name?.split(' ') || ['', ''];
          setFormData({first_name: nameParts[0] || '', last_name: nameParts.slice(1).join(' ') || '', email: userData.email || ''});
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

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
        const newName = `${formData.first_name} ${formData.last_name}`;
        const newAvatar = result.data?.avatar || avatarPreview || profile?.avatar;
        
        setSuccess('Profile updated successfully!');
        setProfile(prev => ({
          ...prev,
          name: newName,
          email: formData.email,
          avatar: newAvatar
        }));
        
        // Update the global user context so header updates immediately
        setUser(prev => ({
          ...prev,
          name: result.data?.name || newName,
          email: result.data?.email || formData.email,
          avatar: newAvatar,
          profilePicture: newAvatar
        }));
        
        setIsEditing(false);
        setAvatarFile(null);
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.message || 'Failed to update profile');
      }
    } catch (err) {
      setError('An error occurred while updating profile');
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

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-100 to-stone-50 rounded-xl shadow-xl p-7 w-full transition-all duration-300 ${!sidebarOpen ? 'max-w-[1600px] xl:max-w-[88vw]' : 'max-w-[1400px] xl:max-w-[77vw]'}`}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
          <p className="text-gray-500 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col bg-gradient-to-br from-neutral-100 to-stone-50 rounded-xl shadow-xl p-7 w-full overflow-hidden text-gray-800 transition-all duration-300 ${!sidebarOpen ? 'max-w-[1600px] xl:max-w-[88vw]' : 'max-w-[1400px] xl:max-w-[77vw]'}`}>
      
      {/* Header Section */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
        <p className="text-gray-500 mt-1">Profile Information and Preferences</p>
      </div>

      {/* Success/Error Alerts */}
      {success && (
        <div className="mb-6 flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl animate-fade-in">
          <Check className="w-5 h-5" />
          <span className="font-medium">{success}</span>
        </div>
      )}
      {error && (
        <div className="mb-6 flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
          <X className="w-5 h-5" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Main Profile Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Gray Header Banner */}
        <div className="h-24 bg-gray-200 relative"></div>
        
        {/* Profile Content */}
        <div className="px-8 pb-8">
          {/* Avatar & Basic Info */}
          <div className="flex flex-col md:flex-row items-start md:items-end gap-6 -mt-12 mb-8">
            {/* Circular Avatar */}
            <div className="relative group">
              <div className="w-24 h-24 rounded-full border-4 border-white bg-gray-100 overflow-hidden shadow-lg">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-600 text-2xl font-bold">
                    {formData.first_name?.[0]?.toUpperCase()}{formData.last_name?.[0]?.toUpperCase()}
                  </div>
                )}
              </div>
              {isEditing && (
                <label className="absolute -bottom-1 -right-1 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-300 transition-all shadow-md">
                  <Camera size={16} className="text-gray-600" />
                  <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                </label>
              )}
            </div>
            
            {/* Name & Role */}
            <div className="flex-1 pt-4 md:pt-0">
              <h2 className="text-xl font-bold text-gray-900">{profile?.name || 'User'}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  profile?.role === 'admin' || profile?.role === 'hr' 
                    ? 'bg-purple-100 text-purple-700' 
                    : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {profile?.role?.charAt(0).toUpperCase() + profile?.role?.slice(1) || 'Employee'}
                </span>
                <span className="text-gray-400">•</span>
                <span className="text-sm text-gray-600">{profile?.department || 'No Department'}</span>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-2 mt-4 md:mt-0">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-all"
                >
                  <Pencil size={16} />
                  Edit Profile
                </button>
              ) : (
                <>
                  <button
                    onClick={handleCancel}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 hover:text-red-800 transition-all"
                  >
                    <X size={16} />
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 hover:text-green-800 transition-all disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Save size={16} />
                    )}
                    Save
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Profile Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-emerald-600 uppercase tracking-wider">Personal Information</h3>
              
              {/* First Name */}
              <div>
                <label className="text-xs text-gray-500 uppercase">First Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 outline-none transition-all bg-white mt-1"
                    placeholder="Enter first name"
                  />
                ) : (
                  <p className="px-4 py-2.5 bg-gray-50 rounded-lg text-gray-800 mt-1">{formData.first_name || 'Not set'}</p>
                )}
              </div>

              {/* Last Name */}
              <div>
                <label className="text-xs text-gray-500 uppercase">Last Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 outline-none transition-all bg-white mt-1"
                    placeholder="Enter last name"
                  />
                ) : (
                  <p className="px-4 py-2.5 bg-gray-50 rounded-lg text-gray-800 mt-1">{formData.last_name || 'Not set'}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="text-xs text-gray-500 uppercase">Email Address</label>
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 outline-none transition-all bg-white mt-1"
                    placeholder="Enter email address"
                  />
                ) : (
                  <p className="px-4 py-2.5 bg-gray-50 rounded-lg text-gray-800 mt-1">{formData.email || 'Not set'}</p>
                )}
              </div>

              {/* Employee ID */}
              <div>
                <label className="text-xs text-gray-500 uppercase">Employee ID</label>
                <p className="px-4 py-2.5 bg-gray-50 rounded-lg text-gray-800 font-mono mt-1">
                  {profile?.employeeId || user?.employeeId || 'N/A'}
                </p>
              </div>

              {/* Role */}
              <div>
                <label className="text-xs text-gray-500 uppercase">Role</label>
                <div className="px-4 py-2.5 bg-gray-50 rounded-lg mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    profile?.role === 'admin' || profile?.role === 'hr' 
                      ? 'bg-purple-100 text-purple-700' 
                      : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {profile?.role?.charAt(0).toUpperCase() + profile?.role?.slice(1) || 'Employee'}
                  </span>
                </div>
              </div>
            </div>

            {/* Work Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-emerald-600 uppercase tracking-wider">Work Information</h3>
              
              {/* Department */}
              <div>
                <label className="text-xs text-gray-500 uppercase">Department</label>
                <p className="px-4 py-2.5 bg-gray-50 rounded-lg text-gray-800 mt-1">
                  {profile?.department || 'Not assigned'}
                </p>
              </div>

              {/* Job Title */}
              <div>
                <label className="text-xs text-gray-500 uppercase">Job Title</label>
                <p className="px-4 py-2.5 bg-gray-50 rounded-lg text-gray-800 mt-1">
                  {profile?.jobTitle || 'Not assigned'}
                </p>
              </div>

              {/* Employment Status */}
              <div>
                <label className="text-xs text-gray-500 uppercase">Employment Status</label>
                <div className="px-4 py-2.5 bg-gray-50 rounded-lg mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    profile?.employmentStatus === 'Active' 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {profile?.employmentStatus || 'Active'}
                  </span>
                </div>
              </div>

              {/* Date Hired */}
              <div>
                <label className="text-xs text-gray-500 uppercase">Date Hired</label>
                <p className="px-4 py-2.5 bg-gray-50 rounded-lg text-gray-800 mt-1">
                  {profile?.dateHired 
                    ? new Date(profile.dateHired).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      }) 
                    : 'Not set'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
