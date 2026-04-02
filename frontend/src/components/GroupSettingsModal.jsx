import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { X, Settings, Type, AlignLeft, Save } from 'lucide-react';
import useChatStore from '../stores/chatStore';
import useAuthStore from '../stores/authStore';
import ClipLoader from 'react-spinners/ClipLoader';

const GroupSettingsModal = ({ group, onClose }) => {
    const [name, setName] = useState(group.name);
    const [description, setDescription] = useState(group.description || '');
    const [isPublic, setIsPublic] = useState(group.isPublic !== false);
    const [loading, setLoading] = useState(false);
    const [avatar, setAvatar] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(group.avatar || null);
    const [activeTab, setActiveTab] = useState('general'); // 'general' or 'requests'

    const { updateGroupPrivacy, handleJoinRequest, fetchGroups } = useChatStore();
    const { user } = useAuthStore();
    const isAdmin = group.admin?._id === (user?._id || user?.id) || group.admin === (user?._id || user?.id);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) return toast.error('Group name is required');

        setLoading(true);
        try {
            const { token } = useAuthStore.getState();
            let avatarUrl = avatarPreview;
            if (avatar) {
                const formData = new FormData();
                formData.append('image', avatar);
                const uploadRes = await axios.post(`${import.meta.env.VITE_API_URL}/api/upload`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                avatarUrl = uploadRes.data.url;
            }

            await axios.put(`${import.meta.env.VITE_API_URL}/api/groups/${group._id}`,
                { name, description, isPublic, avatar: avatarUrl },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toast.success('Group updated successfully');
            await fetchGroups(); // Refresh groups list
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to update group');
        } finally {
            setLoading(false);
        }
    };

    const copyCode = () => {
        if (group.groupCode) {
            navigator.clipboard.writeText(group.groupCode);
            toast.success('Group code copied to clipboard!');
        }
    };

    const handleRequest = async (userId, action) => {
        try {
            await handleJoinRequest(group._id, userId, action);
            toast.success(`Request ${action === 'accept' ? 'accepted' : 'rejected'}`);
        } catch (err) {
            toast.error(err.message || 'Action failed');
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-scale-in flex flex-col max-h-[90vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">

                {/* Header */}
                <div className="relative px-6 py-5 flex items-center justify-between border-b border-white/5 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-violet-600/20 flex items-center justify-center text-violet-400 border border-violet-500/20">
                            <Settings size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white leading-none">Group Settings</h2>
                            <p className="text-xs text-slate-500 mt-1">Manage group identity and details</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                {isAdmin && (
                    <div className="px-6 pt-4 flex gap-4 border-b border-white/5 flex-shrink-0">
                        <button
                            onClick={() => setActiveTab('general')}
                            className={`pb-3 text-sm font-bold transition-all border-b-2 ${activeTab === 'general' ? 'text-violet-400 border-violet-500' : 'text-slate-500 border-transparent'}`}
                        >
                            General
                        </button>
                        <button
                            onClick={() => setActiveTab('requests')}
                            className={`pb-3 text-sm font-bold transition-all border-b-2 flex items-center gap-2 ${activeTab === 'requests' ? 'text-violet-400 border-violet-500' : 'text-slate-500 border-transparent'}`}
                        >
                            Requests
                            {(group.joinRequests?.length > 0) && (
                                <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-[10px] text-white">
                                    {group.joinRequests.length}
                                </span>
                            )}
                        </button>
                    </div>
                )}

                {/* Body */}
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    {activeTab === 'general' ? (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Group Avatar */}
                            <div className="flex flex-col items-center gap-3">
                                <div className="relative group">
                                    <div className="w-24 h-24 rounded-3xl bg-violet-500/10 flex items-center justify-center border-2 border-dashed border-violet-500/30 overflow-hidden text-violet-400">
                                        {avatarPreview ? (
                                            <img src={avatarPreview} className="w-full h-full object-cover" alt="Group Avatar" />
                                        ) : (
                                            <Settings size={32} className="opacity-50" />
                                        )}
                                    </div>
                                    {isAdmin && (
                                        <label className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity rounded-3xl">
                                            <span className="text-xs font-bold mt-1">Change</span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => {
                                                    const file = e.target.files[0];
                                                    if (file) {
                                                        setAvatar(file);
                                                        setAvatarPreview(URL.createObjectURL(file));
                                                    }
                                                }}
                                            />
                                        </label>
                                    )}
                                </div>
                                {isAdmin && avatarPreview && (
                                    <button
                                        type="button"
                                        onClick={() => { setAvatar(null); setAvatarPreview(null); }}
                                        className="text-xs text-rose-500 hover:text-rose-400 font-bold"
                                    >
                                        Remove Avatar
                                    </button>
                                )}
                            </div>
                            {/* Group Code */}
                            <div className="p-4 rounded-xl bg-violet-500/5 border border-violet-500/10 space-y-3">
                                <p className="text-[10px] font-black text-violet-400 uppercase tracking-[0.2em]">Group Join Code</p>
                                <div className="flex items-center justify-between gap-4">
                                    <span className="text-3xl font-black text-slate-800 dark:text-white tracking-[0.3em] font-mono">{group.groupCode || '------'}</span>
                                    <button
                                        type="button"
                                        onClick={copyCode}
                                        className="p-2 px-4 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 text-violet-400 font-bold text-xs transition-all flex items-center gap-2"
                                    >
                                        Copy
                                    </button>
                                </div>
                                <p className="text-[10px] text-slate-500">Share this code with people you want to join the group.</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-1">
                                    <Type size={14} className="text-violet-500" />
                                    Group Name
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Enter group name..."
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500/50 transition-all"
                                    disabled={loading || !isAdmin}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-1">
                                    <AlignLeft size={14} className="text-violet-500" />
                                    Description
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="What's this group about?"
                                    rows={3}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500/50 transition-all resize-none"
                                    disabled={loading || !isAdmin}
                                />
                            </div>

                            {isAdmin && (
                                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                                    <div>
                                        <p className="text-sm font-bold text-slate-800 dark:text-white">Public Group</p>
                                        <p className="text-xs text-slate-500 mt-0.5">Anyone with the code can join instantly</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={isPublic}
                                            onChange={(e) => setIsPublic(e.target.checked)}
                                        />
                                        <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                                    </label>
                                </div>
                            )}

                            {isAdmin && (
                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="flex-1 px-4 py-3 rounded-xl font-bold text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-all outline-none"
                                        disabled={loading}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading || !name.trim()}
                                        className="flex-[2] bg-btn-primary text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                    >
                                        {loading ? (
                                            <ClipLoader size={18} color="#fff" />
                                        ) : (
                                            <>
                                                <Save size={18} />
                                                <span>Save Changes</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </form>
                    ) : (
                        <div className="space-y-4">
                            {group.joinRequests?.length === 0 ? (
                                <div className="text-center py-10 space-y-3">
                                    <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto">
                                        <Settings size={20} className="text-slate-600" />
                                    </div>
                                    <p className="text-sm text-slate-500">No pending join requests</p>
                                </div>
                            ) : (
                                group.joinRequests?.map((req) => (
                                    <div key={req._id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={req.avatar || `https://ui-avatars.com/api/?name=${req.name}`}
                                                className="w-10 h-10 rounded-full object-cover"
                                                alt={req.name}
                                            />
                                            <div>
                                                <p className="text-sm font-bold text-slate-800 dark:text-white">{req.name}</p>
                                                <p className="text-[10px] text-slate-500">Requested to join</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleRequest(req._id, 'reject')}
                                                className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                                                title="Reject"
                                            >
                                                <X size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleRequest(req._id, 'accept')}
                                                className="p-2 bg-violet-600 text-white rounded-lg hover:bg-violet-500 transition-all"
                                                title="Accept"
                                            >
                                                <Save size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GroupSettingsModal;
