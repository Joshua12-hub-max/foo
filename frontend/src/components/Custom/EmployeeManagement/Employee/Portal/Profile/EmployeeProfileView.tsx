import React, { useState } from 'react';
import { 
  User, Mail, Phone, MapPin, Briefcase, Hash, CreditCard, 
  Calendar, Flag, AlertCircle, Shield, CheckCircle,
  GraduationCap, Award, Heart, Ruler, Scale, Building, UserCheck, Clock, ToggleLeft, ToggleRight, Loader2,
  Facebook, Linkedin, Twitter
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Education {
  type?: string;
  institution: string;
  degree?: string;
  fieldOfStudy?: string;
  startDate?: string;
  endDate?: string;
}

interface Skill {
  skillName: string;
  proficiencyLevel?: string;
}

interface EmergencyContact {
  name: string;
  relationship: string;
  phoneNumber: string;
  address?: string;
}

interface CustomField {
  label: string;
  value: string;
  icon?: LucideIcon;
  section: string;
}

interface Profile {
  id: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  avatarUrl?: string;
  avatar?: string;
  positionTitle?: string;
  jobTitle?: string;
  employeeId?: string;
  department?: string;
  employmentStatus?: string;
  birthDate?: string;
  gender?: string;
  civilStatus?: string;
  nationality?: string;
  bloodType?: string;
  heightCm?: string;
  weightKg?: string;
  permanentAddress?: string;
  address?: string;
  itemNumber?: string;
  salaryGrade?: string;
  stepIncrement?: string | number;
  appointmentType?: string;
  station?: string;
  officeAddress?: string;
  dateHired?: string;
  firstDayOfService?: string;
  role?: string;
  gsisNumber?: string;
  philhealthNumber?: string;
  pagibigNumber?: string;
  tinNumber?: string;
  phoneNumber?: string;
  emergencyContact?: string;
  emergencyContactNumber?: string;
  education?: Education[];
  skills?: Skill[];
  emergencyContacts?: EmergencyContact[];
  // Plantilla-required eligibility fields
  eligibilityType?: string;
  eligibilityNumber?: string;
  eligibilityDate?: string;
  educationalBackground?: string;
  yearsOfExperience?: number;
  // Social Media
  facebookUrl?: string;
  linkedinUrl?: string;
  twitterHandle?: string;
  customFields?: CustomField[];
  agencyEmployeeNo?: string;
}

interface DataFieldProps {
  label: string;
  value?: string | number | null;
  icon?: LucideIcon;
  fullWidth?: boolean;
  highlight?: boolean;
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
  icon: LucideIcon;
  columns?: string;
}

interface EmployeeProfileViewProps {
  profile?: Profile;
  loading: boolean;
  error?: string | null;
  onRefresh: () => void;
  isAdmin?: boolean;
  onStatusChange?: (id: number, status: string) => Promise<void>;
}

// Reusable Dense Field Component
const DataField: React.FC<DataFieldProps> = ({ label, value, icon: Icon, fullWidth = false, highlight = false }) => (
  <div className={`flex flex-col border border-gray-200 rounded-md p-2 bg-white ${fullWidth ? 'col-span-full' : ''} ${highlight ? 'border-gray-300 bg-gray-50' : ''}`}>
    <div className="flex items-center gap-1.5 mb-1">
      {Icon && <Icon size={12} className="text-gray-400" />}
      <span className="text-[10px] font-semibold text-gray-500 tracking-wide text-nowrap">{label}</span>
    </div>
    <span className={`text-sm font-bold truncate ${highlight ? 'text-gray-900' : 'text-gray-700'}`}>
      {value || <span className="text-gray-300 font-normal italic">N/A</span>}
    </span>
  </div>
);

// Section Container
const Section: React.FC<SectionProps> = ({ title, children, icon: Icon, columns = "grid-cols-2 md:grid-cols-4 lg:grid-cols-6" }) => (
  <div className="mb-6">
    <div className="flex items-center gap-2 mb-3 px-1">
      <div className="p-1 bg-gray-100 rounded text-gray-800">
        <Icon size={14} />
      </div>
      <h3 className="text-xs font-bold text-gray-800 tracking-tight">{title}</h3>
      <div className="h-px bg-gray-200 flex-grow ml-2"></div>
    </div>
    <div className={`grid ${columns} gap-2`}>
      {children}
    </div>
  </div>
);

const MasterProfileView: React.FC<EmployeeProfileViewProps> = ({ profile, loading, error, onRefresh, isAdmin = false, onStatusChange }) => {
  const [statusLoading, setStatusLoading] = useState(false);

  if (loading) return (
    <div className="p-8 text-center bg-gray-50 rounded-lg border border-gray-200 animate-pulse">
      <div className="h-16 w-16 bg-gray-200 rounded-full mx-auto mb-4"></div>
      <div className="h-4 w-48 bg-gray-200 rounded mx-auto"></div>
    </div>
  );

  if (error || !profile) return (
    <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg flex items-center gap-2">
      <AlertCircle size={18} />
      <span className="text-sm font-bold">Failed to load profile data.</span>
      <button onClick={onRefresh} className="ml-auto text-xs underline">Retry</button>
    </div>
  );

  // Helper to format dates
  const formatDate = (dateStr: string | undefined | null): string | null => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return dateStr;
    }
  };

  // Check if employee has a negative status that can be reverted
  const currentStatus = profile.employmentStatus || 'Active';
  const isNegativeStatus = ['Terminated', 'Suspended', 'Show Cause', 'Verbal Warning', 'Written Warning'].includes(currentStatus);
  const isActive = currentStatus === 'Active';

  // Handle status toggle
  const handleStatusToggle = async () => {
    if (!onStatusChange || statusLoading) return;
    setStatusLoading(true);
    try {
      const newStatus = isActive ? currentStatus : 'Active';
      await onStatusChange(profile.id, newStatus);
    } finally {
      setStatusLoading(false);
    }
  };

  const renderCustomFields = (sectionName: string) => {
    if (!profile.customFields || profile.customFields.length === 0) return null;
    const fieldsInSection = profile.customFields.filter(field => field.section === sectionName);
    return fieldsInSection.map((field, index) => (
      <DataField key={index} label={field.label} value={field.value} icon={field.icon} />
    ));
  };

  return (
    <div className="w-full bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-12">
      
      {/* 1. COMPACT HEADER */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 text-white relative">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="relative group">
            <div className="w-20 h-20 rounded-lg bg-gray-700 border-2 border-white/20 shadow-lg overflow-hidden flex items-center justify-center">
              {profile.avatarUrl || profile.avatar ? (
                <img src={profile.avatarUrl || profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-black text-gray-500">{profile.firstName?.[0]}{profile.lastName?.[0]}</span>
              )}
            </div>
            <div className={`absolute -bottom-2 -right-2 text-white text-[10px] font-bold px-2 py-0.5 rounded border border-gray-800 ${
              isNegativeStatus ? 'bg-red-600' : 'bg-green-600'
            }`}>
              {currentStatus}
            </div>
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl font-bold tracking-tight mb-1">{profile.firstName} {profile.lastName}</h1>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-gray-300 text-xs font-medium">
              <span className="flex items-center gap-1.5 bg-white/10 px-2 py-1 rounded">
                <Briefcase size={12} /> {profile.positionTitle || profile.jobTitle || 'No Title'}
              </span>
              <span className="flex items-center gap-1.5 bg-white/10 px-2 py-1 rounded">
                <Hash size={12} /> {profile.employeeId}
              </span>
              <span className="flex items-center gap-1.5 bg-white/10 px-2 py-1 rounded">
                <Mail size={12} /> {profile.email}
              </span>
            </div>
          </div>

          <div className="hidden md:flex flex-col items-end gap-3">
            <div className="text-right">
              <p className="text-[10px] text-gray-400 font-medium mb-1">Department</p>
              <p className="text-lg font-bold text-white">{profile.department}</p>
            </div>
            
            {/* Admin Status Toggle */}
            {isAdmin && isNegativeStatus && (
              <button
                onClick={handleStatusToggle}
                disabled={statusLoading}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-all border border-white/20"
                title="Click to reactivate employee"
              >
                {statusLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <ToggleLeft size={16} className="text-red-400" />
                )}
                <span className="text-xs font-semibold">Reactivate</span>
              </button>
            )}
            {isAdmin && isActive && (
              <div className="flex items-center gap-2 bg-green-500/20 px-3 py-1.5 rounded-lg border border-green-500/30">
                <ToggleRight size={16} className="text-green-400" />
                <span className="text-xs font-semibold text-green-300">Active</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. DENSE DATA GRID */}
      <div className="p-6">
        
        {/* PERSONAL INFORMATION */}
        <Section title="Personal Information" icon={User}>
          <DataField label="First Name" value={profile.firstName} />
          <DataField label="Last Name" value={profile.lastName} />
          <DataField label="Birth Date" value={formatDate(profile.birthDate)} icon={Calendar} />
          <DataField label="Gender" value={profile.gender} />
          <DataField label="Civil Status" value={profile.civilStatus} />
          <DataField label="Nationality" value={profile.nationality} icon={Flag} />
          <DataField label="Blood Type" value={profile.bloodType} />
          <DataField label="Height (cm)" value={profile.heightCm} icon={Ruler} />
          <DataField label="Weight (kg)" value={profile.weightKg} icon={Scale} />
          <DataField label="Address" value={profile.permanentAddress || profile.address} fullWidth icon={MapPin} />
        </Section>

        {/* EMPLOYMENT RECORD */}
        <Section title="Employment Record" icon={Briefcase}>
          <DataField label="Employee ID" value={profile.employeeId} icon={Hash} highlight />
          <DataField label="Position Title" value={profile.positionTitle || profile.jobTitle} highlight />
          <DataField label="Item Number" value={profile.itemNumber} icon={Hash} />
          <DataField label="Department" value={profile.department} icon={Building} />
          <DataField label="Salary Grade" value={profile.salaryGrade} icon={CreditCard} />
          <DataField label="Step Increment" value={profile.stepIncrement} icon={Hash} />
          <DataField label="Appointment Type" value={profile.appointmentType} />
          <DataField label="Employment Status" value={profile.employmentStatus} />
          <DataField label="Station" value={profile.station} icon={Building} />
          <DataField label="Office Address" value={profile.officeAddress} icon={MapPin} fullWidth />
          <DataField label="Date Hired" value={formatDate(profile.dateHired)} icon={Calendar} />
          <DataField label="First Day of Service" value={formatDate(profile.firstDayOfService)} icon={Clock} />
          <DataField label="System Role" value={profile.role} icon={Shield} />
          {renderCustomFields("Employment Record")}
        </Section>

        {/* GOVERNMENT IDS */}
        <Section title="Government Identification" icon={Shield}>
          <DataField label="GSIS No." value={profile.gsisNumber} />
          <DataField label="PhilHealth No." value={profile.philhealthNumber} />
          <DataField label="Pag-IBIG No." value={profile.pagibigNumber} />
          <DataField label="TIN" value={profile.tinNumber} />
        </Section>

        {/* ELIGIBILITY & QUALIFICATIONS (Plantilla Required) */}
        <Section title="Eligibility & Qualifications" icon={Award}>
          <DataField label="Eligibility Type" value={profile.eligibilityType} />
          <DataField label="Eligibility No." value={profile.eligibilityNumber} icon={Hash} />
          <DataField label="Eligibility Date" value={formatDate(profile.eligibilityDate)} icon={Calendar} />
          <DataField label="Educational Background" value={profile.educationalBackground} icon={GraduationCap} />
          <DataField label="Years of Experience" value={profile.yearsOfExperience} />
        </Section>

         {/* EDUCATION */}
         {profile.education && profile.education.length > 0 && (
          <Section title="Educational Background" icon={GraduationCap} columns="grid-cols-1">
             <div className="border border-gray-200 rounded-md overflow-hidden">
                <table className="w-full text-xs text-left">
                   <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-2">Level</th>
                        <th className="px-4 py-2">School / Institution</th>
                        <th className="px-4 py-2">Degree / Course</th>
                        <th className="px-4 py-2">Year</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100">
                      {profile.education.map((edu, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-2 font-bold text-gray-700">{edu.type || 'N/A'}</td>
                          <td className="px-4 py-2 text-gray-800">{edu.institution}</td>
                          <td className="px-4 py-2 text-gray-900 font-medium">{edu.degree || edu.fieldOfStudy || '-'}</td>
                          <td className="px-4 py-2 text-gray-500">{edu.startDate ? new Date(edu.startDate).getFullYear() : 'N/A'} - {edu.endDate ? new Date(edu.endDate).getFullYear() : 'Present'}</td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </Section>
         )}

         {/* SKILLS */}
         {profile.skills && profile.skills.length > 0 && (
          <Section title="Skills & Competencies" icon={Award} columns="grid-cols-2 md:grid-cols-4">
             {profile.skills.map((skill, idx) => (
                <div key={idx} className="flex items-center justify-between border border-gray-200 rounded p-2 bg-gray-50">
                   <span className="text-xs font-bold text-gray-700">{skill.skillName}</span>
                   <span className="text-[10px] font-medium text-gray-500">{skill.proficiencyLevel || 'N/A'}</span>
                </div>
             ))}
          </Section>
         )}

         {/* CONTACT & EMERGENCY */}
        <Section title="Contact & Emergency" icon={Phone}>
          <DataField label="Mobile Number" value={profile.phoneNumber} icon={Phone} />
          <DataField label="Official Email" value={profile.email} icon={Mail} />
          
          {/* Display primary emergency contact if available in array, else fallback to legacy fields */}
          {profile.emergencyContacts && profile.emergencyContacts.length > 0 ? (
             <>
               <DataField label="Emergency Contact" value={profile.emergencyContacts[0].name} icon={Heart} />
               <DataField label="Relationship" value={profile.emergencyContacts[0].relationship} />
               <DataField label="Emerg. Number" value={profile.emergencyContacts[0].phoneNumber} icon={Phone} />
               {profile.emergencyContacts[0].address && (
                 <DataField label="Emerg. Address" value={profile.emergencyContacts[0].address} icon={MapPin} />
               )}
             </>
          ) : (
             <>
               <DataField label="Emergency Contact" value={profile.emergencyContact} icon={Heart} />
               <DataField label="Emerg. Number" value={profile.emergencyContactNumber} icon={Phone} />
             </>
          )}
        </Section>

        {/* SOCIAL MEDIA */}
        <Section title="Social Media" icon={User} columns="grid-cols-1 md:grid-cols-3">
          <DataField label="Facebook" value={profile.facebookUrl} icon={Facebook} />
          <DataField label="LinkedIn" value={profile.linkedinUrl} icon={Linkedin} />
          <DataField label="Twitter/X" value={profile.twitterHandle ? `@${profile.twitterHandle}` : undefined} icon={Twitter} />
        </Section>

      </div>

      {/* FOOTER */}
      <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-between items-center">
        <p className="text-[10px] text-gray-400 font-medium">
          System Generated Record • NEBR HRIS
        </p>
        <div className="flex gap-2">
            <span className="flex items-center gap-1.5 text-xs font-bold text-gray-700 bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
            <CheckCircle size={12} /> Verified Record
            </span>
        </div>
      </div>

    </div>
  );
};

export default MasterProfileView;
