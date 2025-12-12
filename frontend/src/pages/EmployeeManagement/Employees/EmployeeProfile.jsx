import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, MapPin, Briefcase, Award, User, CreditCard, Edit2 } from 'lucide-react';
import { fetchEmployeeProfile, updateEmployee } from '../../../api/employeeApi';
import { EditEmployeeModal, ToastNotification, useNotification, getStatusBadgeClass, getAppointmentBadgeClass } from '../../../components/Custom/EmployeeManagement';
import { fetchDepartments } from '../../../api/departmentApi';


const InfoField = ({ label, value, fullWidth = false, badge = false, badgeClass = '' }) => (
  <div className={fullWidth ? 'col-span-2' : ''}>
    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1.5">{label}</label>
    {badge ? (
      <span className={`inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium ${badgeClass}`}>
        {value || 'N/A'}
      </span>
    ) : (
      <div className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-gray-800 text-sm min-h-[38px] flex items-center">
        {value || <span className="text-gray-400">—</span>}
      </div>
    )}
  </div>
);


const EmployeeProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const { notification, showNotification } = useNotification();

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [profileRes, deptRes] = await Promise.all([
          fetchEmployeeProfile(id),
          fetchDepartments()
        ]);
        if (profileRes.success) {
          setProfile(profileRes.profile);
        }
        if (deptRes.success) {
          setDepartments(deptRes.departments);
        }
      } catch (error) {
        // Silently fail
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  const handleEditClick = () => {
    if (profile) {
      setEditFormData({ ...profile });
      setIsEditModalOpen(true);
    }
  };

  const handleFormChange = (field, value) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const result = await updateEmployee(id, editFormData);
      if (result.success) {
        setProfile({ ...profile, ...editFormData });
        setIsEditModalOpen(false);
        showNotification('Employee updated successfully', 'success');
      } else {
        showNotification(result.message || 'Failed to update', 'error');
      }
    } catch (error) {
      showNotification('Failed to update employee', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading Profile...</div>;
  if (!profile) return <div className="p-8 text-center text-red-500">Profile not found</div>;

  // Format date for display
  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { 
        year: 'numeric', month: 'long', day: 'numeric' 
      });
    } catch { return dateStr; }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-6">
      {/* Notification */}
      <ToastNotification notification={notification} />

      {/* Back Button */}
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors mb-4"
      >
        <ArrowLeft size={20} />
        <span>Back to Directory</span>
      </button>

      {/* Header Card */}
      <div className="bg-white/80 backdrop-blur rounded-xl shadow-sm border border-gray-100 overflow-hidden relative">
        <div className="h-24 bg-gray-200"></div>
        <div className="px-6 pb-6">
          <div className="relative flex justify-between items-end -mt-10 mb-4">
            <div className="flex items-end gap-4">
              <div className="w-24 h-24 rounded-full border-4 border-white bg-gray-200 overflow-hidden shadow-lg">
                 {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile.first_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-600 text-3xl font-bold">
                      {profile.first_name?.[0]}{profile.last_name?.[0]}
                    </div>
                  )}
              </div>
              <div className="mb-1">
                <h1 className="text-2xl font-bold text-gray-800">{profile.first_name} {profile.last_name}</h1>
                <p className="text-gray-500 text-sm">{profile.position_title || profile.job_title || 'Employee'} • {profile.department}</p>
              </div>
            </div>
            <button 
              onClick={handleEditClick}
              className="flex items-center gap-2 bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              <Edit2 size={14} />
              Edit Employee
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-gray-100 pt-4">
            <div className="flex items-center gap-2 text-gray-700 text-sm">
              <Mail className="text-gray-500" size={16} />
              <span>{profile.email}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700 text-sm">
              <Phone className="text-gray-500" size={16} />
              <span>{profile.phone_number || 'No phone number'}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700 text-sm">
              <MapPin className="text-gray-500" size={16} />
              <span>{profile.address || 'No address provided'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        
        {/* Employment Details */}
        <div className="bg-white/80 backdrop-blur rounded-lg shadow-sm border border-gray-100 p-4">
          <h3 className="font-bold text-gray-800 flex items-center gap-2 pb-3 border-b border-gray-100 mb-3 text-sm">
            <Briefcase size={16} className="text-gray-500" />
            Employment Details
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <InfoField label="Employee ID" value={profile.employee_id} />
            <InfoField label="Date Hired" value={formatDate(profile.date_hired)} />
            <InfoField label="Position Title" value={profile.position_title || profile.job_title} fullWidth />
            <InfoField label="Salary Grade" value={profile.salary_grade ? `${profile.salary_grade} (Step ${profile.step_increment || 1})` : null} />
            <InfoField label="Station" value={profile.station} />
            <InfoField label="Item Number" value={profile.item_number} />
            <InfoField 
              label="Status" 
              value={profile.employment_status || 'Active'} 
              badge 
              badgeClass={getStatusBadgeClass(profile.employment_status)} 
            />
            <InfoField 
              label="Appointment" 
              value={profile.appointment_type} 
              badge 
              badgeClass={getAppointmentBadgeClass(profile.appointment_type)} 
            />
          </div>
        </div>

        {/* Personal Information */}
        <div className="bg-white/80 backdrop-blur rounded-lg shadow-sm border border-gray-100 p-4">
          <h3 className="font-bold text-gray-800 flex items-center gap-2 pb-3 border-b border-gray-100 mb-3 text-sm">
            <User size={16} className="text-gray-500" />
            Personal Information
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <InfoField label="Birth Date" value={formatDate(profile.birth_date)} />
            <InfoField label="Gender" value={profile.gender} />
            <InfoField label="Civil Status" value={profile.civil_status} />
            <InfoField label="Nationality" value={profile.nationality || 'Filipino'} />
            <InfoField label="Blood Type" value={profile.blood_type} />
            <InfoField label="Height / Weight" value={
              (profile.height_cm || profile.weight_kg) 
                ? `${profile.height_cm || '-'}cm / ${profile.weight_kg || '-'}kg` 
                : null
            } />
            <InfoField label="Permanent Address" value={profile.permanent_address} fullWidth />
            <InfoField label="Emergency Contact" value={
              profile.emergency_contact 
                ? `${profile.emergency_contact}${profile.emergency_contact_number ? ` (${profile.emergency_contact_number})` : ''}`
                : null
            } fullWidth />
          </div>
        </div>

        {/* Government IDs */}
        <div className="bg-white/80 backdrop-blur rounded-lg shadow-sm border border-gray-100 p-4">
          <h3 className="font-bold text-gray-800 flex items-center gap-2 pb-3 border-b border-gray-100 mb-3 text-sm">
            <CreditCard size={16} className="text-gray-500" />
            Government IDs
          </h3>
          <div className="grid grid-cols-1 gap-3">
            <InfoField label="SSS Number" value={profile.sss_number} />
            <InfoField label="GSIS Number" value={profile.gsis_number} />
            <InfoField label="PhilHealth Number" value={profile.philhealth_number} />
            <InfoField label="Pag-IBIG Number" value={profile.pagibig_number} />
            <InfoField label="TIN" value={profile.tin_number} />
          </div>
        </div>

        {/* Skills & Competencies */}
        <div className="bg-white/80 backdrop-blur rounded-lg shadow-sm border border-gray-100 p-4 lg:col-span-2 xl:col-span-3">
          <h3 className="font-bold text-gray-800 flex items-center gap-2 pb-3 border-b border-gray-100 mb-3 text-sm">
            <Award size={16} className="text-gray-500" />
            Skills & Competencies
          </h3>
          <div className="flex flex-wrap gap-2">
            {profile.skills && profile.skills.length > 0 ? (
              profile.skills.map((skill, i) => (
                <span key={i} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-lg border border-gray-200">
                  {typeof skill === 'object' ? skill.skill_name : skill}
                </span>
              ))
            ) : (
              <div className="bg-gray-50 border border-gray-100 rounded-lg px-4 py-3 text-gray-400 text-sm w-full text-center">
                No skills added yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Employee Modal */}
      <EditEmployeeModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        employee={profile}
        formData={editFormData}
        onFormChange={handleFormChange}
        departments={departments}
        onSubmit={handleEditSubmit}
        isProcessing={isProcessing}
      />
    </div>
  );
};

export default EmployeeProfile;
