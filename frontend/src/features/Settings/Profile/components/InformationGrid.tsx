import React, { useState } from 'react';
import { ChevronDown, Lock, Loader2, Mail, Phone, MapPin, Calendar, User as LucideUser, Briefcase, GraduationCap, Shield, Ruler, Weight, Droplets, MapPinIcon, Globe, CreditCard, Building2, BadgeCheck, FileText } from 'lucide-react';
import InfoItem from './InfoItem';
import EmploymentStatusBadge from '@components/Custom/Common/EmploymentStatusBadge';
import { enableTwoFactor, disableTwoFactor } from '@/Service/Auth';
import { User } from '@/types';
import { Profile, ProfileFormData } from '../types';
import ph from 'phil-reg-prov-mun-brgy';

const phLib = ph as {
  regions: any[];
  provinces: any[];
  city_mun: any[];
  barangays: any[];
};

const getLocationName = (type: 'region' | 'province' | 'city' | 'barangay', code: string | null | undefined) => {
  if (!code) return null;
  // If it's not a code (e.g. already a name), return it
  if (!/^\d+$/.test(code)) return code;

  switch (type) {
    case 'region': return phLib.regions.find(r => r.reg_code === code)?.name || code;
    case 'province': return phLib.provinces.find(p => p.prov_code === code)?.name || code;
    case 'city': return phLib.city_mun.find(c => c.mun_code === code)?.name || code;
    case 'barangay': return code; // Barangays are usually stored as names or codes depend on lib
    default: return code;
  }
};

interface InformationGridProps {
  profile: Profile | null;
  user: User | null;
  isEditing: boolean;
  formData: ProfileFormData;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setIsEditing: (isEditing: boolean) => void;
  setProfile: React.Dispatch<React.SetStateAction<Profile | null>>;
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
      <div className={`overflow-hidden transition-all duration-200 ${isOpen ? 'max-h-[2000px] opacity-100 pb-4' : 'max-h-0 opacity-0'}`}>
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

  const renderInput = (label: string, name: keyof ProfileFormData, type: string = "text", placeholder: string = "") => (
    <div className="mb-4">
      <label className="block text-[10px] font-semibold text-gray-400 mb-1.5">{label}</label>
      <input
        type={type}
        name={name}
        value={formData[name] || ''}
        onChange={handleChange}
        className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all font-medium"
        placeholder={placeholder}
      />
    </div>
  );

  return (
    <div className="w-full">
      
      {/* 1. Personal Information */}
      <ToggleSection title="Personal Information">
        {isEditing ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            {renderInput("First Name", "firstName")}
            {renderInput("Last Name", "lastName")}
            {renderInput("Middle Name", "middleName")}
            {renderInput("Suffix", "suffix")}
            {renderInput("Birth Date", "birthDate", "date")}
            {renderInput("Sex / Gender", "gender")}
            {renderInput("Civil Status", "civilStatus")}
            {renderInput("Nationality", "nationality")}
            {renderInput("Place of Birth", "placeOfBirth")}
            {renderInput("Religion", "religion")}
            {renderInput("Citizenship", "citizenship")}
            {renderInput("Citizenship Type", "citizenshipType")}
            {renderInput("Dual Citizenship Country", "dualCountry")}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
            <InfoItem label="Full Name" value={profile?.name || `${profile?.firstName} ${profile?.lastName}`} editable setIsEditing={setIsEditing} />
            <InfoItem label="Employee ID" value={profile?.employeeId || user?.employeeId} />
            <InfoItem label="Birth Date" value={profile?.birthDate} />
            <InfoItem label="Sex / Gender" value={profile?.gender} />
            <InfoItem label="Civil Status" value={profile?.civilStatus} />
            <InfoItem label="Nationality" value={profile?.nationality} />
            <InfoItem label="Place of Birth" value={profile?.placeOfBirth} />
            <InfoItem label="Religion" value={profile?.religion} />
            <InfoItem label="Citizenship" value={profile?.citizenship} />
            <InfoItem label="Citizenship Type" value={profile?.citizenshipType} />
            <InfoItem label="Dual Citizenship Country" value={profile?.dualCountry} />
          </div>
        )}
      </ToggleSection>

      {/* 2. Contact Information */}
      <ToggleSection title="Contact Information">
        {isEditing ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
             {renderInput("Email Address", "email", "email")}
             {renderInput("Mobile Number", "mobileNo")}
             {renderInput("Telephone Number", "telephoneNo")}
             <div className="md:col-span-2">
                {renderInput("Residential Address", "residentialAddress")}
                {renderInput("Permanent Address", "permanentAddress")}
             </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
            <InfoItem label="Email Address" value={profile?.email} />
            <InfoItem label="Mobile Number" value={profile?.mobileNo || profile?.phoneNumber} />
            <InfoItem label="Telephone Number" value={profile?.telephoneNo} />

            {/* Residential Address Details */}
            <div className="md:col-span-2 mt-4">
              <h4 className="text-xs font-bold text-gray-700 mb-3 uppercase tracking-wider">Residential Address Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 pl-4 border-l-2 border-gray-100">
                <InfoItem label="House/Block/Lot" value={profile?.resHouseBlockLot} />
                <InfoItem label="Street" value={profile?.resStreet} />
                <InfoItem label="Subdivision/Village" value={profile?.resSubdivision} />
                <InfoItem label="Barangay" value={profile?.resBarangay} />
                <InfoItem label="City/Municipality" value={getLocationName('city', profile?.resCity)} />
                <InfoItem label="Province" value={getLocationName('province', profile?.resProvince)} />
                <InfoItem label="Region" value={getLocationName('region', profile?.resRegion)} />
                <InfoItem label="Full Address" value={profile?.residentialAddress || profile?.address} />
              </div>
            </div>

            {/* Permanent Address Details */}
            <div className="md:col-span-2 mt-4">
              <h4 className="text-xs font-bold text-gray-700 mb-3 uppercase tracking-wider">Permanent Address Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 pl-4 border-l-2 border-gray-100">
                <InfoItem label="House/Block/Lot" value={profile?.permHouseBlockLot} />
                <InfoItem label="Street" value={profile?.permStreet} />
                <InfoItem label="Subdivision/Village" value={profile?.permSubdivision} />
                <InfoItem label="Barangay" value={profile?.permBarangay} />
                <InfoItem label="City/Municipality" value={getLocationName('city', profile?.permCity)} />
                <InfoItem label="Province" value={getLocationName('province', profile?.permProvince)} />
                <InfoItem label="Region" value={getLocationName('region', profile?.permRegion)} />
                <InfoItem label="Full Address" value={profile?.permanentAddress} />
              </div>
            </div>

            <div className="md:col-span-2 mt-4">
              <h4 className="text-xs font-bold text-gray-700 mb-3">Emergency Contact</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 pl-4 border-l-2 border-gray-100">
                <InfoItem label="Emergency Contact" value={profile?.emergencyContact} />
                <InfoItem label="Emergency Number" value={profile?.emergencyContactNumber} />
              </div>
            </div>
          </div>
        )}
      </ToggleSection>

      {/* 3. Work Information */}
      <ToggleSection title="Work Information">
        {isEditing ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            {renderInput("Office Address", "officeAddress")}
            {renderInput("Station", "station")}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
            <InfoItem label="Department" value={profile?.department} />
            <InfoItem label="Position Title" value={profile?.jobTitle || profile?.positionTitle} />
            <InfoItem label="Appointment Type" value={profile?.appointmentType} />
            <InfoItem label="Employment Type" value={profile?.employmentType} />
            <InfoItem label="Salary Grade" value={profile?.salaryGrade} />
            <InfoItem label="Step Increment" value={profile?.stepIncrement} />
            <InfoItem label="Item Number" value={profile?.itemNumber} />
            <InfoItem label="Station" value={profile?.station} />
            <div className="md:col-span-2">
               <InfoItem label="Office Address" value={profile?.officeAddress} />
            </div>
            <InfoItem 
              label="Date Hired" 
              value={profile?.dateHired 
                ? new Date(profile.dateHired).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) 
                : null
              } 
            />
            <InfoItem 
              label="Original Appointment" 
              value={profile?.originalAppointmentDate} 
            />
            <InfoItem label="Last Promotion" value={profile?.lastPromotionDate} />
            <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0 md:col-span-2">
              <div>
                <p className="text-[10px] font-semibold text-gray-400">Employment Status</p>
                <div className="mt-1">
                  <EmploymentStatusBadge status={profile?.employmentStatus || 'Active'} />
                </div>
              </div>
            </div>
          </div>
        )}
      </ToggleSection>

      {/* 4. Government Identifiers */}
      <ToggleSection title="Government Identifiers">
        {isEditing ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            {renderInput("UMID Number", "umidNumber")}
            {renderInput("PhilSys ID", "philsysId")}
            {renderInput("PhilHealth Number", "philhealthNumber")}
            {renderInput("Pag-IBIG Number", "pagibigNumber")}
            {renderInput("SSS Number", "sssNumber")}
            {renderInput("TIN Number", "tinNumber")}
            {renderInput("GSIS BP Number", "gsisNumber")}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
            <InfoItem label="UMID Number" value={profile?.umidNumber} />
            <InfoItem label="PhilSys ID" value={profile?.philsysId} />
            <InfoItem label="PhilHealth Number" value={profile?.philhealthNumber} />
            <InfoItem label="Pag-IBIG Number" value={profile?.pagibigNumber} />
            <InfoItem label="SSS Number" value={profile?.sssNumber} />
            <InfoItem label="TIN Number" value={profile?.tinNumber} />
            <InfoItem label="GSIS BP Number" value={profile?.gsisNumber} />
          </div>
        )}
      </ToggleSection>

      {/* 5. Physical Characteristics */}
      <ToggleSection title="Physical Characteristics">
        {isEditing ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4">
            {renderInput("Height (m)", "heightM", "number")}
            {renderInput("Weight (kg)", "weightKg", "number")}
            {renderInput("Blood Type", "bloodType")}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8">
            <InfoItem label="Height (m)" value={profile?.heightM} />
            <InfoItem label="Weight (kg)" value={profile?.weightKg} />
            <InfoItem label="Blood Type" value={profile?.bloodType} />
          </div>
        )}
      </ToggleSection>

      {/* 6. Academic & Eligibility */}
      <ToggleSection title="Academic & Eligibility">
        {isEditing ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            {renderInput("Highest Educational Background", "educationalBackground")}
            {renderInput("School Name", "schoolName")}
            {renderInput("Course", "course")}
            {renderInput("Year Graduated", "yearGraduated")}
            {renderInput("Eligibility Type", "eligibilityType")}
            {renderInput("Eligibility Number", "eligibilityNumber")}
            {renderInput("Eligibility Date", "eligibilityDate", "date")}
            {renderInput("Years of Experience", "yearsOfExperience", "number")}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
            <InfoItem label="Highest Degree" value={profile?.educationalBackground} />
            <InfoItem label="School Name" value={profile?.schoolName} />
            <InfoItem label="Course" value={profile?.course} />
            <InfoItem label="Year Graduated" value={profile?.yearGraduated} />
            <InfoItem label="Eligibility Type" value={profile?.eligibilityType} />
            <InfoItem label="Eligibility Date" value={profile?.eligibilityDate} />
            <InfoItem label="Years of Experience" value={profile?.yearsOfExperience} />
          </div>
        )}
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
