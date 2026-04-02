import { X, Download, ExternalLink } from 'lucide-react';

const PdfPreview = ({ url, filename, onClose }) => {
  const handleDownload = async () => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename || 'document.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, '_blank');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#1a1d27] rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-red-500/15 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/>
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white truncate">{filename || 'Document'}</p>
              <p className="text-[11px] text-slate-400 font-medium">PDF Preview</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={() => window.open(url, '_blank')}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition"
              title="Open in new tab"
            >
              <ExternalLink size={18} />
            </button>
            <button
              onClick={handleDownload}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition"
              title="Download"
            >
              <Download size={18} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* PDF Embed */}
        <div className="flex-1 min-h-0 bg-slate-900">
          <iframe
            src={`${url}#toolbar=1&navpanes=0`}
            title={filename || 'PDF Preview'}
            className="w-full h-full min-h-[500px]"
            style={{ border: 'none' }}
            onError={() => window.open(url, '_blank')}
          />
        </div>
      </div>
    </div>
  );
};

export default PdfPreview;
