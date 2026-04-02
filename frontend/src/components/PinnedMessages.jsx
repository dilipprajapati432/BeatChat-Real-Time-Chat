import { Pin, ChevronDown, ChevronUp, X } from 'lucide-react';
import { useState } from 'react';

const PinnedMessages = ({ messages, onScrollToMessage }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const pinnedMessages = messages.filter(m => m.isPinned);

  if (!pinnedMessages.length) return null;

  return (
    <div className="flex-shrink-0 border-b border-white/5 bg-[#0f0f12]/90 backdrop-blur-md z-10">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2.5 px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16 py-2.5 text-left hover:bg-white/[0.02] transition-colors"
      >
        <Pin size={14} className="text-amber-400 flex-shrink-0 rotate-45" />
        <span className="text-[13px] font-semibold text-amber-300/90 truncate flex-1">
          {pinnedMessages.length} pinned message{pinnedMessages.length !== 1 ? 's' : ''}
        </span>
        {isExpanded ? (
          <ChevronUp size={14} className="text-slate-400" />
        ) : (
          <ChevronDown size={14} className="text-slate-400" />
        )}
      </button>

      {isExpanded && (
        <div className="px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16 pb-3 space-y-1.5 max-h-[200px] overflow-y-auto custom-scrollbar animate-fade-in">
          {pinnedMessages.map(msg => (
            <button
              key={msg._id}
              onClick={() => {
                if (onScrollToMessage) onScrollToMessage(msg._id);
                setIsExpanded(false);
              }}
              className="w-full flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-white/5 transition-colors text-left group"
            >
              <div className="w-1 h-full min-h-[24px] rounded-full bg-amber-400/50 flex-shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-[12px] text-slate-300 truncate font-medium leading-relaxed">
                  {msg.text?.startsWith('http') ? '📎 Attachment' : msg.text}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5 font-medium">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default PinnedMessages;
