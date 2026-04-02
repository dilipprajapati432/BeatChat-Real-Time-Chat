import { create } from 'zustand';
import { io } from 'socket.io-client';
import useAuthStore from './authStore.js';
import useSettingsStore from './settingsStore.js';
import API_URL from '../config.js';

const useChatStore = create((set, get) => ({
  users: [],
  groups: [],
  messages: [],
  unreadCounts: {},
  onlineUsers: [],
  lastSeenMap: {},
  currentChat: null,
  socket: null,
  isConnected: false,
  isConnecting: false,
  pendingMessages: [],

  fetchGroups: async () => {
    try {
      const { token } = useAuthStore.getState();
      const res = await fetch(`${API_URL}/api/groups`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) set({ groups: data });
    } catch (err) {
      console.error("Fetch groups error", err);
    }
  },

  fetchUsers: async () => {
    try {
      const { token } = useAuthStore.getState();
      const res = await fetch(`${API_URL}/api/messages/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        // Use existing setUsers logic which also updates unread counts and last seen
        get().setUsers(data);
      }
    } catch (err) {
      console.error("Fetch users error", err);
    }
  },

  createGroup: async (groupData) => {
    const { token } = useAuthStore.getState();
    const res = await fetch(`${API_URL}/api/groups/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(groupData)
    });
    const data = await res.json();
    if (res.ok) {
      set(state => ({ groups: [data, ...state.groups] }));
      return data;
    }
    throw new Error(data.error || 'Failed to create group');
  },

  joinGroupRoom: (groupId) => {
    const { socket } = get();
    if (socket && socket.connected) {
      socket.emit('joinGroup', { groupId });
    }
  },

  setGroups: (groups) => set({ groups }),

  joinGroupByCode: async (code) => {
    const { token } = useAuthStore.getState();
    const res = await fetch(`${API_URL}/api/groups/join-by-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ code })
    });
    const data = await res.json();
    if (res.ok) {
      if (!data.pending) {
        set(state => ({ groups: [data.group, ...state.groups] }));
        return { success: true, group: data.group };
      }
      return { success: true, pending: true, message: data.message };
    }
    throw new Error(data.error || 'Failed to join group');
  },

  handleJoinRequest: async (groupId, userId, action) => {
    const { token } = useAuthStore.getState();
    const res = await fetch(`${API_URL}/api/groups/${groupId}/requests/handle`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ userId, action })
    });
    const data = await res.json();
    if (res.ok) {
      set(state => ({
        groups: state.groups.map(g => g._id === data._id ? data : g)
      }));
      return data;
    }
    throw new Error(data.error || 'Failed to handle request');
  },

  updateGroupPrivacy: async (groupId, isPublic) => {
    const { token } = useAuthStore.getState();
    const res = await fetch(`${API_URL}/api/groups/${groupId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ isPublic })
    });
    const data = await res.json();
    if (res.ok) {
      set(state => ({
        groups: state.groups.map(g => g._id === data._id ? data : g)
      }));
      return data;
    }
    throw new Error(data.error || 'Failed to update privacy');
  },

  leaveGroup: async (groupId) => {
    const { token } = useAuthStore.getState();
    const res = await fetch(`${API_URL}/api/groups/${groupId}/leave`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (res.ok) {
      set(state => ({
        groups: state.groups.filter(g => g._id !== groupId),
        currentChat: state.currentChat === groupId ? null : state.currentChat
      }));
      return data;
    }
    throw new Error(data.error || 'Failed to leave group');
  },

  deleteGroup: async (groupId) => {
    const { token } = useAuthStore.getState();
    const res = await fetch(`${API_URL}/api/groups/${groupId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (res.ok) {
      set(state => ({
        groups: state.groups.filter(g => g._id !== groupId),
        currentChat: state.currentChat === groupId ? null : state.currentChat
      }));
      return data;
    }
    throw new Error(data.error || 'Failed to delete group');
  },

  connectSocket: () => {
    const { user, token } = useAuthStore.getState();
    const { socket } = get();

    if (!user || socket?.connected) return;

    const newSocket = io(API_URL, {
      auth: { token },
    });

    newSocket.connect();
    set({ socket: newSocket, isConnecting: true });

    newSocket.on('connect', () => {
      set({ isConnected: true, isConnecting: false });
    });

    newSocket.on('disconnect', () => {
      set({ isConnected: false, isConnecting: false });
    });

    newSocket.on('onlineUsers', (userIds) => {
      set({ onlineUsers: userIds });
    });

    newSocket.on('userStatusChanged', ({ userId, status, lastSeen }) => {
      const { onlineUsers, lastSeenMap } = get();
      if (status === 'online') {
        if (!onlineUsers.includes(userId)) set({ onlineUsers: [...onlineUsers, userId] });
      } else {
        set({ 
          onlineUsers: onlineUsers.filter(id => id !== userId),
          lastSeenMap: { ...lastSeenMap, [userId]: lastSeen }
        });
      }
    });

    newSocket.on('mentioned', (data) => {
      import('react-hot-toast').then(({ default: toast }) => {
        toast(`@Mentioned by ${data.senderName}: ${data.text}`, {
          icon: '🔔',
          duration: 4000,
          style: { background: '#6366f1', color: '#fff', fontWeight: 'bold' }
        });
      });
    });

    newSocket.on('message', (newMessage) => {
      const { currentChat, messages, unreadCounts, users, setUsers } = get();
      const updatedUsers = get().users.map(u => {
        if (u._id === newMessage.senderId || u._id === newMessage.receiverId) {
          return {
            ...u,
            lastMessage: {
              text: newMessage.text,
              timestamp: newMessage.timestamp
            }
          };
        }
        return u;
      });
      set({ users: updatedUsers });

      if (newMessage.sender && !users.find(u => u._id === newMessage.senderId)) {
        const newUser = {
          _id: newMessage.sender._id,
          name: newMessage.sender.name,
          username: newMessage.sender.username,
          avatar: newMessage.sender.avatar
        };
        setUsers([newUser, ...users]);
      }

      const { user, setUser } = useAuthStore.getState();
      if (user?.deletedChats?.some(dc => dc.partnerId?.toString() === newMessage.senderId?.toString())) {
        const newDeletedChats = user.deletedChats.filter(dc => dc.partnerId?.toString() !== newMessage.senderId?.toString());
        setUser({ ...user, deletedChats: newDeletedChats });
      }

      if (user?.hiddenChats?.some(id => id.toString() === newMessage.senderId?.toString())) {
        const newHiddenChats = user.hiddenChats.filter(id => id.toString() !== newMessage.senderId?.toString());
        setUser({ ...user, hiddenChats: newHiddenChats });
      }

      if (currentChat === newMessage.senderId) {
        set({ messages: [...messages, newMessage] });
        newSocket.emit('markSeen', { senderId: newMessage.senderId });
      } else {
        const senderId = newMessage.senderId.toString();
        const currentCount = unreadCounts[senderId] || 0;
        set({ unreadCounts: { ...unreadCounts, [senderId]: currentCount + 1 } });
        
        const { soundEnabled, desktopNotifications } = useSettingsStore.getState();
        
        if (soundEnabled) {
          try {
            const audio = new Audio('https://actions.google.com/sounds/v1/water/water_drop.ogg');
            audio.volume = 0.5;
            audio.play().catch(e => console.log('Audio error:', e));
          } catch(e) {}
        }
        
        if (desktopNotifications && window.Notification && Notification.permission === 'granted') {
          try {
            new Notification(`New message`, {
              body: newMessage.text ? newMessage.text.substring(0, 50) : 'Sent an attachment',
            });
          } catch(e) {}
        }
        
        import('react-hot-toast').then(({ default: toast }) => {
          toast(`New Message: ${newMessage.text ? newMessage.text.substring(0, 20) + '...' : 'Attachment'}`, {
            icon: '📩',
            duration: 3000,
            style: { background: '#333', color: '#fff' }
          });
        });
      }
    });

    newSocket.on('groupMessage', (newMessage) => {
      const { currentChat, messages, unreadCounts, groups } = get();
      const updatedGroups = groups.map(g => {
        if (g._id === newMessage.groupId) {
          return {
            ...g,
            lastMessage: {
              text: newMessage.text,
              timestamp: newMessage.timestamp,
              senderName: newMessage.sender?.name
            }
          };
        }
        return g;
      });
      set({ groups: updatedGroups });

      if (currentChat === newMessage.groupId) {
        set({ messages: [...messages, newMessage] });
      } else {
        const groupId = newMessage.groupId;
        const currentCount = unreadCounts[groupId] || 0;
        set({ unreadCounts: { ...unreadCounts, [groupId]: currentCount + 1 } });
        
        const { soundEnabled, desktopNotifications } = useSettingsStore.getState();
        
        if (soundEnabled) {
          try {
            const audio = new Audio('https://actions.google.com/sounds/v1/water/water_drop.ogg');
            audio.volume = 0.5;
            audio.play().catch(e => console.log('Audio error:', e));
          } catch(e) {}
        }
        
        if (desktopNotifications && window.Notification && Notification.permission === 'granted') {
          try {
            new Notification(`Group Message`, {
              body: newMessage.text ? newMessage.text.substring(0, 50) : 'Sent an attachment',
            });
          } catch(e) {}
        }

        import('react-hot-toast').then(({ default: toast }) => {
          toast(`Group Message: ${newMessage.text ? newMessage.text.substring(0, 20) + '...' : 'Attachment'}`, {
            icon: '👥',
            duration: 3000,
            style: { background: '#333', color: '#fff' }
          });
        });
      }
    });

    newSocket.on('groupUpdated', (updatedGroup) => {
      const { groups } = get();
      set({ groups: groups.map(g => g._id === updatedGroup._id ? updatedGroup : g) });
    });

    newSocket.on('groupDeleted', ({ groupId }) => {
      const { groups, currentChat, setCurrentChat } = get();
      set({ groups: groups.filter(g => g._id !== groupId) });
      if (currentChat === groupId) {
        setCurrentChat(null);
        import('react-hot-toast').then(({ default: toast }) => { toast.error('This group has been deleted by the admin'); });
      }
    });

    newSocket.on('userRemovedFromGroup', ({ groupId, userId }) => {
      const { user } = useAuthStore.getState();
      const currentUserId = user?._id || user?.id;
      if (userId === currentUserId) {
        const { groups, currentChat, setCurrentChat } = get();
        set({ groups: groups.filter(g => g._id !== groupId) });
        if (currentChat === groupId) {
          setCurrentChat(null);
          import('react-hot-toast').then(({ default: toast }) => { toast.error('You were removed from the group'); });
        }
      }
    });

    newSocket.on('messagesSeen', ({ receiverId }) => {
      const { currentChat, messages } = get();
      if (currentChat === receiverId) {
        set({ messages: messages.map(msg => msg.receiverId === receiverId ? { ...msg, status: 'seen' } : msg) });
      }
    });

    newSocket.on('messageSent', (sentMessage) => {
      const { messages, currentChat, pendingMessages } = get();
      const targetId = sentMessage.receiverId || sentMessage.groupId;
      set({ pendingMessages: pendingMessages.filter(m => m.tempId !== sentMessage.tempId) });
      if (currentChat === targetId) {
        set({ messages: messages.map(msg => msg._id === sentMessage.tempId ? { ...msg, ...sentMessage } : msg) });
      }
    });

    newSocket.on('messageDeleted', (messageId) => {
      const { messages } = get();
      set({ messages: messages.filter(m => m._id !== messageId) });
    });

    newSocket.on('messageEdited', ({ messageId, newText }) => {
      const { messages } = get();
      set({ messages: messages.map(m => m._id === messageId ? { ...m, text: newText, isEdited: true } : m) });
    });

    newSocket.on('reactionUpdate', ({ messageId, reactions }) => {
      const { messages } = get();
      set({ messages: messages.map(m => m._id === messageId ? { ...m, reactions } : m) });
    });

    newSocket.on('messagePinned', ({ messageId, isPinned }) => {
      const { messages } = get();
      set({ messages: messages.map(m => m._id === messageId ? { ...m, isPinned } : m) });
    });
  },

  disconnectSocket: () => {
    if (get().socket?.connected) get().socket.disconnect();
    set({ socket: null });
  },

  markMessagesAsSeen: (senderId) => {
    const { socket, unreadCounts } = get();
    if (socket && !senderId.match(/group_/)) socket.emit('markSeen', { senderId });
    if (unreadCounts[senderId]) {
      const newUnread = { ...unreadCounts };
      delete newUnread[senderId];
      set({ unreadCounts: newUnread });
    }
  },

  setMessages: (messages) => set((state) => ({
    messages: typeof messages === 'function' ? messages(state.messages) : messages
  })),

  setUsers: (users) => {
    const unreadCounts = { ...get().unreadCounts };
    const lastSeenMap = { ...get().lastSeenMap };
    users.forEach(u => {
      if (u.unreadCount !== undefined) unreadCounts[u._id] = u.unreadCount;
      if (u.lastSeen) lastSeenMap[u._id] = u.lastSeen;
    });
    set({ users, unreadCounts, lastSeenMap });
  },

  setOnlineUsers: (onlineUsers) => set({ onlineUsers }),

  setCurrentChat: (currentChat, partner = null) => {
    const { users, setUsers, markMessagesAsSeen } = get();
    set({ currentChat, messages: [] });
    if (partner && partner._id && !users.find(u => u._id === partner._id)) {
      setUsers([partner, ...users]);
    }
    if (currentChat) markMessagesAsSeen(currentChat);
  },

  sendMessage: async (content, type, replyToId = null) => {
    const { socket, currentChat, messages, users, setUsers, setMessages, pendingMessages, isConnected } = get();
    const { user } = useAuthStore.getState();
    if (!user) return;
    const tempId = Date.now().toString();
    const clientId = `${user._id || user.id}-${tempId}`;
    const optimisticMessage = {
      _id: tempId, tempId, clientId, text: content, senderId: user._id || user.id,
      receiverId: type === 'group' ? null : currentChat,
      groupId: type === 'group' ? currentChat : null,
      timestamp: new Date().toISOString(),
      status: isConnected ? 'sending' : 'failed'
    };
    setMessages([...messages, optimisticMessage]);
    if (isConnected && socket) {
      socket.emit('message', { text: content, to: currentChat, tempId, type, clientId, replyTo: replyToId });
      set({ pendingMessages: [...pendingMessages, optimisticMessage] });
    } else {
      set({ pendingMessages: [...pendingMessages, { ...optimisticMessage, status: 'failed' }] });
    }
    if (type === 'direct') {
      set({ users: users.map(u => u._id === currentChat ? { ...u, lastMessage: { text: content, timestamp: new Date().toISOString() } } : u) });
    } else {
      set({ groups: get().groups.map(g => g._id === currentChat ? { ...g, lastMessage: { text: content, timestamp: new Date().toISOString(), senderName: user.name } } : g) });
    }
    const { user: authUser, setUser } = useAuthStore.getState();
    if (type === 'direct' && authUser?.deletedChats?.some(dc => dc.partnerId?.toString() === currentChat?.toString())) {
      setUser({ ...authUser, deletedChats: authUser.deletedChats.filter(dc => dc.partnerId?.toString() !== currentChat?.toString()) });
    }
    if (type === 'direct' && authUser?.hiddenChats?.some(id => id.toString() === currentChat?.toString())) {
      setUser({ ...authUser, hiddenChats: authUser.hiddenChats.filter(id => id.toString() !== currentChat?.toString()) });
    }
    if (type === 'direct' && !users.find(u => u._id?.toString() === currentChat?.toString())) {
      try {
        const token = useAuthStore.getState().token;
        const res = await fetch(`${API_URL}/api/users/invite/${currentChat}`, { headers: { Authorization: `Bearer ${token}` } });
        const newUser = await res.json();
        if (newUser && newUser._id) setUsers([newUser, ...users]);
      } catch (err) { console.error("Failed to add new user to list", err); }
    }
  },

  reset: () => set({ messages: [], users: [], unreadCounts: {}, onlineUsers: [], currentChat: null, groups: [] })
}));

export default useChatStore;