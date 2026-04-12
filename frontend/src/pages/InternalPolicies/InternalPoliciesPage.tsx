import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Loader2, ChevronDown } from 'lucide-react';
import axios from 'axios';

interface OutletContext {
  searchQuery?: string;
}

interface InternalPoliciesPageProps {
  hideHeader?: boolean;
}

const PolicyCard: React.FC<{ title: string; defaultOpen?: boolean; children: React.ReactNode }> = ({ 
  title, defaultOpen = false, children 
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`bg-white border rounded-[var(--radius-lg)] mb-6 overflow-hidden transition-all duration-300 ${isOpen ? 'border-[var(--zed-primary)] shadow-sm' : 'border-[var(--zed-border-light)]'}`}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 text-left group"
      >
        <div className="flex flex-col">
            <h3 className={`text-base font-bold tracking-tight transition-colors ${isOpen ? 'text-[var(--zed-primary)]' : 'text-[var(--zed-text-dark)] group-hover:text-[var(--zed-primary)]'}`}>{title}</h3>
            <p className="text-[10px] text-[var(--zed-text-muted)] font-bold tracking-widest leading-none mt-1">Official Policy</p>
        </div>
        <div className={`p-2 transition-all duration-300 ${isOpen ? 'rotate-180 text-[var(--zed-primary)]' : 'text-[var(--zed-text-muted)]'}`}>
            <ChevronDown size={18} />
        </div>
      </button>
      
      <div className={`transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[10000px] opacity-100 px-6 pb-8' : 'max-h-0 opacity-0 overflow-hidden'}`}>
        <div className="border-t border-[var(--zed-border-light)] pt-8">
            {children}
        </div>
      </div>
    </div>
  );
};



const InternalPoliciesPage: React.FC<InternalPoliciesPageProps> = ({ hideHeader = false }) => {
    const [loading, setLoading] = useState(false);
    const context = useOutletContext<OutletContext>();
    const searchQuery = context?.searchQuery || "";
    const [defaultShift, setDefaultShift] = useState<{ startTime: string; endTime: string; name: string } | null>(null);

    const formatTime = (timeStr: string) => {
        if (!timeStr) return '';
        const [h, m] = timeStr.split(':').map(Number);
        const period = h < 12 ? 'am' : 'pm';
        const hours = h % 12 || 12;
        return `${hours}:${m.toString().padStart(2, '0')} ${period}`;
    };

    const getLunchStart = (startTime: string) => {
        if (!startTime) return '12:00 nn';
        const [h, m] = startTime.split(':').map(Number);
        return formatTime(`${(h + 4).toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
    };

    const getAfternoonStart = (startTime: string) => {
        if (!startTime) return '01:00 pm';
        const [h, m] = startTime.split(':').map(Number);
        return formatTime(`${(h + 5).toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
    };

    useEffect(() => {
        const fetchShift = async () => {
            try {
                const shiftRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/schedules/shift-templates/default`);
                if (shiftRes.data.success) {
                    setDefaultShift(shiftRes.data.data);
                }
            } catch (error) {
                console.error('Failed to fetch default shift:', error);
            }
        };
        fetchShift();
    }, []);

    // Filter logic for static sections
    const matchesSearch = (text: string) => {
        if (!searchQuery) return true;
        return text.toLowerCase().includes(searchQuery.toLowerCase());
    };

    return (
        <div className="w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
            
            {/* Header Section */}
            {!hideHeader && (
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-8 bg-[var(--zed-primary)] rounded-full" />
                        <h1 className="text-3xl font-black text-[var(--zed-text-dark)] tracking-tight">Internal Policies</h1>
                    </div>
                    <p className="text-base font-medium text-[var(--zed-text-muted)] max-w-2xl">
                        Guidelines and professional standards governing the City Government of Meycauayan workforce.
                    </p>
                </div>
                <div className="flex items-center gap-3 px-5 py-2.5 bg-white border border-[var(--zed-border-light)] rounded-[var(--radius-lg)] shadow-sm">
                    <span className="text-xs font-black text-[var(--zed-primary)] tracking-wider">
                        Office Order 164-{new Date().getFullYear()}
                    </span>
                </div>
            </div>
            )}


            {loading ? (
                <div className="flex flex-col items-center justify-center py-32 space-y-4">
                    <Loader2 className="w-10 h-10 text-[var(--zed-primary)] animate-spin" />
                    <p className="text-sm text-[var(--zed-text-muted)] font-black tracking-widest">Synchronizing Policies...</p>
                </div>
            ) : (
                <div className="w-full h-full relative space-y-6">

                    {/* 1. Working Hours Section */}
                    {matchesSearch("Working Hours Schedules Shift Duties") && (
                    <PolicyCard title="Working Hours & Schedules" defaultOpen={true}>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-1 space-y-6">
                                <div className="p-6 bg-white rounded-[var(--radius-lg)] border border-[var(--zed-border-light)] h-full shadow-sm">
                                    <h4 className="text-xs font-black text-[var(--zed-text-muted)] tracking-[0.2em] mb-6">Schedule Overview</h4>
                                    <div className="space-y-5">
                                        <div className="flex justify-between items-center group">
                                            <span className="text-sm font-bold text-[var(--zed-text-dark)]">Daily Minimum</span>
                                            <span className="px-3 py-1 bg-white border border-[var(--zed-border-light)] rounded-md text-xs font-black text-[var(--zed-primary)]">8 Hours</span>
                                        </div>
                                        <div className="flex justify-between items-center group">
                                            <span className="text-sm font-bold text-[var(--zed-text-dark)]">Weekly Total</span>
                                            <span className="px-3 py-1 bg-white border border-[var(--zed-border-light)] rounded-md text-xs font-black text-[var(--zed-primary)]">40 Hours</span>
                                        </div>
                                        <div className="h-px bg-[var(--zed-border-light)] my-2" />
                                        <p className="text-xs text-[var(--zed-text-muted)] leading-relaxed font-medium">
                                            Excludes lunch break. Must be observed with maximum regularity as per Book V, EO No. 292 Rule XVII Section 5.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="lg:col-span-2 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="p-6 bg-white border border-[var(--zed-border-light)] rounded-[var(--radius-lg)] shadow-sm relative overflow-hidden group hover:border-[var(--zed-primary)] transition-all">
                                        <span className="px-2.5 py-1 bg-white border border-[var(--zed-border-light)] text-[var(--zed-primary)] rounded-md text-[10px] font-black tracking-wider mb-4 inline-block">Standard Duties</span>
                                        <h4 className="text-lg font-bold text-[var(--zed-text-dark)] mb-4">General Rule</h4>
                                        <div className="space-y-4 border-t border-[var(--zed-border-light)] pt-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-2 h-2 rounded-full bg-[var(--zed-primary)]" />
                                                <p className="text-base font-black text-[var(--zed-text-dark)] font-mono">
                                                    {defaultShift ? formatTime(defaultShift.startTime) : '08:00 am'} — {defaultShift ? getLunchStart(defaultShift.startTime) : '12:00 nn'}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="w-2 h-2 rounded-full bg-[var(--zed-primary)]" />
                                                <p className="text-base font-black text-[var(--zed-text-dark)] font-mono">
                                                    {defaultShift ? getAfternoonStart(defaultShift.startTime) : '01:00 pm'} — {defaultShift ? formatTime(defaultShift.endTime) : '05:00 pm'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="p-6 bg-white border border-[var(--zed-border-light)] rounded-[var(--radius-lg)] shadow-sm relative overflow-hidden group hover:border-[var(--zed-primary)] transition-all">
                                        <span className="px-2.5 py-1 bg-white border border-[var(--zed-border-light)] text-[var(--zed-text-dark)] rounded-md text-[10px] font-black tracking-wider mb-4 inline-block">Irregular Duties</span>
                                        <h4 className="text-lg font-bold text-[var(--zed-text-dark)] mb-4">Target Hours Mode</h4>
                                        <div className="space-y-3 border-t border-[var(--zed-border-light)] pt-4">
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-[var(--zed-text-muted)] font-bold">Late Calculation</span>
                                                <span className="font-black text-[var(--zed-text-dark)]">Not Applicable</span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-[var(--zed-text-muted)] font-bold">Undertime</span>
                                                <span className="font-black text-[var(--zed-primary)]">Target – Rendered</span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-[var(--zed-text-muted)] font-bold">Lunch Break</span>
                                                <span className="font-black text-[var(--zed-text-dark)]">1h (if &gt; 5h rendered)</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {[
                                        { title: "Time Tracking", desc: "Official biometric machines" },
                                        { title: "Business Slips", desc: "Required for outside movements" },
                                        { title: "Leave Filing", desc: "Via Employee Portal" },
                                        { title: "Professionalism", desc: "Punctuality is mandatory" }
                                    ].map((item, idx) => (
                                        <div key={idx} className="p-4 bg-white rounded-[var(--radius-md)] border border-[var(--zed-border-light)] hover:border-[var(--zed-primary)] transition-all shadow-sm">
                                            <h5 className="text-[10px] font-black text-[var(--zed-primary)] tracking-widest mb-2">{item.title}</h5>
                                            <p className="text-[11px] font-medium text-[var(--zed-text-dark)] leading-tight">{item.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </PolicyCard>
                    )}

                    {/* 2. Tardiness & Undertime Rules */}
                    {matchesSearch("Tardiness Undertime Late Minutes Deduction") && (
                    <PolicyCard title="Tardiness & Undertime Rules">
                         <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                            <div className="space-y-8">
                                <div className="space-y-6">
                                    <h4 className="text-xs font-black text-[var(--zed-text-muted)] tracking-[0.2em]">Definitions (CSC MC No. 17, s. 2010)</h4>
                                    
                                    <div className="space-y-4">
                                        <div className="p-5 bg-white border border-[var(--zed-border-light)] border-l-4 border-l-[var(--zed-primary)] rounded-[var(--radius-md)] shadow-sm">
                                            <p className="text-sm font-black text-[var(--zed-text-dark)] mb-2">Tardiness (Late)</p>
                                            <p className="text-xs text-[var(--zed-text-muted)] leading-relaxed font-medium">
                                                Reporting after prescribed time of arrival ({defaultShift ? formatTime(defaultShift.startTime) : '8:00 am'}). Late minutes are counted from <strong>minute 1</strong>.
                                            </p>
                                        </div>
                                        
                                        <div className="p-5 bg-white border border-[var(--zed-border-light)] border-l-4 border-l-[var(--zed-primary)] rounded-[var(--radius-md)] shadow-sm">
                                            <p className="text-sm font-black text-[var(--zed-text-dark)] mb-2">Undertime</p>
                                            <p className="text-xs text-[var(--zed-text-muted)] leading-relaxed font-medium">
                                                Leaving before prescribed end of office hours ({defaultShift ? formatTime(defaultShift.endTime) : '5:00 pm'}). A single day can be <strong>both Late and Undertime</strong>.
                                            </p>
                                        </div>

                                        <div className="p-5 bg-white border border-[var(--zed-primary)] rounded-[var(--radius-lg)] shadow-sm relative overflow-hidden">
                                            <div className="relative z-10">
                                                <p className="text-[10px] font-black tracking-[0.2em] text-[var(--zed-primary)] mb-2">Deduction Formula</p>
                                                <p className="text-xl font-black font-mono text-[var(--zed-text-dark)] mb-2">Total Minutes ÷ 480</p>
                                                <p className="text-xs font-medium text-[var(--zed-text-muted)] leading-relaxed">
                                                    480 minutes = 1 day. Combined minutes are deducted from <strong>Vacation Leave</strong> or charged as <strong>LWOP</strong>.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-8">
                                <h4 className="text-xs font-black text-[var(--zed-text-muted)] tracking-[0.2em]">Habitual Offenses (CSC MC No. 1, s. 2017)</h4>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-5 bg-white border border-[var(--zed-border-light)] rounded-[var(--radius-lg)] shadow-sm">
                                        <p className="text-[10px] font-black text-[var(--zed-text-muted)] tracking-widest mb-2">Threshold</p>
                                        <p className="text-base font-black text-[var(--zed-text-dark)]">10+ times / month</p>
                                    </div>
                                    <div className="p-5 bg-white border border-[var(--zed-border-light)] rounded-[var(--radius-lg)] shadow-sm">
                                        <p className="text-[10px] font-black text-[var(--zed-text-muted)] tracking-widest mb-2">Trigger</p>
                                        <p className="text-base font-black text-[var(--zed-text-dark)]">2 months / sem</p>
                                    </div>
                                </div>

                                <div className="p-8 bg-white text-[var(--zed-text-dark)] border border-[var(--zed-border-light)] rounded-[var(--radius-lg)] shadow-sm">
                                    <h5 className="text-sm font-black text-[var(--zed-primary)] tracking-widest mb-6">Progressive Penalties</h5>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                                        <div className="space-y-4">
                                            <p className="text-[10px] font-black text-[var(--zed-text-muted)] tracking-widest pb-2 border-b border-[var(--zed-border-light)]">Regular / Plantilla</p>
                                            {[
                                                { offense: '1st', penalty: 'Reprimand' },
                                                { offense: '2nd', penalty: 'Suspension (1-30d)' },
                                                { offense: '3rd', penalty: 'Dismissal' }
                                            ].map((p, i) => (
                                                <div key={i} className="flex justify-between items-center group">
                                                    <span className="text-xs text-[var(--zed-text-muted)] font-bold">{p.offense}</span>
                                                    <span className="text-xs font-black group-hover:text-[var(--zed-primary)] transition-colors">{p.penalty}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="space-y-4">
                                            <p className="text-[10px] font-black text-[var(--zed-text-muted)] tracking-widest pb-2 border-b border-[var(--zed-border-light)]">JO / COS</p>
                                            {[
                                                { offense: '1st', penalty: 'Written Warning' },
                                                { offense: '2nd', penalty: 'Reprimand' },
                                                { offense: '3rd', penalty: 'Termination' }
                                            ].map((p, i) => (
                                                <div key={i} className="flex justify-between items-center group">
                                                    <span className="text-xs text-[var(--zed-text-muted)] font-bold">{p.offense}</span>
                                                    <span className="text-xs font-black group-hover:text-[var(--zed-primary)] transition-colors">{p.penalty}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                         </div>
                    </PolicyCard>
                    )}

                    {/* 3. Violations & Discipline */}
                    {matchesSearch("Violations Discipline Absenteeism AWOL Termination") && (
                    <PolicyCard title="Violations & Discipline">
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 px-2">
                            {[
                                {
                                    title: "Habitual Absenteeism",
                                    desc: "Unauthorized absences > 2.5 days/month for 3 months.",
                                    regular: [{ label: "1st", penalty: "Suspension (6m 1d)" }, { label: "2nd", penalty: "Dismissal" }],
                                    contract: [{ label: "1st", penalty: "Reprimand" }, { label: "2nd", penalty: "Termination" }]
                                },
                                {
                                    title: "Habitual Tardiness",
                                    desc: "10+ times late per month for 2 months.",
                                    regular: [{ label: "1st", penalty: "Reprimand" }, { label: "2nd", penalty: "Suspension" }, { label: "3rd", penalty: "Dismissal" }],
                                    contract: [{ label: "1st", penalty: "Warning" }, { label: "2nd", penalty: "Reprimand" }, { label: "3rd", penalty: "Termination" }]
                                },
                                {
                                    title: "Habitual Undertime",
                                    desc: "10+ undertimes per month for 2 months.",
                                    regular: [{ label: "1st", penalty: "Reprimand" }, { label: "2nd", penalty: "Suspension" }, { label: "3rd", penalty: "Dismissal" }],
                                    contract: [{ label: "1st", penalty: "Warning" }, { label: "2nd", penalty: "Reprimand" }, { label: "3rd", penalty: "Termination" }]
                                },
                                {
                                    title: "AWOL Rule",
                                    desc: "30 consecutive working days continuous absence.",
                                    regular: [{ label: "Action", penalty: "Dropped from Rolls" }],
                                    contract: [{ label: "Action", penalty: "Immediate Termination" }]
                                }
                            ].map((category, idx) => (
                                <div key={idx} className="bg-white border border-[var(--zed-border-light)] rounded-[var(--radius-lg)] p-6 hover:border-[var(--zed-primary)] transition-all shadow-sm">
                                    <h4 className="text-lg font-black text-[var(--zed-text-dark)] mb-1">{category.title}</h4>
                                    <p className="text-xs text-[var(--zed-text-muted)] font-medium mb-6 italic">{category.desc}</p>
                                    
                                    <div className="grid grid-cols-2 gap-8 pt-4 border-t border-[var(--zed-border-light)]">
                                        <div className="space-y-3">
                                            <p className="text-[10px] font-black text-[var(--zed-primary)] tracking-widest">Regular</p>
                                            {category.regular.map((p, i) => (
                                                <div key={i} className="flex justify-between items-center text-xs">
                                                    <span className="font-bold text-[var(--zed-text-muted)]">{p.label}</span>
                                                    <span className="font-black text-[var(--zed-text-dark)]">{p.penalty}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="space-y-3">
                                            <p className="text-[10px] font-black text-[var(--zed-text-dark)] tracking-widest opacity-50">JO / COS</p>
                                            {category.contract.map((p, i) => (
                                                <div key={i} className="flex justify-between items-center text-xs">
                                                    <span className="font-bold text-[var(--zed-text-muted)]">{p.label}</span>
                                                    <span className="font-black text-[var(--zed-text-dark)]">{p.penalty}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        {/* AWOL Details */}
                        <div className="mt-8 p-8 bg-white border border-[var(--zed-border-light)] rounded-[var(--radius-lg)] relative overflow-hidden shadow-sm hover:border-[var(--zed-primary)] transition-all">
                             <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="md:col-span-1 border-r border-[var(--zed-border-light)] pr-6">
                                    <h3 className="text-lg font-bold mb-2">Performance Impact</h3>
                                    <p className="text-xs text-[var(--zed-text-muted)] leading-relaxed">
                                        Memo severities impose strict ceilings on the Performance Evaluation score.
                                    </p>
                                </div>
                                <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-bold text-[var(--zed-text-muted)] tracking-widest">Severity → Rating Ceiling</p>
                                        <div className="space-y-2">
                                            {[
                                                { sev: 'Minor (Reprimand)', ceiling: 'Max Score: 3 (Satisfactory)' },
                                                { sev: 'Moderate (Suspension)', ceiling: 'Max Score: 2 (Unsatisfactory)' },
                                                { sev: 'Major / Grave', ceiling: 'Max Score: 1 (Poor)' },
                                                { sev: 'Terminal (Dismissal)', ceiling: 'Score: 0 (Separated)' }
                                            ].map((item, i) => (
                                                <div key={i} className="flex justify-between border-b border-[var(--zed-border-light)] pb-2">
                                                    <span className="text-[11px] text-[var(--zed-text-muted)]">{item.sev}</span>
                                                    <span className="text-[11px] font-bold">{item.ceiling}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-bold text-[var(--zed-text-muted)] tracking-widest">AWOL Rule (CSC MC No. 38, s. 1993)</p>
                                        <div className="p-4 bg-white border border-[var(--zed-primary)] rounded-xl">
                                            <p className="text-[11px] font-bold text-[var(--zed-primary)] mb-1">30 Consecutive Days</p>
                                            <p className="text-[11px] text-[var(--zed-text-muted)] leading-relaxed">
                                                Employee who is continuously absent without approved leave for 30 working days shall be <strong className="text-[var(--zed-text-dark)]">dropped from the rolls</strong> without prior notice.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                             </div>
                        </div>
                    </PolicyCard>
                    )}

                    {/* 4. Leave Entitlements */}
                    {matchesSearch("Leave Entitlements Vacation Sick Maternity Paternity Solo Parent") && (
                    <PolicyCard title="Leave Entitlements">
                        <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6 px-2">
                            {[
                                { title: "Vacation Leave", filing: "5 working days prior", max: "Earned 1.25 days/month", remarks: "Advance filing required. Accrue 15 days annually. EO No. 292.", attachment: "None" },
                                { title: "Sick Leave", filing: "Within 3 days return", max: "Earned 1.25 days/month", remarks: "MedCert required if 5+ consecutive days. CSC MC No. 41, s. 1998.", attachment: "MedCert if ≥ 5 days" },
                                { title: "Forced Leave", filing: "5 working days prior", max: "5 days annually", remarks: "Must have 10 VL credits. Auto-deducted Dec 31st. Use-it-or-lose-it.", attachment: "None" },
                                { title: "Special Privilege", filing: "5 working days prior", max: "3 days annually", remarks: "Non-cumulative, non-convertible to cash. 3 apps per year.", attachment: "None" },
                                { title: "Special Emergency", filing: "Within 30 days", max: "5 days annually", remarks: "Only for declared state of calamity. RA 9263.", attachment: "None" },
                                { title: "Solo Parent", filing: "5 working days prior", max: "7 days annually", remarks: "Solo Parent ID required. RA 8972. Non-convertible.", attachment: "Solo Parent ID" },
                                { title: "Maternity Leave", filing: "30 calendar days prior", max: "105 days (normal)", remarks: "+15 days if solo parent. Can share 7 days with father. RA 11210.", attachment: "Medical Certificate" },
                                { title: "Paternity Leave", filing: "5 working days prior", max: "7 days", remarks: "For legally married males. First 4 deliveries. RA 8187.", attachment: "None" },
                                { title: "Adoption Leave", filing: "5 working days prior", max: "60 days", remarks: "DSWD placement authority required. RA 8552.", attachment: "DSWD Endorsement" },
                                { title: "Special Leave (Women)", filing: "5 working days prior", max: "Up to 2 months", remarks: "Gynecological surgery or related conditions. RA 9710.", attachment: "Medical Certificate" },
                                { title: "VAWC Leave (RA 9262)", filing: "Immediate", max: "10 days", remarks: "For victims of violence against women & children. Renewable.", attachment: "BPO/TPO/Police Report" },
                                { title: "Rehabilitation Leave", filing: "5 working days prior", max: "Subject to approval", remarks: "For work-related injuries or illnesses requiring rehabilitation.", attachment: "Medical Certificate" }
                            ].map((leave, idx) => (
                                <div key={idx} className="bg-white border border-[var(--zed-border-light)] p-6 flex flex-col h-full group hover:border-[var(--zed-primary)] rounded-[var(--radius-lg)] shadow-sm transition-all">
                                    <h3 className="text-sm font-black text-[var(--zed-text-dark)] mb-6 pb-2 border-b border-[var(--zed-border-light)]">{leave.title}</h3>
                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div>
                                            <p className="text-[9px] font-black text-[var(--zed-text-muted)] tracking-widest mb-1">Filing Window</p>
                                            <p className="text-xs font-black text-[var(--zed-text-dark)]">{leave.filing}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-[var(--zed-text-muted)] tracking-widest mb-1">Max Duration</p>
                                            <p className="text-xs font-black text-[var(--zed-primary)]">{leave.max}</p>
                                        </div>
                                    </div>
                                    {leave.attachment !== 'None' && (
                                        <div className="mb-4 p-2 bg-white border border-[var(--zed-border-light)] rounded-lg">
                                            <p className="text-[10px] text-[var(--zed-text-dark)] font-bold">📎 Required: {leave.attachment}</p>
                                        </div>
                                    )}
                                    <div className="mt-auto p-3 bg-white rounded-[var(--radius-md)] border border-[var(--zed-border-light)]">
                                            <p className="text-[10px] font-medium text-[var(--zed-text-muted)] italic leading-relaxed">{leave.remarks}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        {/* Leave Rules Summary */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                            <div className="p-6 bg-white border border-[var(--zed-border-light)] rounded-2xl shadow-sm flex items-start gap-4 hover:border-[var(--zed-primary)] transition-all">
                                <div className="w-1.5 h-12 bg-[var(--zed-primary)] rounded-full" />
                                <div>
                                    <h4 className="text-xs font-bold text-[var(--zed-text-dark)] mb-2 tracking-widest">Deemed Approved Rule</h4>
                                    <p className="text-[11px] text-[var(--zed-text-muted)] leading-relaxed font-medium">
                                        Any leave application pending action for <strong>5 or more working days</strong> is automatically deemed approved. (CSC MC No. 41, s. 1998, Section 49)
                                    </p>
                                </div>
                            </div>
                            <div className="p-6 bg-white border border-[var(--zed-border-light)] rounded-2xl shadow-sm flex items-start gap-4 hover:border-[var(--zed-primary)] transition-all">
                                <div className="w-1.5 h-12 bg-[var(--zed-primary)] opacity-50 rounded-full" />
                                <div>
                                    <h4 className="text-xs font-bold text-[var(--zed-text-dark)] mb-2 tracking-widest">Monthly Leave Accrual</h4>
                                    <p className="text-[11px] text-[var(--zed-text-muted)] leading-relaxed font-medium">
                                        Regular employees earn <strong>1.25 days VL + 1.25 days SL = 2.5 days/month</strong> (15 VL + 15 SL = 30 days/year). JO/COS do not earn leave credits. (EO No. 292)
                                    </p>
                                </div>
                            </div>
                        </div>
                    </PolicyCard>
                    )}

                    {/* 5. Plantilla & Employment Policies */}
                    {matchesSearch("Plantilla Employment Classification Permanent Temporary Casual Job Order COS Step Increments QS") && (
                    <PolicyCard title="Plantilla Policies">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-2">
                            <div className="space-y-6">
                                <div className="p-6 bg-white border border-[var(--zed-border-light)] rounded-[var(--radius-lg)] shadow-sm hover:border-[var(--zed-primary)] transition-all">
                                    <h3 className="text-sm font-bold text-gray-800 mb-6 border-l-4 border-[var(--zed-primary)] pl-3 tracking-widest">Employment Classification</h3>
                                    <div className="space-y-4">
                                        <p className="text-[11px] text-[var(--zed-text-muted)] leading-relaxed font-medium">
                                            Each appointment type determines the employee's duty schedule, penalty track, and leave credit eligibility.
                                        </p>
                                        <div className="overflow-x-auto">
                                            <table className="w-full border-none">
                                                <thead className="bg-white border-none">
                                                    <tr>
                                                        <th className="text-left py-3 px-4 text-gray-400 font-bold text-[10px] whitespace-nowrap tracking-widest border-none">Type</th>
                                                        <th className="text-left py-3 px-4 text-gray-400 font-bold text-[10px] whitespace-nowrap tracking-widest border-none">Duty</th>
                                                        <th className="text-left py-3 px-4 text-gray-400 font-bold text-[10px] whitespace-nowrap tracking-widest border-none">Penalty Track</th>
                                                        <th className="text-left py-3 px-4 text-gray-400 font-bold text-[10px] whitespace-nowrap tracking-widest border-none">Leave</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="border-none">
                                                    {[
                                                        { type: 'Permanent', duty: 'Standard', track: 'Regular', leave: 'Available' },
                                                        { type: 'Temporary', duty: 'Standard', track: 'Regular', leave: 'Available' },
                                                        { type: 'Contractual', duty: 'Standard', track: 'Regular', leave: 'Available' },
                                                        { type: 'Casual', duty: 'Irregular', track: 'JO / COS', leave: 'Available' },
                                                        { type: 'Job Order', duty: 'Irregular', track: 'JO / COS', leave: 'N/A' },
                                                        { type: 'COS', duty: 'Irregular', track: 'JO / COS', leave: 'N/A' }
                                                    ].map((row, i) => (
                                                        <tr key={i} className="border-b border-[var(--zed-border-light)] last:border-0">
                                                            <td className="py-3 px-4 font-bold text-gray-800">{row.type}</td>
                                                            <td className="py-3 px-4 text-gray-600">{row.duty}</td>
                                                            <td className="py-3 px-4"><span className="text-[10px] font-black px-2 py-0.5 border border-[var(--zed-border-light)] rounded">{row.track}</span></td>
                                                            <td className="py-3 px-4 text-gray-400 font-bold">{row.leave}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="p-6 bg-white border border-[var(--zed-border-light)] rounded-[var(--radius-lg)] shadow-sm flex items-start gap-4 hover:border-[var(--zed-primary)] transition-all">
                                    <div className="w-1.5 h-12 bg-[var(--zed-primary)] rounded-full" />
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-800 mb-2 tracking-widest">Step Increments</h3>
                                        <p className="text-[11px] text-[var(--zed-text-muted)] font-medium leading-relaxed">
                                            Granted every 3 years of continuous satisfactory service. LWOP Policy: Any period of Leave Without Pay shall delay the anniversary by corresponding days.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="p-6 bg-white border border-[var(--zed-border-light)] rounded-[var(--radius-lg)] shadow-sm hover:border-[var(--zed-primary)] transition-all">
                                    <h3 className="text-sm font-bold text-gray-800 mb-6 border-l-4 border-[var(--zed-primary)] pl-3 tracking-widest">Qualification Standards</h3>
                                    <div className="space-y-4">
                                        {[
                                            { title: "Education", desc: "Formal academic degree required for the specific position." },
                                            { title: "Experience", desc: "Relevant years of practice in the field or similar duties." },
                                            { title: "Training", desc: "Mandatory number of hours in accredited learning programs." },
                                            { title: "Eligibility", desc: "CS Professional, RA 1080, or other certifications." }
                                        ].map((qs, i) => (
                                            <div key={i} className="flex gap-4 items-start pb-4 border-b border-[var(--zed-border-light)] last:border-0 last:pb-0">
                                                <div className="w-2 h-2 rounded-full bg-[var(--zed-border-light)] mt-1.5 shrink-0" />
                                                <div>
                                                    <h4 className="text-[11px] font-bold text-gray-800 tracking-wider">{qs.title}</h4>
                                                    <p className="text-[11px] text-[var(--zed-text-muted)] leading-tight font-medium mt-0.5">{qs.desc}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-8 p-4 bg-white border border-[var(--zed-primary)] rounded-xl text-[var(--zed-text-dark)] shadow-sm">
                                        <p className="text-[10px] font-bold text-[var(--zed-primary)] mb-2 uppercase tracking-widest">Audit Compliance</p>
                                        <p className="text-[11px] leading-relaxed italic font-medium">
                                            "Positions must match the DBM PSIPOP report exactly. Any deviation triggers audit findings from COA."
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </PolicyCard>
                    )}

                    {/* 6. CSC Circulars */}
                    {matchesSearch("CSC Circulars References MC 2017 2010 Administrative Code") && (
                    <PolicyCard title="CSC Circulars & References">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-2">
                            <div className="p-8 border border-[var(--zed-border-light)] rounded-2xl bg-white shadow-sm space-y-6 hover:border-[var(--zed-primary)] transition-all">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-[var(--zed-text-muted)] tracking-widest">Mc No. 1, s. 2017</span>
                                    <h4 className="text-base font-bold text-gray-800 tracking-tight uppercase">2017-Raccs: Habitual Offenses</h4>
                                </div>
                                <div className="space-y-4">
                                    <div className="p-4 bg-white border border-[var(--zed-border-light)] rounded-xl shadow-sm">
                                        <p className="text-[11px] font-bold text-[var(--zed-text-dark)] mb-2 tracking-tighter">Habitually Absent</p>
                                        <p className="text-xs text-[var(--zed-text-muted)] leading-relaxed font-medium">
                                            Unauthorized absences exceeding the allowable 2.5 days monthly leave credit for 3 months in a semester or 3 consecutive months.
                                        </p>
                                    </div>
                                    <div className="p-4 bg-white border border-[var(--zed-border-light)] rounded-xl shadow-sm">
                                        <p className="text-[11px] font-bold text-[var(--zed-text-dark)] mb-2 tracking-tighter">Habitually Tardy</p>
                                        <p className="text-xs text-[var(--zed-text-muted)] leading-relaxed font-medium">
                                            Late ten (10) times a month for at least two (2) months in a semester or two (2) consecutive months.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="p-8 border border-[var(--zed-border-light)] rounded-2xl bg-white shadow-sm flex items-start gap-4 hover:border-[var(--zed-primary)] transition-all">
                                    <div className="w-1.5 h-12 bg-[var(--zed-primary)] rounded-full" />
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-800 mb-1 tracking-widest">Habitual Undertime Policy</h4>
                                        <p className="text-xs text-[var(--zed-text-muted)] leading-relaxed italic font-medium">
                                            "Regardless of minutes, ten (10) times a month for 2 months in a semester or 2 consecutive months." (Mc No. 16, s. 2010)
                                        </p>
                                    </div>
                                </div>

                                <div className="p-8 border border-[var(--zed-border-light)] rounded-2xl bg-white shadow-sm space-y-4 hover:border-[var(--zed-primary)] transition-all">
                                    <h4 className="text-sm font-bold text-gray-800 tracking-widest">Tardiness / Undertime Deduction</h4>
                                    <div className="p-4 bg-white border border-[var(--zed-border-light)] rounded-xl shadow-sm">
                                        <p className="text-xs text-[var(--zed-primary)] font-black mb-2 tracking-tighter">Total Minutes ÷ 480 = Days Equivalent</p>
                                        <p className="text-[11px] text-[var(--zed-text-muted)] leading-relaxed font-medium">
                                            Morning late and afternoon early departure are combined and deducted from VL, then LWOP.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </PolicyCard>
                    )}

                </div>
            )}

            <footer className="mt-20 py-10 border-t border-[var(--zed-border-light)] text-center">
                <div className="inline-flex items-center gap-3 px-6 py-2 bg-white border border-[var(--zed-border-light)] rounded-full shadow-sm">
                    <div className="w-2 h-2 rounded-full bg-[var(--zed-primary)] animate-pulse" />
                    <p className="text-[10px] font-black text-[var(--zed-text-muted)] tracking-[0.3em]">
                        Official City Human Resource Management Officer Standard Official &copy; {new Date().getFullYear()}
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default InternalPoliciesPage;
