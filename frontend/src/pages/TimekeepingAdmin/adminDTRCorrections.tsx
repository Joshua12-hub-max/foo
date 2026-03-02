import React, { useState } from 'react';
import { useAdminDTRCorrections } from '@features/DailyTimeRecord/hooks/Admin/useAdminDTRCorrections';
import { formatFullName } from '../../utils/nameUtils';

const AdminDTRCorrections = () => {
    const { requests, isLoading, error, filterStatus, setFilterStatus, updateStatus, refresh } = useAdminDTRCorrections();
    const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [rejectionReason, setRejectionReason] = useState('');

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
                <h1 className="text-2xl font-bold text-gray-800">DTR Correction Requests</h1>
                <div className="flex gap-2">
                    <select 
                        value={filterStatus} 
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="border rounded px-3 py-2"
                    >
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                        <option value="All">All</option>
                    </select>
                    <button onClick={refresh} className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded">
                        Refresh
                    </button>
                </div>
            </div>

            {error && <div className="text-red-500 mb-4">{error}</div>}

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b">
                            <th className="p-3 font-semibold text-gray-600">Employee</th>
                            <th className="p-3 font-semibold text-gray-600">Date Logged</th>
                            <th className="p-3 font-semibold text-gray-600">Original Time</th>
                            <th className="p-3 font-semibold text-gray-600">Corrected Time</th>
                            <th className="p-3 font-semibold text-gray-600">Reason</th>
                            <th className="p-3 font-semibold text-gray-600">Status</th>
                            <th className="p-3 font-semibold text-gray-600">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={7} className="p-4 text-center">Loading...</td></tr>
                        ) : requests.length === 0 ? (
                            <tr><td colSpan={7} className="p-4 text-center text-gray-500">No requests found.</td></tr>
                        ) : (
                            requests.map((req) => (
                                <tr key={req.id} className="border-b hover:bg-gray-50">
                                    <td className="p-3">
                                        <div className="font-medium">{formatFullName(req.lastName, req.firstName)}</div>
                                        <div className="text-xs text-gray-500">{req.employeeId}</div>
                                    </td>
                                    <td className="p-3">{new Date(req.date).toLocaleDateString()}</td>
                                    <td className="p-3">
                                        <div className="text-sm">In: {req.originalTimeIn ? new Date(req.originalTimeIn).toLocaleTimeString() : '-'}</div>
                                        <div className="text-sm">Out: {req.originalTimeOut ? new Date(req.originalTimeOut).toLocaleTimeString() : '-'}</div>
                                    </td>
                                    <td className="p-3">
                                        <div className="text-sm font-medium text-blue-600">In: {req.correctedTimeIn ? new Date(req.correctedTimeIn).toLocaleTimeString() : '-'}</div>
                                        <div className="text-sm font-medium text-blue-600">Out: {req.correctedTimeOut ? new Date(req.correctedTimeOut).toLocaleTimeString() : '-'}</div>
                                    </td>
                                    <td className="p-3 max-w-xs truncate" title={req.reason}>{req.reason}</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 rounded text-xs font-semibold
                                            ${req.status === 'Approved' ? 'bg-green-100 text-green-800' : 
                                              req.status === 'Rejected' ? 'bg-red-100 text-red-800' : 
                                              'bg-yellow-100 text-yellow-800'}`}>
                                            {req.status}
                                        </span>
                                    </td>
                                    <td className="p-3">
                                        {req.status === 'Pending' && (
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={() => handleApprove(req.id)}
                                                    className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                                                >
                                                    Approve
                                                </button>
                                                <button 
                                                    onClick={() => handleRejectClick(req.id)}
                                                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                                                >
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
                        <h2 className="text-xl font-bold mb-4">Reject Request</h2>
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
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmReject}
                                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
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
