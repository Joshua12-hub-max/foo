import React, { useState, memo } from 'react';
import { 
  FileText, Search, Download,
  Calendar, Users, Building, AlertCircle,
  FileSearch
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { complianceApi } from '@/api/complianceApi';
import type { Form9Row, PSIPOPRow, Form33Data } from '@/api/complianceApi';

interface ReportsDashboardProps {
  departments: string[];
}

type SelectedReport = 'form9' | 'form33' | 'psipop';

const ComplianceReportsDashboard: React.FC<ReportsDashboardProps> = memo(({ departments }) => {
  const [activeReport, setActiveReport] = useState<SelectedReport>('form9');
  const [filters, setFilters] = useState({
    department: 'All',
    startDate: '',
    endDate: '',
    search: ''
  });

  // Query for Form 9
  const { data: form9, isLoading: loadingForm9 } = useQuery({
    queryKey: ['report-form9', filters.department],
    queryFn: () => complianceApi.reports.getForm9({ 
      department: filters.department === 'All' ? undefined : filters.department 
    }),
    enabled: activeReport === 'form9'
  });

  // Query for PSIPOP
  const { data: psipop, isLoading: loadingPsipop } = useQuery({
    queryKey: ['report-psipop'],
    queryFn: () => complianceApi.reports.getPSIPOP(),
    enabled: activeReport === 'psipop'
  });


  const reports = [
    { 
      id: 'form9', 
      title: 'Form 9: Publication', 
      desc: 'List vacant positions with qualification standards for CSC publication.',
      icon: <FileText size={18} />
    },
    { 
      id: 'psipop', 
      title: 'PSI-POP', 
      desc: 'Plantilla of Personnel. Master list of all authorized positions.',
      icon: <Users size={18} />
    },
    { 
      id: 'form33', 
      title: 'Form 33: Appointment', 
      desc: 'Generate individual appointment form for a specific incumbent.',
      icon: <FileSearch size={18} />
    }
  ];



  const formatPHP = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {reports.map((report) => (
          <button
            key={report.id}
            onClick={() => setActiveReport(report.id as SelectedReport)}
            className={`p-4 rounded-2xl border transition-all text-left flex flex-col gap-2 ${
              activeReport === report.id 
                ? 'bg-indigo-600 border-indigo-700 text-white shadow-lg scale-[1.02]' 
                : 'bg-white border-gray-100 text-gray-600 hover:border-indigo-200'
            }`}
          >
            <div className={`p-2 rounded-lg w-fit ${activeReport === report.id ? 'bg-white/20' : 'bg-indigo-50 text-indigo-600'}`}>
                {report.icon}
            </div>
            <div>
                <h4 className="font-bold text-sm">{report.title}</h4>
                <p className={`text-[10px] leading-tight mt-1 ${activeReport === report.id ? 'text-white/80' : 'text-gray-400'}`}>
                    {report.desc}
                </p>
            </div>
          </button>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-wrap items-center gap-4">
        {activeReport === 'form9' && (
            <div className="flex items-center gap-2">
                <Building size={16} className="text-gray-400" />
                <select 
                    value={filters.department}
                    onChange={(e) => setFilters({...filters, department: e.target.value})}
                    className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-1.5 text-xs font-semibold focus:ring-2 focus:ring-indigo-500/20 outline-none"
                >
                    <option value="All">All Departments</option>
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
            </div>
        )}


        <div className="flex-1" />

        <div className="flex items-center gap-2">
            <button 
                onClick={async () => {
                    const agency = "LGU Ligao"; 
                    const commonConfig = {
                        departmentGocc: filters.department === 'All' ? 'All Departments' : filters.department,
                        bureauAgency: agency,
                        fiscalYear: new Date().getFullYear().toString(),
                        preparedBy: 'HR Officer', // Placeholder or use user context
                        preparedByTitle: 'HRMO III',
                        approvedBy: 'Mayor Name',
                        approvedByTitle: 'City Mayor'
                    };

                    if (activeReport === 'form9') {
                        const { generateForm9Excel } = await import('./print/form9_excel_generator');
                        if (form9?.data) {
                           // Construct the Form9Data object expected by the generator
                           const mappedData = {
                               header: {
                                    agencyName: agency,
                                    signatoryName: "HR Officer",
                                    signatoryTitle: "HRMO",
                                    date: new Date().toLocaleDateString(),
                                    deadlineDate: new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString(),
                                    officeAddress: "City Hall",
                                    contactInfo: "123-4567"
                               },
                               positions: form9.data.data.map((p: Form9Row) => ({
                                   no: Number(p.item_number),
                                   positionTitle: p.position_title,
                                   plantillaItemNo: p.item_number,
                                   salaryGrade: String(p.salary_grade),
                                   monthlySalary: String(p.monthly_salary),
                                   education: p.education,
                                   training: String(p.training),
                                   experience: String(p.experience),
                                   eligibility: p.eligibility,
                                   competency: p.competency,
                                   placeOfAssignment: p.place_of_assignment || 'City Hall'
                               }))
                           };
                           await generateForm9Excel(mappedData);
                        }
                    } else if (activeReport === 'psipop') {
                        const { generatePSIPOPExcel } = await import('./print/psipop_excel_generator');
                        if (psipop?.data?.data) {
                            // Map PSIPOPRow to Position (adding mock id/properties)
                             const positions = psipop.data.data.map((p: PSIPOPRow) => ({
                                 ...p,
                                 incumbent_name: p.incumbent_name ?? undefined,
                                 id: Math.random(),
                                 department_id: 0,
                                 education: '',
                                 training: '', 
                                 experience: '',
                                 eligibility: '',
                                 competency: '',
                                 incumbent_id: undefined,
                                 created_at: '',
                                 updated_at: ''
                             }));
                            await generatePSIPOPExcel(positions, commonConfig);
                        }
                    }
                }}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
            >
                <FileText size={14} /> Export Excel
            </button>
            <button 
                onClick={async () => {
                   const commonConfig = {
                        departmentGocc: filters.department === 'All' ? 'All Departments' : filters.department,
                        bureauAgency: "LGU Ligao",
                        fiscalYear: new Date().getFullYear().toString(),
                        preparedBy: 'HR Officer', 
                        preparedByTitle: 'HRMO III',
                        approvedBy: 'Mayor Name',
                        approvedByTitle: 'City Mayor'
                    };

                    if (activeReport === 'form9') {
                         const { generateForm9PDF } = await import('./print/form9_pdf_generator');
                         if (form9?.data?.data) {
                             const mappedData = {
                               header: {
                                    agencyName: "LGU Ligao",
                                    signatoryName: "HR Officer",
                                    signatoryTitle: "HRMO",
                                    date: new Date().toLocaleDateString(),
                                    deadlineDate: new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString(),
                                    officeAddress: "City Hall",
                                    contactInfo: "123-4567"
                               },
                               positions: form9.data.data.map((p: Form9Row) => ({
                                   no: Number(p.item_number),
                                   positionTitle: p.position_title,
                                   plantillaItemNo: p.item_number,
                                   salaryGrade: String(p.salary_grade),
                                   monthlySalary: String(p.monthly_salary),
                                   education: p.education,
                                   training: String(p.training),
                                   experience: String(p.experience),
                                   eligibility: p.eligibility,
                                   competency: p.competency,
                                   placeOfAssignment: p.place_of_assignment || 'City Hall'
                               }))
                           };
                           generateForm9PDF(mappedData);
                         }
                    } else if (activeReport === 'psipop') {
                        const { generatePSIPOPPDF } = await import('./print/psipop_pdf_generator');
                         if (psipop?.data?.data) {
                            const positions = psipop.data.data.map((p: PSIPOPRow) => ({
                                 ...p,
                                 incumbent_name: p.incumbent_name ?? undefined,
                                 id: Math.random(),
                                 department_id: 0,
                                 education: '',
                                 training: '', 
                                 experience: '',
                                 eligibility: '',
                                 competency: '',
                                 incumbent_id: undefined,
                                 created_at: '',
                                 updated_at: ''
                             }));
                            generatePSIPOPPDF(positions, commonConfig);
                         }
                    }
                }}
                className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
            >
                <Download size={14} /> Export PDF
            </button>
        </div>
      </div>

      {/* Report Preview */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
            <div>
                <h3 className="font-black text-gray-800 tracking-tight uppercase text-sm">
                    {reports.find(r => r.id === activeReport)?.title} - Preview
                </h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                    Data extracted on {new Date().toLocaleString()}
                </p>
            </div>
            {activeReport === 'form33' && (
                <div className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black border border-amber-100 flex items-center gap-1.6">
                    <AlertCircle size={12} /> Select a specific appointee to generate Form 33
                </div>
            )}
        </div>

        <div className="overflow-x-auto min-h-[400px]">
            {activeReport === 'form9' && (
                <TablePreview 
                    loading={loadingForm9}
                    headers={['Item No.', 'Position', 'SG', 'Salary', 'Education', 'Training', 'Experience', 'Eligibility']}
                    data={form9?.data.data.map(row => [
                        row.item_number, 
                        row.position_title, 
                        row.salary_grade, 
                        formatPHP(row.monthly_salary),
                        row.education,
                        row.training === 0 ? 'None' : `${row.training} hrs`,
                        row.experience === 0 ? 'None' : `${row.experience} yrs`,
                        row.eligibility
                    ]) || []}
                />
            )}

            {activeReport === 'psipop' && (
                <TablePreview 
                    loading={loadingPsipop}
                    headers={['Item No.', 'Position', 'SG', 'Salary', 'Department', 'Incumbent', 'Status']}
                    data={psipop?.data.data.map(row => [
                        row.item_number, 
                        row.position_title, 
                        row.salary_grade, 
                        formatPHP(row.monthly_salary),
                        row.department,
                        row.incumbent_name || 'VACANT',
                        row.is_vacant ? 'Vacant' : 'Filled'
                    ]) || []}
                />
            )}


            {activeReport === 'form33' && (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-4">
                    <div className="p-4 bg-gray-50 rounded-full">
                        <Users size={32} />
                    </div>
                    <div className="text-center">
                        <p className="font-bold text-sm text-gray-600">Individual Appointment Form</p>
                        <p className="text-xs max-w-xs mx-auto mt-1 leading-relaxed">
                            To generate CS Form 33, please navigate to the "Positions" tab and click "View History" on a filled position, then select the incumbent's form.
                        </p>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
});

// Helper Preview Table
const TablePreview = ({ loading, headers, data }: { loading: boolean; headers: string[]; data: (string | number | boolean | null)[][] }) => {
    if (loading) return (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-bold text-gray-400 animate-pulse">EXTRACTING COMPLIANCE DATA...</p>
        </div>
    );

    if (data.length === 0) return (
        <div className="flex flex-col items-center justify-center py-32 gap-3">
            <Search size={32} className="text-gray-200" />
            <p className="text-xs font-bold text-gray-400">NO RECORDS FOUND FOR CURRENT FILTERS</p>
        </div>
    );

    return (
        <table className="w-full text-left border-collapse">
            <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                    {headers.map(h => (
                        <th key={h} className="px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">{h}</th>
                    ))}
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
                {data.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                        {row.map((cell, j) => (
                            <td key={j} className="px-6 py-3 text-[11px] font-bold text-gray-700">{cell}</td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

ComplianceReportsDashboard.displayName = 'ComplianceReportsDashboard';

export default ComplianceReportsDashboard;
