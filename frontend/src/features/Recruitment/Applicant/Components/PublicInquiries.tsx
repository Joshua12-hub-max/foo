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
        <div className="space-y-6">
            <div className="flex flex-wrap gap-3 items-center justify-between">
                <div className="relative flex-1 min-w-[300px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search inquiries..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-300 outline-none text-sm transition-all"
                    />
                </div>
                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1">
                    {['All', 'Pending', 'Read', 'Replied'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                                statusFilter === status
                                    ? 'bg-slate-100 text-slate-800'
                                    : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            {status === 'All' ? 'All Status' : status}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-300 border-t-slate-600"></div>
                </div>
            ) : filteredInquiries.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
                    <p className="text-sm text-slate-500">No inquiries found</p>
                </div>
            ) : (
                <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50">
                                <th className="px-6 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Sender</th>
                                <th className="px-6 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Message</th>
                                <th className="px-6 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredInquiries.map((inq) => (
                                <tr key={inq.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-slate-800 truncate">{inq.firstName} {inq.lastName}</p>
                                            <p className="text-xs text-slate-400 truncate">{inq.email}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="space-y-2">
                                            <p className="text-xs text-slate-600 max-w-[400px]" title={inq.message}>
                                                {inq.message}
                                            </p>
                                            {inq.adminNotes && (
                                                <div className="mt-2 p-2 bg-slate-50 border-l-2 border-slate-300 rounded text-[10px] text-slate-500 italic whitespace-pre-wrap">
                                                    {inq.adminNotes}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2.5 py-1 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                            {inq.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5">
                                            <Clock size={12} className="text-slate-300" />
                                            <span className="text-xs text-slate-500">
                                                {new Date(inq.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1">
                                            {inq.status === 'Pending' && (
                                                <button 
                                                    onClick={() => handleUpdateStatus(inq.id, 'Read')}
                                                    className="px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-all"
                                                >
                                                    Mark Read
                                                </button>
                                            )}
                                            {inq.status !== 'Replied' && (
                                                <button 
                                                    onClick={() => handleReply(inq)}
                                                    className="px-2.5 py-1.5 text-xs font-medium text-white bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-900 transition-all flex items-center gap-1 shadow-sm"
                                                >
                                                    <Send size={12} />
                                                    Reply
                                                </button>
                                            )}
                                            <button 
                                                onClick={() => handleDelete(inq.id)}
                                                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all"
                                            >
                                                <Trash2 size={14} />
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
                title="Delete Inquiry"
                message="Are you sure you want to permanently delete this inquiry? This cannot be undone."
                isDestructive={true}
                confirmText="Delete"
                onClose={() => setConfirmModal({ isOpen: false, idToDelete: 0 })}
                onConfirm={confirmDelete}
            />

            {/* Reply Modal */}
            {replyModal.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-bold text-slate-800">Reply to Inquiry</h3>
                            <button onClick={() => setReplyModal(prev => ({ ...prev, isOpen: false }))} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <div className="flex justify-between items-start mb-2">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Original Message</p>
                                    <p className="text-[10px] text-slate-400 font-medium">{replyModal.name} • {replyModal.email}</p>
                                </div>
                                <p className="text-sm text-slate-600 italic">"{replyModal.message}"</p>
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Your Response</label>
                                <textarea
                                    autoFocus
                                    placeholder="Type your reply here..."
                                    className="w-full min-h-[150px] p-4 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-100 focus:border-slate-400 outline-none text-sm transition-all resize-none shadow-inner"
                                    value={replyModal.replyText}
                                    onChange={(e) => setReplyModal(prev => ({ ...prev, replyText: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                            <button 
                                onClick={() => setReplyModal(prev => ({ ...prev, isOpen: false }))}
                                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                disabled={replying || !replyModal.replyText.trim()}
                                onClick={confirmReply}
                                className="px-6 py-2 bg-slate-800 text-white text-sm font-bold rounded-xl hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md flex items-center gap-2"
                            >
                                {replying && <Loader2 size={16} className="animate-spin" />}
                                {replying ? 'Sending...' : 'Send Reply'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PublicInquiries;
