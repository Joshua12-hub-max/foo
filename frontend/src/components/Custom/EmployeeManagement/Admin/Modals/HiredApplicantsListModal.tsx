import React from 'react';
import { X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { recruitmentApi } from '@/api/recruitmentApi';
import { HiredApplicant } from '@/types/recruitment_applicant';

interface HiredApplicantsListModalProps {
  isOpen: boolean;
  onClose: () => void;
  dutyType: 'Standard' | 'Irregular';
  departmentName: string;
  onSelectApplicant: (applicantId: number) => void;
}

const HiredApplicantsListModal: React.FC<HiredApplicantsListModalProps> = ({ 
  isOpen, 
  onClose, 
  dutyType,
  departmentName,
  onSelectApplicant
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');

  const { data: response, isLoading, error } = useQuery({
    queryKey: ['hiredApplicants', dutyType, departmentName],
    queryFn: () => recruitmentApi.getHiredApplicantsByDuty<HiredApplicant>(dutyType, departmentName),
    enabled: isOpen,
    staleTime: 1000 * 60, // 1 minute
  });

  const applicants = response?.data?.applicants || [];
  const filteredApplicants = applicants.filter(app => {
    const fullName = `${app.lastName}, ${app.firstName} ${app.middleName || ''}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase()) || 
           (app.jobTitle || '').toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (!isOpen) return null;

  const isStandard = dutyType === 'Standard';

  return (
    <div className="fixed inset-0 min-h-screen bg-black/40 flex items-center justify-center p-4 z-[999] animate-in fade-in duration-200">
      <div className="bg-white border border-gray-100 rounded-2xl w-full max-w-2xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-white border-b border-gray-200">
          <div className="mb-4 md:mb-0">
            <h2 className="text-xl font-bold text-gray-900">
              Newly Hired Candidates
            </h2>
            <p className="text-sm text-gray-500 mt-1">Select a hired candidate to register for <span className="font-semibold text-gray-900">{departmentName}</span></p>
          </div>
          
          <div className="flex items-center gap-3">
             {/* Search box */}
             <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search name or position..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-100 focus:border-gray-300 w-full md:w-48 shadow-sm"
                />
             </div>
             <button 
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-50 border border-gray-200 p-2 rounded-lg transition-colors shadow-sm focus:outline-none"
             >
                <X size={20} strokeWidth={2.5} />
             </button>
          </div>
        </div>

        {/* Content Table */}
        <div className="flex-1 overflow-y-auto bg-gray-50/30 p-6">
          
          {isLoading ? (
             <div className="flex flex-col items-center justify-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900 mb-4"></div>
                <p className="text-gray-500 text-sm">Loading hired candidates...</p>
             </div>
          ) : error ? (
             <div className="bg-gray-50 border border-gray-200 text-gray-900 p-6 rounded-xl flex flex-col justify-center items-center text-center">
                <h4 className="font-bold">Error loading data</h4>
                <p className="text-sm text-gray-500 mt-1">Could not fetch the hired applicants. Please try again.</p>
             </div>
          ) : filteredApplicants.length === 0 ? (
             <div className="bg-white border text-center border-gray-200 py-16 px-6 rounded-xl flex flex-col items-center justify-center">
                <h4 className="font-bold text-gray-900 text-lg">No candidates found</h4>
                <p className="text-gray-500 text-sm mt-2 max-w-sm">
                   {searchTerm ? "No results match your search." : `There are no newly hired candidates under the ${dutyType} category that need registration.`}
                </p>
                {searchTerm && (
                   <button 
                     onClick={() => setSearchTerm('')}
                     className="mt-4 text-sm font-semibold text-gray-900 underline hover:text-gray-700"
                   >
                     Clear search
                   </button>
                )}
             </div>
          ) : (
             <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm whitespace-nowrap">
                   <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold uppercase text-[10px] tracking-wider">
                      <tr>
                         <th className="px-5 py-3">Applicant Name</th>
                         <th className="px-5 py-3">Position & Type</th>
                         <th className="px-5 py-3 text-right">Action</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100">
                      {filteredApplicants.map((applicant) => (
                         <tr key={applicant.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-5 py-4">
                               <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold border border-gray-200 flex-shrink-0 text-xs">
                                     {applicant.firstName.charAt(0)}{applicant.lastName.charAt(0)}
                                  </div>
                                  <div>
                                     <p className="font-bold text-gray-900">
                                        {applicant.lastName}, {applicant.firstName} {applicant.middleName || ''}
                                     </p>
                                     <p className="text-[10px] text-gray-500 uppercase tracking-wider">APP-{String(applicant.id).padStart(4, '0')} • Hired {new Date(applicant.hiredDate || '').toLocaleDateString()}</p>
                                  </div>
                               </div>
                            </td>
                            <td className="px-5 py-4">
                               <div>
                                 <span className="font-medium text-gray-700 block">{applicant.jobTitle}</span>
                                 <span className="text-gray-500 text-xs tracking-wide">
                                    {applicant.employmentType}
                                 </span>
                               </div>
                            </td>
                            <td className="px-5 py-4 text-right">
                               <button 
                                 onClick={() => onSelectApplicant(applicant.id)}
                                 className="inline-flex bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg font-bold text-xs transition-colors shadow-sm active:scale-95"
                               >
                                  Register
                               </button>
                            </td>
                         </tr>
                      ))}
                   </tbody>
                </table>
                </div>
             </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default HiredApplicantsListModal;
