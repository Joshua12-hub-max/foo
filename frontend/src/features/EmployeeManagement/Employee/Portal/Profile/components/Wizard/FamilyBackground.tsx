import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pdsApi } from '@/api/pdsApi';
import { Plus, Trash2, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface FamilyMember {
    id?: number;
    relationType: 'Spouse' | 'Father' | 'Mother' | 'Child';
    lastName: string;
    firstName: string;
    middleName: string;
    name_extension?: string;
    occupation?: string;
    employer?: string;
    business_address?: string;
    telephone_no?: string;
    date_of_birth?: string;
}

interface FamilyBackgroundProps {
    employeeId?: number;
}

export const FamilyBackground: React.FC<FamilyBackgroundProps> = ({ employeeId }) => {
    const queryClient = useQueryClient();
    
    // State management
    const [spouse, setSpouse] = useState<FamilyMember>({ relationType: 'Spouse', lastName: '', firstName: '', middleName: '' });
    const [father, setFather] = useState<FamilyMember>({ relationType: 'Father', lastName: '', firstName: '', middleName: '' });
    const [mother, setMother] = useState<FamilyMember>({ relationType: 'Mother', lastName: '', firstName: '', middleName: '' });
    const [childrenData, setChildrenData] = useState<FamilyMember[]>([]);

    // Fetch Data
    const { data: apiData, isLoading } = useQuery({
        queryKey: ['pds-family', employeeId],
        queryFn: async () => {
            const res = await pdsApi.getSection<FamilyMember>('family', employeeId);
            return res.data.data;
        }
    });

    // Populate State on Load
    useEffect(() => {
        if (apiData) {
            const s = apiData.find(m => m.relationType === 'Spouse');
            if (s) setSpouse(s);

            const f = apiData.find(m => m.relationType === 'Father');
            if (f) setFather(f);

            const m = apiData.find(m => m.relationType === 'Mother');
            if (m) setMother(m);

            const c = apiData.filter(m => m.relationType === 'Child');
            setChildrenData(c);
        }
    }, [apiData]);

    // Mutation
    const saveMutation = useMutation({
        mutationFn: async (items: FamilyMember[]) => {
            return await pdsApi.updateSection('family', items, employeeId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pds-family', employeeId] });
            toast.success('Family background updated successfully');
        },
        onError: (err: Error) => {
            toast.error(err.message || 'Failed to update');
        }
    });

    const handleSave = () => {
        // Collect all items
        // Filter out empty forms if necessary, but Sposue/Parents are standard fields often required or explicitly N/A.
        // For now, we save everything.
        const items = [
            spouse,
            father,
            mother,
            ...childrenData
        ];
        
        // Clean items (optional, e.g. remove empty strings if backend dislikes them, but our schema allows nulls/varchars)
        saveMutation.mutate(items);
    };

    const addChild = () => {
        setChildrenData([...childrenData, { 
            relationType: 'Child', 
            lastName: '', 
            firstName: '', 
            middleName: '',
            date_of_birth: '' 
        }]);
    };

    const removeChild = (index: number) => {
        const newChildren = [...childrenData];
        newChildren.splice(index, 1);
        setChildrenData(newChildren);
    };

    const updateChild = (index: number, field: keyof FamilyMember, value: string) => {
        const newChildren = [...childrenData];
        newChildren[index] = { ...newChildren[index], [field]: value };
        setChildrenData(newChildren);
    };

    if (isLoading) return <div className="p-8 text-center">Loading family data...</div>;

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

            {/* Spouse Section */}
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">Spouse's Name</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase">Surname</label>
                        <input type="text" className="w-full mt-1 p-2 border rounded" 
                            value={spouse.lastName || ''} onChange={e => setSpouse({...spouse, lastName: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase">First Name</label>
                        <input type="text" className="w-full mt-1 p-2 border rounded" 
                            value={spouse.firstName || ''} onChange={e => setSpouse({...spouse, firstName: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase">Middle Name</label>
                        <input type="text" className="w-full mt-1 p-2 border rounded" 
                            value={spouse.middleName || ''} onChange={e => setSpouse({...spouse, middleName: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase">Extension (Jr/Sr)</label>
                        <input type="text" className="w-full mt-1 p-2 border rounded" 
                            value={spouse.name_extension || ''} onChange={e => setSpouse({...spouse, name_extension: e.target.value})} />
                    </div>
                    
                    {/* Additional Spouse Fields */}
                    <div className="md:col-span-2">
                        <label className="text-xs font-semibold text-slate-500 uppercase">Occupation</label>
                        <input type="text" className="w-full mt-1 p-2 border rounded" 
                            value={spouse.occupation || ''} onChange={e => setSpouse({...spouse, occupation: e.target.value})} />
                    </div>
                    <div className="md:col-span-2">
                        <label className="text-xs font-semibold text-slate-500 uppercase">Employer/Business Name</label>
                        <input type="text" className="w-full mt-1 p-2 border rounded" 
                            value={spouse.employer || ''} onChange={e => setSpouse({...spouse, employer: e.target.value})} />
                    </div>
                    <div className="md:col-span-2">
                        <label className="text-xs font-semibold text-slate-500 uppercase">Business Address</label>
                        <input type="text" className="w-full mt-1 p-2 border rounded" 
                            value={spouse.business_address || ''} onChange={e => setSpouse({...spouse, business_address: e.target.value})} />
                    </div>
                     <div className="md:col-span-2">
                        <label className="text-xs font-semibold text-slate-500 uppercase">Telephone No.</label>
                        <input type="text" className="w-full mt-1 p-2 border rounded" 
                            value={spouse.telephone_no || ''} onChange={e => setSpouse({...spouse, telephone_no: e.target.value})} />
                    </div>
                </div>
            </div>

            {/* Parents Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Father */}
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">Father's Name</h3>
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase">Surname</label>
                            <input type="text" className="w-full mt-1 p-2 border rounded" 
                                value={father.lastName || ''} onChange={e => setFather({...father, lastName: e.target.value})} />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase">First Name</label>
                            <input type="text" className="w-full mt-1 p-2 border rounded" 
                                value={father.firstName || ''} onChange={e => setFather({...father, firstName: e.target.value})} />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase">Middle Name</label>
                                <input type="text" className="w-full mt-1 p-2 border rounded" 
                                    value={father.middleName || ''} onChange={e => setFather({...father, middleName: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase">Ext</label>
                                <input type="text" className="w-full mt-1 p-2 border rounded" 
                                    value={father.name_extension || ''} onChange={e => setFather({...father, name_extension: e.target.value})} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mother */}
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">Mother's Maiden Name</h3>
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase">Surname</label>
                            <input type="text" className="w-full mt-1 p-2 border rounded" 
                                value={mother.lastName || ''} onChange={e => setMother({...mother, lastName: e.target.value})} />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase">First Name</label>
                            <input type="text" className="w-full mt-1 p-2 border rounded" 
                                value={mother.firstName || ''} onChange={e => setMother({...mother, firstName: e.target.value})} />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase">Middle Name</label>
                            <input type="text" className="w-full mt-1 p-2 border rounded" 
                                value={mother.middleName || ''} onChange={e => setMother({...mother, middleName: e.target.value})} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Children Section */}
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center mb-4 border-b border-slate-200 pb-2">
                   <h3 className="text-lg font-bold text-slate-800">Children</h3>
                   <button onClick={addChild} className="text-sm flex items-center gap-1 text-blue-600 hover:text-blue-700 font-semibold">
                       <Plus size={16} /> Add Child
                   </button>
                </div>
                
                <div className="space-y-4">
                    {childrenData.length === 0 && <p className="text-gray-400 italic text-center py-4">No children added.</p>}
                    
                    {childrenData.map((child, idx) => (
                        <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                            <div className="md:col-span-4">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Full Name of Child</label>
                                <input type="text" placeholder="Last, First Middle" className="w-full p-2 text-sm border rounded" 
                                    value={child.lastName} onChange={e => updateChild(idx, 'lastName', e.target.value)} />
                                {/* Note: PDS usually just asks for Name, but schema has split fields. 
                                    I'll map lastName input to single Name field in UI or split inputs? 
                                    Schema has last, first, middle. UI "Name of Children" usually one line.
                                    Let's use just First/Last inputs or assume simpler UI.
                                    Wait, my schema HAS lastName, firstName etc. 
                                    I'll stick to Last Name input being "Name" for now visually or add more inputs.
                                    Let's add multiple inputs for correctness.
                                 */}
                            </div>
                            <div className="md:col-span-3">
                                 <input type="text" placeholder="First Name" className="w-full p-2 text-sm border rounded" 
                                    value={child.firstName} onChange={e => updateChild(idx, 'firstName', e.target.value)} />
                            </div>
                             <div className="md:col-span-2">
                                 <input type="text" placeholder="Middle" className="w-full p-2 text-sm border rounded" 
                                    value={child.middleName} onChange={e => updateChild(idx, 'middleName', e.target.value)} />
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Date of Birth</label>
                                <input type="date" className="w-full p-2 text-sm border rounded" 
                                    value={child.date_of_birth ? child.date_of_birth.substring(0, 10) : ''} 
                                    onChange={e => updateChild(idx, 'date_of_birth', e.target.value)} />
                            </div>
                            <div className="md:col-span-1 flex justify-center pb-2">
                                <button onClick={() => removeChild(idx)} className="text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
