import React, { useEffect, useState } from 'react';
import { inquiryApi, Inquiry } from '@/api/inquiryApi';
import { useToastStore } from '@/stores';
import { CheckCircle, Clock, Trash2, Search, Send, X, Loader2 } from 'lucide-react';
import ConfirmDialog from '@/components/Custom/Shared/ConfirmDialog';

const PublicInquiries: React.FC = () => {
    const [inquiries, setInquiries] = useState<Inquiry[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('All');
    const showToast = useToastStore((state) => state.showToast);
    
    // Custom Confirm Modal State
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        idToDelete: 0
    });

    // Reply Modal State
    const [replyModal, setReplyModal] = useState({
        isOpen: false,
        inquiryId: 0,
        email: '',
        name: '',
        message: '',
        replyText: ''
    });
    const [replying, setReplying] = useState(false);

    const fetchInquiries = async () => {
        try {
            setLoading(true);
            const response = await inquiryApi.getAll();
            if (response.data.success) {
                setInquiries(response.data.inquiries);
            }
        } catch (error) {
            console.error('Failed to fetch inquiries:', error);
            showToast('Failed to load inquiries', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInquiries();
    }, []);

    const handleUpdateStatus = async (id: number, status: string) => {
        try {
            const response = await inquiryApi.updateStatus(id, { status });
            if (response.data.success) {
                showToast(`Inquiry marked as ${status}`, 'success');
                fetchInquiries();
            }
        } catch (error) {
            showToast('Failed to update status', 'error');
        }
    };

    const handleDelete = async (id: number) => {
        setConfirmModal({ isOpen: true, idToDelete: id });
    };

    const handleReply = async (inq: Inquiry) => {
        setReplyModal({
            isOpen: true,
            inquiryId: inq.id,
            email: inq.email,
            name: `${inq.firstName} ${inq.lastName}`,
            message: inq.message,
            replyText: ''
        });
    };

    const confirmReply = async () => {
        if (!replyModal.replyText.trim()) {
            showToast('Please enter a reply message', 'error');
            return;
        }

        try {
            setReplying(true);
            const response = await inquiryApi.reply(replyModal.inquiryId, replyModal.replyText);
            if (response.data.success) {
                showToast('Reply sent successfully', 'success');
                fetchInquiries();
                setReplyModal(prev => ({ ...prev, isOpen: false }));
            }
        } catch (error) {
            showToast('Failed to send reply', 'error');
        } finally {
            setReplying(false);
        }
    };

    const confirmDelete = async () => {
        const id = confirmModal.idToDelete;
        if (!id) return;
        
        try {
            const response = await inquiryApi.delete(id);
            if (response.data.success) {
                showToast('Inquiry deleted', 'success');
                fetchInquiries();
            }
        } catch (error) {
            showToast('Failed to delete inquiry', 'error');
        } finally {
            setConfirmModal({ isOpen: false, idToDelete: 0 });
        }
    };

    const filteredInquiries = inquiries.filter(inq => {
        const matchesSearch = 
            `${inq.firstName} ${inq.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inq.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inq.message.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = statusFilter === 'All' || inq.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-8 relative z-10">
            <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="relative flex-1 min-w-[300px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--zed-text-muted)]" size={18} />
                    <input
                        type="text"
                        placeholder="Search inquiries..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white border border-[var(--zed-border-light)] rounded-[var(--radius-lg)] focus:outline-none focus:ring-4 focus:ring-[var(--zed-primary)]/10 focus:border-[var(--zed-primary)] text-sm font-medium transition-all"
                    />
                </div>
                <div className="flex items-center gap-1 bg-white border border-[var(--zed-border-light)] rounded-[var(--radius-lg)] p-1.5 shadow-sm">
                    {['All', 'Pending', 'Read', 'Replied'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-5 py-2 rounded-[var(--radius-sm)] text-[10px] font-black tracking-widest uppercase transition-all ${
                                statusFilter === status
                                    ? 'bg-[var(--zed-primary)] text-white shadow-md'
                                    : 'text-[var(--zed-text-muted)] hover:text-[var(--zed-primary)] hover:bg-[var(--zed-bg-surface)]'
                            }`}
                        >
                            {status === 'All' ? 'All Records' : status}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-[var(--zed-border-light)] border-t-[var(--zed-primary)]"></div>
                </div>
            ) : filteredInquiries.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-[var(--radius-lg)] border border-[var(--zed-border-light)] shadow-sm">
                    <p className="text-xs font-black text-[var(--zed-text-muted)] uppercase tracking-[0.2em]">No inquiries found</p>
                </div>
            ) : (
                <div className="bg-white border border-[var(--zed-border-light)] rounded-[var(--radius-lg)] overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-[var(--zed-border-light)] bg-[var(--zed-bg-surface)]">
                                <th className="px-8 py-5 text-[10px] font-black text-[var(--zed-text-dark)] tracking-[0.2em] uppercase">Sender Identification</th>
                                <th className="px-8 py-5 text-[10px] font-black text-[var(--zed-text-dark)] tracking-[0.2em] uppercase">Communication Body</th>
                                <th className="px-8 py-5 text-[10px] font-black text-[var(--zed-text-dark)] tracking-[0.2em] uppercase">Stage</th>
                                <th className="px-8 py-5 text-[10px] font-black text-[var(--zed-text-dark)] tracking-[0.2em] uppercase whitespace-nowrap">Timestamp</th>
                                <th className="px-8 py-5 text-[10px] font-black text-[var(--zed-text-dark)] tracking-[0.2em] uppercase text-center">Protocol</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--zed-border-light)]/30">
                            {filteredInquiries.map((inq) => (
                                <tr key={inq.id} className="hover:bg-[var(--zed-bg-surface)]/50 transition-colors">
                                    <td className="px-8 py-6">
                                        <div className="min-w-0">
                                            <p className="text-sm font-black text-[var(--zed-text-dark)] uppercase tracking-tight truncate">{inq.firstName} {inq.lastName}</p>
                                            <p className="text-[10px] font-bold text-[var(--zed-text-muted)] tracking-wide truncate mt-1 lowercase">{inq.email}</p>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="space-y-3">
                                            <p className="text-xs font-medium text-[var(--zed-text-dark)] max-w-[450px] leading-relaxed" title={inq.message}>
                                                {inq.message}
                                            </p>
                                            {inq.adminNotes && (
                                                <div className="mt-3 p-4 bg-[var(--zed-bg-surface)] border-l-4 border-[var(--zed-primary)] rounded-[var(--radius-sm)] text-[10px] font-bold text-[var(--zed-text-muted)] italic whitespace-pre-wrap shadow-inner">
                                                    Official Response: {inq.adminNotes}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-[var(--radius-sm)] text-[9px] font-black tracking-widest uppercase border ${
                                            inq.status === 'Replied' ? 'bg-[var(--zed-success)]/10 text-[var(--zed-success)] border-[var(--zed-success)]/20' : 'bg-[var(--zed-bg-surface)] text-[var(--zed-text-muted)] border-[var(--zed-border-light)]'
                                        }`}>
                                            {inq.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2 text-[var(--zed-text-muted)]">
                                            <Clock size={12} className="opacity-40" />
                                            <span className="text-[10px] font-bold tracking-widest uppercase">
                                                {new Date(inq.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center justify-center gap-2">
                                            {inq.status === 'Pending' && (
                                                <button 
                                                    onClick={() => handleUpdateStatus(inq.id, 'Read')}
                                                    className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[var(--zed-text-dark)] bg-white border border-[var(--zed-border-light)] rounded-[var(--radius-sm)] hover:bg-[var(--zed-bg-surface)] transition-all shadow-sm active:scale-95"
                                                >
                                                    Mark Read
                                                </button>
                                            )}
                                            {inq.status !== 'Replied' && (
                                                <button 
                                                    onClick={() => handleReply(inq)}
                                                    className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white bg-[var(--zed-primary)] border border-[var(--zed-primary)] rounded-[var(--radius-sm)] hover:brightness-110 transition-all flex items-center gap-2 shadow-md active:scale-95"
                                                >
                                                    <Send size={12} />
                                                    Reply
                                                </button>
                                            )}
                                            <button 
                                                onClick={() => handleDelete(inq.id)}
                                                className="p-2.5 text-[var(--zed-text-muted)] hover:text-[var(--zed-error)] transition-all active:scale-90"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <ConfirmDialog
                isOpen={confirmModal.isOpen}
                title="Delete Inquiry Record"
                message="Are you sure you want to permanently purge this inquiry from the central database? This action is irreversible."
                isDestructive={true}
                confirmText="Delete Record"
                onClose={() => setConfirmModal({ isOpen: false, idToDelete: 0 })}
                onConfirm={confirmDelete}
            />

            {/* Reply Modal */}
            {replyModal.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-white/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-[var(--radius-lg)] zed-shadow-xl border border-[var(--zed-border-light)] w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-300 relative">
                        {/* Grid detail */}
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--zed-primary)_1px,transparent_1px),linear-gradient(to_bottom,var(--zed-primary)_1px,transparent_1px)] bg-[size:24px_24px] opacity-[0.01] pointer-events-none"></div>
                        
                        <div className="px-8 py-5 border-b border-[var(--zed-border-light)] flex justify-between items-center bg-[var(--zed-bg-surface)] relative z-10">
                            <h3 className="font-black text-[var(--zed-text-dark)] uppercase tracking-widest text-sm">Response Protocol</h3>
                            <button onClick={() => setReplyModal(prev => ({ ...prev, isOpen: false }))} className="text-[var(--zed-text-muted)] hover:text-[var(--zed-text-dark)] transition-all p-2 rounded-full active:scale-90">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-8 space-y-6 relative z-10">
                            <div className="bg-[var(--zed-bg-surface)] p-6 rounded-[var(--radius-lg)] border border-[var(--zed-border-light)] shadow-inner">
                                <div className="flex justify-between items-start mb-3">
                                    <p className="text-[9px] font-black text-[var(--zed-text-muted)] tracking-[0.2em] uppercase">Original Communication</p>
                                    <p className="text-[9px] font-black text-[var(--zed-primary)] tracking-widest uppercase">{replyModal.name}</p>
                                </div>
                                <p className="text-xs font-medium text-[var(--zed-text-dark)] italic leading-relaxed">"{replyModal.message}"</p>
                            </div>
                            
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-[var(--zed-text-dark)] tracking-[0.2em] uppercase ml-1">Official Response</label>
                                <textarea
                                    autoFocus
                                    placeholder="Compose your reply here..."
                                    className="w-full min-h-[180px] p-6 bg-white border border-[var(--zed-border-light)] rounded-[var(--radius-lg)] focus:outline-none focus:ring-4 focus:ring-[var(--zed-primary)]/10 focus:border-[var(--zed-primary)] text-sm font-medium transition-all resize-none shadow-sm"
                                    value={replyModal.replyText}
                                    onChange={(e) => setReplyModal(prev => ({ ...prev, replyText: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="px-8 py-5 bg-[var(--zed-bg-surface)] border-t border-[var(--zed-border-light)] flex justify-end gap-4 relative z-10">
                            <button 
                                onClick={() => setReplyModal(prev => ({ ...prev, isOpen: false }))}
                                className="px-6 py-2.5 text-[10px] font-black text-[var(--zed-text-muted)] uppercase tracking-widest hover:text-[var(--zed-text-dark)] transition-colors"
                            >
                                Abandon
                            </button>
                            <button 
                                disabled={replying || !replyModal.replyText.trim()}
                                onClick={confirmReply}
                                className="px-8 py-2.5 bg-[var(--zed-primary)] text-white text-[10px] font-black uppercase tracking-widest rounded-[var(--radius-sm)] hover:brightness-110 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-md flex items-center gap-3 active:scale-95"
                            >
                                {replying ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                                {replying ? 'Transmitting...' : 'Dispatch Reply'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PublicInquiries;
