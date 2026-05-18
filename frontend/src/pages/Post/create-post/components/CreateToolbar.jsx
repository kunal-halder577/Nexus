import React from 'react';
import { Image as ImageIcon, Video, Smile, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { MAX_CHARS } from '../mediaUtils.js';

export default function CreateToolbar({
  content,
  attachmentCount,
  onPickImage,
  onPickVideo,
  onPickGif,
}) {
  const charsLeft   = MAX_CHARS - content.length;
  const isNearLimit = charsLeft <= 50;
  const isAtLimit   = charsLeft <= 0;

  return (
    <footer
      className="flex-none w-full max-w-3xl mx-auto px-3 sm:px-6 pb-6 pt-3 relative z-10 bg-background/80 backdrop-blur-md border-t border-white/10"
      role="toolbar"
      aria-label="Attachment tools"
    >
      <div className="flex items-center justify-between pt-2">
        {/* Left: attachment buttons */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Attach image"
            onClick={onPickImage}
            className="text-muted-foreground hover:text-indigo-500 hover:bg-indigo-500/10 rounded-xl transition-all cursor-pointer"
          >
            <ImageIcon className="w-5 h-5" aria-hidden="true" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            aria-label="Attach video"
            onClick={onPickVideo}
            className="text-muted-foreground hover:text-indigo-500 hover:bg-indigo-500/10 rounded-xl transition-all cursor-pointer"
          >
            <Video className="w-5 h-5" aria-hidden="true" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            aria-label="Attach GIF"
            onClick={onPickGif}
            className="text-muted-foreground hover:text-indigo-500 hover:bg-indigo-500/10 rounded-xl transition-all cursor-pointer"
          >
            <span className="text-[11px] font-black tracking-tight leading-none" aria-hidden="true">
              GIF
            </span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            aria-label="Insert emoji"
            className="text-muted-foreground hover:text-indigo-500 hover:bg-indigo-500/10 rounded-xl transition-all cursor-pointer"
          >
            <Smile className="w-5 h-5" aria-hidden="true" />
          </Button>
        </div>

        {/* Right: counts + more */}
        <div className="flex items-center gap-4">
          {attachmentCount > 0 && (
            <span
              aria-label={`${attachmentCount} file${attachmentCount > 1 ? 's' : ''} attached`}
              className="text-xs font-medium text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full"
            >
              {attachmentCount} attached
            </span>
          )}

          <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className={`w-[4.5rem] text-right text-sm font-medium tabular-nums transition-colors ${
              isAtLimit
                ? 'text-destructive'
                : isNearLimit
                ? 'text-amber-500'
                : 'text-muted-foreground'
            }`}
          >
            <span
              aria-label={`${content.length} of ${MAX_CHARS} characters used`}
              className={`transition-opacity duration-150 ${content.length > 0 ? 'opacity-100' : 'opacity-0'}`}
            >
              {content.length}{' '}
              <span className="opacity-80 hidden sm:inline" aria-hidden="true">/ {MAX_CHARS}</span>
            </span>
          </div>

          <div className="w-px h-5 bg-border/40" aria-hidden="true" />

          <Button
            variant="ghost"
            size="icon"
            aria-label="More options"
            className="text-muted-foreground hover:text-foreground rounded-xl transition-colors cursor-pointer"
          >
            <MoreHorizontal className="w-5 h-5" aria-hidden="true" />
          </Button>
        </div>
      </div>

      <p
        className={`text-xs text-muted-foreground/80 text-right mt-1 select-none transition-opacity duration-150 hidden sm:block ${
          content.trim() ? 'opacity-100' : 'opacity-0'
        }`}
        aria-hidden="true"
      >
        ctrl or ⌘↩ to publish
      </p>
    </footer>
  );
}
