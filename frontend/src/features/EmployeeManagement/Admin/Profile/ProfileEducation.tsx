import React, { useState, FormEvent, ChangeEvent } from 'react';
import { Plus, Trash2 } from 'lucide-react';
// @ts-ignore
import { addEmployeeEducation, deleteEmployeeEducation } from '@api/employeeApi';

interface Education {
  id: number;
  institution: string;
  degree: string;
  field_of_study?: string;
  start_date?: string;
  end_date?: string;
  is_current?: boolean;
  type: string;
}

interface Profile {
  id: number;
  education?: Education[];
}

interface ProfileEducationProps {
  profile: Profile;
  onUpdate: () => void;
}

interface FormData {
  institution: string;
  degree: string;
  field_of_study: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  type: string;
}

const ProfileEducation: React.FC<ProfileEducationProps> = ({ profile, onUpdate }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    institution: '',
    degree: '',
    field_of_study: '',
    start_date: '',
    end_date: '',
    is_current: false,
    type: 'Education'
  });

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await addEmployeeEducation(profile.id, formData);
      setIsAdding(false);
      setFormData({
        institution: '',
        degree: '',
        field_of_study: '',
        start_date: '',
        end_date: '',
        is_current: false,
        type: 'Education'
      });
      onUpdate();
    } catch (err) {
      // Error handled silently
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Remove this record?")) {
      try {
        await deleteEmployeeEducation(profile.id, id);
        onUpdate();
      } catch (err) {
        // Error handled silently
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center pb-4 border-b border-gray-100">
        <h2 className="text-sm font-black text-gray-700 uppercase tracking-wider">Education & Certifications</h2>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-xs font-black uppercase border border-gray-300 shadow-sm hover:bg-gray-300 transition-all"
        >
          <Plus size={14} />
          <span>Add Record</span>
        </button>
      </div>

      {/* Add Form */}
      {isAdding && (
        <form
          onSubmit={handleAdd}
          className="bg-[#F8F9FA] p-4 rounded-xl border border-gray-200 overflow-hidden"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Institution / Issuer</label>
              <input
                type="text"
                required
                value={formData.institution}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({...formData, institution: e.target.value})}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-gray-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Degree / Certificate Name</label>
              <input
                type="text"
                required
                value={formData.degree}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({...formData, degree: e.target.value})}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-gray-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Field of Study</label>
              <input
                type="text"
                value={formData.field_of_study}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({...formData, field_of_study: e.target.value})}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-gray-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Start Date</label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({...formData, start_date: e.target.value})}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-gray-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">End Date</label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({...formData, end_date: e.target.value})}
                disabled={formData.is_current}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-gray-500 outline-none disabled:bg-gray-100"
              />
            </div>
            <div className="md:col-span-2 flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_current}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({...formData, is_current: e.target.checked})}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-gray-500"
                />
                <span className="text-xs font-bold text-gray-700 uppercase">Currently studying here</span>
              </label>
              <div className="flex-grow">
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Type</label>
                <select
                  value={formData.type}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => setFormData({...formData, type: e.target.value})}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-gray-500 outline-none bg-white font-bold"
                >
                  <option value="Education">Education</option>
                  <option value="Certification">Certification</option>
                  <option value="Training">Training</option>
                </select>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 text-[10px] font-black uppercase text-gray-500 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-gray-900 text-white rounded text-[10px] font-black uppercase shadow-sm hover:bg-gray-800"
            >
              Save Record
            </button>
          </div>
        </form>
      )}

      <div className="divide-y divide-gray-100">
        {profile.education && profile.education.length > 0 ? (
          profile.education.map((edu) => (
            <div 
              key={edu.id}
              className="py-4 flex justify-between items-start group hover:bg-[#F8F9FA] px-4 -mx-4 rounded-xl transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-tight">{edu.institution}</h3>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                      edu.type === 'Certification' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'
                    }`}>
                      {edu.type}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-gray-600">{edu.degree}</p>
                  {edu.field_of_study && (
                    <p className="text-[10px] text-gray-400 font-semibold">{edu.field_of_study}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                    <span>
                      {edu.start_date ? new Date(edu.start_date).getFullYear() : 'N/A'} - 
                      {edu.is_current ? 'Present' : (edu.end_date ? new Date(edu.end_date).getFullYear() : 'N/A')}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleDelete(edu.id)}
                className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        ) : (
          <div className="py-8 text-center text-gray-400 text-xs font-bold uppercase tracking-widest">
            No education records found
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileEducation;
