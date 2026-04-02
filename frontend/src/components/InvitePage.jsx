import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import useAuthStore from '../stores/authStore';
import useChatStore from '../stores/chatStore';
import ClipLoader from 'react-spinners/ClipLoader';

const InvitePage = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const { user: currentUser } = useAuthStore();
    const { setCurrentChat } = useChatStore();
    const [targetUser, setTargetUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                // Public endpoint (or auth protected, we'll see)
                // If it's auth protected, and we aren't logged in, this might fail.
                // Assuming backend /invite/:id is open or we handle 401.
                // Our backend implementation of /invite/:id currently DOES NOT require authMiddleware?
                // Checking previous step... Yes, I did NOT add authMiddleware to /invite/:userId
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/users/invite/${userId}`);
                setTargetUser(res.data);

                // Emit view profile event if logged in
                if (currentUser && currentUser._id !== userId) {
                    const socket = useChatStore.getState().socket;
                    if (socket) {
                        socket.emit('viewProfile', { targetId: userId });
                    }
                }
            } catch (err) {
                setError("User not found or invalid link.");
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, [userId, currentUser]);

    const handleStartChat = () => {
        if (!currentUser) {
            // Redirect to login, passing current location or just letting them know
            // Ideally we store this intention.
            localStorage.setItem('pendingChatUpdate', userId);
            navigate('/login');
        } else {
            if (currentUser._id === userId) {
                navigate('/');
                return;
            }
            // Add user to local list? Logic handled in Dashboard/Sidebar usually.
            // Just set current chat and go home.
            // We might need to ensuring the user is in the list.
            // The Sidebar 'Active Chats' won't show them initially if no message.
            // But we can manually set it in store?

            // Robust way: Go to / and let Sidebar handle it?
            // Actually, we should probably "add" them to store so ChatWindow opens.
            // The store's setUsers might be overwritten by Sidebar fetch.
            // Let's rely on `currentChat` state.
            setCurrentChat(userId);
            navigate('/');
        }
    };

    if (loading) return <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-900"><ClipLoader color="#5B6CFF" /></div>;
    if (error) return <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-500">{error}</div>;

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-slate-50 dark:bg-slate-900 px-4">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl max-w-sm w-full text-center border border-slate-200 dark:border-slate-700">
                <img
                    src={targetUser?.avatar || `https://ui-avatars.com/api/?name=${targetUser?.name}&background=random`}
                    alt="Avatar"
                    className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-4 border-primary-100 dark:border-slate-700"
                />
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-1">{targetUser?.name}</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">wants to connect with you on BeatChat.</p>

                <button
                    onClick={handleStartChat}
                    className="w-full py-3 bg-btn-primary text-white font-bold rounded-xl hover:opacity-90 transition shadow-lg transform active:scale-95"
                >
                    {currentUser ? 'Start Chatting' : 'Log in to Chat'}
                </button>
            </div>
        </div>
    );
};

export default InvitePage;
