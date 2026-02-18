import React, { memo, useRef, useEffect } from 'react';
import { X, Printer } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { Form9Data, Form9VacantPosition } from '@/schemas/compliance';
import { useForm9 } from '../hooks/useForm9';

const Form9Modal: React.FC = memo(() => {
  const componentRef = useRef<HTMLDivElement>(null);
  
  // Use the React Query + Zustand hook
  const {
    isOpen,
    header,
    positions,
    setHeader,
    updatePosition,
    isLoading,
    closeForm9Modal
  } = useForm9();

  // React Hook Form for controlled inputs (no validation needed, Zustand is source of truth)
  const { control, setValue } = useForm<Form9Data>({
    defaultValues: {
      header: header,
      positions: positions
    }
  });

  // Sync Zustand store with React Hook Form
  useEffect(() => {
    if (positions.length > 0) {
      setValue('positions', positions as Form9Data['positions']);
    }
  }, [positions, setValue]);

  useEffect(() => {
    setValue('header', header as Form9Data['header']);
  }, [header, setValue]);



  // Handle header input changes (sync to store)
  const handleHeaderChange = (field: keyof typeof header, value: string) => {
    setHeader({ [field]: value });
  };

  // Handle position input changes (sync to store)
  const handlePositionChange = (index: number, field: keyof Form9VacantPosition, value: string | number) => {
    updatePosition(index, { [field]: value });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 print:p-0 print:bg-white print:block print:inset-auto print:static">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[95vh] flex flex-col print:shadow-none print:max-w-none print:max-h-none print:h-auto print:w-full">
        {/* Header - No Print */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50 print:hidden rounded-t-xl">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Printer className="text-blue-600" size={24} />
              CS Form No. 9 (Revised 2025)
            </h2>
            <p className="text-sm text-gray-500">Request for Publication of Vacant Positions - Auto-populated from system</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => {
                import('./print/form9_excel_generator').then(({ generateForm9Excel }) => {
                   const formData: Form9Data = {
                      header: {
                        agencyName: control._formValues.header.agencyName,
                        signatoryName: control._formValues.header.signatoryName,
                        signatoryTitle: control._formValues.header.signatoryTitle,
                        date: control._formValues.header.date,
                        deadlineDate: control._formValues.header.deadlineDate,
                        officeAddress: control._formValues.header.officeAddress,
                        contactInfo: control._formValues.header.contactInfo,
                      },
                      positions: control._formValues.positions
                   };
                   generateForm9Excel(formData);
                });
              }}
              className="px-6 py-2.5 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 flex items-center gap-2 shadow-sm transition-all"
            >
              <Printer size={18} />
              Excel
            </button>
            <button onClick={closeForm9Modal} className="p-2.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-all">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Scrollable Preview Area */}
        <div className="overflow-y-auto p-8 bg-gray-100 flex-1 print:p-0 print:bg-white print:overflow-visible flex justify-center">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading vacant positions...</span>
            </div>
          ) : (
            /* LEGAL SIZE CANVAS */
            <div 
              ref={componentRef}
              className="bg-white shadow-xl print:shadow-none text-black leading-tight print:w-full"
              style={{ width: '11in', minHeight: '8.5in', fontFamily: 'Arial, sans-serif', fontSize: '9pt' }}
            >
              <div className="p-[0.3in]">
                {/* TOP HEADER */}
                <div className="flex justify-between items-start mb-2">
                  <div className="text-[8pt] italic">
                    <p className="font-bold">CS Form No. 9</p>
                    <p>Revised 2025</p>
                  </div>
                  <div className="border border-black px-2 py-1 text-[7pt] italic text-right">
                    <p>Electronic copy to be submitted to the</p>
                    <p>CSC FO must be in MS Excel format</p>
                  </div>
                </div>

                {/* CENTER HEADER */}
                <div className="text-center mb-2">
                  <p className="text-[9pt]">Republic of the Philippines</p>
                  <p className="font-bold text-[12pt]">
                    <Controller
                      name="header.agencyName"
                      control={control}
                      render={({ field }) => (
                        <input 
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            handleHeaderChange('agencyName', e.target.value);
                          }}
                          className="text-center font-bold bg-transparent outline-none border-b border-transparent hover:border-gray-300 focus:border-blue-500 print:border-none w-full"
                        />
                      )}
                    />
                  </p>
                  <p className="font-bold text-[10pt]">Request for Publication of Vacant Positions</p>
                </div>

                {/* TO CSC TEXT */}
                <p className="text-[9pt] mb-2">To: CIVIL SERVICE COMMISSION (CSC)</p>
                
                <p className="text-[8pt] mb-2 text-justify">
                  We hereby request the publication in the CSC Job Portal of the following vacant positions, which are authorized to be filled at the {header.agencyName}:
                </p>

                {/* SIGNATORY HEADER - Right Aligned */}
                <div className="text-right mb-2">
                  <p className="font-bold text-[9pt]">
                    <Controller
                      name="header.signatoryName"
                      control={control}
                      render={({ field }) => (
                        <input 
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            handleHeaderChange('signatoryName', e.target.value);
                          }}
                          className="text-right font-bold bg-transparent outline-none border-b border-transparent hover:border-gray-300 focus:border-blue-500 print:border-none"
                          style={{ width: '280px' }}
                        />
                      )}
                    />
                  </p>
                  <p className="text-[8pt]">
                    <Controller
                      name="header.signatoryTitle"
                      control={control}
                      render={({ field }) => (
                        <input 
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            handleHeaderChange('signatoryTitle', e.target.value);
                          }}
                          className="text-right bg-transparent outline-none border-b border-transparent hover:border-gray-300 focus:border-blue-500 print:border-none"
                          style={{ width: '280px' }}
                        />
                      )}
                    />
                  </p>
                  <div className="flex justify-end items-center gap-1 mt-1">
                    <span className="text-[8pt]">Date:</span>
                    <Controller
                      name="header.date"
                      control={control}
                      render={({ field }) => (
                        <input 
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            handleHeaderChange('date', e.target.value);
                          }}
                          className="text-center bg-transparent outline-none border-b border-black w-32 text-[8pt] print:border-black"
                          placeholder="_______________"
                        />
                      )}
                    />
                  </div>
                </div>

                {/* MAIN TABLE */}
                <table className="w-full border-collapse text-[7pt] mb-2" style={{ tableLayout: 'fixed' }}>
                  <thead>
                    <tr>
                      <th rowSpan={2} className="border border-black p-1 bg-gray-100 w-[3%]">No.</th>
                      <th rowSpan={2} className="border border-black p-1 bg-gray-100 w-[15%]">Position Title (Parenthetical Title, if applicable)</th>
                      <th rowSpan={2} className="border border-black p-1 bg-gray-100 w-[6%]">Plantilla Item No.</th>
                      <th rowSpan={2} className="border border-black p-1 bg-gray-100 w-[5%]">Salary/ Job Pay Grade</th>
                      <th rowSpan={2} className="border border-black p-1 bg-gray-100 w-[7%]">Monthly Salary</th>
                      <th colSpan={5} className="border border-black p-1 bg-gray-100 text-center">Qualification Standards</th>
                      <th rowSpan={2} className="border border-black p-1 bg-gray-100 w-[8%]">Place of Assignment</th>
                    </tr>
                    <tr>
                      <th className="border border-black p-1 bg-gray-100 w-[12%]">Education</th>
                      <th className="border border-black p-1 bg-gray-100 w-[8%]">Training</th>
                      <th className="border border-black p-1 bg-gray-100 w-[8%]">Experience</th>
                      <th className="border border-black p-1 bg-gray-100 w-[10%]">Eligibility</th>
                      <th className="border border-black p-1 bg-gray-100 w-[10%]">Competency/ Area of Specialization/ Residency Requirement (if applicable)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {positions.map((pos, index) => (
                      <tr key={`position-${index}`}>
                        <td className="border border-black p-1 text-center">{pos.no}</td>
                        <td className="border border-black p-1">
                          <input 
                            value={pos.positionTitle}
                            onChange={(e) => handlePositionChange(index, 'positionTitle', e.target.value)}
                            className="w-full bg-transparent outline-none text-[7pt]"
                          />
                        </td>
                        <td className="border border-black p-1 text-center">
                          <input 
                            value={pos.plantillaItemNo}
                            onChange={(e) => handlePositionChange(index, 'plantillaItemNo', e.target.value)}
                            className="w-full bg-transparent outline-none text-center text-[7pt]"
                          />
                        </td>
                        <td className="border border-black p-1 text-center">
                          <input 
                            value={pos.salaryGrade}
                            onChange={(e) => handlePositionChange(index, 'salaryGrade', e.target.value)}
                            className="w-full bg-transparent outline-none text-center text-[7pt]"
                          />
                        </td>
                        <td className="border border-black p-1 text-right">
                          <input 
                            value={pos.monthlySalary}
                            onChange={(e) => handlePositionChange(index, 'monthlySalary', e.target.value)}
                            className="w-full bg-transparent outline-none text-right text-[7pt]"
                          />
                        </td>
                        <td className="border border-black p-1 text-[6pt]">
                          <textarea 
                            value={pos.education}
                            onChange={(e) => handlePositionChange(index, 'education', e.target.value)}
                            className="w-full bg-transparent outline-none resize-none text-[6pt]"
                            rows={3}
                          />
                        </td>
                        <td className="border border-black p-1 text-center">
                          <input 
                            value={pos.training}
                            onChange={(e) => handlePositionChange(index, 'training', e.target.value)}
                            className="w-full bg-transparent outline-none text-center text-[6pt]"
                          />
                        </td>
                        <td className="border border-black p-1 text-center">
                          <input 
                            value={pos.experience}
                            onChange={(e) => handlePositionChange(index, 'experience', e.target.value)}
                            className="w-full bg-transparent outline-none text-center text-[6pt]"
                          />
                        </td>
                        <td className="border border-black p-1 text-[6pt]">
                          <textarea 
                            value={pos.eligibility}
                            onChange={(e) => handlePositionChange(index, 'eligibility', e.target.value)}
                            className="w-full bg-transparent outline-none resize-none text-[6pt]"
                            rows={3}
                          />
                        </td>
                        <td className="border border-black p-1">
                          <input 
                            value={pos.competency}
                            onChange={(e) => handlePositionChange(index, 'competency', e.target.value)}
                            className="w-full bg-transparent outline-none text-[6pt]"
                          />
                        </td>
                        <td className="border border-black p-1">
                          <input 
                            value={pos.placeOfAssignment}
                            onChange={(e) => handlePositionChange(index, 'placeOfAssignment', e.target.value)}
                            className="w-full bg-transparent outline-none text-[6pt]"
                          />
                        </td>
                      </tr>
                    ))}
                    {positions.length === 0 && (
                      <tr>
                        <td colSpan={11} className="border border-black p-4 text-center text-gray-400 italic">
                          No vacant positions in the system.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* FOOTER INSTRUCTIONS */}
                <div className="text-[7pt] space-y-2 mt-4">
                  <p className="text-justify">
                    Interested and qualified applicants should signify their interest in writing through an application letter addressed to the head of office. Applicants must attach the following documents to the application letter and send these to the address below not later than 
                    <Controller
                      name="header.deadlineDate"
                      control={control}
                      render={({ field }) => (
                        <input 
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            handleHeaderChange('deadlineDate', e.target.value);
                          }}
                          className="mx-1 border-b border-black w-32 text-center bg-transparent outline-none print:border-black"
                          placeholder="_______________"
                        />
                      )}
                    />
                  </p>
                  
                  <ol className="list-decimal ml-4 space-y-0.5">
                    <li>Fully accomplished Personal Data Sheet (PDS) with Work Experience Sheet and recent passport-sized or unfiltered digital picture (CS Form No. 212, Revised 2025); digitally signed or electronically signed;</li>
                    <li>Hard copy or electronic copy of Performance rating in the last rating period (if applicable);</li>
                    <li>Hard copy or electronic copy of proof of eligibility/rating/license; and</li>
                    <li>Hard copy or electronic copy of Transcript of Records.</li>
                  </ol>

                  <p className="italic text-justify mt-2">
                    This Office highly encourages all interested and qualified applicants to apply, which include persons with disability (PWD) and members of the indigenous communities, irrespective of sexual orientation and gender identities and/or expression, civil status, religion, and political affiliation.
                  </p>
                  
                  <p className="italic text-justify">
                    This Office does not discriminate in the selection of employees based on the aforementioned pursuant to Equal Opportunities for Employment Principle (EOP).
                  </p>

                  <p className="text-justify mt-2">
                    QUALIFIED APPLICANTS are advised to hand in or send through courier/email their application to the head of office/ human resource management office/records office, as the case may be:
                  </p>

                  <div className="mt-3">
                    <p className="font-bold">{header.signatoryName}</p>
                    <p>{header.signatoryTitle}</p>
                    <p>
                      <Controller
                        name="header.officeAddress"
                        control={control}
                        render={({ field }) => (
                          <input 
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              handleHeaderChange('officeAddress', e.target.value);
                            }}
                            className="bg-transparent outline-none border-b border-transparent hover:border-gray-300 focus:border-blue-500 print:border-none"
                            style={{ width: '350px' }}
                          />
                        )}
                      />
                    </p>
                    <p>
                      <Controller
                        name="header.contactInfo"
                        control={control}
                        render={({ field }) => (
                          <input 
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              handleHeaderChange('contactInfo', e.target.value);
                            }}
                            className="bg-transparent outline-none border-b border-transparent hover:border-gray-300 focus:border-blue-500 print:border-none"
                            style={{ width: '350px' }}
                          />
                        )}
                      />
                    </p>
                  </div>

                  <p className="font-bold mt-4 text-[8pt]">
                    APPLICATIONS WITH INCOMPLETE DOCUMENTS SHALL NOT BE ENTERTAINED.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

Form9Modal.displayName = 'Form9Modal';

export default Form9Modal;
