import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatApi, ChatMessage } from '@/api/chatApi';
import { 
  Send, CheckCircle2, 
  Search, Loader2, MoreVertical, Pencil, Trash2,
  ChevronLeft
} from 'lucide-react';
import { useToastStore, useAuthStore } from '@/stores';

const LiveSupportChat: React.FC = () => {
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editInput, setEditInput] = useState('');
    const [deletingId, setDeletingId] = useState<number | null>(null);
    
    const queryClient = useQueryClient();
    const showToast = useToastStore((state) => state.showToast);
    const currentUser = useAuthStore((state) => state.user);
    const scrollRef = useRef<HTMLDivElement>(null);

    // List of conversations
    const { data: convData, isLoading: loadingConv } = useQuery({
        queryKey: ['chat-conversations'],
        queryFn: () => chatApi.getConversations(),
        refetchInterval: 5000 // Poll for new chats
    });

    const conversations = convData?.data.conversations || [];

    // Messages for selected conversation - Using effect for immediate UI update on selection
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (selectedId) {
            const fetchMsgs = async () => {
                try {
                    const res = await chatApi.getMessages(selectedId, true, 'Administrator');
                    if (res.data.success) {
                        setMessages(res.data.messages);
                    }
                } catch (err) {
                    console.error('Fetch messages error:', err);
                }
            };
            fetchMsgs();
            interval = setInterval(fetchMsgs, 3000);
        } else {
            setMessages([]);
        }
        return () => clearInterval(interval);
    }, [selectedId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    // --- MUTATIONS ---

    const sendMutation = useMutation({
        mutationFn: (msg: string) => chatApi.sendMessage({
            conversationId: selectedId!,
            message: msg,
            senderType: 'Administrator'
        }),
        onSuccess: () => {
            setInput('');
            if (selectedId) {
                queryClient.invalidateQueries({ queryKey: ['chat-messages', selectedId] });
                // Force immediate local update
                chatApi.getMessages(selectedId, false, 'Administrator').then(res => {
                    if (res.data.success) setMessages(res.data.messages);
                });
            }
        },
        onError: () => {
            showToast('Failed to send message', 'error');
        }
    });

    const editMutation = useMutation({
        mutationFn: (data: { msgId: number, text: string }) => 
            chatApi.editMessage(data.msgId, { 
                message: data.text, 
                senderType: 'Administrator',
                conversationId: selectedId ?? undefined
            }),
        onSuccess: () => {
            setEditingId(null);
            setEditInput('');
            if (selectedId) {
                chatApi.getMessages(selectedId, false, 'Administrator').then(res => {
                    if (res.data.success) setMessages(res.data.messages);
                });
            }
        },
        onError: () => {
            showToast('Failed to edit message', 'error');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (data: { msgId: number, type: 'me' | 'everyone' }) => 
            chatApi.deleteMessage(data.msgId, data.type, 'Administrator', selectedId!),
        onSuccess: () => {
            setDeletingId(null);
            if (selectedId) {
                chatApi.getMessages(selectedId, false, 'Administrator').then(res => {
                    if (res.data.success) setMessages(res.data.messages);
                });
            }
        },
        onError: () => {
            showToast('Failed to delete message', 'error');
        }
    });

    const deleteConvMutation = useMutation({
        mutationFn: (id: number) => chatApi.deleteConversation(id, 'Administrator'),
        onSuccess: () => {
            showToast('Conversation deleted', 'success');
            queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
            setSelectedId(null);
        },
        onError: () => {
            showToast('Failed to delete conversation', 'error');
        }
    });

    const closeMutation = useMutation({
        mutationFn: (id: number) => chatApi.close(id),
        onSuccess: () => {
            showToast('Conversation closed', 'success');
            queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
            setSelectedId(null);
        }
    });

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !selectedId || sendMutation.isPending) return;
        sendMutation.mutate(input.trim());
    };

    const handleSaveEdit = (msgId: number) => {
        if (!editInput.trim() || editMutation.isPending) return;
        editMutation.mutate({ msgId, text: editInput.trim() });
    };

    const filteredConversations = conversations.filter(c => 
        (c.applicantName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.applicantEmail || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedConv = conversations.find(c => c.id === selectedId);

    return (
        <div className="h-[750px] flex bg-white rounded-lg border border-slate-200 overflow-hidden animate-in fade-in duration-500 w-full relative">
            {/* Conversations List */}
            <div className={`w-full md:w-80 lg:w-96 flex-shrink-0 border-r border-slate-200 flex flex-col transition-all duration-300 ${selectedId ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b border-slate-200 bg-slate-50">
                    <h3 className="font-semibold text-slate-800 mb-3 text-sm">
                        Messages
                    </h3>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search applicant or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-300 outline-none transition-all placeholder:text-slate-400"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {loadingConv ? (
                        <div className="flex flex-col items-center justify-center p-12 space-y-3">
                            <Loader2 className="animate-spin text-slate-300" size={24} />
                            <p className="text-xs text-slate-400">Loading chats...</p>
                        </div>
                    ) : filteredConversations.length === 0 ? (
                        <div className="p-12 text-center">
                            <p className="text-sm text-slate-400">No active conversations</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {filteredConversations.map((conv) => (
                                <button
                                    key={conv.id}
                                    onClick={() => setSelectedId(conv.id)}
                                    className={`w-full p-4 flex items-center gap-3 hover:bg-slate-50 transition-all text-left ${selectedId === conv.id ? 'bg-slate-50 border-l-2 border-slate-700' : 'border-l-2 border-transparent'}`}
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-1">
                                            <h4 className="font-medium text-slate-800 truncate text-sm">{conv.applicantName || 'Anonymous'}</h4>
                                            <span className="text-[10px] text-slate-400 shrink-0">{new Date(conv.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <div className="flex items-center justify-between gap-2">
                                            <p className={`text-xs truncate flex-1 ${conv.unreadCount && conv.unreadCount > 0 ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>
                                                {conv.lastMessage || 'Click to view chat'}
                                            </p>
                                            {conv.unreadCount && conv.unreadCount > 0 ? (
                                                <span className="bg-slate-600 text-white text-[9px] font-medium px-1.5 py-0.5 rounded-full">
                                                    {conv.unreadCount}
                                                </span>
                                            ) : null}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className={`flex-1 flex flex-col bg-white relative transition-all duration-300 ${!selectedId ? 'hidden md:flex' : 'flex'}`}>
                {selectedId && selectedConv ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between z-10 sticky top-0">
                            <div className="flex items-center gap-3 min-w-0">
                                <button onClick={() => setSelectedId(null)} className="md:hidden p-2 -ml-2 text-slate-400 hover:text-slate-800 transition-colors">
                                    <ChevronLeft size={20} />
                                </button>
                                <div className="min-w-0">
                                    <h4 className="font-medium text-slate-800 leading-tight truncate text-sm">{selectedConv.applicantName || 'Anonymous'}</h4>
                                    <p className="text-xs text-slate-400 truncate flex items-center gap-1.5 mt-0.5">
                                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full"></span>
                                        {selectedConv.applicantEmail}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => closeMutation.mutate(selectedId)}
                                    className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-all flex items-center gap-1.5"
                                >
                                    <CheckCircle2 size={14} />
                                    <span className="hidden sm:inline">Resolve</span>
                                </button>
                                <button 
                                    onClick={() => {
                                        if (confirm('Are you sure you want to PERMANENTLY delete this entire conversation?')) {
                                            deleteConvMutation.mutate(selectedId);
                                        }
                                    }}
                                    className="p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600 rounded-lg transition-all"
                                    title="Delete Conversation"
                                >
                                    <Trash2 size={16} />
                                </button>
                                <button className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg transition-all">
                                    <MoreVertical size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div 
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar bg-slate-50/30"
                        >
                            {messages.map((msg, idx) => {
                                const isMe = msg.senderType === 'Administrator';
                                return (
                                    <div key={msg.id || idx} className={`flex items-end gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>

                                        <div className={`max-w-[75%] lg:max-w-[65%] group flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                            <div className={`flex items-center gap-2 ${isMe ? 'flex-row' : 'flex-row-reverse'}`}>
                                                {/* Actions appear on hover */}
                                                {!msg.isDeletedForEveryone && (
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                                                        {isMe && msg.senderId === currentUser?.id && (
                                                            <button 
                                                                onClick={() => {
                                                                    setEditingId(msg.id);
                                                                    setEditInput(msg.message);
                                                                }}
                                                                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-all"
                                                                title="Edit"
                                                            >
                                                                <Pencil size={12} />
                                                            </button>
                                                        )}
                                                        <button 
                                                            onClick={() => {
                                                                setDeletingId(msg.id);
                                                            }}
                                                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-all"
                                                            title={isMe ? "Delete for everyone" : "Remove for me"}
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                )}
                                                
                                                <div className={`px-4 py-3 rounded-xl border transition-all ${
                                                    msg.isDeletedForEveryone
                                                    ? 'bg-slate-50 border-slate-200 text-slate-400 italic rounded-br-none'
                                                    : isMe
                                                    ? 'bg-slate-700 border-slate-700 text-white rounded-br-none'
                                                    : 'bg-white border-slate-200 text-slate-700 rounded-bl-none'
                                                }`}>
                                                    {editingId === msg.id ? (
                                                        <div className="flex flex-col gap-3 min-w-[250px]">
                                                            <textarea 
                                                                className="w-full bg-white/10 text-white p-3 text-xs rounded-lg outline-none border border-slate-500 focus:border-slate-300 transition-all min-h-[80px]"
                                                                value={editInput}
                                                                onChange={(e) => setEditInput(e.target.value)}
                                                                autoFocus
                                                            />
                                                            <div className="flex justify-end gap-2">
                                                                <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-xs text-slate-300 hover:text-white transition-colors">Cancel</button>
                                                                <button 
                                                                    onClick={() => handleSaveEdit(msg.id)} 
                                                                    disabled={editMutation.isPending}
                                                                    className="px-3 py-1.5 bg-white text-slate-800 text-xs font-medium rounded-lg hover:bg-slate-100 disabled:opacity-50 transition-all"
                                                                >
                                                                    {editMutation.isPending ? 'Saving...' : 'Save'}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : deletingId === msg.id ? (
                                                        <div className="flex flex-col gap-2 min-w-[200px] text-center p-1">
                                                            <p className="text-xs font-medium text-slate-500 mb-1">Delete this message?</p>
                                                            <button 
                                                                onClick={() => deleteMutation.mutate({ msgId: msg.id, type: 'everyone' })}
                                                                className="w-full py-2 bg-slate-600 text-white text-xs font-medium rounded-lg hover:bg-slate-700 transition-all"
                                                            >
                                                                Delete for everyone
                                                            </button>
                                                            <button 
                                                                onClick={() => deleteMutation.mutate({ msgId: msg.id, type: 'me' })}
                                                                className="w-full py-2 bg-slate-100 text-slate-600 text-xs font-medium rounded-lg hover:bg-slate-200 transition-all"
                                                            >
                                                                Remove for me
                                                            </button>
                                                            <button 
                                                                onClick={() => setDeletingId(null)} 
                                                                className="w-full py-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className={`flex items-center gap-2 mt-1.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                                {msg.isEdited && !msg.isDeletedForEveryone && (
                                                    <span className="text-[10px] text-slate-300 italic">edited</span>
                                                )}
                                                <span className="text-[10px] text-slate-300">
                                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Message Input */}
                        <div className="p-4 bg-white border-t border-slate-200">
                            <form onSubmit={handleSend} className="relative">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    disabled={sendMutation.isPending}
                                    placeholder="Write a message..."
                                    className="w-full pl-4 pr-14 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-slate-300 focus:ring-2 focus:ring-slate-200 transition-all text-sm placeholder:text-slate-400"
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim() || sendMutation.isPending}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 disabled:opacity-30 transition-all flex items-center justify-center"
                                >
                                    {sendMutation.isPending ? (
                                        <Loader2 className="animate-spin" size={16} />
                                    ) : (
                                        <Send size={16} />
                                    )}
                                </button>
                            </form>
                            <p className="text-[10px] text-center text-slate-300 mt-2">
                                Press Enter to send message
                            </p>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-3 animate-in fade-in duration-500">
                        <div className="max-w-sm">
                            <h4 className="text-lg font-semibold text-slate-700">Chat Hub</h4>
                            <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                                Select a candidate conversation to provide support and manage their application process in real-time.
                            </p>
                        </div>
                    </div>
                )}
            </div>
            
            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 5px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #cbd5e1;
                }
            `}
            </style>
        </div>
    );
};

export default LiveSupportChat;
