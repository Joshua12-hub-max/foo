import { useState, useEffect } from 'react';
import { X, User, Mail, Building, Briefcase, Shield, Phone, MapPin, CreditCard, Calendar, FileText } from 'lucide-react';
import { plantillaApi } from '../../../../api/plantillaApi';
import { 
  ROLE_OPTIONS, 
  APPOINTMENT_TYPE_OPTIONS, 
  GENDER_OPTIONS, 
  CIVIL_STATUS_OPTIONS,
  SALARY_GRADE_OPTIONS 
} from '../constants/employeeConstants';

/**
 * Add Employee Modal Component
 * Modal dialog for creating new employees with government worker fields
 * Uses tabbed interface for organizing form sections
 */
const AddEmployeeModal = ({
  isOpen,
  onClose,
  formData,
  onFormChange,
  departments,
  onSubmit,
  isProcessing
}) => {
  const [activeTab, setActiveTab] = useState('basic');
  const [vacantPositions, setVacantPositions] = useState([]);
  
  useEffect(() => {
    if (isOpen) {
      loadVacantPositions();
    }
  }, [isOpen]);

  const loadVacantPositions = async () => {
    try {
      const res = await plantillaApi.getPositions({ is_vacant: true });
      if (res.data.success) {
        setVacantPositions(res.data.positions);
      }
    } catch (err) {
      console.error("Failed to load plantilla", err);
    }
  };

  const handlePlantillaChange = (e) => {
    const itemNo = e.target.value;
    onFormChange('item_number', itemNo);
    
    if (itemNo) {
      const position = vacantPositions.find(p => p.item_number === itemNo);
      if (position) {
        onFormChange('position_title', position.position_title);
        onFormChange('salary_grade', position.salary_grade);
        onFormChange('step_increment', position.step_increment);
        if (position.department) onFormChange('department', position.department);
      }
    } else {
        // Clear fields if unselected? Maybe not, keep manual entry option.
    }
  };

  if (!isOpen) return null;

  const handleChange = (field) => (e) => {
    onFormChange(field, e.target.value);
  };

  const tabs = [
    { id: 'basic', label: 'Basic Info' },
    { id: 'personal', label: 'Personal' },
    { id: 'government', label: 'Gov\'t IDs' },
    { id: 'employment', label: 'Employment' }
  ];

  return (
    <div className="fixed inset-0 bg-black/30 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg w-full max-w-2xl shadow-xl mt-8 mb-8 border border-gray-200">
        {/* Header */}
        <div className="px-6 py-4 flex justify-between items-center border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">Add New Employee</h2>
          <button onClick={onClose} className="text-red-500 hover:text-red-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id 
                  ? 'text-gray-800 border-b-2 border-gray-800' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        {/* Form */}
        <form onSubmit={onSubmit} className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          
          {/* Basic Info Tab */}
          {activeTab === 'basic' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block flex items-center gap-1">
                    <User size={14} className="text-gray-400" /> First Name *
                  </label>
                  <input 
                    required type="text" 
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-300 text-sm" 
                    placeholder="e.g. Juan"
                    value={formData.first_name} 
                    onChange={handleChange('first_name')} 
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block flex items-center gap-1">
                    <User size={14} className="text-gray-400" /> Last Name *
                  </label>
                  <input 
                    required type="text" 
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-300 text-sm" 
                    placeholder="e.g. Dela Cruz"
                    value={formData.last_name} 
                    onChange={handleChange('last_name')} 
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm text-gray-600 mb-1 block flex items-center gap-1">
                  <Mail size={14} className="text-gray-400" /> Email Address *
                </label>
                <input 
                  required type="email" 
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-300 text-sm" 
                  placeholder="e.g. juan@agency.gov.ph"
                  value={formData.email} 
                  onChange={handleChange('email')} 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block flex items-center gap-1">
                    <Building size={14} className="text-gray-400" /> Department *
                  </label>
                  <select 
                    required 
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-300 text-sm" 
                    value={formData.department} 
                    onChange={handleChange('department')}
                  >
                    <option value="">Select...</option>
                    {departments.map(d => (<option key={d.id} value={d.name}>{d.name}</option>))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block flex items-center gap-1">
                    <Shield size={14} className="text-gray-400" /> System Role *
                  </label>
                  <select 
                    required
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-300 text-sm" 
                    value={formData.role} 
                    onChange={handleChange('role')}
                  >
                    {ROLE_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}

          {/* Personal Info Tab */}
          {activeTab === 'personal' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block flex items-center gap-1">
                    <Calendar size={14} className="text-gray-400" /> Birth Date
                  </label>
                  <input 
                    type="date" 
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-300 text-sm" 
                    value={formData.birth_date || ''} 
                    onChange={handleChange('birth_date')} 
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Gender</label>
                  <select 
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-300 text-sm" 
                    value={formData.gender || ''} 
                    onChange={handleChange('gender')}
                  >
                    <option value="">Select...</option>
                    {GENDER_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Civil Status</label>
                  <select 
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-300 text-sm" 
                    value={formData.civil_status || ''} 
                    onChange={handleChange('civil_status')}
                  >
                    <option value="">Select...</option>
                    {CIVIL_STATUS_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Nationality</label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-300 text-sm" 
                    placeholder="Filipino"
                    value={formData.nationality || 'Filipino'} 
                    onChange={handleChange('nationality')} 
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-600 mb-1 block flex items-center gap-1">
                  <Phone size={14} className="text-gray-400" /> Phone Number
                </label>
                <input 
                  type="tel" 
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-300 text-sm" 
                  placeholder="e.g. 09171234567"
                  value={formData.phone_number || ''} 
                  onChange={handleChange('phone_number')} 
                />
              </div>

              <div>
                <label className="text-sm text-gray-600 mb-1 block flex items-center gap-1">
                  <MapPin size={14} className="text-gray-400" /> Present Address
                </label>
                <textarea 
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-300 text-sm resize-none" 
                  rows={2}
                  placeholder="House/Unit No., Street, Barangay, City/Municipality"
                  value={formData.address || ''} 
                  onChange={handleChange('address')} 
                />
              </div>
            </>
          )}

          {/* Government IDs Tab */}
          {activeTab === 'government' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block flex items-center gap-1">
                    <CreditCard size={14} className="text-gray-400" /> SSS Number
                  </label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-300 text-sm" 
                    placeholder="XX-XXXXXXX-X"
                    value={formData.sss_number || ''} 
                    onChange={handleChange('sss_number')} 
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block flex items-center gap-1">
                    <CreditCard size={14} className="text-gray-400" /> GSIS Number
                  </label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-300 text-sm" 
                    placeholder="GSIS ID"
                    value={formData.gsis_number || ''} 
                    onChange={handleChange('gsis_number')} 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">PhilHealth Number</label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-300 text-sm" 
                    placeholder="XX-XXXXXXXXX-X"
                    value={formData.philhealth_number || ''} 
                    onChange={handleChange('philhealth_number')} 
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Pag-IBIG Number</label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-300 text-sm" 
                    placeholder="XXXX-XXXX-XXXX"
                    value={formData.pagibig_number || ''} 
                    onChange={handleChange('pagibig_number')} 
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-600 mb-1 block">TIN (Tax Identification Number)</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-300 text-sm" 
                  placeholder="XXX-XXX-XXX-XXX"
                  value={formData.tin_number || ''} 
                  onChange={handleChange('tin_number')} 
                />
              </div>
            </>
          )}

          {/* Employment Details Tab */}
          {activeTab === 'employment' && (
            <>
              {/* Plantilla Selection */}
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mb-4">
                <label className="text-sm font-semibold text-blue-800 mb-1 block flex items-center gap-1">
                  <FileText size={14} className="text-blue-600" /> Select Plantilla Item (Optional)
                </label>
                <select 
                  className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:border-blue-400 text-sm" 
                  value={formData.item_number || ''} 
                  onChange={handlePlantillaChange}
                >
                  <option value="">Select available position...</option>
                  {vacantPositions.map(pos => (
                    <option key={pos.id} value={pos.item_number}>
                      {pos.item_number} - {pos.position_title} (SG-{pos.salary_grade})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-blue-600 mt-1">
                  Selecting a position will auto-fill Title, Salary Grade, and Department.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block flex items-center gap-1">
                    <Briefcase size={14} className="text-gray-400" /> Position Title
                  </label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-300 text-sm" 
                    placeholder="e.g. Administrative Officer III"
                    value={formData.position_title || ''} 
                    onChange={handleChange('position_title')} 
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Appointment Type</label>
                  <select 
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-300 text-sm" 
                    value={formData.appointment_type || ''} 
                    onChange={handleChange('appointment_type')}
                  >
                    <option value="">Select...</option>
                    {APPOINTMENT_TYPE_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Salary Grade</label>
                  <select 
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-300 text-sm" 
                    value={formData.salary_grade || ''} 
                    onChange={handleChange('salary_grade')}
                  >
                    <option value="">Select...</option>
                    {SALARY_GRADE_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Step Increment</label>
                  <select 
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-300 text-sm" 
                    value={formData.step_increment || 1} 
                    onChange={handleChange('step_increment')}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(step => (
                      <option key={step} value={step}>Step {step}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-600 mb-1 block">Station/Assignment</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-300 text-sm" 
                  placeholder="e.g. Main Office - Manila"
                  value={formData.station || ''} 
                  onChange={handleChange('station')} 
                />
              </div>
            </>
          )}

          {/* Footer Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-100 mt-4">
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 px-4 py-2.5 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isProcessing} 
              className="flex-1 px-4 py-2.5 text-sm text-gray-600 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors disabled:opacity-50"
            >
              {isProcessing ? 'Saving...' : 'Save Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEmployeeModal;
