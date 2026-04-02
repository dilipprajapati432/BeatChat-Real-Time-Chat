import Sidebar from './Sidebar';
import ChatWindow from './ChatWindow';
import ProfileSettings from './ProfileSettings';
import useChatStore from '../stores/chatStore';
import { useState, useEffect, useRef, useCallback } from 'react';
import { WifiOff } from 'lucide-react';
import useSwipeGesture from '../hooks/useSwipeGesture';


const Dashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [view, setView] = useState('chat');
  const { isConnected, isConnecting, setCurrentChat, currentChat } = useChatStore();
  const settingsBackRef = useRef(null);

  // Contextual back action - Defined first to avoid TDZ issues in effects
  const handleBack = useCallback(() => {
    if (view === 'profile') {
      // First try internal back logic in settings (e.g. closing detail view on mobile)
      if (settingsBackRef.current && settingsBackRef.current()) {
         return true;
      }
      setView('chat');
      return true;
    }
    // On mobile or large screens, if chat is open, first back returns to list
    if (isSidebarOpen && window.innerWidth < 1024) {
      setIsSidebarOpen(false);
      return true;
    }
    if (currentChat && !isSidebarOpen) {
      setIsSidebarOpen(true);
      return true;
    }
    return false;
  }, [view, isSidebarOpen, currentChat]);

  useEffect(() => {
    // Apply dark/light mode preference (default: dark)
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    const pendingChat = localStorage.getItem('pendingChatUpdate');
    if (pendingChat) { setCurrentChat(pendingChat); localStorage.removeItem('pendingChatUpdate'); }

    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, [setCurrentChat]);

  // 2. State-to-History Synchronization
  useEffect(() => {
    const isMobile = window.innerWidth < 1024;
    const isNested = isMobile && (view === 'profile' || (currentChat && !isSidebarOpen));
    
    if (isNested && (!window.history.state || !window.history.state.isNested)) {
      window.history.pushState({ isNested: true }, "");
    }
  }, [view, currentChat, isSidebarOpen]);

  // 3. Popstate listener (Intercepting Native Browser/Hardware Back)
  useEffect(() => {
    const onPopState = (e) => {
      // If the user used the native back button/gesture, we try to handle it internally
      handleBack();
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [handleBack]);

  // Close sidebar gesture (Right to Left)
  const handleCloseSidebar = () => {
    if (isSidebarOpen) {
      setIsSidebarOpen(false);
      return true;
    }
    return false;
  };

  // Detect swipes for back navigation
  useSwipeGesture({
    onSwipeRightEdge: handleBack,
    onSwipeLeftEdge: handleBack,
    onSwipeLeftAnywhere: handleCloseSidebar,
    edgeThreshold: 40,
    swipeThreshold: 70, // slightly more sensitive for easier navigation
  });

  return (
    <div className="flex h-[100dvh] overflow-hidden relative"
      style={{ backgroundColor: 'var(--app-bg)', backgroundImage: 'radial-gradient(var(--chat-pattern-color) 1px, transparent 1px)', backgroundSize: '24px 24px' }}>

      {/* Main app shell */}
      <div className="relative z-10 flex w-full h-full md:p-1.5 lg:p-3 p-0 pt-[env(safe-area-inset-top,0)]">
        <div className="relative flex w-full h-full overflow-hidden md:rounded-3xl"
          style={{
            background: 'var(--app-shell-bg)',
            border: '1px solid var(--app-shell-border)',
            boxShadow: '0 30px 80px rgba(0,0,0,0.4), 0 0 0 1px rgba(139,92,246,0.08), inset 0 1px 0 rgba(255,255,255,0.05)',
          }}>

          <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} setView={setView} currentView={view} />

          {/* Main content */}
          <div className="flex-1 flex flex-col h-full w-full relative overflow-hidden"
            style={{ background: 'var(--chat-body-bg)' }}>

            {/* Offline banner */}
            {!isConnected && !isConnecting && (
              <div className="w-full text-xs font-bold flex items-center justify-center gap-2 py-2 flex-shrink-0 z-50"
                style={{ background: 'linear-gradient(90deg, #ef4444, #dc2626)', color: 'white' }}>
                <WifiOff size={13} /> Reconnecting…
              </div>
            )}

            <div className="flex-1 w-full h-full overflow-hidden flex flex-col">
              {view === 'chat'
                ? <ChatWindow isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
                : <ProfileSettings onBack={() => setView('chat')} backHandlerRef={settingsBackRef} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;