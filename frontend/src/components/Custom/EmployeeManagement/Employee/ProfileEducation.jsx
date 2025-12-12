import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, BookOpen, Calendar, GraduationCap } from 'lucide-react';
import { addEducation, deleteEducation } from '../../../../api/employeeApi';

const ProfileEducation = ({ profile, onUpdate }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    institution: '',
    degree: '',
    field_of_study: '',
    start_date: '',
    end_date: '',
    is_current: false,
    type: 'Education'
  });

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await addEducation(profile.id, formData);
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

  const handleDelete = async (id) => {
    if (window.confirm("Remove this record?")) {
      try {
        await deleteEducation(profile.id, id);
        onUpdate();
      } catch (err) {
        // Error handled silently
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Education & Certifications</h2>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus size={18} />
          <span>Add Record</span>
        </button>
      </div>

      {/* Add Form */}
      <AnimatePresence>
        {isAdding && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleAdd}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Institution / Issuer</label>
                <input
                  type="text"
                  required
                  value={formData.institution}
                  onChange={(e) => setFormData({...formData, institution: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Degree / Certificate Name</label>
                <input
                  type="text"
                  required
                  value={formData.degree}
                  onChange={(e) => setFormData({...formData, degree: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Field of Study</label>
                <input
                  type="text"
                  value={formData.field_of_study}
                  onChange={(e) => setFormData({...formData, field_of_study: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                  disabled={formData.is_current}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none disabled:bg-gray-100"
                />
              </div>
              <div className="md:col-span-2 flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_current}
                    onChange={(e) => setFormData({...formData, is_current: e.target.checked})}
                    className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">Currently studying here</span>
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white text-sm"
                >
                  <option value="Education">Education</option>
                  <option value="Certification">Certification</option>
                  <option value="Training">Training</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Save Record
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Timeline */}
      <div className="relative border-l-2 border-gray-200 ml-3 space-y-8 py-2">
        {profile.education && profile.education.length > 0 ? (
          profile.education.map((edu) => (
            <motion.div 
              key={edu.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="relative pl-8 group"
            >
              <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 ${
                edu.type === 'Certification' ? 'bg-blue-100 border-blue-500' : 'bg-green-100 border-green-500'
              }`}></div>
              
              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${
                      edu.type === 'Certification' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'
                    }`}>
                      <GraduationCap size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 text-lg">{edu.institution}</h3>
                      <p className="text-gray-600 font-medium">{edu.degree}</p>
                      {edu.field_of_study && (
                        <p className="text-sm text-gray-500 mt-1">{edu.field_of_study}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-xs text-gray-400 font-medium uppercase tracking-wide">
                        <Calendar size={12} />
                        <span>
                          {edu.start_date ? new Date(edu.start_date).getFullYear() : 'N/A'} - 
                          {edu.is_current ? 'Present' : (edu.end_date ? new Date(edu.end_date).getFullYear() : 'N/A')}
                        </span>
                        <span className="px-1">•</span>
                        <span>{edu.type}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(edu.id)}
                    className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="pl-8 text-gray-500 italic">No education records found.</div>
        )}
      </div>
    </div>
  );
};

export default ProfileEducation;
