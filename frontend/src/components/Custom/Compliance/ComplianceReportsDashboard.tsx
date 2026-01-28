import React from 'react';
import { FileText, Download, Printer, FileCheck, Users, Briefcase, AlertCircle } from 'lucide-react';

interface ReportType {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    bg: string;
    frequency: string;
}

const reports: ReportType[] = [
    {
        id: 'form9',
        title: 'CSC Form No. 9',
        description: 'Request for Publication of Vacant Positions. Required for posting vacancies.',
        icon: <Briefcase size={24} />,
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        frequency: 'As needed'
    },
    {
        id: 'form33',
        title: 'CS Form No. 33',
        description: 'Appointment Form (KSS). Official document for new hires and promotions.',
        icon: <FileCheck size={24} />,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
        frequency: 'Per appointment'
    },
    {
        id: 'rai',
        title: 'Report on Appointments Issued (RAI)',
        description: 'Monthly report submitted to CSC detailing all appointments issued.',
        icon: <FileText size={24} />,
        color: 'text-purple-600',
        bg: 'bg-purple-50',
        frequency: 'Monthly'
    },
    {
        id: 'psipop',
        title: 'PSI-POP',
        description: 'Personal Services Itemization and Plantilla of Personnel.',
        icon: <Users size={24} />,
        color: 'text-amber-600',
        bg: 'bg-amber-50',
        frequency: 'Annual'
    }
];

const ComplianceReportsDashboard: React.FC = () => {

    const handleDownload = (reportId: string, type: 'pdf' | 'excel') => {
        // In a real app, this would trigger a blob download from the API
        const url = `http://localhost:5000/api/reports/${reportId}?format=${type}`;
        window.open(url, '_blank');
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <FileText className="text-blue-600" />
                    Compliance & Regulatory Reports
                </h3>
                <p className="text-sm text-gray-500">
                    Generate and download official Civil Service Commission (CSC) compliant forms and reports.
                </p>
            </div>

            {/* Reports Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reports.map((report) => (
                    <div 
                        key={report.id} 
                        className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all group"
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div className={`p-2.5 rounded-lg bg-gray-50 text-emerald-600 group-hover:bg-emerald-50 transition-colors`}>
                                {report.icon}
                            </div>
                            <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-[10px] font-bold rounded-full uppercase tracking-wider">
                                {report.frequency}
                            </span>
                        </div>
                        
                        <h4 className="text-base font-bold text-gray-900 mb-1 group-hover:text-emerald-600 transition-colors">
                            {report.title}
                        </h4>
                        <p className="text-gray-500 text-xs mb-4 h-8 line-clamp-2 leading-relaxed">
                            {report.description}
                        </p>

                        <div className="flex gap-2 pt-3 border-t border-gray-100">
                            <button 
                                onClick={() => handleDownload(report.id, 'pdf')}
                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white hover:bg-emerald-50 border border-gray-200 hover:border-emerald-200 text-gray-600 hover:text-emerald-700 rounded-lg text-xs font-semibold transition-all active:scale-95"
                            >
                                <Printer size={14} />
                                Preview
                            </button>
                            <button 
                                onClick={() => handleDownload(report.id, 'excel')}
                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all active:scale-95"
                            >
                                <Download size={14} />
                                Export
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Info Footer */}
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start gap-3">
                <div className="p-1 bg-blue-100 rounded-full text-blue-600 mt-0.5">
                    <AlertCircle size={16} />
                </div>
                <div>
                    <h5 className="text-sm font-bold text-blue-800">Compliance Note</h5>
                    <p className="text-xs text-blue-700 mt-1">
                        All generated reports are formatted according to the latest CSC/DBM guidelines. 
                        Please ensure all Plantilla updates are saved before generating reports to ensure accuracy.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ComplianceReportsDashboard;
