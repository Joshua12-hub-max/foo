import React from 'react';
import { User, Briefcase, Phone, Mail, MapPin, Calendar, Building } from 'lucide-react';

const ProfileOverview = ({ profile }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column: Personal Info */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="bg-gray-100 px-6 py-3 border-b border-gray-200">
            <h2 className="text-sm font-black text-gray-700 uppercase tracking-wider">
              Personal Information
            </h2>
          </div>

          <div className="p-0">
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
              <div className="p-4 flex items-center justify-between group hover:bg-[#F8F9FA]">
                <span className="text-[10px] font-black text-gray-400 uppercase">Full Name</span>
                <span className="text-sm font-bold text-gray-800">{profile.first_name} {profile.last_name}</span>
              </div>
              <div className="p-4 flex items-center justify-between group hover:bg-[#F8F9FA]">
                <span className="text-[10px] font-black text-gray-400 uppercase">Email Address</span>
                <span className="text-sm font-bold text-gray-800">{profile.email}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100 border-t border-gray-100">
              <div className="p-4 flex items-center justify-between group hover:bg-[#F8F9FA]">
                <span className="text-[10px] font-black text-gray-400 uppercase">Job Title</span>
                <span className="text-sm font-bold text-gray-800">{profile.job_title || 'N/A'}</span>
              </div>
              <div className="p-4 flex items-center justify-between group hover:bg-[#F8F9FA]">
                <span className="text-[10px] font-black text-gray-400 uppercase">Status</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${getStatusBadgeClass(profile.employment_status)}`}>
                  {profile.employment_status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100 border-t border-gray-100">
              <div className="p-4 flex items-center justify-between group hover:bg-[#F8F9FA]">
                <span className="text-[10px] font-black text-gray-400 uppercase">Date Hired</span>
                <span className="text-sm font-bold text-gray-800">{profile.date_hired ? new Date(profile.date_hired).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div className="p-4 flex items-center justify-between group hover:bg-[#F8F9FA]">
                <span className="text-[10px] font-black text-gray-400 uppercase">Department</span>
                <span className="text-sm font-bold text-gray-800">{profile.department || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Employment History */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="bg-gray-100 px-6 py-3 border-b border-gray-200">
            <h2 className="text-sm font-black text-gray-700 uppercase tracking-wider">
              Employment History
            </h2>
          </div>
          
          <div className="divide-y divide-gray-100">
            {profile.history && profile.history.length > 0 ? (
              profile.history.map((job, index) => (
                <div key={index} className="p-4 hover:bg-[#F8F9FA] transition-colors">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="text-sm font-bold text-gray-800 uppercase">{job.job_title}</h3>
                    <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      {job.company_name}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-gray-400 italic">
                    {new Date(job.start_date).toLocaleDateString()} - {job.is_current ? 'Present' : new Date(job.end_date).toLocaleDateString()}
                  </p>
                  {job.description && <p className="text-xs text-gray-600 mt-2 line-clamp-2">{job.description}</p>}
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-gray-400 text-xs font-bold uppercase tracking-widest">
                No history records found
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Emergency Contacts */}
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="bg-gray-100 px-6 py-3 border-b border-gray-200">
            <h2 className="text-sm font-black text-gray-700 uppercase tracking-wider">
              Emergency Contacts
            </h2>
          </div>

          <div className="divide-y divide-gray-100">
            {profile.contacts && profile.contacts.length > 0 ? (
              profile.contacts.map((contact, index) => (
                <div key={index} className="p-4 hover:bg-[#F8F9FA] transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-sm font-bold text-gray-800 uppercase">{contact.name}</h3>
                      <p className="text-[10px] font-black text-emerald-700 uppercase">{contact.relationship}</p>
                    </div>
                    {contact.is_primary && (
                      <span className="px-2 py-0.5 bg-gray-200 text-gray-700 text-[10px] rounded font-black uppercase shadow-sm">Primary</span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-black text-gray-400 uppercase text-[9px]">Contact</span>
                      <span className="font-bold text-gray-700">{contact.phone_number}</span>
                    </div>
                    {contact.email && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-black text-gray-400 uppercase text-[9px]">Email</span>
                        <span className="font-bold text-gray-700">{contact.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-gray-400 text-xs font-bold uppercase tracking-widest">
                No contacts listed
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const getStatusBadgeClass = (status) => {
  switch (status) {
    case 'Active': return 'bg-green-100 text-green-700';
    case 'Inactive': return 'bg-gray-100 text-gray-600';
    case 'Terminated': return 'bg-red-100 text-red-700';
    case 'Resigned': return 'bg-amber-100 text-amber-700';
    default: return 'bg-gray-100 text-gray-600';
  }
};

export default ProfileOverview;
