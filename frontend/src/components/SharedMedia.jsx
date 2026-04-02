import { useState } from 'react';
import SecureImageViewer from './SecureImageViewer';
import { X, Image as ImageIcon, FileText, Download, ExternalLink } from 'lucide-react';

const SharedMedia = ({ messages, onClose }) => {
    const [activeTab, setActiveTab] = useState('media'); // 'media' or 'docs'
    const [viewerSrc, setViewerSrc] = useState(null);

    // Filter logic
    const mediaMessages = messages.filter(m => {
        if (!m.text) return false;
        // Basic check for image extensions
        return m.text.match(/\.(jpeg|jpg|gif|png|webp)(\?.*)?$/i);
    });

    const docMessages = messages.filter(m => {
        if (!m.text) return false;
        // Check for docs, excluding images
        const isUrl = m.text.startsWith('http');
        const isImage = m.text.match(/\.(jpeg|jpg|gif|png|webp)(\?.*)?$/i);
        return isUrl && !isImage;
    });

    const handleDownload = async (e, url, filename) => {
        e.preventDefault();
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename || 'download';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            window.open(url, '_blank');
        }
    };

    return (
        <div className="fixed inset-y-0 right-0 w-80 sm:w-96 bg-white dark:bg-slate-900 shadow-2xl z-40 border-l border-slate-200 dark:border-slate-800 flex flex-col transform transition-transform duration-300 animate-slide-in-right pointer-events-auto">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-sm">
                <h3 className="font-heading font-bold text-slate-800 dark:text-white text-lg">Shared Content</h3>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500 dark:text-slate-400"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-100 dark:border-slate-800 px-4 pt-2 gap-4">
                <button
                    onClick={() => setActiveTab('media')}
                    className={`flex-1 pb-3 text-sm font-bold transition-all border-b-2 ${activeTab === 'media' ? 'text-primary-600 border-primary-600 dark:text-primary-400 dark:border-primary-400' : 'text-slate-500 border-transparent hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                    Media <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">{mediaMessages.length}</span>
                </button>
                <button
                    onClick={() => setActiveTab('docs')}
                    className={`flex-1 pb-3 text-sm font-bold transition-all border-b-2 ${activeTab === 'docs' ? 'text-primary-600 border-primary-600 dark:text-primary-400 dark:border-primary-400' : 'text-slate-500 border-transparent hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                    Docs <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">{docMessages.length}</span>
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950/30 p-2 custom-scrollbar">
                {activeTab === 'media' && (
                    <div className="grid grid-cols-3 gap-1.5">
                        {mediaMessages.map((msg, i) => (
                            <div key={i} className="aspect-square relative group cursor-pointer overflow-hidden rounded-xl bg-slate-200 dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50">
                                <img
                                    src={msg.text}
                                    alt="shared"
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    onClick={() => setViewerSrc(msg.text)}
                                    loading="lazy"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
                            </div>
                        ))}
                        {mediaMessages.length === 0 && (
                            <div className="col-span-3 flex flex-col items-center justify-center py-20 text-slate-400">
                                <ImageIcon size={40} className="mb-3 opacity-20" />
                                <p className="text-sm font-medium">No photos shared yet</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'docs' && (
                    <div className="space-y-2 p-2">
                        {docMessages.map((msg, i) => {
                            const filename = decodeURIComponent(msg.text.split('/').pop().split('?')[0]);
                            return (
                                <div key={i} className="flex items-center p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-primary-200 dark:hover:border-primary-900 shadow-sm transition-all group">
                                    <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mr-3 text-blue-500 dark:text-blue-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                                        <FileText size={20} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate" title={filename}>{filename}</p>
                                        <p className="text-xs text-slate-400 font-medium">{new Date(msg.timestamp).toLocaleDateString()}</p>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => handleDownload(e, msg.text, filename)}
                                            className="p-2 text-slate-400 hover:text-primary-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                            title="Download"
                                        >
                                            <Download size={18} />
                                        </button>
                                        <a
                                            href={msg.text}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                            title="Open Original"
                                        >
                                            <ExternalLink size={18} />
                                        </a>
                                    </div>
                                </div>
                            );
                        })}
                        {docMessages.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                                <FileText size={40} className="mb-3 opacity-20" />
                                <p className="text-sm font-medium">No documents shared yet</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {viewerSrc && (
                <SecureImageViewer
                    src={viewerSrc}
                    alt="Shared Media"
                    onClose={() => setViewerSrc(null)}
                />
            )}
        </div>
    );
};

export default SharedMedia;
