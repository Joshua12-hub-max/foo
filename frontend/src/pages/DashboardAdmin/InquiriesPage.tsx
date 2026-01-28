import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inquiryApi, Inquiry } from '@/api/inquiryApi';
import { 
  Mail, MessageSquare, Clock, Filter, CheckCircle2, 
  Trash2, Eye, Archive, Reply, Loader2, Search, AlertCircle
} from 'lucide-react';
import { useToastStore } from '@/stores';

const InquiriesPage = () => {
  const [filter, setFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);

  const { data: inquiriesData, isLoading } = useQuery({
    queryKey: ['inquiries', filter],
    queryFn: () => inquiryApi.getAll(filter)
  });

  const inquiries = inquiriesData?.data.inquiries || [];

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => 
      inquiryApi.updateStatus(id, { status }),
    onSuccess: (data) => {
      showToast(data.data.message, 'success');
      queryClient.invalidateQueries({ queryKey: ['inquiries'] });
      if (selectedInquiry) {
        setSelectedInquiry(prev => prev ? { ...prev, status: prev.status as any } : null);
      }
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Update failed', 'error');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => inquiryApi.delete(id),
    onSuccess: (data) => {
      showToast(data.data.message, 'success');
      queryClient.invalidateQueries({ queryKey: ['inquiries'] });
      setSelectedInquiry(null);
    }
  });

  const filteredInquiries = inquiries.filter(inq => 
    `${inq.first_name} ${inq.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inq.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inq.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Read': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Replied': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Archived': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Public Inquiries</h1>
          <p className="text-sm font-medium text-slate-500">Manage questions from the "Get in Touch" form</p>
        </div>
        
        <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
          {['All', 'Pending', 'Read', 'Replied', 'Archived'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all ${
                filter === f 
                  ? 'bg-slate-900 text-white shadow-lg' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Inquiry List */}
        <div className={`${selectedInquiry ? 'lg:col-span-4' : 'lg:col-span-12'} space-y-4`}>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Search by name, email or content..."
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-slate-500/10 outline-none font-bold text-sm shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="max-h-[70vh] overflow-y-auto">
              {isLoading ? (
                <div className="p-20 flex flex-col items-center gap-3">
                  <Loader2 className="animate-spin text-slate-400" size={32} />
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">FETCHING MESSAGES...</p>
                </div>
              ) : filteredInquiries.length === 0 ? (
                <div className="p-20 flex flex-col items-center text-center gap-3">
                  <div className="p-4 bg-slate-50 rounded-full text-slate-300">
                    <MessageSquare size={40} />
                  </div>
                  <p className="text-sm font-bold text-slate-500 italic">No inquiries found for this filter.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredInquiries.map((inquiry) => (
                    <button
                      key={inquiry.id}
                      onClick={() => setSelectedInquiry(inquiry)}
                      className={`w-full p-5 text-left transition-all hover:bg-slate-50 flex flex-col gap-2 ${
                        selectedInquiry?.id === inquiry.id ? 'bg-slate-50 border-l-4 border-slate-900' : 'border-l-4 border-transparent'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${getStatusColor(inquiry.status)}`}>
                          {inquiry.status}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                          <Clock size={10} /> {new Date(inquiry.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 text-sm">{inquiry.first_name} {inquiry.last_name}</h4>
                        <p className="text-[11px] font-bold text-slate-400 lowercase">{inquiry.email}</p>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {inquiry.message}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Inquiry Detail View */}
        {selectedInquiry && (
          <div className="lg:col-span-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-white border border-slate-200 rounded-3xl h-full flex flex-col shadow-xl">
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white text-xl font-black">
                    {selectedInquiry.first_name[0]}{selectedInquiry.last_name[0]}
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 leading-tight">
                      {selectedInquiry.first_name} {selectedInquiry.last_name}
                    </h2>
                    <p className="text-sm text-indigo-600 font-bold">{selectedInquiry.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => deleteMutation.mutate(selectedInquiry.id)}
                    className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                    title="Delete Message"
                  >
                    <Trash2 size={20} />
                  </button>
                  <button 
                    onClick={() => setSelectedInquiry(null)}
                    className="p-2.5 text-slate-400 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    <Eye size={20} />
                  </button>
                </div>
              </div>

              <div className="p-8 flex-1 overflow-y-auto">
                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 shadow-inner mb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 bg-white rounded-lg shadow-sm">
                      <MessageSquare size={16} className="text-slate-400" />
                    </div>
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">MESSAGE CONTENT</span>
                  </div>
                  <p className="text-slate-700 font-medium leading-[1.8] text-sm italic whitespace-pre-wrap">
                    "{selectedInquiry.message}"
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Metadata</h5>
                    <div className="bg-white border border-slate-100 rounded-2xl p-4 space-y-3 shadow-sm">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-bold">Received At:</span>
                        <span className="text-slate-900 font-black">{new Date(selectedInquiry.created_at).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-bold">Ref ID:</span>
                        <span className="text-slate-900 font-black">#{selectedInquiry.id.toString().padStart(5, '0')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Quick Actions</h5>
                    <div className="flex flex-wrap gap-2">
                      {selectedInquiry.status !== 'Replied' && (
                        <button 
                          onClick={() => updateStatusMutation.mutate({ id: selectedInquiry.id, status: 'Replied' })}
                          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all active:scale-95"
                        >
                          <CheckCircle2 size={14} /> MARK REPLIED
                        </button>
                      )}
                      {selectedInquiry.status === 'Pending' && (
                        <button 
                          onClick={() => updateStatusMutation.mutate({ id: selectedInquiry.id, status: 'Read' })}
                          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95"
                        >
                          <Eye size={14} /> MARK AS READ
                        </button>
                      )}
                      {selectedInquiry.status !== 'Archived' && (
                        <button 
                          onClick={() => updateStatusMutation.mutate({ id: selectedInquiry.id, status: 'Archived' })}
                          className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black shadow-lg shadow-slate-900/20 hover:bg-slate-950 transition-all active:scale-95"
                        >
                          <Archive size={14} /> ARCHIVE
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 border-t border-slate-100 bg-slate-50/30 rounded-b-3xl">
                <div className="flex items-center gap-3">
                  <a 
                    href={`mailto:${selectedInquiry.email}?subject=Re: Your Inquiry to Meycauayan HR`}
                    className="flex-1 flex items-center justify-center gap-2 py-4 bg-white border-2 border-slate-900 text-slate-900 rounded-2xl text-xs font-black hover:bg-slate-900 hover:text-white transition-all group"
                  >
                    <Reply size={16} className="group-hover:-translate-x-1 transition-transform" />
                    REPLY VIA EMAIL
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InquiriesPage;
