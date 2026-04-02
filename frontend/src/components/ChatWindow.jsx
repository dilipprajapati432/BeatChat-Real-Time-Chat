import { useRef, useEffect, useState, lazy, Suspense } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import useChatStore from '../stores/chatStore';
import useAuthStore from '../stores/authStore';
import useSettingsStore from '../stores/settingsStore';
import ClipLoader from 'react-spinners/ClipLoader';
import toast from 'react-hot-toast';
import {
  Paperclip, Image as ImageIcon, Smile, Send, X,
  ShieldCheck, ShieldAlert, Trash2, UserX, Shield,
  Check, CheckCheck, Menu, ChevronLeft, UserPlus, LogOut, Copy, Hash, Users, MessageSquare,
  Zap, Globe, Phone, Video, MoreVertical, Download, Star, Forward
} from 'lucide-react';
import MessageItem from './MessageItem';
import logo from '../assets/beatchat-logo.png';
import SmartReplies from './SmartReplies';
import PinnedMessages from './PinnedMessages';
import MentionDropdown from './MentionDropdown';

const ReportModal = lazy(() => import('./ReportModal'));
const ConfirmModal = lazy(() => import('./ConfirmModal'));
const EmojiPicker = lazy(() => import('emoji-picker-react'));
const GifPicker = lazy(() => import('./GifPicker'));
const UserProfileModal = lazy(() => import('./UserProfileModal'));
const SharedMedia = lazy(() => import('./SharedMedia'));
const AddMemberModal = lazy(() => import('./AddMemberModal'));
const GroupSettingsModal = lazy(() => import('./GroupSettingsModal'));
const GroupMembersModal = lazy(() => import('./GroupMembersModal'));


const ChatWindow = ({ isSidebarOpen, setIsSidebarOpen }) => {
  const {
    currentChat, messages, setMessages, socket, groups, users,
    sendMessage, onlineUsers, fetchMessages, markMessagesAsSeen,
    leaveGroup, deleteGroup, lastSeenMap
  } = useChatStore();
  const { user, setUser } = useAuthStore();
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedMessageForDelete, setSelectedMessageForDelete] = useState(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [showSharedMedia, setShowSharedMedia] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [reportMessageId, setReportMessageId] = useState(null);
  const [isFocused, setIsFocused] = useState(false);
  const [mentionQuery, setMentionQuery] = useState(null);
  const [activeActionId, setActiveActionId] = useState(null);
  // Confirm Modal State
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmData, setConfirmData] = useState({ title: '', message: '', isDanger: false });
  // Unified Action States
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [starredIds, setStarredIds] = useState(new Set());

  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const imgInputRef = useRef(null);
  const docInputRef = useRef(null);
  const textInputRef = useRef(null);

  const scrollToBottom = (behavior = 'smooth') => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  };

  const isBlocked = user?.blockedUsers?.includes(currentChat);

  const currentGroup = groups.find(g => g._id === currentChat);
  const isGroup = !!currentGroup;
  const groupName = currentGroup?.name || 'Group';

  useEffect(() => {
    if (currentChat) {
      setLoading(true);
      setShowMenu(false);
      setShowEmojiPicker(false);
      setShowGifPicker(false);
      setTyping(false); // Reset typing state when switching chats

      const endpoint = isGroup
        ? `${import.meta.env.VITE_API_URL}/api/groups/${currentChat}/messages`
        : `${import.meta.env.VITE_API_URL}/api/messages/${currentChat}`;

      const token = useAuthStore.getState().token;
      axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => {
        if (Array.isArray(res.data)) {
          setMessages(res.data);
          // Set starred messages from data
          const myId = String(user?._id || user?.id);
          const starredSet = new Set(
            res.data.filter(m => m.starredBy?.includes(myId)).map(m => m._id)
          );
          setStarredIds(starredSet);
        } else {
          setMessages([]);
        }
      })
        .catch(err => {
          console.error(err);
          setMessages([]);
        })
        .finally(() => setLoading(false));
    }
  }, [currentChat, setMessages, isGroup]);

  useEffect(() => {
    if (socket) {
      const handleTyping = ({ from, isGroup: typingIsGroup, senderId }) => {
        if (from === currentChat) {
          setTyping(true);
          if (typingIsGroup && senderId) {
            const currentGroup = useChatStore.getState().groups.find(g => g._id === currentChat);
            const typer = currentGroup?.members?.find(m => m._id === senderId);
            if (typer) setTypingUser(typer.name.split(' ')[0]);
          } else {
            setTypingUser(null);
          }
          setTimeout(() => { setTyping(false); setTypingUser(null); }, 3000);
        }
      };
      socket.on('typing', handleTyping);

      socket.on('messageStarred', ({ messageId, starredBy }) => {
        const myId = String(user?._id || user?.id);
        setStarredIds(prev => {
          const next = new Set(prev);
          if (starredBy.includes(myId)) next.add(messageId);
          else next.delete(messageId);
          return next;
        });
      });

      socket.on('messagePinned', ({ messageId, isPinned }) => {
        setMessages(prev => prev.map(m => m._id === messageId ? { ...m, isPinned } : m));
      });

      return () => {
        socket.off('typing', handleTyping);
        socket.off('messageStarred');
        socket.off('messagePinned');
      };
    }
  }, [currentChat, socket]);

  // Global click listener to close floating message actions
  useEffect(() => {
    const handleGlobalClick = (e) => {
      // Only keep the hub open if clicking directly inside the action hub
      if (e.target.closest('.glass-premium') || e.target.closest('.action-menu-item')) return;
      if (activeActionId) setActiveActionId(null);
    };
    window.addEventListener('mousedown', handleGlobalClick);
    return () => window.removeEventListener('mousedown', handleGlobalClick);
  }, [activeActionId]);

  // Jump instantly to bottom when switching chats (after messages load)
  useEffect(() => {
    if (messages.length > 0 && !loading) {
      scrollToBottom('instant');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentChat, loading]);

  // Smooth scroll when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom('smooth');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  // Smooth scroll when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom('smooth');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  const handleKeyDown = (e) => {
    // On desktop, Enter sends the message. On all devices, Shift+Enter adds a new line.
    if (e.key === 'Enter' && !e.shiftKey && window.innerWidth > 768) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleSelectMessage = (id) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  const handleBatchDelete = () => {
    if (selectedIds.size === 0) return;
    
    setConfirmData({
      title: 'Delete Messages',
      message: `Are you sure you want to delete ${selectedIds.size} message${selectedIds.size > 1 ? 's' : ''}? This action cannot be undone.`,
      isDanger: true,
      confirmText: 'Delete Messages'
    });

    setConfirmAction(() => async () => {
      try {
        const token = useAuthStore.getState().token;

        toast.promise(
          axios.post(`${import.meta.env.VITE_API_URL}/api/messages/batch-delete`,
            { ids: Array.from(selectedIds) },
            { headers: { Authorization: `Bearer ${token}` } }
          ),
          {
            loading: 'Deleting messages...',
            success: 'Messages deleted successfully',
            error: 'Failed to delete some messages'
          }
        );
        setSelectionMode(false);
        setSelectedIds(new Set());
        // Optimistic cache update would be better here, but fetch works safely
        setTimeout(() => fetchMessages(currentChat), 500);
      } catch (err) {
        console.error(err);
      }
    });

    setConfirmOpen(true);
  };

  const handleCopySelected = () => {
    if (selectedIds.size === 0) return;
    const selectedMessages = messages
      .filter(m => selectedIds.has(m._id))
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      .map(m => m.text)
      .join('\n');
    navigator.clipboard.writeText(selectedMessages);
    toast.success(`Copied ${selectedIds.size} message${selectedIds.size > 1 ? 's' : ''}`);
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const handleStarSelected = () => {
    if (selectedIds.size === 0 || !socket) return;
    selectedIds.forEach(id => {
      socket.emit('starMessage', { messageId: id });
    });
    toast.success(`Starred ${selectedIds.size} message${selectedIds.size > 1 ? 's' : ''}`);
    setSelectionMode(false);
    setSelectedIds(new Set());
  };


  const clearChat = async () => {
    try {
      const token = useAuthStore.getState().token;
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/messages/chat/${currentChat}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages([]);
      toast.success('Chat cleared');
      setShowMenu(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to clear chat');
    }
  };

  const handleClearChat = () => {
    setConfirmData({
      title: 'Clear Chat History',
      message: 'Are you sure you want to clear this chat? This cannot be undone.',
      isDanger: true,
      confirmText: 'Clear Chat'
    });
    setConfirmAction(() => clearChat);
    setConfirmOpen(true);
    setShowMenu(false);
  };

  const confirmBlock = async () => {
    try {
      const url = isBlocked
        ? `${import.meta.env.VITE_API_URL}/api/users/unblock/${currentChat}`
        : `${import.meta.env.VITE_API_URL}/api/users/block/${currentChat}`;

      const token = useAuthStore.getState().token;
      const res = await axios.post(url, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success(res.data.message);
      if (res.data.blockedUsers) {
        setUser({ ...user, blockedUsers: res.data.blockedUsers });
      }
      setShowMenu(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Action failed');
    }
  };

  const handleBlockToggle = () => {
    setConfirmData({
      title: isBlocked ? 'Unblock User' : 'Block User',
      message: isBlocked
        ? 'Unblock this user? They will be able to message you.'
        : 'Block this user? They wont be able to message you.',
      isDanger: !isBlocked,
      confirmText: isBlocked ? 'Unblock' : 'Block'
    });
    setConfirmAction(() => confirmBlock);
    setConfirmOpen(true);
    setShowMenu(false);
  };

  const deleteConversation = async () => {
    try {
      const token = useAuthStore.getState().token;
      const res = await axios.delete(`${import.meta.env.VITE_API_URL}/api/messages/chat/${currentChat}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Conversation deleted');

      if (res.data.deletedChats) {
        useAuthStore.getState().setUser({ ...user, deletedChats: res.data.deletedChats });
      }

      useChatStore.getState().setCurrentChat(null);
      setIsSidebarOpen(true);
      setShowMenu(false);
    } catch (err) {
      toast.error('Failed to delete conversation');
    }
  };

  const handleDeleteGroup = async () => {
    try {
      await deleteGroup(currentChat);
      toast.success('Group deleted successfully');
      setIsSidebarOpen(true);
    } catch (err) {
      toast.error(err.message || 'Failed to delete group');
    }
  };

  const handleLeaveGroup = async () => {
    try {
      await leaveGroup(currentChat);
      toast.success('Left from the group');
      setIsSidebarOpen(true);
    } catch (err) {
      toast.error(err.message || 'Failed to leave group');
    }
  };

  const handleDeleteGroupClick = () => {
    setConfirmData({
      title: 'Delete Group',
      message: 'Are you sure you want to delete this group? This action cannot be undone.',
      isDanger: true,
      confirmText: 'Delete Group'
    });
    setConfirmAction(() => handleDeleteGroup);
    setConfirmOpen(true);
    setShowMenu(false);
  };

  const handleLeaveGroupClick = () => {
    setConfirmData({
      title: 'Leave Group',
      message: 'Are you sure you want to leave this group?',
      isDanger: true,
      confirmText: 'Leave Group'
    });
    setConfirmAction(() => handleLeaveGroup);
    setConfirmOpen(true);
    setShowMenu(false);
  };

  const handleDeleteChat = () => {
    setConfirmData({
      title: 'Delete Conversation',
      message: 'Delete this conversation? The user will be hidden from your list.',
      isDanger: true,
      confirmText: 'Delete'
    });
    setConfirmAction(() => deleteConversation);
    setConfirmOpen(true);
    setShowMenu(false);
  };

  const handleReportUser = () => {
    setReportMessageId(null);
    setReportModalOpen(true);
    setShowMenu(false);
  };

  const copyGroupCode = () => {
    if (currentGroup?.groupCode) {
      navigator.clipboard.writeText(currentGroup.groupCode);
      toast.success('Group code copied!');
      setShowMenu(false);
    }
  };

  const handleReportMessage = (messageId) => {
    setReportMessageId(messageId);
    setReportModalOpen(true);
  };

  // sendMessage is now imported from store

  const handleSend = async (e) => {
    e?.preventDefault();
    if ((!text.trim() && !image) || isSending) return;
    if (isBlocked) return toast.error('You have blocked this user. Unblock to send message.');

    setIsSending(true);

    if (editingMessageId) {
      await submitEdit();
      setIsSending(false);
      return;
    }

    let fileUrl = null;
    try {
      if (image) {
        const formData = new FormData();
        formData.append('image', image);
        const token = useAuthStore.getState().token;
        // Use raw upload for PDFs if needed, but standard upload endpoint handles it now
        const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/upload`, formData, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
        });
        fileUrl = res.data.url;
      }

      // Send text message if exists
      if (text.trim()) {
        sendMessage(text, isGroup ? 'group' : 'direct', replyingTo?._id);
      }

      // Send file message if exists
      if (fileUrl) {
        sendMessage(fileUrl, isGroup ? 'group' : 'direct', replyingTo?._id);
      }

      setText('');
      setImage(null);
      setReplyingTo(null);
      if (imgInputRef.current) imgInputRef.current.value = "";
      if (docInputRef.current) docInputRef.current.value = "";
      setShowEmojiPicker(false);
      setShowGifPicker(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };


  const handleTyping = (e) => {
    const val = e.target.value;
    setText(val);
    if (socket) socket.emit('typing', { to: currentChat, isGroup });

    // @mention detection
    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursorPos);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
    setMentionQuery(mentionMatch ? mentionMatch[1] : null);
  };

  const handleMentionSelect = (selectedUser) => {
    if (!selectedUser) { setMentionQuery(null); return; }
    const cursorPos = textInputRef.current?.selectionStart || text.length;
    const textBefore = text.slice(0, cursorPos);
    const textAfter = text.slice(cursorPos);
    const replaced = textBefore.replace(/@\w*$/, `@${selectedUser.username || selectedUser.name} `);
    setText(replaced + textAfter);
    setMentionQuery(null);
    textInputRef.current?.focus();
  };

  const handlePinMessage = (messageId) => {
    if (socket) socket.emit('pinMessage', { messageId });
  };

  const handleStar = (messageId) => {
    if (socket) socket.emit('starMessage', { messageId });
  };

  const scrollToMessage = (messageId) => {
    const el = document.getElementById(`msg-${messageId}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleSmartReply = (suggestion) => {
    if (isBlocked) return;
    setText(suggestion);
    textInputRef.current?.focus();
  };

  const onEmojiClick = (emojiObject) => {
    setText(prev => prev + emojiObject.emoji);
  };

  const onGifSelect = (gifUrl) => {
    if (isBlocked) return toast.error('You have blocked this user.');
    sendMessage(gifUrl, isGroup ? 'group' : 'direct');
    setShowGifPicker(false);
  };

  // Consolidating socket listeners into chatStore.js
  // handleMessageDeleted, handleMessageSent, handleMessageEdited are now handled there.

  useEffect(() => {
    if (currentChat && socket) {
      socket.emit('markSeen', { senderId: currentChat });
    }
  }, [currentChat, socket]);





  const canEdit = (msg) => {
    return Date.now() - new Date(msg.timestamp).getTime() < 10 * 60 * 1000;
  };

  const getSenderIdStr = (sId) => sId?._id ? String(sId._id) : String(sId);
  const canDeleteForEveryone = (msg) => {
    if (!msg) return false;
    return getSenderIdStr(msg.senderId) === String(user?._id || user?.id) && Date.now() - new Date(msg.timestamp).getTime() < 3 * 60 * 1000;
  };

  const handleDeleteClick = (msg) => {
    setSelectedMessageForDelete(msg);
    setDeleteModalOpen(true);
  };

  const confirmDelete = (type) => {
    if (!selectedMessageForDelete) return;

    // Optimistic delete
    setMessages(prev => prev.filter(m => m._id !== selectedMessageForDelete._id));

    if (selectedMessageForDelete.status !== 'sending') {
      socket.emit('deleteMessage', { messageId: selectedMessageForDelete._id, type });
    }

    setDeleteModalOpen(false);
    setSelectedMessageForDelete(null);
  };

  const startEditing = (messageId, content) => {
    setEditingMessageId(messageId);
    setText(content);
    setReplyingTo(null); // Clear reply context when editing
    if (textInputRef.current) textInputRef.current.focus();
  };

  const cancelEditing = () => {
    setEditingMessageId(null);
    setText('');
  };

  const submitEdit = async () => {
    if (!text.trim() || !editingMessageId) return;

    try {
      setMessages(prev => prev.map(m => m._id === editingMessageId ? { ...m, text: text, isEdited: true } : m));
      socket.emit('editMessage', { messageId: editingMessageId, newText: text });

      setEditingMessageId(null);
      setText('');
      toast.success("Message updated");
    } catch (err) {
      toast.error("Failed to update message");
    }
  };

  const handleDownload = async (e, url, filename) => {
    e.preventDefault();
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed', error);
      // Fallback to opening in new tab if fetch fails (e.g. CORS)
      window.open(url, '_blank');
    }
  };

  const handleExportChat = async () => {
    try {
      setShowMenu(false);
      const toastId = toast.loading('Preparing export...');
      const type = isGroup ? 'group' : 'direct';
      const targetId = currentChat;
      const token = useAuthStore.getState().token;

      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/export/${targetId}`, {
        params: { type },
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `chat-export-${targetId}.txt`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Chat exported successfully', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Failed to export chat');
    }
  };

  if (!currentChat) return (
    <div className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-[#09090b] relative overflow-hidden">
      {/* Decorative localized glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center max-w-md px-6 animate-slideUp">
        <div className="relative mb-8 group">
          <div className="absolute inset-0 rounded-full bg-primary-500 blur-[40px] opacity-20 group-hover:opacity-30 transition-opacity animate-pulse" />
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-primary-600 to-indigo-600 flex items-center justify-center shadow-2xl shadow-primary-500/20 relative z-10 animate-float">
            <img src={logo} alt="BeatChat" className="w-14 h-14 object-contain brightness-110" />
          </div>
        </div>

        <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">
          Experience the <span className="gradient-text-aurora">Beat</span>
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-base mb-10 leading-relaxed font-medium">
          Connect with friends and colleagues in real-time. Select a conversation to start chatting.
        </p>

        <button
          onClick={() => setIsSidebarOpen(true)}
          className="btn-primary group !px-8 !py-4"
        >
          <Menu size={18} className="group-hover:rotate-180 transition-transform duration-500" />
          <span>Open Conversations</span>
        </button>

        <div className="mt-16 flex items-center gap-6 opacity-40 grayscale group-hover:grayscale-0 transition-all duration-700">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-1"><Shield size={14} className="text-primary-400" /></div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Secure</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-1"><Zap size={14} className="text-yellow-400" /></div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Fast</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-1"><Globe size={14} className="text-cyan-400" /></div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Global</span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 text-slate-600 text-[11px] font-bold uppercase tracking-[0.2em] opacity-40">
        End-to-End Encrypted
      </div>
    </div>
  );

  return (
    <div className={`flex-1 flex flex-col min-w-0 h-full bg-white dark:bg-[#09090b] relative overflow-hidden transition-all duration-300 ${isSidebarOpen ? 'md:ml-0' : ''}`}>

      {/* Selection Mode Header Overlay */}
      {selectionMode && (
        <div className="absolute top-0 left-0 right-0 z-[100] bg-[#0c0c14]/95 backdrop-blur-2xl border-b border-primary-500/20 flex items-center justify-between px-4 sm:px-6 py-3 animate-slideDown shadow-2xl shadow-primary-900/20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setSelectionMode(false); setSelectedIds(new Set()); }}
              className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-all duration-200 border border-white/5"
            >
              <X size={18} />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-white font-black text-base tracking-tight">
                {selectedIds.size}
              </span>
              <span className="text-slate-400 text-sm font-medium">
                {selectedIds.size === 1 ? 'message' : 'messages'} selected
              </span>
            </div>
          </div>
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-1.5 animate-scale-in">
              <button
                onClick={handleBatchDelete}
                className="h-9 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white font-bold text-[13px] transition-all duration-200 flex items-center gap-2 border border-rose-500/15 hover:border-rose-500 hover:shadow-lg hover:shadow-rose-500/25"
                title="Delete messages"
              >
                <Trash2 size={15} />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Header */}
      <div className="z-30 bg-chat-header-bg border-b border-chat-header-border shadow-sm shadow-black/20 sticky top-0 px-2.5 sm:px-4 md:px-6 py-2.5 sm:py-3.5 flex items-center justify-between transition-all duration-300">
        <div className="flex items-center gap-4">
          {!isSidebarOpen && (
            <div className="flex items-center animate-fadeIn group/sidebar-toggle">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="relative p-2 sm:p-2.5 rounded-2xl flex items-center justify-center transition-all duration-500 overflow-hidden
                    bg-white/5 dark:bg-white/[0.03] border border-white/10 dark:border-white/[0.05] hover:bg-white/10 dark:hover:bg-white/[0.08] hover:border-primary-500/30 hover:shadow-lg hover:shadow-primary-500/5 group"
                title="Open Conversations"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-primary-500/10 via-transparent to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <Menu size={20} className="text-slate-400 group-hover:text-primary-400 transition-all duration-500 relative z-10 group-hover:scale-110" />
              </button>
            </div>
          )}

          {isGroup ? (
            <div className="flex items-center cursor-pointer group" onClick={() => setShowMembersModal(true)}>
              <div className="w-11 h-11 rounded-full bg-primary-600/20 flex items-center justify-center text-primary-400 font-bold border border-primary-500/20 overflow-hidden shadow-lg shadow-primary-900/10">
                {currentGroup.avatar ? (
                  <img src={currentGroup.avatar} className="w-full h-full object-cover" alt={groupName} />
                ) : groupName.charAt(0).toUpperCase()}
              </div>
              <div className="ml-3">
                <h3 className="font-bold text-white text-[15px] leading-tight group-hover:text-primary-400 transition-colors">{groupName}</h3>
                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                  {currentGroup.members?.length} members
                </p>
              </div>
            </div>
          ) : (
            (() => {
              const receiver = useChatStore.getState().users.find(u => u._id === currentChat) || { name: 'Chat' };
              const isOnline = useChatStore.getState().onlineUsers.includes(receiver._id);

              const formatLastSeen = (dateString) => {
                if (!dateString) return 'Offline';
                const date = new Date(dateString);
                if (isNaN(date.getTime())) return 'Offline';
                const now = new Date();
                const isToday = date.toDateString() === now.toDateString();
                const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                return isToday ? `Last seen today at ${timeStr}` : `Last seen ${date.toLocaleDateString()} ${timeStr}`;
              };

              return (
                <div className="flex items-center cursor-pointer group" onClick={() => setProfileModalOpen(true)}>
                  <div className="relative">
                    <img
                      src={receiver.avatar ? (receiver.avatar.startsWith('http') ? receiver.avatar : `${import.meta.env.VITE_API_URL}${receiver.avatar}`) : `https://ui-avatars.com/api/?name=${encodeURIComponent(receiver.name)}&background=random`}
                      className="w-11 h-11 rounded-full object-cover border border-white/10 shadow-lg group-hover:scale-105 transition-transform"
                      alt={receiver.name}
                    />
                    {isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#09090b] animate-online-pulse" />
                    )}
                  </div>
                  <div className="ml-3">
                    <h3 className="font-bold text-white text-[15px] leading-tight">{receiver.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      {typing ? (
                        <span className="text-[10px] text-primary-400 animate-pulse font-bold uppercase tracking-widest">Typing...</span>
                      ) : (
                        <p className={`text-[11px] font-bold uppercase tracking-wider ${isOnline ? 'text-emerald-500' : 'text-slate-500'}`}>
                          {isOnline ? 'Active Now' : formatLastSeen(lastSeenMap[receiver._id] || receiver.lastSeen)}
                        </p>
                      )}
                      {isBlocked && (
                        <span className="text-[9px] bg-rose-500/20 text-rose-500 px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter">Blocked</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()
          )}
        </div>

        <div className="flex items-center gap-1.5 md:gap-3">
          <button
            onClick={() => toast.error('Calling feature coming soon 🚀', { icon: '📞' })}
            className="p-2.5 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-all hidden sm:block"
          >
            <Phone size={20} />
          </button>
          <button
            onClick={() => toast.error('Video calling coming soon 🚀', { icon: '📹' })}
            className="p-2.5 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-all hidden sm:block"
          >
            <Video size={20} />
          </button>
          <div className="w-[1px] h-6 bg-white/10 mx-1 hidden sm:block" />

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className={`p-2.5 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-all ${showMenu ? 'bg-white/5 text-white' : ''}`}
            >
              <MoreVertical size={20} />
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-[40]" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#16161e] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/5 py-2 z-50 animate-scale-in origin-top-right overflow-hidden">
                  {isGroup ? (
                    <>
                      <button
                        onClick={() => { setShowMembersModal(true); setShowMenu(false); }}
                        className="w-full text-left px-4 py-3 text-[13px] font-bold text-slate-300 hover:bg-white/5 flex items-center gap-3 transition-colors"
                      >
                        <Users size={16} className="text-primary-400" />
                        Group Info
                      </button>
                      <button
                        onClick={() => { setShowAddMemberModal(true); setShowMenu(false); }}
                        className="w-full text-left px-4 py-3 text-[13px] font-bold text-slate-300 hover:bg-white/5 flex items-center gap-3 transition-colors"
                      >
                        <UserPlus size={16} className="text-emerald-400" />
                        Add Member
                      </button>
                      <button
                        onClick={copyGroupCode}
                        className="w-full text-left px-4 py-3 text-[13px] font-bold text-slate-300 hover:bg-white/5 flex items-center gap-3 transition-colors"
                      >
                        <Copy size={16} className="text-amber-400" />
                        Copy Code
                      </button>

                      <div className="my-1 border-t border-white/5"></div>

                      {(currentGroup?.admin?._id === (user?._id || user?.id) || currentGroup?.admin === (user?._id || user?.id)) ? (
                        <>
                          <button
                            onClick={() => { setShowGroupSettings(true); setShowMenu(false); }}
                            className="w-full text-left px-4 py-3 text-[13px] font-bold text-slate-300 hover:bg-white/5 flex items-center gap-3 transition-colors"
                          >
                            <Shield size={16} className="text-indigo-400" />
                            Settings
                          </button>
                          <button
                            onClick={handleDeleteGroupClick}
                            className="w-full text-left px-4 py-3 text-[13px] font-bold text-rose-400 hover:bg-rose-500/10 flex items-center gap-3 transition-colors"
                          >
                            <Trash2 size={16} />
                            Delete Group
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={handleLeaveGroupClick}
                          className="w-full text-left px-4 py-3 text-[13px] font-bold text-rose-400 hover:bg-rose-500/10 flex items-center gap-3 transition-colors"
                        >
                          <LogOut size={16} />
                          Leave Group
                        </button>
                      )}
                      <div className="my-1 border-t border-white/5"></div>
                      <button
                        onClick={handleExportChat}
                        className="w-full text-left px-4 py-3 text-[13px] font-bold text-slate-300 hover:bg-white/5 flex items-center gap-3 transition-colors"
                      >
                        <Download size={16} className="text-indigo-400" />
                        Export Chat
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={handleBlockToggle}
                        className="w-full text-left px-4 py-3 text-[13px] font-bold text-slate-300 hover:bg-white/5 flex items-center gap-3 transition-colors"
                      >
                        {isBlocked ? <ShieldCheck size={16} className="text-emerald-400" /> : <UserX size={16} className="text-rose-400" />}
                        {isBlocked ? 'Unblock' : 'Block'}
                      </button>
                      <button
                        onClick={handleReportUser}
                        className="w-full text-left px-4 py-3 text-[13px] font-bold text-slate-300 hover:bg-white/5 flex items-center gap-3 transition-colors"
                      >
                        <ShieldAlert size={16} className="text-amber-400" />
                        Report
                      </button>
                      <button
                        onClick={handleExportChat}
                        className="w-full text-left px-4 py-3 text-[13px] font-bold text-slate-300 hover:bg-white/5 flex items-center gap-3 transition-colors"
                      >
                        <Download size={16} className="text-indigo-400" />
                        Export Chat
                      </button>
                      <div className="my-1 border-t border-white/5"></div>
                      <button
                        onClick={handleDeleteChat}
                        className="w-full text-left px-4 py-3 text-[13px] font-bold text-rose-400 hover:bg-rose-500/10 flex items-center gap-3 transition-colors"
                      >
                        <Trash2 size={16} />
                        Delete Chat
                      </button>
                    </>
                  )}

                  <div className="my-1 border-t border-white/5"></div>
                  <button
                    onClick={handleClearChat}
                    className="w-full text-left px-4 py-3 text-[13px] font-bold text-rose-400 hover:bg-rose-500/10 flex items-center gap-3 transition-colors"
                  >
                    <Trash2 size={16} />
                    Clear History
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <Suspense fallback={null}>
        {createPortal(
          <>
            <ConfirmModal
              isOpen={confirmOpen}
              onClose={() => setConfirmOpen(false)}
              onConfirm={() => {
                if (confirmAction) confirmAction();
                setConfirmOpen(false);
              }}
              title={confirmData.title}
              message={confirmData.message}
              confirmText={confirmData.confirmText}
              isDanger={confirmData.isDanger}
            />
            {showAddMemberModal && (
              <AddMemberModal groupId={currentChat} onClose={() => setShowAddMemberModal(false)} />
            )}
            {showGroupSettings && (
              <GroupSettingsModal
                group={currentGroup}
                onClose={() => setShowGroupSettings(false)}
              />
            )}
            {showMembersModal && (
              <GroupMembersModal
                group={currentGroup}
                onClose={() => setShowMembersModal(false)}
              />
            )}
          </>,
          document.body
        )}
      </Suspense>

      {/* Pinned Messages Banner */}
      <PinnedMessages messages={messages} onScrollToMessage={scrollToMessage} />

      {/* Messages */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden relative chat-scrollbar"
        style={{
          background: 'var(--chat-body-bg)',
          backgroundImage: `radial-gradient(circle, var(--chat-pattern-color) 1px, transparent 1px)`,
          backgroundSize: '28px 28px',
          scrollBehavior: 'smooth'
        }}>

        {/* Ambient Glow Orbs (Hidden in light mode to prevent visual dirtiness) */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/5 rounded-full blur-[100px] -translate-y-1/2 pointer-events-none hidden dark:block" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-[100px] translate-y-1/4 pointer-events-none hidden dark:block" />

        {loading ? (
          <div className="flex justify-center items-center h-full"><ClipLoader color="#6366f1" /></div>
        ) : messages.length === 0 ? (
          <div className="flex justify-center items-center h-full min-h-[400px] relative z-10 flex-col gap-3">
            <div className="w-16 h-16 rounded-full bg-primary-50 dark:bg-slate-800/50 flex items-center justify-center mb-2 animate-bounce-subtle">
              <MessageSquare className="w-8 h-8 text-primary-400" />
            </div>
            <p className="text-slate-500 font-medium tracking-tight">No messages yet. Say hello! 👋</p>
          </div>
        ) : (
          <div className="w-full flex justify-center">
            <div className="px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16 py-4 sm:py-6 pb-6 flex flex-col w-full min-h-full relative z-10 transition-all duration-300">
              {(() => {
                let lastDate = null;
                return messages.map((msg, index) => {
                  const timestamp = msg.timestamp || msg.createdAt;
                  const msgDate = new Date(timestamp).toDateString();
                  const showDateSeparator = msgDate !== lastDate;
                  lastDate = msgDate;

                  const isToday = msgDate === new Date().toDateString();
                  const isYesterday = msgDate === new Date(Date.now() - 86400000).toDateString();
                  const dateLabel = isToday ? 'Today' : isYesterday ? 'Yesterday' : (timestamp ? new Date(timestamp).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : 'Unknown Date');

                  return (
                    <div key={msg._id || index}>
                      {showDateSeparator && (
                        <div className="flex justify-center my-6">
                          <div className="px-5 py-1.5 rounded-full bg-white/60 dark:bg-slate-800/60 border border-slate-200/50 dark:border-white/5 backdrop-blur-md shadow-sm">
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">{dateLabel}</span>
                          </div>
                        </div>
                      )}
                      <MessageItem
                        msg={msg}
                        index={index}
                        messages={messages}
                        user={user}
                        users={users}
                        currentChat={currentChat}
                        isGroup={isGroup}
                        groups={groups}
                        startEditing={startEditing}
                        handleDeleteClick={handleDeleteClick}
                        handleReportMessage={handleReportMessage}
                        handlePinMessage={handlePinMessage}
                        editingMessageId={editingMessageId}
                        activeActionId={activeActionId}
                        setActiveActionId={setActiveActionId}
                        submitEdit={submitEdit}
                        cancelEditing={cancelEditing}
                        setReplyingTo={setReplyingTo}
                        selectionMode={selectionMode}
                        setSelectionMode={setSelectionMode}
                        selectedIds={selectedIds}
                        toggleSelectMessage={toggleSelectMessage}
                        starredIds={starredIds}
                        handleStar={handleStar}
                      />
                    </div>
                  );
                });
              })()}
              {typing && (
                <div className="flex items-start gap-2.5 mb-6 animate-fade-in pl-1">
                  <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800/50 flex items-center justify-center border border-slate-200 dark:border-white/5 shadow-sm">
                    <div className="flex gap-1">
                      <span className="w-1 h-1 rounded-full bg-primary-400/80 typing-dot"></span>
                      <span className="w-1 h-1 rounded-full bg-primary-400/80 typing-dot"></span>
                      <span className="w-1 h-1 rounded-full bg-primary-400/80 typing-dot"></span>
                    </div>
                  </div>
                  <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-md border border-slate-200/50 dark:border-white/5 px-4 py-2 rounded-2xl rounded-tl-none flex items-center shadow-sm">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 italic">
                      {typingUser ? `${typingUser} is typing...` : 'typing...'}
                    </span>
                  </div>
                </div>
              )}
              {/* Scroll Bottom Clearance Spacer */}
              <div style={{ height: '160px', flexShrink: 0, width: '100%' }} />
            </div>
          </div>
        )}
      </div>
      <div className="absolute bottom-4 sm:bottom-6 left-0 right-0 pointer-events-none z-[40] transition-all duration-300 flex justify-center">
        <div className="w-full relative px-2 sm:px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16 max-w-[1400px] pointer-events-none">
          <div className="w-full pointer-events-auto">
            {/* Emoji/GIF Pickers - Improved styling */}
            {showEmojiPicker && (
              <Suspense fallback={<div className="absolute bottom-full mb-4 h-[350px] w-full sm:w-[350px] flex items-center justify-center bg-white dark:bg-[#16161e] rounded-3xl border border-slate-200 dark:border-white/5 shadow-2xl pointer-events-auto"><ClipLoader color="#6366f1" /></div>}>
                <div className="absolute bottom-full mb-4 shadow-2xl rounded-3xl border border-slate-200 dark:border-white/5 bg-white dark:bg-[#16161e] overflow-hidden animate-scale-in origin-bottom-left w-full sm:w-[350px] pointer-events-auto">
                  <EmojiPicker onEmojiClick={onEmojiClick} theme="dark" height={350} width="100%" />
                  <div onClick={() => setShowEmojiPicker(false)} className="fixed inset-0 -z-10" />
                </div>
              </Suspense>
            )}

            {showGifPicker && (
              <Suspense fallback={<div className="absolute bottom-full mb-4 h-[350px] w-full sm:w-[320px] flex items-center justify-center bg-white dark:bg-[#16161e] rounded-3xl border border-slate-200 dark:border-white/5 shadow-2xl pointer-events-auto"><ClipLoader color="#6366f1" /></div>}>
                <div className="absolute bottom-full mb-4 shadow-2xl rounded-3xl overflow-hidden animate-scale-in origin-bottom-left border border-white/5 w-full sm:w-[320px] pointer-events-auto">
                  <GifPicker onSelect={onGifSelect} onClose={() => setShowGifPicker(false)} />
                  <div onClick={() => setShowGifPicker(false)} className="fixed inset-0 -z-10 pointer-events-none" />
                </div>
              </Suspense>
            )}

            {/* @Mention Dropdown */}
            {mentionQuery !== null && (
              <MentionDropdown
                query={mentionQuery}
                users={users}
                groups={groups}
                currentChat={currentChat}
                isGroup={isGroup}
                onSelect={handleMentionSelect}
                inputRef={textInputRef}
              />
            )}

            {/* Smart Reply Suggestions */}
            <SmartReplies
              messages={messages}
              user={user}
              onSend={handleSmartReply}
              isBlocked={isBlocked}
              inputText={text}
            />

            <form onSubmit={handleSend} className="relative flex items-end gap-3 w-full mx-auto z-10 pointer-events-auto">
              {/* Input Bar Island */}
              <div className={`flex-1 flex flex-col bg-white/90 dark:bg-[#0f0f12]/90 backdrop-blur-xl rounded-[28px] p-2 transition-all duration-300 shadow-2xl border ${isFocused ? 'ring-2 ring-primary-500/30 border-primary-500/40' : 'border-slate-200 dark:border-white/5'} ${isBlocked ? 'opacity-50 cursor-not-allowed' : ''}`}>

                {/* Reply/Edit Context Preview */}
                {(replyingTo || editingMessageId) && (
                  <div className={`mx-2 mb-2 p-3 bg-black/5 dark:bg-white/5 rounded-2xl border-l-4 ${editingMessageId ? 'border-amber-500' : 'border-primary-500'} flex items-start gap-3 animate-premium-pop relative group/reply-prev`}>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[11px] font-black uppercase tracking-widest mb-0.5 ${editingMessageId ? 'text-amber-500' : 'text-primary-400'}`}>
                        {editingMessageId ? 'Editing Message' : (String(replyingTo?.senderId?._id || replyingTo?.senderId || '') === String(user?._id || user?.id) ? 'You' : (replyingTo?.senderId?.name || 'User'))}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-300 truncate">
                        {editingMessageId ? messages.find(m => m._id === editingMessageId)?.text || '...' : replyingTo?.text}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => editingMessageId ? cancelEditing() : setReplyingTo(null)}
                      className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-slate-400 transition-colors"
                    >
                      <X size={14} strokeWidth={3} />
                    </button>
                  </div>
                )}

                <div className="flex items-end">

                  {/* Media Attach Button */}
                  {/* Media Attach Button */}
                  <div className="flex-shrink-0 flex items-center gap-1 pl-1">
                    <label className={`p-2.5 rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition-all duration-200 cursor-pointer ${isBlocked || isSending ? 'opacity-50 pointer-events-none' : ''}`}>
                      <input
                        ref={docInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx,.txt"
                        onChange={(e) => e.target.files[0] && setImage(e.target.files[0])}
                        className="hidden"
                        disabled={isBlocked || isSending}
                      />
                      <Paperclip size={20} className="transform rotate-45" />
                    </label>
                    <label className={`p-2.5 rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition-all duration-200 cursor-pointer flex ${isBlocked || isSending ? 'opacity-50 pointer-events-none' : ''}`}>
                      <input
                        ref={imgInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files[0] && setImage(e.target.files[0])}
                        className="hidden"
                        disabled={isBlocked || isSending}
                      />
                      <ImageIcon size={20} />
                    </label>
                  </div>

                  {/* Text Input */}
                  <div className="flex-1 min-w-0 relative mx-1">
                    {image && (
                      <div className="absolute bottom-full left-0 mb-4 bg-white dark:bg-[#16161e] p-2.5 rounded-2xl flex items-center gap-3 text-sm border border-slate-200 dark:border-white/5 shadow-2xl backdrop-blur-xl z-40 animate-slideUp">
                        <div className="w-8 h-8 rounded-lg bg-primary-500/20 flex items-center justify-center"><Paperclip size={14} className="text-primary-400" /></div>
                        <span className="font-bold text-slate-200 truncate max-w-[180px]">{image.name}</span>
                        <button type="button" onClick={() => setImage(null)} className="text-slate-500 hover:text-rose-500 transition-colors bg-white/5 rounded-full p-1.5"><X size={14} /></button>
                      </div>
                    )}
                    <textarea
                      ref={textInputRef}
                      value={text}
                      onChange={handleTyping}
                      onKeyDown={handleKeyDown}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => { setIsFocused(false); setTimeout(() => setMentionQuery(null), 200); }}
                      placeholder={isBlocked ? "You have blocked this user" : "Write something..."}
                      disabled={isBlocked || isSending}
                      rows={1}
                      className="w-full bg-transparent border-0 py-3 px-3 focus:outline-none focus:ring-0 focus:border-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 font-medium disabled:opacity-50 text-[15px] resize-none overflow-y-auto scrollbar-hide h-[48px]"
                    />
                  </div>

                  {/* Emoji & GIF Toggles */}
                  <div className="flex items-center gap-1 pr-1">
                    <button
                      type="button"
                      onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowGifPicker(false); }}
                      className={`p-2.5 rounded-full hover:bg-white/5 text-slate-400 hover:text-yellow-400 transition-all duration-200 ${isBlocked ? 'opacity-50' : ''}`}
                    >
                      <Smile size={22} />
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowGifPicker(!showGifPicker); setShowEmojiPicker(false); }}
                      className={`px-3 py-1.5 rounded-xl hover:bg-white/5 text-slate-500 hover:text-white transition-all duration-200 font-black text-[10px] tracking-widest hidden sm:block border border-transparent hover:border-white/5`}
                    >
                      GIF
                    </button>
                  </div>
                </div>
              </div>

              {/* Send Button */}
              <button
                type="submit"
                disabled={(!text.trim() && !image) || isBlocked || isSending}
                className={`flex-shrink-0 w-[48px] h-[48px] sm:w-[54px] sm:h-[54px] rounded-full transition-all duration-300 transform active:scale-95 flex items-center justify-center shadow-lg group/send ${(!text.trim() && !image) || isBlocked ? 'bg-white/5 text-slate-600 cursor-not-allowed shadow-none' : 'bg-primary-600 hover:bg-primary-500 text-white shadow-primary-500/20'}`}
              >
                {isSending ? (
                  <ClipLoader size={20} color="#fff" />
                ) : (
                  <Send size={20} className={`transition-transform duration-500 ${(!text.trim() && !image) ? '' : 'group-hover/send:translate-x-0.5 group-hover/send:-translate-y-0.5 group-hover/send:scale-110'}`} />
                )}
              </button>
            </form>

            {/* Delete Message Modal */}
            {deleteModalOpen && selectedMessageForDelete && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in pointer-events-auto">
                <div className="rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-scale-in bg-white dark:bg-[#1a1d27] border border-slate-200 dark:border-error/25">
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Delete Message?</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                    Choose how you want to delete this message.
                  </p>
                  <div className="flex flex-col space-y-3">
                    {canDeleteForEveryone(selectedMessageForDelete) && (
                      <button
                        onClick={() => confirmDelete('everyone')}
                        className="w-full py-3 px-4 rounded-xl transition font-bold text-sm text-white flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg,#dc2626,#b91c1c)', boxShadow: '0 0 15px rgba(239,68,68,0.3)' }}
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        Delete for Everyone
                      </button>
                    )}
                    <button
                      onClick={() => confirmDelete('me')}
                      className="w-full py-3 px-4 rounded-xl transition font-bold text-sm text-slate-700 dark:text-slate-300 flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/5"
                    >
                      Delete for Me Only
                    </button>
                    <button
                      onClick={() => { setDeleteModalOpen(false); setSelectedMessageForDelete(null); }}
                      className="w-full py-3 px-4 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition font-medium text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            <Suspense fallback={null}>
              <ReportModal
                isOpen={reportModalOpen}
                onClose={() => setReportModalOpen(false)}
                reportedUserId={currentChat}
                reportedMessageId={reportMessageId}
              />
            </Suspense>

            {profileModalOpen && (
              <Suspense fallback={null}>
                <UserProfileModal
                  userId={currentChat}
                  onClose={() => setProfileModalOpen(false)}
                />
              </Suspense>
            )}

            {showSharedMedia && (
              <Suspense fallback={<div className="fixed inset-y-0 right-0 w-80 bg-white dark:bg-slate-900 shadow-2xl z-40 flex items-center justify-center"><ClipLoader color="#9333ea" /></div>}>
                <SharedMedia
                  messages={messages}
                  onClose={() => setShowSharedMedia(false)}
                />
              </Suspense>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
