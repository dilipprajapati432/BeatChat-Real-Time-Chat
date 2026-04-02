import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Github, Mail, Globe, Code2, Heart, Share2 } from 'lucide-react';
import mypicture from '../assets/mypicture.jpg';
import toast from 'react-hot-toast';

const AboutDeveloperModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center px-4 sm:px-0">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md bg-white dark:bg-[#1a1d27] rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-white/10"
        >
          {/* Header Graphic */}
          <div className="h-32 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 relative overflow-hidden">
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-24 h-24 rounded-3xl bg-white dark:bg-[#1a1d27] p-1.5 shadow-xl rotate-3 transition-transform hover:rotate-6">
              <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 rounded-2xl overflow-hidden flex items-center justify-center rotate-[-3deg] transition-transform hover:rotate-[-6deg]">
                <img src="./" alt="Dilip Prajapati" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>

          <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-black/20 text-white hover:bg-black/40 transition-colors backdrop-blur-sm">
            <X size={18} />
          </button>

          <div className="px-8 pt-12 pb-8 text-center">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent mb-1">
              Dilip Prajapati
            </h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-6 tracking-wide">
              FULL STACK DEVELOPER
            </p>

            <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-5 mb-8 text-sm text-slate-600 dark:text-slate-300 leading-relaxed border border-slate-100 dark:border-white/5">
              BeatChat is a premium, real-time messaging application engineered with modern web technologies including React, Node.js, Socket.io, and MongoDB.
            </div>

            <div className="flex justify-center gap-4">
              <a href="https://github.com/dilipprajapati432" target="_blank" rel="noopener noreferrer" title="Github Profile"
                className="w-12 h-12 rounded-full flex items-center justify-center bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 transition-all hover:-translate-y-1 hover:shadow-lg hover:text-indigo-500 dark:hover:text-indigo-400">
                <Github size={22} />
              </a>
              <a href="mailto:dilipkohar4320@gmail.com" title="Email Me"
                className="w-12 h-12 rounded-full flex items-center justify-center bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 transition-all hover:-translate-y-1 hover:shadow-lg hover:text-rose-500 dark:hover:text-rose-400">
                <Mail size={22} />
              </a>
              <a href="https://dilipkoharportfolio.netlify.app/" target="_blank" rel="noopener noreferrer" title="View Portfolio"
                className="w-12 h-12 rounded-full flex items-center justify-center bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 transition-all hover:-translate-y-1 hover:shadow-lg hover:text-emerald-500 dark:hover:text-emerald-400">
                <Globe size={22} />
              </a>
            </div>

            <button 
              onClick={() => {
                  const shareData = {
                      title: 'BeatChat',
                      text: 'Check out BeatChat, a premium real-time messaging PWA!',
                      url: window.location.origin
                  };
                  if (navigator.share) {
                      navigator.share(shareData).catch(err => console.log("Share cancelled"));
                  } else {
                      navigator.clipboard.writeText(window.location.origin);
                      toast.success('App link copied to clipboard!');
                  }
              }}
              className="mt-6 w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 hover:from-indigo-500 hover:to-purple-500 text-indigo-500 dark:text-indigo-400 hover:text-white dark:hover:text-white border border-indigo-500/20 font-bold flex items-center justify-center gap-2 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
            >
                <Share2 size={18} />
                Share BeatChat
            </button>

            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/5 flex flex-col items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium tracking-wide">
              <div className="flex items-center gap-1.5">
                Designed & Built with <Heart size={12} className="text-rose-500 fill-rose-500 animate-pulse mx-0.5" /> by Dilip Prajapati
              </div>
              <p className="opacity-75">&copy; {new Date().getFullYear()} All Rights Reserved.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AboutDeveloperModal;
