import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Star, Award } from 'lucide-react';
import { fetchEmployeeSkills, addEmployeeSkill, deleteEmployeeSkill } from '@api/employeeApi';

const ProfileSkills = ({ profile, onUpdate }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newSkill, setNewSkill] = useState({
    skill_name: '',
    category: 'Technical',
    proficiency_level: 'Intermediate',
    years_experience: ''
  });

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await addEmployeeSkill(profile.id, newSkill);
      setIsAdding(false);
      setNewSkill({ skill_name: '', category: 'Technical', proficiency_level: 'Intermediate', years_experience: '' });
      onUpdate();
    } catch (err) {
      // Error handled silently
    }
  };

  const handleDelete = async (skillId) => {
    if (window.confirm("Remove this skill?")) {
      try {
        await deleteEmployeeSkill(profile.id, skillId);
        onUpdate();
      } catch (err) {
        // Error handled silently
      }
    }
  };

  const getProficiencyColor = (level) => {
    switch (level) {
      case 'Beginner': return 'bg-blue-100 text-blue-700';
      case 'Intermediate': return 'bg-green-100 text-green-700';
      case 'Advanced': return 'bg-purple-100 text-purple-700';
      case 'Expert': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getProficiencyWidth = (level) => {
    switch (level) {
      case 'Beginner': return '25%';
      case 'Intermediate': return '50%';
      case 'Advanced': return '75%';
      case 'Expert': return '100%';
      default: return '0%';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center pb-4 border-b border-gray-100">
        <h2 className="text-sm font-black text-gray-700 uppercase tracking-wider">Skills & Competencies</h2>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-xs font-black uppercase border border-gray-300 shadow-sm hover:bg-gray-300 transition-all"
        >
          <Plus size={14} />
          <span>Add Skill</span>
        </button>
      </div>

      {/* Add Form */}
      {isAdding && (
        <form
          onSubmit={handleAdd}
          className="bg-[#F8F9FA] p-4 rounded-xl border border-gray-200 overflow-hidden"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Skill Name</label>
              <input
                type="text"
                required
                value={newSkill.skill_name}
                onChange={(e) => setNewSkill({...newSkill, skill_name: e.target.value})}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-gray-500 outline-none"
                placeholder="e.g. React.js"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Category</label>
              <select
                value={newSkill.category}
                onChange={(e) => setNewSkill({...newSkill, category: e.target.value})}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-gray-500 outline-none bg-white font-bold"
              >
                <option value="Technical">Technical</option>
                <option value="Soft Skill">Soft Skill</option>
                <option value="Language">Language</option>
                <option value="Leadership">Leadership</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Proficiency</label>
              <select
                value={newSkill.proficiency_level}
                onChange={(e) => setNewSkill({...newSkill, proficiency_level: e.target.value})}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-gray-500 outline-none bg-white font-bold"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="Expert">Expert</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
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
              Save Skill
            </button>
          </div>
        </form>
      )}

      {/* Skills Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {profile.skills && profile.skills.map((skill) => (
          <div
            key={skill.id}
            className="bg-white p-4 rounded-xl border border-gray-200 hover:bg-[#F8F9FA] transition-all relative group"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded uppercase">
                {skill.category}
              </span>
              <button
                onClick={() => handleDelete(skill.id)}
                className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={14} />
              </button>
            </div>
            
            <h3 className="text-sm font-bold text-gray-800 uppercase mb-3">{skill.skill_name}</h3>
            
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-wider">
                <span className={getProficiencyColor(skill.proficiency_level).replace('rounded-full', 'rounded')}>
                  {skill.proficiency_level}
                </span>
                {skill.years_experience && (
                  <span className="text-gray-400">{skill.years_experience} years</span>
                )}
              </div>
              <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gray-600 rounded-full"
                  style={{ width: getProficiencyWidth(skill.proficiency_level) }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {(!profile.skills || profile.skills.length === 0) && (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
          <Award className="mx-auto text-gray-300 mb-3" size={48} />
          <p className="text-gray-500 font-medium">No skills added yet</p>
          <p className="text-sm text-gray-400">Add skills to build the employee profile</p>
        </div>
      )}
    </div>
  );
};

export default ProfileSkills;
