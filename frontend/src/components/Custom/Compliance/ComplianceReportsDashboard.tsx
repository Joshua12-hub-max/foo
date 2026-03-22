
import React from 'react';
import { Download, Printer, AlertCircle, X } from 'lucide-react';
import axios from 'axios';

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
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import { useState } from 'react';
import AppointmentFormModal from '@features/EmployeeManagement/Admin/Plantilla/components/AppointmentFormModal';
import Form9Modal from '@features/EmployeeManagement/Admin/Plantilla/components/Form9Modal';
import { useForm9 } from '@features/EmployeeManagement/Admin/Plantilla/hooks/useForm9';
import { 
  exportForm9ToPDF, 
  exportForm9ToExcel, 
  type Form9Header,
  type Form9Position 
} from '@/utils/cscFormExports';

import PSIPOPModal from '@features/EmployeeManagement/Admin/Plantilla/components/PSIPOPModal';
import Combobox from '@/components/Custom/Combobox';

import { Position } from '@/api/plantillaApi';

const ComplianceReportsDashboard: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalReportId, setModalReportId] = useState<string | null>(null);
    const [positions, setPositions] = useState<Position[]>([]);
    const [selectedPositionId, setSelectedPositionId] = useState<string>('');
    const [loadingPositions, setLoadingPositions] = useState(false);
    
    // New state for Complex Modal
    const [isAppointmentFormOpen, setIsAppointmentFormOpen] = useState(false);
    const [selectedAppointmentPosition, setSelectedAppointmentPosition] = useState<Position | null>(null);
    
    // PSI-POP Modal State (New WYSIWYG)
    const [isPSIPOPModalOpen, setIsPSIPOPModalOpen] = useState(false);
    const [psipopPositions, setPsipopPositions] = useState<Position[]>([]); 
    const [loadingPsipop, setLoadingPsipop] = useState(false);
    
    // Form 9 Hook (Zustand + React Query)
    const { openForm9Modal } = useForm9();

    const generatePDF = (reportId: string, data: unknown[], meta: Record<string, unknown>) => {
        // ... (PDF Generation Logic - Unchanged) ...
        const doc = new jsPDF();
        
        // Header
        doc.setFontSize(10);
        doc.text("Republic of the Philippines", 105, 15, { align: "center" });
        doc.text("Province of Bulacan", 105, 20, { align: "center" });
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("CITY GOVERNMENT OF LIGAO", 105, 28, { align: "center" });
        
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.text((meta.formName as string) || (meta.form_name as string) || "Official Report", 105, 40, { align: "center" });
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text((meta.title as string) || "Report Document", 105, 48, { align: "center" });
        
        doc.line(20, 55, 190, 55);
        
        // Content based on ID
        if (reportId === 'form9' || reportId === 'rai' || reportId === 'psipop') {
             const tableColumn = Object.keys(data[0] || {}).map(key => key.toUpperCase().replace(/_/g, " "));
             const tableRows = (data as Record<string, unknown>[]).map((row) => Object.values(row).map(v => String(v ?? '')));
             
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
             Object.entries(data as unknown as Record<string, unknown>).forEach(([key, value]) => {
                 doc.setFontSize(10);
                 doc.setFont("helvetica", "bold");
                 doc.text(`${key.replace(/_/g, " ").toUpperCase()}:`, 20, y);
                 doc.setFont("helvetica", "normal");
                 doc.text(`${String(value || "N/A")}`, 80, y);
                 y += 10;
             });
        }
        
        // Save/Open
        const pdfBlob = doc.output('blob');
        const url = URL.createObjectURL(pdfBlob);
        window.open(url, '_blank');
    };

    const handlePreviewClick = async (reportId: string) => {
        if (reportId === 'psipop') {
            const toastId = toast.loading("Loading PSI-POP data...");
            try {
                setLoadingPsipop(true);
                const response = await plantillaApi.getPositions({});
                if (response.data && response.data.positions) {
                     setPsipopPositions(response.data.positions);
                     setIsPSIPOPModalOpen(true);
                     toast.dismiss(toastId);
                } else {
                     toast.error("No positions found", { id: toastId });
                }
            } catch (err) {
                console.error(err);
                toast.error("Failed to load positions", { id: toastId });
            } finally {
                setLoadingPsipop(false);
            }
            return;
        }

        // CS Form No. 9 - Request for Publication of Vacant Positions
        if (reportId === 'form9') {
            openForm9Modal();
            return;
        }

        if (reportId === 'form33') {
            setModalReportId(reportId);
            setIsModalOpen(true);
            setLoadingPositions(true);
            try {
                const response = await plantillaApi.getPositions({});
                // Filter only filled positions for appointments
                const filled = response.data.positions.filter((p: Position) => p.incumbentId);
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

    const handleDownload = async (reportId: string, type: 'pdf' | 'excel', params: Record<string, unknown> = {}) => {
        try {
            toast.loading("Generating report...");
            
            // Form 9 - Use official CSC form layout
            if (reportId === 'form9') {
                const response = await reportsApi.getReportData('form9', params);
                toast.dismiss();
                
                if (!response.success || !response.data || response.data.length === 0) {
                    toast.error("No vacant positions found to export");
                    return;
                }
                
                // Transform API data to Form9Position format
                const positionsData: Form9Position[] = response.data.map((pos: Record<string, unknown>, idx: number) => ({
                    no: idx + 1,
                    positionTitle: pos.positionTitle || pos.positionTitle || '',
                    plantillaItemNo: pos.itemNumber || pos.itemNumber || '',
                    salaryGrade: (pos.salaryGrade || pos.salaryGrade || '').toString(),
                    monthlySalary: (pos.monthlySalary || pos.monthlySalary || '').toLocaleString(),
                    education: pos.education || '',
                    training: (pos.training !== undefined) ? `${pos.training} hours` : 'None required',
                    experience: (pos.experience !== undefined) ? `${pos.experience} years` : 'None required',
                    eligibility: pos.eligibility || '',
                    competency: pos.competency || '',
                    placeOfAssignment: pos.assignment || pos.department || ''
                }));
                
                const header: Form9Header = {
                    agencyName: 'CGO MEYCAUAYAN, BULACAN',
                    signatoryName: 'JUDITH S. GUEVARRA, MPA',
                    signatoryTitle: 'City Human Resource Management Officer',
                    date: new Date().toLocaleDateString('en-PH'),
                    deadlineDate: '',
                    officeAddress: 'City Govt. of Meycauayan, Saluysoy, City of Meycauayan',
                    contactInfo: '(044) 840-3020 local 501 / chrmo.meycjobs.csc@gmail.cc'
                };
                
                if (type === 'pdf') {
                    exportForm9ToPDF(header, positionsData);
                } else {
                    await exportForm9ToExcel(header, positionsData);
                }
                toast.success(`Form 9 exported to ${type.toUpperCase()}`);
                return;
            }
            
            // PSI-POP - Open Modal for both PDF/Excel (User checks preview first)
            if (reportId === 'psipop') {
                handlePreviewClick('psipop');
                return;
            }
            
            // Form 33 - Requires position selection first (opens modal just like Preview button)
            if (reportId === 'form33') {
                toast.dismiss();
                setModalReportId(reportId);
                setIsModalOpen(true);
                setLoadingPositions(true);
                try {
                    const response = await plantillaApi.getPositions({});
                    const filled = response.data.positions.filter((p: Position) => p.incumbentId);
                    setPositions(filled);
                } catch (err) {
                    toast.error("Failed to load positions");
                    setIsModalOpen(false);
                } finally {
                    setLoadingPositions(false);
                }
                return;
            }
            
            // Form 33 and other reports - Use generic export
            const response = await reportsApi.getReportData(reportId, params);
            
            if (response.success && response.data) {
                toast.dismiss();
                
                if (type === 'pdf') {
                    generatePDF(reportId, response.data, response.meta);
                    toast.success("PDF generated!");
                } else {
                    // Generic Excel Export
                    const data = Array.isArray(response.data) ? response.data : [response.data];
                    if (data.length === 0) {
                        toast.error("No data to export");
                        return;
                    }
                    
                    const ws = XLSX.utils.json_to_sheet(data);
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, response.meta?.formName || response.meta?.form_name || 'Report');
                    const filename = `${response.meta?.formName || response.meta?.form_name || reportId}_${new Date().toISOString().split('T')[0]}.xlsx`;
                    XLSX.writeFile(wb, filename);
                    toast.success(`Exported to ${filename}`);
                }
            } else {
                throw new Error(response.message || "No data returned");
            }
        } catch (error: unknown) {
            toast.dismiss();
            console.error("Failed to generate report:", error);
            const msg = axios.isAxiosError(error) 
                ? error.response?.data?.message || error.message 
                : (error instanceof Error ? error.message : "Failed to generate");
            toast.error(msg);
        }
    };

    const confirmSelection = () => {
        if (!selectedPositionId) {
            toast.error("Please select a position");
            return;
        }
        
        // Find the full position object (Handle string/number mismatch)
        const pos = positions.find(p => String(p.id) === String(selectedPositionId));
        
        if (pos) {
            // Close the selection modal
            setIsModalOpen(false);
            // Open the OFFICIAL Complex Form Modal
            setSelectedAppointmentPosition(pos);
            setIsAppointmentFormOpen(true);
        } else {
            console.error("Position not found logic error", { selectedPositionId, positions });
            toast.error("Error: Could not find selected position details.");
        }
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
                        className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-300 group"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className={`w-8 h-8 rounded-lg shadow-sm group-hover:scale-110 transition-transform ${
                                report.id === 'form9' ? 'bg-blue-500' :
                                report.id === 'form33' ? 'bg-emerald-500' :
                                'bg-amber-500'
                            }`}></div>
                            <span className="px-2.5 py-1 bg-gray-100 text-gray-500 text-[10px] font-bold rounded-full uppercase tracking-widest">
                                {report.frequency}
                            </span>
                        </div>
                        
                        <h4 className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">
                            {report.title}
                        </h4>
                        <p className="text-gray-500 text-[11px] mb-4 h-8 line-clamp-2 leading-relaxed">
                            {report.description}
                        </p>

                        <div className="flex gap-2 pt-3 border-t border-gray-100">
                            <button 
                                onClick={() => handlePreviewClick(report.id)}
                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 text-gray-700 hover:text-gray-900 rounded-lg text-xs font-bold transition-all active:scale-95 shadow-sm"
                            >
                                <Printer size={14} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                                Preview
                            </button>
                            <button 
                                onClick={() => handleDownload(report.id, 'excel')}
                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 text-gray-700 hover:text-gray-900 rounded-lg text-xs font-bold transition-all active:scale-95 shadow-sm"
                                title="Export to Excel"
                            >
                                <Download size={14} className="text-gray-400 group-hover:text-green-500 transition-colors" />
                                Excel
                            </button>
                            <button 
                                onClick={() => handleDownload(report.id, 'pdf')}
                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 text-gray-700 hover:text-gray-900 rounded-lg text-xs font-bold transition-all active:scale-95 shadow-sm"
                                title="Export to PDF"
                            >
                                <Download size={14} className="text-gray-400 group-hover:text-red-500 transition-colors" />
                                PDF
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Selection Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in">
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
                                <Combobox
                                    options={positions.map((p) => ({ 
                                        value: String(p.id), 
                                        label: `${p.positionTitle} - ${p.incumbentName || 'Unknown'} (${p.itemNumber})` 
                                    }))}
                                    value={selectedPositionId}
                                    onChange={(val) => setSelectedPositionId(val)}
                                    placeholder="Select employee/position"
                                />
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
                                    Generate Form
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Official Appointment Form Modal (Complex Layout) */}
            <AppointmentFormModal 
                isOpen={isAppointmentFormOpen} 
                onClose={() => setIsAppointmentFormOpen(false)} 
                position={selectedAppointmentPosition} 
            />

            {/* CS Form No. 9 Modal - State managed by Zustand */}
            <Form9Modal />

            {/* PSI-POP Modal (New WYSIWYG) */}
            <PSIPOPModal 
                isOpen={isPSIPOPModalOpen}
                onClose={() => setIsPSIPOPModalOpen(false)}
                positions={psipopPositions}
            />


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
