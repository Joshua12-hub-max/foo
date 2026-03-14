import React, { useEffect, useState } from 'react';
import { inquiryApi, Inquiry } from '@/api/inquiryApi';
import { useToastStore } from '@/stores';
import { CheckCircle, Clock, Trash2, Search } from 'lucide-react';
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
                                        <p className="text-xs text-slate-600 max-w-[300px] truncate" title={inq.message}>
                                            {inq.message}
                                        </p>
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
                                                    onClick={() => handleUpdateStatus(inq.id, 'Replied')}
                                                    className="px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-all flex items-center gap-1"
                                                >
                                                    <CheckCircle size={12} />
                                                    Replied
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
        </div>
    );
};

export default PublicInquiries;
