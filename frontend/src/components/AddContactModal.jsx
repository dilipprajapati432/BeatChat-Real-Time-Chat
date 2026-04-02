import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Search, UserPlus, Check, Users } from 'lucide-react';
import ClipLoader from 'react-spinners/ClipLoader';
import toast from 'react-hot-toast';
import useAuthStore from '../stores/authStore';

const AddContactModal = ({ isOpen, onClose, onContactAdded }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [addingIds, setAddingIds] = useState([]);

    useEffect(() => {
        if (!isOpen) {
            setSearchQuery('');
            setResults([]);
            setAddedIds([]);
        }
    }, [isOpen]);

    useEffect(() => {
        const delay = setTimeout(async () => {
            if (searchQuery.trim().length > 0) {
                setIsSearching(true);
                try {
                    const token = useAuthStore.getState().token;
                    const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/users/search?q=${searchQuery}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setResults(res.data);
                } catch (err) {
                    console.error(err);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setResults([]);
            }
        }, 500);
        return () => clearTimeout(delay);
    }, [searchQuery]);

    const [addedIds, setAddedIds] = useState([]);

    const handleAddContact = async (userId) => {
        setAddingIds(prev => [...prev, userId]);
        try {
            const token = useAuthStore.getState().token;
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/users/add-contact/${userId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(res.data.message || 'Contact added');
            setAddedIds(prev => [...prev, userId]);
            // Pass the full user object so the sidebar can immediately show the contact
            const addedUser = results.find(u => u._id === userId);
            if (onContactAdded) onContactAdded(addedUser);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to add contact');
        } finally {
            setAddingIds(prev => prev.filter(id => id !== userId));
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in"
            onClick={onClose}
        >
            <div className="glass rounded-[2.5rem] p-8 w-full max-w-md shadow-glass-lg relative flex flex-col overflow-hidden"
                style={{ maxHeight: '85vh' }}
                onClick={e => e.stopPropagation()}
            >
                
                {/* Decorative background glow */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary-500/20 rounded-full blur-[80px] pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none" />

                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2.5 rounded-2xl text-slate-400 hover:text-white hover:bg-white/10 transition-all active:scale-90 z-50"
                >
                    <X size={22} />
                </button>

                <div className="relative z-10">
                    <h3 className="text-2xl font-black font-heading tracking-tight mb-2 gradient-text-violet">Start a Conversation</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 font-medium">Search the global directory to find and chat with anyone on BeatChat.</p>

                    <div className="relative mb-6">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Find by name, @username or email..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="input-premium pl-12 pr-4 py-4 !rounded-2xl shadow-inner-glow"
                            autoFocus
                            autoComplete="off"
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto min-h-[300px] max-h-[50vh] custom-scrollbar pr-1 scroll-smooth">
                        {isSearching ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <ClipLoader size={30} color="#6366f1" />
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest animate-pulse">Searching Universe...</span>
                            </div>
                        ) : results.length > 0 ? (
                            <div className="space-y-3 pb-4">
                                {results.map(u => (
                                    <div key={u._id} className="group relative flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] hover:bg-slate-100 dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 transition-all duration-300">
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                <img
                                                    src={u.avatar || `https://ui-avatars.com/api/?name=${u.name}&background=random`}
                                                    alt={u.name}
                                                    className="w-12 h-12 rounded-2xl object-cover shadow-lg group-hover:scale-105 transition-transform duration-300"
                                                />
                                                <div className="absolute inset-0 rounded-2xl border border-white/10 pointer-events-none" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800 dark:text-slate-100 group-hover:text-primary-400 dark:group-hover:text-primary-300 transition-colors">{u.name}</p>
                                                <p className="text-xs text-slate-500 font-medium">@{u.username || 'user'}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleAddContact(u._id)}
                                            disabled={addingIds.includes(u._id) || addedIds.includes(u._id)}
                                            className={`relative w-11 h-11 flex items-center justify-center rounded-2xl transition-all duration-300 ${
                                                addedIds.includes(u._id) 
                                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                                : 'bg-primary-500/20 text-primary-400 hover:bg-primary-500 hover:text-white border border-primary-500/20'
                                            } disabled:opacity-50`}
                                        >
                                            {addingIds.includes(u._id) 
                                                ? <ClipLoader size={18} color="currentColor" /> 
                                                : addedIds.includes(u._id) 
                                                    ? <Check size={20} className="animate-scale-in" /> 
                                                    : <UserPlus size={20} className="group-hover:scale-110 transition-transform" />
                                            }
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : searchQuery.length > 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                                <Search size={40} className="mb-4 opacity-20" />
                                <p className="font-bold text-sm">No one found with that name.</p>
                                <p className="text-xs opacity-60">Try a different search term.</p>
                            </div>
                        ) : (
                            null
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddContactModal;
