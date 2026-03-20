import { type Tranche, plantillaApi } from '@/api/plantillaApi';
import React, { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, X, AlertCircle, HelpCircle, ArrowRight, FileSpreadsheet, Plus, CornerUpLeft } from 'lucide-react';
import ExcelJS from 'exceljs';
import Combobox from '@/components/Custom/Combobox';

interface SalaryUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    trancheId: number;
    setTrancheId: (id: number) => void;
    tranches: Tranche[];
    onSuccess: () => void;
}

interface ParsedSalaryRow {
    salaryGrade: number;
    step: number;
    monthlySalary: number;
}

// ... imports and interfaces ...

export const SalaryUploadModal: React.FC<SalaryUploadModalProps> = ({ 
    isOpen, 
    onClose, 
    trancheId, 
    setTrancheId,
    tranches,
    onSuccess 
}) => {
    const queryClient = useQueryClient();
    const [mode, setMode] = useState<'existing' | 'new'>('existing');
    const [file, setFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<ParsedSalaryRow[]>([]);
    const [parseError, setParseError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    
    // New Tranche Form
    const [newTrancheName, setNewTrancheName] = useState('');
    const [newTrancheNum, setNewTrancheNum] = useState<number>(tranches.length + 1);
    const [newCircular, setNewCircular] = useState('');
    const [newEffectiveDate, setNewEffectiveDate] = useState(new Date().toISOString().split('T')[0]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const createTrancheMutation = useMutation({
        mutationFn: (data: { name: string; trancheNumber: number; circularNumber: string; effectiveDate: string }) =>
            plantillaApi.createTranche(data),
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: ['tranches'] });
            return response.data.tranche;
        }
    });

    const uploadMutation = useMutation({
        mutationFn: (data: { tranche: number; salaryData: ParsedSalaryRow[] }) => 
            plantillaApi.uploadSalarySchedule(data),
        onSuccess: () => {
            onSuccess();
            handleClose();
        }
    });

    const handleClose = () => {
        setFile(null);
        setParsedData([]);
        setParseError(null);
        setIsProcessing(false);
        setMode('existing');
        // Reset form
        setNewTrancheName('');
        setNewCircular('');
        onClose();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        // ... same file handling logic ...
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setParseError(null);
        setIsProcessing(true);
        setParsedData([]); 

        try {
            await parseFile(selectedFile);
        } catch (error) {
            console.error('File parsing error:', error);
            setParseError('Failed to parse file. Please ensure it matches the required format.');
            setParsedData([]);
        } finally {
            setIsProcessing(false);
        }
    };

    const parseFile = async (file: File) => {
        // ... same parse logic ...
        const buffer = await file.arrayBuffer();
        const workbook = new ExcelJS.Workbook();
        
        try {
            await workbook.xlsx.load(buffer);
        } catch (e) {
             throw new Error('Invalid file format. Please upload an Excel file.');
        }

        const worksheet = workbook.getWorksheet(1);
        if (!worksheet) throw new Error('No worksheet found');

        const rows: ParsedSalaryRow[] = [];
        
        worksheet.eachRow((row, rowNumber) => {
            const firstCell = row.getCell(1).value;
            if (typeof firstCell === 'string' && firstCell.toLowerCase().includes('grade')) return;

            const gradeVal = row.getCell(1).value;
            const grade = typeof gradeVal === 'object' ? Number((gradeVal as unknown as { result?: number }).result || 0) : Number(gradeVal);

            if (!grade || isNaN(grade)) return; 

            // Dynamically parse all steps present in the row
            // Column 1 is Grade, Step 1 starts at Column 2
            let step = 1;
            while (true) {
                const salaryVal = row.getCell(step + 1).value;
                if (salaryVal === null || salaryVal === undefined || salaryVal === '') {
                    // Stop if no more salary data in this row
                    break;
                }

                let salary = 0;
                if (typeof salaryVal === 'number') {
                    salary = salaryVal;
                } else if (typeof salaryVal === 'string') {
                    salary = Number(salaryVal.replace(/[^0-9.]/g, ''));
                } else if (typeof salaryVal === 'object' && salaryVal !== null) {
                    // @ts-ignore
                    salary = Number(salaryVal.result || 0);
                }

                if (salary > 0) {
                    rows.push({
                        salaryGrade: grade,
                        step: step,
                        monthlySalary: salary
                    });
                }
                
                step++;
                if (step > 32) break; // Sanity limit for steps
            }
        });

        if (rows.length === 0) {
            setParseError('No valid salary data found. Please check column format: [Grade, Step 1, Step 2...]');
        } else {
            setParsedData(rows);
        }
    };

    const handleSubmit = async () => {
        if (parsedData.length === 0) return;
        
        try {
            let targetTrancheId = trancheId;

            if (mode === 'new') {
                if (!newTrancheName || !newTrancheNum || !newCircular) {
                    alert('Please fill in all tranche details');
                    return;
                }
                const newTrancheRes = await createTrancheMutation.mutateAsync({
                    name: newTrancheName,
                    trancheNumber: newTrancheNum,
                    circularNumber: newCircular,
                    effectiveDate: newEffectiveDate
                });
                targetTrancheId = newTrancheRes.data.tranche.trancheNumber;
                // Update parent state so UI switches to this new tranche
                setTrancheId(targetTrancheId);
            }

            await uploadMutation.mutateAsync({
                tranche: targetTrancheId,
                salaryData: parsedData
            });
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Failed to upload salary data. Check console for details.');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 transition-all">
            <div 
                className="fixed inset-0 bg-black/50" 
                onClick={handleClose}
                aria-hidden="true"
            />
            <div className="bg-white rounded-xl w-full max-w-md shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-200 z-10 relative flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-white z-10 w-full">
                    <div className="w-full">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                           <Upload size={20} className="text-gray-900" />
                           Upload Salary Schedule
                        </h2>
                        
                        {/* Tranche Selector / Creator */}
                        <div className="mt-3">
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Target Tranche</label>
                                <button 
                                    onClick={() => setMode(mode === 'existing' ? 'new' : 'existing')}
                                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                                >
                                    {mode === 'existing' ? (
                                        <>
                                            <Plus size={10} />
                                            Create New
                                        </>
                                    ) : (
                                        <>
                                            <CornerUpLeft size={10} />
                                            Select Existing
                                        </>
                                    )}
                                </button>
                            </div>
                            
                            {mode === 'existing' ? (
                                <Combobox
                                    options={tranches.map(t => ({ 
                                        value: String(t.trancheNumber), 
                                        label: `${t.name} (${t.circularNumber})` 
                                    }))}
                                    value={String(trancheId)}
                                    onChange={(val) => setTrancheId(Number(val))}
                                    placeholder="Select Tranche"
                                />
                            ) : (
                                <div className="space-y-2 bg-gray-50 p-3 rounded-lg border border-gray-200 animate-in fade-in slide-in-from-top-2">
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="col-span-2">
                                            <label className="text-[10px] text-gray-500 font-bold block mb-1">Tranche Name</label>
                                            <input 
                                                type="text" 
                                                placeholder="e.g. Fifth Tranche"
                                                value={newTrancheName}
                                                onChange={e => setNewTrancheName(e.target.value)}
                                                className="w-full text-xs border-gray-300 rounded px-2 py-1"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-gray-500 font-bold block mb-1">Tranche #</label>
                                            <input 
                                                type="number" 
                                                value={newTrancheNum}
                                                onChange={e => setNewTrancheNum(Number(e.target.value))}
                                                className="w-full text-xs border-gray-300 rounded px-2 py-1"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                            <label className="text-[10px] text-gray-500 font-bold block mb-1">Circular / Legal Basis</label>
                                            <input 
                                                type="text" 
                                                placeholder={`e.g. EO No. 99, s. ${new Date().getFullYear()}`}
                                                value={newCircular}
                                                onChange={e => setNewCircular(e.target.value)}
                                                className="w-full text-xs border-gray-300 rounded px-2 py-1"
                                            />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 self-start pt-1 pl-4">
                        <button
                            onClick={async () => {
                                const workbook = new ExcelJS.Workbook();
                                const worksheet = workbook.addWorksheet('Salary Schedule');
                                
                                worksheet.columns = [
                                    { header: 'Grade', key: 'grade', width: 10 },
                                    ...Array.from({ length: 8 }, (_, i) => ({ 
                                        header: `Step ${i + 1}`, 
                                        key: `step${i + 1}`, 
                                        width: 15 
                                    }))
                                ];

                                // Sample Row
                                const sampleRow: any = { grade: 1 };
                                for (let i = 1; i <= 8; i++) {
                                    sampleRow[`step${i}`] = 13000 + (i * 100);
                                }
                                worksheet.addRow(sampleRow);

                                const buffer = await workbook.xlsx.writeBuffer();
                                const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = 'salary_schedule_template.xlsx';
                                a.click();
                                window.URL.revokeObjectURL(url);
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium px-3 py-1.5 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1 shrink-0"
                        >
                            <FileSpreadsheet size={14} />
                            Template
                        </button>
                        <button 
                            onClick={handleClose} 
                            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>


                <div className="p-6 space-y-5 overflow-y-auto">
                    {/* File Upload Area */}
                    {!file ? (
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-50 rounded-xl p-8 text-center cursor-pointer transition-all group"
                        >
                            <input 
                                type="file" 
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept=".xlsx, .xls"
                                className="hidden" 
                            />
                            <div className="w-12 h-12 bg-gray-100 text-gray-600 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                                <FileSpreadsheet size={24} />
                            </div>
                            <h4 className="text-sm font-bold text-gray-900">Click to Upload Excel</h4>
                            <p className="text-xs text-gray-500 mt-1">or drag and drop here</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-green-100 text-green-600 rounded-md flex items-center justify-center">
                                        <FileSpreadsheet size={16} />
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="text-sm font-semibold text-gray-900 truncate max-w-[180px]">{file.name}</p>
                                        <p className="text-[10px] text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => {
                                        setFile(null);
                                        setParsedData([]);
                                        setParseError(null);
                                    }}
                                    className="text-gray-400 hover:text-red-500 p-1.5 transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                             {isProcessing && (
                                <div className="text-center py-4 text-gray-500 flex items-center justify-center gap-2 text-xs">
                                    <div className="w-3 h-3 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                                    Parsing file...
                                </div>
                            )}

                            {parseError && (
                                <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-xs flex items-start gap-2">
                                    <AlertCircle size={14} className="mt-0.5 shrink-0" />
                                    {parseError}
                                </div>
                            )}

                            {parsedData.length > 0 && !parseError && (
                                <div className="border border-gray-200 rounded-lg overflow-hidden">
                                     <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Preview</span>
                                        <span className="text-[10px] font-bold text-gray-700 bg-white border border-gray-200 px-2 py-0.5 rounded-full">{parsedData.length} records</span>
                                     </div>
                                     <div className="max-h-40 overflow-y-auto">
                                        <table className="w-full text-xs text-left">
                                            <thead className="bg-white text-gray-500 font-semibold sticky top-0 border-b border-gray-100">
                                                <tr>
                                                    <th className="px-3 py-2">Grade</th>
                                                    <th className="px-3 py-2">Step</th>
                                                    <th className="px-3 py-2 text-right">Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {parsedData.slice(0, 50).map((row, idx) => (
                                                    <tr key={idx}>
                                                        <td className="px-3 py-1.5 text-gray-900">SG {row.salaryGrade}</td>
                                                        <td className="px-3 py-1.5 text-gray-500">{row.step}</td>
                                                        <td className="px-3 py-1.5 text-right font-mono text-gray-700">
                                                            {row.monthlySalary.toLocaleString()}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                     </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Instructions - Compact */}
                    {!file && (
                        <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-3">
                            <div className="flex gap-2">
                                <HelpCircle className="text-blue-600 shrink-0 mt-0.5" size={14} />
                                <div className="text-xs text-blue-900">
                                    <p className="font-semibold">Format Guide</p>
                                    <p className="opacity-80 mt-1">Excel (.xlsx) with columns: <span className="font-mono bg-blue-100 px-1 rounded">Grade</span> then <span className="font-mono bg-blue-100 px-1 rounded">Step 1</span> to <span className="font-mono bg-blue-100 px-1 rounded">Step N</span>.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100 mt-auto">
                    <button 
                        onClick={handleClose}
                        disabled={uploadMutation.isPending}
                        className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSubmit}
                        disabled={parsedData.length === 0 || uploadMutation.isPending || isProcessing}
                        className="flex-1 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-bold transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {uploadMutation.isPending ? (
                            <>
                                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Uploading...
                            </>
                        ) : (
                            <>
                                Upload
                                <ArrowRight size={14} />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
