import React from 'react';
import { 
  X, User, Mail, Phone, MapPin, Calendar, Briefcase, 
  GraduationCap, Award, Brain, Fingerprint, FileText,
  BadgeCheck, Globe, Hash, Ruler, Weight, Droplet,
  LucideIcon, Download
} from 'lucide-react';
import { Applicant } from '@/types/recruitment';
import { requestDownloadToken } from '@/Service/Auth';

interface ApplicantDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicant: Applicant; 
}

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ApplicantDetailModal: React.FC<ApplicantDetailModalProps> = ({ isOpen, onClose, applicant }) => {
  if (!isOpen || !applicant) return null;

  // Securely open URLs using a short-lived token
  const handleOpenSecureUrl = async (url: string | null) => {
      if (!url) return;
      try {
          const token = await requestDownloadToken();
          const separator = url.includes('?') ? '&' : '?';
          const secureUrl = token ? `${url}${separator}token=${token}` : url;
          window.open(secureUrl, '_blank');
      } catch (err) {
          window.open(url, '_blank');
      }
  };

  const DetailSection = ({ title, icon: Icon, children }: { title: string, icon: LucideIcon, children: React.ReactNode }) => (
    <div className="bg-white rounded-xl border border-gray-100 mb-5 overflow-hidden">
      <div className="bg-[#F8F9FA] px-6 py-3 border-b border-gray-100 flex items-center gap-2">
        <Icon size={14} className="text-gray-400" />
        <h3 className="font-bold text-gray-500 text-[10px] uppercase tracking-widest">{title}</h3>
      </div>
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {children}
      </div>
    </div>
  );

  const DataField = ({ label, value, icon: Icon, fullWidth = false }: { label: string, value: string | null | undefined, icon?: LucideIcon, fullWidth?: boolean }) => (
    <div className={`space-y-1.5 ${fullWidth ? 'md:col-span-2 lg:col-span-3' : ''}`}>
      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5 ml-0.5">
        {label}
      </label>
      <div className="bg-gray-50/50 px-4 py-2.5 rounded-lg border border-gray-100 min-h-[42px] flex items-center">
        <span className="text-xs font-medium text-gray-700 break-all leading-relaxed">
          {value || <span className="text-gray-300 font-normal italic">Not provided</span>}
        </span>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
      {/* Static Backdrop - No Blur */}
      <div 
        className="absolute inset-0 bg-gray-900/40 transition-opacity" 
        onClick={onClose} 
      />
      
      <div className="relative bg-white w-full max-w-6xl max-h-[90vh] rounded-xl shadow-2xl overflow-hidden flex flex-col z-10 animate-in fade-in zoom-in duration-200">
        {/* Simple Header */}
        <div className="bg-white px-8 py-5 border-b border-gray-100 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gray-900 flex items-center justify-center text-white">
              <User size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 leading-none mb-1.5">
                {applicant.firstName} {applicant.lastName}
              </h2>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded border border-gray-200 uppercase tracking-wider">
                  {applicant.jobTitle}
                </span>
                <span className="text-[10px] font-semibold text-gray-400 flex items-center gap-1.5">
                   <Calendar size={12} /> {new Date(applicant.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 bg-white">
          
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">Status</p>
              <p className="text-sm font-bold text-gray-700">{applicant.stage || 'Applied'}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 overflow-hidden">
              <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">Email</p>
              <p className="text-sm font-bold text-gray-700 truncate">{applicant.email}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">Phone</p>
              <p className="text-sm font-bold text-gray-700">{applicant.phoneNumber}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">Source</p>
              <p className="text-sm font-bold text-gray-700 uppercase">{applicant.source}</p>
            </div>
          </div>

          <DetailSection title="Personal Details" icon={User}>
            <div className="md:col-span-2 lg:col-span-3 flex flex-col md:flex-row gap-8 items-start mb-2">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 w-full">
                    <DataField label="Last Name" value={applicant.lastName} />
                    <DataField label="First Name" value={applicant.firstName} />
                    <DataField label="Middle Name" value={applicant.middleName} />
                    <DataField label="Suffix" value={applicant.suffix} />
                    <DataField label="Birth Date" value={applicant.birthDate ? new Date(applicant.birthDate).toLocaleDateString() : null} />
                    <DataField label="Place of Birth" value={applicant.birthPlace} />
                </div>
                
                <div className="shrink-0 flex flex-col">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Photo</label>
                    <div className="w-32 h-32 bg-gray-50 rounded-xl border border-gray-100 overflow-hidden flex items-center justify-center">
                        {applicant.photoPath ? (
                            <img src={`${apiUrl}/uploads/resumes/${applicant.photoPath}`} alt="Applicant" className="w-full h-full object-cover" />
                        ) : (
                            <User size={32} className="text-gray-200" />
                        )}
                    </div>
                </div>
            </div>

            <div className="md:col-span-2 lg:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5 border-t border-gray-50 pt-5">
                <DataField label="Gender" value={applicant.sex} />
                <DataField label="Civil Status" value={applicant.civilStatus} />
                <DataField label="Height (m)" value={applicant.height} />
                <DataField label="Weight (kg)" value={applicant.weight} />
                <DataField label="Blood Type" value={applicant.bloodType} />
            </div>
          </DetailSection>

          <DetailSection title="Residency & Contact" icon={MapPin}>
            <div className="md:col-span-2 lg:col-span-3 mb-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Meycauayan Resident</label>
                <div className="mt-1">
                    <span className={`px-3 py-1 rounded text-xs font-bold border ${applicant.isMeycauayanResident ? 'bg-gray-100 text-gray-700 border-gray-200' : 'bg-white text-gray-300 border-gray-100'}`}>
                        {applicant.isMeycauayanResident ? 'Resident' : 'Non-Resident'}
                    </span>
                </div>
            </div>
            <DataField label="Residential Address" value={applicant.address} fullWidth />
            <DataField label="Zip Code" value={applicant.zipCode} />
            <div className="md:col-span-2 lg:col-span-3 border-t border-gray-50 pt-3"></div>
            <DataField label="Permanent Address" value={applicant.permanentAddress} fullWidth />
            <DataField label="Permanent Zip Code" value={applicant.permanentZipCode} />
          </DetailSection>

          <DetailSection title="Government Records" icon={Fingerprint}>
            <DataField label="GSIS" value={applicant.gsisNumber} />
            <DataField label="Pag-IBIG" value={applicant.pagibigNumber} />
            <DataField label="PhilHealth" value={applicant.philhealthNumber} />
            <DataField label="UMID" value={applicant.umidNumber} />
            <DataField label="PhilSys" value={applicant.philsysId} />
            <DataField label="TIN" value={applicant.tinNumber} />
          </DetailSection>

          <DetailSection title="Professional Qualifications" icon={BadgeCheck}>
            <div className="md:col-span-2 lg:col-span-3">
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Eligibility</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <DataField label="Name / Title" value={applicant.eligibility} />
                <DataField label="Category" value={applicant.eligibilityType?.replace(/_/g, ' ').toUpperCase()} />
                <DataField label="Rating" value={applicant.eligibilityRating} />
                <DataField label="Date" value={applicant.eligibilityDate ? new Date(applicant.eligibilityDate).toLocaleDateString() : null} />
                <DataField label="Place" value={applicant.eligibilityPlace} />
                <DataField label="License No" value={applicant.licenseNo} />
              </div>
            </div>
            
            <div className="md:col-span-2 lg:col-span-3 border-t border-gray-50 pt-5 mt-2"></div>
            
            <DataField label="Education" value={applicant.educationalBackground} fullWidth />
            <DataField label="Experience" value={applicant.experience} fullWidth />
            <DataField label="Skills" value={applicant.skills} fullWidth />
          </DetailSection>

        </div>

        {/* Action Footer */}
        <div className="bg-gray-50 px-8 py-5 border-t border-gray-100 flex items-center justify-between sticky bottom-0 z-20">
          <div className="flex gap-3">
             {applicant.resumePath && (
               <button 
                  onClick={() => handleOpenSecureUrl(`${apiUrl}/uploads/resumes/${applicant.resumePath}`)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-gray-700 text-xs font-bold hover:bg-gray-50 transition-all border border-gray-200 shadow-sm"
               >
                  <FileText size={14} /> Resume
               </button>
             )}
             <button 
                onClick={() => handleOpenSecureUrl(`${apiUrl}/api/recruitment/applicants/${applicant.id}/pdf`)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 text-white text-xs font-bold hover:bg-gray-800 transition-all shadow-sm"
             >
                <Download size={14} /> Application (PDF)
             </button>
          </div>
          <button 
            onClick={onClose}
            className="px-6 py-2 rounded-lg bg-white text-gray-500 text-xs font-bold hover:bg-gray-50 transition-all border border-gray-200"
          >
            Close
          </button>
        </div>
      </div>

      <style>{`
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background-color: #e2e8f0; border-radius: 20px; }
      `}</style>
    </div>
  );
};

export default ApplicantDetailModal;
