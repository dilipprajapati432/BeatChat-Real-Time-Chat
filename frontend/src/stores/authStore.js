import { create } from 'zustand';
import toast from 'react-hot-toast';

const useAuthStore = create((set) => ({
  user: null,
  token: null,

  checkAuth: async () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');

    if (token && userStr) {
      try {
        set({ token, user: JSON.parse(userStr) });
      } catch (err) {
        console.error(err);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        set({ user: null, token: null });
      }
    } else {
      set({ user: null, token: null });
    }
  },
  
  login: (user, token, rememberMe = true) => {
    const storage = rememberMe ? localStorage : sessionStorage;
    
    // Clear the opposite storage just in case there's a stale login session
    const otherStorage = rememberMe ? sessionStorage : localStorage;
    otherStorage.removeItem('token');
    otherStorage.removeItem('user');

    storage.setItem('token', token);
    storage.setItem('user', JSON.stringify(user));
    set({ user, token });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    set({ user: null, token: null });

    // Safely cleanup chat store
    import('./chatStore').then(({ default: useChatStore }) => {
      useChatStore.getState().disconnectSocket();
      useChatStore.getState().reset();
    });

    toast.success('Logged out');
  },
  setUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user));
    set({ user });
  }
}));

export default useAuthStore;