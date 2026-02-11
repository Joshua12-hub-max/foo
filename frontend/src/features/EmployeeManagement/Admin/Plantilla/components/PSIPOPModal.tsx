import React, { memo, useRef, useState, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import { X, Printer } from 'lucide-react';
import { Position } from '@/api/plantillaApi';
import { generatePSIPOPPDF, type PSIPOPConfig } from './print/psipop_pdf_generator';
import { generatePSIPOPExcel } from './print/psipop_excel_generator';
import toast from 'react-hot-toast';

interface PSIPOPModalProps {
  isOpen: boolean;
  onClose: () => void;
  positions: Position[];
}

const PSIPOPModal: React.FC<PSIPOPModalProps> = memo(({ isOpen, onClose, positions }) => {
  const componentRef = useRef<HTMLDivElement>(null);
  
  // Configuration State
  const [config, setConfig] = useState<PSIPOPConfig>({
    departmentGocc: 'LGU - Local Government Unit',
    bureauAgency: 'City Government of Meycauayan',
    fiscalYear: new Date().getFullYear().toString(),
    preparedBy: '',
    preparedByTitle: 'Human Resource Management Officer',
    approvedBy: '',
    approvedByTitle: 'City Mayor'
  });

  // Handle Print (Browser)
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `PSI-POP_${config.fiscalYear}`,
  });

  // Handle PDF Export
  const handlePDFExport = () => {
    try {
        generatePSIPOPPDF(positions, config);
        toast.success("PSI-POP PDF generated");
    } catch (e) {
        console.error(e);
        toast.error("Failed to generate PDF");
    }
  };

  // Handle Excel Export
  const handleExcelExport = async () => {
    try {
        await generatePSIPOPExcel(positions, config);
        toast.success("PSI-POP Excel generated");
    } catch (e) {
        console.error(e);
        toast.error("Failed to generate Excel");
    }
  };

  // Helper: Format Date
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('en-US');
    } catch {
      return dateStr;
    }
  };

  // Helper: Parse Name
  const parseName = (name?: string) => {
    if (!name) return { last: '', first: '', middle: '' };
    const parts = name.split(',').map(s => s.trim());
    let last = parts[0] || '';
    let rest = parts[1] ? parts[1].split(' ') : [];
    let first = rest[0] || '';
    let middle = rest.slice(1).join(' ');
    return { last, first, middle };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 print:p-0 print:bg-white print:block print:inset-auto print:static">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[95vh] flex flex-col print:shadow-none print:max-w-none print:max-h-none print:h-auto print:w-full">
        {/* Header - No Print */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50 print:hidden rounded-t-xl">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              PSI-POP (Plantilla of Personnel)
            </h2>
            <p className="text-sm text-gray-500">CSC Form No. 1 (Revised 2018) - Official Format</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handlePrint}
              className="px-5 py-2 bg-white text-gray-700 text-sm font-semibold rounded-lg border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all"
            >
              Print
            </button>
            <button 
              onClick={handlePDFExport}
              className="px-5 py-2 bg-white text-gray-700 text-sm font-semibold rounded-lg border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all"
            >
              PDF
            </button>
            <button 
              onClick={handleExcelExport}
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
          {/* LEGAL SIZE LANDSCAPE CANVAS: 14in x 8.5in */}
          <div 
            ref={componentRef}
            className="bg-white shadow-xl print:shadow-none text-black leading-tight print:w-full flex flex-col justify-between subpixel-antialiased"
            style={{ width: '14in', minHeight: '8.5in', fontFamily: '"Times New Roman", Times, serif', padding: '0.1in' }}
          >
            <div>
                {/* TOP LEFT LABEL */}
                <div className="text-[9px] italic mb-4">
                  <p>CSC Form No. 1</p>
                  <p>(Revised 2018)</p>
                </div>

                {/* HEADER */}
                <div className="text-center mb-6 text-black">
                  <p className="text-[11pt]">Republic of the Philippines</p>
                  <p className="text-[11pt]">Civil Service Commission</p>
                  <h1 className="text-[16pt] font-bold mt-2">Plantilla of Personnel</h1>
                  <div className="text-[11pt] mt-1 flex justify-center items-center gap-1">
                    <span>for the Fiscal Year</span>
                    <input 
                      value={config.fiscalYear}
                      onChange={(e) => setConfig({...config, fiscalYear: e.target.value})}
                      className="font-bold border-b border-black outline-none text-center w-20 bg-transparent print:border-none"
                    />
                  </div>
                </div>

                {/* AGENCY INFO */}
                <div className="flex border border-black mb-4 text-[10pt] print:text-[9pt]">
                  <div className="w-1/2 border-right border-black p-2 flex items-center">
                    <span className="font-bold mr-2">(1) Department/GOCC:</span>
                    <input 
                      value={config.departmentGocc}
                      onChange={(e) => setConfig({...config, departmentGocc: e.target.value})}
                      className="flex-1 border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none bg-transparent print:border-none uppercase font-bold"
                    />
                  </div>
                  <div className="w-1/2 p-2 flex items-center border-l border-black">
                    <span className="font-bold mr-2">(2) Bureau/Agency/Subsidiary:</span>
                    <input 
                      value={config.bureauAgency}
                      onChange={(e) => setConfig({...config, bureauAgency: e.target.value})}
                      className="flex-1 border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none bg-transparent print:border-none uppercase font-bold"
                    />
                  </div>
                </div>

                {/* MAIN TABLE */}
                <table className="w-full border-collapse border border-black text-[10pt] print:text-[8pt] mb-8 table-fixed">
                  <colgroup>
                    <col style={{ width: '5%' }} />  {/* Item No */}
                    <col style={{ width: '17%' }} /> {/* Position Title (+2%) */}
                    <col style={{ width: '3%' }} />  {/* SG */}
                    <col style={{ width: '7%' }} />  {/* Auth Salary */}
                    <col style={{ width: '7%' }} />  {/* Actual Salary */}
                    <col style={{ width: '2.5%' }} /> {/* Step (-0.5%) */}
                    <col style={{ width: '3%' }} />  {/* Code */}
                    <col style={{ width: '2.5%' }} /> {/* Type */}
                    <col style={{ width: '3%' }} />  {/* Level */}
                    <col style={{ width: '10%' }} /> {/* Last Name (+1%) */}
                    <col style={{ width: '10%' }} /> {/* First Name (+1%) */}
                    <col style={{ width: '9%' }} />  {/* Mid Name (+1%) */}
                    <col style={{ width: '6%' }} />  {/* DOB (-1%) */}
                    <col style={{ width: '6%' }} />  {/* Original (-1%) */}
                    <col style={{ width: '6%' }} />  {/* Promotion (-1%) */}
                    <col style={{ width: '3%' }} />  {/* Status (-1%) */}
                  </colgroup>
                  <thead>
                    <tr className="bg-gray-100 print:bg-transparent text-center font-bold">
                      <th rowSpan={2} className="border border-black p-0.5 align-middle">ITEM<br/>No.</th>
                      <th rowSpan={2} className="border border-black p-0.5 align-middle">Position Title</th>
                      <th rowSpan={2} className="border border-black p-0.5 align-middle">SG</th>
                      <th colSpan={2} className="border border-black p-0.5 align-middle">Annual Salary</th>
                      <th rowSpan={2} className="border border-black p-0.5 align-middle leading-tight">S<br/>T<br/>E<br/>P</th>
                      <th colSpan={3} className="border border-black p-0.5 align-middle">Area</th>
                      <th colSpan={3} className="border border-black p-0.5 align-middle">Name of Incumbents</th>
                      <th rowSpan={2} className="border border-black p-0.5 align-middle leading-tight">Date of Birth<br/><span className="text-[7pt] font-normal print:text-[6pt]">(mm/dd/yyyy)</span></th>
                      <th rowSpan={2} className="border border-black p-0.5 align-middle leading-tight">Date of<br/>Original<br/>Appointment<br/><span className="text-[7pt] font-normal print:text-[6pt]">(mm/dd/yyyy)</span></th>
                      <th rowSpan={2} className="border border-black p-0.5 align-middle leading-tight">Date of<br/>Last<br/>Promotion<br/><span className="text-[7pt] font-normal print:text-[6pt]">(mm/dd/yyyy)</span></th>
                      <th rowSpan={2} className="border border-black p-0.5 align-middle leading-tight">S<br/>T<br/>A<br/>T<br/>U<br/>S</th>
                    </tr>
                    <tr className="bg-gray-100 print:bg-transparent text-center font-bold">
                      <th className="border border-black p-0.5">Authorized</th>
                      <th className="border border-black p-0.5">Actual</th>
                      <th className="border border-black p-0.5 text-[8pt] print:text-[6pt]">Code</th>
                      <th className="border border-black p-0.5 text-[8pt] print:text-[6pt]">Type</th>
                      <th className="border border-black p-0.5 text-[8pt] print:text-[6pt]">Level</th>
                      <th className="border border-black p-0.5">Last Name</th>
                      <th className="border border-black p-0.5">First Name</th>
                      <th className="border border-black p-0.5">Middle Name</th>
                    </tr>
                    {/* Column Numbers */}
                    <tr className="text-center text-[8pt] print:text-[7pt]">
                      {Array.from({ length: 16 }).map((_, i) => (
                        <th key={i} className="border border-black p-0.5">({i + 3})</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {positions.map((pos, idx) => {
                       const { last, first, middle } = parseName(pos.incumbent_name);
                       const annualSalary = pos.monthly_salary ? Number(pos.monthly_salary) * 12 : 0;
                       const annualSalaryStr = annualSalary.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                       const actualSalaryStr = pos.is_vacant ? '-' : annualSalaryStr;
                       
                       let status = 'P';
                       if (pos.is_vacant) status = 'V';
                       else if (pos.status && pos.status !== 'Active') status = pos.status.substring(0, 2).toUpperCase();
    
                       return (
                         <tr key={idx} className={pos.is_vacant ? 'bg-yellow-50 print:bg-transparent' : ''}>
                           <td className="border border-black p-1 text-center font-bold text-black">{pos.item_number}</td>
                           <td className="border border-black p-1 leading-tight text-black">{pos.position_title}</td>
                           <td className="border border-black p-1 text-center text-black">{pos.salary_grade}</td>
                           <td className="border border-black p-1 text-right text-black">{annualSalaryStr}</td>
                           <td className="border border-black p-1 text-right text-black">{actualSalaryStr}</td>
                           <td className="border border-black p-1 text-center text-black">{pos.step_increment || 1}</td>
                           <td className="border border-black p-1 text-center text-black">{pos.area_code}</td>
                           <td className="border border-black p-1 text-center text-black">{pos.area_type}</td>
                           <td className="border border-black p-1 text-center text-black">{pos.area_level}</td>
                           <td className="border border-black p-1 truncate text-black font-semibold">{last}</td>
                           <td className="border border-black p-1 truncate text-black font-semibold">{first}</td>
                           <td className="border border-black p-1 truncate text-black font-semibold">{middle}</td>
                           <td className="border border-black p-1 text-center text-[8.5pt] print:text-[7.5pt] text-black">{formatDate(pos.birth_date)}</td>
                           <td className="border border-black p-1 text-center text-[8.5pt] print:text-[7.5pt] text-black">{formatDate(pos.original_appointment_date)}</td>
                           <td className="border border-black p-1 text-center text-[8.5pt] print:text-[7.5pt] text-black">{formatDate(pos.last_promotion_date)}</td>
                           <td className="border border-black p-1 text-center font-bold text-black">{status}</td>
                         </tr>
                       );
                    })}
                {/* Filler Rows to maintain table height */}
                {Array.from({ length: Math.max(0, 30 - positions.length) }).map((_, i) => (
                  <tr key={`filler-${i}`}>
                    <td className="border border-black p-1">&nbsp;</td>
                    <td className="border border-black p-1">&nbsp;</td>
                    <td className="border border-black p-1">&nbsp;</td>
                    <td className="border border-black p-1">&nbsp;</td>
                    <td className="border border-black p-1">&nbsp;</td>
                    <td className="border border-black p-1">&nbsp;</td>
                    <td className="border border-black p-1">&nbsp;</td>
                    <td className="border border-black p-1">&nbsp;</td>
                    <td className="border border-black p-1">&nbsp;</td>
                    <td className="border border-black p-1">&nbsp;</td>
                    <td className="border border-black p-1">&nbsp;</td>
                    <td className="border border-black p-1">&nbsp;</td>
                    <td className="border border-black p-1">&nbsp;</td>
                    <td className="border border-black p-1">&nbsp;</td>
                    <td className="border border-black p-1">&nbsp;</td>
                    <td className="border border-black p-1">&nbsp;</td>
                  </tr>
                ))}
                    {positions.length === 0 && (
                      <tr>
                        <td colSpan={16} className="border border-black p-4 text-center italic text-gray-500">
                          No positions found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
            </div>

            {/* FOOTER */}
            <div className="mt-8 text-[9pt] break-inside-avoid mt-auto">
              <p className="font-bold mb-4">(19) Total Number of Position Items: {positions.length}</p>
              
              <p className="text-justify mb-8 leading-tight">
                I certify to the correctness of the entries and that above Position Items are duly approved and authorized by the agency and in compliance to existing rules and regulations. I further certify that employees whose names appear above are the incumbents of the position.
              </p>

              <div className="flex justify-between items-end mt-12 px-0">
                {/* PREPARED BY */}
                <div className="text-center w-[30%]">
                    <p className="text-left mb-4 text-[8pt]">Prepared by:</p>
                    <input 
                      value={config.preparedBy}
                      onChange={(e) => setConfig({...config, preparedBy: e.target.value})}
                      className="w-full text-center font-bold border-b border-black outline-none bg-transparent print:border-none uppercase"
                      placeholder="Full Name"
                    />
                    <input 
                      value={config.preparedByTitle}
                      onChange={(e) => setConfig({...config, preparedByTitle: e.target.value})}
                      className="w-full text-center text-[8pt] border-none outline-none bg-transparent mt-1"
                    />
                    <div className="mt-4 border-t border-black w-32 mx-auto"></div>
                    <p className="text-[8pt]">Date</p>
                </div>

                {/* APPROVED BY */}
                <div className="text-center w-[30%]">
                    <p className="text-left mb-4 font-bold text-[8pt]">APPROVED BY:</p>
                    <input 
                      value={config.approvedBy}
                      onChange={(e) => setConfig({...config, approvedBy: e.target.value})}
                      className="w-full text-center font-bold border-b border-black outline-none bg-transparent print:border-none uppercase"
                      placeholder="Full Name"
                    />
                    <input 
                      value={config.approvedByTitle}
                      onChange={(e) => setConfig({...config, approvedByTitle: e.target.value})}
                      className="w-full text-center text-[8pt] border-none outline-none bg-transparent mt-1"
                    />
                     <div className="mt-4 border-t border-black w-32 mx-auto"></div>
                    <p className="text-[8pt]">Date</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

PSIPOPModal.displayName = 'PSIPOPModal';

export default PSIPOPModal;
