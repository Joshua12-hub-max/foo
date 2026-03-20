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
    <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 text-white relative rounded-t-xl">
      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="relative">
          <div className="w-20 h-20 rounded-lg bg-gray-700 border-2 border-white/20 shadow-lg overflow-hidden flex items-center justify-center">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-black text-gray-500">{profile.firstName?.[0]}{profile.lastName?.[0]}</span>
            )}
          </div>
          <div className={`absolute -bottom-2 -right-2 text-white text-[10px] font-bold px-2 py-0.5 rounded border border-gray-800 ${isNegativeStatus ? 'bg-red-600' : 'bg-green-600'}`}>
            {currentStatus}
          </div>
        </div>
        
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-2xl font-bold tracking-tight mb-1">
            {profile.lastName ? profile.lastName + ', ' : ''}
            {profile.firstName} 
            {profile.middleName ? ' ' + profile.middleName : ''}
            {profile.suffix ? ' ' + profile.suffix : ''}
            {calculateAge(profile.birthDate)! >= 60 && (
              <span className="ml-3 text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded-full uppercase tracking-tighter align-middle font-black shadow-sm border border-amber-400/50">
                Senior Citizen
              </span>
            )}
          </h1>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-gray-300 text-xs font-medium">
            <span className="flex items-center gap-1.5 bg-white/10 px-2 py-1 rounded">
              <Briefcase size={12} /> {profile.positionTitle || 'No Title'}
            </span>
            <span className="flex items-center gap-1.5 bg-white/10 px-2 py-1 rounded">
              <Hash size={12} /> {formatEmployeeId(profile.employeeId)}
            </span>
            <span className="flex items-center gap-1.5 bg-white/10 px-2 py-1 rounded">
              <Mail size={12} /> {profile.email}
            </span>
            <span className="flex items-center gap-1.5 bg-blue-500/20 text-blue-200 px-2 py-1 rounded border border-blue-500/30">
              <Clock size={12} /> {profile.dutyType || 'Standard'} | {profile.appointmentType || 'No Schedule'}
            </span>
            <span className="inline-flex items-center gap-1.5 bg-gray-800/80 px-2.5 py-1 rounded border border-gray-700 text-xs font-medium text-blue-200 shadow-sm">
              <Clock size={12} className="text-blue-400" />
              {profile.shift || profile.duties || '-'}
            </span>
          </div>
        </div>

        <div className="hidden md:flex flex-col items-end gap-3">
          <div className="text-right">
            <p className="text-[10px] text-gray-400 font-medium mb-1">Department</p>
            <p className="text-lg font-bold text-white max-w-[300px] leading-tight mb-1.5">{profile.department}</p>
          </div>
          
          {isAdmin && isNegativeStatus && (
            <button onClick={onStatusToggle} disabled={statusLoading}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-all border border-white/20"
              title="Click to reactivate employee">
              {statusLoading ? <Loader2 size={16} className="animate-spin" /> : <ToggleLeft size={16} className="text-red-400" />}
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
  );
};

export default ProfileHeader;
