import { useState, useEffect } from 'react';
import useChatStore from '../stores/chatStore';
import toast from 'react-hot-toast';
import { ClipLoader } from 'react-spinners';
import axios from 'axios';
import useAuthStore from '../stores/authStore';
import { X, Search, Users, Check, Camera } from 'lucide-react';

const CreateGroupModal = ({ onClose }) => {
    const { createGroup, joinGroupRoom } = useChatStore();
    const { token } = useAuthStore();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isPublic, setIsPublic] = useState(true);
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState([]); // Potential members
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    // Fetch potential users (e.g., active conversations or search)
    // For simplicity, let's fetch active conversations first, then allow search
    useEffect(() => {
        const fetchContacts = async () => {
            try {
                // Reuse the endpoint for "sidebar users" or active chats
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/messages/users`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUsers(res.data);
            } catch (err) {
                console.error("Failed to fetch contacts", err);
            }
        };
        fetchContacts();
    }, [token]);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!name.trim()) return toast.error('Group name is required');
        if (selectedUsers.length === 0) return toast.error('Select at least one member');

        setLoading(true);
        try {
            const newGroup = await createGroup({
                name,
                description,
                members: selectedUsers,
                isPublic
            });
            toast.success('Group created successfully!');
            // Join the socket room for this new group
            joinGroupRoom(newGroup._id);
            onClose();
        } catch (err) {
            toast.error(err.message || 'Failed to create group');
        } finally {
            setLoading(false);
        }
    };

    const toggleUser = (userId) => {
        if (selectedUsers.includes(userId)) {
            setSelectedUsers(prev => prev.filter(id => id !== userId));
        } else {
            setSelectedUsers(prev => [...prev, userId]);
        }
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-0 w-full max-w-lg shadow-2xl animate-scale-in border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 rounded-t-3xl">
                    <div>
                        <h2 className="text-2xl font-heading font-bold text-slate-800 dark:text-white">Create New Group</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Start a conversation with friends</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar">
                    <form onSubmit={handleCreate} className="space-y-6">
                        {/* Group Info */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2 ml-1">Group Name</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Users className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <input
                                        type="text"
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all font-medium placeholder:text-slate-400"
                                        placeholder="e.g. Weekend Trip"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2 ml-1">Description <span className="text-slate-400 font-normal">(Optional)</span></label>
                                <textarea
                                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all resize-none font-medium placeholder:text-slate-400"
                                    placeholder="What's this group about?"
                                    rows="2"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Member Selection */}
                        <div>
                            <label className="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2 ml-1">Add Members</label>
                            <div className="relative mb-3">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search className="h-4 w-4 text-slate-400" />
                                </div>
                                <input
                                    type="text"
                                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
                                    placeholder="Search contacts..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div className="max-h-60 overflow-y-auto space-y-1 pr-1 custom-scrollbar border border-slate-100 dark:border-slate-800 rounded-xl p-1">
                                {filteredUsers.length === 0 ? (
                                    <div className="p-8 text-center">
                                        <p className="text-slate-400 text-sm">No contacts found</p>
                                    </div>
                                ) : (
                                    filteredUsers.map(user => {
                                        const isSelected = selectedUsers.includes(user._id);
                                        return (
                                            <div
                                                key={user._id}
                                                className={`flex items-center p-2.5 rounded-lg cursor-pointer transition-all duration-200 group ${isSelected
                                                    ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-100 dark:border-primary-800'
                                                    : 'hover:bg-slate-50 dark:hover:bg-slate-800 border-transparent'
                                                    } border`}
                                                onClick={() => toggleUser(user._id)}
                                            >
                                                <div className="relative">
                                                    <img
                                                        src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=random`}
                                                        alt={user.name}
                                                        className={`w-10 h-10 rounded-full object-cover mr-3 ring-2 ${isSelected ? 'ring-primary-500' : 'ring-transparent'}`}
                                                    />
                                                    {isSelected && (
                                                        <div className="absolute -bottom-1 -right-0 bg-primary-500 text-white rounded-full p-0.5 ring-2 ring-white dark:ring-slate-900">
                                                            <Check size={10} strokeWidth={4} />
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm font-bold ${isSelected ? 'text-primary-900 dark:text-primary-100' : 'text-slate-700 dark:text-slate-200'}`}>
                                                        {user.name}
                                                    </p>
                                                    <p className={`text-xs truncate ${isSelected ? 'text-primary-600 dark:text-primary-300' : 'text-slate-500 dark:text-slate-500'}`}>
                                                        {user.email || user.username}
                                                    </p>
                                                </div>

                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected
                                                    ? 'bg-primary-500 border-primary-500'
                                                    : 'border-slate-300 dark:border-slate-600 group-hover:border-primary-400'}`}>
                                                    {isSelected && <Check size={12} className="text-white" strokeWidth={3} />}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                            <div className="flex justify-between items-center mt-3 px-1">
                                <p className="text-xs text-slate-500 font-medium">{selectedUsers.length} members selected</p>
                                {selectedUsers.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => setSelectedUsers([])}
                                        className="text-xs text-primary-600 hover:text-primary-700 font-bold hover:underline"
                                    >
                                        Clear all
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Group Privacy */}
                        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                            <div>
                                <p className="text-sm font-bold text-slate-800 dark:text-white">Public Group</p>
                                <p className="text-xs text-slate-500 mt-0.5">Allows instant joining via code</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={isPublic}
                                    onChange={(e) => setIsPublic(e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                            </label>
                        </div>

                        {/* Footer Actions */}
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-btn-primary text-white font-bold py-3.5 rounded-xl shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 hover:scale-[1.01] transition-all transform disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex justify-center items-center gap-2 text-sm tracking-wide"
                            >
                                {loading ? <ClipLoader size={20} color="#fff" /> : 'Create Group'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateGroupModal;
