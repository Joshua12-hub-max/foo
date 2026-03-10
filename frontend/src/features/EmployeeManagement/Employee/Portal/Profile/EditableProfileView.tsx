import React, { useState, useCallback } from 'react';
import { 
  AlertCircle, Loader2,
  Pencil, X, Check, Plus, Trash2,
  ToggleLeft, ToggleRight, Briefcase, Hash, Mail, Clock,
  Calendar as LucideCalendar, Phone, Heart, Building, Link as LinkIcon, ScanLine
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { employeeApi } from '@/api/employeeApi';
import { ApiError, Education, Skill, EmergencyContact, CustomField, EmployeeDetailed } from '@/types';
import { useToastStore } from '@/stores';
import AddSkillModal from './Modals/AddSkillModal';
import AddEducationModal from './Modals/AddEducationModal';
import AddContactModal from './Modals/AddContactModal';
import AddCustomFieldModal from './Modals/AddCustomFieldModal';
import AddFamilyModal from './Modals/AddFamilyModal';
import AddExperienceModal from './Modals/AddExperienceModal';
import AddVoluntaryWorkModal from './Modals/AddVoluntaryWorkModal';
import AddTrainingModal from './Modals/AddTrainingModal';
import AddOtherInfoModal from './Modals/AddOtherInfoModal';
import AddReferenceModal from './Modals/AddReferenceModal';
import { formatEmployeeId } from '@/utils/formatters';
import { 
  FamilyMember, WorkplaceExperience, VoluntaryWork, 
  LearningDevelopment, PdsOtherInfo, PdsReference 
} from '@/types';

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
  experience?: string | null;
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
  icon?: LucideIcon;
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

// Clean Editable Field Component - Matches Register.tsx styling but with inline editing
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
  const [editValue, setEditValue] = useState(String(value ?? ''));
  const [saving, setSaving] = useState(false);

  const handleEdit = () => {
    setEditValue(String(value ?? ''));
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditValue(String(value ?? ''));
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (saving) return;

    // Prevent redundant saves if value hasn't changed
    const finalValue = inputType === 'number' ? Number(editValue) : editValue;
    if (String(finalValue) === String(value ?? '')) {
      setIsEditing(false);
      return;
    }

    setSaving(true);
    try {
      await onSave(fieldName, finalValue);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (inputType === 'textarea') {
      if (e.key === 'Enter' && e.ctrlKey) handleSave();
      else if (e.key === 'Escape') handleCancel();
    } else {
      if (e.key === 'Enter') handleSave();
      else if (e.key === 'Escape') handleCancel();
    }
  };

  const inputStyle = "w-full px-3 py-1.5 text-sm border-[1.5px] rounded-[8px] bg-white border-green-200 focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-500 transition-all";

  return (
    <div className={`space-y-1 ${fullWidth ? 'col-span-full' : ''}`}>
      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">{label}</label>
      
      <div className={`relative min-h-[38px] group rounded-[10px] border-[1.5px] transition-all ${
        isEditing ? 'border-green-500 ring-2 ring-green-50' : 'border-gray-200 bg-gray-50/50 hover:border-gray-300 hover:bg-white'
      } ${highlight ? 'bg-green-50/30' : ''}`}>
        
        {isEditing ? (
          <div className="flex items-center gap-2 p-1.5 w-full">
            {inputType === 'select' ? (
              <select
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className={inputStyle}
                autoFocus
              >
                <option value="">Select...</option>
                {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            ) : inputType === 'textarea' ? (
              <textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className={`${inputStyle} min-h-[80px]`}
                autoFocus
              />
            ) : (
              <input
                type={inputType}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className={inputStyle}
                autoFocus
                step={step}
                placeholder={placeholder}
              />
            )}
            <div className="flex flex-col gap-1 pr-1">
              {saving ? <Loader2 size={14} className="animate-spin text-green-600" /> : (
                <button onClick={handleSave} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check size={14} /></button>
              )}
              <button onClick={handleCancel} className="p-1 text-red-400 hover:bg-red-50 rounded"><X size={14} /></button>
            </div>
          </div>
        ) : (
          <div 
            className="flex items-center px-3 py-2 cursor-text h-full w-full"
            onClick={editable ? handleEdit : undefined}
          >
            {Icon && <Icon size={14} className="text-gray-400 mr-2 shrink-0" />}
            <span className={`text-sm font-semibold truncate flex-1 ${highlight ? 'text-green-900' : 'text-gray-700'}`}>
              {formattedValue || value || <span className="text-gray-300 font-normal italic">N/A</span>}
            </span>
            {editable && (
              <Pencil size={11} className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity ml-2" />
            )}
          </div>
        )}
      </div>
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
    if (saving) return;
    
    // Prevent redundant saves if value hasn't changed
    if (editValue === String(value ?? '')) {
      setIsEditing(false);
      return;
    }

    setSaving(true);
    try {
      await onSave(fieldName, editValue);
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`flex flex-col rounded-lg p-3 bg-white group hover:bg-gray-50 transition-all h-full ${colSpanClass} relative border border-dashed border-gray-200 hover:border-gray-300`}>
      {/* Delete Button */}
      <button 
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="absolute top-1.5 right-1.5 p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all z-20"
        title="Delete Field"
      >
        <Trash2 size={12} />
      </button>

      {/* Label */}
      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1 pr-5">
          {label}
      </span>

      {/* Value Row */}
      {isEditing ? (
        <div className="flex items-start gap-1 w-full">
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="flex-1 text-sm font-medium text-gray-800 border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-gray-200 min-w-0 resize-y min-h-[60px]"
              autoFocus
            />
            <div className="flex flex-col gap-0.5 shrink-0">
                 <button onMouseDown={(e) => e.preventDefault()} onClick={handleSaveValue} disabled={saving} className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-md">
                   {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                 </button>
                 <button onMouseDown={(e) => e.preventDefault()} onClick={() => { setIsEditing(false); setEditValue(String(value||'')); }} className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md">
                   <X size={14} />
                 </button>
            </div>
        </div>
      ) : (
        <div className="group/value relative h-full">
             <span className="text-sm font-semibold break-words whitespace-pre-wrap text-gray-700 block min-h-[20px]">
               {value || <span className="text-gray-300 font-normal">-</span>}
             </span>
             <button
                onClick={() => { setEditValue(String(value||'')); setIsEditing(true); }}
                className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 p-0.5 text-gray-300 hover:text-gray-500 transition-all"
             >
                <Pencil size={11} />
             </button>
             <div 
                className="absolute inset-0 cursor-text" 
                onClick={() => { setEditValue(String(value||'')); setIsEditing(true); }} 
             />
        </div>
      )}
    </div>
  );
};

// Read-only DataField component
const DataField: React.FC<{label: string; value?: string | number | null; icon?: LucideIcon; fullWidth?: boolean; highlight?: boolean}> = ({ 
  label, value, fullWidth = false, highlight = false 
}) => {
  const getColSpanClass = () => {
    if (fullWidth) return 'col-span-full';
    const len = String(value || '').length;
    if (len > 50) return 'col-span-1 md:col-span-3 lg:col-span-4'; 
    if (len > 25) return 'col-span-1 md:col-span-2';
    return '';
  };
  
  return (
    <div className={`flex flex-col rounded-lg p-3 ${getColSpanClass()} ${highlight ? 'bg-gray-50 border border-gray-200' : 'bg-white'}`}>
      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</span>
      <span className={`text-sm font-semibold truncate ${highlight ? 'text-gray-900' : 'text-gray-700'}`}>
        {value || <span className="text-gray-300 font-normal">-</span>}
      </span>
    </div>
  );
};

// Section Container matching Register.tsx card styling
const Section: React.FC<SectionProps> = ({ title, children, columns = "grid-cols-1 md:grid-cols-2 lg:grid-cols-4" }) => (
  <div className="bg-white p-5 rounded-[15px] border border-gray-100 shadow-sm space-y-4 mb-6 relative overflow-hidden">
    <h4 className="text-sm font-bold text-gray-800 tracking-wide uppercase border-b border-gray-100 pb-2 mb-3 flex items-center gap-2">
      {title}
    </h4>
    <div className={`grid ${columns} gap-4`}>
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
  
  const [showAddFamily, setShowAddFamily] = useState(false);
  const [editingFamily, setEditingFamily] = useState<FamilyMember | null>(null);
  
  const [showAddExperience, setShowAddExperience] = useState(false);
  const [editingExperience, setEditingExperience] = useState<WorkplaceExperience | null>(null);
  
  const [showAddVoluntary, setShowAddVoluntary] = useState(false);
  const [editingVoluntary, setEditingVoluntary] = useState<VoluntaryWork | null>(null);
  
  const [showAddTraining, setShowAddTraining] = useState(false);
  const [editingTraining, setEditingTraining] = useState<LearningDevelopment | null>(null);
  
  const [showAddOtherInfo, setShowAddOtherInfo] = useState(false);
  const [editingOtherInfo, setEditingOtherInfo] = useState<PdsOtherInfo | null>(null);
  
  const [showAddReference, setShowAddReference] = useState(false);
  const [editingReference, setEditingReference] = useState<PdsReference | null>(null);

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
          await employeeApi.updateEmployeeCustomField(profile.id, fieldId, { fieldValue: String(value) });
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

  const handleDeletePdsItem = async (section: string, itemId: number, items: any[]) => {
    if (!profile?.id) return;
    if (!window.confirm(`Are you sure you want to delete this ${section.replace('_', ' ')} record?`)) return;
    
    try {
      const remainingItems = items.filter(item => item.id !== itemId);
      await employeeApi.updatePdsSection(profile.id, section, remainingItems);
      showToast('Deleted successfully', 'success');
      onRefresh();
    } catch (error: unknown) {
      const err = error as ApiError;
      showToast(err.response?.data?.message || err.message || 'Failed to delete', 'error');
    }
  };



  const openCustomFieldModal = (section: string) => {
    setCustomFieldModal({ isOpen: true, section });
  };

  const renderCustomFields = (sectionName: string) => {
    return profile?.customFields?.filter(f => f.section === sectionName).map(field => (
       <CustomEditableDataField 
          key={field.id}
          label={field.fieldName}
          value={field.fieldValue}
          fieldName={String(field.id)}
          onSave={(id, val) => handleCustomFieldSave(Number(id), val)}
          onDelete={() => handleCustomFieldDelete(field.id)}
          
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

  // Helper to calculate age
  const calculateAge = (birthDate: string | undefined | null): number | null => {
    if (!birthDate) return null;
    try {
      const birth = new Date(birthDate);
      const today = new Date();
      if (isNaN(birth.getTime())) return null;
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return age;
    } catch {
      return null;
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

  const currentStatus = profile.employmentStatus || 'Active';
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
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-black text-gray-500">{profile.firstName?.[0]}{profile.lastName?.[0]}</span>
              )}
            </div>
            <div className={`absolute -bottom-2 -right-2 text-white text-[10px] font-bold px-2 py-0.5 rounded border border-gray-800 ${isNegativeStatus ? 'bg-red-600' : 'bg-green-600'}`}>
              {currentStatus}
            </div>
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl font-bold tracking-tight mb-1">
              {profile.lastName ? profile.lastName + ', ' : ''}
              {profile.firstName} 
              {profile.middleName ? ' ' + profile.middleName : ''}
              {profile.suffix ? ' ' + profile.suffix : ''}
              {calculateAge(profile.birthDate)! >= 60 && (
                <span className="ml-3 text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded-full uppercase tracking-tighter align-middle font-black shadow-sm border border-amber-400/50">
                  Senior Citizen
                </span>
              )}
            </h1>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-gray-300 text-xs font-medium">
              <span className="flex items-center gap-1.5 bg-white/10 px-2 py-1 rounded">
                <Briefcase size={12} /> {profile.positionTitle || profile.jobTitle || 'No Title'}
              </span>
              <span className="flex items-center gap-1.5 bg-white/10 px-2 py-1 rounded">
                <Hash size={12} /> {formatEmployeeId(profile.employeeId)}
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

      {/* DATA GRID - REORGANIZED SECTIONS */}
      <div className="p-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
        
        {/* PERSONAL INFORMATION */}
        <Section title="Personal Information">
          <EditableDataField label="Last Name" value={profile.lastName} fieldName="lastName" onSave={handleFieldSave} />
          <EditableDataField label="First Name" value={profile.firstName} fieldName="firstName" onSave={handleFieldSave} />
          <EditableDataField label="Middle Name" value={profile.middleName} fieldName="middleName" onSave={handleFieldSave} />
          <EditableDataField label="Suffix" value={profile.suffix} fieldName="suffix" onSave={handleFieldSave} />
          <EditableDataField 
            label="Birth Date" 
            value={formatDateForInput(profile.birthDate)} 
            fieldName="birthDate" 
            icon={LucideCalendar}
            inputType="date" 
            onSave={handleFieldSave} 
          />
          <EditableDataField label="Place of Birth" value={profile.placeOfBirth} fieldName="placeOfBirth" onSave={handleFieldSave} />
          <EditableDataField label="Gender" value={profile.gender} fieldName="gender" inputType="select" options={genderOptions} onSave={handleFieldSave} />
          <EditableDataField label="Civil Status" value={profile.civilStatus} fieldName="civilStatus" inputType="select" options={civilStatusOptions} onSave={handleFieldSave} />
          <EditableDataField label="Nationality" value={profile.nationality} fieldName="nationality" onSave={handleFieldSave} />
          <EditableDataField label="Religion" value={profile.religion} fieldName="religion" onSave={handleFieldSave} />
          <EditableDataField label="Citizenship" value={profile.citizenship} fieldName="citizenship" inputType="select" options={[
            {value:'Filipino', label:'Filipino'}, {value:'Dual Citizenship', label:'Dual Citizenship'}
          ]} onSave={handleFieldSave} />
          {profile.citizenship === 'Dual Citizenship' && (
            <EditableDataField label="Citizenship Type" value={profile.citizenshipType} fieldName="citizenshipType" inputType="select" options={[
              {value:'By Birth', label:'By Birth'}, {value:'By Naturalization', label:'By Naturalization'}
            ]} onSave={handleFieldSave} />
          )}
          <EditableDataField label="Blood Type" value={profile.bloodType} fieldName="bloodType" inputType="select" options={bloodTypeOptions} onSave={handleFieldSave} />
          <EditableDataField label="Height (m)" value={profile.heightM} fieldName="heightM" inputType="number" step="0.01" placeholder="e.g. 1.70" onSave={handleFieldSave} />
          <EditableDataField label="Weight (kg)" value={profile.weightKg} fieldName="weightKg" inputType="number" step="0.01" placeholder="e.g. 65.5" onSave={handleFieldSave} />
          <DataField label="Age" value={calculateAge(profile.birthDate)} highlight={Number(calculateAge(profile.birthDate)) >= 60} />
        </Section>

        {/* CONTACT & ADDRESS */}
        <Section title="Contact & Address" columns="grid-cols-1 md:grid-cols-2">
          <EditableDataField label="Residential Address" value={profile.residentialAddress || profile.address} fieldName="residentialAddress" fullWidth inputType="textarea" onSave={handleFieldSave} />
          <EditableDataField label="Res. House/Block/Lot" value={profile.resHouseBlockLot} fieldName="resHouseBlockLot" onSave={handleFieldSave} />
          <EditableDataField label="Res. Street" value={profile.resStreet} fieldName="resStreet" onSave={handleFieldSave} />
          <EditableDataField label="Res. Subdivision" value={profile.resSubdivision} fieldName="resSubdivision" onSave={handleFieldSave} />
          <EditableDataField label="Res. Barangay" value={profile.resBarangay || profile.barangay} fieldName="resBarangay" onSave={handleFieldSave} />
          <EditableDataField label="Res. City/Municipality" value={profile.resCity} fieldName="resCity" onSave={handleFieldSave} />
          <EditableDataField label="Res. Province" value={profile.resProvince} fieldName="resProvince" onSave={handleFieldSave} />
          <EditableDataField label="Residential ZIP" value={profile.residentialZipCode} fieldName="residentialZipCode" onSave={handleFieldSave} />
          <EditableDataField label="Telephone Number" value={profile.telephoneNo} fieldName="telephoneNo" icon={Phone} onSave={handleFieldSave} />

          <EditableDataField label="Permanent Address" value={profile.permanentAddress} fieldName="permanentAddress" fullWidth inputType="textarea" onSave={handleFieldSave} />
          <EditableDataField label="Perm. House/Block/Lot" value={profile.permHouseBlockLot} fieldName="permHouseBlockLot" onSave={handleFieldSave} />
          <EditableDataField label="Perm. Street" value={profile.permStreet} fieldName="permStreet" onSave={handleFieldSave} />
          <EditableDataField label="Perm. Subdivision" value={profile.permSubdivision} fieldName="permSubdivision" onSave={handleFieldSave} />
          <EditableDataField label="Perm. Barangay" value={profile.permBarangay} fieldName="permBarangay" onSave={handleFieldSave} />
          <EditableDataField label="Perm. City/Municipality" value={profile.permCity} fieldName="permCity" onSave={handleFieldSave} />
          <EditableDataField label="Perm. Province" value={profile.permProvince} fieldName="permProvince" onSave={handleFieldSave} />
          <EditableDataField label="Permanent ZIP" value={profile.permanentZipCode} fieldName="permanentZipCode" onSave={handleFieldSave} />
          <div className="hidden md:block"></div>

          <EditableDataField label="Mobile Number" value={profile.mobileNo || profile.phoneNumber || profile.mobileNo} fieldName="mobileNo" icon={Phone} onSave={handleFieldSave} />
          <EditableDataField label="Official Email" value={profile.email} fieldName="email" icon={Mail} inputType="email" onSave={handleFieldSave} />
          
          <EditableDataField label="Emergency Contact Person" value={profile.emergencyContact} fieldName="emergencyContact" icon={Heart} onSave={handleFieldSave} />
          <EditableDataField label="Emergency Phone" value={profile.emergencyContactNumber} fieldName="emergencyContactNumber" icon={Phone} onSave={handleFieldSave} />
        </Section>
        <Section title="Government Identification">
          <EditableDataField label="GSIS ID No." value={profile.gsisNumber} fieldName="gsisNumber" onSave={handleFieldSave} />
          <EditableDataField label="PAG-IBIG No." value={profile.pagibigNumber} fieldName="pagibigNumber" onSave={handleFieldSave} />
          <EditableDataField label="PhilHealth No." value={profile.philhealthNumber} fieldName="philhealthNumber" onSave={handleFieldSave} />
          <EditableDataField label="UMID Number" value={profile.umidNumber} fieldName="umidNumber" onSave={handleFieldSave} />
          <EditableDataField label="PHILSYS ID" value={profile.philsysId} fieldName="philsysId" onSave={handleFieldSave} />
          <EditableDataField label="TIN No." value={profile.tinNumber} fieldName="tinNumber" onSave={handleFieldSave} />
          <EditableDataField label="Agency Employee No." value={profile.agencyEmployeeNo} fieldName="agencyEmployeeNo" onSave={handleFieldSave} />
        </Section>

        {/* BIOMETRIC & COMPLIANCE */}
        <Section title="Biometric & Compliance" columns="grid-cols-1 md:grid-cols-2">
           <div className="p-4 border border-gray-100 rounded-xl bg-gray-50/30 flex flex-col items-center">
             <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Right Thumbmark URL</h5>
             <EditableDataField 
                label="Thumbmark URL" 
                value={profile.rightThumbmarkUrl} 
                fieldName="rightThumbmarkUrl" 
                onSave={handleFieldSave} 
             />
             {profile.rightThumbmarkUrl && (
               <img src={profile.rightThumbmarkUrl} alt="Right Thumbmark" className="h-24 w-auto mt-4 grayscale contrast-125 mix-blend-multiply" />
             )}
           </div>
           <div className="space-y-4">
             <EditableDataField label="CTC / Cedula No." value={profile.ctcNo} fieldName="ctcNo" onSave={handleFieldSave} />
             <EditableDataField label="CTC Issued At" value={profile.ctcIssuedAt} fieldName="ctcIssuedAt" onSave={handleFieldSave} />
             <EditableDataField 
                label="CTC Issued Date" 
                value={formatDateForInput(profile.ctcIssuedDate)} 
                fieldName="ctcIssuedDate" 
                icon={LucideCalendar} 
                inputType="date" 
                onSave={handleFieldSave} 
             />
           </div>
        </Section>

        {/* SOCIAL MEDIA CONNECTIONS */}
        <Section title="Social Media Connections" icon={LinkIcon} columns="grid-cols-1 md:grid-cols-3">
          <EditableDataField label="Facebook Profile" value={profile.facebookUrl} fieldName="facebookUrl" icon={LinkIcon} onSave={handleFieldSave} />
          <EditableDataField label="LinkedIn Profile" value={profile.linkedinUrl} fieldName="linkedinUrl" icon={LinkIcon} onSave={handleFieldSave} />
          <EditableDataField label="Twitter / X" value={profile.twitterHandle} fieldName="twitterHandle" icon={LinkIcon} onSave={handleFieldSave} />
        </Section>

        {/* EDUCATIONAL BACKGROUND */}
        <Section title="Educational Background" columns="grid-cols-1 md:grid-cols-2">
          <EditableDataField label="Educational Background" value={profile.educationalBackground} fieldName="educationalBackground" onSave={handleFieldSave} />
          <EditableDataField label="School / University" value={profile.schoolName || profile.educationalBackground} fieldName="schoolName" onSave={handleFieldSave} />
          <EditableDataField label="Course / Degree" value={profile.course} fieldName="course" onSave={handleFieldSave} />
          <EditableDataField label="Year Graduated" value={profile.yearGraduated} fieldName="yearGraduated" onSave={handleFieldSave} />
          <EditableDataField label="Years of Experience" value={profile.yearsOfExperience} fieldName="yearsOfExperience" inputType="number" onSave={handleFieldSave} />
          <EditableDataField label="Core Competencies" value={profile.coreCompetencies} fieldName="coreCompetencies" inputType="textarea" placeholder="List key skills..." onSave={handleFieldSave} />
          <EditableDataField label="Work Experience Log" value={profile.experience} fieldName="experience" fullWidth inputType="textarea" onSave={handleFieldSave} />
          
          <div className="col-span-full mt-4">
            <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 ml-1">Structured Educational History</h5>
            {profile.education && profile.education.length > 0 && (
              <div className="border border-gray-100 rounded-xl overflow-hidden bg-white mb-2">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-2">Level</th>
                      <th className="px-4 py-2">Institution</th>
                      <th className="px-4 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {profile.education.map((edu, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50">
                        <td className="px-4 py-2 font-bold text-gray-700">{edu.type || 'N/A'}</td>
                        <td className="px-4 py-2 text-gray-600 truncate max-w-[200px]">{edu.institution}</td>
                        <td className="px-4 py-2 text-right">
                          <button onClick={() => { setEditingEducation(edu); setShowAddEducation(true); }} className="p-1 text-gray-400 hover:text-blue-600"><Pencil size={14} /></button>
                          <button onClick={() => handleDeleteEducation(edu.id)} className="p-1 text-gray-400 hover:text-red-600 ml-1"><Trash2 size={14} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <AddCard label="Add Education Entry" onClick={() => setShowAddEducation(true)} />
          </div>
        </Section>

        {/* ELIGIBILITY / CIVIL SERVICE */}
        <Section title="Eligibility / Civil Service" columns="grid-cols-1 md:grid-cols-3">
          <EditableDataField label="Eligibility Type" value={profile.eligibilityType} fieldName="eligibilityType" onSave={handleFieldSave} />
          <EditableDataField label="License/ID Number" value={profile.eligibilityNumber} fieldName="eligibilityNumber" onSave={handleFieldSave} />
          <EditableDataField label="Date of Validity/Exam" value={formatDateForInput(profile.eligibilityDate)} fieldName="eligibilityDate" inputType="date" onSave={handleFieldSave} />
        </Section>

        {/* FAMILY BACKGROUND */}
        <Section title="Family Background" columns="grid-cols-1">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {['Spouse', 'Father', 'Mother'].map((relation: string) => {
                const member = profile.familyBackground?.find((m: any) => m.relationType === relation);
                return (
                  <div key={relation} className="p-4 border border-gray-100 rounded-xl bg-gray-50/30 group relative">
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      {member ? (
                        <>
                          <button onClick={() => { setEditingFamily(member); setShowAddFamily(true); }} className="p-1 text-gray-400 hover:text-blue-600 bg-white rounded shadow-sm border border-gray-100"><Pencil size={12} /></button>
                          <button onClick={() => handleDeletePdsItem('family', member.id, profile.familyBackground || [])} className="p-1 text-gray-400 hover:text-red-600 bg-white rounded shadow-sm border border-gray-100"><Trash2 size={12} /></button>
                        </>
                      ) : (
                        <button onClick={() => { setEditingFamily({ relationType: relation } as any); setShowAddFamily(true); }} className="p-1 text-gray-400 hover:text-green-600 bg-white rounded shadow-sm border border-gray-100"><Plus size={12} /></button>
                      )}
                    </div>
                    <h5 className="text-[10px] font-bold text-green-600 uppercase tracking-widest mb-3">{relation}'s Information</h5>
                    <div className="space-y-3">
                      <DataField label="Full Name" value={member ? `${member.firstName || ''} ${member.lastName || ''}`.trim() : '-'} />
                      <DataField label="Occupation" value={member?.occupation} />
                      <DataField label="Employer" value={member?.employer} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4">
               <div className="flex justify-between items-center mb-3 ml-1">
                 <h5 className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Children</h5>
                 <button onClick={() => { setEditingFamily(null); setShowAddFamily(true); }} className="text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-widest flex items-center gap-1">
                   <Plus size={12} /> Add Child
                 </button>
               </div>
               <div className="border border-gray-100 rounded-xl overflow-hidden bg-white">
                 <table className="w-full text-xs text-left">
                    <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-100">
                      <tr>
                        <th className="px-4 py-2">Full Name</th>
                        <th className="px-4 py-2">Date of Birth</th>
                        <th className="px-4 py-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {profile.familyBackground?.filter(m => m.relationType === 'Child').length ? (
                        profile.familyBackground.filter(m => m.relationType === 'Child').map((child, idx) => (
                          <tr key={idx} className="hover:bg-gray-50/50">
                            <td className="px-4 py-2 font-medium">{child.firstName} {child.lastName}</td>
                            <td className="px-4 py-2 text-gray-500">{formatDate(child.dateOfBirth)}</td>
                            <td className="px-4 py-2 text-right">
                              <button onClick={() => { setEditingFamily(child); setShowAddFamily(true); }} className="p-1 text-gray-400 hover:text-blue-600"><Pencil size={14} /></button>
                              <button onClick={() => handleDeletePdsItem('family', child.id, profile.familyBackground || [])} className="p-1 text-gray-400 hover:text-red-600 ml-1"><Trash2 size={14} /></button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan={3} className="px-4 py-3 text-center text-gray-400 italic">No children records found</td></tr>
                      )}
                    </tbody>
                 </table>
               </div>
            </div>
          </div>
        </Section>

        {/* WORK HISTORY (Structured) */}
        <Section title="Work Experience (PDS Detailed)" icon={Briefcase}>
          <div className="space-y-4">
             {profile.workExperience?.length ? (
               profile.workExperience.map((work: any) => (
                 <div key={work.id} className="p-4 border border-gray-100 rounded-xl bg-gray-50/20 group relative">
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <button onClick={() => { setEditingExperience(work); setShowAddExperience(true); }} className="p-1 text-gray-400 hover:text-blue-600 bg-white rounded shadow-sm border border-gray-100"><Pencil size={12} /></button>
                      <button onClick={() => handleDeletePdsItem('work_experience', work.id, profile.workExperience || [])} className="p-1 text-gray-400 hover:text-red-600 bg-white rounded shadow-sm border border-gray-100"><Trash2 size={12} /></button>
                    </div>
                    <div className="flex justify-between items-start mb-2 pr-12">
                       <h5 className="text-xs font-bold text-gray-800">{work.companyName}</h5>
                       <span className="text-[10px] text-gray-500">{work.dateFrom} - {work.dateTo || 'Present'}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                       <DataField label="Position" value={work.positionTitle} />
                       <DataField label="Salary/Grade" value={work.salaryGrade || work.monthlySalary} />
                    </div>
                 </div>
               ))
             ) : (
               <p className="text-xs text-center text-gray-400 italic py-4">No detailed work history found</p>
             )}
             <AddCard label="Add Work Experience" onClick={() => setShowAddExperience(true)} />
          </div>
        </Section>

        {/* VOLUNTARY WORK */}
        <Section title="Voluntary Work" icon={Briefcase}>
          <div className="space-y-4">
             {profile.voluntaryWork?.length ? (
               profile.voluntaryWork.map((vw: any) => (
                 <div key={vw.id} className="p-4 border border-gray-100 rounded-xl bg-gray-50/20 group relative">
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <button onClick={() => { setEditingVoluntary(vw); setShowAddVoluntary(true); }} className="p-1 text-gray-400 hover:text-blue-600 bg-white rounded shadow-sm border border-gray-100"><Pencil size={12} /></button>
                      <button onClick={() => handleDeletePdsItem('voluntary_work', vw.id, profile.voluntaryWork || [])} className="p-1 text-gray-400 hover:text-red-600 bg-white rounded shadow-sm border border-gray-100"><Trash2 size={12} /></button>
                    </div>
                    <div className="flex justify-between items-start mb-2 pr-12">
                       <h5 className="text-xs font-bold text-gray-800">{vw.organizationName}</h5>
                       <span className="text-[10px] text-gray-500">{vw.dateFrom} - {vw.dateTo || 'Present'}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                       <DataField label="Position" value={vw.position} />
                       <DataField label="Address" value={vw.address} />
                    </div>
                 </div>
               ))
             ) : (
               <p className="text-xs text-center text-gray-400 italic py-4">No voluntary work found</p>
             )}
             <AddCard label="Add Voluntary Work" onClick={() => setShowAddVoluntary(true)} />
          </div>
        </Section>

        {/* TRAINING / LEARNING & DEVELOPMENT */}
        <Section title="Learning & Development (Training)" icon={Briefcase}>
          <div className="space-y-4">
             {profile.learningDevelopment?.length ? (
               profile.learningDevelopment.map((ld: any) => (
                 <div key={ld.id} className="p-4 border border-gray-100 rounded-xl bg-gray-50/20 group relative">
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <button onClick={() => { setEditingTraining(ld); setShowAddTraining(true); }} className="p-1 text-gray-400 hover:text-blue-600 bg-white rounded shadow-sm border border-gray-100"><Pencil size={12} /></button>
                      <button onClick={() => handleDeletePdsItem('learning_development', ld.id, profile.learningDevelopment || [])} className="p-1 text-gray-400 hover:text-red-600 bg-white rounded shadow-sm border border-gray-100"><Trash2 size={12} /></button>
                    </div>
                    <div className="flex justify-between items-start mb-2 pr-12">
                       <h5 className="text-xs font-bold text-gray-800">{ld.title}</h5>
                       <span className="text-[10px] text-gray-500">{ld.dateFrom} - {ld.dateTo || 'Present'}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                       <DataField label="Type" value={ld.typeOfLd} />
                       <DataField label="Conducted by" value={ld.conductedBy} />
                    </div>
                 </div>
               ))
             ) : (
               <p className="text-xs text-center text-gray-400 italic py-4">No training records found</p>
             )}
             <AddCard label="Add Training Record" onClick={() => setShowAddTraining(true)} />
          </div>
        </Section>

        {/* OTHER INFORMATION */}
        <Section title="Other Information (PDS)" columns="grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          <div className="col-span-full mb-4">
             <div className="flex justify-between items-center mb-3 ml-1">
               <h5 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Skills, Recognitions, Memberships</h5>
               <button onClick={() => { setEditingOtherInfo(null); setShowAddOtherInfo(true); }} className="text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-widest flex items-center gap-1">
                 <Plus size={12} /> Add Info
               </button>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['Skill', 'Recognition', 'Membership'].map(type => (
                  <div key={type} className="p-4 border border-gray-100 rounded-xl bg-gray-50/30">
                    <h6 className="text-[10px] font-bold text-blue-600 uppercase mb-2">{type}s</h6>
                    <div className="space-y-2">
                       {profile.otherInfo?.filter(oi => oi.type === type).map((oi, i) => (
                         <div key={i} className="text-xs font-semibold text-gray-700 bg-white p-2 rounded border border-gray-200 flex justify-between items-center group">
                            <span>{oi.description}</span>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => { setEditingOtherInfo(oi); setShowAddOtherInfo(true); }} className="p-0.5 text-gray-400 hover:text-blue-600"><Pencil size={10} /></button>
                              <button onClick={() => handleDeletePdsItem('other_info', oi.id, profile.otherInfo || [])} className="p-0.5 text-gray-400 hover:text-red-600"><Trash2 size={10} /></button>
                            </div>
                         </div>
                       )) || <p className="text-[10px] italic text-gray-400">None listed</p>}
                       {(!profile.otherInfo?.filter(oi => oi.type === type).length) && <p className="text-[10px] italic text-gray-400">None listed</p>}
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </Section>

        {/* REFERENCES */}
        <Section title="References" columns="grid-cols-1">
           <div className="border border-gray-100 rounded-xl overflow-hidden bg-white mb-2">
             <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-2">Name</th>
                    <th className="px-4 py-2">Address</th>
                    <th className="px-4 py-2">Telephone</th>
                    <th className="px-4 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {profile.references?.length ? (
                    profile.references.map((ref, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50">
                        <td className="px-4 py-2 font-bold text-gray-800">{ref.name}</td>
                        <td className="px-4 py-2 text-gray-600">{ref.address}</td>
                        <td className="px-4 py-2 text-gray-500">{ref.telNo}</td>
                        <td className="px-4 py-2 text-right">
                          <button onClick={() => { setEditingReference(ref); setShowAddReference(true); }} className="p-1 text-gray-400 hover:text-blue-600"><Pencil size={14} /></button>
                          <button onClick={() => handleDeletePdsItem('references', ref.id, profile.references || [])} className="p-1 text-gray-400 hover:text-red-600 ml-1"><Trash2 size={14} /></button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={4} className="px-4 py-3 text-center text-gray-400 italic">No references found</td></tr>
                  )}
                </tbody>
             </table>
           </div>
           <AddCard label="Add Reference" onClick={() => setShowAddReference(true)} />
        </Section>

        {/* EMPLOYMENT DETAILS (INTERNAL) */}
        <Section title="HR Internal Details">
          <DataField label="Department" value={profile.department} highlight />
          <EditableDataField label="Position Title" value={profile.positionTitle || profile.jobTitle} fieldName="positionTitle" highlight onSave={handleFieldSave} />
          <EditableDataField label="Item Number" value={profile.itemNumber} fieldName="itemNumber" onSave={handleFieldSave} />
          <EditableDataField label="Salary Grade" value={profile.salaryGrade} fieldName="salaryGrade" inputType="number" onSave={handleFieldSave} />
          <EditableDataField label="Step Increment" value={profile.stepIncrement} fieldName="stepIncrement" inputType="number" onSave={handleFieldSave} />
          <EditableDataField label="Appointment Type" value={profile.appointmentType} fieldName="appointmentType" inputType="select" options={[
            {value:'Permanent',label:'Permanent'},{value:'Contractual',label:'Contractual'},{value:'Casual',label:'Casual'},
            {value:'Job Order',label:'Job Order'},{value:'Coterminous',label:'Coterminous'},{value:'Temporary',label:'Temporary'}
          ]} onSave={handleFieldSave} />
          <EditableDataField label="Employment Status" value={currentStatus} fieldName="employmentStatus" inputType="select" options={[
            {value:'Active',label:'Active'},{value:'Probationary',label:'Probationary'},{value:'Terminated',label:'Terminated'},
            {value:'Resigned',label:'Resigned'},{value:'On Leave',label:'On Leave'},{value:'Suspended',label:'Suspended'},
          ]} onSave={handleFieldSave} />
          <EditableDataField label="Station" value={profile.station} fieldName="station" onSave={handleFieldSave} />
          <EditableDataField label="Office Address" value={profile.officeAddress} fieldName="officeAddress" fullWidth inputType="textarea" onSave={handleFieldSave} />
          <EditableDataField label="Date Hired" value={formatDateForInput(profile.dateHired)} formattedValue={formatDate(profile.dateHired)} fieldName="dateHired" inputType="date" onSave={handleFieldSave} />
          <DataField label="First Day of Service" value={formatDate(profile.firstDayOfService)} />
          <DataField label="Next Step Increment" value={formatDate(nextStepData?.nextStepDate)} highlight />
          <DataField label="LWOP Days (Accumulated)" value={nextStepData?.totalLwopDays || 0} />
        </Section>

        {/* CUSTOM FIELDS */}
        <Section title="Additional Information" columns="grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
           {renderCustomFields('General')}
           <AddCard label="Add Field" onClick={() => openCustomFieldModal('General')} />
        </Section>
      </div> {/* DATA GRID - REORGANIZED SECTIONS END */}

      <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-between items-center">
        <p className="text-[10px] text-gray-400 font-medium">System Generated Record â€¢ NEBR HRIS</p>
        <div className="flex gap-2">
          <span className="flex items-center gap-1.5 text-xs font-bold text-gray-700 bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
            ✓ Verified Record
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
          <AddFamilyModal
            isOpen={showAddFamily}
            onClose={() => { setShowAddFamily(false); setEditingFamily(null); }}
            employeeId={profile.id}
            initialData={editingFamily}
            existingItems={profile.familyBackground || []}
            onSuccess={onRefresh}
          />
          <AddExperienceModal
            isOpen={showAddExperience}
            onClose={() => { setShowAddExperience(false); setEditingExperience(null); }}
            employeeId={profile.id}
            initialData={editingExperience}
            existingItems={profile.workExperience || []}
            onSuccess={onRefresh}
          />
          <AddVoluntaryWorkModal
            isOpen={showAddVoluntary}
            onClose={() => { setShowAddVoluntary(false); setEditingVoluntary(null); }}
            employeeId={profile.id}
            initialData={editingVoluntary}
            existingItems={profile.voluntaryWork || []}
            onSuccess={onRefresh}
          />
          <AddTrainingModal
            isOpen={showAddTraining}
            onClose={() => { setShowAddTraining(false); setEditingTraining(null); }}
            employeeId={profile.id}
            initialData={editingTraining}
            existingItems={profile.learningDevelopment || []}
            onSuccess={onRefresh}
          />
          <AddOtherInfoModal
            isOpen={showAddOtherInfo}
            onClose={() => { setShowAddOtherInfo(false); setEditingOtherInfo(null); }}
            employeeId={profile.id}
            initialData={editingOtherInfo}
            existingItems={profile.otherInfo || []}
            onSuccess={onRefresh}
          />
          <AddReferenceModal
            isOpen={showAddReference}
            onClose={() => { setShowAddReference(false); setEditingReference(null); }}
            employeeId={profile.id}
            initialData={editingReference}
            existingItems={profile.references || []}
            onSuccess={onRefresh}
          />
        </>
      )}

    </div>
  );
};

export default EditableProfileView;
