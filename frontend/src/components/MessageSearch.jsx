import { useState, useEffect, useCallback } from 'react';
import { Search, X, ChevronUp, ChevronDown } from 'lucide-react';

const MessageSearch = ({ messages, onHighlight, onClose }) => {
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const doSearch = useCallback((q) => {
    if (!q.trim()) { setMatches([]); onHighlight(null); return; }
    const lowerQ = q.toLowerCase();
    const found = messages
      .filter(m => m.text && !m.text.startsWith('http') && m.text.toLowerCase().includes(lowerQ))
      .map(m => m._id);
    setMatches(found);
    setCurrentIndex(0);
    if (found.length > 0) onHighlight(found[0]);
    else onHighlight(null);
  }, [messages, onHighlight]);

  useEffect(() => {
    const timer = setTimeout(() => doSearch(query), 250);
    return () => clearTimeout(timer);
  }, [query, doSearch]);

  const navigate = (dir) => {
    if (!matches.length) return;
    const next = dir === 'up'
      ? (currentIndex - 1 + matches.length) % matches.length
      : (currentIndex + 1) % matches.length;
    setCurrentIndex(next);
    onHighlight(matches[next]);
  };

  const handleClose = () => {
    setQuery('');
    setMatches([]);
    onHighlight(null);
    onClose();
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-[#0f0f12]/95 border-b border-white/5 backdrop-blur-md animate-fade-in">
      <Search size={16} className="text-slate-400 flex-shrink-0" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search messages..."
        autoFocus
        className="flex-1 bg-transparent text-sm text-slate-200 placeholder:text-slate-500 outline-none font-medium"
      />
      {matches.length > 0 && (
        <span className="text-[11px] font-bold text-slate-400 whitespace-nowrap">
          {currentIndex + 1} / {matches.length}
        </span>
      )}
      {query && matches.length === 0 && (
        <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">No results</span>
      )}
      <div className="flex items-center gap-0.5">
        <button onClick={() => navigate('up')} disabled={!matches.length} className="p-1 text-slate-400 hover:text-white disabled:opacity-30 transition rounded">
          <ChevronUp size={16} />
        </button>
        <button onClick={() => navigate('down')} disabled={!matches.length} className="p-1 text-slate-400 hover:text-white disabled:opacity-30 transition rounded">
          <ChevronDown size={16} />
        </button>
      </div>
      <button onClick={handleClose} className="p-1 text-slate-400 hover:text-red-400 transition rounded">
        <X size={16} />
      </button>
    </div>
  );
};

export default MessageSearch;
