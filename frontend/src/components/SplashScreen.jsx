import React from 'react';
import logo from '../assets/beatchatlogo.png';

const PATH_STRING = "M0 20 L40 20 L45 10 L50 30 L55 20 L80 20 L85 5 L90 35 L95 20 L130 20 L135 15 L140 25 L145 20 L200 20";

const SplashScreen = ({ isFadingOut }) => {
  return (
    <div className={`fixed inset-0 z-[9999] flex items-center justify-center splash-gradient transition-opacity duration-700 ease-out ${isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      <div className="relative flex flex-col items-center">
        {/* Animated Rings */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-48 h-48 rounded-full border-2 border-primary-500/20 animate-logo-pulse" />
          <div className="absolute w-64 h-64 rounded-full border border-indigo-500/10 animate-logo-pulse [animation-delay:1s]" />
        </div>

        {/* Logo with Zoom and Pulse */}
        <div className="relative z-10 animate-slow-zoom">
          <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[40px] border border-white/10 shadow-2xl animate-logo-pulse">
            <img 
              src={logo} 
              alt="BeatChat" 
              className="h-24 w-auto object-contain drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]" 
            />
          </div>
        </div>

        {/* Branding (Tagline only) */}
        <div className="mt-8 text-center relative z-10">
          <div className="flex items-center gap-2 justify-center">
            <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-primary-500/50" />
            <p className="text-xs uppercase tracking-[0.3em] font-bold text-slate-400" style={{ color: '#94a3b8' }}>
              Connect. Chat. Beat.
            </p>
            <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-primary-500/50" />
          </div>
        </div>

        {/* Persistent Drawing Heartbeat with Bright Spark Head */}
        <div className="mt-16 w-[300px] h-16 relative flex items-center justify-center">
          <svg 
            viewBox="0 0 200 40" 
            className="w-full h-full animate-heartbeat-glow"
            preserveAspectRatio="none"
          >
            {/* Background static line (Faint) */}
            <path 
              d={PATH_STRING}
              stroke="rgba(255,255,255,0.03)" 
              strokeWidth="0.5" 
              fill="none" 
            />

            {/* Main Persistent Heartbeat Path */}
            <path
              d={PATH_STRING}
              stroke="url(#heartbeat-gradient)"
              strokeWidth="3.5"
              fill="none"
              strokeDasharray="350"
              strokeLinecap="round"
              className="animate-heartbeat-draw-persistent"
            />

            <defs>
              <linearGradient id="heartbeat-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#4f46e5" />
                <stop offset="50%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#2dd4bf" />
              </linearGradient>
            </defs>
          </svg>

        </div>
      </div>

      {/* Decorative Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-900/20 rounded-full blur-[120px] -z-10 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-900/20 rounded-full blur-[120px] -z-10 animate-pulse [animation-delay:2s]" />
    </div>
  );
};

export default SplashScreen;
