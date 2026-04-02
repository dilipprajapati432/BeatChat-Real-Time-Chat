import { useState, useEffect, useRef } from 'react';

const MentionDropdown = ({ query, users, groups, currentChat, isGroup, onSelect, inputRef }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const dropdownRef = useRef(null);

  // Get the list of mentionable users
  const mentionableUsers = (() => {
    if (isGroup) {
      const group = groups.find(g => g._id === currentChat);
      return group?.members || [];
    }
    // In a DM, only the other person can be mentioned
    const partner = users.find(u => u._id === currentChat);
    return partner ? [partner] : [];
  })();

  // Filter by query
  const filtered = mentionableUsers.filter(u =>
    u.name?.toLowerCase().includes(query.toLowerCase()) ||
    u.username?.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 6);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!filtered.length) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filtered.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filtered.length) % filtered.length);
      } else if (e.key === 'Enter' && filtered[selectedIndex]) {
        e.preventDefault();
        onSelect(filtered[selectedIndex]);
      } else if (e.key === 'Escape') {
        onSelect(null); // Cancel
      }
    };

    const input = inputRef?.current;
    if (input) {
      input.addEventListener('keydown', handleKeyDown);
      return () => input.removeEventListener('keydown', handleKeyDown);
    }
  }, [filtered, selectedIndex, onSelect, inputRef]);

  if (!filtered.length) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute bottom-full mb-2 left-0 w-full sm:w-72 bg-white dark:bg-[#1a1d27] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-scale-in origin-bottom-left z-50 pointer-events-auto"
    >
      <div className="px-3 py-2 border-b border-white/5">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Mention a user</p>
      </div>
      <div className="max-h-[240px] overflow-y-auto custom-scrollbar">
        {filtered.map((user, i) => (
          <button
            key={user._id}
            onClick={() => onSelect(user)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
              i === selectedIndex
                ? 'bg-primary-500/15 text-white'
                : 'hover:bg-white/5 text-slate-300'
            }`}
          >
            <img
              src={user.avatar || `https://ui-avatars.com/api/?name=${user.name || 'User'}&background=random`}
              alt={user.name}
              className="w-8 h-8 rounded-full object-cover ring-1 ring-white/10"
              onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${user.name || 'User'}&background=random`; }}
            />
            <div className="min-w-0">
              <p className="text-[13px] font-semibold truncate">{user.name}</p>
              {user.username && (
                <p className="text-[11px] text-slate-500 font-medium truncate">@{user.username}</p>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MentionDropdown;
