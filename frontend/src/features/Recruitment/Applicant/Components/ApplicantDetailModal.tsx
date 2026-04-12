import React, { useState, useEffect } from 'react';
import { 
  X, User, Mail, Phone, MapPin, Calendar, Briefcase, 
  GraduationCap, Award, Brain, Fingerprint, FileText,
  BadgeCheck, Globe, Hash, Ruler, Weight, Droplet,
  LucideIcon, Download, Eye, FileCode, Paperclip
} from 'lucide-react';
import { Applicant, ApplicantDocument } from '@/types/recruitment';
import { requestDownloadToken } from '@/Service/Auth';
import { recruitmentApi } from '@/api/recruitmentApi';

interface ApplicantDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicant: Applicant; 
}

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ApplicantDetailModal: React.FC<ApplicantDetailModalProps> = ({ isOpen, onClose, applicant }) => {
  const [docs, setDocs] = useState<ApplicantDocument[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  useEffect(() => {
    if (isOpen && applicant.id) {
      setLoadingDocs(true);
      recruitmentApi.getApplicantDocuments(applicant.id)
        .then(res => {
          if (res.data.success) setDocs(res.data.documents);
        })
        .finally(() => setLoadingDocs(false));
    }
  }, [isOpen, applicant.id]);

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
    <div className="bg-white rounded-[var(--radius-lg)] border border-[var(--zed-border-light)] mb-8 overflow-hidden zed-shadow-sm">
      <div className="bg-[var(--zed-bg-surface)] px-8 py-4 border-b border-[var(--zed-border-light)] flex items-center gap-3">
        <Icon size={16} className="text-[var(--zed-primary)]" />
        <h3 className="font-black text-[10px] text-[var(--zed-text-dark)] tracking-[0.2em] uppercase">{title}</h3>
      </div>
      <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {children}
      </div>
    </div>
  );

  const DataField = ({ label, value, icon: Icon, fullWidth = false }: { label: string, value: string | null | undefined, icon?: LucideIcon, fullWidth?: boolean }) => (
    <div className={`space-y-2 ${fullWidth ? 'md:col-span-2 lg:col-span-3' : ''}`}>
      <label className="text-[10px] font-black text-[var(--zed-text-muted)] tracking-[0.2em] flex items-center gap-2 uppercase ml-0.5">
        {label}
      </label>
      <div className="bg-[var(--zed-bg-surface)] px-5 py-3 rounded-[var(--radius-md)] border border-[var(--zed-border-light)] min-h-[48px] flex items-center">
        <span className="text-xs font-bold text-[var(--zed-text-dark)] break-all leading-relaxed uppercase tracking-tight">
          {value || <span className="text-[var(--zed-text-muted)] font-medium italic opacity-40 lowercase tracking-normal">Not provided</span>}
        </span>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-12">
      {/* Static Light Backdrop */}
      <div 
        className="absolute inset-0 bg-white/60 backdrop-blur-md transition-opacity" 
        onClick={onClose} 
      />
      
      <div className="relative bg-[var(--zed-bg-light)] w-full max-w-6xl max-h-[92vh] rounded-[var(--radius-lg)] zed-shadow-xl border border-[var(--zed-border-light)] overflow-hidden flex flex-col z-10 animate-in fade-in zoom-in duration-300">
        
        {/* Zed Smoke Grid Detail */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--zed-primary)_1px,transparent_1px),linear-gradient(to_bottom,var(--zed-primary)_1px,transparent_1px)] bg-[size:24px_24px] opacity-[0.01] smoke-grid pointer-events-none"></div>

        {/* Premium Header */}
        <div className="bg-white px-10 py-6 border-b border-[var(--zed-border-light)] flex items-center justify-between sticky top-0 z-20 shadow-sm relative">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-[var(--radius-lg)] bg-[var(--zed-primary)] flex items-center justify-center text-white shadow-lg shadow-[var(--zed-primary)]/20">
              <User size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-[var(--zed-text-dark)] tracking-tight uppercase leading-none mb-2">
                {applicant.firstName} {applicant.lastName}
              </h2>
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-black text-[var(--zed-primary)] bg-[var(--zed-primary)]/5 px-3 py-1 rounded-[var(--radius-sm)] border border-[var(--zed-primary)]/10 tracking-[0.1em] uppercase">
                  {applicant.jobTitle}
                </span>
                <span className="text-[10px] font-black text-[var(--zed-text-muted)] flex items-center gap-2 uppercase tracking-widest">
                   <Calendar size={14} className="opacity-40" /> {new Date(applicant.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-[var(--zed-text-muted)] hover:text-[var(--zed-text-dark)] transition-all p-3 rounded-full hover:bg-[var(--zed-bg-surface)] active:scale-90"
          >
            <X size={28} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-10 bg-[var(--zed-bg-light)] relative scrollbar-premium">
          
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
            {[
              { label: 'Pipeline Stage', value: applicant.stage || 'Applied' },
              { label: 'Email Address', value: applicant.email },
              { label: 'Mobile Contact', value: applicant.phoneNumber },
              { label: 'Acquisition Source', value: applicant.source }
            ].map((stat, i) => (
              <div key={i} className="bg-white p-5 rounded-[var(--radius-lg)] border border-[var(--zed-border-light)] shadow-sm">
                <p className="text-[9px] font-black text-[var(--zed-text-muted)] tracking-[0.2em] mb-2 uppercase">{stat.label}</p>
                <p className="text-sm font-black text-[var(--zed-text-dark)] uppercase truncate">{stat.value}</p>
              </div>
            ))}
          </div>

          <DetailSection title="Identity & Physical Profile" icon={User}>
            <div className="md:col-span-2 lg:col-span-3 flex flex-col md:flex-row gap-10 items-start mb-4">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                    <DataField label="Last Name" value={applicant.lastName} />
                    <DataField label="First Name" value={applicant.firstName} />
                    <DataField label="Middle Name" value={applicant.middleName} />
                    <DataField label="Name Extension" value={applicant.suffix} />
                    <DataField label="Date of Birth" value={applicant.birthDate ? new Date(applicant.birthDate).toLocaleDateString() : null} />
                    <DataField label="Place of Birth" value={applicant.birthPlace} />
                </div>
                
                <div className="shrink-0 flex flex-col items-center">
                    <label className="text-[10px] font-black text-[var(--zed-text-muted)] tracking-widest mb-3 uppercase">Profile Image</label>
                    <div className="w-40 h-40 bg-[var(--zed-bg-surface)] rounded-[var(--radius-lg)] border border-[var(--zed-border-light)] overflow-hidden flex items-center justify-center shadow-inner relative group">
                        {applicant.photoPath ? (
                            <img src={`${apiUrl}/uploads/resumes/${applicant.photoPath}`} alt="Applicant" className="w-full h-full object-cover" />
                        ) : (
                            <User size={48} className="text-[var(--zed-border-light)] opacity-40" />
                        )}
                        <div className="absolute inset-0 bg-[var(--zed-primary)]/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    </div>
                </div>
            </div>

            <div className="md:col-span-2 lg:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 border-t border-[var(--zed-border-light)] pt-8 mt-4">
                <DataField label="Gender" value={applicant.sex} />
                <DataField label="Civil Status" value={applicant.civilStatus} />
                <DataField label="Height" value={applicant.height ? `${applicant.height}m` : null} />
                <DataField label="Weight" value={applicant.weight ? `${applicant.weight}kg` : null} />
                <DataField label="Blood Type" value={applicant.bloodType} />
            </div>
          </DetailSection>

          <DetailSection title="Residency & Contact Intel" icon={MapPin}>
            <div className="md:col-span-2 lg:col-span-3 mb-2">
                <label className="text-[10px] font-black text-[var(--zed-text-muted)] tracking-widest uppercase">Local Residency Status</label>
                <div className="mt-2">
                    <span className={`px-4 py-1.5 rounded-[var(--radius-sm)] text-[10px] font-black border uppercase tracking-widest ${applicant.isMeycauayanResident ? 'bg-[var(--zed-success)]/10 text-[var(--zed-success)] border-[var(--zed-success)]/20' : 'bg-[var(--zed-bg-surface)] text-[var(--zed-text-muted)] border-[var(--zed-border-light)]'}`}>
                        {applicant.isMeycauayanResident ? 'Registered Resident' : 'Non-Resident'}
                    </span>
                </div>
            </div>
            <DataField label="Residential Address" value={applicant.address} fullWidth />
            <DataField label="Residential Zip" value={applicant.zipCode} />
            <div className="md:col-span-2 lg:col-span-3 border-t border-[var(--zed-border-light)] pt-4 my-2 opacity-50"></div>
            <DataField label="Permanent Address" value={applicant.permanentAddress} fullWidth />
            <DataField label="Permanent Zip" value={applicant.permanentZipCode} />
          </DetailSection>

          <DetailSection title="Government Identifiers" icon={Fingerprint}>
            <DataField label="GSIS Serial" value={applicant.gsisNumber} />
            <DataField label="Pag-IBIG Number" value={applicant.pagibigNumber} />
            <DataField label="PhilHealth No" value={applicant.philhealthNumber} />
            <DataField label="SSS / Umid" value={applicant.umidNumber} />
            <DataField label="PhilSys ID" value={applicant.philsysId} />
            <DataField label="Tin ID" value={applicant.tinNumber} />
          </DetailSection>

          {/* New 100% Documentation Sync Section */}
          <div className="bg-white rounded-[var(--radius-lg)] border border-[var(--zed-border-light)] mb-8 overflow-hidden zed-shadow-sm">
            <div className="bg-[var(--zed-bg-surface)] px-8 py-4 border-b border-[var(--zed-border-light)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Paperclip size={16} className="text-[var(--zed-primary)]" />
                <h3 className="font-black text-[10px] text-[var(--zed-text-dark)] tracking-[0.2em] uppercase">Uploaded Documentation Repository</h3>
              </div>
              <span className="text-[9px] font-black text-[var(--zed-text-muted)] tracking-widest uppercase bg-white px-2 py-0.5 rounded border border-[var(--zed-border-light)]">
                {docs.length} Verified Files
              </span>
            </div>
            
            <div className="p-8">
              {loadingDocs ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <Loader2 size={24} className="animate-spin text-[var(--zed-primary)]" />
                  <p className="text-[10px] font-black text-[var(--zed-text-muted)] uppercase tracking-widest">Synchronizing Archive...</p>
                </div>
              ) : docs.length === 0 ? (
                <div className="text-center py-10 bg-[var(--zed-bg-surface)]/50 rounded-[var(--radius-md)] border border-dashed border-[var(--zed-border-light)]">
                  <p className="text-xs font-bold text-[var(--zed-text-muted)] italic opacity-40">No additional document nodes found in the recruitment stream.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {docs.map((doc) => (
                    <div key={doc.id} className="group relative bg-white border border-[var(--zed-border-light)] rounded-[var(--radius-lg)] p-5 hover:border-[var(--zed-primary)]/30 hover:shadow-md transition-all">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-[var(--zed-bg-surface)] flex items-center justify-center text-[var(--zed-primary)] group-hover:bg-[var(--zed-primary)] group-hover:text-white transition-colors">
                          <FileCode size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black text-[var(--zed-text-dark)] uppercase truncate mb-1 tracking-tight" title={doc.documentName}>
                            {doc.documentName}
                          </p>
                          <p className="text-[9px] font-bold text-[var(--zed-text-muted)] uppercase tracking-wider">
                            {doc.documentType || 'General Node'}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-between border-t border-[var(--zed-border-light)]/30 pt-4">
                        <span className="text-[9px] font-black text-[var(--zed-text-muted)] opacity-40 uppercase tracking-tighter">
                          {new Date(doc.uploadedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <button 
                          onClick={() => handleOpenSecureUrl(`${apiUrl}/uploads/resumes/${doc.filePath}`)}
                          className="flex items-center gap-2 px-3 py-1.5 bg-[var(--zed-bg-surface)] text-[var(--zed-text-dark)] text-[9px] font-black uppercase tracking-widest rounded-[var(--radius-sm)] border border-[var(--zed-border-light)] hover:bg-[var(--zed-primary)] hover:text-white hover:border-[var(--zed-primary)] transition-all active:scale-95 shadow-sm"
                        >
                          <Eye size={12} /> View Securely
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DetailSection title="Professional Assessment" icon={BadgeCheck}>
            <div className="md:col-span-2 lg:col-span-3">
              <h4 className="text-[10px] font-black text-[var(--zed-text-muted)] tracking-[0.2em] mb-5 uppercase">Eligibility & Certifications</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <DataField label="License / Title" value={applicant.eligibility} />
                <DataField label="Category" value={applicant.eligibilityType?.replace(/_/g, ' ')} />
                <DataField label="Rating / Grade" value={applicant.eligibilityRating} />
                <DataField label="Issue Date" value={applicant.eligibilityDate ? new Date(applicant.eligibilityDate).toLocaleDateString() : null} />
                <DataField label="Testing Center" value={applicant.eligibilityPlace} />
                <DataField label="License No" value={applicant.licenseNo} />
              </div>
            </div>
            
            <div className="md:col-span-2 lg:col-span-3 border-t border-[var(--zed-border-light)] pt-8 mt-4 opacity-50"></div>
            
            <DataField label="Educational Summary" value={applicant.educationalBackground} fullWidth />
            <DataField label="Work Experience" value={applicant.experience} fullWidth />
            <DataField label="Primary Skills" value={applicant.skills} fullWidth />
          </DetailSection>

        </div>

        {/* Action Footer */}
        <div className="bg-white px-10 py-6 border-t border-[var(--zed-border-light)] flex items-center justify-between sticky bottom-0 z-20 relative">
          <div className="flex gap-4">
             {applicant.resumePath && (
               <button 
                  onClick={() => handleOpenSecureUrl(`${apiUrl}/uploads/resumes/${applicant.resumePath}`)}
                  className="flex items-center gap-3 px-6 py-3 rounded-[var(--radius-lg)] bg-[var(--zed-bg-surface)] text-[var(--zed-text-dark)] text-xs font-black uppercase tracking-widest hover:bg-[var(--zed-bg-light)] transition-all border border-[var(--zed-border-light)] zed-shadow-sm active:scale-95"
               >
                  <FileText size={16} className="text-[var(--zed-primary)]" /> View Resume
               </button>
             )}
             <button 
                onClick={() => handleOpenSecureUrl(`${apiUrl}/api/recruitment/applicants/${applicant.id}/pdf`)}
                className="flex items-center gap-3 px-6 py-3 rounded-[var(--radius-lg)] bg-[var(--zed-primary)] text-white text-xs font-black uppercase tracking-widest hover:brightness-110 transition-all zed-shadow-md active:scale-95"
             >
                <Download size={16} /> Export Dossier (PDF)
             </button>
          </div>
          <button 
            onClick={onClose}
            className="px-8 py-3 rounded-[var(--radius-lg)] bg-white text-[var(--zed-text-muted)] text-xs font-black uppercase tracking-widest hover:bg-[var(--zed-bg-surface)] transition-all border border-[var(--zed-border-light)] active:scale-95"
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApplicantDetailModal;
