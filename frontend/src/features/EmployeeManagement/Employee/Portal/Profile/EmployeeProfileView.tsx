import React from 'react';
import { 
  Building, 
  MapPin, 
  Mail, 
  Phone, 
  Hash, 
  Ruler, 
  Scale, 
  Flag, 
  Briefcase, 
  GraduationCap, 
  Calendar as LucideCalendar, 
  Clock, 
  Heart, 
  Linkedin, 
  Facebook, 
  Twitter, 
  Link as LinkIcon, 
  ScanLine,
  UserCheck,
  CreditCard
} from 'lucide-react';

interface Education {
  type?: string;
  institution: string;
  degree?: string;
  fieldOfStudy?: string;
  startDate?: string;
  endDate?: string;
}

interface Skill {
  skillName: string;
  proficiencyLevel?: string;
}

interface EmergencyContact {
  name: string;
  relationship: string;
  phoneNumber: string;
  address?: string;
}

interface FamilyMember {
  id: number;
  relationType: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  occupation?: string;
  employer?: string;
  businessAddress?: string;
  telephoneNo?: string;
  dateOfBirth?: string;
}

interface Profile {
  id: number;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  suffix?: string;
  email?: string;
  avatarUrl?: string;
  avatar?: string;
  positionTitle?: string;
  jobTitle?: string;
  employeeId?: string;
  department?: string;
  employmentStatus?: string;
  birthDate?: string;
  gender?: string;
  civilStatus?: string;
  nationality?: string;
  bloodType?: string;
  heightM?: number;
  weightKg?: number;
  placeOfBirth?: string;
  citizenship?: string;
  citizenshipType?: string;
  dualCitizenshipCountry?: string;
  residentialAddress?: string;
  residentialZipCode?: string;
  permanentAddress?: string;
  permanentZipCode?: string;
  address?: string;
  telephoneNo?: string;
  mobileNo?: string;
  itemNumber?: string;
  salaryGrade?: string;
  stepIncrement?: string | number;
  appointmentType?: string;
  station?: string;
  officeAddress?: string;
  dateHired?: string;
  firstDayOfService?: string;
  role?: string;
  gsisNumber?: string;
  philhealthNumber?: string;
  pagibigNumber?: string;
  tinNumber?: string;
  umidId?: string;
  philsysId?: string;
  agencyEmployeeNo?: string;
  phoneNumber?: string;
  emergencyContact?: string;
  emergencyContactNumber?: string;
  resHouseBlockLot?: string;
  resStreet?: string;
  resSubdivision?: string;
  resBarangay?: string;
  resCity?: string;
  resProvince?: string;
  permHouseBlockLot?: string;
  permStreet?: string;
  permSubdivision?: string;
  permBarangay?: string;
  permCity?: string;
  permProvince?: string;
  rightThumbmarkUrl?: string;
  ctcNo?: string;
  ctcIssuedAt?: string;
  ctcIssuedDate?: string;
  education?: Education[];
  skills?: Skill[];
  emergencyContacts?: EmergencyContact[];
  // Plantilla-required eligibility fields
  eligibilityType?: string;
  eligibilityNumber?: string;
  eligibilityDate?: string;
  educationalBackground?: string;
  yearsOfExperience?: number;
  // Social Media
  facebookUrl?: string;
  linkedinUrl?: string;
  twitterHandle?: string;
  duties?: string;
  barangay?: string;
  religion?: string;
  voluntaryWork?: any[];
  learningDevelopment?: any[];
  experience?: string | null;
  familyBackground?: FamilyMember[];
  schoolName?: string;
  course?: string;
  umidNumber?: string;
  yearGraduated?: string;
  coreCompetencies?: string;
  otherInfo?: any[];
  references?: any[];
}

interface EmployeeProfileViewProps {
  profile: Profile;
}

const EmployeeProfileView: React.FC<EmployeeProfileViewProps> = ({ profile }) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (e) {
      return dateString;
    }
  };

  const calculateAge = (birthDate?: string) => {
    if (!birthDate) return '-';
    try {
      const today = new Date();
      const birth = new Date(birthDate);
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return age.toString();
    } catch (e) {
      return '-';
    }
  };

  const Section: React.FC<{ title: string; children: React.ReactNode; icon?: any; columns?: string }> = ({ title, children, icon: Icon, columns = "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" }) => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
      <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex items-center gap-3">
        {Icon && <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-100 text-blue-600"><Icon size={18} /></div>}
        <h3 className="font-bold text-gray-800 tracking-tight">{title}</h3>
      </div>
      <div className={`p-6 grid ${columns} gap-6`}>
        {children}
      </div>
    </div>
  );

  const DataField: React.FC<{ label: string; value: any; icon?: any; highlight?: boolean }> = ({ label, value, icon: Icon, highlight }) => (
    <div className="space-y-1.5 group">
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block pl-1">{label}</span>
      <div className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all duration-200 ${highlight ? 'bg-blue-50/50 border-blue-100' : 'bg-gray-50/20 border-gray-100 group-hover:border-gray-200 group-hover:bg-gray-50/40'}`}>
        {Icon && <Icon size={14} className={highlight ? 'text-blue-500' : 'text-gray-400 group-hover:text-blue-400'} />}
        <span className={`text-sm tracking-tight ${highlight ? 'font-bold text-blue-700' : 'font-semibold text-gray-700'} break-all`}>
          {value || '-'}
        </span>
      </div>
    </div>
  );

  const TextAreaField: React.FC<{ label: string; value: any; icon?: any; fullWidth?: boolean }> = ({ label, value, icon: Icon, fullWidth }) => (
    <div className={`space-y-1.5 ${fullWidth ? 'col-span-full' : ''}`}>
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block pl-1">{label}</span>
      <div className="flex gap-2.5 p-3 rounded-xl border bg-gray-50/20 border-gray-100 min-h-[60px]">
        {Icon && <Icon size={14} className="text-gray-400 mt-1 shrink-0" />}
        <span className="text-sm tracking-tight font-semibold text-gray-700 whitespace-pre-wrap leading-relaxed">
          {value || '-'}
        </span>
      </div>
    </div>
  );

  // Check if employee has a negative status that can be reverted
  const currentStatus = profile.employmentStatus || 'Active';
  const isNegativeStatus = ['Terminated', 'Suspended', 'Show Cause', 'Verbal Warning', 'Written Warning'].includes(currentStatus);
  const isActive = currentStatus === 'Active';

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      {/* PROFILE HEADER */}
      <div className="relative mb-8 rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-[#1a2b3c] to-[#0d151e] border border-white/10 min-h-[140px] md:min-h-[160px]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.05),transparent)] pointer-events-none"></div>
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
        
        <div className="relative z-10 p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-lg bg-gray-700 border-2 border-white/20 shadow-lg overflow-hidden flex items-center justify-center">
              {profile.avatarUrl || profile.avatar ? (
                <img src={profile.avatarUrl || profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-black text-gray-500">{profile.firstName?.[0]}{profile.lastName?.[0]}</span>
              )}
            </div>
            <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-gray-900 shadow-md ${isActive ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
          </div>
          
          <div className="text-center md:text-left flex-1 space-y-2">
            <h1 className="text-2xl font-bold tracking-tight mb-1 flex items-center justify-center md:justify-start">
              <span className="text-white">{profile.firstName} {profile.lastName}</span>
              {calculateAge(profile.birthDate) !== '-' && Number(calculateAge(profile.birthDate)) >= 60 && (
                <span className="ml-3 text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded-full uppercase tracking-tighter align-middle font-black shadow-sm border border-amber-400/50 shrink-0">
                  Senior Citizen
                </span>
              )}
            </h1>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 md:gap-4 text-gray-300 text-xs font-medium">
              <span className="flex items-center gap-1.5 bg-white/10 px-2 py-1 rounded">
                <Briefcase size={12} /> {profile.positionTitle || profile.jobTitle || 'No Title'}
              </span>
              <span className="flex items-center gap-1.5 bg-white/10 px-2 py-1 rounded">
                <Hash size={12} /> {profile.employeeId}
              </span>
              <span className="flex items-center gap-1.5 bg-white/10 px-2 py-1 rounded">
                <Mail size={12} /> {profile.email}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg border ${isActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
              {currentStatus}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        
        {/* PERSONAL INFORMATION */}
        <Section title="Personal Information">
          <DataField label="Last Name" value={profile.lastName} />
          <DataField label="First Name" value={profile.firstName} />
          <DataField label="Middle Name" value={profile.middleName} />
          <DataField label="Suffix" value={profile.suffix} />
          <DataField label="Birth Date" value={formatDate(profile.birthDate)} icon={LucideCalendar} />
          <DataField label="Place of Birth" value={profile.placeOfBirth} />
          <DataField label="Gender" value={profile.gender} />
          <DataField label="Civil Status" value={profile.civilStatus} />
          <DataField label="Nationality" value={profile.nationality} icon={Flag} />
          <DataField label="Religion" value={profile.religion} />
          <DataField label="Citizenship" value={profile.citizenship} />
          {profile.citizenship === 'Dual Citizenship' && (
            <DataField label="Citizenship Type" value={profile.citizenshipType} />
          )}
          <DataField label="Blood Type" value={profile.bloodType} />
          <DataField label="Height (m)" value={profile.heightM} icon={Ruler} />
          <DataField label="Weight (kg)" value={profile.weightKg} icon={Scale} />
          <DataField label="Age" value={calculateAge(profile.birthDate)} icon={UserCheck} highlight={calculateAge(profile.birthDate) !== '-' && Number(calculateAge(profile.birthDate)) >= 60} />
        </Section>

        {/* CONTACT & ADDRESS */}
        <Section title="Contact & Address" columns="grid-cols-1 md:grid-cols-2">
          <TextAreaField 
            label="Residential Address" 
            value={profile.resHouseBlockLot || profile.resStreet || profile.resSubdivision || profile.resBarangay || profile.resCity || profile.resProvince ? 
              `${profile.resHouseBlockLot || ''} ${profile.resStreet || ''} ${profile.resSubdivision || ''} ${profile.resBarangay || ''} ${profile.resCity || ''} ${profile.resProvince || ''}`.trim().replace(/\s+/g, ' ') : 
              (profile.residentialAddress || profile.address)} 
            icon={MapPin} 
            fullWidth 
          />
          <DataField label="Res. House/Block/Lot" value={profile.resHouseBlockLot} />
          <DataField label="Res. Street" value={profile.resStreet} />
          <DataField label="Res. Subdivision" value={profile.resSubdivision} />
          <DataField label="Res. Barangay" value={profile.resBarangay || profile.barangay} />
          <DataField label="Res. City/Municipality" value={profile.resCity} />
          <DataField label="Res. Province" value={profile.resProvince} />
          <DataField label="Residential ZIP" value={profile.residentialZipCode} />
          <div className="hidden md:block"></div>

          <TextAreaField 
            label="Permanent Address" 
            value={profile.permHouseBlockLot || profile.permStreet || profile.permSubdivision || profile.permBarangay || profile.permCity || profile.permProvince ? 
              `${profile.permHouseBlockLot || ''} ${profile.permStreet || ''} ${profile.permSubdivision || ''} ${profile.permBarangay || ''} ${profile.permCity || ''} ${profile.permProvince || ''}`.trim().replace(/\s+/g, ' ') : 
              profile.permanentAddress} 
            icon={MapPin} 
            fullWidth 
          />
          <DataField label="Perm. House/Block/Lot" value={profile.permHouseBlockLot} />
          <DataField label="Perm. Street" value={profile.permStreet} />
          <DataField label="Perm. Subdivision" value={profile.permSubdivision} />
          <DataField label="Perm. Barangay" value={profile.permBarangay} />
          <DataField label="Perm. City/Municipality" value={profile.permCity} />
          <DataField label="Perm. Province" value={profile.permProvince} />
          <DataField label="Permanent ZIP" value={profile.permanentZipCode} />
          <div className="hidden md:block"></div>

          <DataField label="Mobile Number" value={profile.mobileNo || profile.phoneNumber} icon={Phone} />
          <DataField label="Official Email" value={profile.email} icon={Mail} />
          
          <DataField label="Emergency Contact Person" value={profile.emergencyContact} icon={Heart} />
          <DataField label="Emergency Phone" value={profile.emergencyContactNumber} icon={Phone} />
        </Section>

        {/* GOVERNMENT IDENTIFICATION */}
        <Section title="Government Identification">
          <DataField label="GSIS ID No." value={profile.gsisNumber} />
          <DataField label="PAG-IBIG No." value={profile.pagibigNumber} />
          <DataField label="PhilHealth No." value={profile.philhealthNumber} />
          <DataField label="UMID Number" value={profile.umidNumber} />
          <DataField label="PHILSYS ID" value={profile.philsysId} />
          <DataField label="TIN No." value={profile.tinNumber} />
          <DataField label="Agency Employee No." value={profile.agencyEmployeeNo} />
        </Section>

        {/* BIOMETRIC & COMPLIANCE */}
        <Section title="Biometric & Compliance" columns="grid-cols-1 md:grid-cols-2">
           <div className="p-4 border border-gray-100 rounded-xl bg-gray-50/30 flex flex-col items-center">
             <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Right Thumbmark</h5>
             {profile.rightThumbmarkUrl ? (
               <img src={profile.rightThumbmarkUrl} alt="Right Thumbmark" className="h-24 w-auto grayscale contrast-125 mix-blend-multiply" />
             ) : (
               <div className="h-24 w-20 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center text-gray-300">
                 <ScanLine size={32} />
               </div>
             )}
           </div>
           <div className="space-y-4">
             <DataField label="CTC / Cedula No." value={profile.ctcNo} />
             <DataField label="CTC Issued At" value={profile.ctcIssuedAt} />
             <DataField label="CTC Issued Date" value={formatDate(profile.ctcIssuedDate)} icon={LucideCalendar} />
           </div>
        </Section>

        <Section title="Social Media Connections" icon={LinkIcon} columns="grid-cols-1 md:grid-cols-3">
          <DataField label="Facebook Profile" value={profile.facebookUrl} icon={Facebook} />
          <DataField label="LinkedIn Profile" value={profile.linkedinUrl} icon={Linkedin} />
          <DataField label="Twitter / X" value={profile.twitterHandle} icon={Twitter} />
        </Section>

        {/* EDUCATIONAL BACKGROUND */}
        <Section title="Educational Background" columns="grid-cols-1 md:grid-cols-2">
          <DataField label="Educational Background" value={profile.educationalBackground} icon={GraduationCap} />
          <DataField label="School / University" value={profile.schoolName || profile.educationalBackground} />
          <DataField label="Course / Degree" value={profile.course} />
          <DataField label="Year Graduated" value={profile.yearGraduated} />
          <DataField label="Years of Experience" value={profile.yearsOfExperience} />
          <TextAreaField label="Core Competencies" value={profile.coreCompetencies} />
          <TextAreaField label="Work Experience Log" value={profile.experience} fullWidth />
          
          <div className="col-span-full mt-4">
             <h5 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 ml-1">Academic History</h5>
             <div className="border border-gray-100 rounded-xl overflow-hidden bg-white">
               <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-2">Level/Type</th>
                      <th className="px-4 py-2">Institution</th>
                      <th className="px-4 py-2 text-right">Period</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {profile.education?.length ? (
                      profile.education.map((edu, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/50">
                          <td className="px-4 py-3 font-semibold text-blue-600">{edu.type || 'N/A'}</td>
                          <td className="px-4 py-3">
                             <div className="font-bold text-gray-800">{edu.institution}</div>
                             <div className="text-[10px] text-gray-500">{edu.degree} {edu.fieldOfStudy ? `• ${edu.fieldOfStudy}` : ''}</div>
                          </td>
                          <td className="px-4 py-3 text-right text-gray-500">{edu.startDate && edu.endDate ? `${edu.startDate} - ${edu.endDate}` : 'N/A'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-400 italic">No education records found</td></tr>
                    )}
                  </tbody>
               </table>
             </div>
          </div>
        </Section>

        {/* ELIGIBILITY / CIVIL SERVICE */}
        <Section title="Eligibility / Civil Service" columns="grid-cols-1 md:grid-cols-3">
          <DataField label="Eligibility Type" value={profile.eligibilityType} />
          <DataField label="License/ID Number" value={profile.eligibilityNumber} icon={Hash} />
          <DataField label="Date of Validity/Exam" value={formatDate(profile.eligibilityDate)} icon={LucideCalendar} />
        </Section>

        {/* FAMILY BACKGROUND */}
        <Section title="Family Background" columns="grid-cols-1">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {['Spouse', 'Father', 'Mother'].map((relation: string) => {
                const member = profile.familyBackground?.find((m: FamilyMember) => m.relationType === relation);
                return (
                  <div key={relation} className="p-4 border border-gray-100 rounded-xl bg-gray-50/30">
                    <h5 className="text-[10px] font-bold text-green-600 uppercase tracking-widest mb-3">{relation}'s Information</h5>
                    <div className="space-y-3">
                      <DataField label="Full Name" value={member ? `${member.firstName || ''} ${member.lastName || ''}`.trim() : '-'} />
                      <DataField label="Occupation" value={member?.occupation} />
                      <DataField label="Employer" value={member?.employer} />
                      {relation === 'Spouse' && (
                        <>
                          <DataField label="Business Address" value={member?.businessAddress} />
                          <DataField label="Telephone No." value={member?.telephoneNo} />
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4">
               <h5 className="text-[10px] font-bold text-green-600 uppercase tracking-widest mb-3 ml-1">Children</h5>
               <div className="border border-gray-100 rounded-xl overflow-hidden bg-white">
                 <table className="w-full text-xs text-left">
                    <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-100">
                      <tr>
                        <th className="px-4 py-2">Full Name</th>
                        <th className="px-4 py-2 text-right">Date of Birth</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {profile.familyBackground?.filter((m: FamilyMember) => m.relationType === 'Child').length ? (
                        profile.familyBackground.filter((m: FamilyMember) => m.relationType === 'Child').map((child: FamilyMember, idx: number) => (
                          <tr key={idx}>
                            <td className="px-4 py-2 font-medium">{child.firstName} {child.lastName}</td>
                            <td className="px-4 py-2 text-right text-gray-500">{formatDate(child.dateOfBirth)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan={2} className="px-4 py-3 text-center text-gray-400 italic">No children records found</td></tr>
                      )}
                    </tbody>
                 </table>
               </div>
            </div>
          </div>
        </Section>

        {/* VOLUNTARY WORK */}
        <Section title="Voluntary Work" icon={Briefcase}>
          <div className="space-y-4">
             {profile.voluntaryWork?.length ? (
               profile.voluntaryWork.map((vw: any) => (
                 <div key={vw.id} className="p-4 border border-gray-100 rounded-xl bg-gray-50/20">
                    <div className="flex justify-between items-start mb-2">
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
               <p className="text-xs text-center text-gray-400 italic py-4">No voluntary work records found</p>
             )}
          </div>
        </Section>

        {/* TRAINING / LEARNING & DEVELOPMENT */}
        <Section title="Learning & Development (Training)" icon={Briefcase}>
          <div className="space-y-4">
             {profile.learningDevelopment?.length ? (
               profile.learningDevelopment.map((ld: any) => (
                 <div key={ld.id} className="p-4 border border-gray-100 rounded-xl bg-gray-50/20">
                    <div className="flex justify-between items-start mb-2">
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
          </div>
        </Section>

        {/* OTHER INFORMATION */}
        <Section title="Other Information (PDS)" columns="grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          <div className="col-span-full mb-4">
             <h5 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Skills, Recognitions, Memberships</h5>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['Skill', 'Recognition', 'Membership'].map(type => (
                  <div key={type} className="p-4 border border-gray-100 rounded-xl bg-gray-50/30">
                    <h6 className="text-[10px] font-bold text-blue-600 uppercase mb-2">{type}s</h6>
                    <div className="space-y-2">
                       {profile.otherInfo?.filter((oi: any) => oi.type === type).map((oi: any, i: number) => (
                         <div key={i} className="text-xs font-semibold text-gray-700 bg-white p-2 rounded border border-gray-200">{oi.description}</div>
                       )) || <p className="text-[10px] italic text-gray-400">None listed</p>}
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </Section>

        {/* REFERENCES */}
        <Section title="References" columns="grid-cols-1">
           <div className="border border-gray-100 rounded-xl overflow-hidden bg-white">
             <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-2">Name</th>
                    <th className="px-4 py-2">Address</th>
                    <th className="px-4 py-2 text-right">Telephone</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {profile.references?.length ? (
                    profile.references.map((ref: any, idx: number) => (
                      <tr key={idx}>
                        <td className="px-4 py-2 font-bold text-gray-800">{ref.name}</td>
                        <td className="px-4 py-2 text-gray-600">{ref.address}</td>
                        <td className="px-4 py-2 text-right text-gray-500">{ref.telNo}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-400 italic">No reference records found</td></tr>
                  )}
                </tbody>
             </table>
           </div>
        </Section>

        {/* EMPLOYMENT DETAILS (INTERNAL) */}
        <Section title="HR Internal Details">
          <DataField label="Department" value={profile.department} icon={Building} highlight />
          <DataField label="Position Title" value={profile.positionTitle || profile.jobTitle} highlight />
          <DataField label="Item Number" value={profile.itemNumber} icon={Hash} />
          <DataField label="Salary Grade" value={profile.salaryGrade} icon={CreditCard} />
          <DataField label="Step Increment" value={profile.stepIncrement} icon={Hash} />
          <DataField label="Appointment Type" value={profile.appointmentType} />
          <DataField label="Employment Status" value={currentStatus} highlight />
          <DataField label="Station" value={profile.station} icon={Building} />
          <TextAreaField label="Office Address" value={profile.officeAddress} icon={MapPin} fullWidth />
          <DataField label="Date Hired" value={formatDate(profile.dateHired)} icon={LucideCalendar} />
          <DataField label="First Day of Service" value={formatDate(profile.firstDayOfService)} icon={Clock} />
        </Section>

      </div>

    </div>
  );
};

export default EmployeeProfileView;
