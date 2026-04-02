import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Download, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

const ImageLightbox = ({ src, alt, onClose }) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const handleZoomIn = (e) => {
    e.stopPropagation();
    setZoom(prev => Math.min(prev + 0.3, 3));
  };
  
  const handleZoomOut = (e) => {
    e.stopPropagation();
    setZoom(prev => Math.max(prev - 0.3, 0.5));
  };
  
  const handleRotate = (e) => {
    e.stopPropagation();
    setRotation(prev => prev + 90);
  };

  const handleDownload = async (e) => {
    e.stopPropagation();
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = alt || 'image';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      window.open(src, '_blank');
    }
  };

  const content = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      {/* Toolbar */}
      <div
        className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md rounded-2xl px-4 py-2 border border-white/10 z-50 pointer-events-auto"
        onClick={e => e.stopPropagation()}
      >
        <button type="button" onClick={handleZoomIn} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer" title="Zoom In">
          <ZoomIn size={20} />
        </button>
        <button type="button" onClick={handleZoomOut} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer" title="Zoom Out">
          <ZoomOut size={20} />
        </button>
        <button type="button" onClick={handleRotate} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer" title="Rotate">
          <RotateCw size={20} />
        </button>
        <div className="w-px h-6 bg-white/10" />
        <button type="button" onClick={handleDownload} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer" title="Download">
          <Download size={20} />
        </button>
        <div className="w-px h-6 bg-white/10" />
        <button type="button" onClick={(e) => { e.stopPropagation(); onClose(); }} className="p-2 text-white/70 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition cursor-pointer" title="Close">
          <X size={20} />
        </button>
      </div>

      {/* Image */}
      <img
        src={src}
        alt={alt || 'Preview'}
        className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg shadow-2xl select-none"
        style={{
          transform: `scale(${zoom}) rotate(${rotation}deg)`,
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
        onClick={e => e.stopPropagation()}
        draggable={false}
      />

      {/* Zoom indicator */}
      {zoom !== 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-3 py-1 bg-slate-900/80 backdrop-blur-md rounded-full text-xs text-white/60 font-semibold border border-white/10 pointer-events-none">
          {Math.round(zoom * 100)}%
        </div>
      )}
    </div>
  );

  return createPortal(content, document.body);
};

export default ImageLightbox;
