import { useState, useCallback, useEffect } from "react";
import { 
  Loader2, 
  Save, Link as LinkIcon, 
  Phone, User as UserIcon, Paperclip, AlertCircle
} from "lucide-react";
import { fetchEmployeeProfile, employeeApi, fetchEmployeeDocuments, getNextStepIncrement } from "@/api/employeeApi";
import { EmployeeDocument } from "@/types";
import Combobox from "@/components/Custom/Combobox";
import ph from 'phil-reg-prov-mun-brgy';
import { getZipByMunCode } from '@/data/ph-zipcodes';
import { Region, Province, CityMunicipality, Barangay } from '@/types/ph-address';
import { useToastStore } from '@/stores';
import { useEmploymentMetadataQuery, useGovtIdUniquenessQuery } from "@/hooks/useCommonQueries";
import { useDebounce } from "@/hooks/useDebounce";import { ID_REGEX } from "@/schemas/idValidation";
import DocumentGallery from "@features/Settings/Profile/components/DocumentGallery";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Child {
  id: string;
  fullName: string;
  dob: string;
}

interface Eligibility {
  id?: string | number;
  name: string;
  rating: string;
  examDate: string;
  examPlace: string;
  licenseNo: string;
  licenseValidUntil: string;
}

interface WorkExperience {
  id?: string | number;
  positionTitle: string;
  department: string;
  from: string;
  to: string;
  monthlySalary: string;
  salaryGrade: string;
  appointmentStatus: string;
  govtService: string;
}

interface VoluntaryWork {
  id?: string | number;
  organization: string;
  from: string;
  to: string;
  hours: string;
  positionNature: string;
}

interface Training {
  id?: string | number;
  title: string;
  from: string;
  to: string;
  hours: string;
  ldType: string;
  conductedBy: string;
}

interface Reference {
  id?: string | number;
  name: string;
  address: string;
  contact: string;
}

export interface PDSFormData {
  surname: string; firstName: string; middleName: string; nameExtension: string;
  dob: string; pob: string; sex: string; civilStatus: string;
  height: string; weight: string; bloodType: string; citizenship: string; dualCountry: string;
  umidId: string; pagibigId: string; philhealthNo: string; philsysNo: string; tinNo: string; gsisId: string; agencyEmployeeNo: string;
  resHouseStreet: string; resSubdivision: string; resBarangay: string; resCityMunicipality: string; resProvince: string; resZip: string;
  resRegion: string; resHouseBlockLot: string; resStreet: string;
  sameAddress: boolean;
  permHouseStreet: string; permSubdivision: string; permBarangay: string; permCityMunicipality: string; permProvince: string; permZip: string;
  permRegion: string; permHouseBlockLot: string; permStreet: string;
  telephone: string; mobile: string; email: string;
  spouseSurname: string; spouseFirstName: string; spouseMiddleName: string; spouseExtension: string;
  spouseOccupation: string; spouseEmployer: string; spouseBusinessAddress: string; spouseTelephone: string;
  children: Child[];
  fatherSurname: string; fatherFirstName: string; fatherMiddleName: string; fatherExtension: string;
  motherSurname: string; motherFirstName: string; motherMiddleName: string;
  education: {
    Elementary: { school: string; course: string; from: string; to: string; units: string; yearGrad: string; honors: string };
    Secondary: { school: string; course: string; from: string; to: string; units: string; yearGrad: string; honors: string };
    Vocational: { school: string; course: string; from: string; to: string; units: string; yearGrad: string; honors: string };
    College: { school: string; course: string; from: string; to: string; units: string; yearGrad: string; honors: string };
    Graduate: { school: string; course: string; from: string; to: string; units: string; yearGrad: string; honors: string };
  };
  eligibilities: Eligibility[];
  workExperiences: WorkExperience[];
  voluntaryWorks: VoluntaryWork[];
  trainings: Training[];
  specialSkills: string;
  nonAcademicDistinctions: string;
  memberships: string;
  relatedThirdDegree: string;
  relatedThirdDetails: string;
  relatedFourthDegree: string;
  relatedFourthDetails: string;
  foundGuiltyAdmin: string;
  foundGuiltyDetails: string;
  criminallyCharged: string;
  dateFiled: string;
  statusOfCase: string;
  convictedCrime: string;
  convictedDetails: string;
  separatedFromService: string;
  separatedDetails: string;
  electionCandidate: string;
  electionDetails: string;
  resignedToPromote: string;
  resignedDetails: string;
  immigrantStatus: string;
  immigrantDetails: string;
  indigenousMember: string;
  indigenousDetails: string;
  personWithDisability: string;
  disabilityIdNo: string;
  soloParent: string;
  soloParentIdNo: string;
  references: Reference[];
  govtIdType: string;
  govtIdNo: string;
  govtIdIssuance: string;
  dateAccomplished: string;
  declarationAgreed: boolean;
  
  // HR Details
  itemNumber: string;
  salaryGrade: string;
  stepIncrement: string;
  appointmentType: string;
  employmentStatus: string;
  station: string;
  officeAddress: string;
  dateHired: string;
  department: string;
  jobTitle: string;
  firstDayOfService: string;
  nextStepDate: string;
  totalLwopDays: number;
  dutyType: string;
  isMeycauayan: string;
  
  // Social Media
  facebookUrl: string;
  linkedinUrl: string;
  twitterHandle: string;

  // Emergency Contact
  emergencyContactPerson: string;
  emergencyContactPhone: string;
}

export type PDSSetter = <K extends keyof PDSFormData>(key: K, value: PDSFormData[K]) => void;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2, 8);

const emptyEdu = () => ({ school: "", course: "", from: "", to: "", units: "", yearGrad: "", honors: "" });

const emptyEligibility = (): Eligibility => ({
  id: uid(), name: "", rating: "", examDate: "", examPlace: "", licenseNo: "", licenseValidUntil: "",
});

const emptyWork = (): WorkExperience => ({
  id: uid(), positionTitle: "", department: "", from: "", to: "", monthlySalary: "",
  salaryGrade: "", appointmentStatus: "", govtService: "",
});

const emptyVoluntary = (): VoluntaryWork => ({
  id: uid(), organization: "", from: "", to: "", hours: "", positionNature: "",
});

const emptyTraining = (): Training => ({
  id: uid(), title: "", from: "", to: "", hours: "", ldType: "", conductedBy: "",
});

const formatName = (name: string) => {
  if (!name) return '';
  const upper = name.toUpperCase();
  const specifics = ['NCR', 'CAR', 'BARMM', 'IV-A', 'IV-B', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII'];
  return upper.split(' ').map(word => {
    if (!word) return '';
    const cleanWord = word.replace(/^\(|\)$/g, '');
    if (specifics.includes(cleanWord)) return word;
    const lowerWord = word.toLowerCase();
    if (lowerWord === 'of' || lowerWord === 'de' || lowerWord === 'del') return lowerWord;
    if (word.startsWith('(')) return '(' + word.charAt(1).toUpperCase() + word.slice(2).toLowerCase();
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join(' ');
};

const formatAddr = (reg: string, prov: string, city: string, brgy: string, house: string, subd: string, street: string) => {
  const lib = ph as any;
  const rName = formatName(lib.regions.find((x: any) => x.reg_code === reg)?.name || '');
  const pName = formatName(lib.provinces.find((x: any) => x.prov_code === prov)?.name || '');
  const cName = formatName(lib.city_mun.find((x: any) => x.mun_code === city)?.name || '');
  const bName = formatName(brgy);
  return [house, subd, street, bName, cName, pName, rName].filter(Boolean).join(', ');
};

const PDSAddressSelector = ({ prefix, data, set, isMeycauayanOnly = false }: { prefix: 'res' | 'perm'; data: PDSFormData; set: PDSSetter; isMeycauayanOnly?: boolean }) => {
  const watchRegion = (data as any)[`${prefix}Region`];
  const watchProvince = (data as any)[`${prefix}Province`];
  const watchCity = (data as any)[`${prefix}CityMunicipality`];
  const [regions, setRegions] = useState<Region[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [cities, setCities] = useState<CityMunicipality[]>([]);
  const [barangays, setBarangays] = useState<Barangay[]>([]);
  const zipField = `${prefix}Zip` as keyof PDSFormData;

  useEffect(() => {
    if (isMeycauayanOnly) {
      const reg3 = ph.regions.find((r: Region) => r.reg_code === '03');
      setRegions(reg3 ? [reg3] : []);
      set(`${prefix}Region` as any, '03');
      const bulacan = ph.provinces.find((p: Province) => p.prov_code === '0314');
      setProvinces(bulacan ? [bulacan] : []);
      set(`${prefix}Province` as any, '0314');
      const meycauayan = ph.city_mun.find((c: CityMunicipality) => c.mun_code === '031412' || c.name.toUpperCase().includes('MEYCAUAYAN'));
      setCities(meycauayan ? [meycauayan] : []);
      const munCode = meycauayan?.mun_code || '031412';
      set(`${prefix}CityMunicipality` as any, munCode);
      const zip = getZipByMunCode(munCode);
      if (zip) set(zipField as any, zip);
    } else {
      setRegions(ph.regions || []);
    }
  }, [isMeycauayanOnly, prefix]);

  useEffect(() => {
    if (isMeycauayanOnly) return;
    if (watchRegion) {
      setProvinces(ph.provinces.filter((p: Province) => p.reg_code === watchRegion) || []);
      if (watchRegion === '13') setCities(ph.city_mun.filter((c: CityMunicipality) => c.reg_code === '13') || []);
    } else setProvinces([]);
  }, [watchRegion, isMeycauayanOnly]);

  useEffect(() => {
    if (isMeycauayanOnly) return;
    if (watchProvince) setCities(ph.city_mun.filter((c: CityMunicipality) => c.prov_code === watchProvince) || []);
    else if (watchRegion !== '13') setCities([]);
  }, [watchProvince, watchRegion, isMeycauayanOnly]);

  useEffect(() => {
    if (watchCity) {
      setBarangays(ph.barangays.filter((b: Barangay) => b.mun_code === watchCity) || []);
      const zip = getZipByMunCode(String(watchCity));
      if (zip) set(zipField as any, zip);
    } else setBarangays([]);
  }, [watchCity, prefix]);

  return (
    <div className="space-y-4">
      <Grid cols={2}>
        <Field label="Region">
          <Combobox 
            options={regions.map((r: Region) => ({ value: r.reg_code, label: formatName(r.name) }))}
            value={watchRegion || ''}
            onChange={(val: string) => { set(`${prefix}Region` as any, val); set(`${prefix}Province` as any, ''); set(`${prefix}CityMunicipality` as any, ''); set(`${prefix}Barangay` as any, ''); }}
            placeholder="Select Region" disabled={isMeycauayanOnly}
            buttonClassName="rounded-lg bg-white border-gray-200 font-bold text-gray-700 h-11 transition-all hover:border-gray-400 focus:ring-4 focus:ring-gray-100/50 focus:border-gray-400"
          />
        </Field>
        <Field label="Province">
          <Combobox 
            options={provinces.map((p: Province) => ({ value: p.prov_code, label: formatName(p.name) }))}
            value={watchProvince || ''}
            onChange={(val: string) => { set(`${prefix}Province` as any, val); set(`${prefix}CityMunicipality` as any, ''); set(`${prefix}Barangay` as any, ''); }}
            placeholder="Select Province" disabled={isMeycauayanOnly || (!watchRegion && watchRegion !== '13')}
            buttonClassName="rounded-lg bg-white border-gray-200 font-bold text-gray-700 h-11 transition-all hover:border-gray-400 focus:ring-4 focus:ring-gray-100/50 focus:border-gray-400"
          />
        </Field>
        <Field label="City / Municipality">
          <Combobox 
            options={cities.map((c: CityMunicipality) => ({ value: c.mun_code, label: formatName(c.name) }))}
            value={watchCity || ''}
            onChange={(val: string) => { set(`${prefix}CityMunicipality` as any, val); set(`${prefix}Barangay` as any, ''); }}
            placeholder="Select City" disabled={isMeycauayanOnly || (!watchProvince && watchRegion !== '13')}
            buttonClassName="rounded-lg bg-white border-gray-200 font-bold text-gray-700 h-11 transition-all hover:border-gray-400 focus:ring-4 focus:ring-gray-100/50 focus:border-gray-400"
          />
        </Field>
        <Field label="Barangay">
          <Combobox 
            options={barangays.map((b: Barangay) => ({ value: b.name, label: formatName(b.name) }))}
            value={(data as any)[`${prefix}Barangay`] || ''}
            onChange={(val: string) => set(`${prefix}Barangay` as any, val)}
            placeholder="Select Barangay" disabled={!watchCity}
            buttonClassName="rounded-lg bg-white border-gray-200 font-bold text-gray-700 h-11 transition-all hover:border-gray-400 focus:ring-4 focus:ring-gray-100/50 focus:border-gray-400"
          />
        </Field>
      </Grid>
      <Grid cols={3}>
        <Field label="House / Block / Lot No."><Input value={(data as any)[`${prefix}HouseBlockLot`]} onChange={e => set(`${prefix}HouseBlockLot` as any, e.target.value)} placeholder="e.g. Lot 1 Block 2" /></Field>
        <Field label="Subdivision / Village"><Input value={(data as any)[`${prefix}Subdivision`]} onChange={e => set(`${prefix}Subdivision` as any, e.target.value)} placeholder="e.g. Green Village" /></Field>
        <Field label="Street"><Input value={(data as any)[`${prefix}Street`]} onChange={e => set(`${prefix}Street` as any, e.target.value)} placeholder="e.g. Rizal Street" /></Field>
      </Grid>
      <Grid cols={3}>
        <Field label="Zip Code"><Input value={(data as any)[`${prefix}Zip`]} readOnly className="bg-gray-50 cursor-not-allowed" placeholder="Auto-populated" /></Field>
      </Grid>
    </div>
  );
};

const initialData: PDSFormData = {
  surname: "", firstName: "", middleName: "", nameExtension: "", dob: "", pob: "",
  sex: "", civilStatus: "", height: "", weight: "", bloodType: "", citizenship: "", dualCountry: "",
  umidId: "", pagibigId: "", philhealthNo: "", philsysNo: "", tinNo: "", gsisId: "", agencyEmployeeNo: "",
  resHouseStreet: "", resSubdivision: "", resBarangay: "", resCityMunicipality: "", resProvince: "", resZip: "",
  resRegion: "", resHouseBlockLot: "", resStreet: "",
  sameAddress: false,
  permHouseStreet: "", permSubdivision: "", permBarangay: "", permCityMunicipality: "", permProvince: "", permZip: "",
  permRegion: "", permHouseBlockLot: "", permStreet: "",
  telephone: "", mobile: "", email: "",
  spouseSurname: "", spouseFirstName: "", spouseMiddleName: "", spouseExtension: "",
  spouseOccupation: "", spouseEmployer: "", spouseBusinessAddress: "", spouseTelephone: "",
  children: [],
  fatherSurname: "", fatherFirstName: "", fatherMiddleName: "", fatherExtension: "",
  motherSurname: "", motherFirstName: "", motherMiddleName: "",
  education: { Elementary: emptyEdu(), Secondary: emptyEdu(), Vocational: emptyEdu(), College: emptyEdu(), Graduate: emptyEdu() },
  eligibilities: [emptyEligibility()],
  workExperiences: [emptyWork()],
  voluntaryWorks: [emptyVoluntary()],
  trainings: [emptyTraining()],
  specialSkills: "", nonAcademicDistinctions: "", memberships: "",
  relatedThirdDegree: "No", relatedThirdDetails: "",
  relatedFourthDegree: "No", relatedFourthDetails: "",
  foundGuiltyAdmin: "No", foundGuiltyDetails: "",
  criminallyCharged: "No", dateFiled: "", statusOfCase: "",
  convictedCrime: "No", convictedDetails: "",
  separatedFromService: "No", separatedDetails: "",
  electionCandidate: "No", electionDetails: "",
  resignedToPromote: "No", resignedDetails: "",
  immigrantStatus: "No", immigrantDetails: "",
  indigenousMember: "No", indigenousDetails: "",
  personWithDisability: "No", disabilityIdNo: "",
  soloParent: "No", soloParentIdNo: "",
  references: [{ name: "", address: "", contact: "" }, { name: "", address: "", contact: "" }, { name: "", address: "", contact: "" }],
  govtIdType: "", govtIdNo: "", govtIdIssuance: "", dateAccomplished: "",
  declarationAgreed: false,
  itemNumber: "", salaryGrade: "", stepIncrement: "", appointmentType: "", employmentStatus: "", station: "", officeAddress: "", dateHired: "", department: "", jobTitle: "",
  firstDayOfService: "", nextStepDate: "", totalLwopDays: 0,
  dutyType: "Standard", isMeycauayan: "false",
  facebookUrl: "", linkedinUrl: "", twitterHandle: "",
  emergencyContactPerson: "", emergencyContactPhone: "",
};

// ─── Sub-components using Tailwind ───────────────────────────────────────────

const Field = ({ label, children, span = 1 }: { label: string; children: React.ReactNode; span?: number }) => (
  <div className="flex flex-col gap-2" style={{ gridColumn: `span ${span}` }}>
    <label className="text-[11px] font-bold text-gray-500 ml-1">{label}</label>
    {children}
  </div>
);

const Input = (props: React.InputHTMLAttributes<HTMLInputElement> & { icon?: any; isError?: boolean; errorMessage?: string }) => {
  const { icon: Icon, isError, errorMessage, ...rest } = props;
  return (
    <div className="flex flex-col gap-1.1 w-full">
      <div className="relative">
        {Icon && <Icon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />}
        <input 
          {...rest} 
          className={`w-full bg-white border rounded-lg ${Icon ? 'pl-11' : 'px-4'} py-3 text-sm font-semibold text-gray-700 outline-none transition-all focus:ring-4 placeholder:text-gray-400 ${isError ? 'border-red-500 bg-red-50 focus:ring-red-100 focus:border-red-500' : 'border-gray-200 focus:ring-gray-100/50 focus:border-gray-400'} ${props.className || ""}`} 
        />
      </div>
      {isError && errorMessage && (
        <span className="text-[9px] font-bold text-red-500 ml-1 mt-0.5 animate-pulse flex items-center gap-1">
          <AlertCircle size={10} /> {errorMessage}
        </span>
      )}
    </div>
  );
};

const Textarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea {...props} className={`w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm font-semibold text-gray-700 outline-none transition-all focus:ring-4 focus:ring-gray-100/50 focus:border-gray-400 placeholder:text-gray-400 min-h-[100px] ${props.className || ""}`} />
);

const Grid = ({ cols = 2, children, className }: { cols?: number; children: React.ReactNode; className?: string }) => {
  const colClass = cols === 1 ? "grid-cols-1" : cols === 2 ? "grid-cols-1 md:grid-cols-2" : cols === 3 ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : cols === 4 ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-4" : "grid-cols-1 md:grid-cols-2";
  return <div className={`grid gap-5 ${colClass} ${className || ""}`}>{children}</div>;
};

const SectionCard = ({ title, roman, children, id }: { title: string; roman: string | number; children: React.ReactNode; id?: string }) => (
  <div id={id} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm animate-in fade-in zoom-in-95 duration-300">
    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-50">
      <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 text-[10px] font-black flex items-center justify-center border border-gray-200">{roman}</div>
      <h2 className="text-xs font-bold text-gray-800">{title}</h2>
    </div>
    {children}
  </div>
);

const Divider = ({ label }: { label: string }) => (
  <div className="text-[10px] font-black text-gray-300 my-8 flex items-center gap-3 before:h-px before:bg-gray-100 before:flex-1 after:h-px after:bg-gray-100 after:flex-1">{label}</div>
);

const YesNo = ({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) => (
  <Field label={label}>
    <div className="flex gap-2">
      {["Yes", "No"].map(opt => (
        <button key={opt} onClick={() => onChange(opt)} className={`flex-1 py-2.5 border rounded-lg text-[10px] font-bold transition-all ${value === opt ? "bg-gray-900 border-gray-900 text-white shadow-md shadow-gray-900/10" : "bg-white border-gray-200 text-gray-400 hover:border-gray-300"}`}>{opt}</button>
      ))}
    </div>
  </Field>
);

const AddButton = ({ onClick, label }: { onClick: () => void; label: string }) => (
  <button onClick={onClick} className="w-full py-3 border-2 border-dashed border-gray-100 rounded-lg text-[10px] font-bold text-gray-400 hover:border-gray-300 hover:text-gray-600 hover:bg-gray-50 transition-all active:scale-[0.98] mt-4">+ {label}</button>
);

const EduRow = ({ data, onChange }: { data: any; onChange: (k: string, v: string) => void }) => (
  <div className="bg-gray-50/50 border border-gray-100 rounded-xl p-5 mb-4 last:mb-0">
    <Grid cols={1}>
      <Field label="School Name"><Input value={data.school} onChange={e => onChange("school", e.target.value)} placeholder="Full name of school" /></Field>
      <Grid cols={2}>
        <Field label="Degree / Course"><Input value={data.course} onChange={e => onChange("course", e.target.value)} placeholder="e.g. BS Computer Science" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="From (yyyy)"><Input type="number" value={data.from} onChange={e => onChange("from", e.target.value)} placeholder="yyyy" /></Field>
          <Field label="To (yyyy)"><Input type="number" value={data.to} onChange={e => onChange("to", e.target.value)} placeholder="yyyy" /></Field>
        </div>
      </Grid>
      <Grid cols={3}>
        <Field label="Units Earned"><Input value={data.units} onChange={e => onChange("units", e.target.value)} placeholder="e.g. 4th Year" /></Field>
        <Field label="Year Graduated"><Input type="number" value={data.yearGrad} onChange={e => onChange("yearGrad", e.target.value)} placeholder="yyyy" /></Field>
        <Field label="Honors Received"><Input value={data.honors} onChange={e => onChange("honors", e.target.value)} placeholder="Honors received" /></Field>
      </Grid>
    </Grid>
  </div>
);

// ─── Step Components ──────────────────────────────────────────────────────────

const StepPersonal = ({ data, set, metadata, isIdTakenMap }: { data: PDSFormData; set: PDSSetter; metadata: any; isIdTakenMap: Record<string, string> }) => (
  <SectionCard title="Personal Information" roman="I">
    <Grid cols={3}>
      <Field label="1. Surname"><Input value={data.surname} onChange={e => set("surname", e.target.value)} placeholder="e.g. DELA CRUZ" /></Field>
      <Field label="First Name"><Input value={data.firstName} onChange={e => set("firstName", e.target.value)} placeholder="e.g. JUAN" /></Field>
      <Field label="Middle Name"><Input value={data.middleName} onChange={e => set("middleName", e.target.value)} placeholder="e.g. SANTOS" /></Field>
      <Field label="Name Extension (JR., SR., III)"><Input value={data.nameExtension} onChange={e => set("nameExtension", e.target.value)} placeholder="JR., SR." /></Field>
      <Field label="3. Date of Birth"><Input type="date" value={data.dob} onChange={e => set("dob", e.target.value)} /></Field>
      <Field label="4. Place of Birth"><Input value={data.pob} onChange={e => set("pob", e.target.value)} placeholder="City/Municipality, Province" /></Field>
    </Grid>
    <Grid cols={4} className="mt-5">
      <Field label="5. Sex at Birth">
        <div className="flex gap-4 pt-3">
          {["Male", "Female"].map(s => (
            <label key={s} className="flex items-center gap-2 text-xs font-bold text-gray-600 cursor-pointer">
              <input type="radio" name="sex" className="w-4 h-4 rounded-full border-gray-300 accent-blue-600" checked={data.sex === s} onChange={() => set("sex", s)} /> {s}
            </label>
          ))}
        </div>
      </Field>
      <Field label="6. Civil Status"><Combobox options={(metadata?.pdsCivilStatus || ["Single", "Married", "Widowed", "Separated", "Annulled"]).map((s: string) => ({ value: s, label: s }))} value={data.civilStatus} onChange={v => set("civilStatus", v)} placeholder="Select Civil Status" buttonClassName="rounded-xl bg-gray-50/50 border-gray-200 font-bold text-gray-700 h-11 transition-all hover:bg-white hover:border-gray-400 focus:bg-white focus:ring-4 focus:ring-gray-100/50 focus:border-gray-400" /></Field>
      <Field label="7. Height (m)"><Input type="number" step="0.01" value={data.height} onChange={e => set("height", e.target.value)} placeholder="e.g. 1.65" /></Field>
      <Field label="8. Weight (kg)"><Input type="number" step="0.1" value={data.weight} onChange={e => set("weight", e.target.value)} placeholder="e.g. 60" /></Field>
    </Grid>
    <Grid cols={3} className="mt-5">
      <Field label="9. Blood Type"><Combobox options={(metadata?.pdsBloodTypes || ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]).map((b: string) => ({ value: b, label: b }))} value={data.bloodType} onChange={v => set("bloodType", v)} placeholder="Select Type" buttonClassName="rounded-xl bg-gray-50/50 border-gray-200 font-bold text-gray-700 h-11 transition-all hover:bg-white hover:border-gray-400 focus:bg-white focus:ring-4 focus:ring-gray-100/50 focus:border-gray-400" /></Field>
      <Field label="16. Citizenship"><Combobox options={(metadata?.pdsCitizenship || ["Filipino", "Dual Citizenship"]).map((s: string) => ({ value: s, label: s }))} value={data.citizenship} onChange={v => set("citizenship", v)} placeholder="Select Citizenship" buttonClassName="rounded-xl bg-gray-50/50 border-gray-200 font-bold text-gray-700 h-11 transition-all hover:bg-white hover:border-gray-400 focus:bg-white focus:ring-4 focus:ring-gray-100/50 focus:border-gray-400" /></Field>
      {data.citizenship === "Dual Citizenship" && <Field label="Indicate Country (Dual)"><Input value={data.dualCountry} onChange={e => set("dualCountry", e.target.value)} placeholder="Country" /></Field>}
    </Grid>
    <Divider label="Standard IDs" />
    <Grid cols={3}>
      <Field label="10. UMID NO.">
        <Input 
          value={data.umidId} 
          onChange={e => set("umidId", e.target.value)} 
          isError={!!isIdTakenMap.umidNumber || (!!data.umidId && !ID_REGEX.UMID.test(data.umidId.replace(/\s+/g, '')))} 
          errorMessage={isIdTakenMap.umidNumber || "Invalid UMID format"} 
        />
      </Field>
      <Field label="11. PAG-IBIG NO.">
        <Input 
          value={data.pagibigId} 
          onChange={e => set("pagibigId", e.target.value)} 
          isError={!!isIdTakenMap.pagibigNumber || (!!data.pagibigId && !ID_REGEX.PAGIBIG.test(data.pagibigId.replace(/\s+/g, '')))} 
          errorMessage={isIdTakenMap.pagibigNumber || "Invalid Pag-IBIG format"} 
        />
      </Field>
      <Field label="12. PHILHEALTH NO.">
        <Input 
          value={data.philhealthNo} 
          onChange={e => set("philhealthNo", e.target.value)} 
          isError={!!isIdTakenMap.philhealthNumber || (!!data.philhealthNo && !ID_REGEX.PHILHEALTH.test(data.philhealthNo.replace(/\s+/g, '')))} 
          errorMessage={isIdTakenMap.philhealthNumber || "Invalid PhilHealth format"} 
        />
      </Field>
      <Field label="13. PHILSYS NO.">
        <Input 
          value={data.philsysNo} 
          onChange={e => set("philsysNo", e.target.value)} 
          isError={!!isIdTakenMap.philsysId || (!!data.philsysNo && !ID_REGEX.PHILSYS.test(data.philsysNo.replace(/\s+/g, '')))} 
          errorMessage={isIdTakenMap.philsysId || "Invalid PhilSys ID format"} 
        />
      </Field>
      <Field label="14. TIN NO.">
        <Input 
          value={data.tinNo} 
          onChange={e => set("tinNo", e.target.value)} 
          isError={!!isIdTakenMap.tinNumber || (!!data.tinNo && !ID_REGEX.TIN.test(data.tinNo.replace(/\s+/g, '')))} 
          errorMessage={isIdTakenMap.tinNumber || "Invalid TIN format"} 
        />
      </Field>
      <Field label="10. GSIS ID NO.">
        <Input 
          value={data.gsisId} 
          onChange={e => set("gsisId", e.target.value)} 
          isError={!!isIdTakenMap.gsisNumber || (!!data.gsisId && !ID_REGEX.GSIS.test(data.gsisId.replace(/\s+/g, '')))} 
          errorMessage={isIdTakenMap.gsisNumber || "Invalid GSIS format"} 
        />
      </Field>
      <Field label="15. AGENCY NO.">
        <Input 
          value={data.agencyEmployeeNo} 
          onChange={e => set("agencyEmployeeNo", e.target.value)} 
          isError={!!isIdTakenMap.agencyEmployeeNo} 
          errorMessage={isIdTakenMap.agencyEmployeeNo} 
        />
      </Field>
    </Grid>
    <Divider label="17. Residential Address" /><PDSAddressSelector prefix="res" data={data} set={set} />
    <Divider label="18. Permanent Address" />
    <div className="flex flex-col gap-4">
      <label className="flex items-center gap-2 text-[11px] font-bold text-gray-500 cursor-pointer mb-2 pl-1"><input type="checkbox" className="w-4 h-4 rounded border-gray-300 accent-blue-600" checked={data.sameAddress} onChange={e => set("sameAddress", e.target.checked)} /> Same as residential</label>
      {!data.sameAddress && <PDSAddressSelector prefix="perm" data={data} set={set} />}
    </div>
    <Divider label="Contact Details" />
    <Grid cols={3}>
      <Field label="19. Telephone"><Input type="tel" value={data.telephone} onChange={e => set("telephone", e.target.value)} /></Field>
      <Field label="20. Mobile No."><Input type="tel" value={data.mobile} onChange={e => set("mobile", e.target.value)} /></Field>
      <Field label="21. Email"><Input type="email" value={data.email} onChange={e => set("email", e.target.value)} /></Field>
    </Grid>
    <Divider label="Social Media Profiles" />
    <Grid cols={3}>
      <Field label="Facebook Profile URL"><Input value={data.facebookUrl} onChange={e => set("facebookUrl", e.target.value)} icon={LinkIcon} placeholder="https://facebook.com/..." /></Field>
      <Field label="LinkedIn Profile URL"><Input value={data.linkedinUrl} onChange={e => set("linkedinUrl", e.target.value)} icon={LinkIcon} placeholder="https://linkedin.com/in/..." /></Field>
      <Field label="Twitter / X Handle"><Input value={data.twitterHandle} onChange={e => set("twitterHandle", e.target.value)} icon={LinkIcon} placeholder="@username" /></Field>
    </Grid>
    <Divider label="Emergency Contacts" />
    <Grid cols={2}>
      <Field label="Emergency Contact Person"><Input value={data.emergencyContactPerson} onChange={e => set("emergencyContactPerson", e.target.value)} icon={UserIcon} /></Field>
      <Field label="Emergency Phone Number"><Input type="tel" value={data.emergencyContactPhone} onChange={e => set("emergencyContactPhone", e.target.value)} icon={Phone} /></Field>
    </Grid>
  </SectionCard>
);

const StepFamily = ({ data, set }: { data: PDSFormData; set: PDSSetter }) => (
  <SectionCard title="Family Background" roman="II">
    <Divider label="22. Spouse Information" />
    <Grid cols={3}>
      <Field label="Spouse Surname"><Input value={data.spouseSurname} onChange={e => set("spouseSurname", e.target.value)} placeholder="Surname" /></Field>
      <Field label="Spouse First Name"><Input value={data.spouseFirstName} onChange={e => set("spouseFirstName", e.target.value)} placeholder="First Name" /></Field>
      <Field label="Middle Name"><Input value={data.spouseMiddleName} onChange={e => set("spouseMiddleName", e.target.value)} placeholder="Middle Name" /></Field>
      <Field label="Name Extension"><Input value={data.spouseExtension} onChange={e => set("spouseExtension", e.target.value)} placeholder="JR., SR." /></Field>
      <Field label="Occupation"><Input value={data.spouseOccupation} onChange={e => set("spouseOccupation", e.target.value)} placeholder="Occupation" /></Field>
      <Field label="Employer / Business Name"><Input value={data.spouseEmployer} onChange={e => set("spouseEmployer", e.target.value)} placeholder="Employer or Business" /></Field>
      <Field label="Business Address" span={2}><Input value={data.spouseBusinessAddress} onChange={e => set("spouseBusinessAddress", e.target.value)} placeholder="Business Address" /></Field>
      <Field label="Telephone No."><Input type="tel" value={data.spouseTelephone} onChange={e => set("spouseTelephone", e.target.value)} placeholder="Tel No." /></Field>
    </Grid>
    <Divider label="23. Children" />
    {data.children.map((child, i) => (
      <div key={child.id} className="bg-gray-50/50 border border-gray-100 rounded-xl p-5 mb-4 group relative last:mb-0">
        <Grid cols={2}>
          <Field label="Child's Full Name"><Input value={child.fullName} onChange={e => { const updated = [...data.children]; updated[i] = { ...child, fullName: e.target.value }; set("children", updated); }} placeholder="Full name" /></Field>
          <Field label="Date of Birth"><Input type="date" value={child.dob} onChange={e => { const updated = [...data.children]; updated[i] = { ...child, dob: e.target.value }; set("children", updated); }} /></Field>
        </Grid>
        <button onClick={() => set("children", data.children.filter((_, j) => j !== i))} className="absolute top-4 right-4 text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-100">Remove</button>
      </div>
    ))}
    <AddButton onClick={() => set("children", [...data.children, { id: uid(), fullName: "", dob: "" }])} label="Add Child" />
    <Divider label="24. Father's Name" />
    <Grid cols={4}>
      <Field label="Surname"><Input value={data.fatherSurname} onChange={e => set("fatherSurname", e.target.value)} placeholder="Father's Surname" /></Field>
      <Field label="First Name"><Input value={data.fatherFirstName} onChange={e => set("fatherFirstName", e.target.value)} placeholder="Father's First Name" /></Field>
      <Field label="Middle Name"><Input value={data.fatherMiddleName} onChange={e => set("fatherMiddleName", e.target.value)} placeholder="Father's Middle Name" /></Field>
      <Field label="Name Extension"><Input value={data.fatherExtension} onChange={e => set("fatherExtension", e.target.value)} placeholder="JR., SR." /></Field>
    </Grid>
    <Divider label="25. Mother's Maiden Name" />
    <Grid cols={3}>
      <Field label="Surname"><Input value={data.motherSurname} onChange={e => set("motherSurname", e.target.value)} placeholder="Mother's Surname" /></Field>
      <Field label="First Name"><Input value={data.motherFirstName} onChange={e => set("motherFirstName", e.target.value)} placeholder="Mother's First Name" /></Field>
      <Field label="Middle Name"><Input value={data.motherMiddleName} onChange={e => set("motherMiddleName", e.target.value)} placeholder="Mother's Middle Name" /></Field>
    </Grid>
  </SectionCard>
);

const StepEducation = ({ data, set }: { data: PDSFormData; set: PDSSetter }) => (
  <SectionCard title="Educational Background" roman="III">
    <Divider label="Academic History (Item 26)" />
    {[ { key: "Elementary", label: "Elementary" }, { key: "Secondary", label: "Secondary" }, { key: "Vocational", label: "Vocational/Trade" }, { key: "College", label: "College" }, { key: "Graduate", label: "Graduate Studies" } ].map(level => (
      <div key={level.key} className="mb-4 last:mb-0">
        <div className="text-[10px] font-bold text-gray-400 mb-3 ml-1">{level.label} Level</div>
        <EduRow data={data.education[level.key as keyof PDSFormData["education"]]} onChange={(k, v) => { const updated = { ...data.education }; (updated as any)[level.key][k] = v; set("education", updated); }} />
      </div>
    ))}
  </SectionCard>
);

const StepEligibility = ({ data, set }: { data: PDSFormData; set: PDSSetter }) => (
  <SectionCard title="Civil Service Eligibility" roman="IV">
    {data.eligibilities.map((elig, i) => (
      <div key={elig.id || i} className="bg-gray-50/50 border border-gray-100 rounded-xl p-5 mb-4 group relative last:mb-0">
        <Grid cols={3}>
          <Field label="Eligibility Name" span={2}><Input value={elig.name} onChange={e => { const updated = [...data.eligibilities]; updated[i] = { ...elig, name: e.target.value }; set("eligibilities", updated); }} /></Field>
          <Field label="Rating"><Input value={elig.rating} onChange={e => { const updated = [...data.eligibilities]; updated[i] = { ...elig, rating: e.target.value }; set("eligibilities", updated); }} /></Field>
          <Field label="Date of Exam"><Input type="date" value={elig.examDate} onChange={e => { const updated = [...data.eligibilities]; updated[i] = { ...elig, examDate: e.target.value }; set("eligibilities", updated); }} /></Field>
          <Field label="Place of Exam"><Input value={elig.examPlace} onChange={e => { const updated = [...data.eligibilities]; updated[i] = { ...elig, examPlace: e.target.value }; set("eligibilities", updated); }} /></Field>
          <Field label="License Number"><Input value={elig.licenseNo} onChange={e => { const updated = [...data.eligibilities]; updated[i] = { ...elig, licenseNo: e.target.value }; set("eligibilities", updated); }} /></Field>
          <Field label="Validity Date"><Input type="date" value={elig.licenseValidUntil} onChange={e => { const updated = [...data.eligibilities]; updated[i] = { ...elig, licenseValidUntil: e.target.value }; set("eligibilities", updated); }} /></Field>
        </Grid>
        <button onClick={() => set("eligibilities", data.eligibilities.filter((_, j) => i !== j))} className="absolute top-4 right-4 text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-100">Remove</button>
      </div>
    ))}
    <AddButton onClick={() => set("eligibilities", [...data.eligibilities, emptyEligibility()])} label="Add Eligibility" />
  </SectionCard>
);

const StepWork = ({ data, set, metadata }: { data: PDSFormData; set: PDSSetter; metadata: any }) => (
  <SectionCard title="Work Experience" roman="V">
    {data.workExperiences.map((work, i) => (
      <div key={work.id || i} className="bg-gray-50/50 border border-gray-100 rounded-lg p-5 mb-4 group relative last:mb-0 transition-all hover:bg-white hover:border-gray-200">
        <Grid cols={2}>
          <Field label="Position Title" span={2}><Input value={work.positionTitle} onChange={e => { const updated = [...data.workExperiences]; updated[i] = { ...work, positionTitle: e.target.value }; set("workExperiences", updated); }} /></Field>
          <Field label="Department / Agency / Company" span={2}><Input value={work.department} onChange={e => { const updated = [...data.workExperiences]; updated[i] = { ...work, department: e.target.value }; set("workExperiences", updated); }} /></Field>
          <Field label="From"><Input type="date" value={work.from} onChange={e => { const updated = [...data.workExperiences]; updated[i] = { ...work, from: e.target.value }; set("workExperiences", updated); }} /></Field>
          <Field label="To"><Input type="date" value={work.to} onChange={e => { const updated = [...data.workExperiences]; updated[i] = { ...work, to: e.target.value }; set("workExperiences", updated); }} /></Field>
          <Field label="Monthly Salary"><Input value={work.monthlySalary} onChange={e => { const updated = [...data.workExperiences]; updated[i] = { ...work, monthlySalary: e.target.value }; set("workExperiences", updated); }} /></Field>
          <Field label="Salary Grade"><Input value={work.salaryGrade} onChange={e => { const updated = [...data.workExperiences]; updated[i] = { ...work, salaryGrade: e.target.value }; set("workExperiences", updated); }} /></Field>
          <Field label="Status of Appointment"><Combobox options={(metadata?.pdsAppointmentStatus || ["Permanent", "Temporary", "Coterminous", "Contractual", "Casual"]).map((s: string) => ({ value: s, label: s }))} value={work.appointmentStatus} onChange={v => { const updated = [...data.workExperiences]; updated[i] = { ...work, appointmentStatus: v }; set("workExperiences", updated); }} placeholder="Select Status" buttonClassName="rounded-lg bg-white border-gray-200 font-bold text-gray-700 h-11 transition-all hover:border-gray-400 focus:ring-4 focus:ring-gray-100/50 focus:border-gray-400" /></Field>
          <Field label="Gov't Service"><Combobox options={[{ value: "Y", label: "Yes" }, { value: "N", label: "No" }]} value={work.govtService} onChange={v => { const updated = [...data.workExperiences]; updated[i] = { ...work, govtService: v }; set("workExperiences", updated); }} placeholder="Y/N" buttonClassName="rounded-lg bg-white border-gray-200 font-bold text-gray-700 h-11 transition-all hover:border-gray-400 focus:ring-4 focus:ring-gray-100/50 focus:border-gray-400" /></Field>
        </Grid>
        <button onClick={() => set("workExperiences", data.workExperiences.filter((_, j) => i !== j))} className="absolute top-4 right-4 text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-100">Remove</button>
      </div>
    ))}
    <AddButton onClick={() => set("workExperiences", [...data.workExperiences, emptyWork()])} label="Add Experience" />
  </SectionCard>
);

const StepVoluntary = ({ data, set }: { data: PDSFormData; set: PDSSetter }) => (
  <SectionCard title="Voluntary Work" roman="VI">
    {data.voluntaryWorks.map((work, i) => (
      <div key={work.id || i} className="bg-gray-50/50 border border-gray-100 rounded-lg p-5 mb-4 group relative last:mb-0 transition-all hover:bg-white hover:border-gray-200">
        <Grid cols={2}>
          <Field label="Organization Name" span={2}><Input value={work.organization} onChange={e => { const updated = [...data.voluntaryWorks]; updated[i] = { ...work, organization: e.target.value }; set("voluntaryWorks", updated); }} /></Field>
          <Field label="From"><Input type="date" value={work.from} onChange={e => { const updated = [...data.voluntaryWorks]; updated[i] = { ...work, from: e.target.value }; set("voluntaryWorks", updated); }} /></Field>
          <Field label="To"><Input type="date" value={work.to} onChange={e => { const updated = [...data.voluntaryWorks]; updated[i] = { ...work, to: e.target.value }; set("voluntaryWorks", updated); }} /></Field>
          <Field label="Number of Hours"><Input value={work.hours} onChange={e => { const updated = [...data.voluntaryWorks]; updated[i] = { ...work, hours: e.target.value }; set("voluntaryWorks", updated); }} /></Field>
          <Field label="Position / Nature of Work"><Input value={work.positionNature} onChange={e => { const updated = [...data.voluntaryWorks]; updated[i] = { ...work, positionNature: e.target.value }; set("voluntaryWorks", updated); }} /></Field>
        </Grid>
        <button onClick={() => set("voluntaryWorks", data.voluntaryWorks.filter((_, j) => i !== j))} className="absolute top-4 right-4 text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-100">Remove</button>
      </div>
    ))}
    <AddButton onClick={() => set("voluntaryWorks", [...data.voluntaryWorks, emptyVoluntary()])} label="Add Voluntary Work" />
  </SectionCard>
);

const StepTraining = ({ data, set, metadata }: { data: PDSFormData; set: PDSSetter; metadata: any }) => (
  <SectionCard title="Training Programs" roman="VII">
    {data.trainings.map((train, i) => (
      <div key={train.id || i} className="bg-gray-50/50 border border-gray-100 rounded-lg p-6 mb-8 relative group transition-all hover:bg-white hover:border-gray-200">
        <Grid cols={2}>
          <Field label="Title of Training" span={2}><Input value={train.title} onChange={e => { const updated = [...data.trainings]; updated[i] = { ...train, title: e.target.value }; set("trainings", updated); }} /></Field>
          <Field label="From"><Input type="date" value={train.from} onChange={e => { const updated = [...data.trainings]; updated[i] = { ...train, from: e.target.value }; set("trainings", updated); }} /></Field>
          <Field label="To"><Input type="date" value={train.to} onChange={e => { const updated = [...data.trainings]; updated[i] = { ...train, to: e.target.value }; set("trainings", updated); }} /></Field>
          <Field label="Number of Hours"><Input value={train.hours} onChange={e => { const updated = [...data.trainings]; updated[i] = { ...train, hours: e.target.value }; set("trainings", updated); }} /></Field>
          <Field label="Type of LD"><Combobox options={(metadata?.pdsLdTypes || ["Managerial", "Supervisory", "Technical", "Other"]).map((s: string) => ({ value: s, label: s }))} value={train.ldType} onChange={v => { const updated = [...data.trainings]; updated[i] = { ...train, ldType: v }; set("trainings", updated); }} placeholder="Select Type" buttonClassName="rounded-lg bg-white border-gray-200 font-bold text-gray-700 h-11 transition-all hover:border-gray-400 focus:ring-4 focus:ring-gray-100/50 focus:border-gray-400" /></Field>
          <Field label="Conducted By" span={2}><Input value={train.conductedBy} onChange={e => { const updated = [...data.trainings]; updated[i] = { ...train, conductedBy: e.target.value }; set("trainings", updated); }} /></Field>
        </Grid>
        <button onClick={() => set("trainings", data.trainings.filter((_, j) => i !== j))} className="absolute top-4 right-4 text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-100">Remove</button>
      </div>
    ))}
    <AddButton onClick={() => set("trainings", [...data.trainings, emptyTraining()])} label="Add Training" />
  </SectionCard>
);

const StepOtherInfo = ({ data, set, employeeId }: { data: PDSFormData; set: PDSSetter; employeeId: number }) => {
  const [docs, setDocs] = useState<EmployeeDocument[]>([]);
  const loadDocs = useCallback(async () => {
    const res = await fetchEmployeeDocuments(employeeId);
    if (res.success && res.documents) setDocs(res.documents);
  }, [employeeId]);
  useEffect(() => { loadDocs(); }, [loadDocs]);

  return (
    <SectionCard title="Other Information & Attachments" roman="VIII">
      <Grid cols={1}>
        <Field label="31. Special Skills / Hobbies"><Textarea value={data.specialSkills} onChange={e => set("specialSkills", e.target.value)} placeholder="List special skills or hobbies..." /></Field>
        <Field label="32. Non-Academic Distinctions"><Textarea value={data.nonAcademicDistinctions} onChange={e => set("nonAcademicDistinctions", e.target.value)} placeholder="List non-academic distinctions..." /></Field>
        <Field label="33. Memberships in Organizations"><Textarea value={data.memberships} onChange={e => set("memberships", e.target.value)} placeholder="List association/organization memberships..." /></Field>
      </Grid>
      <Divider label="Supporting Documents" />
      <div className="bg-gray-50/30 rounded-xl p-4 border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <Paperclip size={14} className="text-gray-400" />
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Document Repository</span>
        </div>
        <DocumentGallery employeeId={employeeId} documents={docs} onDocumentChange={loadDocs} />
      </div>
    </SectionCard>
  );
};

const StepDeclarations = ({ data, set, metadata }: { data: PDSFormData; set: PDSSetter; metadata: any }) => (
  <div className="space-y-8">
    <SectionCard title="Declarations" roman="IX">
      <Grid cols={1}>
        <YesNo value={data.relatedThirdDegree} onChange={v => set("relatedThirdDegree", v)} label="34a. Are you related within the third degree to the appointing or recommending authority, etc.?" />
        {data.relatedThirdDegree === "Yes" && <Field label="If YES, give details:"><Input value={data.relatedThirdDetails} onChange={e => set("relatedThirdDetails", e.target.value)} /></Field>}
        <YesNo value={data.relatedFourthDegree} onChange={v => set("relatedFourthDegree", v)} label="34b. Are you related within the fourth degree to the appointing or recommending authority, etc.?" />
        {data.relatedFourthDegree === "Yes" && <Field label="If YES, give details:"><Input value={data.relatedFourthDetails} onChange={e => set("relatedFourthDetails", e.target.value)} /></Field>}
        <YesNo value={data.foundGuiltyAdmin} onChange={v => set("foundGuiltyAdmin", v)} label="35a. Have you ever been found guilty of any administrative offense?" />
        {data.foundGuiltyAdmin === "Yes" && <Field label="If YES, give details:"><Input value={data.foundGuiltyDetails} onChange={e => set("foundGuiltyDetails", e.target.value)} /></Field>}
        <YesNo value={data.criminallyCharged} onChange={v => set("criminallyCharged", v)} label="35b. Have you been criminally charged before any court?" />
        {data.criminallyCharged === "Yes" && <Grid cols={2}><Field label="Date Filed:"><Input type="date" value={data.dateFiled} onChange={e => set("dateFiled", e.target.value)} /></Field><Field label="Status of Case:"><Input value={data.statusOfCase} onChange={e => set("statusOfCase", e.target.value)} /></Field></Grid>}
        <YesNo value={data.convictedCrime} onChange={v => set("convictedCrime", v)} label="36. Have you ever been convicted of any crime or violation of any law, etc.?" />
        {data.convictedCrime === "Yes" && <Field label="If YES, give details:"><Input value={data.convictedDetails} onChange={e => set("convictedDetails", e.target.value)} /></Field>}
        <YesNo value={data.separatedFromService} onChange={v => set("separatedFromService", v)} label="37. Have you ever been separated from the service in any of the following modes, etc.?" />
        {data.separatedFromService === "Yes" && <Field label="If YES, give details:"><Input value={data.separatedDetails} onChange={e => set("separatedDetails", e.target.value)} /></Field>}
        <YesNo value={data.electionCandidate} onChange={v => set("electionCandidate", v)} label="38a. Have you ever been a candidate in a national or local election within the last year?" />
        {data.electionCandidate === "Yes" && <Field label="If YES, give details:"><Input value={data.electionDetails} onChange={e => set("electionDetails", e.target.value)} /></Field>}
        <YesNo value={data.resignedToPromote} onChange={v => set("resignedToPromote", v)} label="38b. Have you resigned from the government service to promote your candidacy, etc.?" />
        {data.resignedToPromote === "Yes" && <Field label="If YES, give details:"><Input value={data.resignedDetails} onChange={e => set("resignedDetails", e.target.value)} /></Field>}
        <YesNo value={data.immigrantStatus} onChange={v => set("immigrantStatus", v)} label="39. Have you acquired the status of an immigrant or permanent resident of another country?" />
        {data.immigrantStatus === "Yes" && <Field label="If YES, give details:"><Input value={data.immigrantDetails} onChange={e => set("immigrantDetails", e.target.value)} /></Field>}
        <YesNo value={data.indigenousMember} onChange={v => set("indigenousMember", v)} label="40a. Are you a member of any indigenous group?" />
        {data.indigenousMember === "Yes" && <Field label="If YES, specify:"><Input value={data.indigenousDetails} onChange={e => set("indigenousDetails", e.target.value)} /></Field>}
        <YesNo value={data.personWithDisability} onChange={v => set("personWithDisability", v)} label="40b. Are you a person with disability?" />
        {data.personWithDisability === "Yes" && <Field label="If YES, specify ID No:"><Input value={data.disabilityIdNo} onChange={e => set("disabilityIdNo", e.target.value)} /></Field>}
        <YesNo value={data.soloParent} onChange={v => set("soloParent", v)} label="40c. Are you a solo parent?" />
        {data.soloParent === "Yes" && <Field label="If YES, specify ID No:"><Input value={data.soloParentIdNo} onChange={e => set("soloParentIdNo", e.target.value)} /></Field>}
      </Grid>
    </SectionCard>
    <SectionCard title="References" roman="41">
      <p className="text-[10px] font-bold text-gray-400 mb-6 ml-1">Persons not related by consanguinity or affinity to applicant</p>
      {data.references.map((ref, i) => (
        <div key={i} className="mb-4 last:mb-0 p-6 border border-gray-100 rounded-lg bg-gray-50/30 ring-1 ring-gray-100 hover:ring-gray-200 transition-all group">
          <Grid cols={1} className="md:grid-cols-3 gap-4">
            <Field label={`Reference ${i + 1} — Name`}><Input value={ref.name} onChange={e => { const u = [...data.references]; u[i] = { ...ref, name: e.target.value }; set("references", u); }} placeholder="Full Name" /></Field>
            <Field label="Office / Residential Address"><Input value={ref.address} onChange={e => { const u = [...data.references]; u[i] = { ...ref, address: e.target.value }; set("references", u); }} placeholder="Complete Address" /></Field>
            <Field label="Contact No. and/or Email"><Input value={ref.contact} onChange={e => { const u = [...data.references]; u[i] = { ...ref, contact: e.target.value }; set("references", u); }} placeholder="Contact Info" /></Field>
          </Grid>
        </div>
      ))}
    </SectionCard>
    <SectionCard title="Government Issued ID & Certification" roman="42">
      <Grid cols={2}>
        <Field label="Government Issued ID (Type)"><Combobox options={(metadata?.pdsGovtIdTypes || ["UMID", "Driver's License", "Passport", "PRC ID", "Postal ID", "Others"]).map((s: string) => ({ value: s, label: s }))} value={data.govtIdType} onChange={v => set("govtIdType", v)} placeholder="Select ID Type" buttonClassName="rounded-xl bg-gray-50/50 border-gray-200 font-bold text-gray-700 h-11 transition-all hover:bg-white hover:border-gray-400 focus:bg-white focus:ring-4 focus:ring-gray-100/50 focus:border-gray-400" /></Field>
        <Field label="ID / License / Passport No."><Input value={data.govtIdNo} onChange={e => set("govtIdNo", e.target.value)} placeholder="Enter ID Number" className="h-11" /></Field>
        <Field label="Date / Place of Issuance"><Input value={data.govtIdIssuance} onChange={e => set("govtIdIssuance", e.target.value)} placeholder="e.g. 01/01/2020, Manila" className="h-11" /></Field>
        <Field label="Date Accomplished"><Input type="date" value={data.dateAccomplished} onChange={e => set("dateAccomplished", e.target.value)} className="h-11" /></Field>
      </Grid>
      <div className="flex flex-col md:flex-row gap-6 mt-10">
        <div className="flex flex-col gap-2 items-center">
          <div className="w-[120px] h-[160px] border border-gray-200 border-dashed rounded-xl flex flex-col items-center justify-center gap-3 cursor-pointer bg-white hover:border-gray-400 transition-all group overflow-hidden"><span className="text-[9px] font-black text-gray-400 text-center leading-relaxed">Attach<br/>2×2 Photo</span></div>
          <span className="text-[9px] font-bold text-gray-400 pl-1 leading-none pt-2">ID Photo</span>
        </div>
        <div className="flex-1 flex flex-col gap-4">
          <div className="h-[160px] border border-gray-200 border-dashed rounded-xl flex items-center justify-center bg-white transition-all relative">
            <span className="text-[9px] font-bold text-gray-300">Digital Signature</span>
          </div>
        </div>
      </div>
      <div className="mt-10 p-8 border border-gray-100 rounded-xl relative overflow-hidden ring-1 ring-gray-100/30 ring-inset">
        <div className="text-[10px] font-black text-gray-400 mb-4 flex items-center gap-2">Oath of Authenticity</div>
        <div className="flex items-start gap-5"><div className="flex-1"><p className="text-[11px] font-bold text-gray-500 leading-relaxed italic">"I declare under oath that I have personally accomplished this Personal Data Sheet which is a true, correct and complete statement pursuant to the provisions of pertinent laws, rules and regulations of the Republic of the Philippines. I authorize the agency to verify/validate the contents stated herein."</p></div></div>
      </div>
    </SectionCard>
  </div>
);

const StepHRDetails = ({ data, set, metadata }: { data: PDSFormData; set: PDSSetter; metadata: any }) => (
  <SectionCard title="Human Resource Internal Details" roman="HR">
    <Grid cols={2}>
      <Field label="Department"><Input value={data.department} readOnly className="bg-gray-50 cursor-not-allowed" /></Field>
      <Field label="Position Title"><Input value={data.jobTitle} onChange={e => set("jobTitle", e.target.value)} /></Field>
      <Field label="Item Number"><Input value={data.itemNumber} onChange={e => set("itemNumber", e.target.value)} /></Field>
      <Field label="Salary Grade">
        <Combobox
          options={Array.from({ length: 33 }, (_, i) => ({ value: (i + 1).toString(), label: (i + 1).toString() }))}
          value={data.salaryGrade}
          onChange={v => set("salaryGrade", v)}
          placeholder="Select SG"
          buttonClassName="rounded-xl bg-gray-50/50 border-gray-200 font-bold text-gray-700 h-11 transition-all hover:bg-white hover:border-gray-400 focus:bg-white focus:ring-4 focus:ring-gray-100/50 focus:border-gray-400"
        />
      </Field>
      <Field label="Step Increment">
        <Combobox
          options={Array.from({ length: 8 }, (_, i) => ({ value: (i + 1).toString(), label: (i + 1).toString() }))}
          value={data.stepIncrement}
          onChange={v => set("stepIncrement", v)}
          placeholder="Select Step"
          buttonClassName="rounded-xl bg-gray-50/50 border-gray-200 font-bold text-gray-700 h-11 transition-all hover:bg-white hover:border-gray-400 focus:bg-white focus:ring-4 focus:ring-gray-100/50 focus:border-gray-400"
        />
      </Field>
      
      <Field label="Appointment Type / Schedule">
        <Combobox 
          options={(metadata?.appointmentTypes || ['Permanent','Contractual','Casual','Job Order','Coterminous','Temporary']).map((v: string) => ({value:v, label:v}))} 
          value={data.appointmentType} 
          onChange={v => set("appointmentType", v)} 
          placeholder="Select Type" 
          buttonClassName="rounded-xl bg-gray-50/50 border-gray-200 font-bold text-gray-700 h-11 transition-all hover:bg-white hover:border-gray-400 focus:bg-white focus:ring-4 focus:ring-gray-100/50 focus:border-gray-400" 
        />
      </Field>

      <Field label="Employment Status"><Combobox options={(metadata?.employmentStatus || ['Active','Probationary','Terminated','Resigned','On Leave','Suspended','Verbal Warning','Written Warning','Show Cause']).map((v: string) => ({value:v, label:v}))} value={data.employmentStatus} onChange={v => set("employmentStatus", v)} placeholder="Select Status" buttonClassName="rounded-xl bg-gray-50/50 border-gray-200 font-bold text-gray-700 h-11 transition-all hover:bg-white hover:border-gray-400 focus:bg-white focus:ring-4 focus:ring-gray-100/50 focus:border-gray-400" /></Field>
      <Field label="Station"><Input value={data.station} onChange={e => set("station", e.target.value)} /></Field>
      
      <Field label="Type of Duties">
        <Combobox 
          options={(metadata?.dutyTypes || ['Standard', 'Irregular']).map((v: string) => ({ value: v, label: v }))} 
          value={data.dutyType} 
          onChange={v => set("dutyType", v)} 
          placeholder="Standard / Irregular" 
          buttonClassName="rounded-xl bg-gray-50/50 border-gray-200 font-bold text-gray-700 h-11 transition-all hover:bg-white hover:border-gray-400 focus:bg-white focus:ring-4 focus:ring-gray-100/50 focus:border-gray-400" 
        />
      </Field>

      <Field label="Meycauayan Resident?"><Combobox options={[{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }]} value={data.isMeycauayan} onChange={v => set("isMeycauayan", v)} placeholder="Yes / No" buttonClassName="rounded-xl bg-gray-50/50 border-gray-200 font-bold text-gray-700 h-11 transition-all hover:bg-white hover:border-gray-400 focus:bg-white focus:ring-4 focus:ring-gray-100/50 focus:border-gray-400" /></Field>
      <Field label="Office Address" span={2}><Textarea value={data.officeAddress} onChange={e => set("officeAddress", e.target.value)} /></Field>
      <Field label="Date Hired"><Input type="date" value={data.dateHired} onChange={e => set("dateHired", e.target.value)} /></Field>
      <Field label="First Day of Service"><Input type="date" value={data.firstDayOfService} readOnly className="bg-gray-50 cursor-not-allowed" /></Field>
      <Divider label="Promotion Tracking" />
      <Field label="Next Step Increment"><Input value={data.nextStepDate} readOnly className="bg-gray-50 cursor-not-allowed font-black text-amber-600" /></Field>
      <Field label="Accumulated LWOP Days"><Input value={data.totalLwopDays} readOnly className="bg-gray-50 cursor-not-allowed" /></Field>
    </Grid>
  </SectionCard>
);

// ─── Main Component ───────────────────────────────────────────────────────────

interface PDSFormWizardProps {
  employeeId: number;
}

const PDSFormWizard: React.FC<PDSFormWizardProps> = ({ employeeId }) => {
  const [data, setData] = useState<PDSFormData>(initialData);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Debounced ID numbers for real-time validation
  const debouncedUmid = useDebounce(data.umidId, 500);
  const debouncedTin = useDebounce(data.tinNo, 500);
  const debouncedPhilhealth = useDebounce(data.philhealthNo, 500);
  const debouncedPagibig = useDebounce(data.pagibigId, 500);
  const debouncedGsis = useDebounce(data.gsisId, 500);
  const debouncedAgencyNo = useDebounce(data.agencyEmployeeNo, 500);

  // Consolidated Uniqueness query
  const { data: idConflicts } = useGovtIdUniquenessQuery({
    umidNumber: debouncedUmid,
    tinNumber: debouncedTin,
    philhealthNumber: debouncedPhilhealth,
    pagibigNumber: debouncedPagibig,
    gsisNumber: debouncedGsis,
    agencyEmployeeNo: debouncedAgencyNo
  }, (
    (debouncedUmid?.length || 0) > 2 ||
    (debouncedTin?.length || 0) > 2 ||
    (debouncedPhilhealth?.length || 0) > 2 ||
    (debouncedPagibig?.length || 0) > 2 ||
    (debouncedGsis?.length || 0) > 2 ||
    (debouncedAgencyNo?.length || 0) > 2
  ) && !isSubmitting);

  const isIdTakenMap: Record<string, string> = idConflicts?.conflicts || {};
  const isAnyIdTaken = Object.keys(isIdTakenMap).length > 0;
  const [activeSection, setActiveSection] = useState(0);
  const showToast = useToastStore((state) => state.showToast);
  const { data: metadata } = useEmploymentMetadataQuery();

  const STEPS = [
    { id: 0, label: "Personal Information", roman: "I" },
    { id: 1, label: "Family Background", roman: "II" },
    { id: 2, label: "Educational Background", roman: "III" },
    { id: 3, label: "Civil Service Eligibility", roman: "IV" },
    { id: 4, label: "Work Experience", roman: "V" },
    { id: 5, label: "Voluntary Work", roman: "VI" },
    { id: 6, label: "Learning & Development", roman: "VII" },
    { id: 7, label: "Other Info & Docs", roman: "VIII" },
    { id: 8, label: "Legal Declarations", roman: "IX" },
    { id: 9, label: "Human Resource Internal Details", roman: "HR" },
  ];

  const handleSave = async () => {
    // Check if any ID is taken before saving
    if (isAnyIdTaken) {
      showToast("Cannot save: One or more ID numbers are already in use", "error");
      return;
    }
    
    setIsSubmitting(true);
    try {
      // 1. Update Core Employee Data
      await employeeApi.updateEmployee(employeeId, {
        lastName: data.surname, firstName: data.firstName, middleName: data.middleName, suffix: data.nameExtension,
        birthDate: data.dob, placeOfBirth: data.pob, gender: data.sex as any, civilStatus: data.civilStatus as any,
        heightM: data.height ? Number(data.height) : undefined, weightKg: data.weight ? Number(data.weight) : undefined, bloodType: data.bloodType, citizenship: data.citizenship,
        umidNumber: data.umidId, pagibigNumber: data.pagibigId, philhealthNumber: data.philhealthNo, philsysId: data.philsysNo, tinNumber: data.tinNo, gsisNumber: data.gsisId, agencyEmployeeNo: data.agencyEmployeeNo,
        telephoneNo: data.telephone, mobileNo: data.mobile, email: data.email,
        resRegion: data.resRegion, resProvince: data.resProvince, resCity: data.resCityMunicipality, resBarangay: data.resBarangay, resZip: data.resZip, resHouseBlockLot: data.resHouseBlockLot, resStreet: data.resStreet, resSubdivision: data.resSubdivision,
        permRegion: data.permRegion, permProvince: data.permProvince, permCity: data.permCityMunicipality, permBarangay: data.permBarangay, permZip: data.permZip, permHouseBlockLot: data.permHouseBlockLot, permStreet: data.permStreet, permSubdivision: data.permSubdivision,
        jobTitle: data.jobTitle, itemNumber: data.itemNumber, salaryGrade: data.salaryGrade ? Number(data.salaryGrade) : undefined, stepIncrement: data.stepIncrement ? Number(data.stepIncrement) : undefined, appointmentType: data.appointmentType as any, employmentStatus: data.employmentStatus as any, station: data.station, officeAddress: data.officeAddress, dateHired: data.dateHired,
        dutyType: data.dutyType as any, isMeycauayan: data.isMeycauayan === 'true', firstDayOfService: data.firstDayOfService,
        facebookUrl: data.facebookUrl, linkedinUrl: data.linkedinUrl, twitterHandle: data.twitterHandle,
        emergencyContact: data.emergencyContactPerson, emergencyContactNumber: data.emergencyContactPhone,
        govtIdType: data.govtIdType, govtIdNo: data.govtIdNo, govtIdIssuance: data.govtIdIssuance, dateAccomplished: data.dateAccomplished,
        relatedThirdDegree: data.relatedThirdDegree, relatedThirdDetails: data.relatedThirdDetails,
        relatedFourthDegree: data.relatedFourthDegree, relatedFourthDetails: data.relatedFourthDetails,
        foundGuiltyAdmin: data.foundGuiltyAdmin, foundGuiltyDetails: data.foundGuiltyDetails,
        criminallyCharged: data.criminallyCharged, dateFiled: data.dateFiled, statusOfCase: data.statusOfCase,
        convictedCrime: data.convictedCrime, convictedDetails: data.convictedDetails,
        separatedFromService: data.separatedFromService, separatedDetails: data.separatedDetails,
        electionCandidate: data.electionCandidate, electionDetails: data.electionDetails,
        resignedToPromote: data.resignedToPromote, resignedDetails: data.resignedDetails,
        immigrantStatus: data.immigrantStatus, immigrantDetails: data.immigrantDetails,
        indigenousMember: data.indigenousMember, indigenousDetails: data.indigenousDetails,
        personWithDisability: data.personWithDisability, disabilityIdNo: data.disabilityIdNo,
        soloParent: data.soloParent, soloParentIdNo: data.soloParentIdNo,
        dualCountry: data.dualCountry
      });

      // 2. Update PDS Sections (Bulk replace)
      await Promise.all([
        employeeApi.updatePdsSection(employeeId, 'family', [
          ...data.children.map(c => ({ firstName: c.fullName.split(' ')[0], lastName: c.fullName.split(' ').slice(1).join(' '), dateOfBirth: c.dob, relationType: 'Child' })),
          { firstName: data.spouseFirstName, lastName: data.spouseSurname, middleName: data.spouseMiddleName, nameExtension: data.spouseExtension, occupation: data.spouseOccupation, employer: data.spouseEmployer, businessAddress: data.spouseBusinessAddress, telephoneNo: data.spouseTelephone, relationType: 'Spouse' },
          { firstName: data.fatherFirstName, lastName: data.fatherSurname, middleName: data.fatherMiddleName, nameExtension: data.fatherExtension, relationType: 'Father' },
          { firstName: data.motherFirstName, lastName: data.motherSurname, middleName: data.motherMiddleName, relationType: 'Mother' }
        ].filter(f => f.firstName || f.lastName)),
        employeeApi.updatePdsSection(employeeId, 'education', Object.entries(data.education).map(([level, edu]) => ({ level, institution: edu.school, degree: edu.course, startDate: edu.from, endDate: edu.to, unitsEarned: edu.units, yearGraduated: edu.yearGrad, honors: edu.honors })).filter(e => e.institution)),
        employeeApi.updatePdsSection(employeeId, 'eligibility', data.eligibilities.filter(e => e.name).map(e => ({ eligibilityType: e.name, rating: e.rating, examDate: e.examDate, examPlace: e.examPlace, eligibilityNumber: e.licenseNo }))),
        employeeApi.updatePdsSection(employeeId, 'work_experience', data.workExperiences.filter(w => w.positionTitle).map(w => ({ positionTitle: w.positionTitle, companyName: w.department, dateFrom: w.from, dateTo: w.to, monthlySalary: w.monthlySalary, salaryGrade: w.salaryGrade, appointmentStatus: w.appointmentStatus, isGovernment: w.govtService === 'Y' }))),
        employeeApi.updatePdsSection(employeeId, 'voluntary_work', data.voluntaryWorks.filter(v => v.organization).map(v => ({ organizationName: v.organization, dateFrom: v.from, dateTo: v.to, hoursNumber: Number(v.hours) || 0, position: v.positionNature }))),
        employeeApi.updatePdsSection(employeeId, 'learning_development', data.trainings.filter(t => t.title).map(t => ({ title: t.title, dateFrom: t.from, dateTo: t.to, hoursNumber: Number(t.hours) || 0, typeOfLd: t.ldType, conductedBy: t.conductedBy }))),
        employeeApi.updatePdsSection(employeeId, 'references', data.references.filter(r => r.name).map(r => ({ name: r.name, address: r.address, telNo: r.contact }))),
        employeeApi.updatePdsSection(employeeId, 'other_info', [
          ...data.specialSkills.split(',').map(s => ({ type: 'Skill', description: s.trim() })),
          ...data.nonAcademicDistinctions.split(',').map(s => ({ type: 'Recognition', description: s.trim() })),
          ...data.memberships.split(',').map(s => ({ type: 'Membership', description: s.trim() }))
        ].filter(o => o.description))
      ]);

      showToast("Employee Record Synchronized Successfully", "success");
    } catch (err) {
      showToast("Synchronization Failed", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (data.sameAddress) {
      setData(prev => ({ ...prev, permHouseStreet: prev.resHouseStreet, permSubdivision: prev.resSubdivision, permBarangay: prev.resBarangay, permCityMunicipality: prev.resCityMunicipality, permProvince: prev.resProvince, permZip: prev.resZip, permRegion: prev.resRegion, permHouseBlockLot: prev.resHouseBlockLot, permStreet: prev.resStreet }));
    }
  }, [data.sameAddress, data.resHouseStreet, data.resSubdivision, data.resBarangay, data.resCityMunicipality, data.resProvince, data.resZip, data.resRegion, data.resHouseBlockLot, data.resStreet]);

  useEffect(() => {
    const formatted = formatAddr(data.resRegion, data.resProvince, data.resCityMunicipality, data.resBarangay, data.resHouseBlockLot, data.resSubdivision, data.resStreet);
    if (formatted && formatted !== data.resHouseStreet) setData(prev => ({ ...prev, resHouseStreet: formatted }));
  }, [data.resRegion, data.resProvince, data.resCityMunicipality, data.resBarangay, data.resHouseBlockLot, data.resSubdivision, data.resStreet]);

  useEffect(() => {
    if (data.sameAddress) return;
    const formatted = formatAddr(data.permRegion, data.permProvince, data.permCityMunicipality, data.permBarangay, data.permHouseBlockLot, data.permSubdivision, data.permStreet);
    if (formatted && formatted !== data.permHouseStreet) setData(prev => ({ ...prev, permHouseStreet: formatted }));
  }, [data.sameAddress, data.permRegion, data.permProvince, data.permCityMunicipality, data.permBarangay, data.permHouseBlockLot, data.permSubdivision, data.permStreet]);

  useEffect(() => {
    if (!employeeId) return;
    const loadData = async () => {
      setIsSubmitting(true);
      try {
        const [profileRes, stepRes] = await Promise.all([fetchEmployeeProfile(employeeId), getNextStepIncrement(employeeId)]);
        if (profileRes.success && profileRes.profile) {
          const p = profileRes.profile;
          setData((prev: PDSFormData) => ({
            ...prev,
            surname: p.lastName || "", firstName: p.firstName || "", middleName: p.middleName || "", nameExtension: p.suffix || "",
            dob: p.birthDate ? new Date(p.birthDate).toISOString().split('T')[0] : "", pob: p.placeOfBirth || "",
            sex: p.gender || "", civilStatus: p.civilStatus || "", height: p.heightM?.toString() || "", weight: p.weightKg?.toString() || "", bloodType: p.bloodType || "", citizenship: p.citizenship || "", dualCountry: p.dualCountry || "",
            umidId: p.umidNumber || "", pagibigId: p.pagibigNumber || "", philhealthNo: p.philhealthNumber || "", philsysId: p.philsysId || "", tinNo: p.tinNumber || "", gsisId: p.gsisNumber || "", agencyEmployeeNo: p.agencyEmployeeNo || "",
            resHouseStreet: p.resHouseBlockLot || "", resSubdivision: p.resSubdivision || "", resBarangay: p.resBarangay || "", resCityMunicipality: p.resCity || "", resProvince: p.resProvince || "", resZip: p.residentialZipCode || "", resRegion: p.resRegion || "", resHouseBlockLot: p.resHouseBlockLot || "", resStreet: p.resStreet || "",
            permHouseStreet: p.permHouseBlockLot || "", permSubdivision: p.permSubdivision || "", permBarangay: p.permBarangay || "", permCityMunicipality: p.permCity || "", permProvince: p.permProvince || "", permZip: p.permanentZipCode || "", permRegion: p.permRegion || "", permHouseBlockLot: p.permHouseBlockLot || "", permStreet: p.permStreet || "",
            telephone: p.telephoneNo || "", mobile: p.mobileNo || "", email: p.email || "",
            spouseSurname: p.familyBackground?.find(f => f.relationType === 'Spouse')?.lastName || "", spouseFirstName: p.familyBackground?.find(f => f.relationType === 'Spouse')?.firstName || "", spouseMiddleName: p.familyBackground?.find(f => f.relationType === 'Spouse')?.middleName || "", spouseExtension: p.familyBackground?.find(f => f.relationType === 'Spouse')?.nameExtension || "", spouseOccupation: p.familyBackground?.find(f => f.relationType === 'Spouse')?.occupation || "", spouseEmployer: p.familyBackground?.find(f => f.relationType === 'Spouse')?.employer || "", spouseBusinessAddress: p.familyBackground?.find(f => f.relationType === 'Spouse')?.businessAddress || "", spouseTelephone: p.familyBackground?.find(f => f.relationType === 'Spouse')?.telephoneNo || "",
            children: p.familyBackground?.filter(f => f.relationType === 'Child').map(c => ({ id: c.id?.toString() || uid(), fullName: `${c.firstName} ${c.lastName}`, dob: c.dateOfBirth || "" })) || [],
            fatherSurname: p.familyBackground?.find(f => f.relationType === 'Father')?.lastName || "", fatherFirstName: p.familyBackground?.find(f => f.relationType === 'Father')?.firstName || "", fatherMiddleName: p.familyBackground?.find(f => f.relationType === 'Father')?.middleName || "", fatherExtension: p.familyBackground?.find(f => f.relationType === 'Father')?.nameExtension || "",
            motherSurname: p.familyBackground?.find(f => f.relationType === 'Mother')?.lastName || "", motherFirstName: p.familyBackground?.find(f => f.relationType === 'Mother')?.firstName || "", motherMiddleName: p.familyBackground?.find(f => f.relationType === 'Mother')?.middleName || "",
            education: {
              Elementary: { school: p.education?.find(e => e.level === 'Elementary')?.institution || "", course: p.education?.find(e => e.level === 'Elementary')?.degree || "", from: p.education?.find(e => e.level === 'Elementary')?.startDate?.toString() || "", to: p.education?.find(e => e.level === 'Elementary')?.endDate?.toString() || "", units: p.education?.find(e => e.level === 'Elementary')?.unitsEarned || "", yearGrad: p.education?.find(e => e.level === 'Elementary')?.yearGraduated?.toString() || "", honors: p.education?.find(e => e.level === 'Elementary')?.honors || "" },
              Secondary: { school: p.education?.find(e => e.level === 'Secondary')?.institution || "", course: p.education?.find(e => e.level === 'Secondary')?.degree || "", from: p.education?.find(e => e.level === 'Secondary')?.startDate?.toString() || "", to: p.education?.find(e => e.level === 'Secondary')?.endDate?.toString() || "", units: p.education?.find(e => e.level === 'Secondary')?.unitsEarned || "", yearGrad: p.education?.find(e => e.level === 'Secondary')?.yearGraduated?.toString() || "", honors: p.education?.find(e => e.level === 'Secondary')?.honors || "" },
              Vocational: { school: p.education?.find(e => e.level === 'Vocational' || e.level === 'Vocational/Trade')?.institution || "", course: p.education?.find(e => e.level === 'Vocational' || e.level === 'Vocational/Trade')?.degree || "", from: p.education?.find(e => e.level === 'Vocational' || e.level === 'Vocational/Trade')?.startDate?.toString() || "", to: p.education?.find(e => e.level === 'Vocational' || e.level === 'Vocational/Trade')?.endDate?.toString() || "", units: p.education?.find(e => e.level === 'Vocational' || e.level === 'Vocational/Trade')?.unitsEarned || "", yearGrad: p.education?.find(e => e.level === 'Vocational' || e.level === 'Vocational/Trade')?.yearGraduated?.toString() || "", honors: p.education?.find(e => e.level === 'Vocational' || e.level === 'Vocational/Trade')?.honors || "" },
              College: { school: p.education?.find(e => e.level === 'College')?.institution || "", course: p.education?.find(e => e.level === 'College')?.degree || "", from: p.education?.find(e => e.level === 'College')?.startDate?.toString() || "", to: p.education?.find(e => e.level === 'College')?.endDate?.toString() || "", units: p.education?.find(e => e.level === 'College')?.unitsEarned || "", yearGrad: p.education?.find(e => e.level === 'College')?.yearGraduated?.toString() || "", honors: p.education?.find(e => e.level === 'College')?.honors || "" },
              Graduate: { school: p.education?.find(e => e.level === 'Graduate Studies')?.institution || "", course: p.education?.find(e => e.level === 'Graduate Studies')?.degree || "", from: p.education?.find(e => e.level === 'Graduate Studies')?.startDate?.toString() || "", to: p.education?.find(e => e.level === 'Graduate Studies')?.endDate?.toString() || "", units: p.education?.find(e => e.level === 'Graduate Studies')?.unitsEarned || "", yearGrad: p.education?.find(e => e.level === 'Graduate Studies')?.yearGraduated?.toString() || "", honors: p.education?.find(e => e.level === 'Graduate Studies')?.honors || "" }
            },
            eligibilities: p.eligibilityNumber ? [{ id: uid(), name: p.eligibilityType || "", rating: "", examDate: p.eligibilityDate || "", examPlace: "", licenseNo: p.eligibilityNumber || "", licenseValidUntil: "" }] : [emptyEligibility()],
            workExperiences: (p.workExperience && p.workExperience.length > 0) ? p.workExperience.map(w => ({ id: w.id?.toString() || uid(), positionTitle: w.positionTitle, department: w.companyName, from: w.dateFrom, to: w.dateTo || "", monthlySalary: w.monthlySalary || "", salaryGrade: w.salaryGrade || "", appointmentStatus: w.appointmentStatus || "", govtService: w.isGovernment ? "Y" : "N" })) : [emptyWork()],
            voluntaryWorks: (p.voluntaryWork && p.voluntaryWork.length > 0) ? p.voluntaryWork.map(v => ({ id: v.id?.toString() || uid(), organization: v.organizationName, from: v.dateFrom || "", to: v.dateTo || "", hours: v.hoursNumber?.toString() || "", positionNature: v.position || "" })) : [emptyVoluntary()],
            trainings: (p.learningDevelopment && p.learningDevelopment.length > 0) ? p.learningDevelopment.map(t => ({ id: t.id?.toString() || uid(), title: t.title, from: t.dateFrom || "", to: t.dateTo || "", hours: t.hoursNumber?.toString() || "", ldType: t.typeOfLd || "", conductedBy: t.conductedBy || "" })) : [emptyTraining()],
            specialSkills: p.otherInfo?.filter(o => o.type === 'Skill').map(o => o.description).join(", ") || "", nonAcademicDistinctions: p.otherInfo?.filter(o => o.type === 'Recognition').map(o => o.description).join(", ") || "", memberships: p.otherInfo?.filter(o => o.type === 'Membership').map(o => o.description).join(", ") || "",
            relatedThirdDegree: p.relatedThirdDegree || "No", relatedThirdDetails: p.relatedThirdDetails || "", relatedFourthDegree: p.relatedFourthDegree || "No", relatedFourthDetails: p.relatedFourthDetails || "", foundGuiltyAdmin: p.foundGuiltyAdmin || "No", foundGuiltyDetails: p.foundGuiltyDetails || "", criminallyCharged: p.criminallyCharged || "No", dateFiled: p.dateFiled || "", statusOfCase: p.statusOfCase || "", convictedCrime: p.convictedCrime || "No", convictedDetails: p.convictedDetails || "", separatedFromService: p.separatedFromService || "No", separatedDetails: p.separatedDetails || "", electionCandidate: p.electionCandidate || "No", electionDetails: p.electionDetails || "", resignedToPromote: p.resignedToPromote || "No", resignedDetails: p.resignedDetails || "", immigrantStatus: p.immigrantStatus || "No", immigrantDetails: p.immigrantDetails || "", indigenousMember: p.indigenousMember || "No", indigenousDetails: p.indigenousDetails || "", personWithDisability: p.personWithDisability || "No", disabilityIdNo: p.disabilityIdNo || "", soloParent: p.soloParent || "No", soloParentIdNo: p.soloParentIdNo || "",
            references: (p.references && p.references.length > 0) ? p.references.map(r => ({ name: r.name, address: r.address || "", contact: r.telNo || "" })) : [{ name: "", address: "", contact: "" }, { name: "", address: "", contact: "" }, { name: "", address: "", contact: "" }],
            govtIdType: p.govtIdType || "", govtIdNo: p.govtIdNo || "", govtIdIssuance: p.govtIdIssuance || "",
            department: p.department || "", jobTitle: p.positionTitle || p.jobTitle || "", itemNumber: p.itemNumber || "", salaryGrade: p.salaryGrade || "", stepIncrement: p.stepIncrement?.toString() || "", appointmentType: p.appointmentType || "", employmentStatus: p.employmentStatus || "", station: p.station || "", officeAddress: p.officeAddress || "", dateHired: p.dateHired ? new Date(p.dateHired).toISOString().split('T')[0] : "", firstDayOfService: p.firstDayOfService ? new Date(p.firstDayOfService).toISOString().split('T')[0] : "",
            dutyType: p.dutyType || "Standard", isMeycauayan: String(p.isMeycauayan || "false"),
            facebookUrl: p.facebookUrl || "", linkedinUrl: p.linkedinUrl || "", twitterHandle: p.twitterHandle || "",
            emergencyContactPerson: p.emergencyContact || "", emergencyContactPhone: p.emergencyContactNumber || "",
            nextStepDate: stepRes.nextStepDate ? new Date(stepRes.nextStepDate).toLocaleDateString() : "N/A", totalLwopDays: stepRes.totalLwopDays || 0,
          }));
        }
      } catch (err) { console.error("Failed to load employee PDS:", err); } finally { setIsSubmitting(false); }
    };
    loadData();
  }, [employeeId]);

  const set = useCallback(<K extends keyof PDSFormData>(key: K, value: PDSFormData[K]) => { setData((prev: PDSFormData) => ({ ...prev, [key]: value })); }, []);

  if (isSubmitting) return <div className="w-full min-h-[400px] flex flex-col items-center justify-center gap-4 bg-white rounded-3xl border border-gray-100 shadow-sm"><div className="w-12 h-12 border-4 border-gray-100 border-t-gray-900 rounded-full animate-spin" /><p className="text-xs font-bold text-gray-400">Loading PDS Data...</p></div>;

  return (
    <div className="w-full bg-gray-50 min-h-screen font-sans p-6 pb-24">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex items-center justify-between mb-8 px-2">
          <div><h1 className="text-xl font-black text-gray-800 tracking-tight">Personal Data Sheet</h1><p className="text-[10px] text-gray-400 font-bold mt-1">CS Form 212 (Revised 2025)</p></div>
          <div className="flex items-center gap-3">
            <button onClick={handleSave} disabled={isSubmitting} className="px-6 py-2.5 bg-gray-900 text-white rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-black transition-all disabled:opacity-50">
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} {isSubmitting ? "Synchronizing..." : "Save Changes"}
            </button>
          </div>
        </div>
        <div className="sticky top-6 z-10 mb-8"><div className="bg-white border border-gray-200 rounded-xl p-2 shadow-sm flex gap-1.5 overflow-x-auto no-scrollbar scroll-smooth">
          {STEPS.map((s) => (
            <button key={s.id} onClick={() => setActiveSection(s.id)} className={`flex flex-col items-center justify-center flex-1 min-w-[100px] lg:min-w-[120px] px-4 py-3 rounded-lg transition-all duration-200 shrink-0 ${activeSection === s.id ? "bg-gray-900 text-white shadow-lg shadow-gray-900/10 active:scale-95" : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"}`}><span className="text-[9px] font-black opacity-50 mb-1">{s.roman}</span><span className="text-[10px] font-bold whitespace-nowrap leading-none">{s.label}</span></button>
          ))}
        </div></div>
        <div className="w-full"><div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {activeSection === 0 && <StepPersonal data={data} set={set} metadata={metadata} isIdTakenMap={isIdTakenMap} />}
          {activeSection === 1 && <StepFamily data={data} set={set} />}
          {activeSection === 2 && <StepEducation data={data} set={set} />}
          {activeSection === 3 && <StepEligibility data={data} set={set} />}
          {activeSection === 4 && <StepWork data={data} set={set} metadata={metadata} />}
          {activeSection === 5 && <StepVoluntary data={data} set={set} />}
          {activeSection === 6 && <StepTraining data={data} set={set} metadata={metadata} />}
          {activeSection === 7 && <StepOtherInfo data={data} set={set} employeeId={employeeId} />}
          {activeSection === 8 && <StepDeclarations data={data} set={set} metadata={metadata} />}
          {activeSection === 9 && <StepHRDetails data={data} set={set} metadata={metadata} />}
        </div></div>
      </div>
    </div>
  );
};
export default PDSFormWizard;
