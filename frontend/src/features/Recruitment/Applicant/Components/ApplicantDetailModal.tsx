import React from 'react';
import { 
  X, User, Mail, Phone, MapPin, Calendar, Briefcase, 
  GraduationCap, Award, Brain, Fingerprint, FileText,
  BadgeCheck, Heart, Trash2, Edit3, ChevronRight,
  Globe, Facebook, Linkedin, Twitter, Hash, Ruler, Weight, Droplet,
  LucideIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Applicant } from '@/types/recruitment';

interface ApplicantDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicant: Applicant; 
}

const ApplicantDetailModal: React.FC<ApplicantDetailModalProps> = ({ isOpen, onClose, applicant }) => {
  if (!applicant) return null;

  const DetailSection = ({ title, icon: Icon, children }: { title: string, icon: LucideIcon, children: React.ReactNode }) => (
    <div className="bg-white rounded-[20px] border border-gray-100 shadow-sm overflow-hidden mb-6 hover:shadow-md transition-shadow duration-300">
      <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex items-center gap-3">
        <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100">
          <Icon size={18} className="text-green-600" />
        </div>
        <h3 className="font-bold text-gray-800 tracking-tight uppercase text-xs">{title}</h3>
      </div>
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {children}
      </div>
    </div>
  );

  const DataField = ({ label, value, icon: Icon, fullWidth = false }: { label: string, value: string | null | undefined, icon?: LucideIcon, fullWidth?: boolean }) => (
    <div className={`space-y-1.5 ${fullWidth ? 'md:col-span-2 lg:col-span-3' : ''}`}>
      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-0.5 flex items-center gap-1.5">
        {Icon && <Icon size={10} />}
        {label}
      </label>
      <div className="bg-gray-50/50 px-4 py-2.5 rounded-xl border border-gray-100 min-h-[42px] flex items-center group hover:bg-white hover:border-green-200 transition-all duration-200">
        <span className="text-sm font-semibold text-gray-700 break-all">
          {value || <span className="text-gray-300 font-normal italic">Not provided</span>}
        </span>
      </div>
    </div>
  );

  const formatAddress = () => {
    if (!applicant.address) return "Not provided";
    return applicant.address;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-zinc-50 w-full max-w-6xl max-h-[90vh] rounded-[32px] shadow-2xl overflow-hidden flex flex-col relative z-10 border border-white/20"
          >
            {/* Header */}
            <div className="bg-white px-8 py-6 border-b border-gray-100 flex items-center justify-between sticky top-0 z-20">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-green-100">
                  <User size={32} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight leading-none mb-1">
                    {applicant.first_name} {applicant.last_name}
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-100">
                      {applicant.job_title}
                    </span>
                    <span className="text-xs font-semibold text-gray-400 flex items-center gap-1">
                       <Calendar size={12} /> Applied on {new Date(applicant.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-3 hover:bg-red-50 hover:text-red-500 text-gray-400 rounded-2xl transition-all duration-300 group active:scale-95"
              >
                <X size={24} className="group-hover:rotate-90 transition-transform duration-300" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-[#F8FAFC]">
              
              {/* Quick Info Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 group hover:border-emerald-200 transition-colors">
                  <div className="bg-emerald-50 p-2.5 rounded-xl text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <BadgeCheck size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Application Status</p>
                    <p className="text-sm font-bold text-gray-700">{applicant.stage || 'Applied'}</p>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 group hover:border-blue-200 transition-colors">
                  <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Mail size={18} />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Email Contact</p>
                    <p className="text-sm font-bold text-gray-700 truncate">{applicant.email}</p>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 group hover:border-emerald-200 transition-colors">
                  <div className="bg-emerald-50 p-2.5 rounded-xl text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <Phone size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Mobile Number</p>
                    <p className="text-sm font-bold text-gray-700">{applicant.phone_number}</p>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 group hover:border-purple-200 transition-colors">
                  <div className="bg-purple-50 p-2.5 rounded-xl text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                    <Globe size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Entry Source</p>
                    <p className="text-sm font-bold text-gray-700 uppercase">{applicant.source}</p>
                  </div>
                </div>
              </div>

              {/* 1. Personal Details */}
              <DetailSection title="Personal Details" icon={User}>
                <div className="md:col-span-2 lg:col-span-3 flex flex-col md:flex-row gap-8 items-start mb-2">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                        <DataField label="Last Name" value={applicant.last_name} />
                        <DataField label="First Name" value={applicant.first_name} />
                        <DataField label="Middle Name" value={applicant.middle_name} />
                        <DataField label="Suffix" value={applicant.suffix} />
                        <DataField label="Birth Date" value={applicant.birth_date ? new Date(applicant.birth_date).toLocaleDateString() : null} icon={Calendar} />
                        <DataField label="Place of Birth" value={applicant.birth_place} icon={MapPin} />
                    </div>
                    
                    {/* 2x2 Photo Display */}
                    <div className="shrink-0 flex flex-col items-center">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block ml-0.5 self-start">Applicant Photo</label>
                        <div className="w-[140px] h-[140px] bg-white rounded-2xl border-2 border-gray-100 shadow-sm overflow-hidden flex items-center justify-center group hover:border-green-500 transition-colors duration-300">
                            {applicant.photo_path ? (
                                <img src={`http://localhost:5000/uploads/resumes/${applicant.photo_path}`} alt="Applicant" className="w-full h-full object-cover" />
                            ) : (
                                <User size={48} className="text-gray-200" />
                            )}
                        </div>
                    </div>
                </div>

                <div className="md:col-span-2 lg:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 border-t border-gray-50 pt-6 mt-2">
                    <DataField label="Gender" value={applicant.sex} />
                    <DataField label="Civil Status" value={applicant.civil_status} />
                    <DataField label="Height (m)" value={applicant.height} icon={Ruler} />
                    <DataField label="Weight (kg)" value={applicant.weight} icon={Weight} />
                    <DataField label="Blood Type" value={applicant.blood_type} icon={Droplet} />
                </div>
              </DetailSection>

              {/* 2. Residency & Contact */}
              <DetailSection title="Residency & Contact" icon={MapPin}>
                <div className="md:col-span-2 lg:col-span-3 mb-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-0.5">Meycauayan Resident?</label>
                    <div className="mt-1 flex gap-4">
                        <span className={`px-4 py-1.5 rounded-xl text-xs font-bold border ${applicant.is_meycauayan_resident ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
                            {applicant.is_meycauayan_resident ? 'Yes, Resident' : 'No, Non-Resident'}
                        </span>
                    </div>
                </div>
                <DataField label="Residential Address" value={applicant.address} fullWidth icon={MapPin} />
                <DataField label="Residential Zip Code" value={applicant.zip_code} icon={Hash} />
                <div className="md:col-span-2 lg:col-span-3 border-t border-gray-50 pt-4 mt-2"></div>
                <DataField label="Permanent Address" value={applicant.permanent_address} fullWidth icon={MapPin} />
                <DataField label="Permanent Zip Code" value={applicant.permanent_zip_code} icon={Hash} />
              </DetailSection>

              {/* 3. Government Records */}
              <DetailSection title="Government Records" icon={Fingerprint}>
                <DataField label="GSIS Number" value={applicant.gsis_no} />
                <DataField label="Pag-IBIG Number" value={applicant.pagibig_no} />
                <DataField label="PhilHealth Number" value={applicant.philhealth_no} />
                <DataField label="UMID Number" value={applicant.umid_no} />
                <DataField label="PhilSys ID" value={applicant.philsys_id} />
                <DataField label="TIN Number" value={applicant.tin_no} />
              </DetailSection>

              {/* 4. Professional Qualifications */}
              <DetailSection title="Professional Qualifications" icon={BadgeCheck}>
                <div className="md:col-span-2 lg:col-span-3">
                  <h4 className="text-[10px] font-black text-green-600 uppercase tracking-[0.2em] mb-4 ml-0.5">Eligibility & Certifications</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <DataField label="Eligibility Name / Title" value={applicant.eligibility} icon={Award} />
                    <DataField label="Eligibility Category" value={applicant.eligibility_type?.replace(/_/g, ' ').toUpperCase()} />
                    <DataField label="Rating (If Applicable)" value={applicant.eligibility_rating} />
                    <DataField label="Date of Release / Validity" value={applicant.eligibility_date ? new Date(applicant.eligibility_date).toLocaleDateString() : null} icon={Calendar} />
                    <DataField label="Place of Examination / Issue" value={applicant.eligibility_place} icon={MapPin} />
                    <DataField label="License / ID Number" value={applicant.license_no} icon={Hash} />
                  </div>
                </div>
                
                <div className="md:col-span-2 lg:col-span-3 border-t border-gray-50 pt-4 mt-2"></div>
                
                <DataField label="Education History" value={applicant.education} fullWidth icon={GraduationCap} />
                <DataField label="Work Experience Log" value={applicant.experience} fullWidth icon={Briefcase} />
                <DataField label="Core Competencies" value={applicant.skills} fullWidth icon={Brain} />
                <DataField label="Total Exp. (Years)" value={applicant.total_experience_years?.toString()} />
              </DetailSection>

              {/* Interview Record */}
              {(applicant.interview_date || applicant.interview_notes) && (
                <DetailSection title="Interview Record" icon={FileText}>
                  <DataField label="Interview Date" value={applicant.interview_date ? new Date(applicant.interview_date).toLocaleString() : null} icon={Calendar} />
                  <DataField label="Interview Platform" value={applicant.interview_platform} icon={Globe} />
                  <DataField label="Meeting Link" value={applicant.interview_link} fullWidth icon={Globe} />
                  <DataField label="Interview Notes" value={applicant.interview_notes} fullWidth icon={FileText} />
                </DetailSection>
              )}

            </div>

            {/* Footer */}
            <div className="bg-white px-8 py-5 border-t border-gray-100 flex items-center justify-between sticky bottom-0 z-20">
              <div className="flex gap-2">
                 {applicant.resume_path && (
                   <a 
                      href={`http://localhost:5000/uploads/resumes/${applicant.resume_path}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gray-50 text-gray-600 text-sm font-bold hover:bg-gray-100 transition-all border border-gray-100 active:scale-95"
                   >
                      <FileText size={18} /> View CV/Resume
                   </a>
                 )}
                 {applicant.eligibility_path && (
                   <a 
                      href={`http://localhost:5000/uploads/resumes/${applicant.eligibility_path}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-amber-50 text-amber-700 text-sm font-bold hover:bg-amber-100 transition-all border border-amber-100 active:scale-95"
                   >
                      <BadgeCheck size={18} /> View Eligibility Certificate
                   </a>
                 )}
                 <a 
                    href={`http://localhost:5000/api/recruitment/applicants/${applicant.id}/pdf`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-green-600 text-white text-sm font-bold hover:bg-green-700 transition-all shadow-md shadow-green-100 active:scale-95"
                 >
                    <FileText size={18} /> Download Application (PDF)
                 </a>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-2xl bg-white text-gray-500 text-sm font-bold hover:bg-gray-50 transition-all border border-gray-200 active:scale-95"
                >
                  Close View
                </button>
                {/* We can add buttons like "Schedule Interview" or "Reject" here but they are already in the table */}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #e2e8f0; border-radius: 20px; }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb { background-color: #cbd5e1; }
      `}</style>
    </AnimatePresence>
  );
};

export default ApplicantDetailModal;
