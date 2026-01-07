import { useState, useEffect } from 'react';
import { X, User, Briefcase, Mail, Phone, Calendar, Shield, CreditCard, MapPin, ChevronUp, ChevronDown, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { plantillaApi } from '@api/plantillaApi';
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
 */
const CollapsibleSection = ({ title, isOpen, onToggle, children }) => (
  <div className="border border-gray-200 rounded-lg overflow-hidden">
    <button
      type="button"
      onClick={onToggle}
      className="w-full px-3 py-2 bg-gray-100 flex items-center justify-between text-left hover:bg-gray-200 transition-colors"
    >
      <span className="text-xs font-semibold text-gray-700">{title}</span>
      {isOpen ? <ChevronUp size={14} className="text-gray-500" /> : <ChevronDown size={14} className="text-gray-500" />}
    </button>
    <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
      <div className="p-3 space-y-2 bg-white">{children}</div>
    </div>
  </div>
);

/**
 * Form Field Components - Compact
 */
const InputField = ({ label, required, ...props }) => (
  <div>
    <label className="text-xs font-semibold text-gray-700 mb-1 block">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    <input 
      className="w-full px-2.5 py-1.5 text-sm bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-200" 
      {...props}
    />
  </div>
);

const SelectField = ({ label, required, options, placeholder = "Select...", ...props }) => (
  <div>
    <label className="text-xs font-semibold text-gray-700 mb-1 block">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    <select 
      className="w-full px-2.5 py-1.5 text-sm bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-200"
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
    <label className="text-xs font-semibold text-gray-700 mb-1 block">{label}</label>
    <textarea 
      className="w-full px-2.5 py-1.5 text-sm bg-[#F8F9FA] border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-200 resize-none" 
      rows={2}
      {...props}
    />
  </div>
);

/**
 * Edit Employee Modal Component - Compact Design
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
  // All hooks must be called unconditionally at the top level
  const [openSections, setOpenSections] = useState({
    personal: false,
    government: false,
    employment: true
  });
  const [vacantPositions, setVacantPositions] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      loadPlantillaOptions();
    }
  }, [isOpen, employee]);

  const loadPlantillaOptions = async () => {
    try {
      const res = await plantillaApi.getPositions({ is_vacant: true });
      let positions = res.data.success ? res.data.positions : [];
      if (employee?.item_number) {
         const currentPos = {
             id: 'current',
             item_number: employee.item_number,
             position_title: employee.position_title,
             salary_grade: employee.salary_grade,
             step_increment: employee.step_increment,
             department: employee.department
         };
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

  const handleChange = (field) => (e) => {
    onFormChange(field, e.target.value);
  };

  const toggleSection = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };
  
  // Early return AFTER all hooks have been called
  if (!isOpen || !employee) return null;

  const validateForm = () => {
    const newErrors = {};
    if (!formData.first_name?.trim()) newErrors.first_name = 'First Name is required';
    if (!formData.last_name?.trim()) newErrors.last_name = 'Last Name is required';
    if (!formData.email?.trim()) {
        newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Invalid email format';
    }
    if (!formData.department) newErrors.department = 'Department is required';

    // Optional: Validate Govt IDs format if needed
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateSubmit = (e) => {
    if (validateForm()) {
        onSubmit(e);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col border border-gray-100 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 z-10">
          <h3 className="text-xl font-bold text-gray-900">Edit Employee</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Form */}
        <form onSubmit={(e) => { e.preventDefault(); handleCreateSubmit(e); }} className="flex-1 overflow-y-auto p-6 space-y-4">
          
          {/* Required Information */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-gray-600">Required Information</p>
            <div className="grid grid-cols-2 gap-2">
              <InputField 
                label="First Name" required type="text" 
                value={formData.first_name || ''} onChange={handleChange('first_name')} 
                className={`w-full px-2.5 py-1.5 text-sm bg-[#F8F9FA] border-2 rounded-lg focus:outline-none ${errors.first_name ? 'border-red-500' : 'border-gray-200'}`}
              />
              <InputField 
                label="Last Name" required type="text" 
                value={formData.last_name || ''} onChange={handleChange('last_name')} 
                className={`w-full px-2.5 py-1.5 text-sm bg-[#F8F9FA] border-2 rounded-lg focus:outline-none ${errors.last_name ? 'border-red-500' : 'border-gray-200'}`}
              />
            </div>
            {errors.first_name && <p className="text-[10px] text-red-500">{errors.first_name}</p>}
            {errors.last_name && <p className="text-[10px] text-red-500">{errors.last_name}</p>}

            <InputField 
                label="Email Address" required type="email" 
                value={formData.email || ''} onChange={handleChange('email')} 
                className={`w-full px-2.5 py-1.5 text-sm bg-[#F8F9FA] border-2 rounded-lg focus:outline-none ${errors.email ? 'border-red-500' : 'border-gray-200'}`}
            />
            {errors.email && <p className="text-[10px] text-red-500">{errors.email}</p>}

            <div className="grid grid-cols-2 gap-2">
              <div>
                <SelectField 
                    label="Department" required 
                    options={departments.map(d => ({ value: d.name, label: d.name }))} 
                    value={formData.department || ''} onChange={handleChange('department')} 
                    className={`w-full px-2.5 py-1.5 text-sm bg-[#F8F9FA] border-2 rounded-lg focus:outline-none ${errors.department ? 'border-red-500' : 'border-gray-200'}`}
                />
                {errors.department && <p className="text-[10px] text-red-500">{errors.department}</p>}
              </div>
              <SelectField label="System Role" options={ROLE_OPTIONS} value={formData.role || 'employee'} onChange={handleChange('role')} />
            </div>
            <SelectField label="Employment Status" options={EMPLOYMENT_STATUS_OPTIONS} value={formData.employment_status || 'Active'} onChange={handleChange('employment_status')} />
          </div>

          {/* ... Rest of the form sections ... */}
          {/* Employment Details - Collapsible */}
           <CollapsibleSection title="Employment Details" isOpen={openSections.employment} onToggle={() => toggleSection('employment')}>
             {/* ... Identical content ... */}
             <div className="bg-gray-50 p-2 rounded-lg border border-gray-200 mb-2">
               <label className="text-xs font-semibold text-gray-800 mb-1 block flex items-center gap-1">
                 <FileText size={12} className="text-gray-500" /> Plantilla Item
               </label>
               <select 
                 className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-100 bg-white" 
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
             </div>
             <div className="grid grid-cols-2 gap-2">
               <InputField label="Position Title" type="text" value={formData.position_title || ''} onChange={handleChange('position_title')} />
               <InputField label="Item Number" type="text" value={formData.item_number || ''} onChange={handleChange('item_number')} />
             </div>
             <div className="grid grid-cols-2 gap-2">
               <SelectField label="Appointment Type" options={APPOINTMENT_TYPE_OPTIONS} value={formData.appointment_type || ''} onChange={handleChange('appointment_type')} />
               <SelectField label="Salary Grade" options={SALARY_GRADE_OPTIONS} value={formData.salary_grade || ''} onChange={handleChange('salary_grade')} />
             </div>
             <div className="grid grid-cols-2 gap-2">
               <SelectField label="Step Increment" options={[1, 2, 3, 4, 5, 6, 7, 8].map(s => ({ value: s, label: `Step ${s}` }))} value={formData.step_increment || 1} onChange={handleChange('step_increment')} />
               <InputField label="Station" type="text" value={formData.station || ''} onChange={handleChange('station')} />
             </div>
           </CollapsibleSection>
 
           {/* Personal Information - Collapsible */}
           <CollapsibleSection title="Personal Information" isOpen={openSections.personal} onToggle={() => toggleSection('personal')}>
             <div className="grid grid-cols-2 gap-2">
               <InputField label="Birth Date" type="date" value={formData.birth_date || ''} onChange={handleChange('birth_date')} />
               <SelectField label="Gender" options={GENDER_OPTIONS} value={formData.gender || ''} onChange={handleChange('gender')} />
             </div>
             <div className="grid grid-cols-2 gap-2">
               <SelectField label="Civil Status" options={CIVIL_STATUS_OPTIONS} value={formData.civil_status || ''} onChange={handleChange('civil_status')} />
               <SelectField label="Nationality" options={NATIONALITY_OPTIONS} value={formData.nationality || 'Filipino'} onChange={handleChange('nationality')} />
             </div>
             <div className="grid grid-cols-3 gap-2">
               <SelectField label="Blood Type" options={BLOOD_TYPE_OPTIONS} value={formData.blood_type || ''} onChange={handleChange('blood_type')} />
               <InputField label="Height (cm)" type="number" value={formData.height_cm || ''} onChange={handleChange('height_cm')} />
               <InputField label="Weight (kg)" type="number" value={formData.weight_kg || ''} onChange={handleChange('weight_kg')} />
             </div>
             <InputField label="Phone Number" type="tel" value={formData.phone_number || ''} onChange={handleChange('phone_number')} />
             <TextareaField label="Permanent Address" value={formData.permanent_address || ''} onChange={handleChange('permanent_address')} />
             <div className="grid grid-cols-2 gap-2">
               <InputField label="Emergency Contact" type="text" value={formData.emergency_contact || ''} onChange={handleChange('emergency_contact')} />
               <InputField label="Emergency Phone" type="tel" value={formData.emergency_contact_number || ''} onChange={handleChange('emergency_contact_number')} />
             </div>
           </CollapsibleSection>
 
           {/* Government IDs - Collapsible */}
           <CollapsibleSection title="Government IDs" isOpen={openSections.government} onToggle={() => toggleSection('government')}>
             <div className="grid grid-cols-2 gap-2">
               <InputField label="SSS Number" type="text" value={formData.sss_number || ''} onChange={handleChange('sss_number')} />
               <InputField label="GSIS Number" type="text" value={formData.gsis_number || ''} onChange={handleChange('gsis_number')} />
             </div>
             <div className="grid grid-cols-2 gap-2">
               <InputField label="PhilHealth" type="text" value={formData.philhealth_number || ''} onChange={handleChange('philhealth_number')} />
               <InputField label="Pag-IBIG" type="text" value={formData.pagibig_number || ''} onChange={handleChange('pagibig_number')} />
             </div>
             <InputField label="TIN" type="text" value={formData.tin_number || ''} onChange={handleChange('tin_number')} />
           </CollapsibleSection>
        </form>

        {/* Footer Buttons */}
        <div className="flex gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100 mt-auto">
          <button type="button" onClick={onClose} 
            className="flex-1 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm">
            Cancel
          </button>
          <button type="button" onClick={handleCreateSubmit} disabled={isProcessing} 
            className="flex-1 px-4 py-2 text-sm font-bold text-white bg-gray-900 rounded-lg shadow-md hover:bg-gray-800 transition-all disabled:opacity-50">
            {isProcessing ? 'Updating...' : 'Update Employee'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditEmployeeModal;
