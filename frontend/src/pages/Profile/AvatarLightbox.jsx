import { X } from "lucide-react";
import { useEffect } from "react";
import ReactDOM from "react-dom";

export default function AvatarLightbox({ src, fallback, name, onClose }) {
  useEffect(() => {
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-2xl backdrop-saturate-150" />

      <button
        className="absolute top-4 right-4 z-10 rounded-full bg-white/10 hover:bg-white/20 border cursor-pointer border-white/20 p-2 text-white transition-colors"
        onClick={onClose}
        aria-label="Close"
      >
        <X className="h-5 w-5" />
      </button>

      <div
        className="relative z-10 flex flex-col items-center gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        {src ? (
          <img
            src={src}
            alt={name || 'Profile picture'}
            className="rounded-full w-72 h-72 sm:w-96 sm:h-96 object-cover shadow-2xl ring-4 ring-white/20"
            style={{ animation: 'lightboxPop 0.2s cubic-bezier(0.34,1.56,0.64,1) both' }}
          />
        ) : (
          <div
            className="rounded-full w-72 h-72 sm:w-96 sm:h-96 bg-muted flex items-center justify-center text-8xl font-bold text-muted-foreground shadow-2xl ring-4 ring-white/20"
            style={{ animation: 'lightboxPop 0.2s cubic-bezier(0.34,1.56,0.64,1) both' }}
          >
            {fallback}
          </div>
        )}
        <p className="text-white/80 text-sm font-medium tracking-wide">{name || 'User'}</p>
      </div>

      <style>{`
        @keyframes lightboxPop {
          from { opacity: 0; transform: scale(0.85); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>,
    document.body
  );
}