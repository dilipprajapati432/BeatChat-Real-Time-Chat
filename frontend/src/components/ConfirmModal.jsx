import { motion, AnimatePresence } from 'framer-motion';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', isDanger = false }) => {
    // Ensure isOpen is handled by parent, but we can double check or just rely on AnimatePresence if parent conditionally renders it.
    // The previous code had `if (!isOpen) return null;` which is fine, but AnimatePresence wraps it usually in parent or here.
    // Let's assume parent controls rendering or we wrap content.
    // Actually, usually AnimatePresence wraps the component call in parent, OR the component returns AnimatePresence wrapping a conditioned div.
    // The previous code: `if (!isOpen) return null;` then `return (<AnimatePresence>...)` is slightly wrong if AnimatePresence is inside.
    // Correct pattern: Component takes isOpen, and returns AnimatePresence > {isOpen && ...} or Parent has AnimatePresence > {isOpen && <Modal />}
    // I will stick to the internal AnimatePresence pattern for safety if parent doesn't have it.

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
                    >
                        <div className="p-8 text-center">
                            <h3 className={`text-xl font-heading font-bold mb-3 ${isDanger ? 'text-red-500' : 'text-slate-800 dark:text-white'}`}>
                                {title}
                            </h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                                {message}
                            </p>
                        </div>

                        <div className="flex border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                            <button
                                onClick={onClose}
                                className="flex-1 px-4 py-4 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <div className="w-px bg-slate-200 dark:bg-slate-700"></div>
                            <button
                                onClick={onConfirm}
                                className={`flex-1 px-4 py-4 text-sm font-bold transition-colors ${isDanger
                                    ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                                    : 'text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20'
                                    }`}
                            >
                                {confirmText}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ConfirmModal;
