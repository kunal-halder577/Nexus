import React from 'react';
import { X, ZoomIn, Video } from 'lucide-react';
import { isImage, isGif, isVideo } from '../mediaUtils';

export default function AttachmentGrid({ attachments, onRemove, onOpen }) {
  if (!attachments.length) return null;

  return (
    <div
      className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3"
      role="list"
      aria-label="Attached files"
    >
      {attachments.map((att) => {
        const img = isImage(att.type);
        const gif = isGif(att.type);
        const vid = isVideo(att.type);

        return (
          <div
            key={att.id}
            role="listitem"
            className="relative group rounded-xl overflow-hidden bg-muted/20 border border-border/20"
          >
            {/* Image / GIF tile */}
            {(img || gif) && (
              <button
                className="w-full aspect-square block focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-xl overflow-hidden"
                aria-label={`${gif ? 'View GIF' : 'View image'}: ${att.name}`}
                onClick={() => onOpen(att)}
              >
                <img
                  src={att.url}
                  alt={att.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                  {gif ? (
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 text-white text-xs font-bold px-2 py-0.5 rounded-md tracking-widest drop-shadow">
                      GIF
                    </span>
                  ) : (
                    <ZoomIn
                      className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg"
                      aria-hidden="true"
                    />
                  )}
                </div>
              </button>
            )}

            {/* Video tile */}
            {vid && (
              <button
                className="w-full aspect-square block focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-xl overflow-hidden relative"
                aria-label={`Play video: ${att.name}`}
                onClick={() => onOpen(att)}
              >
                <video src={att.url} className="w-full h-full object-cover" muted />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-white/20 group-hover:bg-white/30 backdrop-blur-sm flex items-center justify-center transition-all group-hover:scale-110">
                    <Video className="w-5 h-5 text-white" aria-hidden="true" />
                  </div>
                </div>
              </button>
            )}

            {/* Remove button */}
            <button
              onClick={(e) => { e.stopPropagation(); onRemove(att.id); }}
              aria-label={`Remove ${att.name}`}
              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity z-10"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
