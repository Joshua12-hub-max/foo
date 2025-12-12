import { useState, useEffect } from 'react';
import { X, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { plantillaApi } from '../../../../api/plantillaApi';
import { 
  ROLE_OPTIONS, 
  EMPLOYMENT_STATUS_OPTIONS,
  APPOINTMENT_TYPE_OPTIONS, 
  GENDER_OPTIONS, 
  CIVIL_STATUS_OPTIONS,
  SALARY_GRADE_OPTIONS,
  BLOOD_TYPE_OPTIONS,
  NATIONALITY_OPTIONS
} from '../constants/employeeConstants';

/**
 * Collapsible Section Component
 * Expandable/collapsible container for form field groups
 */
const CollapsibleSection = ({ title, isOpen, onToggle, children }) => (
  <div className="border border-gray-200 rounded-lg overflow-hidden">
    <button
      type="button"
      onClick={onToggle}
      className="w-full px-4 py-3 bg-gray-50 flex items-center justify-between text-left hover:bg-gray-100 transition-colors"
    >
      <span className="text-sm font-medium text-gray-700">{title}</span>
      {isOpen ? (
        <ChevronUp size={18} className="text-gray-500" />
      ) : (
        <ChevronDown size={18} className="text-gray-500" />
      )}
    </button>
    <div
      className={`transition-all duration-300 ease-in-out overflow-hidden ${
        isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
      }`}
    >
      <div className="p-4 space-y-4 bg-white">
        {children}
      </div>
    </div>
  </div>
);

/**
 * Form Field Components
 */
const InputField = ({ label, required, ...props }) => (
  <div>
    <label className="text-sm text-gray-600 mb-1 block">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    <input 
      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-300 text-sm" 
      {...props}
    />
  </div>
);

const SelectField = ({ label, required, options, placeholder = "Select...", ...props }) => (
  <div>
    <label className="text-sm text-gray-600 mb-1 block">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    <select 
      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-300 text-sm"
      {...props}
    >
      <option value="">{placeholder}</option>
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
);

const TextareaField = ({ label, ...props }) => (
  <div>
    <label className="text-sm text-gray-600 mb-1 block">{label}</label>
    <textarea 
      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-300 text-sm resize-none" 
      rows={2}
      {...props}
    />
  </div>
);

/**
 * Edit Employee Modal Component
 * Modal dialog with collapsible sections for editing employee details
 */
const EditEmployeeModal = ({
  isOpen,
  onClose,
  employee,
  formData,
  onFormChange,
  departments,
  onSubmit,
  isProcessing
}) => {
  // Section open states
  const [openSections, setOpenSections] = useState({
    personal: false,
    government: false,
    employment: true // Open by default for easier access to plantilla
  });
  const [vacantPositions, setVacantPositions] = useState([]);

  useEffect(() => {
    if (isOpen) {
      loadPlantillaOptions();
    }
  }, [isOpen, employee]);

  const loadPlantillaOptions = async () => {
    try {
      const res = await plantillaApi.getPositions({ is_vacant: true });
      let positions = res.data.success ? res.data.positions : [];

      // Add current position if it exists, to ensure it appears in the dropdown
      if (employee?.item_number) {
         const currentPos = {
             id: 'current',
             item_number: employee.item_number,
             position_title: employee.position_title,
             salary_grade: employee.salary_grade,
             step_increment: employee.step_increment,
             department: employee.department
         };
         // Only add if not already in the list
         if (!positions.find(p => p.item_number === employee.item_number)) {
             positions = [currentPos, ...positions];
         }
      }
      setVacantPositions(positions);
    } catch (err) {
      console.error(err);
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
    }
  };
  
  if (!isOpen || !employee) return null;

  const handleChange = (field) => (e) => {
    onFormChange(field, e.target.value);
  };

  const toggleSection = (section) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg w-full max-w-2xl shadow-xl mt-8 mb-8 border border-gray-200">
        {/* Header */}
        <div className="px-6 py-4 flex justify-between items-center border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">Edit Employee</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Form */}
        <form onSubmit={onSubmit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          
          {/* Required Information - Always Visible */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-800 pb-2 border-b border-gray-100">
              Required Information
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <InputField 
                label="First Name" 
                required 
                type="text"
                value={formData.first_name || ''} 
                onChange={handleChange('first_name')} 
              />
              <InputField 
                label="Last Name" 
                required 
                type="text"
                value={formData.last_name || ''} 
                onChange={handleChange('last_name')} 
              />
            </div>
            
            <InputField 
              label="Email Address" 
              required 
              type="email"
              value={formData.email || ''} 
              onChange={handleChange('email')} 
            />

            <div className="grid grid-cols-2 gap-4">
              <SelectField 
                label="Department" 
                required
                options={departments.map(d => ({ value: d.name, label: d.name }))}
                value={formData.department || ''} 
                onChange={handleChange('department')}
              />
              <SelectField 
                label="System Role"
                options={ROLE_OPTIONS}
                value={formData.role || 'employee'} 
                onChange={handleChange('role')}
              />
            </div>

            <SelectField 
              label="Employment Status"
              options={EMPLOYMENT_STATUS_OPTIONS}
              value={formData.employment_status || 'Active'} 
              onChange={handleChange('employment_status')}
            />
          </div>

          {/* Personal Information - Collapsible */}
          <CollapsibleSection 
            title="Personal Information" 
            isOpen={openSections.personal}
            onToggle={() => toggleSection('personal')}
          >
            <div className="grid grid-cols-2 gap-4">
              <InputField 
                label="Birth Date" 
                type="date"
                value={formData.birth_date || ''} 
                onChange={handleChange('birth_date')} 
              />
              <SelectField 
                label="Gender"
                options={GENDER_OPTIONS}
                value={formData.gender || ''} 
                onChange={handleChange('gender')}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <SelectField 
                label="Civil Status"
                options={CIVIL_STATUS_OPTIONS}
                value={formData.civil_status || ''} 
                onChange={handleChange('civil_status')}
              />
              <SelectField 
                label="Nationality"
                options={NATIONALITY_OPTIONS}
                value={formData.nationality || 'Filipino'} 
                onChange={handleChange('nationality')}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <SelectField 
                label="Blood Type"
                options={BLOOD_TYPE_OPTIONS}
                value={formData.blood_type || ''} 
                onChange={handleChange('blood_type')}
              />
              <InputField 
                label="Height (cm)" 
                type="number"
                placeholder="170"
                value={formData.height_cm || ''} 
                onChange={handleChange('height_cm')} 
              />
              <InputField 
                label="Weight (kg)" 
                type="number"
                placeholder="65"
                value={formData.weight_kg || ''} 
                onChange={handleChange('weight_kg')} 
              />
            </div>

            <InputField 
              label="Phone Number" 
              type="tel"
              value={formData.phone_number || ''} 
              onChange={handleChange('phone_number')} 
            />

            <TextareaField 
              label="Present Address"
              value={formData.address || ''} 
              onChange={handleChange('address')} 
            />

            <TextareaField 
              label="Permanent Address"
              value={formData.permanent_address || ''} 
              onChange={handleChange('permanent_address')} 
            />

            <div className="grid grid-cols-2 gap-4">
              <InputField 
                label="Emergency Contact" 
                type="text"
                value={formData.emergency_contact || ''} 
                onChange={handleChange('emergency_contact')} 
              />
              <InputField 
                label="Emergency Phone" 
                type="tel"
                value={formData.emergency_contact_number || ''} 
                onChange={handleChange('emergency_contact_number')} 
              />
            </div>
          </CollapsibleSection>

          {/* Government IDs - Collapsible */}
          <CollapsibleSection 
            title="Government IDs" 
            isOpen={openSections.government}
            onToggle={() => toggleSection('government')}
          >
            <div className="grid grid-cols-2 gap-4">
              <InputField 
                label="SSS Number" 
                type="text"
                placeholder="XX-XXXXXXX-X"
                value={formData.sss_number || ''} 
                onChange={handleChange('sss_number')} 
              />
              <InputField 
                label="GSIS Number" 
                type="text"
                value={formData.gsis_number || ''} 
                onChange={handleChange('gsis_number')} 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <InputField 
                label="PhilHealth Number" 
                type="text"
                value={formData.philhealth_number || ''} 
                onChange={handleChange('philhealth_number')} 
              />
              <InputField 
                label="Pag-IBIG Number" 
                type="text"
                value={formData.pagibig_number || ''} 
                onChange={handleChange('pagibig_number')} 
              />
            </div>

            <InputField 
              label="TIN (Tax Identification Number)" 
              type="text"
              value={formData.tin_number || ''} 
              onChange={handleChange('tin_number')} 
            />
          </CollapsibleSection>

          {/* Employment Details - Collapsible */}
          <CollapsibleSection 
            title="Employment Details" 
            isOpen={openSections.employment}
            onToggle={() => toggleSection('employment')}
          >
            {/* Plantilla Selection */}
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mb-4">
              <label className="text-sm font-semibold text-blue-800 mb-1 block flex items-center gap-1">
                <FileText size={14} className="text-blue-600" /> Plantilla Item Assignment
              </label>
              <select 
                className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:border-blue-400 text-sm" 
                value={formData.item_number || ''} 
                onChange={handlePlantillaChange}
              >
                <option value="">Select position...</option>
                {vacantPositions.map(pos => (
                  <option key={pos.id} value={pos.item_number}>
                    {pos.item_number} - {pos.position_title} (SG-{pos.salary_grade})
                  </option>
                ))}
              </select>
              <p className="text-xs text-blue-600 mt-1">
                Changing this will re-assign the employee to a new position.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <InputField 
                label="Position Title" 
                type="text"
                value={formData.position_title || ''} 
                onChange={handleChange('position_title')} 
              />
              <InputField 
                label="Item Number" 
                type="text"
                value={formData.item_number || ''} 
                onChange={handleChange('item_number')} 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <SelectField 
                label="Appointment Type"
                options={APPOINTMENT_TYPE_OPTIONS}
                value={formData.appointment_type || ''} 
                onChange={handleChange('appointment_type')}
              />
              <SelectField 
                label="Salary Grade"
                options={SALARY_GRADE_OPTIONS}
                value={formData.salary_grade || ''} 
                onChange={handleChange('salary_grade')}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <SelectField 
                label="Step Increment"
                options={[1, 2, 3, 4, 5, 6, 7, 8].map(s => ({ value: s, label: `Step ${s}` }))}
                value={formData.step_increment || 1} 
                onChange={handleChange('step_increment')}
              />
              <InputField 
                label="Station/Assignment" 
                type="text"
                value={formData.station || ''} 
                onChange={handleChange('station')} 
              />
            </div>
          </CollapsibleSection>

          {/* Footer Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-100">
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
              {isProcessing ? 'Saving...' : 'Update Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditEmployeeModal;
