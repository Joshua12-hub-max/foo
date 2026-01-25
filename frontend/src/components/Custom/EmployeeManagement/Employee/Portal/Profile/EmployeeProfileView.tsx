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
  field_of_study?: string;
  start_date?: string;
  end_date?: string;
}

interface Skill {
  skill_name: string;
  proficiency_level?: string;
}

interface EmergencyContact {
  name: string;
  relationship: string;
  phone_number: string;
  address?: string;
}

interface Profile {
  id: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  avatar_url?: string;
  avatar?: string;
  position_title?: string;
  job_title?: string;
  jobTitle?: string;
  employee_id?: string;
  employeeId?: string;
  department?: string;
  employment_status?: string;
  employmentStatus?: string;
  birth_date?: string;
  gender?: string;
  civil_status?: string;
  nationality?: string;
  blood_type?: string;
  height_cm?: string;
  weight_kg?: string;
  permanent_address?: string;
  address?: string;
  item_number?: string;
  itemNumber?: string;
  salary_grade?: string;
  salaryGrade?: string;
  step_increment?: string | number;
  stepIncrement?: string | number;
  appointment_type?: string;
  station?: string;
  office_address?: string;
  date_hired?: string;
  dateHired?: string;
  first_day_of_service?: string;
  supervisor?: string;
  role?: string;
  gsis_number?: string;
  philhealth_number?: string;
  pagibig_number?: string;
  tin_number?: string;
  phone_number?: string;
  emergency_contact?: string;
  emergency_contact_number?: string;
  education?: Education[];
  skills?: Skill[];
  emergencyContacts?: EmergencyContact[];
  // Plantilla-required eligibility fields
  eligibility_type?: string;
  eligibility_number?: string;
  eligibility_date?: string;
  highest_education?: string;
  years_of_experience?: number;
  // Social Media
  facebook_url?: string;
  linkedin_url?: string;
  twitter_handle?: string;
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
  const currentStatus = profile.employment_status || profile.employmentStatus || 'Active';
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

  return (
    <div className="w-full bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-12">
      
      {/* 1. COMPACT HEADER */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 text-white relative">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="relative group">
            <div className="w-20 h-20 rounded-lg bg-gray-700 border-2 border-white/20 shadow-lg overflow-hidden flex items-center justify-center">
              {profile.avatar_url || profile.avatar ? (
                <img src={profile.avatar_url || profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-black text-gray-500">{profile.first_name?.[0]}{profile.last_name?.[0]}</span>
              )}
            </div>
            <div className={`absolute -bottom-2 -right-2 text-white text-[10px] font-bold px-2 py-0.5 rounded border border-gray-800 ${
              isNegativeStatus ? 'bg-red-600' : 'bg-green-600'
            }`}>
              {currentStatus}
            </div>
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl font-bold tracking-tight mb-1">{profile.first_name} {profile.last_name}</h1>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-gray-300 text-xs font-medium">
              <span className="flex items-center gap-1.5 bg-white/10 px-2 py-1 rounded">
                <Briefcase size={12} /> {profile.position_title || profile.job_title || profile.jobTitle || 'No Title'}
              </span>
              <span className="flex items-center gap-1.5 bg-white/10 px-2 py-1 rounded">
                <Hash size={12} /> {profile.employee_id || profile.employeeId}
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
          <DataField label="First Name" value={profile.first_name} />
          <DataField label="Last Name" value={profile.last_name} />
          <DataField label="Birth Date" value={formatDate(profile.birth_date)} icon={Calendar} />
          <DataField label="Gender" value={profile.gender} />
          <DataField label="Civil Status" value={profile.civil_status} />
          <DataField label="Nationality" value={profile.nationality} icon={Flag} />
          <DataField label="Blood Type" value={profile.blood_type} />
          <DataField label="Height (cm)" value={profile.height_cm} icon={Ruler} />
          <DataField label="Weight (kg)" value={profile.weight_kg} icon={Scale} />
          <DataField label="Address" value={profile.permanent_address || profile.address} fullWidth icon={MapPin} />
        </Section>

        {/* EMPLOYMENT RECORD */}
        <Section title="Employment Record" icon={Briefcase}>
          <DataField label="Employee ID" value={profile.employee_id || profile.employeeId} icon={Hash} highlight />
          <DataField label="Position Title" value={profile.position_title || profile.job_title} highlight />
          <DataField label="Item Number" value={profile.item_number || profile.itemNumber} icon={Hash} />
          <DataField label="Department" value={profile.department} icon={Building} />
          <DataField label="Salary Grade" value={profile.salary_grade || profile.salaryGrade} icon={CreditCard} />
          <DataField label="Step Increment" value={profile.step_increment || profile.stepIncrement} icon={Hash} />
          <DataField label="Appointment Type" value={profile.appointment_type} />
          <DataField label="Employment Status" value={profile.employment_status || profile.employmentStatus} />
          <DataField label="Station" value={profile.station} icon={Building} />
          <DataField label="Office Address" value={profile.office_address} icon={MapPin} />
          <DataField label="Date Hired" value={formatDate(profile.date_hired || profile.dateHired)} icon={Calendar} />
          <DataField label="First Day of Service" value={formatDate(profile.first_day_of_service)} icon={Clock} />
          <DataField label="Supervisor" value={profile.supervisor} icon={UserCheck} />
          <DataField label="System Role" value={profile.role} icon={Shield} />
        </Section>

        {/* GOVERNMENT IDS */}
        <Section title="Government Identification" icon={Shield}>
          <DataField label="GSIS No." value={profile.gsis_number} />
          <DataField label="PhilHealth No." value={profile.philhealth_number} />
          <DataField label="Pag-IBIG No." value={profile.pagibig_number} />
          <DataField label="TIN" value={profile.tin_number} />
        </Section>

        {/* ELIGIBILITY & QUALIFICATIONS (Plantilla Required) */}
        <Section title="Eligibility & Qualifications" icon={Award}>
          <DataField label="Eligibility Type" value={profile.eligibility_type} />
          <DataField label="Eligibility No." value={profile.eligibility_number} icon={Hash} />
          <DataField label="Eligibility Date" value={formatDate(profile.eligibility_date)} icon={Calendar} />
          <DataField label="Highest Education" value={profile.highest_education} icon={GraduationCap} />
          <DataField label="Years of Experience" value={profile.years_of_experience} />
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
                          <td className="px-4 py-2 text-gray-900 font-medium">{edu.degree || edu.field_of_study || '-'}</td>
                          <td className="px-4 py-2 text-gray-500">{edu.start_date ? new Date(edu.start_date).getFullYear() : 'N/A'} - {edu.end_date ? new Date(edu.end_date).getFullYear() : 'Present'}</td>
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
                   <span className="text-xs font-bold text-gray-700">{skill.skill_name}</span>
                   <span className="text-[10px] font-medium text-gray-500">{skill.proficiency_level || 'N/A'}</span>
                </div>
             ))}
          </Section>
         )}

         {/* CONTACT & EMERGENCY */}
        <Section title="Contact & Emergency" icon={Phone}>
          <DataField label="Mobile Number" value={profile.phone_number} icon={Phone} />
          <DataField label="Official Email" value={profile.email} icon={Mail} />
          
          {/* Display primary emergency contact if available in array, else fallback to legacy fields */}
          {profile.emergencyContacts && profile.emergencyContacts.length > 0 ? (
             <>
               <DataField label="Emergency Contact" value={profile.emergencyContacts[0].name} icon={Heart} />
               <DataField label="Relationship" value={profile.emergencyContacts[0].relationship} />
               <DataField label="Emerg. Number" value={profile.emergencyContacts[0].phone_number} icon={Phone} />
               {profile.emergencyContacts[0].address && (
                 <DataField label="Emerg. Address" value={profile.emergencyContacts[0].address} icon={MapPin} />
               )}
             </>
          ) : (
             <>
               <DataField label="Emergency Contact" value={profile.emergency_contact} icon={Heart} />
               <DataField label="Emerg. Number" value={profile.emergency_contact_number} icon={Phone} />
             </>
          )}
        </Section>

        {/* SOCIAL MEDIA */}
        <Section title="Social Media" icon={User} columns="grid-cols-1 md:grid-cols-3">
          <DataField label="Facebook" value={profile.facebook_url} icon={Facebook} />
          <DataField label="LinkedIn" value={profile.linkedin_url} icon={Linkedin} />
          <DataField label="Twitter/X" value={profile.twitter_handle ? `@${profile.twitter_handle}` : undefined} icon={Twitter} />
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
