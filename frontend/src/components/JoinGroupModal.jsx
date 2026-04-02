import { useState, useRef } from 'react';
import useChatStore from '../stores/chatStore';
import toast from 'react-hot-toast';
import { X, ChevronRight, Plus, Hash } from 'lucide-react';
import ClipLoader from 'react-spinners/ClipLoader';

const JoinGroupModal = ({ onClose }) => {
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const { joinGroupByCode } = useChatStore();
    const inputRefs = useRef([]);

    const handleChange = (index, value) => {
        if (!/^[0-9]?$/.test(value)) return;

        const newCode = [...code];
        newCode[index] = value;
        setCode(newCode);

        // Move to next input if value entered
        if (value && index < 5) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1].focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').slice(0, 6).replace(/[^0-9]/g, '');
        const newCode = [...code];
        pastedData.split('').forEach((char, i) => {
            if (i < 6) newCode[i] = char;
        });
        setCode(newCode);

        // Focus last filled or next empty
        const nextIndex = pastedData.length < 6 ? pastedData.length : 5;
        inputRefs.current[nextIndex].focus();
    };

    const handleSubmit = async (e) => {
        e?.preventDefault();
        const fullCode = code.join('');
        if (fullCode.length !== 6) return toast.error('Please enter a 6-digit code');

        setLoading(true);
        try {
            const result = await joinGroupByCode(fullCode);
            if (result.pending) {
                toast.success(result.message);
            } else {
                toast.success('Successfully joined the group!');
            }
            onClose();
        } catch (err) {
            toast.error(err.message || 'Failed to join group');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in">
            <div className="w-full max-w-md bg-white dark:bg-[#12151e] rounded-[32px] shadow-2xl overflow-hidden animate-scale-in border border-slate-200 dark:border-white/5">

                {/* Header Section */}
                <div className="relative p-8 text-center overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-btn-primary"></div>
                    <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-all">
                        <X size={20} />
                    </button>

                    <div className="w-16 h-16 bg-btn-primary rounded-3xl flex items-center justify-center text-white mx-auto mb-6 shadow-xl shadow-primary-500/30 rotate-3 transform hover:rotate-0 transition-transform duration-500">
                        <Hash size={32} strokeWidth={2.5} />
                    </div>

                    <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2 tracking-tight">Join a Group</h2>
                    <p className="text-slate-400 text-sm max-w-[240px] mx-auto leading-relaxed">
                        Enter the secret 6-digit code to participate in the conversation.
                    </p>
                </div>

                {/* Form Section */}
                <div className="px-8 pb-10">
                    <form onSubmit={handleSubmit}>
                        <div className="flex justify-between gap-2.5 mb-8">
                            {code.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={el => inputRefs.current[index] = el}
                                    type="text"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    onPaste={index === 0 ? handlePaste : undefined}
                                    className="w-12 h-16 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-slate-800 rounded-2xl text-2xl font-black text-center text-slate-800 dark:text-white focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-700 shadow-inner"
                                    placeholder="•"
                                    required
                                    autoFocus={index === 0}
                                />
                            ))}
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-800/20 rounded-2xl p-4 border border-slate-200 dark:border-white/5 mb-8">
                            <ul className="space-y-2">
                                <li className="flex gap-2.5 text-[11px] text-slate-400">
                                    <div className="w-1.5 h-1.5 rounded-full bg-violet-500 mt-1 shrink-0"></div>
                                    <span>Public groups: Join instantly with code</span>
                                </li>
                                <li className="flex gap-2.5 text-[11px] text-slate-400">
                                    <div className="w-1.5 h-1.5 rounded-full bg-fuchsia-500 mt-1 shrink-0"></div>
                                    <span>Private groups: Admin approval required</span>
                                </li>
                            </ul>
                        </div>

                        <div className="flex flex-col gap-3">
                            <button
                                type="submit"
                                disabled={loading || code.some(d => !d)}
                                className="w-full py-4 rounded-2xl font-bold font-heading text-white shadow-lg shadow-primary-500/20 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95 flex items-center justify-center gap-2 group relative overflow-hidden bg-btn-primary"
                            >
                                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
                                {loading ? (
                                    <ClipLoader size={20} color="#fff" />
                                ) : (
                                    <>
                                        <span>Join Conversation</span>
                                        <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="w-full py-3.5 rounded-2xl font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all outline-none text-sm"
                            >
                                Not now, thanks
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default JoinGroupModal;
