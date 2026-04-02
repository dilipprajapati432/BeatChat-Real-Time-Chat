import { useMemo } from 'react';
import { Sparkles } from 'lucide-react';

const SmartReplies = ({ messages, user, onSend, isBlocked, inputText }) => {
  const suggestions = useMemo(() => {
    if (!messages.length || (inputText && inputText.trim().length > 0)) return [];

    // Find last received message (not from current user)
    const lastReceived = [...messages]
      .reverse()
      .find(m => m.senderId !== (user?.id || user?._id));

    if (!lastReceived) return [];

    const text = (lastReceived.text || '').toLowerCase().trim();

    // Don't show suggestions for file/image URLs
    if (text.startsWith('http')) return [];

    // Pattern matching for intelligent suggestions
    // Questions
    if (text.includes('?') || text.startsWith('can ') || text.startsWith('could ') || text.startsWith('would ') || text.startsWith('will ') || text.startsWith('do ') || text.startsWith('are ') || text.startsWith('is ') || text.startsWith('did ')) {
      if (text.includes('how are') || text.includes('how r u') || text.includes("how's it going") || text.includes('whats up') || text.includes("what's up")) {
        return ["I'm good, thanks! 😊", "Doing great! You?", "All good! 👍"];
      }
      if (text.includes('when') || text.includes('what time')) {
        return ["Let me check", "I'll get back to you", "Not sure yet"];
      }
      if (text.includes('where')) {
        return ["I'll share the location", "Let me find out", "Not sure"];
      }
      return ["Yes", "No", "I'll check and let you know"];
    }

    // Greetings
    if (/^(hi|hey|hello|yo|sup|hola|hii+|heyyy*)\b/i.test(text)) {
      return ["Hey! 👋", "Hi there!", "What's up?"];
    }

    // Thanks / Appreciation
    if (/\b(thanks|thank you|thx|ty|appreciate)\b/i.test(text)) {
      return ["You're welcome! 😊", "No problem!", "Anytime 👍"];
    }

    // Apologies
    if (/\b(sorry|apolog|my bad|excuse me)\b/i.test(text)) {
      return ["No worries!", "It's all good 👍", "Don't worry about it"];
    }

    // Plans / Suggestions
    if (/\b(let'?s|shall we|want to|wanna|how about|plan)\b/i.test(text)) {
      return ["Sounds good! 🎉", "I'm in!", "Let me check my schedule"];
    }

    // Agreement / Confirmation
    if (/^(ok|okay|sure|alright|fine|yep|yeah|yup|cool|great|nice|awesome|perfect)\b/i.test(text)) {
      return ["Great! 👍", "Perfect!", "Awesome 🎉"];
    }

    // Goodbyes
    if (/\b(bye|goodbye|good night|gn|see you|see ya|ttyl|later)\b/i.test(text)) {
      return ["Bye! 👋", "See you!", "Take care! 😊"];
    }

    // Love / Affection
    if (/\b(love|miss|❤️|😍|😘|💕)\b/i.test(text)) {
      return ["❤️", "Miss you too! 😊", "💕"];
    }

    // Excitement
    if (/[!]{2,}|🎉|🔥|😍|🥳|omg|wow|amazing/i.test(text)) {
      return ["That's awesome! 🔥", "Right?! 😄", "So exciting! 🎉"];
    }

    // Default for any other message
    return [];
  }, [messages, user, inputText]);

  if (!suggestions.length || isBlocked) return null;

  return (
    <div className="flex items-center gap-2 mb-3 animate-fade-in flex-wrap pointer-events-auto">
      <Sparkles size={14} className="text-primary-400 flex-shrink-0 opacity-70" />
      {suggestions.map((suggestion, i) => (
        <button
          key={i}
          onClick={() => onSend(suggestion)}
          className="px-3.5 py-1.5 text-[13px] font-semibold rounded-full
            bg-white/5 hover:bg-primary-500/15 
            border border-white/10 hover:border-primary-500/40
            text-slate-300 hover:text-primary-300
            transition-all duration-200 hover:scale-[1.03] active:scale-95
            backdrop-blur-sm cursor-pointer whitespace-nowrap"
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
};

export default SmartReplies;
