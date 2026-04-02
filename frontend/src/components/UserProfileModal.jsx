import { useEffect, useRef } from 'react';
import useChatStore from '../stores/chatStore';
import { Mail, Phone, X, MessageCircle, Circle } from 'lucide-react';

const VITE_API_URL = import.meta.env.VITE_API_URL;

const UserProfileModal = ({ userId, onClose }) => {
    const modalRef = useRef();
    const { users, socket, setCurrentChat, onlineUsers = [] } = useChatStore();
    const user = users.find(u => u._id === userId);
    const isOnline = onlineUsers.includes(userId);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                onClose();
            }
        };



        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [userId, onClose, socket]);

    if (!user) return null;

    const avatarUrl = user.avatar
        ? `${VITE_API_URL}${user.avatar}`
        : null;

    const initials = user.name
        ?.split(' ')
        .map(w => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || '?';

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in pointer-events-auto">
            <div
                ref={modalRef}
                className="w-full max-w-xs rounded-2xl shadow-2xl overflow-hidden relative animate-scale-in"
                style={{
                    background: 'var(--col-surface)',
                    border: '1px solid var(--col-border)',
                    boxShadow: '0 25px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.1)',
                }}
            >
                {/* Top accent bar */}
                <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #06b6d4)' }} />

                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/10 transition z-10"
                >
                    <X size={16} />
                </button>

                {/* Avatar + Name section */}
                <div className="flex flex-col items-center pt-7 pb-5 px-6">
                    {/* Avatar */}
                    <div className="relative mb-4">
                        <div className="w-24 h-24 rounded-full p-[2px]"
                            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #06b6d4)' }}>
                            {avatarUrl ? (
                                <img
                                    src={avatarUrl}
                                    alt={user.name}
                                    className="w-full h-full rounded-full object-cover"
                                    style={{ background: 'var(--col-surface)' }}
                                    onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                                />
                            ) : null}
                            {/* Fallback initials */}
                            <div
                                className="w-full h-full rounded-full flex items-center justify-center text-white font-bold text-xl"
                                style={{
                                    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                                    display: avatarUrl ? 'none' : 'flex',
                                }}
                            >
                                {initials}
                            </div>
                        </div>
                        {/* Online indicator */}
                        <span
                            className="absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 flex items-center justify-center"
                            style={{
                                background: isOnline ? '#34d399' : '#64748b',
                                borderColor: 'var(--col-surface)',
                            }}
                        />
                    </div>

                    {/* Name */}
                    <h2 className="text-lg font-bold text-slate-100 leading-tight">{user.name}</h2>

                    {/* Username + status */}
                    <div className="flex items-center gap-2 mt-1">
                        {user.username && (
                            <span className="text-xs text-indigo-400 font-medium">@{user.username}</span>
                        )}
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{
                                background: isOnline ? 'rgba(52,211,153,0.12)' : 'rgba(100,116,139,0.15)',
                                color: isOnline ? '#34d399' : '#94a3b8',
                            }}>
                            {isOnline ? '● Online' : '○ Offline'}
                        </span>
                    </div>
                </div>

                {/* Info rows */}
                <div className="px-5 pb-5 space-y-2">
                    {/* Email */}
                    <div className="flex items-center gap-3 p-3 rounded-xl"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: 'rgba(99,102,241,0.15)' }}>
                            <Mail size={14} className="text-indigo-400" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Email</p>
                            <p className="text-sm text-slate-200 font-medium truncate">{user.email}</p>
                        </div>
                    </div>

                    {/* Phone */}
                    {user.phone && (
                        <div className="flex items-center gap-3 p-3 rounded-xl"
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{ background: 'rgba(16,185,129,0.15)' }}>
                                <Phone size={14} className="text-emerald-400" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Phone</p>
                                <p className="text-sm text-slate-200 font-medium truncate">{user.phone}</p>
                            </div>
                        </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-2 pt-2">
                        <button
                            onClick={() => { setCurrentChat(userId, user); onClose(); }}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90 active:scale-95"
                            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff' }}
                        >
                            <MessageCircle size={15} />
                            Message
                        </button>
                        <button
                            onClick={onClose}
                            className="flex-1 py-2.5 rounded-xl text-slate-300 text-sm font-semibold transition-all hover:bg-white/10 active:scale-95"
                            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserProfileModal;
