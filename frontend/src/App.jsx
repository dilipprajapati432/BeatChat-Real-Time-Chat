import { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import useChatStore from './stores/chatStore';
import useAuthStore from './stores/authStore';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import SplashScreen from './components/SplashScreen';


import InvitePage from './components/InvitePage';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error }) {
  return <div>Something went wrong: {error.message}</div>;
}

function App() {
  const { user, checkAuth } = useAuthStore();
  const { connectSocket, disconnectSocket } = useChatStore();
  const [showSplash, setShowSplash] = useState(true);
  const [isSplashFading, setIsSplashFading] = useState(false);

  useEffect(() => {
    const initApp = async () => {
      // Start auth check
      await checkAuth();
      
      // Synchronized exactly with the 2.5s heartbeat drawing
      setTimeout(() => {
        setIsSplashFading(true);
        setTimeout(() => setShowSplash(false), 800); // smooth, fast fade out
      }, 2500);
    };
    initApp();
  }, [checkAuth]);

  useEffect(() => {
    if (user) {
      connectSocket();

      // Use getState() for a stable reference — avoids double-registration
      // when zustand reactive addProfileViewer reference changes
      const socket = useChatStore.getState().socket;
      if (socket) {
        const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
        const handler = (data) => {
          const viewer = { ...data.viewer, timestamp: data.timestamp };
          const badgeKey = `pv_badge_${viewer.username}`;
          const lastBadge = parseInt(localStorage.getItem(badgeKey) || '0', 10);
          const isNew = Date.now() - lastBadge >= THIRTY_DAYS;

          // Show toast only for first-time / post-30-day view
          if (isNew) {
            import('react-hot-toast').then(({ default: toast }) => {
              toast(`👁 ${viewer.name} viewed your profile`, {
                duration: 4000,
                style: {
                  background: '#1e1b2e',
                  color: '#e2e8f0',
                  border: '1px solid rgba(139,92,246,0.4)',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: 600,
                },
                icon: null,
              });
            });
          }

          useAuthStore.getState().addProfileViewer(viewer);
        };
        socket.off('profileViewed'); // remove any stale listeners first
        socket.on('profileViewed', handler);

        return () => {
          socket.off('profileViewed', handler);
        };
      }

    } else {
      disconnectSocket();
    }
  }, [user, connectSocket, disconnectSocket]);

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      {showSplash && <SplashScreen isFadingOut={isSplashFading} />}
      <div className="h-[100dvh] w-full bg-gray-100 dark:bg-gray-900">
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
            <Route path="/forgot-password" element={!user ? <Login /> : <Navigate to="/" />} />
            <Route path="/reset-password/:token" element={!user ? <Login /> : <Navigate to="/" />} />

            {/* Invite Route - Accessible to all (Landing page handles logic) */}
            <Route path="/invite/:userId" element={<InvitePage />} />
            <Route path="/" element={user ? <Dashboard /> : <Navigate to="/login" />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" />
      </div>
    </ErrorBoundary>
  );
}

export default App;