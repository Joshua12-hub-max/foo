import React from 'react';
import { Download, Printer, AlertCircle } from 'lucide-react';

interface ReportType {
    id: string;
    title: string;
    description: string;

    color: string;
    bg: string;
    frequency: string;
}

const reports: ReportType[] = [
    {
        id: 'form9',
        title: 'CSC Form No. 9',
        description: 'Request for Publication of Vacant Positions. Required for posting vacancies.',
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        frequency: 'As needed'
    },
    {
        id: 'form33',
        title: 'CS Form No. 33',
        description: 'Appointment Form (KSS). Official document for new hires and promotions.',
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
        frequency: 'Per appointment'
    },
    {
        id: 'rai',
        title: 'Report on Appointments Issued (RAI)',
        description: 'Monthly report submitted to CSC detailing all appointments issued.',
        color: 'text-purple-600',
        bg: 'bg-purple-50',
        frequency: 'Monthly'
    },
    {
        id: 'psipop',
        title: 'PSI-POP',
        description: 'Personal Services Itemization and Plantilla of Personnel.',
        color: 'text-amber-600',
        bg: 'bg-amber-50',
        frequency: 'Annual'
    }
];

import { reportsApi } from '@/api/reportsApi';
import { plantillaApi } from '@/api/plantillaApi';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { X } from 'lucide-react';

const ComplianceReportsDashboard: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalReportId, setModalReportId] = useState<string | null>(null);
    const [positions, setPositions] = useState<any[]>([]);
    const [selectedPositionId, setSelectedPositionId] = useState<string>('');
    const [loadingPositions, setLoadingPositions] = useState(false);

    const generatePDF = (reportId: string, data: any, meta: any) => {
        // ... (PDF Generation Logic - Unchanged) ...
        const doc = new jsPDF();
        
        // Header
        doc.setFontSize(10);
        doc.text("Republic of the Philippines", 105, 15, { align: "center" });
        doc.text("Province of Bulacan", 105, 20, { align: "center" });
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("MUNICIPALITY OF MEYCAUAYAN", 105, 28, { align: "center" });
        
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.text(meta.form_name || "Official Report", 105, 40, { align: "center" });
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text(meta.title || "Report Document", 105, 48, { align: "center" });
        
        doc.line(20, 55, 190, 55);
        
        // Content based on ID
        if (reportId === 'form9' || reportId === 'rai' || reportId === 'psipop') {
             const tableColumn = Object.keys(data[0] || {}).map(key => key.toUpperCase().replace(/_/g, " "));
             const tableRows = data.map((row: any) => Object.values(row));
             
             autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 60,
                theme: 'grid',
                styles: { fontSize: 8 },
                headStyles: { fillColor: [22, 163, 74] } // Green
             });
        } else if (reportId === 'form33') {
             // Appointment Form (Key-Value)
             let y = 70;
             Object.entries(data).forEach(([key, value]) => {
                 doc.setFontSize(10);
                 doc.setFont("helvetica", "bold");
                 doc.text(`${key.replace(/_/g, " ").toUpperCase()}:`, 20, y);
                 doc.setFont("helvetica", "normal");
                 doc.text(`${value || "N/A"}`, 80, y);
                 y += 10;
             });
        }
        
        // Save/Open
        const pdfBlob = doc.output('blob');
        const url = URL.createObjectURL(pdfBlob);
        window.open(url, '_blank');
    };

    const handlePreviewClick = async (reportId: string) => {
        if (reportId === 'form33') {
            setModalReportId(reportId);
            setIsModalOpen(true);
            setLoadingPositions(true);
            try {
                const response = await plantillaApi.getPositions({});
                // Filter only filled positions for appointments
                const filled = response.data.positions.filter((p: any) => p.incumbent_id);
                setPositions(filled);
            } catch (err) {
                toast.error("Failed to load positions");
                setIsModalOpen(false);
            } finally {
                setLoadingPositions(false);
            }
        } else {
            handleDownload(reportId, 'pdf');
        }
    };

    const handleDownload = async (reportId: string, type: 'pdf' | 'excel', params: any = {}) => {
        try {
            toast.loading("Generating report...");
            
            // 1. Fetch JSON Data
            const response = await reportsApi.getReportData(reportId, params);
            
            if (response.success && response.data) {
                toast.dismiss();
                toast.success("Report generated!");
                
                if (type === 'pdf') {
                    generatePDF(reportId, response.data, response.meta);
                } else {
                    toast("Excel export coming soon!", { icon: '⚠️' });
                }
            } else {
                 throw new Error(response.message || "No data returned");
            }
        } catch (error: any) {
            toast.dismiss();
            console.error("Failed to generate report:", error);
            const msg = error.response?.data?.message || error.message || "Failed to generate";
            toast.error(msg);
        }
    };

    const confirmSelection = () => {
        if (!selectedPositionId) {
            toast.error("Please select a position");
            return;
        }
        handleDownload('form33', 'pdf', { position_id: selectedPositionId });
        setIsModalOpen(false);
        setSelectedPositionId('');
    };


    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
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
                        <div className="flex items-start justify-end mb-3">
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
                                onClick={() => handlePreviewClick(report.id)}
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

            {/* Selection Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-900">Select Appointment</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            <p className="text-sm text-gray-600">
                                Please select the employee/position for which you want to generate the Appointment Form (CS Form 33).
                            </p>
                            
                            {loadingPositions ? (
                                <div className="text-center py-4 text-emerald-600">Loading positions...</div>
                            ) : (
                                <select 
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                    value={selectedPositionId}
                                    onChange={(e) => setSelectedPositionId(e.target.value)}
                                >
                                    <option value="">-- Select a Position --</option>
                                    {positions.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.position_title} - {p.incumbent_name || 'Unknown'} ({p.item_number})
                                        </option>
                                    ))}
                                </select>
                            )}
                            
                            <div className="flex justify-end gap-2 mt-6">
                                <button 
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={confirmSelection}
                                    disabled={!selectedPositionId}
                                    className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Generate Report
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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
