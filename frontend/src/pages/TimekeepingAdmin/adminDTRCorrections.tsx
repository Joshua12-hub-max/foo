import React, { useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { useAdminDTRCorrections } from '@features/DailyTimeRecord/hooks/Admin/useAdminDTRCorrections';
import { formatFullName } from '../../utils/nameUtils';
import Combobox from '@/components/Custom/Combobox';

const AdminDTRCorrections = () => {
    const { requests, isLoading, error, filterStatus, setFilterStatus, updateStatus, refresh } = useAdminDTRCorrections();
    const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [rejectionReason, setRejectionReason] = useState('');

    const statusOptions = [
        { value: 'Pending', label: 'Pending' },
        { value: 'Approved', label: 'Approved' },
        { value: 'Rejected', label: 'Rejected' },
        { value: 'All', label: 'All' }
    ];

    const handleApprove = async (id: number) => {
        if (confirm('Are you sure you want to approve this request?')) {
            const result = await updateStatus([id], 'Approved');
            if (result.success) alert('Approved successfully');
            else alert('Failed: ' + result.message);
        }
    };

    const handleRejectClick = (id: number) => {
        setSelectedIds([id]);
        setRejectionReason('');
        setRejectionModalOpen(true);
    };

    const confirmReject = async () => {
        if (!rejectionReason.trim()) return alert('Reason required');
        
        const result = await updateStatus(selectedIds, 'Rejected', rejectionReason);
        if (result.success) {
            alert('Rejected successfully');
            setRejectionModalOpen(false);
        } else {
            alert('Failed: ' + result.message);
        }
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow-md min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-gray-800">DTR Correction Requests</h1>
                <div className="flex gap-2">
                    <Combobox 
                        options={statusOptions}
                        value={filterStatus} 
                        onChange={(val) => setFilterStatus(val)}
                        placeholder="Filter Status"
                        className="w-40"
                    />
                    <button onClick={refresh} className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded">
                        Refresh
                    </button>
                </div>
            </div>

            {error && <div className="text-red-500 mb-4">{error}</div>}

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-200 shadow-md text-gray-700">
                        <tr>
                            <th className="px-6 py-4 text-left text-sm font-semibold tracking-wide whitespace-nowrap">Employee</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold tracking-wide whitespace-nowrap">Date Logged</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold tracking-wide whitespace-nowrap">Original Time</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold tracking-wide whitespace-nowrap">Corrected Time</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold tracking-wide whitespace-nowrap">Reason</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold tracking-wide whitespace-nowrap">Status</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold tracking-wide whitespace-nowrap">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={7} className="p-4 text-center">Loading...</td></tr>
                        ) : requests.length === 0 ? (
                            <tr><td colSpan={7} className="p-4 text-center text-gray-500">No requests found.</td></tr>
                        ) : (
                            requests.map((req) => (
                                <tr key={req.id} className="border-b hover:bg-[#F8F9FA] hover:shadow-xl transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{formatFullName(req.lastName, req.firstName)}</div>
                                        <div className="text-xs text-gray-500 font-mono">{req.employeeId}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-800">{new Date(req.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                                    <td className="px-6 py-4">
                                        <div className="text-xs text-gray-600">In: {req.originalTimeIn ? new Date(req.originalTimeIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '-'}</div>
                                        <div className="text-xs text-gray-600">Out: {req.originalTimeOut ? new Date(req.originalTimeOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '-'}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-xs font-semibold text-gray-600">In: {req.correctedTimeIn ? new Date(req.correctedTimeIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '-'}</div>
                                        <div className="text-xs font-semibold text-gray-600">Out: {req.correctedTimeOut ? new Date(req.correctedTimeOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '-'}</div>
                                    </td>
                                    <td className="px-6 py-4 max-w-xs truncate text-sm text-gray-600" title={req.reason}>{req.reason}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-semibold shadow-sm inline-block
                                            ${req.status === 'Approved' ? 'bg-green-100 text-green-700' : 
                                              req.status === 'Rejected' ? 'bg-red-100 text-red-700' : 
                                              'bg-yellow-100 text-yellow-700'}`}>
                                            {req.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {req.status === 'Pending' && (
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={() => handleApprove(req.id)}
                                                    className="px-2 py-1 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold border border-gray-200"
                                                >
                                                    <CheckCircle className="w-3.5 h-3.5" />
                                                    Approve
                                                </button>
                                                <button 
                                                    onClick={() => handleRejectClick(req.id)}
                                                    className="px-2 py-1 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold border border-gray-200"
                                                >
                                                    <XCircle className="w-3.5 h-3.5" />
                                                    Reject
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Rejection Modal */}
            {rejectionModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-96 shadow-xl">
                        <h2 className="text-xl font-semibold mb-4 text-gray-800">Reject Request</h2>
                        <label className="block text-sm font-medium mb-2">Reason for Rejection:</label>
                        <textarea 
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            className="w-full border rounded p-2 mb-4"
                            rows={3}
                            placeholder="Enter reason..."
                        />
                        <div className="flex justify-end gap-2">
                            <button 
                                onClick={() => setRejectionModalOpen(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors text-sm font-semibold border border-gray-200"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmReject}
                                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-semibold shadow-md active:scale-95"
                            >
                                Reject
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDTRCorrections;
