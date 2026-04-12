import React from 'react';
import { 
  Briefcase, Hash, Mail, Clock, Loader2, ToggleLeft, ToggleRight 
} from 'lucide-react';
import { formatEmployeeId } from '@/utils/formatters';
import { EmployeeDetailed } from '@/types';

interface ProfileHeaderProps {
  profile: EmployeeDetailed;
  isAdmin?: boolean;
  onStatusToggle?: () => void;
  statusLoading?: boolean;
}

const calculateAge = (birthDate: string | undefined | null): number | null => {
  if (!birthDate) return null;
  try {
    const birth = new Date(birthDate);
    const today = new Date();
    if (isNaN(birth.getTime())) return null;
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  } catch {
    return null;
  }
};

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ 
  profile, 
  isAdmin = false, 
  onStatusToggle, 
  statusLoading = false 
}) => {
  const currentStatus = profile.employmentStatus || 'Active';
  const isNegativeStatus = ['Terminated', 'Suspended', 'Show Cause', 'Verbal Warning', 'Written Warning'].includes(currentStatus);
  const isActive = currentStatus === 'Active';

  return (
    <div className="bg-[#FAFAFA] p-8 text-[var(--zed-text-dark)] relative rounded-t-[var(--radius-lg)] shadow-sm overflow-hidden border border-[var(--zed-border-light)] border-b-0">
      {/* Background Decorative Pattern */}
      <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_top_right,black_1px,transparent_1px)] bg-[size:20px_20px]" />
      
      <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-white border-2 border-gray-100 shadow-md overflow-hidden flex items-center justify-center transition-transform hover:scale-105 duration-300">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-black text-gray-300">{profile.firstName?.[0]}{profile.lastName?.[0]}</span>
            )}
          </div>
          <div className={`absolute -bottom-1 -right-1 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-sm ${isNegativeStatus ? 'bg-red-500' : 'bg-emerald-500'}`}>
            {currentStatus}
          </div>
        </div>
        
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-3xl font-black tracking-tight mb-2 flex items-center justify-center md:justify-start gap-3">
            <span className="text-black">
              {profile.lastName ? profile.lastName + ', ' : ''}
              {profile.firstName} 
              {profile.middleName ? ' ' + profile.middleName : ''}
              {profile.suffix ? ' ' + profile.suffix : ''}
            </span>
            {calculateAge(profile.birthDate)! >= 60 && (
              <span className="text-[9px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full tracking-widest font-black border border-amber-200 shadow-sm">
                Senior
              </span>
            )}
          </h1>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
            <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-bold border border-gray-200 shadow-sm text-gray-600">
              <Briefcase size={12} className="text-gray-400" /> {profile.positionTitle || 'No Title'}
            </span>
            <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-bold border border-gray-200 shadow-sm text-gray-600">
              <Hash size={12} className="text-gray-400" /> {formatEmployeeId(profile.employeeId)}
            </span>
            <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-bold border border-gray-200 shadow-sm text-gray-600">
              <Mail size={12} className="text-gray-400" /> {profile.email}
            </span>
            <span className="flex items-center gap-1.5 bg-black text-white px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-black shadow-sm">
              <Clock size={12} /> {profile.dutyType || 'Standard'} | {profile.appointmentType || 'Schedule'}
            </span>
          </div>
        </div>

        <div className="hidden lg:flex flex-col items-end gap-2 bg-white/50 backdrop-blur-md p-4 rounded-[var(--radius-lg)] border border-gray-200 min-w-[240px]">
          <div className="text-right w-full">
            <p className="text-[10px] text-gray-400 font-bold tracking-[0.2em] mb-1 uppercase">Primary Department</p>
            <p className="text-base font-black text-black leading-tight">{profile.department}</p>
          </div>
          
          <div className="h-px bg-gray-200 w-full my-1" />

          {isAdmin && isNegativeStatus && (
            <button onClick={onStatusToggle} disabled={statusLoading}
              className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-50 px-4 py-2 rounded-[var(--radius-md)] transition-all border border-gray-200 text-gray-700 shadow-sm"
              title="Click to reactivate employee">
              {statusLoading ? <Loader2 size={16} className="animate-spin" /> : <ToggleLeft size={16} className="text-red-500" />}
              <span className="text-xs font-bold">Reactivate</span>
            </button>
          )}
          {isAdmin && isActive && (
            <div className="w-full flex items-center justify-center gap-2 bg-emerald-50 px-4 py-2 rounded-[var(--radius-md)] border border-emerald-100">
              <ToggleRight size={16} className="text-emerald-500" />
              <span className="text-xs font-black text-emerald-700">Status Active</span>
            </div>
          )}
          {!isAdmin && (
             <div className="w-full flex items-center justify-between text-[10px] font-bold text-gray-500">
                <span className="flex items-center gap-1"><Clock size={10} /> Shift</span>
                <span className="text-black">{profile.shift || profile.duties || 'Standard'}</span>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
