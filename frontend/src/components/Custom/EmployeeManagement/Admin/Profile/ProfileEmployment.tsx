import React from 'react';
import { DollarSign, Briefcase, User, Calendar, FileText } from 'lucide-react';

interface Profile {
  salary?: number;
  jobTitle?: string;
  dateHired?: string;
  employmentStatus?: string;
  department?: string;
}

interface ProfileEmploymentProps {
  profile: Profile;
}

const ProfileEmployment: React.FC<ProfileEmploymentProps> = ({ profile }) => {
  const formatCurrency = (amount: number | undefined): string => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount || 0);
  };

  const calculateServiceLength = (dateHired: string | undefined): string => {
    if (!dateHired) return 'N/A';
    const start = new Date(dateHired);
    const now = new Date();
    const years = now.getFullYear() - start.getFullYear();
    const months = now.getMonth() - start.getMonth();
    
    if (years > 0) return `${years} Year${years > 1 ? 's' : ''}`;
    if (months > 0) return `${months} Month${months > 1 ? 's' : ''}`;
    return 'Less than a month';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 text-gray-800 font-bold text-lg">
        <Briefcase size={20} />
        <h2>Employment Information</h2>
      </div>
      <p className="text-gray-500 text-sm -mt-4">Detailed employment and compensation information</p>

      {/* Info Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Salary */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 text-green-600 mb-2">
                <DollarSign size={18} />
                <span className="text-sm font-medium">Annual Salary</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{formatCurrency(profile.salary || 68000)}</p>
        </div>

        {/* Position */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 text-blue-600 mb-2">
                <Briefcase size={18} />
                <span className="text-sm font-medium">Position</span>
            </div>
            <p className="text-xl font-bold text-gray-800">{profile.jobTitle || 'N/A'}</p>
        </div>

        {/* Department */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 text-purple-600 mb-2">
                <Briefcase size={18} />
                <span className="text-sm font-medium">Department</span>
            </div>
            <p className="text-xl font-bold text-gray-800">{profile.department || 'N/A'}</p>
        </div>

        {/* Employment Length */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 text-orange-600 mb-2">
                <Calendar size={18} />
                <span className="text-sm font-medium">Employment Length</span>
            </div>
            <p className="text-xl font-bold text-gray-800">{calculateServiceLength(profile.dateHired)}</p>
        </div>
      </div>

      {/* Employment Status Section */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center gap-2 text-gray-800 font-bold text-lg">
            <FileText size={20} />
            <h2>Employment Status</h2>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
            <div>
                <p className="text-sm text-gray-500 mb-1">Current Status</p>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    profile.employmentStatus === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                    {profile.employmentStatus}
                </span>
            </div>
            <div className="text-right">
                <p className="text-sm text-gray-500 mb-1">Department</p>
                <p className="font-medium text-gray-800">{profile.department}</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileEmployment;
