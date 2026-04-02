import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import useAuthStore from '../stores/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, ChevronDown } from 'lucide-react';

const ReportModal = ({ isOpen, onClose, reportedUserId, reportedMessageId }) => {
    const [reason, setReason] = useState('Spam');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const token = useAuthStore(state => state.token);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const url = reportedMessageId
                ? `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/reports/message/${reportedMessageId}`
                : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/reports/user/${reportedUserId}`;

            const payload = { reason, description };
            if (reportedMessageId && reportedUserId) {
                payload.reportedUserId = reportedUserId;
            }

            const res = await axios.post(url, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(res.data.message);
            onClose();
            setDescription('');
            setReason('Spam');
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to submit report');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 pointer-events-auto">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-xl text-amber-600 dark:text-amber-400">
                                    <AlertTriangle size={20} />
                                </div>
                                <h3 className="text-xl font-heading font-bold text-slate-800 dark:text-white">
                                    Report {reportedMessageId ? 'Message' : 'User'}
                                </h3>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6">
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label className="block mb-2 text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">Reason</label>
                                    <div className="relative">
                                        <select
                                            value={reason}
                                            onChange={(e) => setReason(e.target.value)}
                                            className="w-full px-4 py-3 border rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 outline-none transition appearance-none font-medium"
                                        >
                                            <option value="Spam">Spam</option>
                                            <option value="Harassment">Harassment</option>
                                            <option value="Inappropriate Content">Inappropriate Content</option>
                                            <option value="Other">Other</option>
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block mb-2 text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">Description <span className="text-slate-400 font-normal normal-case">(Optional)</span></label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="w-full px-4 py-3 border rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 outline-none transition resize-none font-medium"
                                        rows="3"
                                        placeholder="Please provide more details..."
                                    />
                                </div>
                                <div className="flex justify-end gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="px-5 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-6 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition shadow-lg shadow-red-500/30 disabled:opacity-50 disabled:shadow-none"
                                    >
                                        {loading ? 'Submitting...' : 'Submit Report'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ReportModal;
