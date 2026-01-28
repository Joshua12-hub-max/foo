import React, { useEffect, useState } from 'react';
import { inquiryApi, Inquiry } from '@/api/inquiryApi';
import { useToastStore } from '@/stores';
import { Mail, CheckCircle, Clock, Trash2, Search, Filter } from 'lucide-react';

const PublicInquiries: React.FC = () => {
    const [inquiries, setInquiries] = useState<Inquiry[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('All');
    const showToast = useToastStore((state) => state.showToast);

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
        if (!window.confirm('Are you sure you want to delete this inquiry?')) return;
        try {
            const response = await inquiryApi.delete(id);
            if (response.data.success) {
                showToast('Inquiry deleted', 'success');
                fetchInquiries();
            }
        } catch (error) {
            showToast('Failed to delete inquiry', 'error');
        }
    };

    const filteredInquiries = inquiries.filter(inq => {
        const matchesSearch = 
            `${inq.first_name} ${inq.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inq.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inq.message.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = statusFilter === 'All' || inq.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="relative flex-1 min-w-[300px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search inquiries..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter size={18} className="text-gray-400" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-white border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                        <option value="All">All Status</option>
                        <option value="Pending">Pending</option>
                        <option value="Read">Read</option>
                        <option value="Replied">Replied</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            ) : filteredInquiries.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
                    <Mail className="mx-auto text-gray-300 mb-2" size={40} />
                    <p className="text-gray-500">No inquiries found</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredInquiries.map((inq) => (
                        <div key={inq.id} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                        {inq.first_name[0]}{inq.last_name[0]}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">{inq.first_name} {inq.last_name}</h3>
                                        <p className="text-sm text-gray-500">{inq.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                        inq.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                                        inq.status === 'Replied' ? 'bg-green-100 text-green-700' :
                                        'bg-blue-100 text-blue-700'
                                    }`}>
                                        {inq.status}
                                    </span>
                                    <button 
                                        onClick={() => handleDelete(inq.id)}
                                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                            
                            <div className="bg-gray-50 p-4 rounded-lg mb-4 text-gray-700 text-sm italic">
                                "{inq.message}"
                            </div>

                            <div className="flex items-center justify-between text-xs text-gray-400">
                                <div className="flex items-center gap-1">
                                    <Clock size={14} />
                                    {new Date(inq.created_at).toLocaleString()}
                                </div>
                                <div className="flex gap-2">
                                    {inq.status === 'Pending' && (
                                        <button 
                                            onClick={() => handleUpdateStatus(inq.id, 'Read')}
                                            className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 font-bold transition-colors"
                                        >
                                            Mark as Read
                                        </button>
                                    )}
                                    {inq.status !== 'Replied' && (
                                        <button 
                                            onClick={() => handleUpdateStatus(inq.id, 'Replied')}
                                            className="px-3 py-1.5 bg-green-50 text-green-600 rounded-md hover:bg-green-100 font-bold transition-colors flex items-center gap-1"
                                        >
                                            <CheckCircle size={14} />
                                            Mark as Replied
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PublicInquiries;
