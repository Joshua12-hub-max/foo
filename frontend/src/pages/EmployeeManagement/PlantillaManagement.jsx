import React, { useState, useEffect } from 'react';
import { plantillaApi } from '../../api/plantillaApi';
import { fetchEmployeeOptions } from '../../api/employeeApi';
import { Plus, Edit, Trash2, Search } from 'lucide-react';

const PlantillaManagement = () => {
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [departments, setDepartments] = useState([]);
  
  // Filter state
  const [selectedDept, setSelectedDept] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [currentPosition, setCurrentPosition] = useState(null);
  const [formData, setFormData] = useState({
    item_number: '',
    position_title: '',
    salary_grade: '',
    step_increment: 1,
    department: '',
    is_vacant: true
  });

  useEffect(() => {
    fetchData();
    loadDepartments();
  }, [selectedDept]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await plantillaApi.getPositions({ 
        department: selectedDept !== 'All' ? selectedDept : undefined 
      });
      setPositions(response.data.positions);
      setError(null);
    } catch (err) {
      setError('Failed to load plantilla positions.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadDepartments = async () => {
    try {
      const options = await fetchEmployeeOptions();
      if (options.success) {
        setDepartments(options.departments);
      }
    } catch (err) {
      console.error("Failed to load departments", err);
    }
  };

  const handleOpenCreate = () => {
    setModalMode('create');
    setFormData({
      item_number: '',
      position_title: '',
      salary_grade: '',
      step_increment: 1,
      department: departments[0] || '',
      is_vacant: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (position) => {
    setModalMode('edit');
    setCurrentPosition(position);
    setFormData({
      item_number: position.item_number,
      position_title: position.position_title,
      salary_grade: position.salary_grade,
      step_increment: position.step_increment,
      department: position.department || '',
      is_vacant: position.is_vacant === 1
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this position?")) return;
    try {
      await plantillaApi.deletePosition(id);
      fetchData();
    } catch (err) {
      alert("Failed to delete position");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === 'create') {
        await plantillaApi.createPosition(formData);
      } else {
        await plantillaApi.updatePosition(currentPosition.id, formData);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Operation failed");
    }
  };

  const filteredPositions = positions.filter(p => 
    p.position_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.item_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-neutral-100 to-stone-50 rounded-xl shadow-xl p-7 w-full overflow-hidden text-gray-800">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Plantilla Management</h2>
          <p className="text-sm text-gray-800 mt-1">Manage authorized positions and vacancies</p>
        </div>
        <button 
          onClick={handleOpenCreate}
          className="bg-gray-200 text-gray-800 border border-gray-200 font-medium px-4 py-2 rounded-lg text-sm shadow-md hover:bg-gray-300 transition-all flex items-center gap-2"
        >
          <Plus size={18} /> Add Position
        </button>
      </div>

      <hr className="mb-6 border-[1px] border-[#274b46]" />

      {/* Filters */}
      <div className="bg-[#F8F9FA] p-4 rounded-lg shadow-md mb-6 flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input 
            type="text" 
            placeholder="Search position or item number..." 
            className="w-full pl-10 bg-white border border-gray-200 rounded-lg shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-200 hover:border-gray-200 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          className="bg-white border border-gray-200 rounded-lg shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-200 hover:border-gray-200 transition-all cursor-pointer"
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
        >
          <option value="All">All Departments</option>
          {departments.map(dept => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-gray-50 rounded-lg scrollbar-bg-white shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500 flex flex-col items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-3"></div>
            Loading positions...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-200 shadow-md text-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">Item No.</th>
                  <th className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">Position Title</th>
                  <th className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">SG</th>
                  <th className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">Step</th>
                  <th className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">Department</th>
                  <th className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">Status</th>
                  <th className="px-6 py-4 text-center text-sm font-bold tracking-wide whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPositions.length > 0 ? filteredPositions.map(pos => (
                  <tr key={pos.id} className="hover:bg-[#F8F9FA] hover:shadow-xl transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-800 whitespace-nowrap font-medium">{pos.item_number}</td>
                    <td className="px-6 py-4 text-sm text-gray-800 whitespace-nowrap">{pos.position_title}</td>
                    <td className="px-6 py-4 text-sm text-gray-800 whitespace-nowrap">{pos.salary_grade}</td>
                    <td className="px-6 py-4 text-sm text-gray-800 whitespace-nowrap">{pos.step_increment}</td>
                    <td className="px-6 py-4 text-sm text-gray-800 whitespace-nowrap">{pos.department || '-'}</td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${pos.is_vacant ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {pos.is_vacant ? 'Vacant' : 'Filled'}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex justify-center gap-2">
                      <button 
                        onClick={() => handleOpenEdit(pos)}
                        className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-50 transition"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(pos.id)}
                        className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-50 transition"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-gray-500">
                      No positions found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="bg-gray-200 shadow-md px-6 py-3 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">
                {modalMode === 'create' ? 'Add New Position' : 'Edit Position'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-800 transition-colors">
                <Plus className="rotate-45" size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="bg-gray-50 border border-gray-200 rounded-lg shadow-md p-4 space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Item Number</label>
                  <input 
                    type="text" 
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-gray-200 focus:border-transparent focus:outline-none transition-all"
                    value={formData.item_number}
                    onChange={e => setFormData({...formData, item_number: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Position Title</label>
                  <input 
                    type="text" 
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-gray-200 focus:border-transparent focus:outline-none transition-all"
                    value={formData.position_title}
                    onChange={e => setFormData({...formData, position_title: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Salary Grade</label>
                    <input 
                      type="number" 
                      required
                      min="1"
                      max="33"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-gray-200 focus:border-transparent focus:outline-none transition-all"
                      value={formData.salary_grade}
                      onChange={e => setFormData({...formData, salary_grade: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Step Increment</label>
                    <input 
                      type="number" 
                      min="1"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-gray-200 focus:border-transparent focus:outline-none transition-all"
                      value={formData.step_increment}
                      onChange={e => setFormData({...formData, step_increment: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Department</label>
                  <select 
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-gray-200 focus:border-transparent focus:outline-none transition-all"
                    value={formData.department}
                    onChange={e => setFormData({...formData, department: e.target.value})}
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                {modalMode === 'edit' && (
                  <div className="flex items-center gap-2 pt-2">
                    <input 
                      type="checkbox" 
                      id="is_vacant"
                      checked={formData.is_vacant}
                      onChange={e => setFormData({...formData, is_vacant: e.target.checked})}
                      className="w-4 h-4 text-gray-600 rounded border-gray-300 focus:ring-gray-200"
                    />
                    <label htmlFor="is_vacant" className="text-sm font-medium text-gray-700 cursor-pointer select-none">Mark as Vacant</label>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-3 py-1.5 bg-[#F8F9FA] text-gray-700 font-medium rounded-lg shadow-md hover:bg-gray-100 hover:text-red-800 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-3 py-1.5 bg-[#F8F9FA] text-gray-700 font-medium rounded-lg shadow-md border-2 border-transparent hover:text-green-800 transition-all disabled:opacity-50"
                >
                  {modalMode === 'create' ? 'Create Position' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlantillaManagement;
