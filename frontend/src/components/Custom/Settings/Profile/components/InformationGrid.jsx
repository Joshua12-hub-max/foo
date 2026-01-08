import { useState } from 'react';
import { Mail, Building, Briefcase, IdCard, Calendar, Shield, UserCircle, Lock, Loader2 } from 'lucide-react';
import InfoItem from './InfoItem';
import EmploymentStatusBadge from '@components/Custom/Common/EmploymentStatusBadge';
import { enableTwoFactor, disableTwoFactor } from '@/Service/Auth';

const InformationGrid = ({ profile, user, isEditing, formData, handleChange, setIsEditing, setProfile }) => {
  const [securityLoading, setSecurityLoading] = useState(false);

  const handleToggle2FA = async () => {
      if (!profile) return;
      setSecurityLoading(true);
      try {
          if (profile.twoFactorEnabled) {
              await disableTwoFactor();
              if (setProfile) setProfile({ ...profile, twoFactorEnabled: false });
          } else {
              await enableTwoFactor();
              if (setProfile) setProfile({ ...profile, twoFactorEnabled: true });
          }
      } catch (error) {
          console.error("Failed to toggle 2FA:", error);
          alert("Failed to update security settings.");
      } finally {
          setSecurityLoading(false);
      }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* Personal Information */}
      <div className="bg-gray-50 rounded-2xl border border-gray-100 p-5">
        <h3 className="text-sm font-bold text-gray-800 mb-4">Personal Information</h3>
        
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">First Name</label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all shadow-sm"
                placeholder="Enter first name"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Last Name</label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all shadow-sm"
                placeholder="Enter last name"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all shadow-sm"
                placeholder="Enter email"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <InfoItem 
              icon={UserCircle} 
              label="Full Name" 
              value={profile?.name} 
              editable={true}
              setIsEditing={setIsEditing}
            />
            <InfoItem 
              icon={Mail} 
              label="Email Address" 
              value={profile?.email} 
              editable={true}
              setIsEditing={setIsEditing}
            />
            <InfoItem 
              icon={IdCard} 
              label="Employee ID" 
              value={profile?.employeeId || user?.employeeId} 
            />
            <InfoItem 
              icon={Shield} 
              label="Role" 
              value={profile?.role?.charAt(0).toUpperCase() + profile?.role?.slice(1)} 
            />
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* Work Information */}
        <div className="bg-gray-50 rounded-2xl border border-gray-100 p-5">
            <h3 className="text-sm font-bold text-gray-800 mb-4">Work Information</h3>
            <div className="space-y-4">
            <InfoItem 
                icon={Building} 
                label="Department" 
                value={profile?.department} 
            />
            <InfoItem 
                icon={Briefcase} 
                label="Job Title" 
                value={profile?.jobTitle} 
            />
            <InfoItem 
                icon={Calendar} 
                label="Date Hired" 
                value={profile?.dateHired 
                ? new Date(profile.dateHired).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                    }) 
                : null
                } 
            />
            <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                <Shield size={18} className="text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 font-medium">Employment Status</p>
                <div className="mt-0.5">
                    <EmploymentStatusBadge status={profile?.employmentStatus || 'Active'} />
                </div>
                </div>
            </div>
            </div>
        </div>

        {/* Security Settings */}
        <div className="bg-gray-50 rounded-2xl border border-gray-100 p-5">
            <h3 className="text-sm font-bold text-gray-800 mb-4">Security</h3>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                            <Lock size={18} className="text-gray-500" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-900">Two-Factor Authentication</p>
                            <p className="text-xs text-gray-500">Secure your account with Email OTP.</p>
                        </div>
                    </div>
                    <button
                        onClick={handleToggle2FA}
                        disabled={securityLoading}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 ${
                            profile?.twoFactorEnabled ? 'bg-slate-900' : 'bg-gray-200'
                        }`}
                    >
                        {securityLoading ? (
                             <Loader2 className="h-4 w-4 animate-spin text-white absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                        ) : (
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    profile?.twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
                                }`}
                            />
                        )}
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default InformationGrid;
