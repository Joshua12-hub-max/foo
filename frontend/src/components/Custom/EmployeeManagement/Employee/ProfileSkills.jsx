import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Star, Award } from 'lucide-react';
import { addSkill, deleteSkill } from '../../../../api/employeeApi';

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
      await addSkill(profile.id, newSkill);
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
        await deleteSkill(profile.id, skillId);
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
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Skills & Competencies</h2>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus size={18} />
          <span>Add Skill</span>
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Skill Name</label>
                <input
                  type="text"
                  required
                  value={newSkill.skill_name}
                  onChange={(e) => setNewSkill({...newSkill, skill_name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="e.g. React.js, Project Management"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={newSkill.category}
                  onChange={(e) => setNewSkill({...newSkill, category: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white"
                >
                  <option value="Technical">Technical</option>
                  <option value="Soft Skill">Soft Skill</option>
                  <option value="Language">Language</option>
                  <option value="Leadership">Leadership</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Proficiency</label>
                <select
                  value={newSkill.proficiency_level}
                  onChange={(e) => setNewSkill({...newSkill, proficiency_level: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="Expert">Expert</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
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
                Save Skill
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Skills Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {profile.skills && profile.skills.map((skill) => (
          <motion.div
            key={skill.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative group"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="p-2 bg-gray-50 rounded-lg text-green-600">
                <Award size={20} />
              </div>
              <button
                onClick={() => handleDelete(skill.id)}
                className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={18} />
              </button>
            </div>
            
            <h3 className="font-bold text-gray-800 mb-1">{skill.skill_name}</h3>
            <p className="text-sm text-gray-500 mb-4">{skill.category}</p>
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium">
                <span className={`px-2 py-0.5 rounded-full ${getProficiencyColor(skill.proficiency_level)}`}>
                  {skill.proficiency_level}
                </span>
                {skill.years_experience && (
                  <span className="text-gray-500">{skill.years_experience} years</span>
                )}
              </div>
              <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 rounded-full"
                  style={{ width: getProficiencyWidth(skill.proficiency_level) }}
                ></div>
              </div>
            </div>
          </motion.div>
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
