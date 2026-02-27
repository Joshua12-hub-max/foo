import React, { useState, useEffect } from 'react';
import { useUIStore } from '@/stores';
import { getPolicies, type InternalPolicy } from '@/api/policyApi';
import { Loader2, Clock, AlertTriangle, ShieldAlert, FileText, CalendarDays, Briefcase, Info, CheckCircle2, ChevronRight, FileWarning } from 'lucide-react';

interface Tab {
  id: string;
  label: string;
  icon: React.ReactNode;
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
        { id: 'hours', label: 'Working Hours', icon: <Clock className="w-4 h-4" /> },
        { id: 'tardiness', label: 'Tardiness Rules', icon: <AlertTriangle className="w-4 h-4" /> },
        { id: 'penalties', label: 'Violations & Penalties', icon: <ShieldAlert className="w-4 h-4" /> },
        { id: 'csc', label: 'CSC Circulars', icon: <FileText className="w-4 h-4" /> },
        { id: 'leave', label: 'Leave Policies', icon: <CalendarDays className="w-4 h-4" /> },
        { id: 'plantilla', label: 'Plantilla Policies', icon: <Briefcase className="w-4 h-4" /> }
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
        <div className={`flex flex-col bg-white rounded-3xl shadow-sm border border-gray-100 p-8 w-full overflow-hidden transition-all duration-300 animate-in fade-in duration-500`}>
            
            {/* Header Section */}
            {!hideHeader && (
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Internal Policies</h1>
                    <p className="text-sm text-gray-500 mt-1">Comprehensive guidelines and regulations governing professional standards.</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="px-4 py-1.5 bg-gray-900 text-white rounded-full text-xs font-semibold tracking-wide shadow-sm">
                        {policies.length > 0 && policies[0].versionLabel ? policies[0].versionLabel : 'Office Order 164-2025'}
                    </span>
                </div>
            </div>
            )}

            {/* Modern Pill Navigation */}
            <div className="flex flex-wrap gap-3 mb-10 pb-6 border-b border-gray-100">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
                                isActive
                                    ? 'bg-gray-900 text-white shadow-md shadow-gray-900/10 scale-[1.02]'
                                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-gray-100/50'
                            }`}
                        >
                            <span className={`${isActive ? 'text-white' : 'text-gray-400'}`}>{tab.icon}</span>
                            {tab.label}
                        </button>
                    )
                })}
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-24 animate-pulse">
                    <Loader2 className="w-10 h-10 text-gray-900 animate-spin mb-4" />
                    <p className="text-sm text-gray-500 font-medium tracking-wide">Retrieving official policies...</p>
                </div>
            ) : false /* policies.length > 0 */ ? (
                <div className="w-full animate-in fade-in duration-500">
                    {policies.map(policy => (
                        <div key={policy.id} className="prose prose-base max-w-none prose-gray">
                             <div dangerouslySetInnerHTML={{ __html: policy.content }} />
                        </div>
                    ))}
                </div>
            ) : (
                /* Fallback to original static content if database is empty */
                <div className="w-full h-full relative">

                    {activeTab === 'hours' && (
                        <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                            
                            {/* Left Column */}
                            <div className="lg:col-span-1 space-y-8">
                                <section className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                                    <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-4">
                                        <Info className="w-4 h-4 text-gray-400" />
                                        Legal Basis
                                    </h3>
                                    <p className="text-sm text-gray-600 leading-relaxed font-medium">
                                        Book V, Executive Order no. 292 Rule XVII Section 5
                                    </p>
                                </section>
                                
                                <section className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm shadow-gray-100/50">
                                    <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-6">
                                        <Clock className="w-4 h-4 text-emerald-500" />
                                        Schedule Overview
                                    </h3>
                                    <div className="space-y-5">
                                        <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl">
                                            <span className="text-sm font-medium text-gray-600">Daily Minimum</span>
                                            <span className="text-sm font-bold text-gray-900">8 Hours</span>
                                        </div>
                                        <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl">
                                            <span className="text-sm font-medium text-gray-600">Weekly Total</span>
                                            <span className="text-sm font-bold text-gray-900">40 Hours</span>
                                        </div>
                                        <div className="pt-2">
                                            <p className="text-xs text-gray-500 leading-relaxed flex gap-2">
                                                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                                Excludes lunch break. Must be observed with maximum regularity.
                                            </p>
                                        </div>
                                    </div>
                                </section>
                            </div>

                            {/* Right Column */}
                            <div className="lg:col-span-2 space-y-10">
                                <section>
                                    <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                        <Briefcase className="w-5 h-5 text-indigo-500" />
                                        Standard Operations & Working Hours
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* General Rule */}
                                        <div className="p-6 border border-gray-100 rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow">
                                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold mb-6">
                                                General Rule (Standard Duties)
                                            </div>
                                            <div className="space-y-3 mb-6">
                                                <p className="text-xl font-extrabold text-gray-900 flex items-center justify-between">
                                                    08:00 AM <ChevronRight className="w-4 h-4 text-gray-300"/> 12:00 NN
                                                </p>
                                                <p className="text-xl font-extrabold text-gray-900 flex items-center justify-between">
                                                    01:00 PM <ChevronRight className="w-4 h-4 text-gray-300"/> 05:00 PM
                                                </p>
                                            </div>
                                            <p className="text-xs font-semibold text-gray-500 flex items-center gap-1.5 border-t border-gray-50 pt-4">
                                                <CalendarDays className="w-3.5 h-3.5" /> Regular Work Week (Mon-Fri)
                                            </p>
                                        </div>

                                        {/* Special Rule */}
                                        <div className="p-6 border border-gray-100 rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow">
                                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold mb-6">
                                                Special Rule (Irregular Duties)
                                            </div>
                                            
                                            <div className="bg-gray-50 rounded-xl p-4 mb-5">
                                                <p className="text-sm font-bold text-gray-900 mb-1">Target Hours Mode</p>
                                                <p className="text-xs text-gray-600 leading-relaxed">
                                                    Flexible schedule assigned by dept head. System tracks rendered hours against daily target (8 hours).
                                                </p>
                                            </div>
                                            
                                            <div className="space-y-3 border-t border-gray-50 pt-4">
                                                {[
                                                    { label: 'Late Calculation', val: 'Not Applicable' },
                                                    { label: 'Undertime', val: 'Target - Rendered' },
                                                    { label: 'Lunch Deduction', val: '1hr (if > 5h rendered)' }
                                                ].map((row, i) => (
                                                    <div key={i} className="flex items-center justify-between text-xs">
                                                        <span className="text-gray-500 font-medium">{row.label}</span>
                                                        <span className="font-bold text-gray-900">{row.val}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                <section>
                                    <h3 className="text-base font-bold text-gray-900 mb-5 flex items-center gap-2">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                        Standard Protocols
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {[
                                            { title: "Time Tracking", desc: "Digital logging via official biometric machines." },
                                            { title: "Business Slips", desc: "Use Locator/Pass Slips for all movements outside." },
                                            { title: "Leave Filing", desc: "Regulars file via app; JO/COS notify supervisor." },
                                            { title: "Professionalism", desc: "Report on time; avoid unauthorized departures." }
                                        ].map((item, idx) => (
                                            <div key={idx} className="p-5 bg-white border border-gray-100 rounded-xl flex items-start gap-3 shadow-sm hover:border-gray-300 transition-colors">
                                                <div className="w-1.5 h-1.5 rounded-full bg-gray-900 mt-2 shrink-0" />
                                                <div>
                                                    <h4 className="text-sm font-bold text-gray-900 mb-1">{item.title}</h4>
                                                    <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
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
                        <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">
                            
                            <section className="bg-gray-900 text-white rounded-3xl p-8 relative overflow-hidden shadow-lg">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                                <div className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none" />
                                
                                <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12">
                                    <div>
                                        <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                                            <FileWarning className="w-5 h-5 text-amber-400" />
                                            Definitions (CSC MC 17, s.2010)
                                        </h3>
                                        <p className="text-sm text-gray-400 mb-8 leading-relaxed">
                                            Official definitions of civil service time infractions.
                                        </p>
                                        
                                        <div className="space-y-6">
                                            <div className="bg-white/5 border border-white/10 p-5 rounded-2xl">
                                                <h4 className="text-sm font-bold text-white mb-2 flex items-center justify-between">
                                                    Tardiness (Late)
                                                    <span className="text-xs font-semibold px-2 py-1 bg-amber-500/20 text-amber-300 rounded-full">Arrival</span>
                                                </h4>
                                                <p className="text-sm text-gray-400 leading-relaxed">
                                                    Reporting for work after the prescribed time (8:00 AM). Counted from minute 1.
                                                </p>
                                            </div>
                                            <div className="bg-white/5 border border-white/10 p-5 rounded-2xl">
                                                <h4 className="text-sm font-bold text-white mb-2 flex items-center justify-between">
                                                    Undertime
                                                    <span className="text-xs font-semibold px-2 py-1 bg-rose-500/20 text-rose-300 rounded-full">Departure</span>
                                                </h4>
                                                <p className="text-sm text-gray-400 leading-relaxed">
                                                    Leaving before the prescribed end of hours (5:00 PM). A single day can be both tardy and undertime.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-col justify-center">
                                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                                            <h4 className="text-sm font-bold text-white mb-4">Deduction Formula</h4>
                                            <p className="text-lg font-extrabold text-white mb-4">Total Minutes ÷ 480 <span className="text-gray-400 font-medium text-sm">= Days</span></p>
                                            <p className="text-sm text-gray-400 leading-relaxed">
                                                480 mins = 8 hours (1 day). Late + Undertime are combined and strictly deducted from <strong>Vacation Leave</strong> first, then LWOP.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
                                <h3 className="text-xl font-bold text-gray-900 mb-8 flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-rose-500" />
                                    Habitual Tardiness / Undertime
                                </h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                                    <div className="flex items-center gap-4 p-5 bg-rose-50 border border-rose-100 rounded-2xl">
                                        <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center shrink-0">
                                            <span className="text-rose-600 font-bold text-lg">10</span>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-gray-900">Threshold</h4>
                                            <p className="text-sm text-gray-600">10 or more times per month</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 p-5 bg-rose-50 border border-rose-100 rounded-2xl">
                                        <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center shrink-0">
                                            <span className="text-rose-600 font-bold text-lg">2</span>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-gray-900">Trigger Duration</h4>
                                            <p className="text-sm text-gray-600">Months in a semester (or consecutive)</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="border border-gray-100 rounded-2xl p-6 bg-gray-50/50">
                                        <h4 className="text-sm font-extrabold text-indigo-600 uppercase tracking-wide mb-6">Regular / Plantilla Penalties</h4>
                                        <div className="space-y-4">
                                            {[
                                                { offense: '1st Offense', penalty: 'Reprimand (Stern Warning)' },
                                                { offense: '2nd Offense', penalty: 'Suspension 1-30 days' },
                                                { offense: '3rd Offense', penalty: 'Dismissal from Service', terminal: true }
                                            ].map((p, i) => (
                                                <div key={i} className={`flex justify-between items-center p-4 rounded-xl ${p.terminal ? 'bg-rose-50 border border-rose-100' : 'bg-white border border-gray-100'}`}>
                                                    <span className="text-sm text-gray-500 font-medium">{p.offense}</span>
                                                    <span className={`text-sm font-bold ${p.terminal ? 'text-rose-700' : 'text-gray-900'}`}>{p.penalty}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <div className="border border-gray-100 rounded-2xl p-6 bg-gray-50/50">
                                        <h4 className="text-sm font-extrabold text-amber-600 uppercase tracking-wide mb-6">JO / COS Penalties</h4>
                                        <div className="space-y-4">
                                            {[
                                                { offense: '1st Offense', penalty: 'Written Warning' },
                                                { offense: '2nd Offense', penalty: 'Reprimand' },
                                                { offense: '3rd Offense', penalty: 'Termination of Contract', terminal: true }
                                            ].map((p, i) => (
                                                <div key={i} className={`flex justify-between items-center p-4 rounded-xl ${p.terminal ? 'bg-rose-50 border border-rose-100' : 'bg-white border border-gray-100'}`}>
                                                    <span className="text-sm text-gray-500 font-medium">{p.offense}</span>
                                                    <span className={`text-sm font-bold ${p.terminal ? 'text-rose-700' : 'text-gray-900'}`}>{p.penalty}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>
                    )}

                    {activeTab === 'penalties' && (
                        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                            
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                                {[
                                    {
                                        title: "Habitual Absenteeism",
                                        desc: "Unauthorized absences > 2.5 days/month for 3 months in semester (CSC MC 1, 2017)",
                                        regular: ["Suspension 6mo-1yr", "Dismissal"],
                                        contract: ["Reprimand", "Termination"]
                                    },
                                    {
                                        title: "Habitual Tardiness",
                                        desc: "10+ late arrivals/month for 2 months in semester (CSC MC 1, 2017)",
                                        regular: ["Reprimand", "Suspension 1-30d", "Dismissal"],
                                        contract: ["Warning", "Reprimand", "Termination"]
                                    },
                                    {
                                        title: "Habitual Undertime (Simple)",
                                        desc: "10+ undertimes/month for 2 months in semester. Default class.",
                                        regular: ["Reprimand", "Suspension 1-30d", "Dismissal"],
                                        contract: ["Warning", "Reprimand", "Termination"]
                                    },
                                    {
                                        title: "Undertime (Prejudicial)",
                                        desc: "Affects public service delivery. Requires admin tagging.",
                                        regular: ["Suspension 6mo-1yr", "Dismissal"],
                                        contract: ["Reprimand", "Termination"]
                                    }
                                ].map((cat, idx) => (
                                    <div key={idx} className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                        <div className="px-6 py-5 bg-gray-50 border-b border-gray-100">
                                            <h3 className="text-base font-bold text-gray-900">{cat.title}</h3>
                                            <p className="text-xs text-gray-500 mt-1">{cat.desc}</p>
                                        </div>
                                        <div className="p-6 grid grid-cols-2 gap-6">
                                            <div>
                                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Regular / Plantilla</h4>
                                                <div className="space-y-2">
                                                    {cat.regular.map((p, i) => (
                                                        <div key={i} className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded-lg text-sm">
                                                            <span className="text-gray-500 text-xs">{i+1}{['st','nd','rd'][i] || 'th'}</span>
                                                            <span className="font-bold text-gray-900 text-right">{p}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">JO / COS</h4>
                                                <div className="space-y-2">
                                                    {cat.contract.map((p, i) => (
                                                        <div key={i} className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded-lg text-sm">
                                                            <span className="text-gray-500 text-xs">{i+1}{['st','nd','rd'][i] || 'th'}</span>
                                                            <span className="font-bold text-gray-900 text-right">{p}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* AWOL & Ratings */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="bg-gray-900 text-white rounded-3xl p-8 shadow-md">
                                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                                        <ShieldAlert className="w-5 h-5 text-indigo-400" />
                                        Performance Rating Impact
                                    </h3>
                                    <div className="space-y-3">
                                        {[
                                            { sev: 'Minor Memo (Reprimand)', cap: 'Max 3 (Satisfactory)' },
                                            { sev: 'Moderate Memo (Suspension)', cap: 'Max 2 (Unsatisfactory)' },
                                            { sev: 'Major / Grave Memo', cap: 'Max 1 (Poor)' }
                                        ].map((item, i) => (
                                            <div key={i} className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/10">
                                                <span className="text-sm text-gray-300">{item.sev}</span>
                                                <span className="text-sm font-bold text-white">{item.cap}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-rose-50 border border-rose-100 rounded-3xl p-8">
                                    <h3 className="text-lg font-bold text-rose-900 mb-6 flex items-center gap-2">
                                        <AlertTriangle className="w-5 h-5 text-rose-500" />
                                        AWOL Rule (CSC MC 38, 1993)
                                    </h3>
                                    <div className="bg-white rounded-2xl p-6 shadow-sm">
                                        <p className="text-3xl font-extrabold text-rose-600 mb-2">30 Days</p>
                                        <p className="text-sm text-gray-700 font-bold mb-2">Consecutive unauthorized absences</p>
                                        <p className="text-sm text-gray-600 leading-relaxed">
                                            An employee who is continuously absent without approved leave for 30 working days shall be <strong className="text-rose-600">dropped from the rolls</strong> immediately without prior notice.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'csc' && (
                        <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {[
                                    { mc: "MC 1, s. 2017", title: "Habitual Offenses", body: "Defines habitual tracking: >2.5 days absent for 3 months, or 10+ lates for 2 months triggers offenses." },
                                    { mc: "MC 16, s. 2010", title: "Undertime Policy", body: "Formalizes undertime rules, splitting into simple misconduct vs prejudicial to public service." },
                                    { mc: "MC 17, s. 2010", title: "Tardiness Deductions", body: "Mandates formula: Total minutes / 480 = Days deducted from Vacation Leave." },
                                    { mc: "MC 41, s. 1998", title: "Omnibus Leave Rules", body: "Requires advance filing for VL. Auto-approval if pending 5 days. Forced 5-day annual leave." },
                                    { mc: "MC 38, s. 1993", title: "AWOL Processing", body: "30 consecutive days of unauthorized absences results in being dropped from the rolls." },
                                    { mc: "EO No. 292", title: "Admin Code Credits", body: "Regulars earn 1.25 VL + 1.25 SL per month. Contract of Service do not earn leave credits." }
                                ].map((doc, idx) => (
                                    <div key={idx} className="bg-white p-6 border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                                        <div className="inline-block px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold mb-4">
                                            {doc.mc}
                                        </div>
                                        <h4 className="text-base font-bold text-gray-900 mb-2">{doc.title}</h4>
                                        <p className="text-sm text-gray-600 leading-relaxed">{doc.body}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'leave' && (
                        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {[
                                    { title: "Vacation Leave", req: "5 days prior", limits: "15d/year", attach: false },
                                    { title: "Sick Leave", req: "Within 3 days", limits: "15d/year", attach: "MedCert if ≥5d" },
                                    { title: "Forced Leave", req: "5 days prior", limits: "5d annually", attach: false },
                                    { title: "SPL", req: "5 days prior", limits: "3d annually", attach: false },
                                    { title: "Emergency", req: "Within 30d", limits: "5 days", attach: false },
                                    { title: "Solo Parent", req: "5 days prior", limits: "7d annually", attach: "ID Required" },
                                    { title: "Maternity", req: "30 days prior", limits: "105 days", attach: "MedCert" },
                                    { title: "Paternity", req: "5 days prior", limits: "7 days", attach: false },
                                    { title: "Adoption", req: "5 days prior", limits: "60 days", attach: "DSWD Form" },
                                    { title: "Women's SPL", req: "5 days prior", limits: "Up to 2mo", attach: "MedCert" },
                                    { title: "VAWC", req: "Immediate", limits: "10 days", attach: "BPO/Police" },
                                    { title: "Rehab", req: "5 days prior", limits: "As needed", attach: "MedCert" }
                                ].map((leave, idx) => (
                                    <div key={idx} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:border-gray-300 transition-colors flex flex-col h-full">
                                        <h3 className="text-sm font-bold text-gray-900 mb-4">{leave.title}</h3>
                                        <div className="space-y-3 flex-1">
                                            <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-2">
                                                <span className="text-gray-500">Notice</span>
                                                <span className="font-semibold text-gray-900">{leave.req}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-2">
                                                <span className="text-gray-500">Duration</span>
                                                <span className="font-semibold text-gray-900">{leave.limits}</span>
                                            </div>
                                            {leave.attach && (
                                                <div className="mt-auto px-3 py-2 bg-amber-50 rounded-lg">
                                                    <span className="text-xs font-bold text-amber-700">📎 {leave.attach}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-3xl border border-gray-100">
                                <div>
                                    <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                        Deemed Approved Rule
                                    </h4>
                                    <p className="text-sm text-gray-600 leading-relaxed">
                                        Any leave pending action for 5 working days is automatically deemed approved.
                                    </p>
                                </div>
                                <div className="md:pl-6 md:border-l border-gray-200">
                                    <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                                        <CalendarDays className="w-4 h-4 text-indigo-500" />
                                        Monthly Accrual
                                    </h4>
                                    <p className="text-sm text-gray-600 leading-relaxed">
                                        Regular staff earn 1.25 VL + 1.25 SL = 2.5 days per month (30/year).
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'plantilla' && (
                        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                            
                            <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
                                <div className="px-8 py-6 bg-gray-50 border-b border-gray-100">
                                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                        <Briefcase className="w-5 h-5 text-indigo-500" />
                                        Employment Classification Matrix
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-2">Appointment type determines scheduling, penalty paths, and leave eligibility.</p>
                                </div>
                                <div className="p-0 overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-white border-b border-gray-100">
                                                <th className="text-left font-bold text-gray-400 uppercase tracking-wide py-4 px-8">Appointment Type</th>
                                                <th className="text-left font-bold text-gray-400 uppercase tracking-wide py-4 px-8">Duty Schedule</th>
                                                <th className="text-left font-bold text-gray-400 uppercase tracking-wide py-4 px-8">Penalty Track</th>
                                                <th className="text-left font-bold text-gray-400 uppercase tracking-wide py-4 px-8">Leave Credits</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {[
                                                { type: 'Permanent', duty: 'Standard', track: 'Regular', leave: true },
                                                { type: 'Temporary', duty: 'Standard', track: 'Regular', leave: true },
                                                { type: 'Contractual', duty: 'Standard', track: 'Regular', leave: true },
                                                { type: 'Coterminous', duty: 'Standard', track: 'Regular', leave: true },
                                                { type: 'Casual', duty: 'Irregular', track: 'JO/COS', leave: true },
                                                { type: 'Job Order (JO)', duty: 'Irregular', track: 'JO/COS', leave: false },
                                                { type: 'Contract of Service', duty: 'Irregular', track: 'JO/COS', leave: false }
                                            ].map((row, i) => (
                                                <tr key={i} className="bg-white hover:bg-gray-50 transition-colors">
                                                    <td className="py-4 px-8 font-bold text-gray-900">{row.type}</td>
                                                    <td className="py-4 px-8 text-gray-600 font-medium">{row.duty}</td>
                                                    <td className="py-4 px-8">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${row.track === 'Regular' ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50 text-amber-700'}`}>
                                                            {row.track}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-8">
                                                        {row.leave ? (
                                                            <div className="flex items-center gap-2 text-emerald-600 font-bold"><CheckCircle2 className="w-4 h-4"/> Yes</div>
                                                        ) : (
                                                            <div className="flex items-center gap-2 text-rose-500 font-bold">No</div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
                                    <h4 className="text-base font-bold text-gray-900 mb-6 flex items-center gap-2">
                                        <CheckCircle2 className="w-5 h-5 text-indigo-500" />
                                        Qualification Standards (QS)
                                    </h4>
                                    <div className="space-y-5">
                                        {[
                                            { t: "Education", d: "Academic degree required." },
                                            { t: "Experience", d: "Relevant years of practice." },
                                            { t: "Training", d: "Mandatory learning hours." },
                                            { t: "Eligibility", d: "CS Professional / RA 1080." }
                                        ].map((q, i) => (
                                            <div key={i} className="flex justify-between items-center text-sm border-b border-gray-50 pb-3">
                                                <span className="text-gray-500 font-medium">{q.t}</span>
                                                <span className="font-semibold text-gray-900">{q.d}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-6 p-4 bg-rose-50 rounded-xl text-rose-900 text-sm font-medium">
                                        Requires strict match with DBM PSIPOP report.
                                    </div>
                                </div>
                                
                                <div className="bg-gray-50 border border-gray-100 rounded-3xl p-8">
                                    <h4 className="text-base font-bold text-gray-900 mb-6 flex items-center gap-2">
                                        <CalendarDays className="w-5 h-5 text-emerald-500" />
                                        Step Increments
                                    </h4>
                                    <p className="text-sm text-gray-600 leading-relaxed mb-6">
                                        Granted every 3 years of continuous satisfactory service in the same position.
                                    </p>
                                    <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100">
                                        <p className="text-sm font-bold text-amber-900 mb-2">LWOP Delay</p>
                                        <p className="text-sm text-amber-800 leading-relaxed">
                                            Any period of Leave Without Pay (LWOP) will delay the 3rd year anniversary by corresponding days.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default InternalPoliciesPage;
