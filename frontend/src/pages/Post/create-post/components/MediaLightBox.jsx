import React, { useState, useEffect, useRef } from 'react';
import { X, Download, ChevronLeft, ChevronRight, Video } from 'lucide-react';
import { isImage, isGif, isVideo, formatSize } from '../mediaUtils';

export default function MediaLightbox({ items, startIndex, onClose }) {
  const [index, setIndex] = useState(startIndex);
  const videoRef = useRef(null);
  const current  = items[index];

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape')     onClose();
      if (e.key === 'ArrowRight') setIndex((i) => (i + 1) % items.length);
      if (e.key === 'ArrowLeft')  setIndex((i) => (i - 1 + items.length) % items.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [items.length, onClose]);

  useEffect(() => {
    // Calculate scrollbar width so the page doesn't "jump" when it disappears
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => { 
      document.body.style.overflow = ''; 
      document.body.style.paddingRight = '';
    };
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [index]);

  const hasMultiple = items.length > 1;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Media viewer — ${current.name}`}
      className="fixed inset-0 z-[100] flex flex-col bg-black/90 backdrop-blur-xl"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Top bar */}
      <div className="flex-none flex items-center justify-between px-5 py-4 bg-gradient-to-b from-black/60 to-transparent">
        <div className="flex items-center gap-3 min-w-0">
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{current.name}</p>
            <p className="text-xs text-white/40">
              {formatSize(current.size)}
              {hasMultiple && ` · ${index + 1} of ${items.length}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <a
            href={current.url}
            download={current.name}
            aria-label={`Download ${current.name}`}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Download className="w-4 h-4" aria-hidden="true" />
          </a>
          <button
            onClick={onClose}
            aria-label="Close media viewer"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Media */}
      <div className="flex-1 flex items-center justify-center relative min-h-0 px-16">
        {(isImage(current.type) || isGif(current.type)) && (
          <img
            src={current.url}
            alt={current.name}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl select-none"
            draggable={false}
          />
        )}
        {isVideo(current.type) && (
          <video
            ref={videoRef}
            src={current.url}
            controls
            autoPlay
            className="max-w-full max-h-full rounded-lg shadow-2xl outline-none"
            aria-label={current.name}
          />
        )}

        {hasMultiple && (
          <>
            <button
              onClick={() => setIndex((i) => (i - 1 + items.length) % items.length)}
              aria-label="Previous media"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" aria-hidden="true" />
            </button>
            <button
              onClick={() => setIndex((i) => (i + 1) % items.length)}
              aria-label="Next media"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            >
              <ChevronRight className="w-5 h-5" aria-hidden="true" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnail strip */}
      {hasMultiple && (
        <div
          className="flex-none flex items-center justify-center gap-2 py-4 px-6 bg-gradient-to-t from-black/60 to-transparent overflow-x-auto"
          role="tablist"
          aria-label="All attachments"
        >
          {items.map((att, i) => (
            <button
              key={att.id}
              role="tab"
              aria-selected={i === index}
              aria-label={att.name}
              onClick={() => setIndex(i)}
              className={`w-12 h-12 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                i === index
                  ? 'border-indigo-400 opacity-100 scale-105'
                  : 'border-transparent opacity-50 hover:opacity-75'
              }`}
            >
              {isVideo(att.type) ? (
                <div className="w-full h-full bg-white/10 flex items-center justify-center">
                  <Video className="w-4 h-4 text-white/60" aria-hidden="true" />
                </div>
              ) : (
                <img src={att.url} alt="" aria-hidden="true" className="w-full h-full object-cover" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
