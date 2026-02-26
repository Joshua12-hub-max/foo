import React, { useState, useCallback } from 'react';
import { 
  User, Mail, Phone, MapPin, Briefcase, Hash, CreditCard, 
  Calendar, Flag, AlertCircle, Shield, CheckCircle,
  GraduationCap, Award, Heart, Ruler, Scale, Building, UserCheck, Clock, ToggleLeft, ToggleRight, Loader2,
  Pencil, X, Check, Plus, Trash2, Facebook, Linkedin, Twitter
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { employeeApi } from '@/api/employeeApi';
import { ApiError, Education, Skill, EmergencyContact, CustomField, EmployeeDetailed } from '@/types';
import { useToastStore } from '@/stores';
import AddSkillModal from './Modals/AddSkillModal';
import AddEducationModal from './Modals/AddEducationModal';
import AddContactModal from './Modals/AddContactModal';
import AddCustomFieldModal from './Modals/AddCustomFieldModal';
import { formatEmployeeId } from '@/utils/formatters';

// Type alias for Profile to match EmployeeDetailed but with optional legacy fields if needed
type Profile = EmployeeDetailed & {
  jobTitle?: string;
  employeeId?: string;
  employmentStatus?: string;
  itemNumber?: string;
  salaryGrade?: string;
  stepIncrement?: string | number;
  dateHired?: string;
  agencyEmployeeNo?: string;
  emergencyContacts?: EmergencyContact[];
  customFields?: CustomField[];
  suffix?: string | null;
};

interface EditableDataFieldProps {
  label: string;
  value?: string | number | null;
  formattedValue?: string | null;
  fieldName: string;
  icon?: LucideIcon;
  fullWidth?: boolean;
  highlight?: boolean;
  editable?: boolean;
  inputType?: 'text' | 'date' | 'number' | 'email' | 'tel' | 'url' | 'select' | 'textarea';
  options?: { value: string; label: string }[];
  step?: string | number;
  placeholder?: string;
  onSave: (fieldName: string, value: string | number) => Promise<void>;
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
  icon: LucideIcon;
  columns?: string;
}

interface EmployeeProfileViewProps {
  profile?: Profile;
  loading: boolean;
  error?: string | null;
  onRefresh: () => void;
  isAdmin?: boolean;
  onStatusChange?: (id: number, status: string) => Promise<void>;
}

// Clean Editable Field Component - Matches original design but flexible height & width
const EditableDataField: React.FC<EditableDataFieldProps> = ({ 
  label, 
  value, 
  formattedValue,
  fieldName,
  icon: Icon, 
  fullWidth = false, 
  highlight = false,
  editable = true,
  inputType = 'text',
  options = [],
  step,
  placeholder,
  onSave
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(value || ''));
  const [saving, setSaving] = useState(false);

  // Dynamic width calculation based on content length
  const getColSpanClass = (val: string | number | null | undefined) => {
    if (fullWidth) return 'col-span-full';
    const len = String(val || '').length;
    if (len > 50) return 'col-span-1 md:col-span-3 lg:col-span-4'; // Long text spans more
    if (len > 25) return 'col-span-1 md:col-span-2'; // Medium text spans 2
    return ''; // Default (col-span-1)
  };

  const colSpanClass = getColSpanClass(isEditing ? editValue : (formattedValue || value));

  const handleEdit = () => {
    setEditValue(String(value || ''));
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditValue(String(value || ''));
    setIsEditing(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const finalValue = inputType === 'number' ? Number(editValue) : editValue;
      await onSave(fieldName, finalValue);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // For textarea, require Ctrl+Enter to save to allow newlines
    if (inputType === 'textarea') {
      if (e.key === 'Enter' && e.ctrlKey) handleSave();
      else if (e.key === 'Escape') handleCancel();
    } else {
      if (e.key === 'Enter') handleSave();
      else if (e.key === 'Escape') handleCancel();
    }
  };

  return (
    <div className={`flex flex-col border border-gray-200 rounded-md p-2 bg-white group hover:border-red-300 hover:shadow-sm transition-all h-full ${colSpanClass} ${highlight ? 'border-gray-300 bg-gray-50' : ''} relative`}>
      {/* Delete/Clear Button - Visible on Hover */}
      {editable && !isEditing && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (window.confirm(`Are you sure you want to clear the ${label} field?`)) {
                onSave(fieldName, '');
            }
          }}
          className="absolute top-1 right-1 p-1.5 bg-red-100 text-red-600 rounded-full hover:bg-red-200 opacity-0 group-hover:opacity-100 transition-all z-20 shadow-sm"
          title={`Clear ${label}`}
        >
          <Trash2 size={12} />
        </button>
      )}

      {/* Label Row */}
      <div className="flex items-center gap-1.5 mb-1 pr-6">
        {Icon && <Icon size={12} className="text-gray-400 shrink-0" />}
        <span className="text-[10px] font-semibold text-gray-500 tracking-wide text-nowrap flex-1 truncate">{label}</span>
      </div>

      {/* Value or Edit Mode */}
      {isEditing ? (
        <div className="flex items-start gap-1 w-full">
          {inputType === 'select' && options.length > 0 ? (
            <select
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleSave}
              className="flex-1 text-sm font-bold text-gray-700 border border-gray-300 rounded px-1.5 py-0.5 focus:outline-none focus:border-gray-500 bg-white w-full"
              autoFocus
            >
              <option value="">Select...</option>
              {options.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          ) : inputType === 'textarea' ? (
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleSave}
              className="flex-1 text-sm font-bold text-gray-700 border border-gray-300 rounded px-1.5 py-1 focus:outline-none focus:border-gray-500 min-w-0 resize-y min-h-[60px]"
              autoFocus
            />
          ) : (
            <input
              type={inputType}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleSave}
              className="flex-1 text-sm font-bold text-gray-700 border border-gray-300 rounded px-1.5 py-0.5 focus:outline-none focus:border-gray-500 min-w-0"
              autoFocus
              step={step}
              placeholder={placeholder}
            />
          )}
          {/* Small save/cancel icons */}
          <div className="flex flex-col gap-1 shrink-0">
             <button
               onMouseDown={(e) => e.preventDefault()} // Prevent blur from firing before click
               onClick={handleSave}
               disabled={saving}
               className="p-1 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
               title="Save"
             >
               {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
             </button>
             <button
               onMouseDown={(e) => e.preventDefault()} // Prevent blur
               onClick={handleCancel}
               className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
               title="Cancel"
             >
               <X size={14} />
             </button>
          </div>
        </div>
      ) : (
        <div className="group/value relative h-full">
            <span className={`text-sm font-bold break-words whitespace-pre-wrap ${highlight ? 'text-gray-900' : 'text-gray-700'} block min-h-[20px]`}>
            {formattedValue || value || <span className="text-gray-300 font-normal italic">Empty</span>}
            </span>
            {editable && (
            <div 
                className="absolute inset-0 cursor-text" 
                onClick={handleEdit}
                title="Click to edit value"
            />
            )}
            {/* Pencil highlight logic can assume the user clicks text. We can add a hidden pencil like custom data field if needed, but click-to-edit is explicit enough with the cursor */}
             {editable && (
             <button
                onClick={handleEdit}
                className="absolute -right-6 top-0 opacity-0 group-hover/value:opacity-100 p-0.5 text-gray-400 hover:text-gray-600 transition-all hidden group-hover:block"
             >
                <Pencil size={10} />
             </button>
             )}
        </div>
      )}
    </div>
  );
};

interface CustomEditableDataFieldProps extends EditableDataFieldProps {
  onDelete: () => Promise<void>;
}

const CustomEditableDataField: React.FC<CustomEditableDataFieldProps> = ({ 
  label, value, fieldName, icon: Icon, fullWidth = false, highlight = false, inputType = 'text', onSave, onDelete 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(value || ''));
  const [saving, setSaving] = useState(false);

  // Dynamic width calculation
  const getColSpanClass = (val: string | number | null | undefined) => {
    if (fullWidth) return 'col-span-full';
    const len = String(val || '').length;
    if (len > 50) return 'col-span-1 md:col-span-3 lg:col-span-4'; 
    if (len > 25) return 'col-span-1 md:col-span-2';
    return ''; 
  };
  const colSpanClass = getColSpanClass(isEditing ? editValue : value);

  const handleSaveValue = async () => {
    setSaving(true);
    try {
      await onSave(fieldName, editValue);
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`flex flex-col border border-gray-200 rounded-md p-2 bg-white group hover:border-red-300 hover:shadow-sm transition-all h-full ${colSpanClass} relative`}>
      {/* Delete Button - Visible on Hover */}
      <button 
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="absolute top-1 right-1 p-1.5 bg-red-100 text-red-600 rounded-full hover:bg-red-200 opacity-0 group-hover:opacity-100 transition-all z-20 shadow-sm"
        title="Delete Field"
      >
        <Trash2 size={12} />
      </button>

      {/* Label Row */}
      <div className="flex items-center gap-1.5 mb-1 pr-6">
        <Hash size={12} className="text-gray-400 shrink-0" />
        <span className="text-[10px] font-semibold text-gray-500 tracking-wide text-nowrap flex-1 truncate group-hover:text-gray-700">
            {label}
        </span>
      </div>

      {/* Value Row */}
      {isEditing ? (
        <div className="flex items-start gap-1 w-full">
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSaveValue}
              className="flex-1 text-sm font-bold text-gray-700 border border-gray-300 rounded px-1.5 py-1 focus:outline-none focus:border-gray-500 min-w-0 resize-y min-h-[60px]"
              autoFocus
            />
            <div className="flex flex-col gap-1 shrink-0">
                 <button onMouseDown={(e) => e.preventDefault()} onClick={handleSaveValue} disabled={saving} className="p-1 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded">
                   {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                 </button>
                 <button onMouseDown={(e) => e.preventDefault()} onClick={() => { setIsEditing(false); setEditValue(String(value||'')); }} className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded">
                   <X size={14} />
                 </button>
            </div>
        </div>
      ) : (
        <div className="group/value relative h-full">
             <span className="text-sm font-bold break-words whitespace-pre-wrap text-gray-700 block min-h-[20px]">
               {value || <span className="text-gray-300 font-normal italic">Empty</span>}
             </span>
             <button
                onClick={() => { setEditValue(String(value||'')); setIsEditing(true); }}
                className="absolute -right-6 top-0 opacity-0 group-hover/value:opacity-100 p-0.5 text-gray-400 hover:text-gray-600 transition-all hidden group-hover:block"
             >
                <Pencil size={10} />
             </button>
             {/* Make the whole value clickable to edit is also a good pattern, but let's stick to the pencil or just click */}
             <div 
                className="absolute inset-0 cursor-text" 
                onClick={() => { setEditValue(String(value||'')); setIsEditing(true); }} 
                title="Click to edit value"
             />
        </div>
      )}
    </div>
  );
};

// Read-only DataField component
const DataField: React.FC<{label: string; value?: string | number | null; icon?: LucideIcon; fullWidth?: boolean; highlight?: boolean}> = ({ 
  label, value, icon: Icon, fullWidth = false, highlight = false 
}) => {
  // Dynamic width calculation
  const getColSpanClass = () => {
    if (fullWidth) return 'col-span-full';
    const len = String(value || '').length;
    if (len > 50) return 'col-span-1 md:col-span-3 lg:col-span-4'; 
    if (len > 25) return 'col-span-1 md:col-span-2';
    return '';
  };
  
  return (
    <div className={`flex flex-col border border-gray-200 rounded-md p-2 bg-white ${getColSpanClass()} ${highlight ? 'border-gray-300 bg-gray-50' : ''}`}>
      <div className="flex items-center gap-1.5 mb-1">
        {Icon && <Icon size={12} className="text-gray-400" />}
        <span className="text-[10px] font-semibold text-gray-500 tracking-wide text-nowrap">{label}</span>
      </div>
      <span className={`text-sm font-bold truncate ${highlight ? 'text-gray-900' : 'text-gray-700'}`}>
        {value || <span className="text-gray-300 font-normal italic">N/A</span>}
      </span>
    </div>
  );
};

// Section Container
const Section: React.FC<SectionProps> = ({ title, children, icon: Icon, columns = "grid-cols-2 md:grid-cols-4 lg:grid-cols-6" }) => (
  <div className="mb-6">
    <div className="flex items-center gap-2 mb-3 px-1">
      <div className="p-1 bg-gray-100 rounded text-gray-800">
        <Icon size={14} />
      </div>
      <h3 className="text-xs font-bold text-gray-800 tracking-tight">{title}</h3>
      <div className="h-px bg-gray-200 flex-grow ml-2"></div>
    </div>
    <div className={`grid ${columns} gap-2`}>
      {children}
    </div>
  </div>
);

// Add New Card Component (Plus icon card)
interface AddCardProps {
  label: string;
  onClick: () => void;
}

const AddCard: React.FC<AddCardProps> = ({ label, onClick }) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-4 bg-white hover:bg-gray-50 hover:border-gray-400 transition-all cursor-pointer group min-h-[80px]"
  >
    <div className="w-8 h-8 rounded-full bg-white border border-gray-200 shadow-sm group-hover:border-gray-300 flex items-center justify-center mb-2 transition-colors">
      <Plus size={16} className="text-gray-500 group-hover:text-gray-900" />
    </div>
    <span className="text-xs font-bold text-gray-500 group-hover:text-gray-900">{label}</span>
  </button>
);

const EditableProfileView: React.FC<EmployeeProfileViewProps> = ({ profile, loading, error, onRefresh, isAdmin = false, onStatusChange }) => {
  const [statusLoading, setStatusLoading] = useState(false);
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [showAddEducation, setShowAddEducation] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [editingEducation, setEditingEducation] = useState<Education | null>(null);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);
  const [customFieldModal, setCustomFieldModal] = useState<{isOpen: boolean, section: string}>({isOpen: false, section: ''});
  const showToast = useToastStore((state) => state.showToast);

  // Step Increment Data
  const [nextStepData, setNextStepData] = useState<{ nextStepDate?: string | null, totalLwopDays?: number } | null>(null);

  React.useEffect(() => {
    if (profile?.id) {
        employeeApi.getNextStepIncrement(profile.id).then(res => {
            if (res.success) {
                setNextStepData({ nextStepDate: res.nextStepDate, totalLwopDays: res.totalLwopDays });
            }
        }).catch(err => console.error(err));
    }
  }, [profile?.id]);

  const handleFieldSave = useCallback(async (fieldName: string, value: string | number) => {
    if (!profile?.id) return;
    
    try {
      await employeeApi.updateEmployee(profile.id, { [fieldName]: value });
      showToast(`Updated successfully`, 'success');
      onRefresh();
    } catch (error: unknown) {
      console.error('Failed to update field:', error);
      const err = error as ApiError;
      showToast(err.response?.data?.message || err.message || 'Failed to update', 'error');
      throw error;
    }
  }, [profile?.id, showToast, onRefresh]);

  const handleCustomFieldSave = async (fieldId: number, value: string | number) => {
      if (!profile?.id) return;
      try {
          await employeeApi.updateEmployeeCustomField(profile.id, fieldId, { field_value: String(value) });
          showToast('Updated successfully', 'success');
          onRefresh();
      } catch (error: unknown) {
          const err = error as ApiError;
          showToast(err.response?.data?.message || err.message || 'Failed to update', 'error');
      }
  };



  const handleCustomFieldDelete = async (fieldId: number) => {
      if (!profile?.id) return;
      if (!window.confirm("Are you sure you want to delete this field?")) return;
      try {
          await employeeApi.deleteEmployeeCustomField(profile.id, fieldId);
          showToast('Deleted successfully', 'success');
          onRefresh();
      } catch (error: unknown) {
      const err = error as ApiError;
      showToast(err.response?.data?.message || err.message || 'Failed to save changes. Please try again.', 'error');
    } finally {}
  };

  const handleDeleteSkill = async (skillId: number) => {
    if (!profile?.id) return;
    if (!window.confirm("Are you sure you want to delete this skill?")) return;
    try {
      await employeeApi.deleteEmployeeSkill(profile.id, skillId);
      showToast('Skill deleted successfully', 'success');
      onRefresh();
    } catch (error: unknown) {
      const err = error as ApiError;
      showToast(err.response?.data?.message || err.message || 'Failed to delete skill', 'error');
    }
  };

  const handleDeleteEducation = async (educationId: number) => {
    if (!profile?.id) return;
    if (!window.confirm("Are you sure you want to delete this education record?")) return;
    try {
      await employeeApi.deleteEmployeeEducation(profile.id, educationId);
      showToast('Education deleted successfully', 'success');
      onRefresh();
    } catch (error: unknown) {
      const err = error as ApiError;
      showToast(err.response?.data?.message || err.message || 'Failed to delete education', 'error');
    }
  };

  const handleDeleteContact = async (contactId: number) => {
    if (!profile?.id) return;
    if (!window.confirm("Are you sure you want to delete this contact?")) return;
    try {
      await employeeApi.deleteEmployeeContact(profile.id, contactId);
      showToast('Contact deleted successfully', 'success');
      onRefresh();
    } catch (error: unknown) {
      const err = error as ApiError;
      showToast(err.response?.data?.message || err.message || 'Failed to delete contact', 'error');
    }
  };



  const openCustomFieldModal = (section: string) => {
    setCustomFieldModal({ isOpen: true, section });
  };

  const renderCustomFields = (sectionName: string) => {
    return profile?.customFields?.filter(f => f.section === sectionName).map(field => (
       <CustomEditableDataField 
          key={field.id}
          label={field.field_name}
          value={field.field_value}
          fieldName={String(field.id)}
          onSave={(id, val) => handleCustomFieldSave(Number(id), val)}
          onDelete={() => handleCustomFieldDelete(field.id)}
          icon={Hash} 
       />
    ));
  };

  if (loading) return (
    <div className="p-8 text-center bg-gray-50 rounded-lg border border-gray-200 animate-pulse">
      <div className="h-16 w-16 bg-gray-200 rounded-full mx-auto mb-4"></div>
      <div className="h-4 w-48 bg-gray-200 rounded mx-auto"></div>
    </div>
  );

  if (error || !profile) return (
    <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg flex items-center gap-2">
      <AlertCircle size={18} />
      <span className="text-sm font-bold">Failed to load profile data.</span>
      <button onClick={onRefresh} className="ml-auto text-xs underline">Retry</button>
    </div>
  );

  const formatDate = (dateStr: string | undefined | null): string | null => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const formatDateForInput = (dateVal: string | number | Date | undefined | null): string => {
    if (!dateVal) return '';
    try {
      if (typeof dateVal === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateVal)) return dateVal;
      
      const d = new Date(dateVal);
      
      if (isNaN(d.getTime())) return String(dateVal);
      
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (e) {
      console.error("Date parsing error:", e);
      return String(dateVal);
    }
  };

  const currentStatus = profile.employment_status || profile.employmentStatus || 'Active';
  const isNegativeStatus = ['Terminated', 'Suspended', 'Show Cause', 'Verbal Warning', 'Written Warning'].includes(currentStatus);
  const isActive = currentStatus === 'Active';

  const handleStatusToggle = async () => {
    if (!onStatusChange || statusLoading) return;
    setStatusLoading(true);
    try {
      const newStatus = isActive ? currentStatus : 'Active';
      await onStatusChange(profile.id, newStatus);
    } finally {
      setStatusLoading(false);
    }
  };

  const genderOptions = [{ value: 'Male', label: 'Male' }, { value: 'Female', label: 'Female' }];
  const civilStatusOptions = [
    { value: 'Single', label: 'Single' }, { value: 'Married', label: 'Married' },
    { value: 'Widowed', label: 'Widowed' }, { value: 'Separated', label: 'Separated' }, { value: 'Annulled', label: 'Annulled' }
  ];
  const bloodTypeOptions = [
    { value: 'A+', label: 'A+' }, { value: 'A-', label: 'A-' },
    { value: 'B+', label: 'B+' }, { value: 'B-', label: 'B-' },
    { value: 'O+', label: 'O+' }, { value: 'O-', label: 'O-' },
    { value: 'AB+', label: 'AB+' }, { value: 'AB-', label: 'AB-' }
  ];

  return (
    <div className="w-full bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-12">
      
      {/* HEADER - Same as original */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 text-white relative">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-lg bg-gray-700 border-2 border-white/20 shadow-lg overflow-hidden flex items-center justify-center">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-black text-gray-500">{profile.first_name?.[0]}{profile.last_name?.[0]}</span>
              )}
            </div>
            <div className={`absolute -bottom-2 -right-2 text-white text-[10px] font-bold px-2 py-0.5 rounded border border-gray-800 ${isNegativeStatus ? 'bg-red-600' : 'bg-green-600'}`}>
              {currentStatus}
            </div>
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl font-bold tracking-tight mb-1">
              {profile.last_name ? profile.last_name + ', ' : ''}
              {profile.first_name} 
              {profile.middle_name ? ' ' + profile.middle_name : ''}
              {profile.suffix ? ' ' + profile.suffix : ''}
            </h1>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-gray-300 text-xs font-medium">
              <span className="flex items-center gap-1.5 bg-white/10 px-2 py-1 rounded">
                <Briefcase size={12} /> {profile.position_title || profile.job_title || profile.jobTitle || 'No Title'}
              </span>
              <span className="flex items-center gap-1.5 bg-white/10 px-2 py-1 rounded">
                <Hash size={12} /> {formatEmployeeId(profile.employee_id || profile.employeeId)}
              </span>
              <span className="flex items-center gap-1.5 bg-white/10 px-2 py-1 rounded">
                <Mail size={12} /> {profile.email}
              </span>
              <span className="flex items-center gap-1.5 bg-blue-500/20 text-blue-200 px-2 py-1 rounded border border-blue-500/30">
                <Clock size={12} /> Duties: {profile.duties || 'No Schedule'}
              </span>
            </div>
          </div>

          <div className="hidden md:flex flex-col items-end gap-3">
            <div className="text-right">
              <p className="text-[10px] text-gray-400 font-medium mb-1">Department</p>
              <p className="text-lg font-bold text-white">{profile.department}</p>
            </div>
            
            {isAdmin && isNegativeStatus && (
              <button onClick={handleStatusToggle} disabled={statusLoading}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-all border border-white/20"
                title="Click to reactivate employee">
                {statusLoading ? <Loader2 size={16} className="animate-spin" /> : <ToggleLeft size={16} className="text-red-400" />}
                <span className="text-xs font-semibold">Reactivate</span>
              </button>
            )}
            {isAdmin && isActive && (
              <div className="flex items-center gap-2 bg-green-500/20 px-3 py-1.5 rounded-lg border border-green-500/30">
                <ToggleRight size={16} className="text-green-400" />
                <span className="text-xs font-semibold text-green-300">Active</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DATA GRID - Same layout, but with editable fields */}
      <div className="p-6">
        
        {/* PERSONAL INFORMATION */}
        <Section title="Personal Information" icon={User}>
          <EditableDataField label="Last Name" value={profile.last_name} fieldName="last_name" onSave={handleFieldSave} />
          <EditableDataField label="First Name" value={profile.first_name} fieldName="first_name" onSave={handleFieldSave} />
          <EditableDataField label="Middle Name" value={profile.middle_name} fieldName="middle_name" onSave={handleFieldSave} />
          <EditableDataField label="Suffix" value={profile.suffix} fieldName="suffix" onSave={handleFieldSave} />
          <EditableDataField 
            label="Birth Date" 
            value={formatDateForInput(profile.birth_date)} 
            fieldName="birth_date" 
            icon={Calendar} 
            inputType="date" 
            onSave={handleFieldSave} 
          />
          <EditableDataField label="Place of Birth" value={profile.place_of_birth} fieldName="place_of_birth" icon={MapPin} onSave={handleFieldSave} />
          <EditableDataField label="Gender" value={profile.gender} fieldName="gender" inputType="select" options={genderOptions} onSave={handleFieldSave} />
          <EditableDataField label="Civil Status" value={profile.civil_status} fieldName="civil_status" inputType="select" options={civilStatusOptions} onSave={handleFieldSave} />
          <EditableDataField label="Nationality" value={profile.nationality} fieldName="nationality" icon={Flag} onSave={handleFieldSave} />
          <EditableDataField label="Citizenship" value={profile.citizenship} fieldName="citizenship" icon={Flag} onSave={handleFieldSave} />
          <EditableDataField label="Citizenship Type" value={profile.citizenship_type} fieldName="citizenship_type" inputType="select" options={[
            {value:'By Birth',label:'By Birth'},{value:'By Naturalization',label:'By Naturalization'}
          ]} onSave={handleFieldSave} />
          <EditableDataField label="Blood Type" value={profile.blood_type} fieldName="blood_type" inputType="select" options={bloodTypeOptions} onSave={handleFieldSave} />
          <EditableDataField label="Height (m)" value={profile.height_m} fieldName="height_m" icon={Ruler} inputType="number" step="0.01" placeholder="e.g. 1.70" onSave={handleFieldSave} />
          <EditableDataField label="Weight (kg)" value={profile.weight_kg} fieldName="weight_kg" icon={Scale} inputType="number" step="0.01" placeholder="e.g. 65.5" onSave={handleFieldSave} />
          
          <EditableDataField label="Residential Address" value={profile.residential_address} fieldName="residential_address" fullWidth icon={MapPin} inputType="textarea" onSave={handleFieldSave} />
          <EditableDataField label="Residential ZIP" value={profile.residential_zip_code} fieldName="residential_zip_code" icon={MapPin} onSave={handleFieldSave} />
          
          <EditableDataField label="Permanent Address" value={profile.permanent_address} fieldName="permanent_address" fullWidth icon={MapPin} inputType="textarea" onSave={handleFieldSave} />
          <EditableDataField label="Permanent ZIP" value={profile.permanent_zip_code} fieldName="permanent_zip_code" icon={MapPin} onSave={handleFieldSave} />
          
          {renderCustomFields("Personal Information")}
          <AddCard label="Add Card" onClick={() => openCustomFieldModal("Personal Information")} />
        </Section>

        {/* EMPLOYMENT RECORD */}
        <Section title="Employment Record" icon={Briefcase}>
          <DataField label="Employee ID" value={formatEmployeeId(profile.employee_id || profile.employeeId)} icon={Hash} highlight />
          <EditableDataField label="Position Title" value={profile.position_title || profile.job_title} fieldName="position_title" highlight onSave={handleFieldSave} />
          <EditableDataField label="Item Number" value={profile.item_number} fieldName="item_number" icon={Hash} onSave={handleFieldSave} />
          <EditableDataField label="Agency Employee No." value={profile.agency_employee_no} fieldName="agency_employee_no" icon={Hash} onSave={handleFieldSave} />
          <DataField label="Department" value={profile.department} icon={Building} />
          <EditableDataField label="Salary Grade" value={profile.salary_grade || profile.salaryGrade} fieldName="salary_grade" icon={CreditCard} inputType="number" onSave={handleFieldSave} />
          <EditableDataField label="Step Increment" value={profile.step_increment || profile.stepIncrement} fieldName="step_increment" icon={Hash} inputType="number" onSave={handleFieldSave} />
          <EditableDataField label="Appointment Type" value={profile.appointment_type} fieldName="appointment_type" inputType="select" options={[
            {value:'Permanent',label:'Permanent'},{value:'Contractual',label:'Contractual'},{value:'Casual',label:'Casual'},
            {value:'Job Order',label:'Job Order'},{value:'Coterminous',label:'Coterminous'},{value:'Temporary',label:'Temporary'}
          ]} onSave={handleFieldSave} />
          <EditableDataField label="Employment Status" value={profile.employment_status || profile.employmentStatus} fieldName="employment_status" inputType="select" options={[
            {value:'Active',label:'Active'},{value:'Probationary',label:'Probationary'},{value:'Terminated',label:'Terminated'},
            {value:'Resigned',label:'Resigned'},{value:'On Leave',label:'On Leave'},{value:'Suspended',label:'Suspended'},
            {value:'Verbal Warning',label:'Verbal Warning'},{value:'Written Warning',label:'Written Warning'},{value:'Show Cause',label:'Show Cause'}
          ]} onSave={handleFieldSave} />
          <EditableDataField label="Station" value={profile.station} fieldName="station" icon={Building} onSave={handleFieldSave} />
          <EditableDataField label="Office Address" value={profile.office_address} fieldName="office_address" fullWidth icon={MapPin} inputType="textarea" onSave={handleFieldSave} />
          <EditableDataField 
            label="Date Hired" 
            value={formatDateForInput(profile.date_hired)}
            formattedValue={formatDate(profile.date_hired || profile.dateHired)}
            fieldName="date_hired" 
            icon={Calendar} 
            inputType="date" 
            onSave={handleFieldSave} 
          />
          <EditableDataField 
            label="Orig. Appointment" 
            value={formatDateForInput(profile.original_appointment_date)} 
            formattedValue={formatDate(profile.original_appointment_date)}
            fieldName="original_appointment_date" 
            icon={Calendar} 
            inputType="date" 
            onSave={handleFieldSave} 
          />
          <EditableDataField 
            label="Last Promotion" 
            value={formatDateForInput(profile.last_promotion_date)}
            formattedValue={formatDate(profile.last_promotion_date)} 
            fieldName="last_promotion_date" 
            icon={Calendar} 
            inputType="date" 
            onSave={handleFieldSave} 
          />
          <DataField 
            label="Next Step Increment" 
            value={`${formatDate(nextStepData?.nextStepDate)}${nextStepData?.totalLwopDays ? ` (Delayed by ${nextStepData.totalLwopDays} LWOP days)` : ''}`} 
            icon={Calendar} 
            highlight 
          />
          <DataField label="First Day of Service" value={formatDate(profile.first_day_of_service)} icon={Clock} />
          <DataField label="Supervisor" value={profile.supervisor} icon={UserCheck} />
          <EditableDataField label="Current Duties" value={profile.duties} fieldName="duties" icon={Clock} highlight onSave={handleFieldSave} />
          <DataField label="System Role" value={profile.role} icon={Shield} />
          {renderCustomFields("Employment Record")}
          <AddCard label="Add Card" onClick={() => openCustomFieldModal("Employment Record")} />
        </Section>

        {/* GOVERNMENT IDS */}
        <Section title="Government Identification" icon={Shield}>
          <EditableDataField label="UMID ID" value={profile.umid_id} fieldName="umid_id" onSave={handleFieldSave} />
          <EditableDataField label="PHILSYS ID" value={profile.philsys_id} fieldName="philsys_id" onSave={handleFieldSave} />
          <EditableDataField label="GSIS No." value={profile.gsis_number} fieldName="gsis_number" onSave={handleFieldSave} />
          <EditableDataField label="PhilHealth No." value={profile.philhealth_number} fieldName="philhealth_number" onSave={handleFieldSave} />
          <EditableDataField label="Pag-IBIG No." value={profile.pagibig_number} fieldName="pagibig_number" onSave={handleFieldSave} />
          <EditableDataField label="TIN" value={profile.tin_number} fieldName="tin_number" onSave={handleFieldSave} />
          {renderCustomFields("Government Identification")}
          <AddCard label="Add Card" onClick={() => openCustomFieldModal("Government Identification")} />
        </Section>

        {/* ELIGIBILITY & QUALIFICATIONS */}
        <Section title="Eligibility & Qualifications" icon={Award}>
          <EditableDataField label="Eligibility Type" value={profile.eligibility_type} fieldName="eligibility_type" onSave={handleFieldSave} />
          <EditableDataField label="Eligibility No." value={profile.eligibility_number} fieldName="eligibility_number" icon={Hash} onSave={handleFieldSave} />
          <EditableDataField label="Eligibility Date" value={formatDateForInput(profile.eligibility_date)} fieldName="eligibility_date" icon={Calendar} inputType="date" onSave={handleFieldSave} />
          <EditableDataField label="Highest Education" value={profile.highest_education} fieldName="highest_education" icon={GraduationCap} onSave={handleFieldSave} />
          <EditableDataField label="Educational Background" value={profile.educational_background} fieldName="educational_background" onSave={handleFieldSave} />
          <EditableDataField label="Years of Experience" value={profile.years_of_experience} fieldName="years_of_experience" inputType="number" onSave={handleFieldSave} />
          {renderCustomFields("Eligibility & Qualifications")}
          <AddCard label="Add Card" onClick={() => openCustomFieldModal("Eligibility & Qualifications")} />
        </Section>

        {/* EDUCATION */}
        <Section title="Educational Background" icon={GraduationCap} columns="grid-cols-1">
          {profile.education && profile.education.length > 0 && (
            <div className="border border-gray-200 rounded-md overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-2">Level</th>
                    <th className="px-4 py-2">School / Institution</th>
                    <th className="px-4 py-2">Degree / Course</th>
                    <th className="px-4 py-2">Year</th>
                    <th className="px-4 py-2 w-20">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {profile.education.map((edu, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-2 font-bold text-gray-700">{edu.type || 'N/A'}</td>
                      <td className="px-4 py-2 text-gray-800">{edu.institution}</td>
                      <td className="px-4 py-2 text-gray-900 font-medium">{edu.degree || edu.field_of_study || '-'}</td>
                      <td className="px-4 py-2 text-gray-500">{edu.start_date ? new Date(edu.start_date).getFullYear() : 'N/A'} - {edu.end_date ? new Date(edu.end_date).getFullYear() : 'Present'}</td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex items-center justify-end gap-2">
                           <button 
                             onClick={() => { setEditingEducation(edu); setShowAddEducation(true); }}
                             className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                             title="Edit"
                           >
                             <Pencil size={14} />
                           </button>
                           <button 
                             onClick={() => handleDeleteEducation(edu.id)}
                             className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                             title="Delete"
                           >
                             <Trash2 size={14} />
                           </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <AddCard label="Add Education" onClick={() => setShowAddEducation(true)} />
        </Section>

        {/* SKILLS */}
        <Section title="Skills & Competencies" icon={Award} columns="grid-cols-2 md:grid-cols-4">
          {profile.skills && profile.skills.map((skill, idx) => (
            <div key={idx} className="flex items-center justify-between border border-gray-200 rounded p-2 bg-gray-50 group">
              <span className="text-xs font-bold text-gray-700">{skill.skill_name}</span>
              <span className="text-[10px] font-medium text-gray-500">{skill.proficiency_level || 'N/A'}</span>
              <div className="ml-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                 <button 
                   onClick={() => { setEditingSkill(skill); setShowAddSkill(true); }}
                   className="p-1 text-gray-400 hover:text-blue-600"
                 >
                   <Pencil size={12} />
                 </button>
                 <button 
                   onClick={() => handleDeleteSkill(skill.id)}
                   className="p-1 text-gray-400 hover:text-red-600"
                 >
                   <Trash2 size={12} />
                 </button>
              </div>
            </div>
          ))}
          <AddCard label="Add Skill" onClick={() => setShowAddSkill(true)} />
        </Section>

        {/* CONTACT & EMERGENCY */}
        <Section title="Contact & Emergency" icon={Phone}>
          <EditableDataField label="Mobile Number" value={profile.phone_number || profile.mobile_no} fieldName="phone_number" icon={Phone} inputType="tel" onSave={handleFieldSave} />
          <EditableDataField label="Telephone No." value={profile.telephone_no} fieldName="telephone_no" icon={Phone} inputType="tel" onSave={handleFieldSave} />
          <EditableDataField label="Official Email" value={profile.email} fieldName="email" icon={Mail} inputType="email" onSave={handleFieldSave} />
          <EditableDataField label="Emergency Contact Person" value={profile.emergency_contact} fieldName="emergency_contact" icon={User} onSave={handleFieldSave} />
          <EditableDataField label="Emergency Phone" value={profile.emergency_contact_number} fieldName="emergency_contact_number" icon={Phone} inputType="tel" onSave={handleFieldSave} />
        </Section>

        <Section title="Emergency Contacts" icon={Heart} columns="grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
           {profile.emergencyContacts && profile.emergencyContacts.map((contact, idx) => (
             <div key={idx} className="flex flex-col border border-gray-200 rounded-md p-3 bg-white relative group">
                <div className="flex items-center justify-between mb-2">
                   <h4 className="text-sm font-bold text-gray-800">{contact.name}</h4>
                   {idx === 0 && <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Primary</span>}
                </div>
                <div className="flex flex-col gap-1 text-xs text-gray-600">
                   <span className="flex items-center gap-1.5"><User size={12} className="text-gray-400"/> {contact.relationship}</span>
                   <span className="flex items-center gap-1.5"><Phone size={12} className="text-gray-400"/> {contact.phone_number}</span>
                   {contact.address && <span className="flex items-center gap-1.5"><MapPin size={12} className="text-gray-400"/> {contact.address}</span>}
                </div>
                <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 p-0.5 rounded shadow-sm">
                   <button 
                     onClick={() => { setEditingContact(contact); setShowAddContact(true); }}
                     className="p-1 text-gray-400 hover:text-blue-600"
                     title="Edit"
                   >
                     <Pencil size={12} />
                   </button>
                   <button 
                     onClick={() => handleDeleteContact(contact.id)}
                     className="p-1 text-gray-400 hover:text-red-600"
                     title="Delete"
                   >
                     <Trash2 size={12} />
                   </button>
                </div>
             </div>
           ))}
           {/* Fallback for legacy single fields if array is empty but fields exist */}
           {(!profile.emergencyContacts || profile.emergencyContacts.length === 0) && (profile.emergency_contact || profile.emergency_contact_number) && (
              <div className="flex flex-col border border-gray-200 rounded-md p-3 bg-white relative opacity-75">
                <div className="flex items-center justify-between mb-2">
                   <h4 className="text-sm font-bold text-gray-800">{profile.emergency_contact}</h4>
                   <span className="text-[10px] italic text-gray-400">Legacy</span>
                </div>
                <div className="flex flex-col gap-1 text-xs text-gray-600">
                   <span className="flex items-center gap-1.5"><Phone size={12} className="text-gray-400"/> {profile.emergency_contact_number}</span>
                </div>
             </div>
           )}
           <AddCard label="Add Contact" onClick={() => setShowAddContact(true)} />
        </Section>

        {/* SOCIAL MEDIA */}
        <Section title="Social Media" icon={User} columns="grid-cols-1 md:grid-cols-3">
          <EditableDataField label="Facebook" value={profile.facebook_url} fieldName="facebook_url" icon={Facebook} inputType="url" onSave={handleFieldSave} />
          <EditableDataField label="LinkedIn" value={profile.linkedin_url} fieldName="linkedin_url" icon={Linkedin} inputType="url" onSave={handleFieldSave} />
          <EditableDataField label="Twitter/X" value={profile.twitter_handle} fieldName="twitter_handle" icon={Twitter} onSave={handleFieldSave} />
        </Section>

      </div>

      <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-between items-center">
        <p className="text-[10px] text-gray-400 font-medium">System Generated Record • NEBR HRIS</p>
        <div className="flex gap-2">
          <span className="flex items-center gap-1.5 text-xs font-bold text-gray-700 bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
            <CheckCircle size={12} /> Verified Record
          </span>
        </div>
      </div>

      {profile?.id && (
        <>
          <AddSkillModal 
            isOpen={showAddSkill} 
            onClose={() => { setShowAddSkill(false); setEditingSkill(null); }} 
            employeeId={profile.id} 
            initialData={editingSkill || undefined}
            onSuccess={onRefresh}
          />
          <AddEducationModal
            isOpen={showAddEducation}
            onClose={() => { setShowAddEducation(false); setEditingEducation(null); }}
            employeeId={profile.id}
            initialData={editingEducation || undefined}
            onSuccess={onRefresh}
          />
          <AddContactModal
            isOpen={showAddContact}
            onClose={() => { setShowAddContact(false); setEditingContact(null); }}
            employeeId={profile.id}
            initialData={editingContact || undefined}
            onSuccess={onRefresh}
          />
          <AddCustomFieldModal
            isOpen={customFieldModal.isOpen}
            onClose={() => setCustomFieldModal({ ...customFieldModal, isOpen: false })}
            employeeId={profile.id}
            section={customFieldModal.section}
            onSuccess={onRefresh}
          />
        </>
      )}

    </div>
  );
};

export default EditableProfileView;
