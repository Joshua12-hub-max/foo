import React from 'react';
import { X, Calendar, User, FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { AdminLeaveRequest } from '../types';

interface LeaveDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  leave: AdminLeaveRequest | null;
}

const LeaveDetailsModal: React.FC<LeaveDetailsModalProps> = ({ isOpen, onClose, leave }) => {
  if (!isOpen || !leave) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Rejected': return 'bg-red-100 text-red-700 border-red-200';
      case 'Pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Approved': return <CheckCircle size={16} className="text-emerald-500" />;
      case 'Rejected': return <AlertCircle size={16} className="text-red-500" />;
      case 'Pending': return <Clock size={16} className="text-amber-500" />;
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white text-xl font-black">
              {leave.firstName[0]}{leave.lastName[0]}
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 leading-tight">Leave Application Details</h2>
              <p className="text-sm text-indigo-600 font-bold tracking-tight uppercase">Request ID: #{leave.id.toString().padStart(5, '0')}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-3 text-slate-400 hover:bg-slate-100 rounded-2xl transition-all"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {/* Status & Type */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Leave Type</p>
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-indigo-600" />
                <span className="font-black text-slate-900">{leave.leaveType}</span>
              </div>
            </div>
            <div className={`p-6 rounded-3xl border ${getStatusColor(leave.status)}`}>
              <p className="text-[10px] font-black opacity-60 uppercase tracking-widest mb-2">Current Status</p>
              <div className="flex items-center gap-2">
                {getStatusIcon(leave.status)}
                <span className="font-black uppercase text-xs tracking-wider">{leave.status}</span>
              </div>
            </div>
          </div>

          {/* Employee Info */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <User size={14} /> Applicant Information
            </h3>
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
              <div className="grid grid-cols-2 gap-y-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400">Full Name</p>
                  <p className="text-sm font-black text-slate-900">{leave.firstName} {leave.lastName}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400">Department</p>
                  <p className="text-sm font-black text-slate-900">{leave.department}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Date Info */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Calendar size={14} /> Schedule Details
            </h3>
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400">Date From</p>
                  <p className="text-sm font-black text-slate-900">{new Date(leave.startDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400">Date To</p>
                  <p className="text-sm font-black text-slate-900">{new Date(leave.endDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400">Total Days</p>
                  <p className="text-sm font-black text-indigo-600">{leave.daysRequested} Days</p>
                </div>
              </div>
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <FileText size={14} /> Reason for Leave
            </h3>
            <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 italic text-slate-600 text-sm leading-relaxed">
              "{leave.reason || 'No reason provided.'}"
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-8 py-3.5 bg-slate-900 text-white rounded-2xl text-xs font-black shadow-lg shadow-slate-900/20 hover:bg-slate-950 transition-all active:scale-95"
          >
            CLOSE DETAILS
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeaveDetailsModal;