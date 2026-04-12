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
        <div className="h-[750px] flex bg-white rounded-[var(--radius-lg)] border border-[var(--zed-border-light)] overflow-hidden animate-in fade-in duration-500 w-full relative zed-shadow-sm">
            {/* Conversations List */}
            <div className={`w-full md:w-80 lg:w-96 flex-shrink-0 border-r border-[var(--zed-border-light)] flex flex-col transition-all duration-300 ${selectedId ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-6 border-b border-[var(--zed-border-light)] bg-[var(--zed-bg-surface)]">
                    <h3 className="font-black text-[var(--zed-text-dark)] mb-4 text-[10px] tracking-[0.2em] uppercase">
                        Communications List
                    </h3>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--zed-text-muted)]" size={16} />
                        <input
                            type="text"
                            placeholder="Search protocol or entity..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-white border border-[var(--zed-border-light)] rounded-[var(--radius-md)] text-xs font-bold uppercase tracking-tight focus:outline-none focus:ring-4 focus:ring-[var(--zed-primary)]/10 focus:border-[var(--zed-primary)] transition-all placeholder:text-[var(--zed-text-muted)]/40"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto scrollbar-premium">
                    {loadingConv ? (
                        <div className="flex flex-col items-center justify-center p-12 space-y-4">
                            <Loader2 className="animate-spin text-[var(--zed-primary)]" size={24} />
                            <p className="text-[10px] font-black text-[var(--zed-text-muted)] uppercase tracking-widest">Fetching data nodes...</p>
                        </div>
                    ) : filteredConversations.length === 0 ? (
                        <div className="p-12 text-center">
                            <p className="text-[10px] font-black text-[var(--zed-text-muted)] uppercase tracking-widest opacity-40">No active data streams</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-[var(--zed-border-light)]/30">
                            {filteredConversations.map((conv) => (
                                <button
                                    key={conv.id}
                                    onClick={() => setSelectedId(conv.id)}
                                    className={`w-full p-6 flex items-center gap-4 hover:bg-[var(--zed-bg-surface)] transition-all text-left relative ${selectedId === conv.id ? 'bg-[var(--zed-bg-surface)] after:absolute after:left-0 after:top-0 after:bottom-0 after:w-1 after:bg-[var(--zed-primary)]' : ''}`}
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-1">
                                            <h4 className="text-sm font-black text-[var(--zed-text-dark)] truncate uppercase tracking-tight">{conv.applicantName || 'Anonymous Node'}</h4>
                                            <span className="text-[9px] font-black text-[var(--zed-text-muted)] shrink-0 opacity-40 uppercase">{new Date(conv.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <div className="flex items-center justify-between gap-3">
                                            <p className={`text-[11px] truncate flex-1 ${conv.unreadCount && conv.unreadCount > 0 ? 'text-[var(--zed-text-dark)] font-bold' : 'text-[var(--zed-text-muted)]'}`}>
                                                {conv.lastMessage || 'Stream standby...'}
                                            </p>
                                            {conv.unreadCount && conv.unreadCount > 0 ? (
                                                <span className="bg-[var(--zed-primary)] text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-md">
                                                    {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
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
                        <div className="p-6 bg-white border-b border-[var(--zed-border-light)] flex items-center justify-between z-10 sticky top-0">
                            <div className="flex items-center gap-4 min-w-0">
                                <button onClick={() => setSelectedId(null)} className="md:hidden p-2 -ml-2 text-[var(--zed-text-muted)] hover:text-[var(--zed-text-dark)] transition-colors">
                                    <ChevronLeft size={20} />
                                </button>
                                <div className="min-w-0">
                                    <h4 className="text-sm font-black text-[var(--zed-text-dark)] leading-tight truncate uppercase tracking-tight">{selectedConv.applicantName || 'Anonymous Entity'}</h4>
                                    <p className="text-[10px] font-bold text-[var(--zed-text-muted)] truncate flex items-center gap-2 mt-1 uppercase tracking-widest">
                                        <span className="w-1.5 h-1.5 bg-[var(--zed-success)] rounded-full animate-pulse"></span>
                                        {selectedConv.applicantEmail}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => closeMutation.mutate(selectedId)}
                                    className="px-4 py-2 text-[10px] font-black text-[var(--zed-text-dark)] bg-white border border-[var(--zed-border-light)] rounded-[var(--radius-sm)] hover:bg-[var(--zed-bg-surface)] transition-all flex items-center gap-2 uppercase tracking-widest shadow-sm active:scale-95"
                                >
                                    <CheckCircle2 size={14} className="text-[var(--zed-success)]" />
                                    <span className="hidden sm:inline">Resolve</span>
                                </button>
                                <button 
                                    onClick={() => {
                                        if (confirm('Are you sure you want to PERMANENTLY delete this entire conversation?')) {
                                            deleteConvMutation.mutate(selectedId);
                                        }
                                    }}
                                    className="p-3 text-[var(--zed-text-muted)] hover:bg-[var(--zed-bg-surface)] hover:text-[var(--zed-error)] rounded-full transition-all active:scale-90"
                                    title="Delete Conversation"
                                >
                                    <Trash2 size={18} />
                                </button>
                                <button className="p-3 text-[var(--zed-text-muted)] hover:bg-[var(--zed-bg-surface)] rounded-full transition-all active:scale-90">
                                    <MoreVertical size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div 
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-premium bg-[var(--zed-bg-surface)]/30"
                        >
                            {messages.map((msg, idx) => {
                                const isMe = msg.senderType === 'Administrator';
                                return (
                                    <div key={msg.id || idx} className={`flex items-end gap-4 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>

                                        <div className={`max-w-[75%] lg:max-w-[65%] group flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                            <div className={`flex items-center gap-3 ${isMe ? 'flex-row' : 'flex-row-reverse'}`}>
                                                {!msg.isDeletedForEveryone && (
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                                                        {isMe && msg.senderId === currentUser?.id && (
                                                            <button 
                                                                onClick={() => {
                                                                    setEditingId(msg.id);
                                                                    setEditInput(msg.message);
                                                                }}
                                                                className="p-2 hover:bg-white rounded-lg text-[var(--zed-text-muted)] hover:text-[var(--zed-primary)] transition-all zed-shadow-sm"
                                                                title="Edit"
                                                            >
                                                                <Pencil size={12} />
                                                            </button>
                                                        )}
                                                        <button 
                                                            onClick={() => {
                                                                setDeletingId(msg.id);
                                                            }}
                                                            className="p-2 hover:bg-white rounded-lg text-[var(--zed-text-muted)] hover:text-[var(--zed-error)] transition-all zed-shadow-sm"
                                                            title={isMe ? "Delete for everyone" : "Remove for me"}
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                )}
                                                
                                                <div className={`px-5 py-4 rounded-[var(--radius-lg)] border transition-all zed-shadow-sm ${
                                                    msg.isDeletedForEveryone
                                                    ? 'bg-white border-[var(--zed-border-light)] text-[var(--zed-text-muted)] italic opacity-40 rounded-br-none'
                                                    : isMe
                                                    ? 'bg-[var(--zed-primary)] border-[var(--zed-primary)] text-white rounded-br-none'
                                                    : 'bg-white border-[var(--zed-border-light)] text-[var(--zed-text-dark)] font-medium rounded-bl-none'
                                                }`}>
                                                    {editingId === msg.id ? (
                                                        <div className="flex flex-col gap-4 min-w-[280px]">
                                                            <textarea 
                                                                className="w-full bg-white/10 text-white p-4 text-xs font-bold rounded-[var(--radius-md)] outline-none border border-white/30 focus:border-white transition-all min-h-[100px] resize-none"
                                                                value={editInput}
                                                                onChange={(e) => setEditInput(e.target.value)}
                                                                autoFocus
                                                            />
                                                            <div className="flex justify-end gap-3">
                                                                <button onClick={() => setEditingId(null)} className="text-[10px] font-black uppercase text-white/60 hover:text-white transition-colors">Cancel</button>
                                                                <button 
                                                                    onClick={() => handleSaveEdit(msg.id)} 
                                                                    disabled={editMutation.isPending}
                                                                    className="px-4 py-1.5 bg-white text-[var(--zed-primary)] text-[10px] font-black uppercase tracking-widest rounded-[var(--radius-sm)] hover:bg-white/90 disabled:opacity-50 transition-all shadow-md"
                                                                >
                                                                    {editMutation.isPending ? 'Syncing...' : 'Update'}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : deletingId === msg.id ? (
                                                        <div className="flex flex-col gap-3 min-w-[220px] text-center p-1">
                                                            <p className="text-[10px] font-black text-[var(--zed-text-muted)] uppercase tracking-widest mb-2">Security Override</p>
                                                            <button 
                                                                onClick={() => deleteMutation.mutate({ msgId: msg.id, type: 'everyone' })}
                                                                className="w-full py-2.5 bg-[var(--zed-error)] text-white text-[10px] font-black uppercase tracking-widest rounded-[var(--radius-sm)] hover:brightness-110 transition-all shadow-md"
                                                            >
                                                                Purge Globally
                                                            </button>
                                                            <button 
                                                                onClick={() => deleteMutation.mutate({ msgId: msg.id, type: 'me' })}
                                                                className="w-full py-2.5 bg-[var(--zed-bg-surface)] text-[var(--zed-text-dark)] text-[10px] font-black uppercase tracking-widest rounded-[var(--radius-sm)] border border-[var(--zed-border-light)] hover:bg-white transition-all"
                                                            >
                                                                Remove Locally
                                                            </button>
                                                            <button 
                                                                onClick={() => setDeletingId(null)} 
                                                                className="w-full py-2 text-[10px] font-black text-[var(--zed-text-muted)] uppercase tracking-widest hover:text-[var(--zed-text-dark)] transition-colors"
                                                            >
                                                                Abort
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className={`flex items-center gap-3 mt-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                                {msg.isEdited && !msg.isDeletedForEveryone && (
                                                    <span className="text-[9px] font-black text-[var(--zed-text-muted)] uppercase opacity-40">Modified</span>
                                                )}
                                                <span className="text-[9px] font-black text-[var(--zed-text-muted)] uppercase opacity-40 tracking-tighter">
                                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Message Input */}
                        <div className="p-6 bg-white border-t border-[var(--zed-border-light)]">
                            <form onSubmit={handleSend} className="relative">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    disabled={sendMutation.isPending}
                                    placeholder="Enter communication protocol..."
                                    className="w-full pl-6 pr-16 py-4 bg-[var(--zed-bg-surface)] border border-[var(--zed-border-light)] rounded-[var(--radius-lg)] outline-none focus:bg-white focus:ring-4 focus:ring-[var(--zed-primary)]/10 focus:border-[var(--zed-primary)] transition-all text-sm font-bold uppercase tracking-tight placeholder:text-[var(--zed-text-muted)]/40 shadow-inner"
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim() || sendMutation.isPending}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-[var(--zed-primary)] text-white rounded-[var(--radius-md)] hover:brightness-110 disabled:opacity-30 transition-all flex items-center justify-center shadow-lg active:scale-95"
                                >
                                    {sendMutation.isPending ? (
                                        <Loader2 className="animate-spin" size={20} />
                                    ) : (
                                        <Send size={20} />
                                    )}
                                </button>
                            </form>
                            <div className="flex justify-center gap-4 mt-3">
                                <p className="text-[9px] font-black text-[var(--zed-text-muted)] uppercase tracking-[0.2em] opacity-30">
                                    AES-256 Encrypted Stream
                                </p>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-6 animate-in fade-in duration-500 relative">
                        {/* Background grid detail for empty state */}
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--zed-primary)_1px,transparent_1px),linear-gradient(to_bottom,var(--zed-primary)_1px,transparent_1px)] bg-[size:32px_32px] opacity-[0.01] pointer-events-none"></div>
                        
                        <div className="max-w-md relative z-10">
                            <div className="w-24 h-24 bg-[var(--zed-bg-surface)] rounded-[var(--radius-lg)] border border-[var(--zed-border-light)] flex items-center justify-center mx-auto mb-8 shadow-sm">
                                <MoreVertical size={40} className="text-[var(--zed-primary)] opacity-20" />
                            </div>
                            <h4 className="text-2xl font-black text-[var(--zed-text-dark)] uppercase tracking-tight mb-4">Communication Hub</h4>
                            <p className="text-sm font-medium text-[var(--zed-text-muted)] leading-relaxed uppercase tracking-wider">
                                Initialize a candidate data stream to provide tactical support and manage the synchronization of their recruitment lifecycle in real-time.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LiveSupportChat;
