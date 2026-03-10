import React, { useRef } from 'react';
import { Job } from '@/types';
import { Printer } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';

interface JobVacancyAnnouncementProps {
  job: Job;
  onClose?: () => void;
}

const JobVacancyAnnouncement: React.FC<JobVacancyAnnouncementProps> = ({ job, onClose }) => {
  const componentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Job_Vacancy_${job.title.replace(/\s+/g, '_')}`,
  });

  // Helper to check employment status
  const isJobOrder = job.employmentType?.toLowerCase().includes('job order');
  const isContract = job.employmentType?.toLowerCase().includes('contract') || job.employmentType?.toLowerCase().includes('service');

  return (
    <div className="flex flex-col h-full bg-gray-100 overflow-hidden">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm z-10">
        <h2 className="text-lg font-bold text-gray-800">Announcement Preview</h2>
        <div className="flex gap-3">
          {onClose && (
            <button 
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          )}
          <button 
            onClick={handlePrint}
            className="px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
          >
            <Printer size={16} /> Print Announcement
          </button>
        </div>
      </div>

      {/* Document Preview Area */}
      <div className="flex-1 overflow-y-auto p-8 flex justify-center bg-gray-500/10">
        <div 
          ref={componentRef}
          className="bg-white shadow-xl mx-auto w-[210mm] min-h-[297mm] p-[15mm] text-black bg-white print:shadow-none"
          style={{ fontFamily: '"Times New Roman", Times, serif' }} // Using serif font to match official documents
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4 relative">
             <div className="w-24 h-24 flex-shrink-0">
               {/* Left Logo */}
               <img src="/Logo.Municipal of Meycuayan.png" alt="Meycauayan Logo" className="w-full h-full object-contain" />
             </div>
             
             <div className="flex-1 text-center px-4">
                <p className="text-sm italic mb-1">Republic of the Philippines</p>
                <h1 className="text-xl font-bold uppercase tracking-wide leading-tight">CITY GOVERNMENT OF MEYCAUAYAN</h1>
                <p className="text-sm">MacArthur Highway, Saluysoy, City of Meycauayan, Bulacan</p>
                <p className="text-sm">044-919-8020 local 501</p>
                <p className="text-sm text-blue-800 underline">email: chrmomeyc.jobs@gmail.com</p>
             </div>

             <div className="w-24 h-24 flex-shrink-0 flex items-center justify-center">
               {/* Right Logo Placeholder (Bagong Pilipinas) */}
                <div className="w-20 h-20 rounded-full border-2 border-gray-100 flex items-center justify-center text-[10px] text-gray-300 bg-gray-50 text-center p-1">
                   Bagong Pilipinas Logo
                </div>
             </div>
          </div>

          <div className="mb-6">
              <div className="border-t border-b border-gray-400 py-1 mb-1">
                 <h2 className="text-center font-bold text-lg uppercase tracking-wider text-gray-600">OFFICE OF THE CITY HUMAN RESOURCE MANAGEMENT OFFICER</h2>
              </div>
              <div className="border-b border-gray-800 w-full mb-8"></div> {/* Double line effect */}
              
              <h2 className="text-center font-bold text-xl underline decoration-2 underline-offset-4 uppercase mb-6">JOB VACANCIES ANNOUNCEMENT</h2>
          </div>

          {/* Job Details Table */}
          <table className="w-full border-collapse border border-black mb-6 text-sm">
            <tbody>
              <tr>
                <td className="border border-black p-2 font-bold w-[25%] bg-gray-100">POSITION TITLE</td>
                <td className="border border-black p-2 font-bold uppercase" colSpan={3}>{job.title}</td>
              </tr>
              <tr>
                <td className="border border-black p-2 font-bold bg-gray-100">OFFICE</td>
                <td className="border border-black p-2 uppercase" colSpan={3}>{job.officeName || job.department}</td>
              </tr>
              <tr>
                <td className="border border-black p-2 font-bold bg-gray-100">SALARY</td>
                <td className="border border-black p-2 uppercase" colSpan={3}>{job.salaryRange}</td>
              </tr>
              <tr>
                <td className="border border-black p-2 font-bold bg-gray-100">EMPLOYMENT STATUS</td>
                <td className="border border-black p-2" colSpan={3}>
                   <div className="flex gap-12">
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 border border-black flex items-center justify-center ${isJobOrder ? 'bg-black' : ''}`}>
                          {isJobOrder && <span className="text-white text-xs">✓</span>}
                        </div>
                        <span>Job Order</span>
                      </div>
                      <div className="flex items-center gap-2">
                         <div className={`w-4 h-4 border border-black flex items-center justify-center ${isContract ? 'bg-black' : ''}`}>
                             {isContract && <span className="text-white text-xs">✓</span>}
                         </div>
                        <span>Contract of Service</span>
                      </div>
                   </div>
                </td>
              </tr>
              <tr>
                 <td className="border border-black p-2 font-bold bg-gray-100">WORK LOCATION</td>
                 <td className="border border-black p-2 uppercase" colSpan={3}>{job.location}</td>
              </tr>
            </tbody>
          </table>

          {/* Qualification Requirements Table */}
          <table className="w-full border-collapse border border-black mb-6 text-sm">
            <thead>
               <tr>
                 <td className="border border-black p-2 font-bold text-center bg-gray-100 uppercase" colSpan={2}>QUALIFICATION REQUIREMENTS</td>
               </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black p-2 font-bold w-[25%] bg-gray-100">EDUCATION</td>
                <td className="border border-black p-2 uppercase">{job.education || 'N/A'}</td>
              </tr>
               <tr>
                <td className="border border-black p-2 font-bold bg-gray-100">EXPERIENCE</td>
                <td className="border border-black p-2 uppercase">{job.experience || 'N/A'}</td>
              </tr>
               <tr>
                <td className="border border-black p-2 font-bold bg-gray-100">TRAINING</td>
                <td className="border border-black p-2 uppercase">{job.training || 'N/A'}</td>
              </tr>
               <tr>
                <td className="border border-black p-2 font-bold bg-gray-100">ELIGIBILITY</td>
                <td className="border border-black p-2 uppercase">{job.eligibility || 'N/A'}</td>
              </tr>
                <tr>
                <td className="border border-black p-2 font-bold bg-gray-100">OTHERS</td>
                <td className="border border-black p-2 uppercase">{job.otherQualifications || 'N/A'}</td>
              </tr>
            </tbody>
          </table>

           {/* Job Description Box */}
           <div className="border border-black mb-6">
               <div className="border-b border-black p-2 font-bold text-sm text-center bg-gray-100 uppercase">JOB DESCRIPTION</div>
               <div className="p-4 text-sm whitespace-pre-wrap min-h-[150px] text-justify leading-relaxed">
                   {job.jobDescription}
               </div>
           </div>

           {/* Requirements Section */}
           {/* If requirements are stored as a list or string, try to format them nicely */}
           <div className="border border-black mb-8 p-4 text-sm">
               <div className="font-bold text-center mb-4 uppercase underline">REQUIREMENTS:</div>
               <div className="whitespace-pre-wrap leading-relaxed px-4">
                  {job.requirements || (
                    <ol className="list-decimal pl-5 space-y-1 italic text-gray-500">
                        <li>Requirements not specified.</li>
                    </ol>
                  )}
               </div>
           </div>


           {/* Footer / Submission Info */}
           <div className="text-sm text-center space-y-4 mb-12">
              <p>Submit your application and complete requirements to the:</p>
              
              <div className="font-bold">
                  <p>OFFICE OF THE CITY HUMAN RESOURCE MANAGEMENT OFFICER</p>
                  <p>City Government of Meycauayan</p>
                  <p>5th Floor, New Meycauayan City Hall, McArthur Highway,</p>
                  <p>Saluysoy, City of Meycauayan, Bulacan</p>
              </div>

              <p>or email at <span className="text-blue-800 underline font-bold">{job.applicationEmail}</span> with the subject line : [POSITION APPLIED - APPLICANT'S NAME]</p>
              
              <p className="font-bold uppercase">APPLICATIONS WITH INCOMPLETE DOCUMENTS SHALL NOT BE ENTERTAINED.</p>

              <p>For inquiries, contact 044-919-8020 local 501 and look for [Recruitment Staff/FSB Secretariat/HRMPSB Secretariat].</p>

              <p className="font-bold">Deadline for Submission: <span className="underline decoration-black decoration-1 underline-offset-2">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></p>

              <p className="text-xs mt-6 px-8 leading-tight">
                  This Office upholds equal opportunity employment and highly encourages qualified women, persons with disabilities (PWDs), members of indigenous groups and other marginalized sectors to apply.
              </p>

              <p className="font-bold pt-4">WE LOOK FORWARD TO YOUR APPLICATION!</p>
           </div>
           
           {/* Footer Controlled Copy Note */}
            <div className="border border-gray-400 p-2 text-[10px] text-gray-500 flex gap-2 italic">
               <div className="flex-1 text-justify">
                  This document is a Controlled Copy issued by the City Government of Meycauayan to the particular recipient. Any and all reproduction thereof without the necessary authority and security mark or seal shall be considered UNCONTROLLED COPIES. The Document Control Procedure of the City Government of Meycauayan shall apply. If you come into possession of this document by mistake or accident, kindly return the same. Any unauthorized or illegal use hereof shall be punishable by the Revised Penal Code and other applicable laws of the Philippines.
               </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default JobVacancyAnnouncement;
