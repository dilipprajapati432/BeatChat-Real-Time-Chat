import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import useAuthStore from '../stores/authStore';
import ClipLoader from 'react-spinners/ClipLoader';
import { User, Lock, ShieldAlert, Camera, Copy, LogOut, Mail, Phone, AtSign, Check, Ban, EyeOff, ArrowLeft, Code2, Github, Globe, Heart, Share2, Info, X, Palette, Bell, VolumeOff, Volume2, Moon, Sun, Monitor, MessageSquare, Terminal, Trash2, HelpCircle, Linkedin, Briefcase, Eye, ShieldCheck } from 'lucide-react';
import logo from '../assets/beatchat-logo.png';
import useSettingsStore from '../stores/settingsStore';
import useChatStore from '../stores/chatStore';

const ProfileSettings = ({ onBack, backHandlerRef }) => {
    const { user, login, logout } = useAuthStore();
    const { theme, setTheme, soundEnabled, setSoundEnabled, desktopNotifications, setDesktopNotifications, enterToSend, setEnterToSend } = useSettingsStore();

    // Detection for mobile vs desktop for default active tab behavior
    const isDesktop = window.innerWidth >= 768;
    const [activeTab, setActiveTab] = useState(isDesktop ? 'profile' : null);
    const [isMobileDetailView, setIsMobileDetailView] = useState(false);
    const [loading, setLoading] = useState(false);

    // Profile State
    const [name, setName] = useState(user?.name || '');
    const [username, setUsername] = useState(user?.username || '');
    const [email, setEmail] = useState(user?.email || '');
    const [phone, setPhone] = useState(user?.phone || '');

    // Email Update OTP State
    const [showEmailOtp, setShowEmailOtp] = useState(false);
    const [emailOtp, setEmailOtp] = useState('');
    const [pendingEmail, setPendingEmail] = useState('');

    // Password State
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Delete State
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteReason, setDeleteReason] = useState('');
    const [deleteAgreed, setDeleteAgreed] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // Deactivate State
    const [deactivatePassword, setDeactivatePassword] = useState('');
    const [deactivateReason, setDeactivateReason] = useState('');
    const [deactivateAgreed, setDeactivateAgreed] = useState(false);
    const [showDeactivateModal, setShowDeactivateModal] = useState(false);

    // Blocked Users State
    const [blockedUsers, setBlockedUsers] = useState([]);
    const [fetchingBlocked, setFetchingBlocked] = useState(false);

    // Hidden Chats State
    const [hiddenChats, setHiddenChats] = useState([]);
    const [fetchingHidden, setFetchingHidden] = useState(false);

    // Info Modals State
    const [showPrivacyModal, setShowPrivacyModal] = useState(false);
    const [showTermsModal, setShowTermsModal] = useState(false);

    const fetchBlockedUsers = async () => {
        setFetchingBlocked(true);
        try {
            const token = useAuthStore.getState().token;
            const res = await axios.get(
                import.meta.env.VITE_API_URL + '/api/users/blocked',
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setBlockedUsers(res.data);
        } catch (err) {
            console.error("Failed to fetch blocked users", err);
            toast.error("Failed to load blocked users");
        } finally {
            setFetchingBlocked(false);
        }
    };

    const fetchHiddenChats = async () => {
        setFetchingHidden(true);
        try {
            const token = useAuthStore.getState().token;
            const res = await axios.get(
                import.meta.env.VITE_API_URL + '/api/users/hidden',
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setHiddenChats(res.data);
        } catch (err) {
            console.error("Failed to fetch hidden chats", err);
            toast.error("Failed to load hidden chats");
        } finally {
            setFetchingHidden(false);
        }
    };

    const handleUnblock = async (userId) => {
        try {
            const token = useAuthStore.getState().token;
            await axios.post(
                `${import.meta.env.VITE_API_URL}/api/users/unblock/${userId}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success("User unblocked");
            setBlockedUsers(prev => prev.filter(u => u._id !== userId));
            // Update local user store to reflect change if needed, though mostly handled by fetch
        } catch (err) {
            toast.error("Failed to unblock user");
        }
    };

    const handleUnhide = async (userId) => {
        try {
            const token = useAuthStore.getState().token;
            const res = await axios.post(
                `${import.meta.env.VITE_API_URL}/api/users/unhide/${userId}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success("Chat unhidden");
            setHiddenChats(prev => prev.filter(u => u._id !== userId));

            // Update local users list using the standardized store method
            // This ensures the sidebar reflects the newly unhidden chat immediately
            useChatStore.getState().fetchUsers();

            // Update auth store user state
            const { user, setUser } = useAuthStore.getState();
            if (user && res.data.hiddenChats) {
                setUser({ ...user, hiddenChats: res.data.hiddenChats });
            }
        } catch (err) {
            toast.error("Failed to unhide chat");
        }
    };

    // Effect to fetch initial data for certain tabs
    useEffect(() => {
        if (activeTab === 'blocked' && blockedUsers.length === 0) fetchBlockedUsers();
        if (activeTab === 'hidden' && hiddenChats.length === 0) fetchHiddenChats();
    }, [activeTab]);

    // Register internal back handler for global swipe gestures
    useEffect(() => {
        const handleInternalBack = () => {
            // On mobile, if we are in a detail view, back should return to the list
            if (window.innerWidth < 768 && isMobileDetailView) {
                setIsMobileDetailView(false);
                setActiveTab(null);
                return true;
            }
            return false;
        };

        if (backHandlerRef) {
            backHandlerRef.current = handleInternalBack;
        }

        return () => {
            if (backHandlerRef) {
                backHandlerRef.current = null;
            }
        };
    }, [isMobileDetailView, backHandlerRef]);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = useAuthStore.getState().token;
            const res = await axios.put(
                import.meta.env.VITE_API_URL + '/api/auth/update-profile',
                { name, phone, username, email },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (res.data.emailUpdatePending) {
                toast.success('Please verify your new email');
                setPendingEmail(email);
                setShowEmailOtp(true);
                // Update other fields immediately
                login(res.data.user, token);
                if (res.data.preview) window.open(res.data.preview, '_blank');
            } else {
                // Update store
                login(res.data.user, token);
                toast.success('Profile updated successfully');
            }
        } catch (err) {
            toast.error(err.response?.data?.error || 'Update failed');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyEmailChange = async () => {
        try {
            const token = useAuthStore.getState().token;
            const res = await axios.post(
                import.meta.env.VITE_API_URL + '/api/auth/verify-email-change',
                { otp: emailOtp },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Email updated successfully');
            setShowEmailOtp(false);
            setEmailOtp('');

            // Update local user with verified DB record
            login(res.data.user, token);

        } catch (err) {
            toast.error(err.response?.data?.error || 'Verification failed');
        }
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('avatar', file);

        const toastId = toast.loading('Uploading avatar...');
        try {
            const token = useAuthStore.getState().token;
            const res = await axios.post(
                import.meta.env.VITE_API_URL + '/api/auth/upload-avatar',
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            // Update user in store (shallow merge)
            const updatedUser = { ...user, avatar: res.data.avatar };
            login(updatedUser, token);

            toast.success('Avatar updated!', { id: toastId });
        } catch (err) {
            toast.error('Upload failed', { id: toastId });
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) return toast.error("New passwords don't match");

        setLoading(true);
        try {
            const token = useAuthStore.getState().token;
            await axios.put(
                import.meta.env.VITE_API_URL + '/api/auth/change-password',
                { oldPassword, newPassword },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Password changed successfully');
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Change failed');
        } finally {
            setLoading(false);
        }
    };

    const handleDeactivate = async () => {
        try {
            const token = useAuthStore.getState().token;
            await axios.post(
                import.meta.env.VITE_API_URL + '/api/auth/deactivate',
                { password: deactivatePassword },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Account deactivated');
            logout();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Deactivation failed');
        }
    };

    const handleDeleteAccount = async () => {
        try {
            const token = useAuthStore.getState().token;
            await axios.delete(
                import.meta.env.VITE_API_URL + '/api/auth/delete-account',
                {
                    data: { password: deletePassword },
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            toast.success('Account deleted permanently. Bye!');
            logout();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Deletion failed');
        }
    };

    const inputCls = "w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-all focus:outline-none text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20";
    const inputStyle = {};
    const inputFocus = (e) => { };
    const inputBlur = (e) => { };
    const labelCls = "block text-[10px] font-bold uppercase tracking-widest mb-1.5 text-slate-500 dark:text-slate-400";

    return (
        <div className="h-full flex flex-col overflow-hidden" style={{ background: 'var(--settings-page-bg)' }}>
            <div className="flex-1 max-w-4xl w-full mx-auto px-2 py-4 md:p-8 flex flex-col min-h-0 animate-fade-in">
                <div className="mb-8 flex items-center gap-4 flex-shrink-0">
                    {onBack && (
                        <button onClick={onBack} className="p-2 rounded-xl transition-colors" style={{ background: 'rgba(139,92,246,0.1)', color: '#a78bfa' }} title="Go Back">
                            <ArrowLeft size={22} />
                        </button>
                    )}
                    <div>
                        <h2 className="text-3xl font-heading font-extrabold" style={{ background: 'linear-gradient(135deg,#c4b5fd,#8b5cf6,#22d3ee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Settings</h2>
                        <p className="text-slate-500 mt-1 text-sm">Manage your account and preferences.</p>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col md:flex-row transition-all duration-500" style={{ minHeight: (window.innerWidth < 768 && !isMobileDetailView) ? 'auto' : 520, borderRadius: 24, border: '1px solid var(--settings-container-border)', boxShadow: '0 20px 80px rgba(0,0,0,0.5)', transform: 'translateZ(0)' }}>
                    {/* Sidebar / Tabs */}
                    <div className={`w-full md:w-60 pt-4 px-4 pb-12 flex-shrink-0 transition-all duration-300 overflow-y-auto custom-scrollbar ${isMobileDetailView ? 'hidden md:block' : 'block'}`} style={{ background: 'var(--settings-panel-bg)', borderRight: '1px solid var(--settings-container-border)' }}>
                        <div className="space-y-2 pb-6">
                            {[
                                { id: 'profile', label: 'My Profile', icon: User },
                                { id: 'chat_display', label: 'Chat & Display', icon: Palette },
                                { id: 'notifications', label: 'Notifications', icon: Bell },
                                { id: 'password', label: 'Password', icon: Lock },
                                { id: 'blocked', label: 'Blocked Users', icon: Ban },
                                { id: 'hidden', label: 'Hidden Chats', icon: EyeOff },
                                { id: 'danger', label: 'Danger Zone', icon: ShieldAlert },
                                { id: 'about', label: 'About App', icon: Info },

                            ].map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button key={tab.id}
                                        onClick={() => {
                                            setActiveTab(tab.id);
                                            setIsMobileDetailView(true);
                                            if (tab.id === 'blocked') fetchBlockedUsers();
                                            if (tab.id === 'hidden') fetchHiddenChats();
                                        }}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-left border border-transparent group ${!isActive ? 'hover:bg-white/5 hover:translate-x-1 hover:text-white' : ''}`}
                                        style={{
                                            background: isActive ? 'linear-gradient(135deg,rgba(139,92,246,0.2),rgba(6,182,212,0.15))' : 'transparent',
                                            color: isActive ? '#c4b5fd' : '#94a3b8',
                                            border: isActive ? '1px solid rgba(139,92,246,0.3)' : '1px solid transparent',
                                            boxShadow: isActive ? '0 10px 40px -15px rgba(139,92,246,0.3)' : 'none'
                                        }}>
                                        <div className={`p-2 rounded-lg transition-all duration-300 ${isActive ? 'bg-primary-500/20 text-primary-400' : 'bg-slate-800/40 text-slate-500 group-hover:bg-slate-700/60 group-hover:text-primary-300'}`}>
                                            <Icon size={18} className="transition-transform group-hover:scale-110" />
                                        </div>
                                        <span className="font-medium text-sm">{tab.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className={`flex-1 p-4 md:p-10 overflow-y-auto custom-scrollbar transition-all duration-500 ${isMobileDetailView ? 'block animate-fade-in' : 'hidden md:block'}`} style={{ background: 'var(--settings-content-bg)' }}>

                        {/* Mobile Back Button (Detail View) */}
                        {isMobileDetailView && (
                            <button
                                onClick={() => { setIsMobileDetailView(false); setActiveTab(null); }}
                                className="md:hidden flex items-center gap-2 text-slate-400 hover:text-primary-400 mb-6 font-bold text-sm bg-white/5 hover:bg-white/10 px-5 py-2.5 rounded-2xl border border-white/5 w-fit transition-all hover:-translate-x-1 active:scale-95"
                            >
                                <ArrowLeft size={18} />
                                Back to Settings
                            </button>
                        )}
                        {/* Profile Tab */}
                        {activeTab === 'profile' && (
                            <div className="max-w-xl mx-auto animate-fade-in space-y-8 pb-12">
                                {/* Avatar Section */}
                                <div className="flex items-center gap-5">
                                    <div className="relative group flex-shrink-0">
                                        <div className="w-20 h-20 rounded-full p-[2px]" style={{ background: 'linear-gradient(135deg,#8b5cf6,#06b6d4,#d946ef)' }}>
                                            <img src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name}&background=random`} alt="Avatar"
                                                className="w-full h-full rounded-full object-cover" style={{ border: '3px solid #0a0118' }} />
                                        </div>
                                        <label className="absolute bottom-0 right-0 p-1.5 rounded-full cursor-pointer transition-all group-hover:scale-110"
                                            style={{ background: 'linear-gradient(135deg,#8b5cf6,#06b6d4)', boxShadow: '0 0 10px rgba(139,92,246,0.5)' }}>
                                            <Camera size={13} className="text-white" />
                                            <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                                        </label>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white">{user?.name}</h3>
                                        <p className="text-slate-500 text-sm">@{user?.username || 'user'}</p>

                                    </div>
                                </div>

                                <form onSubmit={handleUpdateProfile} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {[{ label: 'Display Name', icon: User, type: 'text', val: name, set: setName }, { label: 'Username', icon: AtSign, type: 'text', val: username, set: setUsername, ph: 'username' }, { label: 'Email', icon: Mail, type: 'email', val: email, set: setEmail }, { label: 'Phone', icon: Phone, type: 'tel', val: phone, set: setPhone }].map(({ label, icon: Icon, type, val, set, ph }) => (
                                            <div key={label}>
                                                <label className={labelCls} style={{ color: '#64748b' }}>{label}</label>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none" style={{ color: '#8b5cf6' }}><Icon size={15} /></div>
                                                    <input type={type} value={val} onChange={e => set(e.target.value)} placeholder={ph} className={`${inputCls} pl-9`} style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="pt-2">
                                        <button type="submit" disabled={loading} className="relative overflow-hidden flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm text-white transition-all duration-300 group disabled:opacity-50 bg-btn-primary shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50"
                                        >
                                            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
                                            <span className="relative flex items-center gap-2">{loading ? <ClipLoader size={16} color="white" /> : <><Check size={16} /> Save Changes</>}</span>
                                        </button>
                                    </div>
                                </form>

                                {/* Share Profile */}
                                <div className="pt-6" style={{ borderTop: '1px solid rgba(139,92,246,0.15)' }}>
                                    <h3 className="text-base font-bold text-white mb-4">Share Profile</h3>
                                    <div className="p-4 rounded-2xl flex flex-col sm:flex-row gap-5 items-center" style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)' }}>
                                        <div className="p-2 rounded-xl bg-white flex-shrink-0">
                                            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${window.location.origin}/invite/${user._id}`)}`} alt="QR" className="w-20 h-20" />
                                        </div>
                                        <div className="flex-1 w-full space-y-2">
                                            <div className="flex items-center gap-2 p-1.5 pl-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                                <input type="text" readOnly value={`${window.location.origin}/invite/${user._id}`} className="flex-1 bg-transparent border-none text-xs text-slate-400 focus:outline-none truncate" />
                                                <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/invite/${user._id}`); toast.success('Link copied!'); }} className="p-1.5 rounded-lg transition-all" style={{ background: 'rgba(139,92,246,0.2)', color: '#a78bfa' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(139,92,246,0.35)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(139,92,246,0.2)'}>
                                                    <Copy size={14} />
                                                </button>
                                            </div>
                                            <p className="text-xs text-slate-600">Share this link so friends can add you directly.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Password Tab */}
                        {activeTab === 'password' && (
                            <div className="max-w-md mx-auto animate-fade-in pb-12">
                                <h3 className="text-xl font-bold text-white mb-6">Change Password</h3>
                                <form onSubmit={handleChangePassword} className="space-y-4">
                                    {[{ label: 'Current Password', val: oldPassword, set: setOldPassword }, { label: 'New Password', val: newPassword, set: setNewPassword, min: 6 }, { label: 'Confirm New Password', val: confirmPassword, set: setConfirmPassword }].map(({ label, val, set, min }) => (
                                        <div key={label}>
                                            <label className={labelCls} style={{ color: '#64748b' }}>{label}</label>
                                            <input type="password" value={val} onChange={e => set(e.target.value)} minLength={min} required className={inputCls} style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
                                        </div>
                                    ))}
                                    <div className="pt-2">
                                        <button type="submit" disabled={loading} className="relative overflow-hidden px-6 py-2.5 rounded-xl font-bold text-sm text-white transition-all group disabled:opacity-50 bg-btn-primary shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50"
                                        >
                                            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
                                            <span className="relative">{loading ? 'Updating…' : 'Update Password'}</span>
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Blocked Users Tab */}
                        {activeTab === 'blocked' && (
                            <div className="max-w-xl mx-auto animate-fade-in pb-12">
                                <h3 className="text-xl font-bold text-white mb-1">Blocked Users</h3>
                                <p className="text-slate-500 text-sm mb-5">Blocked users cannot message you.</p>
                                {fetchingBlocked ? <div className="flex justify-center p-8"><ClipLoader color="#8b5cf6" /></div>
                                    : blockedUsers.length > 0 ? (
                                        <div className="space-y-2">
                                            {blockedUsers.map(u => (
                                                <div key={u._id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                                                    <div className="flex items-center gap-3">
                                                        <img src={u.avatar || `https://ui-avatars.com/api/?name=${u.name}&background=random`} alt={u.name} className="w-9 h-9 rounded-full object-cover" />
                                                        <div><h4 className="font-bold text-white text-sm">{u.name}</h4><p className="text-xs text-slate-500">@{u.username}</p></div>
                                                    </div>
                                                    <button onClick={() => handleUnblock(u._id)} className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all" style={{ background: 'rgba(139,92,246,0.1)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.2)' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(139,92,246,0.2)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(139,92,246,0.1)'}>
                                                        Unblock
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center p-8 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(139,92,246,0.2)' }}>
                                            <Ban className="w-8 h-8 mx-auto mb-2" style={{ color: 'rgba(139,92,246,0.3)' }} />
                                            <p className="text-slate-500 font-medium">No blocked users</p>
                                        </div>
                                    )}
                            </div>
                        )}

                        {/* Hidden Chats Tab */}
                        {activeTab === 'hidden' && (
                            <div className="max-w-xl mx-auto animate-fade-in pb-12">
                                <h3 className="text-xl font-bold text-white mb-1">Hidden Chats</h3>
                                <p className="text-slate-500 text-sm mb-5">Hidden chats won't appear in your main list.</p>
                                {fetchingHidden ? <div className="flex justify-center p-8"><ClipLoader color="#8b5cf6" /></div>
                                    : hiddenChats.length > 0 ? (
                                        <div className="space-y-2">
                                            {hiddenChats.map(u => (
                                                <div key={u._id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                                                    <div className="flex items-center gap-3">
                                                        <img src={u.avatar || `https://ui-avatars.com/api/?name=${u.name}&background=random`} alt={u.name} className="w-9 h-9 rounded-full object-cover" />
                                                        <div><h4 className="font-bold text-white text-sm">{u.name}</h4><p className="text-xs text-slate-500">@{u.username}</p></div>
                                                    </div>
                                                    <button onClick={() => handleUnhide(u._id)} className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all" style={{ background: 'rgba(6,182,212,0.1)', color: '#22d3ee', border: '1px solid rgba(6,182,212,0.2)' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(6,182,212,0.2)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(6,182,212,0.1)'}>
                                                        Unhide
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center p-8 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(6,182,212,0.2)' }}>
                                            <EyeOff className="w-8 h-8 mx-auto mb-2" style={{ color: 'rgba(6,182,212,0.3)' }} />
                                            <p className="text-slate-500 font-medium">No hidden chats</p>
                                        </div>
                                    )}
                            </div>
                        )}

                        {/* Danger Zone Tab */}
                        {activeTab === 'danger' && (
                            <div className="max-w-xl mx-auto animate-fade-in space-y-4 pb-12">
                                <h3 className="text-xl font-bold text-white mb-2">Danger Zone</h3>
                                <div className="p-5 rounded-2xl" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
                                    <h4 className="text-base font-bold mb-1" style={{ color: '#fbbf24' }}>Deactivate Account</h4>
                                    <p className="text-sm text-slate-500 mb-4">Your profile will be hidden. You can reactivate anytime by logging in.</p>
                                    <button onClick={() => setShowDeactivateModal(true)} className="px-4 py-2 rounded-xl font-bold text-sm transition-all" style={{ background: 'rgba(245,158,11,0.1)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(245,158,11,0.2)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(245,158,11,0.1)'}>
                                        Deactivate Account
                                    </button>
                                </div>
                                <div className="p-5 rounded-2xl" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
                                    <h4 className="text-base font-bold mb-1" style={{ color: '#f87171' }}>Delete Account</h4>
                                    <p className="text-sm text-slate-500 mb-4">Permanently delete your account and all data. This cannot be undone.</p>
                                    <button onClick={() => setShowDeleteModal(true)} className="px-4 py-2 rounded-xl font-bold text-sm text-white transition-all" style={{ background: 'linear-gradient(135deg,#dc2626,#b91c1c)', boxShadow: '0 0 15px rgba(239,68,68,0.3)' }} onMouseEnter={e => e.currentTarget.style.boxShadow = '0 0 25px rgba(239,68,68,0.5)'} onMouseLeave={e => e.currentTarget.style.boxShadow = '0 0 15px rgba(239,68,68,0.3)'}>
                                        Delete Account
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Chat & Display Tab */}
                        {activeTab === 'chat_display' && (
                            <div className="max-w-xl mx-auto animate-fade-in pb-12 space-y-8">
                                <h3 className="text-xl font-bold text-white mb-6">Chat & Display</h3>

                                {/* Theme Selection */}
                                <div>
                                    <h4 className="text-sm font-bold text-slate-300 mb-4 uppercase tracking-widest text-[10px]">Theme Preference</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        {[
                                            { id: 'dark', label: 'Dark Mode', icon: Moon },
                                            { id: 'light', label: 'Light Mode', icon: Sun },
                                            { id: 'system', label: 'System', icon: Monitor },
                                        ].map(t => {
                                            const active = theme === t.id;
                                            return (
                                                <button key={t.id} onClick={() => setTheme(t.id)}
                                                    className={`p-4 rounded-2xl flex flex-col items-center gap-3 transition-all duration-300 border ${active ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-400 scale-[1.02] shadow-[0_0_20px_rgba(99,102,241,0.15)]' : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200'}`}
                                                >
                                                    <t.icon size={26} className={active ? 'text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]' : 'text-slate-500'} />
                                                    <span className="text-xs font-bold tracking-wide uppercase">{t.label}</span>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Notifications Tab */}
                        {activeTab === 'notifications' && (
                            <div className="max-w-xl mx-auto animate-fade-in pb-12">
                                <h3 className="text-xl font-bold text-white mb-6">Notifications & Sounds</h3>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 transition-colors hover:bg-white/10">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2.5 rounded-xl bg-pink-500/10 text-pink-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
                                                {soundEnabled ? <Volume2 size={20} /> : <VolumeOff size={20} />}
                                            </div>
                                            <div>
                                                <h5 className="text-sm font-bold text-white">In-App Sounds</h5>
                                                <p className="text-xs text-slate-500 mt-1 uppercase tracking-wide">Play sounds for new messages and interactions</p>
                                            </div>
                                        </div>
                                        <button onClick={() => setSoundEnabled(!soundEnabled)} className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-300 focus:outline-none ${soundEnabled ? 'bg-pink-500' : 'bg-slate-700'}`}>
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 shadow-sm ${soundEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 transition-colors hover:bg-white/10">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
                                                <Bell size={20} />
                                            </div>
                                            <div>
                                                <h5 className="text-sm font-bold text-white">Desktop Notifications</h5>
                                                <p className="text-xs text-slate-500 mt-1 uppercase tracking-wide">Show native OS notifications for messages</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                if (!desktopNotifications && window.Notification && Notification.permission !== 'granted') {
                                                    Notification.requestPermission().then(perm => {
                                                        if (perm === 'granted') setDesktopNotifications(true);
                                                    });
                                                } else {
                                                    setDesktopNotifications(!desktopNotifications);
                                                }
                                            }}
                                            className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-300 focus:outline-none ${desktopNotifications ? 'bg-cyan-500' : 'bg-slate-700'}`}
                                        >
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 shadow-sm ${desktopNotifications ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}



                        {/* About App Tab */}
                        {activeTab === 'about' && (
                            <div className="max-w-2xl mx-auto animate-fade-in pb-12">
                                <div className="p-6 sm:p-10 rounded-3xl bg-black/20 border border-white/5 shadow-2xl relative flex flex-col items-center overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 pointer-events-none" />

                                    {/* Branding Hero */}
                                    <div className="relative z-10 flex flex-col items-center mb-10">
                                        <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-[2px] shadow-2xl shadow-indigo-500/20 mb-6 group transition-transform hover:-translate-y-1 duration-300">
                                            <div className="w-full h-full bg-[#1a1d27] rounded-[22px] overflow-hidden flex items-center justify-center p-4">
                                                <img src={logo} alt="BeatChat Logo" className="w-full h-full object-contain filter drop-shadow-[0_0_10px_rgba(139,92,246,0.3)] transition-transform group-hover:scale-110 duration-500" />
                                            </div>
                                        </div>
                                        <h3 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">BeatChat</h3>
                                        <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/5 backdrop-blur-sm">
                                            <p className="text-[11px] font-bold text-slate-400 tracking-widest uppercase">Version 1.0.0 (Beta)</p>
                                        </div>
                                    </div>

                                    {/* Description Card */}
                                    <div className="relative z-10 bg-white/5 rounded-2xl p-4 sm:p-6 mb-6 text-sm text-slate-300 leading-relaxed border border-white/5 text-center w-full shadow-sm">
                                        <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 mb-3 border border-indigo-500/20">
                                            <Code2 size={20} />
                                        </div>
                                        <p className="mb-3">A premium, real-time messaging application engineered with modern web technologies including <span className="text-indigo-400 font-semibold">React</span>, <span className="text-purple-400 font-semibold">Socket.io</span>, and <span className="text-pink-400 font-semibold">Node.js</span>.</p>
                                        <div className="flex items-center justify-center gap-2 mt-4 text-xs">
                                            <Heart size={12} className="text-rose-500 fill-rose-500" />
                                            <span className="text-slate-500">Built with passion by</span>
                                            <a href="https://www.linkedin.com/in/dilip-kohar-014627293" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 transition-colors font-bold">Dilip Prajapati</a>
                                        </div>
                                    </div>

                                    {/* Interactive Grid */}
                                    <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mb-8">
                                        <button onClick={() => setShowPrivacyModal(true)} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all duration-300 group shadow-sm">
                                            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:scale-110 transition-transform">
                                                <ShieldCheck size={18} />
                                            </div>
                                            <div className="text-left">
                                                <h4 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">Privacy Notice</h4>
                                                <p className="text-[10px] text-slate-500 uppercase tracking-wide">Data handling</p>
                                            </div>
                                        </button>
                                        <button onClick={() => setShowTermsModal(true)} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all duration-300 group shadow-sm">
                                            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform">
                                                <ShieldAlert size={18} />
                                            </div>
                                            <div className="text-left">
                                                <h4 className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors">Terms of Service</h4>
                                                <p className="text-[10px] text-slate-500 uppercase tracking-wide">Guidelines</p>
                                            </div>
                                        </button>
                                        <button
                                            onClick={() => {
                                                const shareData = { title: 'BeatChat', text: 'Check out BeatChat, a premium real-time messaging PWA!', url: window.location.origin };
                                                if (navigator.share) navigator.share(shareData);
                                                else { navigator.clipboard.writeText(window.location.origin); toast.success('Link copied!'); }
                                            }}
                                            className="sm:col-span-2 flex items-center justify-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 hover:from-indigo-500/20 hover:to-purple-500/20 border border-indigo-500/20 transition-all duration-300 font-bold text-indigo-400 hover:text-white group"
                                        >
                                            <Share2 size={18} className="transition-transform group-hover:scale-110" />
                                            <span>Share App with Friends</span>
                                        </button>
                                    </div>

                                    {/* Support Footer */}
                                    <div className="relative z-10 pt-6 border-t border-white/5 w-full">
                                        <div className="flex items-center gap-3 mb-5 px-1">
                                            <Briefcase size={16} className="text-indigo-400" />
                                            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-[0.2em]">Contact & Support</h4>
                                        </div>

                                        <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-pink-500/10 border border-indigo-500/20 shadow-inner">
                                            <p className="text-sm text-slate-300 text-center mb-6">Need assistance or looking to collaborate? Reach out via the channels below.</p>
                                            <div className="flex flex-col sm:flex-row gap-3 w-full">
                                                <a href="mailto:beatchat.official@gmail.com?subject=BeatChat Support Request" className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500 hover:text-white border border-indigo-500/20 transition-all">
                                                    <Mail size={16} /> Support
                                                </a>
                                                <a href="mailto:dilipkohar4320@gmail.com?subject=Developer Inquiry" className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm text-purple-400 bg-purple-500/10 hover:bg-purple-500 hover:text-white border border-purple-500/20 transition-all">
                                                    <AtSign size={16} /> Developer
                                                </a>
                                                <a href="https://www.linkedin.com/in/dilip-kohar-014627293" target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm text-blue-400 bg-blue-500/10 hover:bg-blue-500 hover:text-white border border-blue-500/20 transition-all">
                                                    <Linkedin size={16} /> LinkedIn
                                                </a>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="relative z-10 mt-8 w-full flex flex-col items-center justify-center gap-1 text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                                        <p>&copy; {new Date().getFullYear()} BeatChat</p>
                                        <p>All Rights Reserved</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Deactivate Confirmation Modal */}
                {showDeactivateModal && (
                    <div className="fixed inset-0 flex items-center justify-center z-50 p-4 animate-fade-in" style={{ background: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(10px)' }}>
                        <div className="p-6 rounded-3xl w-full max-w-md animate-scale-in custom-scrollbar overflow-y-auto" style={{ background: '#1a1d27', border: '1px solid rgba(245,158,11,0.3)', boxShadow: '0 30px 80px rgba(0,0,0,0.8)', maxHeight: '90vh' }}>
                            {/* Header */}
                            <div className="flex flex-col items-center mb-5">
                                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3" style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.2)' }}>
                                    <ShieldAlert size={28} style={{ color: '#fbbf24' }} />
                                </div>
                                <h3 className="text-xl font-bold text-white">Deactivate Account</h3>
                                <p className="text-slate-400 text-sm mt-1 text-center">Your account will be hidden until you log back in.</p>
                            </div>

                            {/* Reason */}
                            <div className="mb-4">
                                <label className="block text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: '#64748b' }}>Why are you deactivating?</label>
                                <select
                                    value={deactivateReason}
                                    onChange={e => setDeactivateReason(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl text-sm font-medium focus:outline-none transition-all"
                                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: deactivateReason ? '#e2e8f0' : '#64748b' }}
                                    onFocus={inputFocus} onBlur={inputBlur}>
                                    <option value="" disabled style={{ background: '#1a1d27' }}>Select a reason…</option>
                                    <option value="taking_break" style={{ background: '#1a1d27' }}>Taking a break</option>
                                    <option value="too_many_notifs" style={{ background: '#1a1d27' }}>Too many notifications</option>
                                    <option value="privacy_concerns" style={{ background: '#1a1d27' }}>Privacy concerns</option>
                                    <option value="not_useful" style={{ background: '#1a1d27' }}>Not finding it useful</option>
                                    <option value="switching_app" style={{ background: '#1a1d27' }}>Switching to another app</option>
                                    <option value="other" style={{ background: '#1a1d27' }}>Other reason</option>
                                </select>
                            </div>

                            {/* Password */}
                            <div className="mb-4">
                                <label className="block text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: '#64748b' }}>Confirm your password</label>
                                <input
                                    type="password"
                                    placeholder="Enter your password"
                                    value={deactivatePassword}
                                    onChange={e => setDeactivatePassword(e.target.value)}
                                    className={inputCls}
                                    style={inputStyle}
                                    onFocus={inputFocus}
                                    onBlur={inputBlur}
                                />
                            </div>

                            {/* Terms */}
                            <div className="mb-5 p-3 rounded-xl" style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)' }}>
                                <p className="text-xs text-slate-400 leading-relaxed mb-3">
                                    By deactivating, you agree that your profile, messages, and activity will be temporarily hidden. Your data is retained and your account will be fully restored when you log back in.
                                </p>
                                <label className="flex items-start gap-2.5 cursor-pointer group">
                                    <div className="relative flex-shrink-0 mt-0.5">
                                        <input
                                            type="checkbox"
                                            checked={deactivateAgreed}
                                            onChange={e => setDeactivateAgreed(e.target.checked)}
                                            className="sr-only"
                                        />
                                        <div className="w-4 h-4 rounded flex items-center justify-center transition-all" style={{ background: deactivateAgreed ? '#f59e0b' : 'rgba(255,255,255,0.05)', border: deactivateAgreed ? '1px solid #f59e0b' : '1px solid rgba(255,255,255,0.15)' }}>
                                            {deactivateAgreed && <Check size={10} color="#1a1a1a" strokeWidth={3} />}
                                        </div>
                                    </div>
                                    <span className="text-xs font-semibold" style={{ color: deactivateAgreed ? '#fbbf24' : '#64748b' }}>I understand and agree to the terms above</span>
                                </label>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => { setShowDeactivateModal(false); setDeactivatePassword(''); setDeactivateReason(''); setDeactivateAgreed(false); }}
                                    className="flex-1 px-4 py-2.5 rounded-xl font-bold text-sm transition-colors text-slate-400"
                                    style={{ background: 'rgba(255,255,255,0.05)' }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.09)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>
                                    Cancel
                                </button>
                                <button
                                    disabled={!deactivatePassword || !deactivateReason || !deactivateAgreed}
                                    onClick={() => { setShowDeactivateModal(false); handleDeactivate(); }}
                                    className="flex-1 px-4 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                    style={{ background: 'linear-gradient(135deg,#d97706,#f59e0b)', color: '#1a1a1a', boxShadow: '0 0 15px rgba(245,158,11,0.3)' }}
                                    onMouseEnter={e => { if (deactivatePassword && deactivateReason && deactivateAgreed) e.currentTarget.style.boxShadow = '0 0 25px rgba(245,158,11,0.5)'; }}
                                    onMouseLeave={e => e.currentTarget.style.boxShadow = '0 0 15px rgba(245,158,11,0.3)'}>
                                    Yes, Deactivate
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {showDeleteModal && (
                    <div className="fixed inset-0 flex items-center justify-center z-50 p-4 animate-fade-in" style={{ background: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(10px)' }}>
                        <div className="p-6 rounded-3xl w-full max-w-md animate-scale-in custom-scrollbar overflow-y-auto" style={{ background: '#1a1d27', border: '1px solid rgba(239,68,68,0.3)', boxShadow: '0 30px 80px rgba(0,0,0,0.8)', maxHeight: '90vh' }}>
                            {/* Header */}
                            <div className="flex flex-col items-center mb-5">
                                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                                    <ShieldAlert size={28} style={{ color: '#f87171' }} />
                                </div>
                                <h3 className="text-xl font-bold text-white">Delete Account</h3>
                                <p className="text-slate-400 text-sm mt-1 text-center">This is permanent and cannot be undone.</p>
                            </div>

                            {/* Reason */}
                            <div className="mb-4">
                                <label className="block text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: '#64748b' }}>Why are you deleting?</label>
                                <select
                                    value={deleteReason}
                                    onChange={e => setDeleteReason(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl text-sm font-medium focus:outline-none transition-all"
                                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: deleteReason ? '#e2e8f0' : '#64748b' }}
                                    onFocus={inputFocus} onBlur={inputBlur}>
                                    <option value="" disabled style={{ background: '#1a1d27' }}>Select a reason…</option>
                                    <option value="bad_experience" style={{ background: '#1a1d27' }}>Had a bad experience</option>
                                    <option value="privacy_concerns" style={{ background: '#1a1d27' }}>Privacy / security concerns</option>
                                    <option value="not_useful" style={{ background: '#1a1d27' }}>Not finding it useful</option>
                                    <option value="switching_app" style={{ background: '#1a1d27' }}>Switching to another app</option>
                                    <option value="too_many_ads" style={{ background: '#1a1d27' }}>Too many notifications / spam</option>
                                    <option value="duplicate_account" style={{ background: '#1a1d27' }}>Have a duplicate account</option>
                                    <option value="other" style={{ background: '#1a1d27' }}>Other reason</option>
                                </select>
                            </div>

                            {/* Password */}
                            <div className="mb-4">
                                <label className="block text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: '#64748b' }}>Confirm your password</label>
                                <input
                                    type="password"
                                    placeholder="Enter your password"
                                    value={deletePassword}
                                    onChange={e => setDeletePassword(e.target.value)}
                                    className={inputCls}
                                    style={inputStyle}
                                    onFocus={inputFocus}
                                    onBlur={inputBlur}
                                    autoFocus
                                />
                            </div>

                            {/* Terms */}
                            <div className="mb-5 p-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)' }}>
                                <p className="text-xs text-slate-400 leading-relaxed mb-3">
                                    Deleting your account will <span className="text-red-400 font-semibold">permanently erase</span> all your messages, media, profile data, and group memberships. This action cannot be reversed, recovered, or undone by anyone including our support team.
                                </p>
                                <label className="flex items-start gap-2.5 cursor-pointer group">
                                    <div className="relative flex-shrink-0 mt-0.5">
                                        <input
                                            type="checkbox"
                                            checked={deleteAgreed}
                                            onChange={e => setDeleteAgreed(e.target.checked)}
                                            className="sr-only"
                                        />
                                        <div className="w-4 h-4 rounded flex items-center justify-center transition-all" style={{ background: deleteAgreed ? '#ef4444' : 'rgba(255,255,255,0.05)', border: deleteAgreed ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.15)' }}>
                                            {deleteAgreed && <Check size={10} color="white" strokeWidth={3} />}
                                        </div>
                                    </div>
                                    <span className="text-xs font-semibold" style={{ color: deleteAgreed ? '#f87171' : '#64748b' }}>I understand this is permanent and cannot be undone</span>
                                </label>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => { setShowDeleteModal(false); setDeletePassword(''); setDeleteReason(''); setDeleteAgreed(false); }}
                                    className="flex-1 px-4 py-2.5 rounded-xl font-bold text-sm transition-colors text-slate-400"
                                    style={{ background: 'rgba(255,255,255,0.05)' }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.09)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>
                                    Cancel
                                </button>
                                <button
                                    disabled={!deletePassword || !deleteReason || !deleteAgreed}
                                    onClick={handleDeleteAccount}
                                    className="flex-1 px-4 py-2.5 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                    style={{ background: 'linear-gradient(135deg,#dc2626,#b91c1c)', boxShadow: '0 0 15px rgba(239,68,68,0.3)' }}
                                    onMouseEnter={e => { if (deletePassword && deleteReason && deleteAgreed) e.currentTarget.style.boxShadow = '0 0 25px rgba(239,68,68,0.5)'; }}
                                    onMouseLeave={e => e.currentTarget.style.boxShadow = '0 0 15px rgba(239,68,68,0.3)'}>
                                    Delete Forever
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Email Verification Modal */}
                {showEmailOtp && (
                    <div className="fixed inset-0 flex items-center justify-center z-50 p-4 animate-fade-in" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
                        <div className="p-6 rounded-3xl max-w-sm w-full animate-scale-in" style={{ background: '#0f0525', border: '1px solid rgba(139,92,246,0.3)', boxShadow: '0 25px 60px rgba(0,0,0,0.7)' }}>
                            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4 mx-auto" style={{ background: 'rgba(139,92,246,0.1)' }}>
                                <Mail size={26} style={{ color: '#a78bfa' }} />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2 text-center">Verify Email</h3>
                            <p className="text-slate-500 mb-5 text-center text-sm">Enter the code sent to <span className="text-primary-300 font-semibold">{pendingEmail}</span></p>
                            <input type="text" placeholder="0 0 0 0 0 0" value={emailOtp} onChange={e => setEmailOtp(e.target.value)}
                                className="w-full p-3 rounded-xl mb-4 text-center tracking-[0.4em] text-xl font-mono font-bold text-white focus:outline-none"
                                style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.3)' }} autoFocus />
                            <div className="flex gap-3">
                                <button onClick={() => setShowEmailOtp(false)} className="flex-1 px-4 py-2.5 rounded-xl font-bold text-sm text-slate-400" style={{ background: 'rgba(255,255,255,0.05)' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.09)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>Cancel</button>
                                <button onClick={handleVerifyEmailChange} className="flex-1 px-4 py-2.5 rounded-xl font-bold text-sm text-white bg-btn-primary shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50">Verify</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Privacy Notice Modal */}
                {showPrivacyModal && (
                    <div className="fixed inset-0 flex items-center justify-center z-50 p-4 animate-fade-in" style={{ background: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(10px)' }}>
                        <div className="rounded-3xl w-full max-w-2xl animate-scale-in flex flex-col" style={{ background: '#1a1d27', border: '1px solid rgba(139,92,246,0.2)', boxShadow: '0 30px 80px rgba(0,0,0,0.8)', maxHeight: '85vh' }}>
                            <div className="flex items-center justify-between p-6 pb-4 border-b border-white/5 flex-shrink-0">
                                <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                                    <ShieldAlert size={24} className="text-indigo-400" />
                                    Privacy Notice
                                </h3>
                                <button onClick={() => setShowPrivacyModal(false)} className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 transition-colors">
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6 text-sm text-slate-300 leading-relaxed">
                                <section>
                                    <h4 className="text-base font-bold text-indigo-300 mb-2">1. Data We Collect</h4>
                                    <p>We collect information you provide directly to us when you create an account, such as your name, username, email address, phone number, and profile picture. We also collect the content of messages and media you send through BeatChat, as well as metadata related to these communications.</p>
                                </section>

                                <section>
                                    <h4 className="text-base font-bold text-indigo-300 mb-2">2. How We Use Your Data</h4>
                                    <p>Your data is used specifically to provide, maintain, and improve the BeatChat service. This includes allowing you to send messages, display your profile to connected users, notify you of new activities, and ensure platform security. We do not sell your personal data to third parties.</p>
                                </section>

                                <section>
                                    <h4 className="text-base font-bold text-indigo-300 mb-2">3. Data Security</h4>
                                    <p>We implement strict security measures to protect your personal information against unauthorized access. While we strive for the highest security standards, please remember that no method of transmission over the internet or electronic storage is 100% secure.</p>
                                </section>

                                <section>
                                    <h4 className="text-base font-bold text-indigo-300 mb-2">4. Managing Your Data</h4>
                                    <p>You can access, update, or permanently delete your account and associated data at any time via the Settings panel. If you choose to delete your account, your profile and all messages will be irrevocably removed from our active servers.</p>
                                </section>

                                <section>
                                    <h4 className="text-base font-bold text-indigo-300 mb-2">5. Updates to this Notice</h4>
                                    <p>We may update this Privacy Notice from time to time. We will notify you of any significant changes by posting the new notice on this page and updating the "Last Updated" date.</p>
                                </section>
                            </div>

                            <div className="p-6 pt-4 border-t border-white/5 flex justify-end flex-shrink-0">
                                <button onClick={() => setShowPrivacyModal(false)} className="px-6 py-2.5 rounded-xl font-bold text-white bg-indigo-500/20 hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/25 border border-indigo-500/30 transition-all duration-300">
                                    I Understand
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Terms of Service Modal */}
                {showTermsModal && (
                    <div className="fixed inset-0 flex items-center justify-center z-50 p-4 animate-fade-in" style={{ background: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(10px)' }}>
                        <div className="rounded-3xl w-full max-w-2xl animate-scale-in flex flex-col" style={{ background: '#1a1d27', border: '1px solid rgba(168,85,247,0.2)', boxShadow: '0 30px 80px rgba(0,0,0,0.8)', maxHeight: '85vh' }}>
                            <div className="flex items-center justify-between p-6 pb-4 border-b border-white/5 flex-shrink-0">
                                <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                                    <ShieldAlert size={24} className="text-purple-400" />
                                    Terms of Service
                                </h3>
                                <button onClick={() => setShowTermsModal(false)} className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 transition-colors">
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6 text-sm text-slate-300 leading-relaxed">
                                <section>
                                    <h4 className="text-base font-bold text-purple-300 mb-2">1. Acceptance of Terms</h4>
                                    <p>By accessing or using BeatChat, you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you may not access the service.</p>
                                </section>

                                <section>
                                    <h4 className="text-base font-bold text-purple-300 mb-2">2. User Conduct</h4>
                                    <p>You agree to use BeatChat only for lawful purposes. You represent that you will not use the service to harass, abuse, or harm another person, spread malicious software, or distribute illegal or unauthorized content including spam.</p>
                                </section>

                                <section>
                                    <h4 className="text-base font-bold text-purple-300 mb-2">3. Account Responsibilities</h4>
                                    <p>You are explicitly responsible for safeguarding the password that you use to access the service and for any activities or actions under your password. BeatChat cannot and will not be liable for any loss or damage arising from your failure to comply with this security obligation.</p>
                                </section>

                                <section>
                                    <h4 className="text-base font-bold text-purple-300 mb-2">4. Service Modifications and Termination</h4>
                                    <p>BeatChat reserves the right at any time to modify or discontinue, temporarily or permanently, the service (or any part thereof) with or without notice. We also reserve the right to suspend or terminate your account at our sole discretion, without notice, for conduct that violates these Terms.</p>
                                </section>

                                <section>
                                    <h4 className="text-base font-bold text-purple-300 mb-2">5. Limitation of Liability</h4>
                                    <p>In no event shall BeatChat, its directors, employees, or developers be liable for any indirect, incidental, special, consequential or punitive damages resulting from your use of or inability to use the service.</p>
                                </section>
                            </div>

                            <div className="p-6 pt-4 border-t border-white/5 flex justify-end flex-shrink-0">
                                <button onClick={() => setShowTermsModal(false)} className="px-6 py-2.5 rounded-xl font-bold text-white bg-purple-500/20 hover:bg-purple-500 hover:shadow-lg hover:shadow-purple-500/25 border border-purple-500/30 transition-all duration-300">
                                    I Agree
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfileSettings;
