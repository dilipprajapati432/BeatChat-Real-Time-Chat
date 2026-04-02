import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import useChatStore from '../stores/chatStore';
import useAuthStore from '../stores/authStore';

// Time formatting helper
const formatTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }
  
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  }
  
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

import ClipLoader from 'react-spinners/ClipLoader';
import toast from 'react-hot-toast';
import ReportModal from './ReportModal';
import ConfirmModal from './ConfirmModal';
import UserProfileModal from './UserProfileModal';
import CreateGroupModal from './CreateGroupModal';
import JoinGroupModal from './JoinGroupModal';
import logo from '../assets/beatchat-logo.png';
import {
  Users, MessageSquare, Plus, Search, LogOut, Moon, Sun,
  Shield, ShieldAlert, Trash2, UserX, Menu, Hash, UserPlus, EyeOff, X
} from 'lucide-react';
import GroupMembersModal from './GroupMembersModal';
import AddMemberModal from './AddMemberModal';
import GroupSettingsModal from './GroupSettingsModal';
import AddContactModal from './AddContactModal';

const Sidebar = ({ isOpen, setIsOpen, setView, currentView }) => {
  const {
    users = [], setUsers, onlineUsers = [], setCurrentChat, currentChat,
    unreadCounts = {}, groups = [], fetchGroups, joinGroupRoom, leaveGroup, deleteGroup
  } = useChatStore();
  
  const { user, logout, setUser } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState('chats');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showJoinGroup, setShowJoinGroup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showBlocked, setShowBlocked] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportTargetId, setReportTargetId] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmData, setConfirmData] = useState({ title: '', message: '', isDanger: false, confirmText: 'Confirm' });
  const [profileModalUserId, setProfileModalUserId] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(() => (localStorage.getItem('theme') || 'dark') === 'dark');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const isInitialMount = useRef(true);
  
  useEffect(() => {
     // Mark as not initial mount after the first layout 
     const timer = setTimeout(() => {
        isInitialMount.current = false;
     }, 100);
     return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = useAuthStore.getState().token;
        const { fetchUsers, fetchGroups } = useChatStore.getState();
        
        // Fetch contacts locally as they are only used for search in Sidebar
        const resContacts = await axios.get(import.meta.env.VITE_API_URL + '/api/users/contacts', { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        
        setContacts(resContacts.data);
        
        // Use store to fetch users and groups
        await Promise.all([
          fetchUsers(),
          fetchGroups()
        ]);
        
      } catch (err) { 
        console.error("Sidebar initial fetch error:", err); 
      } finally { 
        setLoading(false); 
      }
    };
    
    fetchData();
    
    const close = () => setContextMenu(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  useEffect(() => {
    // Only auto-close if this isn't the initial load of the app
    if (currentChat && window.innerWidth < 1024 && !isInitialMount.current) {
      setIsOpen(false);
    }
  }, [currentChat, setIsOpen]);

  useEffect(() => {
    if (!currentChat) return;
    const isGroup = groups.some(g => g._id === currentChat);
    if (isGroup) return;
    const isUser = users.some(u => u._id === currentChat) || contacts.some(u => u._id === currentChat);
    if (isUser) return;
    const fetchMissingUser = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/users/invite/${currentChat}`);
        useChatStore.getState().setUsers([res.data, ...users]);
      } catch (err) { console.error(err); }
    };
    fetchMissingUser();
  }, [currentChat, users, groups, contacts]);

  const confirmBlock = async (userId, isBlocked) => {
    try {
      const url = isBlocked
        ? `${import.meta.env.VITE_API_URL}/api/users/unblock/${userId}`
        : `${import.meta.env.VITE_API_URL}/api/users/block/${userId}`;
      const token = useAuthStore.getState().token;
      const res = await axios.post(url, {}, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(res.data.message);
      if (res.data.blockedUsers) setUser({ ...user, blockedUsers: res.data.blockedUsers });
    } catch (err) { toast.error(err.response?.data?.error || 'Action failed'); }
  };

  const handleBlock = (userId, isBlocked) => {
    setConfirmData({
      title: isBlocked ? 'Unblock User' : 'Block User',
      message: isBlocked ? 'Are you sure you want to unblock this user?' : 'Are you sure you want to block this user? They will not be able to message you.',
      isDanger: !isBlocked,
      confirmText: isBlocked ? 'Unblock' : 'Block'
    });
    setConfirmAction(() => () => confirmBlock(userId, isBlocked));
    setConfirmOpen(true);
  };

  const hideConversation = async (userId) => {
    try {
      const token = useAuthStore.getState().token;
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/users/hide/${userId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Chat hidden');
      
      if (res.data.hiddenChats) {
        setUser({ ...user, hiddenChats: res.data.hiddenChats });
      }

      if (currentChat === userId) {
        useChatStore.getState().setCurrentChat(null);
      }
    } catch (err) { toast.error('Failed to hide chat'); }
  };

  const handleHideChat = (userId) => {
    setConfirmData({ 
      title: 'Hide Chat', 
      message: 'Are you sure you want to hide this conversation? It will reappear if you receive a new message.', 
      isDanger: false, 
      confirmText: 'Hide' 
    });
    setConfirmAction(() => () => hideConversation(userId));
    setConfirmOpen(true);
  };

  const allKnownUsers = [...users, ...contacts].reduce((acc, current) => {
    if (!acc.find(u => u._id === current._id)) acc.push(current);
    return acc;
  }, []);

  const activeUsers = allKnownUsers.filter(u =>
    !user?.blockedUsers?.some(id => id.toString() === u._id?.toString()) &&
    !user?.deletedChats?.some(dc => dc.partnerId?.toString() === u._id?.toString()) &&
    (!user?.hiddenChats?.some(id => id.toString() === u._id?.toString()) || searchQuery) &&
    (searchQuery ? (u.name.toLowerCase().includes(searchQuery.toLowerCase()) || (u.username && u.username.toLowerCase().includes(searchQuery.toLowerCase()))) : true)
  ).sort((a, b) => {
    const timeA = a.lastMessage?.timestamp ? new Date(a.lastMessage.timestamp) : new Date(0);
    const timeB = b.lastMessage?.timestamp ? new Date(b.lastMessage.timestamp) : new Date(0);
    return timeB - timeA;
  });

  const blockedUsersList = allKnownUsers.filter(u => user?.blockedUsers?.includes(u._id));
  const displayedUsers = showBlocked ? blockedUsersList : activeUsers;

  const handleUserClick = (u) => {
    if (searchQuery) {
      setSearchQuery('');
    }
    setCurrentChat(u._id, u);
    setView('chat');
    if (window.innerWidth < 1024) setIsOpen(false);
  };

  const sid = {
    container: {
      background: 'var(--sidebar-bg)',
      borderRight: '1px solid var(--sidebar-border)',
    },
    activeTab: {
      background: 'rgba(91, 108, 255, 0.15)',
      border: '1px solid rgba(91, 108, 255, 0.25)',
      color: '#5B6CFF',
    },
    inactiveTab: { color: 'var(--sidebar-item-text)' },
    activeItem: {
      background: 'rgba(91, 108, 255, 0.1)',
      border: '1px solid rgba(91, 108, 255, 0.2)',
      borderLeft: '3px solid #6366f1',
    },
    hoverItem: {},
  };

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 lg:hidden animate-fade-in backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}
      <aside className={`z-50 h-full transition-all duration-300 ease-in-out overflow-hidden
        ${isOpen ? 'w-[min(360px,85vw)] md:w-80 lg:w-72 translate-x-0 opacity-100' : 'w-0 -translate-x-full lg:translate-x-0 lg:w-0 opacity-0 lg:opacity-0'}
        absolute lg:relative top-0 left-0 flex-shrink-0`}>

      <div className="flex flex-col h-full overflow-hidden" style={sid.container}>
        <div className="h-[2px] flex-shrink-0" style={{ background: 'linear-gradient(90deg, #6366f1, #2dd4bf, #818cf8)' }} />

        <div className="p-4 sm:p-5 flex-shrink-0" style={{ borderBottom: '1px solid var(--sidebar-border)' }}>
          <div className="flex items-center gap-3 mb-4 sm:mb-5">
            <button onClick={() => setIsOpen(!isOpen)}
              className="p-2.5 -ml-2 rounded-xl transition-all hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 hover:text-primary-500 flex items-center justify-center">
              {isOpen && window.innerWidth < 1024 ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div onClick={() => window.location.reload()} className="flex items-center gap-3.5 cursor-pointer group ml-1">
              <img src={logo} alt="BeatChat" className="h-9 w-auto object-contain transition-all duration-300 group-hover:scale-105"
                style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' }} />
              <span className="text-[22px] font-extrabold font-heading tracking-tight"
                style={{ color: 'var(--col-text)' }}>
                BeatChat
              </span>
            </div>
          </div>
        </div>

        <div className="mb-3 px-5">
          <div className="flex items-center w-full px-4 py-2.5 rounded-full bg-black/5 dark:bg-white/5 border border-transparent dark:border-white/5 shadow-inner transition-all focus-within:bg-white dark:focus-within:bg-white/10 focus-within:shadow-md focus-within:border-primary-500/30">
            <Search size={14} className="text-slate-400 flex-shrink-0" />
            <input 
              id="sidebar-search" 
              type="text" 
              placeholder="Search..." 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)}
              className="flex-1 w-full ml-2.5 text-sm font-medium bg-transparent focus:outline-none text-slate-800 dark:text-slate-200 placeholder:text-slate-500 dark:placeholder:text-slate-600"
            />
          </div>
        </div>

        <div className="px-5 mb-4">
          <button onClick={() => setShowAddContactModal(true)}
            className="btn-primary w-full mb-4 group shadow-lg hover:shadow-primary-500/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <Plus size={18} className="mr-2" />
            <span>New Chat</span>
          </button>

          <div className="flex gap-1.5 p-1 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
            {[{ id: 'chats', icon: MessageSquare, label: 'Chats' }, { id: 'groups', icon: Users, label: 'Groups' }].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center py-2 rounded-lg text-xs font-bold transition-all duration-200 ${activeTab === tab.id
                  ? 'bg-white dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 shadow-sm border border-black/5 dark:border-primary-500/20'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}>
                <tab.icon size={13} className="mr-1.5" />{tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-0.5 custom-scrollbar">
          {loading ? (
            <div className="flex justify-center mt-16"><ClipLoader size={24} color="#8b5cf6" /></div>
          ) : activeTab === 'chats' ? (
            displayedUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 mt-4">
                <Search size={18} className="text-primary-500 opacity-50 mb-3" />
                <p className="text-sm font-medium text-slate-500">No users found</p>
              </div>
            ) : displayedUsers.map(u => {
              const isSelected = currentChat === u._id && currentView === 'chat';
              const hasUnread = unreadCounts[u._id] > 0;
              const isOnline = onlineUsers.includes(u._id);
              return (
                <div key={u._id} onClick={() => handleUserClick(u)}
                  onContextMenu={e => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, userId: u._id }); }}
                  className={`relative flex items-center p-3 rounded-xl cursor-pointer transition-all duration-200 ${isSelected ? 'sidebar-item-active shadow-sm' : 'hover:bg-white/5 border-transparent'} group/item`}
                >
                  <div className="relative flex-shrink-0">
                    <img
                      src={u.avatar
                        ? (u.avatar.startsWith('http') ? u.avatar : `${import.meta.env.VITE_API_URL}${u.avatar}`)
                        : `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=random`}
                      alt="avatar"
                      className="w-12 h-12 rounded-full object-cover shadow-sm transition-transform group-hover/item:scale-105" />
                    {isOnline && !showBlocked && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 animate-online-pulse"
                        style={{ background: '#34d399', borderColor: '#111420' }} />
                    )}
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h3 className={`font-bold text-[15px] truncate ${isSelected ? 'text-white' : 'text-slate-200'}`}>{u.name}</h3>
                      {u.lastMessage && <span className="text-[10px] text-slate-500 font-medium ml-2">{formatTime(u.lastMessage.timestamp)}</span>}
                    </div>
                    <div className="flex justify-between items-center">
                      <p className={`text-xs truncate max-w-[170px] ${hasUnread ? 'text-slate-100 font-bold' : 'text-slate-500'}`}>
                        {searchQuery ? (u.email || `@${u.username}`) : (u.lastMessage ? u.lastMessage.text : (isOnline ? 'Online' : (u.lastSeen ? `Last seen ${formatTime(u.lastSeen)}` : 'Offline')))}
                      </p>
                      {hasUnread && <span className="unread-badge ml-2">{unreadCounts[u._id]}</span>}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="space-y-1.5">
              <button onClick={() => setShowCreateGroup(true)}
                className="w-full flex items-center p-2.5 rounded-xl transition-all duration-200 border border-dashed border-primary-500/25 hover:border-primary-500/50 text-slate-500 hover:text-primary-300 hover:bg-primary-500/5 group">
                <div className="w-10 h-10 rounded-full flex items-center justify-center mr-2.5 bg-primary-500/10 border border-primary-500/20">
                  <Plus size={16} className="text-primary-500" />
                </div>
                <span className="font-semibold text-sm">Create New Group</span>
              </button>
              <button onClick={() => setShowJoinGroup(true)}
                className="w-full flex items-center p-2.5 rounded-xl transition-all duration-200 border border-primary-500/15 bg-primary-500/5 text-slate-500 hover:text-primary-300 hover:bg-primary-500/10 group mt-2">
                <div className="w-10 h-10 rounded-full flex items-center justify-center mr-2.5 bg-cyan-500/10 border border-cyan-500/20">
                  <Hash size={16} className="text-cyan-500" />
                </div>
                <span className="font-semibold text-sm">Join Group by Code</span>
              </button>
              {groups.filter(g => g.name.toLowerCase().includes(searchQuery.toLowerCase())).map(group => {
                const isSelected = currentChat === group._id;
                return (
                  <div key={group._id}
                    onClick={() => { setCurrentChat(group._id); joinGroupRoom(group._id); setView('chat'); if (window.innerWidth < 1024) setIsOpen(false); }}
                    onContextMenu={e => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, groupId: group._id }); }}
                    className={`flex items-center p-3 rounded-xl cursor-pointer transition-all duration-200 ${isSelected ? 'sidebar-item-active shadow-sm' : 'hover:bg-white/5 border-transparent'} mb-1 group/item`}
                  >
                    <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm overflow-hidden flex-shrink-0 bg-primary-900/20 text-primary-300 border border-primary-500/20 group-hover/item:scale-105 transition-transform">
                      {group.avatar ? <img src={group.avatar} className="w-full h-full object-cover" alt={group.name} /> : group.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <h3 className={`font-bold text-[15px] truncate ${isSelected ? 'text-white' : 'text-slate-200'}`}>{group.name}</h3>
                        {group.lastMessage && <span className="text-[10px] text-slate-500 font-medium ml-2">{formatTime(group.lastMessage.timestamp)}</span>}
                      </div>
                      <div className="flex justify-between items-center">
                        <p className={`text-xs truncate max-w-[160px] ${unreadCounts[group._id] > 0 ? 'text-slate-100 font-semibold' : 'text-slate-500'}`}>
                          {group.lastMessage ? <span><span className="text-primary-400 font-medium">{group.lastMessage.senderName}:</span> {group.lastMessage.text}</span> : `${group.members?.length || 0} members`}
                        </p>
                        {unreadCounts[group._id] > 0 && <span className="unread-badge ml-2">{unreadCounts[group._id]}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-3 flex-shrink-0 border-t border-slate-200 dark:border-white/5 bg-slate-100 dark:bg-black/20">
          <div onClick={() => { setView('profile'); if (window.innerWidth < 768) setIsOpen(false); }}
            className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all duration-300 group ${currentView === 'profile' ? 'bg-white dark:bg-primary-500/10 shadow-sm border border-slate-200 dark:border-primary-500/20' : 'hover:bg-white dark:hover:bg-white/5 border border-transparent'}`}>
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <div className="relative flex-shrink-0">
                <img src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name}&background=random`} alt="Me"
                  className="w-9 h-9 rounded-full object-cover" style={{ boxShadow: '0 0 0 2px rgba(139,92,246,0.4)' }} />
                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full border-2 bg-emerald-400 border-[#0a0118]" />
              </div>
              <div className="min-w-0 pr-2">
                <p className="text-sm font-bold text-slate-200 group-hover:text-primary-300 transition-colors truncate">{user?.name}</p>
                <p className="text-[10px] text-slate-600 uppercase tracking-wider truncate">My Account</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={e => {
                e.stopPropagation();
                const html = document.documentElement;
                const goingLight = html.classList.contains('dark');
                html.classList.toggle('dark', !goingLight);
                html.classList.toggle('light', goingLight);
                localStorage.setItem('theme', goingLight ? 'light' : 'dark');
                setIsDarkMode(!goingLight);
              }} className="p-1.5 rounded-lg text-slate-500 hover:text-primary-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-all">
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button onClick={e => {
                e.stopPropagation();
                setConfirmData({ title: 'Log Out', message: 'Are you sure you want to log out?', isDanger: false, confirmText: 'Log Out' });
                setConfirmAction(() => () => logout());
                setConfirmOpen(true);
              }} className="p-1.5 rounded-lg text-slate-500 hover:text-error hover:bg-error/10 transition-all">
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
      </aside>

      {createPortal(
        <>
          <ReportModal isOpen={reportModalOpen} onClose={() => setReportModalOpen(false)} reportedUserId={reportTargetId} />
          {profileModalUserId && <UserProfileModal userId={profileModalUserId} onClose={() => setProfileModalUserId(null)} />}
          {showCreateGroup && <CreateGroupModal onClose={() => setShowCreateGroup(false)} />}
          {showJoinGroup && <JoinGroupModal onClose={() => setShowJoinGroup(false)} />}
          <ConfirmModal isOpen={confirmOpen} onClose={() => setConfirmOpen(false)}
            onConfirm={() => { if (confirmAction) confirmAction(); setConfirmOpen(false); }}
            title={confirmData.title} message={confirmData.message}
            confirmText={confirmData.confirmText} isDanger={confirmData.isDanger} />
          {showAddContactModal && (
            <AddContactModal
              isOpen={showAddContactModal}
              onClose={() => setShowAddContactModal(false)}
              onContactAdded={(addedUser) => {
                if (addedUser && addedUser._id) {
                  setContacts(prev => prev.find(c => c._id === addedUser._id) ? prev : [addedUser, ...prev]);
                  const currentUsers = useChatStore.getState().users;
                  if (!currentUsers.find(u => u._id === addedUser._id)) {
                    useChatStore.getState().setUsers([addedUser, ...currentUsers]);
                  }
                }
                axios.get(import.meta.env.VITE_API_URL + '/api/users/contacts', {
                  headers: { Authorization: `Bearer ${(localStorage.getItem('token') || sessionStorage.getItem('token'))}` }
                }).then(res => setContacts(res.data)).catch(console.error);
              }}
            />
          )}
          {showMembersModal && selectedGroup && <GroupMembersModal group={selectedGroup} onClose={() => setShowMembersModal(false)} />}
          {showAddMemberModal && selectedGroup && <AddMemberModal groupId={selectedGroup._id} onClose={() => setShowAddMemberModal(false)} />}
          {showGroupSettings && selectedGroup && <GroupSettingsModal group={selectedGroup} onClose={() => setShowGroupSettings(false)} />}
        </>,
        document.body
      )}

      {contextMenu && createPortal(
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setContextMenu(null)} />
          <div className="fixed z-[9999] py-1.5 min-w-[180px] rounded-2xl overflow-hidden shadow-2xl"
            style={{ top: contextMenu.y, left: contextMenu.x, background: '#1a1d27', border: '1px solid rgba(99,102,241,0.25)' }}
            onClick={e => e.stopPropagation()}>
            {contextMenu.groupId ? (
              (() => {
                const group = groups.find(g => g._id === contextMenu.groupId);
                const isAdmin = group?.admin?._id === (user?._id || user?.id) || group?.admin === (user?._id || user?.id);
                return [
                  { label: 'View Group Info', icon: Shield, action: () => { setSelectedGroup(group); setShowMembersModal(true); } },
                  { label: 'Add Members', icon: UserPlus, action: () => { setSelectedGroup(group); setShowAddMemberModal(true); } },
                  { label: 'Copy Group Code', icon: Hash, action: () => { navigator.clipboard.writeText(group.groupCode); toast.success('Code copied!'); } },
                  ...(isAdmin ? [
                    { label: 'Group Settings', icon: Shield, action: () => { setSelectedGroup(group); setShowGroupSettings(true); } },
                    { label: 'Delete Group', icon: Trash2, danger: true, action: () => {
                      setConfirmData({ title: 'Delete Group', message: `Are you sure you want to delete "${group.name}"?`, isDanger: true, confirmText: 'Delete' });
                      setConfirmAction(() => () => deleteGroup(group._id));
                      setConfirmOpen(true);
                    }}
                  ] : [
                    { label: 'Leave Group', icon: LogOut, danger: true, action: () => {
                      setConfirmData({ title: 'Leave Group', message: `Are you sure you want to leave "${group.name}"?`, isDanger: true, confirmText: 'Leave' });
                      setConfirmAction(() => () => leaveGroup(group._id));
                      setConfirmOpen(true);
                    }}
                  ])
                ].map((item, i) => (
                  <button key={i} onClick={() => { item.action(); setContextMenu(null); }}
                    className="w-full text-left px-4 py-2.5 text-sm font-medium flex items-center gap-2.5 transition-colors"
                    style={{ color: item.danger ? '#f87171' : '#e2e8f0' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(139,92,246,0.08)'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}>
                    <item.icon size={14} />{item.label}
                  </button>
                ));
              })()
            ) : (
              [
                { label: showBlocked ? 'Unblock' : 'Block', icon: UserX, danger: !showBlocked, action: () => handleBlock(contextMenu.userId, showBlocked) },
                { label: 'View Profile', icon: Users, action: () => setProfileModalUserId(contextMenu.userId) },
                ...(!showBlocked ? [
                  { label: 'Hide Chat', icon: EyeOff, action: () => handleHideChat(contextMenu.userId) },
                  { label: 'Report', icon: ShieldAlert, warn: true, action: () => { setReportTargetId(contextMenu.userId); setReportModalOpen(true); } },
                ] : [])
              ].map((item, i) => (
                <button key={i} onClick={() => { item.action(); setContextMenu(null); }}
                  className="w-full text-left px-4 py-2.5 text-sm font-medium flex items-center gap-2.5 transition-colors"
                  style={{ color: item.danger ? '#f87171' : item.warn ? '#fbbf24' : '#e2e8f0' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(139,92,246,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}>
                  <item.icon size={14} />{item.label}
                </button>
              ))
            )}
          </div>
        </>,
        document.body
      )}
    </>
  );
};

export default Sidebar;