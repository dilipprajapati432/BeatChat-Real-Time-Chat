import { X, Shield, ShieldCheck, UserMinus, ShieldAlert, Copy, MessageCircle, Users } from 'lucide-react';
import useAuthStore from '../stores/authStore';
import useChatStore from '../stores/chatStore';
import toast from 'react-hot-toast';
import axios from 'axios';

const GroupMembersModal = ({ group, onClose }) => {
    const { user } = useAuthStore();
    const { onlineUsers, fetchGroups } = useChatStore();
    const isAdmin = group.admin?._id === (user?._id || user?.id) || group.admin === (user?._id || user?.id);

    const removeMember = async (memberId) => {
        try {
            const { token } = useAuthStore.getState();
            await axios.put(`${import.meta.env.VITE_API_URL}/api/groups/${group._id}/remove`,
                { userId: memberId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Member removed');
            await fetchGroups();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to remove member');
        }
    };

    const makeAdmin = async (memberId) => {
        try {
            const { token } = useAuthStore.getState();
            await axios.put(`${import.meta.env.VITE_API_URL}/api/groups/${group._id}/admin`,
                { userId: memberId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Admin rights transferred');
            await fetchGroups();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to transfer admin rights');
        }
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 animate-fade-in" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }} onClick={onClose}>
            <div className="w-full max-w-[400px] bg-white dark:bg-[#1a1c26]/90 rounded-[32px] shadow-[0_32px_80px_-16px_rgba(0,0,0,0.6)] overflow-hidden animate-scale-in border border-white/10 flex flex-col max-h-[90vh] backdrop-blur-2xl" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50 dark:bg-white/[0.03]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-primary-500/15 flex items-center justify-center text-primary-500 border border-primary-500/10 shadow-inner">
                            <Shield size={20} />
                        </div>
                        <div>
                            <h2 className="text-base font-black text-slate-800 dark:text-white leading-none tracking-tight">Group Details</h2>
                            <div className="flex items-center gap-1.5 mt-1.5">
                                <Users size={11} className="text-slate-400" />
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.15em]">{group.members?.length || 0} participants</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2.5 rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-white transition-all active:scale-90">
                        <X size={20} />
                    </button>
                </div>

                {/* Group Details */}
                <div className="px-6 py-7 border-b border-slate-100 dark:border-white/5 flex gap-5 items-center bg-white dark:bg-white/[0.01]">
                    <div className="w-20 h-20 rounded-[28px] bg-gradient-to-br from-primary-500/30 to-violet-500/30 flex items-center justify-center text-primary-500 font-black text-4xl border border-primary-500/10 overflow-hidden flex-shrink-0 shadow-2xl relative group/avatar">
                        {group.avatar ? (
                            <img src={group.avatar} className="w-full h-full object-cover transition-transform duration-700 group-hover/avatar:scale-110" alt="" />
                        ) : (
                            group.name.charAt(0).toUpperCase()
                        )}
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                            <Shield size={24} className="text-white" />
                        </div>
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-1.5 truncate leading-tight tracking-tight">{group.name}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed font-semibold opacity-80">
                            {group.description || "No description provided for this group."}
                        </p>
                    </div>
                </div>

                {/* Members List Section Header */}
                <div className="px-7 pt-6 pb-2">
                    <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.25em]">Participants List</h4>
                </div>

                {/* Members List */}
                <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1.5 custom-scrollbar">
                    {group.members?.map((member) => {
                        const isMemberAdmin = group.admin?._id === member._id || group.admin === member._id;
                        const isCurrentUser = member._id === user?._id;
                        const isOnline = onlineUsers.includes(member._id);

                        return (
                            <div key={member._id} className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-primary-500/[0.03] dark:hover:bg-primary-500/[0.05] transition-all group/item border border-transparent hover:border-primary-500/10">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <div className="w-12 h-12 rounded-full p-[2px] bg-gradient-to-tr from-primary-500/20 to-violet-500/20 shadow-lg">
                                            <img
                                                src={member.avatar || `https://ui-avatars.com/api/?name=${member.name}&background=random`}
                                                className="w-full h-full rounded-full object-cover bg-white dark:bg-slate-900 border-2 border-white dark:border-[#1a1c26]"
                                                alt={member.name}
                                            />
                                        </div>
                                        {isOnline && (
                                            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-success border-[3px] border-white dark:border-[#1a1c26] rounded-full shadow-lg"></span>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[15px] font-black text-slate-800 dark:text-white truncate">
                                                {member.name} {isCurrentUser && <span className="text-slate-400 dark:text-slate-500 font-bold ml-1"> (YOU)</span>}
                                            </span>
                                            {isMemberAdmin && <ShieldCheck size={14} className="text-primary-500 flex-shrink-0" title="Admin" />}
                                        </div>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-success shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse' : 'bg-slate-400'}`}></span>
                                            <p className={`text-[9px] font-black uppercase tracking-widest ${isOnline ? 'text-success' : 'text-slate-500'}`}>
                                                {isOnline ? 'Active Now' : 'Offline'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1">
                                    {!isCurrentUser && (
                                        <button
                                            onClick={() => { useChatStore.getState().setCurrentChat(member._id, member); onClose(); }}
                                            className="p-2.5 opacity-0 group-hover/item:opacity-100 text-slate-400 hover:text-primary-500 hover:bg-primary-500/10 rounded-xl transition-all active:scale-95"
                                            title="Message Member"
                                        >
                                            <MessageCircle size={18} />
                                        </button>
                                    )}
                                    {isAdmin && !isMemberAdmin && !isCurrentUser && (
                                        <>
                                            <button
                                                onClick={() => makeAdmin(member._id)}
                                                className="p-2.5 opacity-0 group-hover/item:opacity-100 text-slate-400 hover:text-amber-500 hover:bg-amber-500/10 rounded-xl transition-all active:scale-95"
                                                title="Make Admin (warning: you will lose admin rights)"
                                            >
                                                <ShieldAlert size={18} />
                                            </button>
                                            <button
                                                onClick={() => removeMember(member._id)}
                                                className="p-2.5 opacity-0 group-hover/item:opacity-100 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all active:scale-95"
                                                title="Remove Member"
                                            >
                                                <UserMinus size={18} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="px-7 py-6 bg-slate-50 dark:bg-white/[0.03] border-t border-slate-100 dark:border-white/5 space-y-4">
                    <div className="flex items-center justify-between p-1 rounded-2xl bg-primary-50 dark:bg-primary-500/10 border border-primary-100 dark:border-primary-500/30 shadow-inner">
                        <div className="px-4 py-2.5 flex flex-col">
                            <span className="text-[10px] font-black text-primary-500 uppercase tracking-[0.25em] mb-1.5">Invite Code</span>
                            <span className="text-2xl font-mono font-black text-slate-800 dark:text-white tracking-[0.3em] leading-none drop-shadow-sm">{group.groupCode}</span>
                        </div>
                        <button
                            onClick={() => { navigator.clipboard.writeText(group.groupCode); toast.success('Code copied!'); }}
                            className="w-12 h-12 flex items-center justify-center bg-primary-500 text-white rounded-[18px] hover:bg-primary-600 transition-all shadow-xl shadow-primary-500/30 active:scale-90 m-1"
                        >
                            <Copy size={18} />
                        </button>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-full py-4 bg-slate-200 dark:bg-white/5 hover:bg-slate-300 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 font-black rounded-2xl transition-all text-[12px] uppercase tracking-[0.25em] active:scale-[0.98] shadow-sm hover:shadow-md"
                    >
                        Close Profile
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GroupMembersModal;
