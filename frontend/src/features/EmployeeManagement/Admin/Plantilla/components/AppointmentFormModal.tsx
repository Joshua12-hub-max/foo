
import React, { memo, useRef, useState, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import { X, Printer } from 'lucide-react';
import { Position } from '@/api/plantillaApi';

interface AppointmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  position: Position | null;
}

const AppointmentFormModal: React.FC<AppointmentFormModalProps> = memo(({ isOpen, onClose, position }) => {
  const componentRef = useRef<HTMLDivElement>(null);

  // Manual Input State
  const [formData, setFormData] = useState({
    agencyName: 'Local Government Unit of Ligao',
    appointeeName: '',
    positionTitle: '',
    salaryGrade: '',
    status: 'Permanent',
    department: '',
    compensationRate: '',
    natureOfAppointment: 'Original',
    viceName: '',
    vacatedReason: 'Separation', 
    plantillaItemNo: '',
    pageNo: '',
    signatoryName: 'HON. PATRICIA GONZALEZ-ALSUA',
    signatoryTitle: 'City Mayor',
    hrmoName: '',
    chairpersonName: '',
    publishedFrom: '',
    publishedTo: '',
    publishedAt: '',
    deliberationDate: '',
    appointmentDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  });

  // Pre-fill data when position changes
  useEffect(() => {
    if (isOpen && position) {
        const salaryStr = position.monthly_salary 
            ? parseFloat(position.monthly_salary.toString()).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : '';
        
        const sgStr = position.salary_grade.toString().startsWith('SG') 
            ? position.salary_grade.toString()
            : `SG ${position.salary_grade.toString()}`;

        setFormData(prev => ({
            ...prev,
            appointeeName: position.incumbent_name || '',
            positionTitle: position.position_title || '',
            salaryGrade: sgStr,
            department: position.department || '',
            compensationRate: salaryStr,
            plantillaItemNo: position.item_number || '',
        }));
    }
  }, [isOpen, position]);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Appointment_${formData.appointeeName || 'Form'}`,
  });

  if (!isOpen || !position) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 print:p-0 print:bg-white print:block print:inset-auto print:static">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col print:shadow-none print:max-w-none print:max-h-none print:h-auto print:w-full">
        {/* Header - No Print */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50 print:hidden rounded-t-xl">
            <div>
                <h2 className="text-xl font-bold text-gray-800">
                    CS Form No. 33-A (Revised 2018)
                </h2>
                <p className="text-sm text-gray-500">You can edit the text directly on the form below before printing.</p>
            </div>
            <div className="flex gap-2">
                <button 
                    onClick={handlePrint}
                    className="px-5 py-2 bg-white text-gray-700 text-sm font-semibold rounded-lg border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all"
                >
                    Print
                </button>
                <button
                    onClick={() => {
                        import('./print/form33_pdf_generator').then(({ generateForm33PDF }) => {
                            generateForm33PDF(formData);
                        });
                    }}
                    className="px-5 py-2 bg-white text-gray-700 text-sm font-semibold rounded-lg border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all"
                >
                    PDF
                </button>
                <button
                    onClick={() => {
                        import('./print/appointment_excel_generator').then(({ generateAppointmentExcel }) => {
                            generateAppointmentExcel(formData);
                        });
                    }}
                    className="px-5 py-2 bg-white text-gray-700 text-sm font-semibold rounded-lg border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all"
                >
                    Excel
                </button>
                <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-all">
                    <X size={22} />
                </button>
            </div>
        </div>

        {/* Scrollable Preview Area */}
        <div className="overflow-y-auto p-8 bg-gray-100 flex-1 print:p-0 print:bg-white print:overflow-visible flex justify-center">
            {/* LEGAL SIZE CANVAS: 8.5in x 13in */}
            <div 
                ref={componentRef}
                className="bg-white shadow-xl print:shadow-none text-black leading-tight print:w-full"
                style={{ width: '8.5in', minHeight: '13in', fontFamily: '"Times New Roman", Times, serif' }}
            >
                {/* PAGE 1: APPOINTMENT */}
                <div className="p-[0.5in] relative h-[13in] flex flex-col" style={{ pageBreakAfter: 'always' }}>
                    
                    {/* TOP HEADER */}
                    <div className="flex justify-between items-start mb-4 text-[10px] italic font-bold">
                        <div>
                            <p>CS Form No. 33-A</p>
                            <p>Revised 2018</p>
                        </div>
                        <div className="border border-black px-2 py-1">
                            <p>For Regulated Agencies</p>
                        </div>
                    </div>

                    <div className="text-right text-[10px] italic mb-6">
                        <p>(Stamp of Date of Receipt)</p>
                    </div>

                    <div className="text-center mb-8">
                        <h1 className="font-bold text-[14pt] uppercase">Republic of the Philippines</h1>
                        <input 
                            value={formData.agencyName}
                            onChange={(e) => setFormData({...formData, agencyName: e.target.value})}
                            className="w-full text-center font-bold text-[12pt] border-b border-black outline-none bg-transparent uppercase mt-1 print:border-none" 
                        />
                        <p className="text-[10pt]">(Name of Agency)</p>
                    </div>

                    {/* BODY */}
                    <div className="space-y-6 text-[11pt]">
                        {/* Name */}
                        <div>
                            <div className="flex items-end">
                                <span className="font-bold whitespace-nowrap mr-2">Mr./Mrs./Ms.:</span>
                                <div className="flex-1 border-b border-black">
                                    <input 
                                        value={formData.appointeeName}
                                        onChange={(e) => setFormData({...formData, appointeeName: e.target.value})}
                                        className="w-full text-center font-bold uppercase text-[12pt] outline-none bg-transparent print:border-none"
                                        placeholder="Firstname MI. Lastname"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Appointed As */}
                        <div>
                            <div className="flex items-end">
                                <span className="indent-8 mr-2">You are hereby appointed as</span>
                                <div className="flex-1 border-b border-black">
                                    <input 
                                        value={formData.positionTitle}
                                        onChange={(e) => setFormData({...formData, positionTitle: e.target.value})}
                                        className="w-full text-center font-bold uppercase outline-none bg-transparent print:border-none"
                                    />
                                </div>
                                <span className="ml-2 whitespace-nowrap">
                                    (<input 
                                        value={formData.salaryGrade}
                                        onChange={(e) => setFormData({...formData, salaryGrade: e.target.value})}
                                        className="w-24 text-center font-bold border-b border-black outline-none bg-transparent print:border-none"
                                    />)
                                </span>
                            </div>
                            <div className="text-center text-[9px] italic">(Position Title)</div>
                        </div>

                        {/* Status */}
                        <div>
                            <div className="flex items-end">
                                <span className="mr-2">under</span>
                                <div className="flex-1 border-b border-black">
                                    <input 
                                        value={formData.status}
                                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                                        className="w-full text-center font-bold uppercase outline-none bg-transparent print:border-none"
                                    />
                                </div>
                                <span className="mx-2">status at the</span>
                                <div className="flex-1 border-b border-black">
                                     <input 
                                        value={formData.department}
                                        onChange={(e) => setFormData({...formData, department: e.target.value})}
                                        className="w-full text-center font-bold uppercase outline-none bg-transparent print:border-none"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-around text-[9px] italic">
                                <span>(Permanent, Temporary, etc.)</span>
                                <span>(Office/Department/Unit)</span>
                            </div>
                        </div>

                        {/* Compensation */}
                        <div>
                            <div className="flex items-end">
                                <span className="mr-2">with a compensation rate of</span>
                                <div className="flex-1 border-b border-black">
                                    <input 
                                        value={formData.compensationRate}
                                        onChange={(e) => setFormData({...formData, compensationRate: e.target.value})}
                                        className="w-full text-center font-bold outline-none bg-transparent print:border-none"
                                    />
                                </div>
                                <span className="ml-2">pesos per month.</span>
                            </div>
                        </div>

                        {/* Nature of Appointment */}
                        <div className="mt-6">
                            <div className="flex items-end">
                                <span className="indent-8 mr-2">The nature of this appointment is</span>
                                <div className="flex-1 border-b border-black">
                                    <input 
                                        value={formData.natureOfAppointment}
                                        onChange={(e) => setFormData({...formData, natureOfAppointment: e.target.value})}
                                        className="w-full text-center font-bold uppercase outline-none bg-transparent print:border-none"
                                    />
                                </div>
                                <span className="mx-2">vice</span>
                                <div className="flex-1 border-b border-black">
                                    <input 
                                        value={formData.viceName}
                                        onChange={(e) => setFormData({...formData, viceName: e.target.value})}
                                        className="w-full text-center bg-transparent outline-none uppercase print:border-none"
                                        placeholder="(Name of Predecessor)"
                                    />
                                </div>
                            </div>
                            <div className="flex">
                                <div className="w-1/2 text-center text-[9px] italic">(Original, Promotion, etc.)</div>
                                <div className="w-1/2"></div>
                            </div>
                        </div>

                        {/* Reason / Item No */}
                        <div>
                            <div className="flex items-end">
                                <span className="mr-2">, who</span>
                                <div className="flex-1 border-b border-black">
                                    <input 
                                        value={formData.vacatedReason}
                                        onChange={(e) => setFormData({...formData, vacatedReason: e.target.value})}
                                        className="w-full text-center bg-transparent outline-none uppercase print:border-none"
                                        placeholder="(Transferred, Retired, etc.)"
                                    />
                                </div>
                                <span className="mx-2 whitespace-nowrap">with Plantilla Item No.</span>
                                <div className="w-32 border-b border-black">
                                    <input 
                                        value={formData.plantillaItemNo}
                                        onChange={(e) => setFormData({...formData, plantillaItemNo: e.target.value})}
                                        className="w-full text-center font-bold outline-none bg-transparent print:border-none"
                                    />
                                </div>
                            </div>
                            <div className="text-left ml-8 text-[9px] italic">(Transferred, Retired, etc.)</div>
                        </div>

                        {/* Page */}
                        <div className="flex items-end mt-4">
                            <span className="mr-2">Page</span>
                            <div className="w-16 border-b border-black">
                                <input 
                                    value={formData.pageNo}
                                    onChange={(e) => setFormData({...formData, pageNo: e.target.value})}
                                    className="w-full text-center bg-transparent outline-none print:border-none"
                                />
                            </div>
                            <span>.</span>
                        </div>

                        {/* Effectivity */}
                        <p className="indent-8 text-justify mt-4">
                            This appointment shall take effect on the date of signing by the appointing officer/authority.
                        </p>

                        {/* Signatory */}
                        <div className="pt-12 flex flex-col items-end">
                             <div className="mb-8 mr-12 text-[11pt]">Very truly yours,</div>
                             <div className="text-center w-72">
                                <input 
                                    value={formData.signatoryName}
                                    onChange={(e) => setFormData({...formData, signatoryName: e.target.value})}
                                    className="w-full text-center font-bold uppercase border-none bg-transparent outline-none" 
                                />
                                <div className="border-t border-black mt-1"></div>
                                <input 
                                    value={formData.signatoryTitle}
                                    onChange={(e) => setFormData({...formData, signatoryTitle: e.target.value})}
                                    className="w-full text-center text-[10pt] font-bold border-none bg-transparent outline-none" 
                                />
                                <p className="text-[9px]">Appointing Officer/Authority</p>
                             </div>
                             
                             <div className="mt-8 mr-16 text-center">
                                <div className="border-b border-black w-32 mb-1 text-center font-bold">
                                     <input 
                                        value={formData.appointmentDate}
                                        onChange={(e) => setFormData({...formData, appointmentDate: e.target.value})}
                                        className="w-full text-center bg-transparent outline-none print:border-none"
                                    />
                                </div>
                                <p className="text-[9px] font-bold">Date of Signing</p>
                             </div>
                        </div>
                    </div>

                    {/* CSC ACTION BOX */}
                    <div className="mt-auto border-2 border-black p-4 bg-gray-50/50 print:bg-transparent">
                        <p className="font-bold text-[10pt] mb-8">CSC ACTION:</p>
                        
                        <div className="flex justify-center mb-8 relative">
                             {/* DRY SEAL PLACEHOLDER */}
                             <div className="w-24 h-24 border border-dashed border-gray-300 rounded-full flex items-center justify-center text-gray-400 text-[8px] print:hidden">
                                DRY SEAL
                             </div>
                        </div>

                        <div className="flex justify-between items-end px-8">
                             <div className="text-center w-48">
                                <div className="border-b border-black h-8"></div>
                                <p className="font-bold text-[10pt] mt-1">Authorized Official</p>
                             </div>
                             <div className="text-center w-32">
                                <div className="border-b border-black h-8"></div>
                                <p className="font-bold text-[9px] mt-1">Date</p>
                             </div>
                        </div>
                    </div>
                </div>

                {/* PAGE 2: CERTIFICATIONS (The Back Page) */}
                <div className="p-[0.5in] h-[13in] flex flex-col space-y-4" style={{ pageBreakBefore: 'always' }}>
                    
                    {/* CERTIFICATION 1 */}
                    <div className="border-2 border-black p-4">
                        <h3 className="text-center font-bold text-[11pt] mb-4">Certification</h3>
                        <p className="text-justify indent-8 leading-relaxed text-[10pt]">
                            This is to certify that all requirements and supporting papers pursuant to the 2017 Omnibus Rules on Appointments and Other Human Resource Actions, have been complied with, reviewed, and found to be in order.
                        </p>
                        <p className="text-justify indent-8 leading-relaxed text-[10pt] mt-4">
                            The position was published at <input className="border-b border-black w-32 outline-none text-center bg-transparent print:border-none" value={formData.publishedAt} onChange={e=>setFormData({...formData, publishedAt: e.target.value})} /> from <input className="border-b border-black w-24 outline-none text-center bg-transparent print:border-none" value={formData.publishedFrom} onChange={e=>setFormData({...formData, publishedFrom: e.target.value})}/> to <input className="border-b border-black w-24 outline-none text-center bg-transparent print:border-none" value={formData.publishedTo} onChange={e=>setFormData({...formData, publishedTo: e.target.value})}/> in consonance with Republic Act No. 7041. The assessment by the Human Resource Merit Promotion and Selection Board (HRMPSB) started on <input className="border-b border-black w-32 outline-none text-center bg-transparent print:border-none" value={formData.deliberationDate} onChange={e=>setFormData({...formData, deliberationDate: e.target.value})}/>.
                        </p>
                        <div className="mt-8 flex justify-end">
                            <div className="text-center w-64">
                                <input 
                                    className="w-full text-center font-bold uppercase border-b border-black outline-none bg-transparent print:border-none" 
                                    value={formData.hrmoName}
                                    placeholder="(HRMO Name)"
                                    onChange={(e) => setFormData({...formData, hrmoName: e.target.value})}
                                />
                                <p className="font-bold text-[10pt]">HRMO</p>
                            </div>
                        </div>
                    </div>

                    {/* CERTIFICATION 2 */}
                    <div className="border-2 border-black p-4">
                        <h3 className="text-center font-bold text-[11pt] mb-4">Certification</h3>
                        <p className="text-justify indent-8 leading-relaxed text-[10pt]">
                            This is to certify that the appointee has been screened and found qualified by at least the majority of the HRMPSB/Placement Committee during the deliberation held on <input className="border-b border-black w-32 outline-none text-center bg-transparent print:border-none" />.
                        </p>
                        <div className="mt-8 flex justify-end">
                            <div className="text-center w-80">
                                <input 
                                    className="w-full text-center font-bold uppercase border-b border-black outline-none bg-transparent print:border-none" 
                                    value={formData.chairpersonName}
                                    placeholder="(Chairperson Name)"
                                    onChange={(e) => setFormData({...formData, chairpersonName: e.target.value})}
                                />
                                <p className="font-bold text-[9pt]">Chairperson, HRMPSB/Placement Committee</p>
                            </div>
                        </div>
                    </div>

                    {/* CSC NOTATION */}
                    <div className="border-2 border-black bg-gray-200 print:bg-gray-300 p-1 flex-1 flex flex-col">
                         <div className="bg-white border border-black flex-1 p-4 flex flex-col">
                            <h3 className="text-center font-bold text-[11pt] bg-gray-300 border border-black p-1 mb-4">CSC Notation</h3>
                            <div className="space-y-6 flex-1">
                                <div className="border-b border-black h-8"></div>
                                <div className="border-b border-black h-8"></div>
                                <div className="border-b border-black h-8"></div>
                                <div className="border-b border-black h-8"></div>
                                <div className="border-b border-black h-8"></div>
                            </div>
                            <div className="mt-4 border border-black p-2 text-center text-[9px] font-bold">
                                ANY ERASURE OR ALTERATION ON THE CSC ACTION SHALL NULLIFY OR INVALIDATE THIS APPOINTMENT EXCEPT IF THE ALTERATION WAS AUTHORIZED BY THE COMMISSION.
                            </div>
                         </div>
                    </div>

                    {/* ACKNOWLEDGEMENT */}
                    <div className="border-2 border-black p-2 mt-auto">
                        <div className="flex border-b border-black pb-2 mb-2">
                             <div className="w-1/2 text-[8px] space-y-1 pl-2">
                                <p>Original Copy - for the Agency</p>
                                <p>Certified True Copy - for the Civil Service Commission</p>
                                <p>Certified True Copy - for the Appointee</p>
                             </div>
                             <div className="w-1/2 text-center">
                                <p className="font-bold text-[9pt]">Acknowledgement</p>
                                <p className="text-[9px] mt-4 text-left pl-4">Received original/photocopy of appointment on _____________________</p>
                                <div className="mt-4 border-b border-black w-3/4 mx-auto"></div>
                                <p className="text-[9px]">Appointee</p>
                             </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
      </div>
    </div>
  );
});

AppointmentFormModal.displayName = 'AppointmentFormModal';

export default AppointmentFormModal;
