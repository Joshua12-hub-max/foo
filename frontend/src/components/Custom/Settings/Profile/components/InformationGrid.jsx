import { Mail, Building, Briefcase, IdCard, Calendar, Shield, UserCircle } from 'lucide-react';
import InfoItem from './InfoItem';
import EmploymentStatusBadge from '@components/Custom/Common/EmploymentStatusBadge';

const InformationGrid = ({ profile, user, isEditing, formData, handleChange, setIsEditing }) => {
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
    </div>
  );
};

export default InformationGrid;
