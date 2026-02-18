import React, { useState, useEffect } from 'react';
import { useUIStore } from '@/stores';
import { getPolicies, type InternalPolicy } from '@/api/policyApi';
import { Loader2 } from 'lucide-react';

interface Tab {
  id: string;
  label: string;
}

interface InternalPoliciesPageProps {
  hideHeader?: boolean;
}



const InternalPoliciesPage: React.FC<InternalPoliciesPageProps> = ({ hideHeader = false }) => {
    const sidebarOpen = useUIStore((state) => state.sidebarOpen);
    
    const [activeTab, setActiveTab] = useState<string>('hours');
    const [policies, setPolicies] = useState<InternalPolicy[]>([]);
    const [loading, setLoading] = useState(false);

    const tabs: Tab[] = [
        { id: 'hours', label: 'Working Hours' },
        { id: 'tardiness', label: 'Tardiness Rules' },
        { id: 'penalties', label: 'Violations & Penalties' },
        { id: 'csc', label: 'CSC Circulars' },
        { id: 'leave', label: 'Leave Policies' },
        { id: 'plantilla', label: 'Plantilla Policies' }
    ];

    useEffect(() => {
        const fetchPolicies = async () => {
            setLoading(true);
            try {
                const data = await getPolicies(activeTab);
                setPolicies(data.policies);
            } catch (error) {
                console.error('Failed to fetch policies:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchPolicies();
    }, [activeTab]);


    return (
        <div className={`flex flex-col bg-white rounded-2xl shadow-sm border border-gray-200 p-6 w-full overflow-hidden transition-all duration-300 animate-in fade-in duration-500 ${!sidebarOpen ? 'max-w-[1600px] xl:max-w-[88vw]' : 'max-w-[1400px] xl:max-w-[77vw]'}`}>
            
            {/* Header Section */}
            {!hideHeader && (
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-xl font-bold text-gray-800">Internal Policies</h1>
                    <p className="text-sm text-gray-500">Guidelines and regulations governing professional standards at CGM</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-[10px] font-bold uppercase tracking-wider border border-gray-200">
                        {policies.length > 0 && policies[0].versionLabel ? policies[0].versionLabel : 'Office Order 164-2025'}
                    </span>
                </div>
            </div>
            )}

            {/* Segmented Tab Navigation */}
            <div className="flex bg-gray-100/80 p-1 rounded-2xl mb-8 w-fit border border-gray-200/50">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 rounded-xl text-[11px] font-bold transition-all duration-300 ${
                            activeTab === tab.id
                                ? 'bg-white text-indigo-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
                    <p className="text-sm text-gray-400 font-medium">Loading official policies...</p>
                </div>
            ) : false /* policies.length > 0 */ ? (
                <div className="w-full animate-in fade-in duration-500">
                    {policies.map(policy => (
                        <div key={policy.id} className="prose prose-sm max-w-none prose-indigo">
                             <div dangerouslySetInnerHTML={{ __html: policy.content }} />
                        </div>
                    ))}
                </div>
            ) : (
                /* Fallback to original static content if database is empty */
                <div className="w-full h-full relative">

                    {activeTab === 'hours' && (
                        <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-300">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-1 space-y-6">
                                <section>
                                    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 border-l-4 border-indigo-500 pl-3">Legal Basis</h3>
                                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                        <p className="text-xs font-medium text-gray-600 leading-relaxed italic">
                                            Book V, Executive Order no. 292 Rule XVII Section 5
                                        </p>
                                    </div>
                                </section>
                                
                                <section>
                                    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 border-l-4 border-indigo-500 pl-3">Schedule Overview</h3>
                                    <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 space-y-4">
                                        <div className="flex justify-between items-center text-xs font-bold text-gray-700">
                                            <span>Daily Minimum</span>
                                            <span className="text-indigo-600">8 Hours</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs font-bold text-gray-700">
                                            <span>Weekly Total</span>
                                            <span className="text-indigo-600">40 Hours</span>
                                        </div>
                                        <div className="h-px bg-gray-200" />
                                        <p className="text-[11px] text-gray-500 leading-relaxed">
                                            Excludes lunch break. Must be observed with maximum regularity.
                                        </p>
                                    </div>
                                </section>
                            </div>

                            <div className="lg:col-span-2 space-y-8">
                                <section>
                                    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 border-l-4 border-indigo-500 pl-3">SOP & Working Hours</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="p-5 border border-gray-200 rounded-2xl bg-white shadow-sm">
                                            <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-3">General Rule (Standard Duties)</p>
                                            <div className="space-y-1">
                                                <p className="text-lg font-bold text-gray-800">08:00 AM — 12:00 NN</p>
                                                <p className="text-lg font-bold text-gray-800">01:00 PM — 05:00 PM</p>
                                            </div>
                                            <p className="text-[10px] font-medium text-gray-400 mt-3">Regular Work Week (Mon-Fri)</p>
                                        </div>
                                        <div className="p-5 border border-gray-200 rounded-2xl bg-white shadow-sm">
                                            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-3">Special Rule (Irregular Duties)</p>
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-bold text-gray-700">Option A</span>
                                                    <span className="text-xs text-gray-500">7h/day, 6d/week (42h)</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-bold text-gray-700">Option B</span>
                                                    <span className="text-xs text-gray-500">12h/day, 2d duty/2d off</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                <section>
                                    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 border-l-4 border-indigo-500 pl-3">Standard Protocols</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {[
                                            { title: "Time Tracking", desc: "Digital logging via official biometric machines." },
                                            { title: "Business Slips", desc: "Use Locator/Pass Slips for all movements outside." },
                                            { title: "Leave Filing", desc: "Regulars file via app; JO/COS notify supervisor." },
                                            { title: "Professionalism", desc: "Report on time; avoid unauthorized departures." }
                                        ].map((item, idx) => (
                                            <div key={idx} className="p-4 bg-gray-50/50 rounded-xl border border-gray-100">
                                                <div>
                                                    <h4 className="text-xs font-bold text-gray-800">{item.title}</h4>
                                                    <p className="text-[10px] text-gray-500 leading-tight mt-0.5">{item.desc}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'tardiness' && (
                    <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-300">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <section className="p-6 border border-gray-200 rounded-2xl bg-white shadow-sm h-full">
                                    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-6 border-l-4 border-indigo-500 pl-3">Definitions & Immediate Impact</h3>
                                    <div className="space-y-6">
                                        <div className="space-y-3">
                                            <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Tardiness (1–15 minutes late)</h4>
                                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                                <p className="text-xs text-gray-800 font-bold mb-2">Automatic Salary Deduction</p>
                                                <p className="text-[11px] text-gray-600 leading-relaxed">
                                                    Deductions start from <strong>1 minute late</strong>. Every incident is automatically deducted from the salary based on the exact minutes of lateness.
                                                </p>
                                            </div>
                                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                                <p className="text-xs text-gray-800 font-bold mb-2">Performance Evaluation</p>
                                                <p className="text-[11px] text-gray-600 leading-relaxed">
                                                    <strong>Every single late incident</strong> is recorded and directly affects the official Performance Evaluation of the employee.
                                                </p>
                                            </div>
                                        </div>
                                        <div className="h-px bg-gray-100" />
                                        <div className="space-y-1">
                                            <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Insufficient Leave Credits</h4>
                                            <p className="text-xs text-gray-700 font-bold mt-2">If an employee is late but has 0 (zero) leave credits:</p>
                                            <ul className="text-xs text-gray-700 font-bold space-y-2 list-disc pl-4 mt-2">
                                                <li>Mandatory salary deduction for the duration of lateness.</li>
                                                <li><strong>Force Leave</strong> is applied (deducted from future credits or treated as Leave Without Pay).</li>
                                            </ul>
                                        </div>
                                    </div>
                                </section>
                            </div>

                            <div className="space-y-6">
                                <section className="p-6 border border-gray-200 rounded-2xl bg-white shadow-sm h-full">
                                    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-6 border-l-4 border-rose-500 pl-3">Violation & Penalty Path</h3>
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 border border-gray-100 rounded-xl bg-gray-50/50">
                                                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Monthly Record</h4>
                                                <p className="text-[11px] font-bold text-gray-700">Late in 1 month is recorded as an official Violation.</p>
                                            </div>
                                            <div className="p-4 border border-rose-100 rounded-xl bg-rose-50/30">
                                                <h4 className="text-[10px] font-bold text-rose-600 uppercase tracking-widest mb-1">2-Month Rule</h4>
                                                <p className="text-[11px] font-bold text-gray-700">Late in 2 consecutive months triggers immediate Penalty.</p>
                                            </div>
                                        </div>

                                        <div className="bg-gray-900 text-white p-5 rounded-2xl relative overflow-hidden">
                                            <h4 className="text-[11px] font-bold text-rose-400 uppercase tracking-widest mb-3">Habitual Tardiness (10x / Month)</h4>
                                            <div className="space-y-3 relative z-10">
                                                {[
                                                    { step: "1", label: "Requirement", value: "Submission of Written Explanation" },
                                                    { step: "2", label: "Initial Warning", value: "Issuance of Warning Letter" },
                                                    { step: "3", label: "Escalation", value: "Violation → Performance Penalty" },
                                                    { step: "4", label: "Final Stage", value: "Final Penalty → Termination of Contract" }
                                                ].map((item, i) => (
                                                    <div key={i} className="flex gap-3 items-center border-b border-white/5 pb-2 last:border-0">
                                                        <span className="text-[10px] bg-white/10 w-5 h-5 rounded-full flex items-center justify-center shrink-0 font-bold">{item.step}</span>
                                                        <div className="flex-1">
                                                            <p className="text-[9px] text-gray-400 uppercase font-bold">{item.label}</p>
                                                            <p className="text-[11px] font-bold">{item.value}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'penalties' && (
                    <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-300">
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                            {[
                                {
                                    title: "Absenteeism / Loafing",
                                    desc: "Habitual absenteeism or loafing during office hours.",
                                    regular: [
                                        { label: "1st Offense", penalty: "6 months & 1 day suspension" },
                                        { label: "2nd Offense", penalty: "Dismissal from Service" }
                                    ],
                                    contract: [
                                        { label: "1st Offense", penalty: "Reprimand" },
                                        { label: "2nd Offense", penalty: "Termination" }
                                    ]
                                },
                                {
                                    title: "Habitual Tardiness",
                                    desc: "Failing to report for work on time habitually.",
                                    regular: [
                                        { label: "1st Offense", penalty: "Reprimand" },
                                        { label: "2nd Offense", penalty: "1-30 days suspension" },
                                        { label: "3rd Offense", penalty: "Dismissal from Service" }
                                    ],
                                    contract: [
                                        { label: "1st Offense", penalty: "Warning" },
                                        { label: "2nd Offense", penalty: "Reprimand" },
                                        { label: "3rd Offense", penalty: "Termination" }
                                    ]
                                },
                                {
                                    title: "Internal Office Rules",
                                    desc: "Violation of Reasonable Office Rules and Regulations.",
                                    regular: [
                                        { label: "1st Offense", penalty: "Reprimand" },
                                        { label: "2nd Offense", penalty: "1-30 days suspension" },
                                        { label: "3rd Offense", penalty: "Dismissal from Service" }
                                    ],
                                    contract: [
                                        { label: "1st Offense", penalty: "Warning" },
                                        { label: "2nd Offense", penalty: "Reprimand" },
                                        { label: "3rd Offense", penalty: "Termination" }
                                    ]
                                },
                                {
                                    title: "Private Practice/Business",
                                    desc: "Engaging in private practice or business without permission.",
                                    regular: [
                                        { label: "1st Offense", penalty: "Reprimand" },
                                        { label: "2nd Offense", penalty: "1-30 days suspension" },
                                        { label: "3rd Offense", penalty: "Dismissal from Service" }
                                    ],
                                    contract: [
                                        { label: "1st Offense", penalty: "Warning" },
                                        { label: "2nd Offense", penalty: "Reprimand" },
                                        { label: "3rd Offense", penalty: "Termination" }
                                    ]
                                }
                            ].map((category, idx) => (
                                <div key={idx} className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm bg-white">
                                    <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100">
                                        <h3 className="text-sm font-bold text-gray-800">{category.title}</h3>
                                        <p className="text-[10px] text-gray-500 italic mt-0.5">{category.desc}</p>
                                    </div>
                                    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-1">Regular Staff</h4>
                                            <div className="space-y-2">
                                                {category.regular.map((p, i) => (
                                                    <div key={i} className="flex justify-between items-center text-[11px]">
                                                        <span className="text-gray-500">{p.label}</span>
                                                        <span className="font-bold text-gray-800 text-right">{p.penalty}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-1">JO / COS Staff</h4>
                                            <div className="space-y-2">
                                                {category.contract.map((p, i) => (
                                                    <div key={i} className="flex justify-between items-center text-[11px]">
                                                        <span className="text-gray-500">{p.label}</span>
                                                        <span className="font-bold text-gray-800 text-right">{p.penalty}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Summary Offense Section */}
                        <div className="bg-gray-900 rounded-2xl p-8 text-white relative overflow-hidden">
                             <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 ">
                                <div className="md:col-span-1 border-r border-white/10 pr-6">
                                    <h3 className="text-lg font-bold mb-2">Prejudicial Conduct</h3>
                                    <p className="text-xs text-gray-400 leading-relaxed">
                                        Actions that damage the integrity of public service are treated with zero tolerance.
                                    </p>
                                </div>
                                <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Serious Offense</p>
                                        <div className="space-y-2">
                                            <div className="flex justify-between border-b border-white/5 pb-2">
                                                <span className="text-[11px] text-gray-400">Regular | 1st</span>
                                                <span className="text-[11px] font-bold">6m to 1y Suspension</span>
                                            </div>
                                            <div className="flex justify-between border-b border-white/5 pb-2">
                                                <span className="text-[11px] text-gray-400">Regular | 2nd</span>
                                                <span className="text-[11px] font-bold uppercase text-rose-400">Dismissal</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Simple Misconduct</p>
                                        <div className="space-y-2">
                                            <div className="flex justify-between border-b border-white/5 pb-2">
                                                <span className="text-[11px] text-gray-400">Regular | 1st</span>
                                                <span className="text-[11px] font-bold">1m to 6m Suspension</span>
                                            </div>
                                            <div className="flex justify-between border-b border-white/5 pb-2">
                                                <span className="text-[11px] text-gray-400">Contractual</span>
                                                <span className="text-[11px] font-bold">Reprimand / Term.</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                             </div>
                        </div>
                    </div>
                )}

                {activeTab === 'csc' && (
                    <div className="animate-in slide-in-from-bottom-2 duration-300 space-y-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="p-8 border border-gray-200 rounded-2xl bg-white shadow-sm space-y-6">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">MC No. 1, s. 2017</span>
                                    <h4 className="text-base font-bold text-gray-800">Habitual Lateness & Absence</h4>
                                </div>
                                <div className="space-y-4">
                                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                        <p className="text-[11px] font-bold text-gray-700 uppercase mb-2">Habitually Absent</p>
                                        <p className="text-xs text-gray-600 leading-relaxed">
                                            Unauthorized absences exceeds allowable 2.5 days monthly leave credit for at least:
                                        </p>
                                        <ul className="text-[11px] text-gray-500 font-bold mt-2 list-disc pl-4">
                                            <li>Three (3) months in a semester; or</li>
                                            <li>Three (3) consecutive months during the year.</li>
                                        </ul>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                        <p className="text-[11px] font-bold text-gray-700 uppercase mb-2">Habitual Tardiness</p>
                                        <p className="text-xs text-gray-600 leading-relaxed">
                                            Late regardless of minutes, ten (10) times a month for at least:
                                        </p>
                                        <ul className="text-[11px] text-gray-500 font-bold mt-2 list-disc pl-4">
                                            <li>Two (2) months in a semester; or</li>
                                            <li>Two (2) consecutive months during the year.</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 border border-gray-200 rounded-2xl bg-white shadow-sm space-y-6">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">MC No. 16, s. 2010</span>
                                    <h4 className="text-base font-bold text-gray-800">Policy on Undertime</h4>
                                </div>
                                <p className="text-xs text-gray-500 leading-relaxed italic border-l-2 border-gray-100 pl-4 py-1">
                                    "Regardless of the number of minutes/hours, ten (10) times a month for at least two (2) months in a semester or two (2) consecutive months during the year."
                                </p>
                                <div className="p-4 bg-rose-50/50 rounded-xl border border-rose-100 mt-4">
                                    <span className="text-[10px] font-bold text-rose-600 uppercase tracking-widest block mb-2">MC No. 17, s. 2010</span>
                                    <h4 className="text-xs font-bold text-gray-800 mb-2">Half Day Absence (Definition)</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-3 bg-white rounded-lg border border-rose-100">
                                            <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Morning Late</p>
                                            <p className="text-[11px] font-bold text-gray-700">Tardy / Late</p>
                                        </div>
                                        <div className="p-3 bg-white rounded-lg border border-rose-100">
                                            <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Afternoon Late</p>
                                            <p className="text-[11px] font-bold text-gray-700">Undertime</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'leave' && (
                    <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-300">
                        <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
                            {[
                                { title: "Vacation Leave", filing: "5 working days prior", max: "Subject to approval", remarks: "Attach Clearance if ≥ 30 days." },
                                { title: "Sick Leave", filing: "Immediate / 5 days prior", max: "Subject to approval", remarks: "MedCert if ≥ 5 days. Clearance if ≥ 30." },
                                { title: "Forced/Mandatory", filing: "5 working days prior", max: "5 days annually", remarks: "Requires 10 days VL credits. Auto-deduct." },
                                { title: "Special Leave", filing: "5 working days prior", max: "3 days annually", remarks: "Limited to 3 applications per year. Non-cumulative." },
                                { title: "Special Emergency", filing: "Within 30 days", max: "5 days annually", remarks: "Requires state of calamity declaration." },
                                { title: "Parental (Solo)", filing: "5 working days prior", max: "7 days annually", remarks: "Attach Solo Parent ID. Not deducted." },
                                { title: "Maternity", filing: "30 calendar days prior", max: "105 days base", remarks: "Can allocate 7 days to father. MedCert." },
                                { title: "Paternity", filing: "5 working days prior", max: "7 days", remarks: "For married males. Max 4 deliveries." },
                                { title: "Adoption", filing: "5 days before/grant", max: "60 days (Female)", remarks: "Attach DSWD placement authority." },
                                { title: "Women benefit", filing: "5 working days prior", max: "2 weeks - 2 months", remarks: "Gynecological surgery. RA 9710." },
                                { title: "VAWC (RA 9262)", filing: "5 days prior / immediate", max: "10 days", remarks: "For medical/legal concerns. Support docs." },
                                { title: "Service Credits", filing: "Immediate / 5 days prior", max: "Subject to approval", remarks: "For PCCM Teaching personnel only." }
                            ].map((leave, idx) => (
                                <div key={idx} className="p-6 border border-gray-100 rounded-2xl bg-white shadow-sm hover:border-gray-200 transition-colors flex flex-col h-full">
                                    <h3 className="text-xs font-bold text-gray-800 uppercase tracking-tight mb-4">{leave.title}</h3>
                                    <div className="space-y-4 flex-1">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Filing</p>
                                                <p className="text-[11px] font-bold text-gray-700">{leave.filing}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Duration</p>
                                                <p className="text-[11px] font-bold text-gray-700">{leave.max}</p>
                                            </div>
                                        </div>
                                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 mt-auto">
                                             <p className="text-[10px] text-gray-500 italic leading-tight">{leave.remarks}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'plantilla' && (
                    <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-300">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <section className="p-6 border border-gray-200 rounded-2xl bg-white shadow-sm h-full">
                                    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-6 border-l-4 border-blue-500 pl-3">Position Framework</h3>
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Authorized Positions</h4>
                                            <p className="text-xs text-gray-700 leading-relaxed">
                                                A **Plantilla** is a formal list of authorized positions within the agency. Each position is a permanent "chair" that exists independently of the person currently holding it.
                                            </p>
                                        </div>
                                        <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                                            <h4 className="text-[11px] font-bold text-blue-700 uppercase tracking-widest mb-2">Item Number & SG</h4>
                                            <p className="text-[11px] text-gray-600 font-medium">
                                                Every position has a unique **Item Number** and a fixed **Salary Grade (SG)** governed by the Salary Standardization Law (SSL).
                                            </p>
                                        </div>
                                        <div className="space-y-2">
                                            <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Appointment Status</h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                <div className="p-2 border border-gray-100 rounded-lg text-center">
                                                    <p className="text-[10px] font-bold text-gray-800">Permanent</p>
                                                </div>
                                                <div className="p-2 border border-gray-100 rounded-lg text-center">
                                                    <p className="text-[10px] font-bold text-gray-800">Temporary</p>
                                                </div>
                                                <div className="p-2 border border-gray-100 rounded-lg text-center">
                                                    <p className="text-[10px] font-bold text-gray-800">Co-terminous</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                                
                                <section className="p-6 border border-gray-200 rounded-2xl bg-white shadow-sm mt-6">
                                    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 border-l-4 border-emerald-500 pl-3">Step Increments</h3>
                                    <div className="space-y-3">
                                        <p className="text-[11px] text-gray-600 font-medium leading-relaxed">
                                            Granted every 3 years of continuous satisfactory service in the same position (Rule XI, CSC MC No. 19 s. 2005).
                                        </p>
                                        <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 flex items-center gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 animate-pulse" />
                                            <p className="text-[10px] text-amber-800 font-bold">
                                                LWOP Policy: Any period of Leave Without Pay (LWOP) shall delay the 3rd year anniversary by corresponding days.
                                            </p>
                                        </div>
                                    </div>
                                </section>
                            </div>

                            <div className="space-y-6">
                                <section className="p-6 border border-gray-200 rounded-2xl bg-white shadow-sm h-full">
                                    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-6 border-l-4 border-indigo-500 pl-3">Qualification Standards (QS)</h3>
                                    <div className="space-y-4">
                                        {[
                                            { title: "Education", desc: "Formal academic degree required for the specific position." },
                                            { title: "Experience", desc: "Relevant years of practice in the field or similar duties." },
                                            { title: "Training", desc: "Mandatory number of hours in accredited learning programs." },
                                            { title: "Eligibility", desc: "CS Professional, RA 1080, or other government certifications." }
                                        ].map((qs, i) => (
                                            <div key={i} className="flex gap-4 items-start pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                                                <div className="w-2 h-2 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                                                <div>
                                                    <h4 className="text-[11px] font-bold text-gray-800 uppercase">{qs.title}</h4>
                                                    <p className="text-[11px] text-gray-500 leading-tight mt-0.5">{qs.desc}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-8 p-4 bg-gray-900 rounded-xl text-white">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 mb-2">Audit Compliance</p>
                                        <p className="text-[11px] text-gray-400 leading-relaxed italic">
                                            "Positions must match the DBM PSIPOP report exactly. Any deviation triggers audit findings from COA."
                                        </p>
                                    </div>
                                </section>
                            </div>
                        </div>
                    </div>
                )}
                    </div>
                )}

            <footer className="mt-12 pt-8 border-t border-gray-100 text-center">
                <p className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.2em]">CGM Human Resource Management Office &copy; {new Date().getFullYear()}</p>
            </footer>
        </div>
    );
};

export default InternalPoliciesPage;
