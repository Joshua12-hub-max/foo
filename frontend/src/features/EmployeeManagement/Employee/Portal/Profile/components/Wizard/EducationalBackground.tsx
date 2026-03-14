import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pdsApi, PDSEducation } from '@/api/pdsApi';
import { Plus, Trash2, Save, GraduationCap } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface EducationalBackgroundProps {
    employeeId?: number;
}

const LEVELS = ['Elementary', 'Secondary', 'Vocational', 'College', 'Graduate Studies'] as const;

export const EducationalBackground: React.FC<EducationalBackgroundProps> = ({ employeeId }) => {
    const queryClient = useQueryClient();
    const [educationData, setEducationData] = useState<PDSEducation[]>([]);

    // Fetch Data
    const { data: apiData, isLoading } = useQuery({
        queryKey: ['pds-education', employeeId],
        queryFn: async () => {
            const res = await pdsApi.getSection<PDSEducation>('education', employeeId);
            return res.data.data;
        }
    });

    // Populate State on Load
    useEffect(() => {
        if (apiData) {
            setEducationData(apiData);
        }
    }, [apiData]);

    // Mutation
    const saveMutation = useMutation({
        mutationFn: async (items: PDSEducation[]) => {
            return await pdsApi.updateSection('education', items, employeeId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pds-education', employeeId] });
            toast.success('Educational background updated successfully');
        },
        onError: (err: Error) => {
            toast.error(err.message || 'Failed to update');
        }
    });

    const handleSave = () => {
        saveMutation.mutate(educationData);
    };

    const addEducation = () => {
        setEducationData([...educationData, { 
            level: 'College', 
            schoolName: '', 
            degreeCourse: '', 
            yearGraduated: undefined,
            dateFrom: undefined,
            dateTo: undefined,
            unitsEarned: '',
            honors: ''
        }]);
    };

    const removeEducation = (index: number) => {
        const newData = [...educationData];
        newData.splice(index, 1);
        setEducationData(newData);
    };

    const updateEducation = (index: number, field: keyof PDSEducation, value: any) => {
        const newData = [...educationData];
        newData[index] = { ...newData[index], [field]: value };
        setEducationData(newData);
    };

    if (isLoading) return <div className="p-8 text-center">Loading educational data...</div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Actions */}
            <div className="flex justify-end sticky top-0 bg-white/80 backdrop-blur-sm z-10 py-4 border-b">
                <button 
                    onClick={handleSave} 
                    disabled={saveMutation.isPending}
                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium disabled:opacity-50"
                >
                    <Save size={18} />
                    {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center mb-6 border-b border-slate-200 pb-2">
                   <div className="flex items-center gap-2">
                       <GraduationCap className="text-blue-600" size={24} />
                       <h3 className="text-lg font-bold text-slate-800">Educational Background</h3>
                   </div>
                   <button onClick={addEducation} className="text-sm flex items-center gap-1 text-blue-600 hover:text-blue-700 font-semibold bg-white px-3 py-1.5 rounded-md border border-blue-100 shadow-sm transition-all">
                       <Plus size={16} /> Add Education
                   </button>
                </div>
                
                <div className="space-y-6">
                    {educationData.length === 0 && (
                        <div className="text-center py-10 bg-white rounded-lg border border-dashed border-slate-300">
                            <GraduationCap className="mx-auto text-slate-300 mb-2" size={48} />
                            <p className="text-slate-400 italic">No educational records added.</p>
                            <button onClick={addEducation} className="mt-2 text-sm text-blue-600 font-semibold hover:underline">
                                Click here to add your first record
                            </button>
                        </div>
                    )}
                    
                    {educationData.map((edu, idx) => (
                        <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative group hover:border-blue-200 transition-colors">
                            <button 
                                onClick={() => removeEducation(idx)} 
                                className="absolute -top-2 -right-2 bg-white text-red-500 hover:bg-red-50 p-1.5 rounded-full border border-red-100 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Remove this record"
                            >
                                <Trash2 size={16} />
                            </button>

                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                {/* Level and School Name */}
                                <div className="md:col-span-3">
                                    <label className="text-[10px] font-bold text-slate-400 tracking-wider">Level</label>
                                    <select 
                                        className="w-full mt-1 p-2 text-sm border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                        value={edu.level} 
                                        onChange={e => updateEducation(idx, 'level', e.target.value)}
                                    >
                                        {LEVELS.map(level => (
                                            <option key={level} value={level}>{level}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="md:col-span-9">
                                    <label className="text-[10px] font-bold text-slate-400 tracking-wider">Name of School</label>
                                    <input 
                                        type="text" 
                                        placeholder="Full Name of School (Write in full)"
                                        className="w-full mt-1 p-2 text-sm border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" 
                                        value={edu.schoolName} 
                                        onChange={e => updateEducation(idx, 'schoolName', e.target.value)} 
                                    />
                                </div>

                                {/* Degree/Course and Year Graduated */}
                                <div className="md:col-span-8">
                                    <label className="text-[10px] font-bold text-slate-400 tracking-wider">Basic Education / Degree / Course</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. Bachelor of Science in Information Technology"
                                        className="w-full mt-1 p-2 text-sm border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" 
                                        value={edu.degreeCourse || ''} 
                                        onChange={e => updateEducation(idx, 'degreeCourse', e.target.value)} 
                                    />
                                </div>
                                <div className="md:col-span-4">
                                    <label className="text-[10px] font-bold text-slate-400 tracking-wider">Year Graduated</label>
                                    <input 
                                        type="number" 
                                        placeholder="YYYY"
                                        className="w-full mt-1 p-2 text-sm border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" 
                                        value={edu.yearGraduated || ''} 
                                        onChange={e => updateEducation(idx, 'yearGraduated', e.target.value ? parseInt(e.target.value) : undefined)} 
                                    />
                                </div>

                                {/* Period of Attendance */}
                                <div className="md:col-span-3">
                                    <label className="text-[10px] font-bold text-slate-400 tracking-wider">From (Year)</label>
                                    <input 
                                        type="number" 
                                        placeholder="YYYY"
                                        className="w-full mt-1 p-2 text-sm border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" 
                                        value={edu.dateFrom || ''} 
                                        onChange={e => updateEducation(idx, 'dateFrom', e.target.value ? parseInt(e.target.value) : undefined)} 
                                    />
                                </div>
                                <div className="md:col-span-3">
                                    <label className="text-[10px] font-bold text-slate-400 tracking-wider">To (Year)</label>
                                    <input 
                                        type="number" 
                                        placeholder="YYYY"
                                        className="w-full mt-1 p-2 text-sm border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" 
                                        value={edu.dateTo || ''} 
                                        onChange={e => updateEducation(idx, 'dateTo', e.target.value ? parseInt(e.target.value) : undefined)} 
                                    />
                                </div>

                                {/* Highest Level / Units Earned and Honors */}
                                <div className="md:col-span-3">
                                    <label className="text-[10px] font-bold text-slate-400 tracking-wider">Highest Level / Units Earned</label>
                                    <input 
                                        type="text" 
                                        placeholder="If not graduated"
                                        className="w-full mt-1 p-2 text-sm border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" 
                                        value={edu.unitsEarned || ''} 
                                        onChange={e => updateEducation(idx, 'unitsEarned', e.target.value)} 
                                    />
                                </div>
                                <div className="md:col-span-3">
                                    <label className="text-[10px] font-bold text-slate-400 tracking-wider">Scholarship / Honors</label>
                                    <input 
                                        type="text" 
                                        placeholder="Academic Honors received"
                                        className="w-full mt-1 p-2 text-sm border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" 
                                        value={edu.honors || ''} 
                                        onChange={e => updateEducation(idx, 'honors', e.target.value)} 
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
