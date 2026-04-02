/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/*.{js,jsx}",
    "./src/components/**/*.{js,jsx}",
    "./src/hooks/**/*.{js,jsx}",
    "./src/stores/**/*.{js,jsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Outfit', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        // ─── Midnight Slate Neutrals ───
        space: {
          950: '#0f1117',
          900: '#13172a',
          850: '#1a1d27',
          800: '#1e2235',
          700: '#252a42',
          600: '#2d3455',
          500: '#3a4275',
          400: '#4f578f',
        },
        // ─── Indigo (Primary Brand) ───
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        // ─── Teal (Secondary Accent) ───
        cyan: {
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
        },
        // ─── Fuchsia / Magenta (Highlight) ───
        accent: {
          300: '#f0abfc',
          400: '#e879f9',
          500: '#d946ef',
          600: '#c026d3',
        },
        // ─── Rose Gold / Warm Amber (CTA Gold) ───
        gold: {
          300: '#fde68a',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
        // ─── Status colors ───
        success: { 400: '#34d399', 500: '#10b981' },
        danger: { 400: '#f87171', 500: '#ef4444' },
        warning: { 400: '#fbbf24', 500: '#f59e0b' },
      },

      backgroundImage: {
        // Midnight Slate gradients
        'cosmic': 'linear-gradient(135deg, #0f1117 0%, #13172a 40%, #131e2e 100%)',
        'violet-glow': 'radial-gradient(ellipse at 60% 0%, rgba(99,102,241,0.22) 0%, transparent 70%)',
        'cyan-glow': 'radial-gradient(ellipse at 10% 100%, rgba(45,212,191,0.16) 0%, transparent 60%)',
        'card-glass': 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
        'shimmer-light': 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.10) 50%, transparent 100%)',
        'btn-primary': 'linear-gradient(135deg, #5B6CFF 0%, #22C1C3 100%)',
        'btn-gold': 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)',
        'btn-cyan': 'linear-gradient(135deg, #5eead4 0%, #2dd4bf 50%, #14b8a6 100%)',
        'sidebar-bg': 'linear-gradient(180deg, rgba(22,25,41,0.97) 0%, rgba(17,20,32,0.99) 100%)',
        'msg-sent': 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
      },

      boxShadow: {
        'violet': '0 0 22px rgba(99,102,241,0.28), 0 0 44px rgba(99,102,241,0.12)',
        'violet-sm': '0 0 12px rgba(99,102,241,0.25)',
        'cyan': '0 0 22px rgba(45,212,191,0.24), 0 0 44px rgba(45,212,191,0.10)',
        'cyan-sm': '0 0 12px rgba(45,212,191,0.20)',
        'gold': '0 0 22px rgba(251,191,36,0.30)',
        'gold-sm': '0 0 10px rgba(251,191,36,0.25)',
        'glass': '0 8px 32px rgba(0,0,0,0.38), inset 0 1px 0 rgba(255,255,255,0.07)',
        'glass-lg': '0 20px 60px rgba(0,0,0,0.50), inset 0 1px 0 rgba(255,255,255,0.08)',
        'inner-glow': 'inset 0 0 20px rgba(99,102,241,0.08)',
        'card': '0 4px 24px rgba(0,0,0,0.32)',
        'premium': '0 25px 50px rgba(0,0,0,0.42), 0 0 0 1px rgba(99,102,241,0.14)',
      },

      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16,1,0.3,1)',
        'scale-in': 'scaleIn 0.25s cubic-bezier(0.34,1.56,0.64,1)',
        'blob': 'blob 9s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
        'float': 'float 4s ease-in-out infinite',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
        'spin-slow': 'spin 8s linear infinite',
        'aurora': 'aurora 12s ease-in-out infinite',
        'border-glow': 'borderGlow 3s ease-in-out infinite',
      },

      keyframes: {
        fadeIn: { '0%': { opacity: '0', transform: 'translateY(4px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(20px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        scaleIn: { '0%': { opacity: '0', transform: 'scale(0.88)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        blob: {
          '0%, 100%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(40px, -60px) scale(1.12)' },
          '66%': { transform: 'translate(-30px, 30px) scale(0.9)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 16px rgba(99,102,241,0.32), 0 0 32px rgba(99,102,241,0.16)' },
          '50%': { boxShadow: '0 0 32px rgba(99,102,241,0.52), 0 0 64px rgba(99,102,241,0.24)' },
        },
        aurora: {
          '0%': { transform: 'rotate(0deg) scale(1)' },
          '50%': { transform: 'rotate(180deg) scale(1.15)' },
          '100%': { transform: 'rotate(360deg) scale(1)' },
        },
        borderGlow: {
          '0%, 100%': { borderColor: 'rgba(139,92,246,0.4)' },
          '50%': { borderColor: 'rgba(6,182,212,0.6)' },
        },
      },
    },
  },
  plugins: [],
};