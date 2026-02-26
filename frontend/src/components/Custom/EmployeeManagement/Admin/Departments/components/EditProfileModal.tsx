import React, { useState, useEffect } from 'react';
import { X, Camera } from 'lucide-react';
// @ts-ignore
import { updateProfile } from '@/Service/Auth';

interface CurrentUser {
  first_name?: string;
  last_name?: string;
  name?: string;
  email?: string;
  phone_number?: string;
  phone?: string;
  employee_id?: string;
  employeeId?: string;
  date_hired?: string;
  dateHired?: string;
  position_title?: string;
  jobTitle?: string;
  job_title?: string;
  salary_grade?: string;
  salaryGrade?: string;
  station?: string;
  item_number?: string;
  itemNumber?: string;
  employment_status?: string;
  employmentStatus?: string;
  appointment_type?: string;
  appointment?: string;
  birth_date?: string;
  birthDate?: string;
  gender?: string;
  civil_status?: string;
  civilStatus?: string;
  nationality?: string;
  blood_type?: string;
  bloodType?: string;
  height_cm?: string;
  weight_kg?: string;
  permanent_address?: string;
  permanentAddress?: string;
  emergency_contact?: string;
  emergencyContact?: string;
  emergency_contact_number?: string;
  avatar_url?: string;
  avatar?: string;
  umid_id?: string;
  umidNo?: string;
  philsys_id?: string;
  philsysId?: string;
  educational_background?: string;
  educationalBackground?: string;
  gsis_number?: string;
  gsisNumber?: string;
  philhealth_number?: string;
  philhealthNumber?: string;
  pagibig_number?: string;
  pagibigNumber?: string;
  tin_number?: string;
  tin?: string;
}

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: CurrentUser;
  onUpdateSuccess: () => void;
}

interface FormData {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  employee_id: string;
  date_hired: string;
  position_title: string;
  salary_grade: string;
  station: string;
  item_number: string;
  employment_status: string;
  appointment_type: string;
  birth_date: string;
  gender: string;
  civil_status: string;
  nationality: string;
  blood_type: string;
  height_cm: string;
  weight_kg: string;
  permanent_address: string;
  emergency_contact: string;
  emergency_contact_number: string;
  avatar: File | null;
  umid_id: string;
  philsys_id: string;
  educational_background: string;
  gsis_number: string;
  philhealth_number: string;
  pagibig_number: string;
  tin_number: string;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose, currentUser, onUpdateSuccess }) => {
  const [formData, setFormData] = useState<FormData>({
    first_name: '', last_name: '', email: '', phone_number: '',
    employee_id: '', date_hired: '', position_title: '', salary_grade: '',
    station: '', item_number: '', employment_status: '', appointment_type: '',
    birth_date: '', gender: '', civil_status: '', nationality: '',
    blood_type: '', height_cm: '', weight_kg: '', permanent_address: '',
    emergency_contact: '', emergency_contact_number: '', avatar: null,
    umid_id: '', philsys_id: '', educational_background: '', gsis_number: '', philhealth_number: '', pagibig_number: '', tin_number: ''
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser && isOpen) {
      setFormData({
        first_name: currentUser.first_name || currentUser.name?.split(' ')[0] || '',
        last_name: currentUser.last_name || currentUser.name?.split(' ').slice(1).join(' ') || '',
        email: currentUser.email || '',
        phone_number: currentUser.phone_number || currentUser.phone || '',
        employee_id: currentUser.employee_id || currentUser.employeeId || '',
        date_hired: currentUser.date_hired || currentUser.dateHired || '',
        position_title: currentUser.position_title || currentUser.jobTitle || currentUser.job_title || '',
        salary_grade: currentUser.salary_grade || currentUser.salaryGrade || '',
        station: currentUser.station || '',
        item_number: currentUser.item_number || currentUser.itemNumber || '',
        employment_status: currentUser.employment_status || currentUser.employmentStatus || 'Active',
        appointment_type: currentUser.appointment_type || currentUser.appointment || '',
        birth_date: currentUser.birth_date || currentUser.birthDate || '',
        gender: currentUser.gender || '',
        civil_status: currentUser.civil_status || currentUser.civilStatus || '',
        nationality: currentUser.nationality || 'Filipino',
        blood_type: currentUser.blood_type || currentUser.bloodType || '',
        height_cm: currentUser.height_cm || '',
        weight_kg: currentUser.weight_kg || '',
        permanent_address: currentUser.permanent_address || currentUser.permanentAddress || '',
        emergency_contact: currentUser.emergency_contact || currentUser.emergencyContact || '',
        emergency_contact_number: currentUser.emergency_contact_number || '',
        avatar: null,
        umid_id: currentUser.umid_id || currentUser.umidNo || '',
        philsys_id: currentUser.philsys_id || currentUser.philsysId || '',
        educational_background: currentUser.educational_background || currentUser.educationalBackground || '',
        gsis_number: currentUser.gsis_number || currentUser.gsisNumber || '',
        philhealth_number: currentUser.philhealth_number || currentUser.philhealthNumber || '',
        pagibig_number: currentUser.pagibig_number || currentUser.pagibigNumber || '',
        tin_number: currentUser.tin_number || currentUser.tin || ''
      });
      setPreviewUrl(currentUser.avatar_url || currentUser.avatar || null);
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
                    {formData.first_name?.[0]}{formData.last_name?.[0]}
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
                <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} className={inputClass} required />
              </div>
              <div>
                <label className={labelClass}>Last Name</label>
                <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} className={inputClass} required />
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
              <input type="tel" name="phone_number" value={formData.phone_number} onChange={handleChange} className={inputClass} />
            </div>
          </div>

          {/* Employment Details */}
          <div className="pt-2 border-t border-gray-200">
            <p className="text-xs font-bold text-gray-600 mb-2">Employment Details</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelClass}>Employee ID</label>
                <input type="text" name="employee_id" value={formData.employee_id} readOnly className={readOnlyClass} />
              </div>
              <div>
                <label className={labelClass}>Date Hired</label>
                <input type="date" name="date_hired" value={formData.date_hired} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Position Title</label>
                <input type="text" name="position_title" value={formData.position_title} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Salary Grade</label>
                <input type="text" name="salary_grade" value={formData.salary_grade} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Station</label>
                <input type="text" name="station" value={formData.station} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Item Number</label>
                <input type="text" name="item_number" value={formData.item_number} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Status</label>
                <select name="employment_status" value={formData.employment_status} onChange={handleChange} className={selectClass}>
                  <option value="">—</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="On Leave">On Leave</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Appointment</label>
                <select name="appointment_type" value={formData.appointment_type} onChange={handleChange} className={selectClass}>
                  <option value="">—</option>
                  <option value="Permanent">Permanent</option>
                  <option value="Casual">Casual</option>
                  <option value="Job Order">Job Order</option>
                  <option value="Contract of Service">Contract of Service</option>
                </select>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="pt-2 border-t border-gray-200">
            <p className="text-xs font-bold text-gray-600 mb-2">Personal Information</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelClass}>Birth Date</label>
                <input type="date" name="birth_date" value={formData.birth_date} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Gender</label>
                <select name="gender" value={formData.gender} onChange={handleChange} className={selectClass}>
                  <option value="">—</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Civil Status</label>
                <select name="civil_status" value={formData.civil_status} onChange={handleChange} className={selectClass}>
                  <option value="">—</option>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Widowed">Widowed</option>
                  <option value="Separated">Separated</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Nationality</label>
                <input type="text" name="nationality" value={formData.nationality} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Blood Type</label>
                <select name="blood_type" value={formData.blood_type} onChange={handleChange} className={selectClass}>
                  <option value="">—</option>
                  <option value="A+">A+</option><option value="A-">A-</option>
                  <option value="B+">B+</option><option value="B-">B-</option>
                  <option value="AB+">AB+</option><option value="AB-">AB-</option>
                  <option value="O+">O+</option><option value="O-">O-</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Height / Weight</label>
                <div className="grid grid-cols-2 gap-1">
                  <input type="number" name="height_cm" value={formData.height_cm} onChange={handleChange} placeholder="cm" className={inputClass} />
                  <input type="number" name="weight_kg" value={formData.weight_kg} onChange={handleChange} placeholder="kg" className={inputClass} />
                </div>
              </div>
              <div className="col-span-2">
                <label className={labelClass}>Permanent Address</label>
                <input type="text" name="permanent_address" value={formData.permanent_address} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Emergency Contact</label>
                <input type="text" name="emergency_contact" value={formData.emergency_contact} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Emergency Phone</label>
                <input type="tel" name="emergency_contact_number" value={formData.emergency_contact_number} onChange={handleChange} className={inputClass} />
              </div>
            </div>
          </div>

          {/* Government IDs */}
          <div className="pt-2 border-t border-gray-200">
            <p className="text-xs font-bold text-gray-600 mb-2">Government IDs</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelClass}>UMID ID</label>
                <input type="text" name="umid_id" value={formData.umid_id} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>PHILSYS ID</label>
                <input type="text" name="philsys_id" value={formData.philsys_id} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>GSIS Number</label>
                <input type="text" name="gsis_number" value={formData.gsis_number} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>PhilHealth</label>
                <input type="text" name="philhealth_number" value={formData.philhealth_number} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Pag-IBIG</label>
                <input type="text" name="pagibig_number" value={formData.pagibig_number} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>TIN</label>
                <input type="text" name="tin_number" value={formData.tin_number} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Blood Type</label>
                <input type="text" name="blood_type" value={formData.blood_type} onChange={handleChange} className={inputClass} />
              </div>
            </div>
            <div className="mt-2">
              <label className={labelClass}>Educational Background</label>
              <textarea name="educational_background" value={formData.educational_background} onChange={handleChange} className={`${inputClass} min-h-[60px]`} />
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
