import React, { useState } from 'react';
import { ChevronDown, Lock, Loader2 } from 'lucide-react';
import InfoItem from './InfoItem';
import EmploymentStatusBadge from '@components/Custom/Common/EmploymentStatusBadge';
import { enableTwoFactor, disableTwoFactor } from '@/Service/Auth';
import { User } from '@/types';
import { Profile, ProfileFormData } from '../types';

interface InformationGridProps {
  profile: Profile | null;
  user: User | null;
  isEditing: boolean;
  formData: ProfileFormData;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setIsEditing: (isEditing: boolean) => void;
  setProfile: React.Dispatch<React.SetStateAction<User | null>>;
}

// Toggle Section Component
const ToggleSection: React.FC<{ title: string; defaultOpen?: boolean; children: React.ReactNode }> = ({ 
  title, defaultOpen = true, children 
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-100 last:border-0">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-4 text-left group"
      >
        <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest">{title}</h3>
        <ChevronDown 
          size={16} 
          className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>
      <div className={`overflow-hidden transition-all duration-200 ${isOpen ? 'max-h-[1000px] opacity-100 pb-4' : 'max-h-0 opacity-0'}`}>
        {children}
      </div>
    </div>
  );
};

const InformationGrid: React.FC<InformationGridProps> = ({ 
  profile, 
  user, 
  isEditing, 
  formData, 
  handleChange, 
  setIsEditing, 
  setProfile 
}) => {
  const [securityLoading, setSecurityLoading] = useState(false);

  const handleToggle2FA = async () => {
      if (!profile) return;
      setSecurityLoading(true);
      try {
          if (profile.twoFactorEnabled) {
              await disableTwoFactor();
              setProfile(prev => prev ? { ...prev, twoFactorEnabled: false } : null);
          } else {
              await enableTwoFactor();
              setProfile(prev => prev ? { ...prev, twoFactorEnabled: true } : null);
          }
      } catch (error) {
          console.error("Failed to toggle 2FA:", error);
          alert("Failed to update security settings.");
      } finally {
          setSecurityLoading(false);
      }
  };

  return (
    <div className="w-full">
      
      {/* Personal Information */}
      <ToggleSection title="Personal Information">
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Last Name</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
                placeholder="Enter last name"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">First Name</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
                placeholder="Enter first name"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
                placeholder="Enter email"
              />
            </div>
          </div>
        ) : (
          <div>
            <InfoItem label="Full Name" value={profile?.name} editable setIsEditing={setIsEditing} />
            <InfoItem label="Email Address" value={profile?.email} editable setIsEditing={setIsEditing} />
            <InfoItem label="Employee ID" value={profile?.employeeId || user?.employeeId} />
            <InfoItem label="Role" value={profile?.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : ''} />
          </div>
        )}
      </ToggleSection>

      {/* Contact Information */}
      <ToggleSection title="Contact Information">
        <div>
          <InfoItem label="Residential Address" value={profile?.residentialAddress || profile?.address} />
          <InfoItem label="Permanent Address" value={profile?.permanentAddress} />
          <InfoItem label="Emergency Contact Person" value={profile?.emergencyContact} />
          <InfoItem label="Emergency Contact Number" value={profile?.emergencyContactNumber} />
        </div>
      </ToggleSection>

      {/* Educational Background */}
      <ToggleSection title="Educational Background">
        <div>
          <InfoItem label="Highest Achievement / Details" value={profile?.educationalBackground} />
        </div>
      </ToggleSection>

      {/* Work Information */}
      <ToggleSection title="Work Information">
        <div>
          <InfoItem label="Department" value={profile?.department} />
          <InfoItem label="Position Title" value={profile?.jobTitle} />
          <InfoItem 
            label="Date Hired" 
            value={profile?.dateHired 
              ? new Date(profile.dateHired).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) 
              : null
            } 
          />
          <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Employment Status</p>
              <div className="mt-1">
                <EmploymentStatusBadge status={profile?.employmentStatus || 'Active'} />
              </div>
            </div>
          </div>
        </div>
      </ToggleSection>

      {/* Security Settings */}
      <ToggleSection title="Security" defaultOpen={false}>
        <div className="flex items-center justify-between py-3">
          <div>
            <p className="text-sm font-medium text-gray-800">Two-Factor Authentication</p>
            <p className="text-xs text-gray-400 mt-0.5">Secure your account with Email OTP</p>
          </div>
          <button
            onClick={handleToggle2FA}
            disabled={securityLoading}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 ${
              profile?.twoFactorEnabled ? 'bg-gray-900' : 'bg-gray-200'
            }`}
          >
            {securityLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-white absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            ) : (
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                  profile?.twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            )}
          </button>
        </div>
      </ToggleSection>

    </div>
  );
};

export default InformationGrid;
