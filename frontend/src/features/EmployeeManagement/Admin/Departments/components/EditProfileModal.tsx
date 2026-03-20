import React, { useState, useEffect } from 'react';
import { X, Camera } from 'lucide-react';
import Combobox from '@/components/Custom/Combobox';
// @ts-ignore
import { updateProfile } from '@/Service/Auth';

interface CurrentUser {
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  phoneNumber?: string;
  employeeId?: string;
  dateHired?: string;
  positionTitle?: string;
  jobTitle?: string;
  salaryGrade?: string;
  station?: string;
  itemNumber?: string;
  employmentStatus?: string;
  appointmentType?: string;
  appointment?: string;
  birthDate?: string;
  gender?: string;
  civilStatus?: string;
  nationality?: string;
  bloodType?: string;
  heightCm?: string;
  weightKg?: string;
  permanentAddress?: string;
  emergencyContact?: string;
  emergencyContactNumber?: string;
  avatarUrl?: string;
  avatar?: string;
  umidNumber?: string;
  umidId?: string;
  umidNo?: string;
  philsysId?: string;
  educationalBackground?: string;
  gsisNumber?: string;
  philhealthNumber?: string;
  pagibigNumber?: string;
  tinNumber?: string;
  tin?: string;
}

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: CurrentUser;
  onUpdateSuccess: () => void;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  employeeId: string;
  dateHired: string;
  positionTitle: string;
  salaryGrade: string;
  station: string;
  itemNumber: string;
  employmentStatus: string;
  appointmentType: string;
  birthDate: string;
  gender: string;
  civilStatus: string;
  nationality: string;
  bloodType: string;
  heightCm: string;
  weightKg: string;
  permanentAddress: string;
  emergencyContact: string;
  emergencyContactNumber: string;
  avatar: File | null;
  umidNumber: string;
  philsysId: string;
  educationalBackground: string;
  gsisNumber: string;
  philhealthNumber: string;
  pagibigNumber: string;
  tinNumber: string;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose, currentUser, onUpdateSuccess }) => {
  const [formData, setFormData] = useState<FormData>({
    firstName: '', lastName: '', email: '', phoneNumber: '',
    employeeId: '', dateHired: '', positionTitle: '', salaryGrade: '',
    station: '', itemNumber: '', employmentStatus: '', appointmentType: '',
    birthDate: '', gender: '', civilStatus: '', nationality: '',
    bloodType: '', heightCm: '', weightKg: '', permanentAddress: '',
    emergencyContact: '', emergencyContactNumber: '', avatar: null,
    umidNumber: '', philsysId: '', educationalBackground: '', gsisNumber: '', philhealthNumber: '', pagibigNumber: '', tinNumber: ''
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser && isOpen) {
      setFormData({
        firstName: currentUser.firstName || currentUser.name?.split(' ')[0] || '',
        lastName: currentUser.lastName || currentUser.name?.split(' ').slice(1).join(' ') || '',
        email: currentUser.email || '',
        phoneNumber: currentUser.phoneNumber || '',
        employeeId: currentUser.employeeId || '',
        dateHired: currentUser.dateHired || '',
        positionTitle: currentUser.positionTitle || currentUser.jobTitle || '',
        salaryGrade: currentUser.salaryGrade || '',
        station: currentUser.station || '',
        itemNumber: currentUser.itemNumber || '',
        employmentStatus: currentUser.employmentStatus || 'Active',
        appointmentType: currentUser.appointmentType || currentUser.appointment || '',
        birthDate: currentUser.birthDate || '',
        gender: currentUser.gender || '',
        civilStatus: currentUser.civilStatus || '',
        nationality: currentUser.nationality || 'Filipino',
        bloodType: currentUser.bloodType || '',
        heightCm: currentUser.heightCm || '',
        weightKg: currentUser.weightKg || '',
        permanentAddress: currentUser.permanentAddress || '',
        emergencyContact: currentUser.emergencyContact || '',
        emergencyContactNumber: currentUser.emergencyContactNumber || '',
        avatar: null,
        umidNumber: currentUser.umidNumber || currentUser.umidId || currentUser.umidNo || '',
        philsysId: currentUser.philsysId || '',
        educationalBackground: currentUser.educationalBackground || '',
        gsisNumber: currentUser.gsisNumber || '',
        philhealthNumber: currentUser.philhealthNumber || '',
        pagibigNumber: currentUser.pagibigNumber || '',
        tinNumber: currentUser.tinNumber || currentUser.tin || ''
      });
      setPreviewUrl(currentUser.avatarUrl || currentUser.avatar || null);
      setError(null);
    }
  }, [currentUser, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, avatar: file }));
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        const value = formData[key as keyof FormData];
        if (key === 'avatar' && value instanceof File) {
          data.append('avatar', value);
        } else if (key !== 'avatar' && value) {
          data.append(key, String(value));
        }
      });
      const res = await updateProfile(data);
      if (res.success) {
        onUpdateSuccess();
        onClose();
      } else {
        setError(res.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred while updating profile');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  // Input styles matching timekeeping modals
  const inputClass = "w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-200";
  const readOnlyClass = "w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg bg-gray-50 text-gray-700 font-medium cursor-not-allowed focus:outline-none";
  const labelClass = "block text-xs font-semibold text-gray-700 mb-1.5";
  const selectClass = "w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-200 bg-white";

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-800">Edit Profile</h3>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Avatar & Name */}
          <div className="flex items-center gap-4 pb-3 border-b border-gray-200">
            <div className="relative group cursor-pointer shrink-0">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-200 bg-gray-100">
                {previewUrl ? (
                  <img src={previewUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-lg font-bold">
                    {formData.firstName?.[0]}{formData.lastName?.[0]}
                  </div>
                )}
              </div>
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                <Camera className="text-white" size={16} />
              </div>
              <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
            </div>
            <div className="flex-1 grid grid-cols-2 gap-2">
              <div>
                <label className={labelClass}>First Name</label>
                <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className={inputClass} required />
              </div>
              <div>
                <label className={labelClass}>Last Name</label>
                <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className={inputClass} required />
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelClass}>Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className={inputClass} required />
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} className={inputClass} />
            </div>
          </div>

          {/* Employment Details */}
          <div className="pt-2 border-t border-gray-200">
            <p className="text-xs font-bold text-gray-600 mb-2">Employment Details</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelClass}>Employee ID</label>
                <input type="text" name="employeeId" value={formData.employeeId} readOnly className={readOnlyClass} />
              </div>
              <div>
                <label className={labelClass}>Date Hired</label>
                <input type="date" name="dateHired" value={formData.dateHired} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Position Title</label>
                <input type="text" name="positionTitle" value={formData.positionTitle} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Salary Grade</label>
                <input type="text" name="salaryGrade" value={formData.salaryGrade} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Station</label>
                <input type="text" name="station" value={formData.station} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Item Number</label>
                <input type="text" name="itemNumber" value={formData.itemNumber} onChange={handleChange} className={inputClass} />
              </div>
              <div className="relative z-[60]">
                <label className={labelClass}>Status</label>
                <Combobox
                  options={[
                    { value: '', label: '—' },
                    { value: 'Active', label: 'Active' },
                    { value: 'Inactive', label: 'Inactive' },
                    { value: 'On Leave', label: 'On Leave' }
                  ]}
                  value={formData.employmentStatus}
                  onChange={(val) => setFormData(prev => ({ ...prev, employmentStatus: val }))}
                  placeholder="—"
                  buttonClassName={selectClass + " h-[38px] font-bold"}
                />
              </div>
              <div className="relative z-[60]">
                <label className={labelClass}>Appointment</label>
                <Combobox
                  options={[
                    { value: '', label: '—' },
                    { value: 'Permanent', label: 'Permanent' },
                    { value: 'Casual', label: 'Casual' },
                    { value: 'Job Order', label: 'Job Order' },
                    { value: 'Contract of Service', label: 'Contract of Service' }
                  ]}
                  value={formData.appointmentType}
                  onChange={(val) => setFormData(prev => ({ ...prev, appointmentType: val }))}
                  placeholder="—"
                  buttonClassName={selectClass + " h-[38px] font-bold"}
                />
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="pt-2 border-t border-gray-200">
            <p className="text-xs font-bold text-gray-600 mb-2">Personal Information</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelClass}>Birth Date</label>
                <input 
                  type="date" 
                  name="birthDate" 
                  value={formData.birthDate ? new Date(formData.birthDate).toISOString().split('T')[0] : ''} 
                  onChange={handleChange} 
                  className={inputClass} 
                />
              </div>
              <div className="relative z-[55]">
                <label className={labelClass}>Gender</label>
                <Combobox
                  options={[
                    { value: '', label: '—' },
                    { value: 'Male', label: 'Male' },
                    { value: 'Female', label: 'Female' }
                  ]}
                  value={formData.gender}
                  onChange={(val) => setFormData(prev => ({ ...prev, gender: val }))}
                  placeholder="—"
                  buttonClassName={selectClass + " h-[38px] font-bold"}
                />
              </div>
              <div className="relative z-[55]">
                <label className={labelClass}>Civil Status</label>
                <Combobox
                  options={[
                    { value: '', label: '—' },
                    { value: 'Single', label: 'Single' },
                    { value: 'Married', label: 'Married' },
                    { value: 'Widowed', label: 'Widowed' },
                    { value: 'Separated', label: 'Separated' }
                  ]}
                  value={formData.civilStatus}
                  onChange={(val) => setFormData(prev => ({ ...prev, civilStatus: val }))}
                  placeholder="—"
                  buttonClassName={selectClass + " h-[38px] font-bold"}
                />
              </div>
              <div>
                <label className={labelClass}>Nationality</label>
                <input type="text" name="nationality" value={formData.nationality} onChange={handleChange} className={inputClass} />
              </div>
              <div className="relative z-[50]">
                <label className={labelClass}>Blood Type</label>
                <Combobox
                  options={[
                    { value: '', label: '—' },
                    { value: 'A+', label: 'A+' }, { value: 'A-', label: 'A-' },
                    { value: 'B+', label: 'B+' }, { value: 'B-', label: 'B-' },
                    { value: 'AB+', label: 'AB+' }, { value: 'AB-', label: 'AB-' },
                    { value: 'O+', label: 'O+' }, { value: 'O-', label: 'O-' }
                  ]}
                  value={formData.bloodType}
                  onChange={(val) => setFormData(prev => ({ ...prev, bloodType: val }))}
                  placeholder="—"
                  buttonClassName={selectClass + " h-[38px] font-bold"}
                />
              </div>
              <div>
                <label className={labelClass}>Height / Weight</label>
                <div className="grid grid-cols-2 gap-1">
                  <input type="number" name="heightCm" value={formData.heightCm} onChange={handleChange} placeholder="cm" className={inputClass} />
                  <input type="number" name="weightKg" value={formData.weightKg} onChange={handleChange} placeholder="kg" className={inputClass} />
                </div>
              </div>
              <div className="col-span-2">
                <label className={labelClass}>Permanent Address</label>
                <input type="text" name="permanentAddress" value={formData.permanentAddress} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Emergency Contact</label>
                <input type="text" name="emergencyContact" value={formData.emergencyContact} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Emergency Phone</label>
                <input type="tel" name="emergencyContactNumber" value={formData.emergencyContactNumber} onChange={handleChange} className={inputClass} />
              </div>
            </div>
          </div>

          {/* Government IDs */}
          <div className="pt-2 border-t border-gray-200">
            <p className="text-xs font-bold text-gray-600 mb-2">Government IDs</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelClass}>UMID Number</label>
                <input type="text" name="umidNumber" value={formData.umidNumber} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>PHILSYS ID</label>
                <input type="text" name="philsysId" value={formData.philsysId} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>GSIS Number</label>
                <input type="text" name="gsisNumber" value={formData.gsisNumber} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>PhilHealth</label>
                <input type="text" name="philhealthNumber" value={formData.philhealthNumber} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Pag-IBIG</label>
                <input type="text" name="pagibigNumber" value={formData.pagibigNumber} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>TIN</label>
                <input type="text" name="tinNumber" value={formData.tinNumber} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Blood Type</label>
                <input type="text" name="bloodType" value={formData.bloodType} onChange={handleChange} className={inputClass} />
              </div>
            </div>
            <div className="mt-2">
              <label className={labelClass}>Educational Background</label>
              <textarea name="educationalBackground" value={formData.educationalBackground} onChange={handleChange} className={`${inputClass} min-h-[60px]`} />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-3 border-t border-gray-200">
            <button type="button" onClick={handleClose} disabled={loading}
              className="flex-1 px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:text-red-700 transition-colors font-medium disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 px-3 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium disabled:opacity-50">
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;
