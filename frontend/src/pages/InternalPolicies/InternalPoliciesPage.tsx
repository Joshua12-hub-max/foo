import React, { useState, useEffect } from 'react';
import { type InternalPolicy } from '@/api/policyApi';
import { Loader2, ChevronDown } from 'lucide-react';
import axios from 'axios';

interface InternalPoliciesPageProps {
  hideHeader?: boolean;
}

const ToggleSection: React.FC<{ title: string; defaultOpen?: boolean; children: React.ReactNode }> = ({ 
  title, defaultOpen = true, children 
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-100 last:border-0 pl-4 py-2">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-4 text-left group"
      >
        <h3 className="text-xs font-bold text-gray-800">{title}</h3>
        <ChevronDown 
          size={16} 
          className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[3000px] opacity-100 pb-4' : 'max-h-0 opacity-0'}`}>
        {children}
      </div>
    </div>
  );
};



const InternalPoliciesPage: React.FC<InternalPoliciesPageProps> = ({ hideHeader = false }) => {
    const [policies] = useState<InternalPolicy[]>([]);
    const [loading, setLoading] = useState(false);
    const [defaultShift, setDefaultShift] = useState<{ startTime: string; endTime: string; name: string } | null>(null);

    const formatTime = (timeStr: string) => {
        if (!timeStr) return '';
        const [h, m] = timeStr.split(':').map(Number);
        const period = h < 12 ? 'am' : 'pm';
        const hours = h % 12 || 12;
        return `${hours}:${m.toString().padStart(2, '0')} ${period}`;
    };

    const getLunchStart = (startTime: string) => {
        const [h, m] = startTime.split(':').map(Number);
        return formatTime(`${(h + 4).toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
    };

    const getAfternoonStart = (startTime: string) => {
        const [h, m] = startTime.split(':').map(Number);
        return formatTime(`${(h + 5).toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
    };

    useEffect(() => {
        const fetchShift = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/schedules/shift-templates/default`);
                if (response.data.success) setDefaultShift(response.data.data);
            } catch (error) {
                console.error('Failed to fetch default shift:', error);
            }
        };
        fetchShift();
    }, []);


    return (
        <div className={`flex flex-col bg-white rounded-2xl shadow-sm border border-gray-200 p-6 w-full overflow-hidden transition-all duration-300 animate-in fade-in duration-500`}>
            
            {/* Header Section */}
            {!hideHeader && (
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-xl font-bold text-gray-800">Internal Policies</h1>
                    <p className="text-sm text-gray-500">Guidelines and regulations governing professional standards at CGM</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-[10px] font-bold border border-gray-200">
                        {policies.length > 0 && policies[0].versionLabel ? policies[0].versionLabel : `Office Order 164-${new Date().getFullYear()}`}
                    </span>
                </div>
            </div>
            )}


            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                    <Loader2 className="w-8 h-8 text-slate-500 animate-spin mb-4" />
                    <p className="text-sm text-gray-400 font-medium">Loading official policies...</p>
                </div>
            ) : policies.length > 0 ? (
                <div className="w-full animate-in fade-in duration-500">
                    {policies.map(policy => (
                        <div key={policy.id} className="prose prose-sm max-w-none prose-slate">
                             {/* eslint-disable-next-line @typescript-eslint/naming-convention */}
                             <div dangerouslySetInnerHTML={{ __html: policy.content }} />
                        </div>
                    ))}
                </div>
            ) : (
                /* Fallback to original static content if database is empty */
                <div className="w-full h-full relative">

                    {/* Working Hours Section */}
                    <ToggleSection title="Working Hours & Schedules" defaultOpen={true}>
                        <div className="space-y-8 mt-4 pt-2">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-1 space-y-6 flex flex-col">
                                    <section className="p-6 border border-gray-200 rounded-2xl bg-white shadow-sm flex flex-col h-full">
                                        <h3 className="text-sm font-bold text-gray-800 mb-4 border-l-4 border-slate-500 pl-3">Schedule Overview</h3>
                                        <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 flex-1 space-y-4 flex flex-col overflow-hidden">
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center text-xs font-bold text-gray-700">
                                                    <span>Daily Minimum</span>
                                                    <span className="text-slate-600">8 Hours</span>
                                                </div>
                                                <div className="flex justify-between items-center text-xs font-bold text-gray-700">
                                                    <span>Weekly Total</span>
                                                    <span className="text-slate-600">40 Hours</span>
                                                </div>
                                            </div>
                                            <div className="h-px bg-gray-200 my-4" />
                                            <div className="mt-auto">
                                                <p className="text-[11px] text-gray-500 leading-relaxed font-medium mb-2">
                                                    Excludes lunch break. Must be observed with maximum regularity.
                                                </p>
                                                <p className="text-[10px] text-gray-400 italic">
                                                    Basis: Book V, EO No. 292 Rule XVII Section 5
                                                </p>
                                            </div>
                                        </div>
                                    </section>
                                </div>

                                <div className="lg:col-span-2 space-y-8">
                                    <section className="p-6 border border-gray-200 rounded-2xl bg-white shadow-sm">
                                        <h3 className="text-sm font-bold text-gray-800 mb-6 border-l-4 border-slate-500 pl-3">SOP & Working Hours</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                                            <div className="p-5 border border-gray-100 rounded-2xl bg-slate-50/30 flex flex-col h-full">
                                                <div className="mb-4">
                                                    <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-md text-[9px] font-bold">Standard Duties</span>
                                                </div>
                                                <h4 className="text-sm font-bold text-gray-800 mb-4">General Rule</h4>
                                                <div className="space-y-3 flex-1 border-t border-slate-100/50 pt-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-500 shrink-0" />
                                                        <p className="text-sm font-bold text-gray-700">
                                                            {defaultShift ? formatTime(defaultShift.startTime) : '08:00 am'} — {defaultShift ? getLunchStart(defaultShift.startTime) : '12:00 nn'}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-500 shrink-0" />
                                                        <p className="text-sm font-bold text-gray-700">
                                                            {defaultShift ? getAfternoonStart(defaultShift.startTime) : '01:00 pm'} — {defaultShift ? formatTime(defaultShift.endTime) : '05:00 pm'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="mt-4 p-3 bg-white rounded-xl border border-slate-100/30">
                                                    <p className="text-[10px] font-medium text-slate-600">Regular Work Week (Mon-Fri)</p>
                                                </div>
                                            </div>
                                            
                                            <div className="p-5 border border-gray-100 rounded-2xl bg-amber-50/30 flex flex-col h-full">
                                                <div className="mb-4">
                                                    <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-md text-[9px] font-bold">Irregular Duties</span>
                                                </div>
                                                <h4 className="text-sm font-bold text-gray-800 mb-4">Target Hours Mode</h4>
                                                <div className="space-y-3 flex-1 border-t border-amber-100/50 pt-4">
                                                    <div className="flex items-start justify-between text-[11px] pb-2 border-b border-gray-50">
                                                        <span className="text-gray-500">Late Calculation</span>
                                                        <span className="font-bold text-gray-700">❌ N/A</span>
                                                    </div>
                                                    <div className="flex items-start justify-between text-[11px] pb-2 border-b border-gray-50">
                                                        <span className="text-gray-500">Undertime</span>
                                                        <span className="font-bold text-emerald-600">Target – Rendered = UT</span>
                                                    </div>
                                                    <div className="flex items-start justify-between text-[11px]">
                                                        <span className="text-gray-500">Lunch Deduction</span>
                                                        <span className="font-bold text-gray-700">1h (if &gt; 5h rendered)</span>
                                                    </div>
                                                </div>
                                                <div className="mt-4 p-3 bg-white rounded-xl border border-amber-100/30">
                                                    <p className="text-[10px] text-gray-500 leading-tight">No fixed start/end time. Schedule is assigned by head. (jo / cos)</p>
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    <section className="p-6 border border-gray-200 rounded-2xl bg-white shadow-sm">
                                        <h3 className="text-sm font-bold text-gray-800 mb-6 border-l-4 border-slate-500 pl-3">Standard Protocols</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                            {[
                                                { title: "Time Tracking", desc: "Digital logging via official biometric machines." },
                                                { title: "Business Slips", desc: "Use Locator/Pass Slips for all outside movements." },
                                                { title: "Leave Filing", desc: "Regulars via app; jo/cos notify department head." },
                                                { title: "Professionalism", desc: "Report on time; avoid unauthorized departures." }
                                            ].map((item, idx) => (
                                                <div key={idx} className="p-4 bg-gray-50/50 rounded-xl border border-gray-100 flex flex-col h-full hover:border-gray-200 transition-colors">
                                                    <h4 className="text-[11px] font-bold text-gray-800 mb-2">{item.title}</h4>
                                                    <p className="text-[10px] text-gray-500 leading-relaxed mt-auto">{item.desc}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                </div>
                            </div>
                        </div>
                    </ToggleSection>

                    {/* Tardiness & Undertime Rules */}
                    <ToggleSection title="Tardiness Rules" defaultOpen={false}>
                         <div className="space-y-8 mt-4 pt-2">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <section className="p-6 border border-gray-200 rounded-2xl bg-white shadow-sm">
                                        <h3 className="text-sm font-bold text-gray-800 mb-6 border-l-4 border-slate-500 pl-3">Definitions (CSC MC No. 17, s. 2010)</h3>
                                        <div className="space-y-6">
                                            <div className="space-y-3">
                                                <h4 className="text-[11px] font-bold text-gray-400">Tardiness (Late)</h4>
                                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                                    <p className="text-xs text-gray-800 font-bold mb-2">Reporting after prescribed time of arrival</p>
                                                    <p className="text-[11px] text-gray-600 leading-relaxed">
                                                        An employee is considered <strong>tardy/late</strong> when they report for work after the prescribed time of arrival ({defaultShift ? formatTime(defaultShift.startTime) : '8:00 am'} for {defaultShift?.name || 'Standard'} Duty). Late minutes are counted from <strong>minute 1</strong>.
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <h4 className="text-[11px] font-bold text-gray-400">Undertime</h4>
                                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                                    <p className="text-xs text-gray-800 font-bold mb-2">Leaving before prescribed end of office hours</p>
                                                    <p className="text-[11px] text-gray-600 leading-relaxed">
                                                        An employee is on <strong>undertime</strong> when they leave the office before the prescribed end of office hours ({defaultShift ? formatTime(defaultShift.endTime) : '5:00 pm'} for {defaultShift?.name || 'Standard'} Duty). A single day can be <strong>both Late and Undertime</strong>.
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="h-px bg-gray-100" />
                                            <div className="space-y-3">
                                                <h4 className="text-[11px] font-bold text-gray-400">Deduction Formula</h4>
                                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                                    <p className="text-xs text-slate-800 font-bold mb-2">Total Minutes ÷ 480 = Days Equivalent</p>
                                                    <p className="text-[11px] text-gray-600 leading-relaxed">
                                                        480 minutes = 8 working hours = 1 day. Late + undertime minutes are combined and deducted from <strong>vacation leave</strong> first. If vl is insufficient, the remainder is charged as <strong>lwop</strong> (leave without pay).
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </section>
                                </div>

                                <div className="space-y-6">
                                    <section className="p-6 border border-gray-200 rounded-2xl bg-white shadow-sm">
                                        <h3 className="text-sm font-bold text-gray-800 mb-6 border-l-4 border-rose-500 pl-3">Habitual Tardiness / Undertime (CSC MC No. 1, s. 2017)</h3>
                                        <div className="space-y-6">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="p-4 border border-gray-100 rounded-xl bg-gray-50/50">
                                                    <h4 className="text-[10px] font-bold text-gray-400 mb-1">Threshold</h4>
                                                    <p className="text-[11px] font-bold text-gray-700">10 or more times per month</p>
                                                </div>
                                                <div className="p-4 border border-rose-100 rounded-xl bg-rose-50/30">
                                                    <h4 className="text-[10px] font-bold text-rose-600 mb-1">Trigger</h4>
                                                    <p className="text-[11px] font-bold text-gray-700">2 months in a semester or 2 consecutive months</p>
                                                </div>
                                            </div>

                                            <div className="bg-gray-900 text-white p-5 rounded-2xl relative overflow-hidden">
                                                <h4 className="text-[11px] font-bold text-rose-400 mb-4">Progressive Penalties</h4>
                                                <div className="grid grid-cols-2 gap-6">
                                                    <div className="space-y-3">
                                                        <p className="text-[10px] font-bold text-slate-400">Regular / Plantilla</p>
                                                        {[
                                                            { offense: '1st', penalty: 'Reprimand (Stern Warning)', sev: 'Minor' },
                                                            { offense: '2nd', penalty: 'Suspension 1-30 days', sev: 'Major' },
                                                            { offense: '3rd', penalty: 'Dismissal from Service', sev: 'Terminal' }
                                                        ].map((p, i) => (
                                                            <div key={i} className="flex justify-between border-b border-white/5 pb-2">
                                                                <span className="text-[11px] text-gray-400">{p.offense}</span>
                                                                <span className="text-[11px] font-bold text-right">{p.penalty}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="space-y-3">
                                                        <p className="text-[10px] font-bold text-amber-400">jo / cos</p>
                                                        {[
                                                            { offense: '1st', penalty: 'Written Warning', sev: 'Minor' },
                                                            { offense: '2nd', penalty: 'Reprimand', sev: 'Moderate' },
                                                            { offense: '3rd', penalty: 'Termination of Contract', sev: 'Terminal' }
                                                        ].map((p, i) => (
                                                            <div key={i} className="flex justify-between border-b border-white/5 pb-2">
                                                                <span className="text-[11px] text-gray-400">{p.offense}</span>
                                                                <span className="text-[11px] font-bold text-right">{p.penalty}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </section>
                                </div>
                            </div>
                         </div>
                    </ToggleSection>

                    {/* Violations & Penalties Section */}
                    <ToggleSection title="Violations & Penalties" defaultOpen={false}>
                        <div className="space-y-8 mt-4 pt-2">
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                                {[
                                    {
                                        title: "Habitual Absenteeism",
                                        desc: "Unauthorized absences exceeding 2.5 days/month for 3 months in a semester or 3 consecutive months. (CSC MC No. 1, s. 2017)",
                                        regular: [
                                            { label: "1st Offense", penalty: "Suspension of 6 months & 1 day" },
                                            { label: "2nd Offense", penalty: "Dismissal from Service" }
                                        ],
                                        contract: [
                                            { label: "1st Offense", penalty: "Reprimand" },
                                            { label: "2nd Offense", penalty: "Termination of Contract" }
                                        ]
                                    },
                                    {
                                        title: "Habitual Tardiness",
                                        desc: "10 or more times late per month for 2 months in a semester or 2 consecutive months. (CSC MC No. 1, s. 2017)",
                                        regular: [
                                            { label: "1st Offense", penalty: "Reprimand (Stern Warning)" },
                                            { label: "2nd Offense", penalty: "Suspension of 1-30 days" },
                                            { label: "3rd Offense", penalty: "Dismissal from Service" }
                                        ],
                                        contract: [
                                            { label: "1st Offense", penalty: "Written Warning" },
                                            { label: "2nd Offense", penalty: "Reprimand" },
                                            { label: "3rd Offense", penalty: "Termination of Contract" }
                                        ]
                                    },
                                    {
                                        title: "Habitual Undertime (Simple Misconduct)",
                                        desc: "10 or more undertimes per month for 2 months in a semester or 2 consecutive months. Default classification. (CSC MC No. 16, s. 2010)",
                                        regular: [
                                            { label: "1st Offense", penalty: "Reprimand (Stern Warning)" },
                                            { label: "2nd Offense", penalty: "Suspension of 1-30 days" },
                                            { label: "3rd Offense", penalty: "Dismissal from Service" }
                                        ],
                                        contract: [
                                            { label: "1st Offense", penalty: "Written Warning" },
                                            { label: "2nd Offense", penalty: "Reprimand" },
                                            { label: "3rd Offense", penalty: "Termination of Contract" }
                                        ]
                                    },
                                    {
                                        title: "Habitual Undertime (Prejudicial to Service)",
                                        desc: "Undertime that adversely affects public service. Requires manual admin tagging.",
                                        regular: [
                                            { label: "1st Offense", penalty: "Suspension of 6 months to 1 year" },
                                            { label: "2nd Offense", penalty: "Dismissal from Service" }
                                        ],
                                        contract: [
                                            { label: "1st Offense", penalty: "Reprimand" },
                                            { label: "2nd Offense", penalty: "Termination of Contract" }
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
                                                <h4 className="text-[10px] font-bold text-gray-400 border-b border-gray-50 pb-1">Regular / Plantilla</h4>
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
                                                <h4 className="text-[10px] font-bold text-gray-400 border-b border-gray-50 pb-1">jo / cos</h4>
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

                            {/* AWOL Rule & Performance Rating Impact */}
                            <div className="bg-gray-900 rounded-2xl p-8 text-white relative overflow-hidden">
                                 <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8">
                                    <div className="md:col-span-1 border-r border-white/10 pr-6">
                                        <h3 className="text-lg font-bold mb-2">Performance Rating Impact</h3>
                                        <p className="text-xs text-gray-400 leading-relaxed">
                                            Memo severities impose strict ceilings on the Performance Evaluation score.
                                        </p>
                                    </div>
                                    <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <p className="text-[10px] font-bold text-slate-400">Memo Severity → Rating Ceiling</p>
                                            <div className="space-y-2">
                                                {[
                                                    { sev: 'Minor (Reprimand)', ceiling: 'Max Score: 3 (Satisfactory)' },
                                                    { sev: 'Moderate (Suspension)', ceiling: 'Max Score: 2 (Unsatisfactory)' },
                                                    { sev: 'Major / Grave', ceiling: 'Max Score: 1 (Poor)' },
                                                    { sev: 'Terminal (Dismissal)', ceiling: 'Score: 0 (Separated)' }
                                                ].map((item, i) => (
                                                    <div key={i} className="flex justify-between border-b border-white/5 pb-2">
                                                        <span className="text-[11px] text-gray-400">{item.sev}</span>
                                                        <span className="text-[11px] font-bold">{item.ceiling}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <p className="text-[10px] font-bold text-rose-400">Awol rule (csc mc no. 38, s. 1993)</p>
                                            <div className="p-4 bg-rose-950/30 rounded-xl border border-rose-900/30">
                                                <p className="text-[11px] font-bold text-rose-300 mb-1">30 consecutive working days</p>
                                                <p className="text-[11px] text-gray-400 leading-relaxed">
                                                    Employee who is continuously absent without approved leave for 30 working days shall be <strong className="text-rose-400">dropped from the rolls</strong> without prior notice.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                 </div>
                            </div>
                        </div>
                    </ToggleSection>

                    {/* Leave Policies Section */}
                    <ToggleSection title="Leave Policies" defaultOpen={false}>
                        <div className="space-y-8 mt-4 pt-2">
                            <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
                                {[
                                    { title: "Vacation Leave", filing: "5 working days prior", max: "Earned 1.25 days/month", remarks: "Advance filing required. Accrue 15 days annually. EO No. 292.", attachment: "None" },
                                    { title: "Sick Leave", filing: "Within 3 days of return", max: "Earned 1.25 days/month", remarks: "Medical Certificate required if 5+ consecutive days. CSC MC No. 41, s. 1998.", attachment: "MedCert if ≥ 5 days" },
                                    { title: "Forced Leave", filing: "5 working days prior", max: "5 days annually", remarks: "Must have 10 VL credits. Auto-deducted Dec 31st. Use-it-or-lose-it. CSC MC No. 41, s. 1998.", attachment: "None" },
                                    { title: "Special Privilege Leave", filing: "5 working days prior", max: "3 days annually", remarks: "Non-cumulative, non-convertible to cash. Limited to 3 applications per year.", attachment: "None" },
                                    { title: "Special Emergency Leave", filing: "Within 30 days", max: "5 days annually", remarks: "Only for declared state of calamity. RA 9263.", attachment: "None" },
                                    { title: "Solo Parent Leave", filing: "5 working days prior", max: "7 days annually", remarks: "Solo Parent ID required. RA 8972. Non-convertible.", attachment: "Solo Parent ID" },
                                    { title: "Maternity Leave", filing: "30 calendar days prior", max: "105 days (normal)", remarks: "+15 days if solo parent. Can share 7 days with father. RA 11210.", attachment: "Medical Certificate" },
                                    { title: "Paternity Leave", filing: "5 working days prior", max: "7 days", remarks: "For legally married males. First 4 deliveries. RA 8187.", attachment: "None" },
                                    { title: "Adoption Leave", filing: "5 working days prior", max: "60 days", remarks: "DSWD placement authority required. RA 8552.", attachment: "DSWD Endorsement" },
                                    { title: "Special Leave (Women)", filing: "5 working days prior", max: "Up to 2 months", remarks: "Gynecological surgery or related conditions. RA 9710.", attachment: "Medical Certificate" },
                                    { title: "VAWC Leave (RA 9262)", filing: "Immediate", max: "10 days", remarks: "For victims of violence against women & children. Renewable.", attachment: "BPO/TPO/Police Report" },
                                    { title: "Rehabilitation Leave", filing: "5 working days prior", max: "Subject to approval", remarks: "For work-related injuries or illnesses requiring rehabilitation.", attachment: "Medical Certificate" }
                                ].map((leave, idx) => (
                                    <div key={idx} className="p-6 border border-gray-100 rounded-2xl bg-white shadow-sm hover:border-gray-200 transition-colors flex flex-col h-full">
                                        <h3 className="text-xs font-bold text-gray-800 mb-4">{leave.title}</h3>
                                        <div className="space-y-4 flex-1">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <p className="text-[9px] font-bold text-gray-400">Filing Window</p>
                                                    <p className="text-[11px] font-bold text-gray-700">{leave.filing}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[9px] font-bold text-gray-400">Duration</p>
                                                    <p className="text-[11px] font-bold text-gray-700">{leave.max}</p>
                                                </div>
                                            </div>
                                            {leave.attachment !== 'None' && (
                                                <div className="p-2 bg-amber-50 rounded-lg border border-amber-100">
                                                    <p className="text-[10px] text-amber-700 font-bold">📎 Required: {leave.attachment}</p>
                                                </div>
                                            )}
                                            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 mt-auto">
                                                 <p className="text-[10px] text-gray-500 italic leading-tight">{leave.remarks}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Deemed Approval & Monthly Accrual */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                    <h4 className="text-xs font-bold text-slate-800 mb-3">⏰ Deemed Approved Rule</h4>
                                    <p className="text-[11px] text-gray-700 leading-relaxed">
                                        Any leave application pending action for <strong>5 or more working days</strong> is automatically deemed approved. (CSC MC No. 41, s. 1998, Section 49)
                                    </p>
                                </div>
                                <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100">
                                    <h4 className="text-xs font-bold text-emerald-800 mb-3">📅 Monthly Leave Accrual</h4>
                                    <p className="text-[11px] text-gray-700 leading-relaxed">
                                        Regular employees earn <strong>1.25 days VL + 1.25 days SL = 2.5 days/month</strong> (15 VL + 15 SL = 30 days/year). JO/COS do not earn leave credits. (EO No. 292)
                                    </p>
                                </div>
                            </div>
                        </div>
                    </ToggleSection>

                    {/* Plantilla & Employment Policies */}
                    <ToggleSection title="Plantilla Policies" defaultOpen={false}>
                        <div className="space-y-8 mt-4 pt-2">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <section className="p-6 border border-gray-200 rounded-2xl bg-white shadow-sm">
                                        <h3 className="text-sm font-bold text-gray-800 mb-6 border-l-4 border-blue-500 pl-3">Employment Classification Matrix</h3>
                                        <div className="space-y-4">
                                            <p className="text-[11px] text-gray-600 leading-relaxed">
                                                Each appointment type determines the employee's duty schedule, penalty track, and leave credit eligibility.
                                            </p>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm">
                                                    <thead>
                                                        <tr className="border-b border-gray-100 bg-[#FAFAFA]">
                                                            <th className="text-left py-3 px-4 text-gray-400 font-bold text-[10px] whitespace-nowrap">Type</th>
                                                            <th className="text-left py-3 pr-4 text-gray-400 font-bold text-[10px] whitespace-nowrap">Duty</th>
                                                            <th className="text-left py-3 pr-4 text-gray-400 font-bold text-[10px] whitespace-nowrap">Penalty Track</th>
                                                            <th className="text-left py-3 text-gray-400 font-bold text-[10px] whitespace-nowrap">Leave Credits</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {[
                                                            { type: 'Permanent', duty: 'Standard', track: 'Regular', leave: true },
                                                            { type: 'Temporary', duty: 'Standard', track: 'Regular', leave: true },
                                                            { type: 'Contractual', duty: 'Standard', track: 'Regular', leave: true },
                                                            { type: 'Coterminous', duty: 'Standard', track: 'Regular', leave: true },
                                                            { type: 'Casual', duty: 'Irregular', track: 'JO/COS', leave: true },
                                                            { type: 'Job Order (JO)', duty: 'Irregular', track: 'JO/COS', leave: false },
                                                            { type: 'Contract of Service (COS)', duty: 'Irregular', track: 'JO/COS', leave: false }
                                                        ].map((row, i) => (
                                                            <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors group">
                                                                <td className="py-3 px-4 font-semibold text-gray-800 whitespace-nowrap">{row.type}</td>
                                                                <td className="py-3 pr-4 text-gray-600 whitespace-nowrap">{row.duty}</td>
                                                                <td className="py-3 pr-4 whitespace-nowrap">
                                                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all ${
                                                                        row.track === 'Regular' 
                                                                            ? 'bg-gray-50 text-gray-500 border-gray-100 group-hover:bg-slate-50 group-hover:text-slate-700 group-hover:border-slate-200' 
                                                                            : 'bg-gray-50 text-gray-400 border-gray-100 group-hover:bg-amber-50 group-hover:text-amber-700 group-hover:border-amber-200'
                                                                    }`}>
                                                                        {row.track}
                                                                    </span>
                                                                </td>
                                                                <td className="py-3 whitespace-nowrap">
                                                                    <span className={`text-[10px] font-bold transition-all ${
                                                                        row.leave 
                                                                            ? 'text-gray-300 group-hover:text-emerald-600' 
                                                                            : 'text-gray-300 group-hover:text-rose-500'
                                                                    }`}>
                                                                        {row.leave ? '✓ Available' : '× Not Applicable'}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </section>
                                    
                                    <section className="p-6 border border-gray-200 rounded-2xl bg-white shadow-sm">
                                        <h3 className="text-sm font-bold text-gray-800 mb-4 border-l-4 border-emerald-500 pl-3">Step Increments</h3>
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
                                    <section className="p-6 border border-gray-200 rounded-2xl bg-white shadow-sm">
                                        <h3 className="text-sm font-bold text-gray-800 mb-6 border-l-4 border-slate-500 pl-3">Qualification Standards (QS)</h3>
                                        <div className="space-y-4">
                                            {[
                                                { title: "Education", desc: "Formal academic degree required for the specific position." },
                                                { title: "Experience", desc: "Relevant years of practice in the field or similar duties." },
                                                { title: "Training", desc: "Mandatory number of hours in accredited learning programs." },
                                                { title: "Eligibility", desc: "CS Professional, RA 1080, or other government certifications." }
                                            ].map((qs, i) => (
                                                <div key={i} className="flex gap-4 items-start pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                                                    <div className="w-2 h-2 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                                                    <div>
                                                        <h4 className="text-[11px] font-bold text-gray-800">{qs.title}</h4>
                                                        <p className="text-[11px] text-gray-500 leading-tight mt-0.5">{qs.desc}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-8 p-4 bg-gray-900 rounded-xl text-white">
                                            <p className="text-[10px] font-bold text-slate-400 mb-2">Audit Compliance</p>
                                            <p className="text-[11px] text-gray-400 leading-relaxed italic">
                                                "Positions must match the dbm psipop report exactly. Any deviation triggers audit findings from coa."
                                            </p>
                                        </div>
                                    </section>

                                    <section className="p-6 border border-gray-200 rounded-2xl bg-white shadow-sm">
                                        <h3 className="text-sm font-bold text-gray-800 mb-4 border-l-4 border-rose-500 pl-3">Key Policy Notes</h3>
                                        <div className="space-y-3">
                                            {[
                                                `Standard duty = Regular Mon-Fri ${defaultShift ? `${formatTime(defaultShift.startTime).replace(' am', '')}-${formatTime(defaultShift.endTime).replace(' pm', '')}pm` : '8am-5pm'} schedule`,
                                                'Irregular duty = Schedule assigned by department head, may include weekends',
                                                'jo/cos do not earn leave credits under csc rules',
                                                'Penalty track for JO/COS is shorter (Warning → Termination)',
                                                'All employees must complete 8 working hours per day'
                                            ].map((note, i) => (
                                                <div key={i} className="flex gap-3 items-start">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                                                    <p className="text-[11px] text-gray-600 leading-tight">{note}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                </div>
                            </div>
                        </div>
                    </ToggleSection>

                    {/* CSC Circulars Reference list */}
                    <ToggleSection title="CSC Circulars" defaultOpen={false}>
                        <div className="animate-in slide-in-from-bottom-2 duration-300 space-y-8 mt-4 pt-2">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="p-8 border border-gray-200 rounded-2xl bg-white shadow-sm space-y-6">
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-bold text-slate-600">MC No. 1, s. 2017</span>
                                        <h4 className="text-base font-bold text-gray-800">2017-RACCS: Habitual Offenses</h4>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                            <p className="text-[11px] font-bold text-gray-700 mb-2">Habitually Absent</p>
                                            <p className="text-xs text-gray-600 leading-relaxed">
                                                Unauthorized absences exceeding the allowable 2.5 days monthly leave credit for at least:
                                            </p>
                                            <ul className="text-[11px] text-gray-500 font-bold mt-2 list-disc pl-4">
                                                <li>Three (3) months in a semester; or</li>
                                                <li>Three (3) consecutive months during the year.</li>
                                            </ul>
                                        </div>
                                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                            <p className="text-[11px] font-bold text-gray-700 mb-2">Habitually Tardy</p>
                                            <p className="text-xs text-gray-600 leading-relaxed">
                                                Late regardless of the number of minutes, ten (10) times a month for at least:
                                            </p>
                                            <ul className="text-[11px] text-gray-500 font-bold mt-2 list-disc pl-4">
                                                <li>Two (2) months in a semester; or</li>
                                                <li>Two (2) consecutive months during the year.</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="p-8 border border-gray-200 rounded-2xl bg-white shadow-sm space-y-6">
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-bold text-amber-600">MC No. 16, s. 2010</span>
                                            <h4 className="text-base font-bold text-gray-800">Policy on Habitual Undertime</h4>
                                        </div>
                                        <p className="text-xs text-gray-500 leading-relaxed italic border-l-2 border-gray-100 pl-4 py-1">
                                            "Regardless of the number of minutes/hours, ten (10) times a month for at least two (2) months in a semester or two (2) consecutive months during the year."
                                        </p>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                                <p className="text-[10px] text-gray-400 font-bold mb-1">Default</p>
                                                <p className="text-[11px] font-bold text-gray-700">Simple Misconduct</p>
                                            </div>
                                            <div className="p-3 bg-rose-50 rounded-lg border border-rose-100">
                                                <p className="text-[10px] text-rose-400 font-bold mb-1">If Tagged</p>
                                                <p className="text-[11px] font-bold text-gray-700">Prejudicial to Service</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-8 border border-gray-200 rounded-2xl bg-white shadow-sm space-y-6">
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-bold text-rose-600">MC No. 17, s. 2010</span>
                                            <h4 className="text-base font-bold text-gray-800">Tardiness / Undertime Deduction</h4>
                                        </div>
                                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                            <p className="text-xs text-slate-800 font-bold mb-2">Formula: Total Minutes ÷ 480 = Days Equivalent</p>
                                            <p className="text-[11px] text-gray-600 leading-relaxed">
                                                Morning late = <strong>Tardy</strong>. Afternoon early departure = <strong>Undertime</strong>. Both are combined and deducted from VL, then LWOP.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Additional CSC References */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="p-6 border border-gray-200 rounded-2xl bg-white shadow-sm">
                                    <span className="text-[10px] font-bold text-emerald-600">MC No. 41, s. 1998</span>
                                    <h4 className="text-sm font-bold text-gray-800 mt-1 mb-3">Omnibus Rules on Leave</h4>
                                    <ul className="text-[11px] text-gray-600 space-y-2 list-disc pl-4">
                                        <li>Advance filing of 5 working days for VL</li>
                                        <li>SL within 3 days of return to work</li>
                                        <li>MedCert required if SL ≥ 5 consecutive days</li>
                                        <li>Deemed approved if pending ≥ 5 days</li>
                                        <li>Forced Leave: 5 days annually (needs 10 VL)</li>
                                    </ul>
                                </div>
                                <div className="p-6 border border-gray-200 rounded-2xl bg-white shadow-sm">
                                    <span className="text-[10px] font-bold text-slate-600">MC No. 38, s. 1993</span>
                                    <h4 className="text-sm font-bold text-gray-800 mt-1 mb-3">AWOL / Dropping from Rolls</h4>
                                    <ul className="text-[11px] text-gray-600 space-y-2 list-disc pl-4">
                                        <li>30 consecutive working days continuous absence</li>
                                        <li>Dropped from rolls without prior notice</li>
                                        <li>Applies to all employment types</li>
                                        <li>No back pay or terminal leave entitlement</li>
                                    </ul>
                                </div>
                                <div className="p-6 border border-gray-200 rounded-2xl bg-white shadow-sm">
                                    <span className="text-[10px] font-bold text-blue-600">EO No. 292</span>
                                    <h4 className="text-sm font-bold text-gray-800 mt-1 mb-3">Administrative Code Leave Credits</h4>
                                    <ul className="text-[11px] text-gray-600 space-y-2 list-disc pl-4">
                                        <li>Vacation Leave: 1.25 days/month (15 days/year)</li>
                                        <li>Sick Leave: 1.25 days/month (15 days/year)</li>
                                        <li>Total: 2.5 days/month or 30 days/year</li>
                                        <li>JO/COS employees do NOT earn leave credits</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </ToggleSection>

                    </div>
                )}

            <footer className="mt-12 pt-8 border-t border-gray-100 text-center">
                <p className="text-[10px] font-bold text-gray-300 tracking-[0.2em]">CGM Human Resource Management Office &copy; {new Date().getFullYear()}</p>
            </footer>
        </div>
    );
};

export default InternalPoliciesPage;
