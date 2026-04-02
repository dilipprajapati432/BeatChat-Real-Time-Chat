import { useEffect } from 'react';
import { X, ShieldCheck } from 'lucide-react';

const SecureImageViewer = ({ src, alt, onClose }) => {

    // Prevent right click
    const handleContextMenu = (e) => {
        e.preventDefault();
        return false;
    };

    // Close on escape
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md animate-fade-in"
            onClick={onClose}
            onContextMenu={handleContextMenu}
        >
            <div className="absolute top-4 right-4 z-[110]">
                <button
                    onClick={onClose}
                    className="text-white/70 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all"
                >
                    <X size={24} />
                </button>
            </div>

            {/* Container for the image */}
            <div
                className="relative max-w-full max-h-full p-4 flex items-center justify-center select-none"
                onClick={(e) => e.stopPropagation()} // Click on image doesn't close
            >
                {/* The Image - Pointer events none to prevent drag/interaction directly */}
                <img
                    src={src}
                    alt={alt}
                    className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl pointer-events-none select-none"
                    draggable="false"
                    onContextMenu={handleContextMenu}
                />

                {/* Transparent Overlay - Catches all clicks/drags to protect image */}
                <div
                    className="absolute inset-0 z-10"
                    onContextMenu={handleContextMenu}
                ></div>

                {/* Warning Text */}
                <div className="absolute bottom-[-50px] left-0 right-0 flex justify-center pointer-events-none">
                    <span className="text-white/60 text-xs bg-black/50 px-4 py-1.5 rounded-full flex items-center gap-2 backdrop-blur-sm border border-white/5">
                        <ShieldCheck size={12} className="text-emerald-400" />
                        Secure View • Screenshots disabled
                    </span>
                </div>
            </div>
        </div>
    );
};

export default SecureImageViewer;
