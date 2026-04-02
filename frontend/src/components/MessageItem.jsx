import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Trash2, Pencil, Check, CheckCheck, FileText, Download, Pin, AlertCircle, Reply, Star, CheckSquare, Copy } from 'lucide-react';
import useChatStore from '../stores/chatStore';
import useSettingsStore from '../stores/settingsStore';
import ImageLightbox from './ImageLightbox';
import PdfPreview from './PdfPreview';


// Render text with @mentions highlighted
const renderMessageText = (text) => {
    const parts = text.split(/(@\w+)/g);
    return parts.map((part, i) => {
        if (part.startsWith('@')) {
            return (
                <span key={i} className="text-primary-400 font-bold cursor-pointer hover:text-primary-300 transition-colors">
                    {part}
                </span>
            );
        }
        return part;
    });
};

const MessageItem = ({
    msg,
    index,
    messages,
    user,
    users,
    currentChat,
    isGroup,
    groups,
    startEditing,
    handleDeleteClick,
    handleReportMessage,
    handlePinMessage,
    editingMessageId,
    activeActionId,
    setActiveActionId,
    setReplyingTo,
    selectionMode,
    setSelectionMode,
    selectedIds,
    toggleSelectMessage,
    starredIds,
    handleStar
}) => {
    const getSenderIdStr = (sId) => sId?._id ? String(sId._id) : String(sId);
    const currentSenderId = getSenderIdStr(msg.senderId);
    const myId = String(user?._id || user?.id);
    
    const isMe = currentSenderId === myId;
    const [lightboxSrc, setLightboxSrc] = useState(null);
    const [pdfPreview, setPdfPreview] = useState(null);
    const [isHolding, setIsHolding] = useState(false);
    const [hubStyle, setHubStyle] = useState({});
    const timerRef = useRef(null);
    const bubbleRef = useRef(null);
    
    // Derived state for visibility - Use string comparison for stability
    const showActions = activeActionId && String(activeActionId) === String(msg._id);

    // Calculate position for the portal-rendered hub
    useEffect(() => {
        if (showActions && bubbleRef.current) {
            const rect = bubbleRef.current.getBoundingClientRect();
            const viewportH = window.innerHeight;
            const headerH = 80;   // approximate header height
            const inputH = 120;   // approximate input area height
            const spaceBelow = viewportH - rect.bottom - inputH;
            const spaceAbove = rect.top - headerH;
            const hubHeight = 320; // approximate hub height

            const style = {
                position: 'fixed',
                zIndex: 9999,
            };

            if (spaceBelow >= hubHeight) {
                // Enough space below — show below the bubble
                style.top = `${rect.bottom + 8}px`;
            } else if (spaceAbove >= hubHeight) {
                // Not enough below, enough above — flip above
                style.bottom = `${viewportH - rect.top + 8}px`;
            } else {
                // Neither has enough space — center in the available area
                style.top = `${Math.max(headerH + 8, Math.min(rect.top, viewportH - inputH - hubHeight))}px`;
            }

            if (isMe) {
                style.right = `${window.innerWidth - rect.right}px`;
            } else {
                style.left = `${rect.left}px`;
            }

            setHubStyle(style);
        }
    }, [showActions, isMe]);

    const prevSenderId = index > 0 ? getSenderIdStr(messages[index - 1]?.senderId) : null;
    const nextSenderId = index < messages.length - 1 ? getSenderIdStr(messages[index + 1]?.senderId) : null;

    const showAvatar = index === 0 || prevSenderId !== currentSenderId;
    const prevIsSame = index > 0 && prevSenderId === currentSenderId;
    const nextIsSame = index < messages.length - 1 && nextSenderId === currentSenderId;

    const sender = !isMe
        ? (msg.senderId?._id ? msg.senderId : 
            (isGroup
                ? groups.find(g => String(g._id) === String(currentChat))?.members?.find(m => String(m._id) === currentSenderId)
                : users.find(u => String(u._id) === currentSenderId)
            )
        ) || {}
        : user;

    const canEdit = () => Date.now() - new Date(msg.timestamp).getTime() < 10 * 60 * 1000;

    const sentRadius = `${prevIsSame ? '20px' : '24px'} 6px ${nextIsSame ? '20px' : '24px'} 24px`;
    const recvRadius = `6px ${prevIsSame ? '20px' : '24px'} 24px ${nextIsSame ? '20px' : '24px'}`;

    const handleReact = (emoji) => {
        const socket = useChatStore.getState().socket;
        if (socket) {
            socket.emit('reactMessage', { messageId: msg._id, emoji });
        }
    };

    const handlePressStart = () => {
        if (window.matchMedia('(hover: none)').matches) {
            setIsHolding(true);
            timerRef.current = setTimeout(() => {
                setActiveActionId(msg._id);
                setIsHolding(false);
                if (window.navigator.vibrate) window.navigator.vibrate(50);
            }, 500);
        }
    };

    const handleContextMenu = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setActiveActionId(msg._id);
        if (window.navigator.vibrate) window.navigator.vibrate(50);
    };

    const handlePressEnd = () => {
        setIsHolding(false);
        if (timerRef.current) clearTimeout(timerRef.current);
    };

    const handleCopy = () => {
        if (!msg.text) return;
        navigator.clipboard.writeText(msg.text);
        if (window.navigator.vibrate) window.navigator.vibrate(20);
        setActiveActionId(null);
    };

    const groupedReactions = msg.reactions?.reduce((acc, r) => {
        acc[r.emoji] = r.users;
        return acc;
    }, {}) || {};

    const msgTime = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const isImage = msg.text.startsWith('http') && msg.text.match(/\.(jpeg|jpg|gif|png|webp)(\?.*)?$/i);
    const isPdf = msg.text.startsWith('http') && msg.text.match(/\.pdf(\?.*)?$/i);
    const isFile = msg.text.startsWith('http') && !isImage;
    const filename = isFile ? decodeURIComponent(msg.text.split('/').pop().split('?')[0]) : '';
    const fileExt = filename.split('.').pop().toUpperCase();

    // The action hub content - rendered via portal
    const actionHubContent = showActions ? createPortal(
        <div 
            onMouseDown={(e) => e.stopPropagation()}
            className="flex flex-col items-center gap-2 animate-scale-in"
            style={hubStyle}
        >
            {/* Reactions Layer */}
            <div className="glass-premium rounded-full px-2 py-1 flex items-center shadow-2xl ring-1 ring-white/10">
                {['👍', '❤️', '😂', '😮', '😢', '🙏'].map((emoji, i) => {
                    const userIds = groupedReactions[emoji] || [];
                    const didIReact = userIds.includes(myId);
                    return (
                        <button
                            key={emoji}
                            onClick={(e) => { e.stopPropagation(); handleReact(emoji); setActiveActionId(null); }}
                            className={`hover:scale-135 active:scale-90 transition-all duration-300 text-[22px] leading-none px-2 rounded-xl cursor-pointer flex items-center justify-center min-w-[40px] h-[40px] animate-[ripple-pop_0.5s_cubic-bezier(0.34,1.56,0.64,1)_forwards] ${
                                didIReact ? 'reaction-active' : 'hover:bg-white/10'
                            }`}
                            style={{ animationDelay: `${i * 0.05}s`, opacity: 0 }}
                        >
                            {emoji}
                        </button>
                    );
                })}
            </div>

            {/* Action Menu Layer */}
            <div className="glass-premium rounded-[22px] py-1.5 shadow-2xl ring-1 ring-white/10 action-menu-vertical">
                <div className="flex flex-col w-full py-1.5">
                    <div onClick={(e) => { e.stopPropagation(); setReplyingTo(msg); setActiveActionId(null); }} className="action-menu-item">
                        <Reply size={18} className="text-primary-400" />
                        <span>Reply</span>
                    </div>

                    <div onClick={(e) => { e.stopPropagation(); handleCopy(); }} className="action-menu-item">
                        <Copy size={17} className="text-emerald-400" />
                        <span>Copy</span>
                    </div>
                    
                    {isMe && canEdit() && (
                        <div onClick={(e) => { e.stopPropagation(); startEditing(msg._id, msg.text); setActiveActionId(null); }} className="action-menu-item">
                            <Pencil size={17} className="text-indigo-400" />
                            <span>Edit</span>
                        </div>
                    )}

                    <div onClick={(e) => { e.stopPropagation(); handlePinMessage(msg._id); setActiveActionId(null); }} className="action-menu-item">
                        <Pin size={17} className="text-emerald-400" />
                        <span>{msg.isPinned ? 'Unpin' : 'Pin'}</span>
                    </div>

                    <div onClick={(e) => { e.stopPropagation(); handleStar(msg._id); setActiveActionId(null); }} className="action-menu-item">
                        <Star size={17} className={starredIds.has(msg._id) ? "text-yellow-400 fill-yellow-400" : "text-amber-400"} />
                        <span>{starredIds.has(msg._id) ? 'Unstar' : 'Star'}</span>
                    </div>

                    <div onClick={(e) => { e.stopPropagation(); setSelectionMode(true); toggleSelectMessage(msg._id); setActiveActionId(null); }} className="action-menu-item">
                        <CheckSquare size={17} className="text-sky-400" />
                        <span>Select</span>
                    </div>

                    <div className="h-px bg-white/5 mx-3 my-1" />

                    {isMe ? (
                        <div onClick={(e) => { e.stopPropagation(); handleDeleteClick(msg); setActiveActionId(null); }} className="action-menu-item text-rose-400 hover:text-rose-300">
                            <Trash2 size={17} />
                            <span>Delete</span>
                        </div>
                    ) : (
                        <div onClick={(e) => { e.stopPropagation(); handleReportMessage(msg._id); setActiveActionId(null); }} className="action-menu-item text-rose-400 hover:text-rose-300">
                            <AlertCircle size={17} />
                            <span>Report</span>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    ) : null;

    return (
        <>
            <div
                id={`msg-${msg._id}`}
                onClick={() => selectionMode && toggleSelectMessage(msg._id)}
                className={`flex items-center w-full ${isMe ? 'justify-end' : 'justify-start'} group message-row-hover ${prevIsSame ? 'mt-0.5' : 'mt-4'} transition-all duration-300 ${selectionMode ? 'cursor-pointer' : ''} ${selectionMode && selectedIds.has(msg._id) ? 'selection-active' : ''}`}
            >
                {/* Checkbox before message for received messages */}
                {selectionMode && !isMe && (
                    <div className="flex-shrink-0 ml-1 mr-2 animate-scale-in">
                        <div className={`w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center transition-all duration-300 ${selectedIds.has(msg._id) ? 'bg-gradient-to-br from-primary-400 to-primary-600 border-primary-400 shadow-[0_0_12px_rgba(99,102,241,0.4)] scale-105' : 'border-white/15 bg-white/5 hover:border-white/30'}`}>
                            {selectedIds.has(msg._id) && <Check size={13} className="text-white drop-shadow-sm" strokeWidth={3} />}
                        </div>
                    </div>
                )}
                
                <div className={`flex items-end max-w-[85%] md:max-w-[75%] lg:max-w-[65%] w-full ${isMe ? 'justify-end' : 'justify-start'}`}>

                    {!isMe && (
                        <div className="w-10 flex-shrink-0 flex justify-start mr-1">
                            {showAvatar ? (
                                <div className="w-8 h-8 rounded-xl flex-shrink-0 overflow-hidden self-end mb-1 shadow-lg ring-1 ring-slate-200 dark:ring-white/10 bg-slate-100 dark:bg-[#16161e]">
                                    <img
                                        src={sender.avatar ? (sender.avatar.startsWith('http') ? sender.avatar : `${import.meta.env.VITE_API_URL}${sender.avatar}`) : `https://ui-avatars.com/api/?name=${encodeURIComponent(sender.name || 'User')}&background=random`}
                                        alt="avatar"
                                        onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(sender.name || 'User')}&background=random`; }}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            ) : (
                                <div className="w-8" />
                            )}
                        </div>
                    )}

                    <div 
                        ref={bubbleRef}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-full min-w-0 relative group`}
                        onMouseDown={handlePressStart}
                        onMouseUp={handlePressEnd}
                        onMouseLeave={handlePressEnd}
                        onTouchStart={handlePressStart}
                        onTouchEnd={handlePressEnd}
                        onTouchMove={handlePressEnd}
                        onContextMenu={handleContextMenu}
                    >
                        <div
                            className={`relative transition-all duration-500 transform ${isMe
                                ? 'msg-sent text-white shadow-xl shadow-primary-900/10'
                                : 'bg-gradient-to-br from-[#1a1b24] to-[#14151d] backdrop-blur-xl text-slate-200 border border-white/5 shadow-xl shadow-black/10 hover:border-white/10'
                                } animate-slideUp ${isHolding || showActions ? 'animate-bubble-press' : 'scale-100'}`}
                            style={{
                                padding: isImage ? '4px' : '10px 14px',
                                minWidth: '60px',
                                borderRadius: isMe ? sentRadius : recvRadius,
                            }}
                        >
                            {/* Pin indicator */}
                            {msg.isPinned && (
                                <div className="flex items-center gap-1.5 mb-1.5 px-1 pt-1">
                                    <Pin size={10} className="text-amber-400 rotate-45 fill-amber-400/20" />
                                    <span className="text-[9px] font-black text-amber-400/80 uppercase tracking-[0.1em]">Pinned Message</span>
                                </div>
                            )}

                            {isGroup && !isMe && showAvatar && (
                                <p className="text-[11px] font-black tracking-wider mb-1 px-1 opacity-90 gradient-text-aurora inline-block uppercase">{sender.name}</p>
                            )}

                            <div className="flex flex-col min-w-0">
                                {isImage ? (
                                    <div className="rounded-[18px] overflow-hidden mb-1 ring-1 ring-white/10 shadow-2xl relative group/img">
                                        <img
                                            src={msg.text}
                                            alt="shared"
                                            className="w-full max-h-[400px] object-cover transform hover:scale-[1.02] transition-transform duration-700 cursor-zoom-in brightness-95 hover:brightness-100"
                                            onClick={() => setLightboxSrc(msg.text)}
                                        />
                                        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity" />
                                    </div>
                                ) : isPdf ? (
                                    <button
                                        onClick={() => setPdfPreview({ url: msg.text, filename })}
                                        className={`relative flex items-center gap-4 p-3 rounded-2xl mb-1 ${isMe ? 'bg-white/10 hover:bg-white/15' : 'bg-white/5 hover:bg-white/10'} transition-all duration-300 w-full max-w-[280px] border border-white/5 group/file overflow-hidden`}
                                    >
                                        <div className="w-12 h-12 rounded-xl flex-shrink-0 bg-rose-500/20 flex items-center justify-center border border-rose-500/20 group-hover/file:scale-110 transition-transform">
                                            <FileText className="w-6 h-6 text-rose-400" />
                                        </div>
                                        <div className="flex-1 min-w-0 text-left">
                                            <p className="text-[10px] font-black text-rose-400/80 uppercase tracking-widest leading-none mb-1">PDF</p>
                                            <p className="text-[13px] truncate font-bold text-white leading-tight" title={filename}>{filename}</p>
                                        </div>
                                    </button>
                                ) : isFile ? (
                                    <div className={`relative flex items-center gap-4 p-3 rounded-2xl mb-1 ${isMe ? 'bg-white/10 hover:bg-white/15' : 'bg-white/5 hover:bg-white/10'} transition-all duration-300 w-full max-w-[280px] border border-white/5 group/file overflow-hidden`}>
                                        <div className="w-12 h-12 rounded-xl flex-shrink-0 bg-primary-500/20 flex items-center justify-center border border-primary-500/20 group-hover/file:scale-110 transition-transform">
                                            <FileText className="w-6 h-6 text-primary-400" />
                                        </div>
                                        <div className="flex-1 min-w-0 text-left">
                                            <p className="text-[10px] font-black text-primary-400/80 uppercase tracking-widest leading-none mb-1">{fileExt}</p>
                                            <p className="text-[13px] truncate font-bold text-white leading-tight" title={filename}>{filename}</p>
                                        </div>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); window.open(msg.text, '_blank'); }}
                                            className="p-2.5 rounded-xl bg-white/5 hover:bg-primary-500 text-slate-400 hover:text-white transition-all shadow-lg ring-1 ring-white/5"
                                        >
                                            <Download size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="px-1 py-0.5">
                                        <div className="text-[14.5px] leading-relaxed whitespace-pre-wrap break-all font-medium text-left tracking-normal transition-all duration-300">
                                            {renderMessageText(msg.text)}
                                            {msg.isEdited && <span className={`text-[9px] font-black uppercase tracking-widest ml-2 ${isMe ? 'text-white/40' : 'text-slate-500/60'}`}>(edited)</span>}
                                        </div>
                                    </div>
                                )}

                                {/* Message Footer (Time & Status) */}
                                <div className={`flex items-center gap-2 mt-1 px-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    <div className="flex items-center gap-1.5">
                                        {starredIds.has(msg._id) && <Star size={9} className="text-yellow-400 fill-yellow-400" />}
                                        <span className={`text-[9.5px] font-black tracking-[0.05em] uppercase transition-opacity duration-300 ${isMe ? 'text-white/40' : 'text-slate-500'}`}>
                                            {msgTime}
                                        </span>
                                    </div>
                                    {isMe && (
                                        <div className="flex items-center">
                                            {msg.status === 'sending' ? (
                                                <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                            ) : msg.status === 'failed' ? (
                                                <div className="flex items-center gap-1.5 text-rose-500 group/retry">
                                                    <AlertCircle size={12} className="animate-pulse" />
                                                </div>
                                            ) : (
                                                <div className={`transition-all duration-500 overflow-hidden flex items-center ${msg.status === 'seen' || msg.read ? 'text-cyan-400' : 'text-slate-400/50'}`}>
                                                    {msg.status === 'sent' ? (
                                                        <Check size={13} strokeWidth={3} />
                                                    ) : (
                                                        <CheckCheck size={13} strokeWidth={3} />
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Reactions Display */}
                            {Object.keys(groupedReactions).length > 0 && (
                                <div className={`absolute -bottom-3 ${isMe ? 'right-0' : 'left-0'} flex flex-wrap gap-1 z-20 px-1`}>
                                    {Object.entries(groupedReactions).map(([emoji, userIds]) => {
                                        const didIReact = userIds.includes(myId);
                                        return (
                                            <button
                                                key={emoji}
                                                onClick={() => handleReact(emoji)}
                                                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-black transition-all border backdrop-blur-2xl ${didIReact
                                                    ? 'bg-primary-600/40 border-primary-500/50 text-white shadow-lg shadow-primary-500/20'
                                                    : 'bg-white/90 dark:bg-[#1a1d27]/90 border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#252836]'
                                                    }`}
                                            >
                                                <span className="text-sm scale-90">{emoji}</span>
                                                {userIds.length > 1 && <span className="text-[10px] opacity-70 tracking-tighter">{userIds.length}</span>}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Checkbox after message for sent messages */}
                {selectionMode && isMe && (
                    <div className="flex-shrink-0 ml-2 mr-1 animate-scale-in">
                        <div className={`w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center transition-all duration-300 ${selectedIds.has(msg._id) ? 'bg-gradient-to-br from-primary-400 to-primary-600 border-primary-400 shadow-[0_0_12px_rgba(99,102,241,0.4)] scale-105' : 'border-white/15 bg-white/5 hover:border-white/30'}`}>
                            {selectedIds.has(msg._id) && <Check size={13} className="text-white drop-shadow-sm" strokeWidth={3} />}
                        </div>
                    </div>
                )}
            </div>

            {/* Action Hub - rendered via portal to always appear above input */}
            {actionHubContent}

            {lightboxSrc && <ImageLightbox src={lightboxSrc} alt="Shared image" onClose={() => setLightboxSrc(null)} />}
            {pdfPreview && <PdfPreview url={pdfPreview.url} filename={pdfPreview.filename} onClose={() => setPdfPreview(null)} />}
        </>
    );
};

export default MessageItem;
