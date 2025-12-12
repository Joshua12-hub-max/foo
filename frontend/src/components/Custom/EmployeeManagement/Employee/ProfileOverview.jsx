import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Briefcase, Phone, Mail, MapPin, Calendar, Edit2, Save, X } from 'lucide-react';
import { updatePersonalInfo, addContact, deleteContact } from '../../../api/employeeApi';
import ConfirmDialog from '../../Shared/ConfirmDialog';

const ProfileOverview = ({ profile, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    job_title: profile.job_title || '',
    department: profile.department || '',
    employment_status: profile.employment_status || 'Active',
    date_hired: profile.date_hired ? profile.date_hired.split('T')[0] : '',
    manager_id: profile.manager_id || ''
  });

  const handleSave = async () => {
    try {
      await updatePersonalInfo(profile.id, formData);
      setIsEditing(false);
      onUpdate();
    } catch (err) {
      // Error handled silently
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column: Personal Info */}
      <div className="lg:col-span-2 space-y-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <User size={20} className="text-green-600" />
              Personal Information
            </h2>
            {!isEditing ? (
              <button 
                onClick={() => setIsEditing(true)}
                className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              >
                <Edit2 size={18} />
              </button>
            ) : (
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsEditing(false)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
                <button 
                  onClick={handleSave}
                  className="p-2 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                >
                  <Save size={18} />
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoItem label="Full Name" value={`${profile.first_name} ${profile.last_name}`} icon={User} />
            <InfoItem label="Email Address" value={profile.email} icon={Mail} />
            
            {isEditing ? (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Job Title</label>
                <input 
                  type="text" 
                  value={formData.job_title}
                  onChange={(e) => setFormData({...formData, job_title: e.target.value})}
                  className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            ) : (
              <InfoItem label="Job Title" value={profile.job_title} icon={Briefcase} />
            )}

            {isEditing ? (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Status</label>
                <select 
                  value={formData.employment_status}
                  onChange={(e) => setFormData({...formData, employment_status: e.target.value})}
                  className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-green-500 bg-white"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Terminated">Terminated</option>
                  <option value="Resigned">Resigned</option>
                </select>
              </div>
            ) : (
              <InfoItem label="Employment Status" value={profile.employment_status} icon={Activity} />
            )}

            {isEditing ? (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Date Hired</label>
                <input 
                  type="date" 
                  value={formData.date_hired}
                  onChange={(e) => setFormData({...formData, date_hired: e.target.value})}
                  className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            ) : (
              <InfoItem label="Date Hired" value={profile.date_hired ? new Date(profile.date_hired).toLocaleDateString() : 'N/A'} icon={Calendar} />
            )}
            
            <InfoItem label="Department" value={profile.department} icon={Briefcase} />
          </div>
        </motion.div>

        {/* Employment History */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
        >
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Briefcase size={20} className="text-green-600" />
            Employment History
          </h2>
          
          <div className="relative border-l-2 border-gray-100 ml-3 space-y-8">
            {profile.history && profile.history.length > 0 ? (
              profile.history.map((job, index) => (
                <div key={index} className="relative pl-8">
                  <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-green-100 border-2 border-green-500"></div>
                  <h3 className="font-bold text-gray-800">{job.job_title}</h3>
                  <p className="text-green-600 font-medium text-sm">{job.company_name}</p>
                  <p className="text-gray-400 text-xs mt-1">
                    {new Date(job.start_date).toLocaleDateString()} - {job.is_current ? 'Present' : new Date(job.end_date).toLocaleDateString()}
                  </p>
                  {job.description && <p className="text-gray-600 text-sm mt-2">{job.description}</p>}
                </div>
              ))
            ) : (
              <div className="pl-8 text-gray-500 italic">No employment history recorded.</div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Right Column: Emergency Contacts */}
      <div className="space-y-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Phone size={20} className="text-green-600" />
              Emergency Contacts
            </h2>
            {/* Add Contact Button could go here */}
          </div>

          <div className="space-y-4">
            {profile.contacts && profile.contacts.length > 0 ? (
              profile.contacts.map((contact, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-gray-800">{contact.name}</h3>
                      <p className="text-xs text-gray-500 uppercase font-semibold">{contact.relationship}</p>
                    </div>
                    {contact.is_primary && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">Primary</span>
                    )}
                  </div>
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone size={14} className="text-gray-400" />
                      <span>{contact.phone_number}</span>
                    </div>
                    {contact.email && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail size={14} className="text-gray-400" />
                        <span>{contact.email}</span>
                      </div>
                    )}
                    {contact.address && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin size={14} className="text-gray-400" />
                        <span>{contact.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No emergency contacts added.</p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const InfoItem = ({ label, value, icon: Icon }) => (
  <div className="flex items-start gap-3">
    <div className="p-2 bg-gray-50 rounded-lg text-gray-400">
      <Icon size={18} />
    </div>
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-gray-800 font-medium mt-0.5">{value || 'N/A'}</p>
    </div>
  </div>
);

export default ProfileOverview;
