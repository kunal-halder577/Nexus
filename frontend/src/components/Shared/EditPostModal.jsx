import { useState, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Check, AlertCircle, Info } from 'lucide-react';
import DOMPurify from 'dompurify';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '@/features/auth/authSlice';
import { cn } from '@/lib/utils';
import NexusEditor from '../Editor';

const MAX_CHARS = 500;

const getPlainTextLength = (html) => {
  if (!html) return 0;
  const stripped = DOMPurify.sanitize(html, { ALLOWED_TAGS: [] });
  const el = document.createElement('div');
  el.innerHTML = stripped;
  return (el.textContent ?? '').length;
};

const CharRing = ({ value, max }) => {
  const pct   = Math.min(value / max, 1);
  const r     = 11;
  const circ  = 2 * Math.PI * r;
  const dash  = pct * circ;
  const near  = value > max * 0.85;
  const over  = value >= max;
  const color = over ? '#f43f5e' : near ? '#f59e0b' : '#6366f1';

  return (
    <span className="relative inline-flex items-center justify-center shrink-0">
      <svg
        width="32" height="32"
        viewBox="0 0 32 32"
        aria-hidden="true"
        focusable="false"
      >
        <circle cx="16" cy="16" r={r} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="2.5" />
        <circle
          cx="16" cy="16" r={r}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 16 16)"
          style={{ transition: 'stroke-dasharray .2s ease, stroke .2s ease' }}
        />
        {near && (
          <text
            x="16" y="16"
            textAnchor="middle"
            dominantBaseline="central"
            fill={color}
            fontSize="7.5"
            fontWeight="700"
            fontFamily="monospace"
          >
            {max - value}
          </text>
        )}
      </svg>
      <span className="sr-only">{value} of {max} characters used</span>
    </span>
  );
};

const EditPostModal = ({ post, open, onClose, onSubmit, isLoading }) => {
  const currentUser = useSelector(selectCurrentUser);

  const initialCaption = post?.content?.caption ?? '';
  const [caption, setCaption] = useState(initialCaption);

  useEffect(() => {
    if (open) setCaption(initialCaption);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, post?._id]);

  const charCount      = getPlainTextLength(caption);
  const captionChanged = caption !== initialCaption;
  const isDirty        = captionChanged;
  const isInvalid      = charCount === 0 || charCount > MAX_CHARS;

  const handleSubmit = useCallback(() => {
    if (!isDirty || isInvalid || isLoading) return;
    onSubmit({ caption });
  }, [isDirty, isInvalid, isLoading, caption, onSubmit]);

  const handleKeyDown = useCallback((e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!isDirty || isInvalid || isLoading) return;
      onSubmit({ caption });
    }
  }, [isDirty, isInvalid, isLoading, caption, onSubmit]);

  const authorInitial = (currentUser?.name?.[0] ?? post?.author?.name?.[0] ?? '?').toUpperCase();
  const authorName    = currentUser?.name      ?? post?.author?.name      ?? 'You';
  const authorAvatar  = currentUser?.avatarUrl ?? post?.author?.avatarUrl;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && !isLoading && onClose()}>
      <DialogContent
        className={cn(
          'p-0 gap-0 overflow-hidden rounded-2xl border border-border/50',
          'bg-card shadow-2xl shadow-black/40',
          'w-[calc(100vw-2rem)] max-w-[520px]',
          '[&>button:last-child]:hidden'
        )}
        onKeyDown={handleKeyDown}
        onPointerDownOutside={(e) => isLoading && e.preventDefault()}
      >
        {/* ── Header ── */}
        <DialogHeader className="flex-row items-center gap-3 px-5 pt-4 pb-4 border-b border-border/30">
          <Avatar className="w-11 h-11 shrink-0 border border-border/60">
            <AvatarImage src={authorAvatar} alt={authorName} />
            <AvatarFallback className="bg-muted text-sm font-bold">
              {authorInitial}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-[15px] font-semibold text-foreground leading-tight">
              {authorName}
            </span>
            <span className="text-[12px] text-muted-foreground leading-tight">
              Editing post
            </span>
          </div>
          <DialogTitle className="sr-only">Edit post</DialogTitle>
        </DialogHeader>

        {/* ── Editor — px-5 + overflow-hidden keeps it flush with the rest of the layout ── */}
        <div className="px-5 pt-4 overflow-hidden">
          {/* grid + minmax(0,1fr) is the reliable fix for ProseMirror horizontal expansion */}
          <div
            style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', scrollbarGutter: 'stable' }}
            className={cn(
              'w-full rounded-xl border transition-all duration-200',
              'border-border/40 bg-background',
              'focus-within:border-indigo-500/60 focus-within:ring-4 focus-within:ring-indigo-500/10',
              isLoading && 'opacity-60 pointer-events-none cursor-not-allowed bg-muted/40',
              'min-h-[120px] max-h-[260px] overflow-y-auto overflow-x-hidden',
              '[&_.ProseMirror]:!max-w-full [&_.ProseMirror]:!w-full',
              '[&_.ProseMirror]:break-words [&_.ProseMirror]:overflow-wrap-anywhere',
              
              // ── Custom scrollbar ──────────────────────────────────────────
              '[&::-webkit-scrollbar]:w-1.5',
              '[&::-webkit-scrollbar-track]:bg-transparent',
              '[&::-webkit-scrollbar-thumb]:rounded-full',
              '[&::-webkit-scrollbar-thumb]:[background:rgba(99,102,241,0.3)]',
              'hover:[&::-webkit-scrollbar-thumb]:[background:rgba(99,102,241,0.6)]',
              '[&::-webkit-scrollbar-thumb:hover]:bg-indigo-500/50',
            )}
          >
            <NexusEditor
              content={caption}
              setContent={setCaption}
              maxChars={MAX_CHARS}
              compact={true}
            />
          </div>
        </div>

        {/* ── Validation ── */}
        <div
          className="px-5 h-6 flex items-center mt-2"
          aria-live="polite"
          aria-atomic="true"
        >
          {charCount > MAX_CHARS && (
            <div className="flex items-center gap-1.5 text-rose-400 text-[12px]">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>{charCount - MAX_CHARS} characters over the limit</span>
            </div>
          )}
          {charCount === 0 && (
            <div className="flex items-center gap-1.5 text-muted-foreground text-[12px]">
              <Info className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Caption can't be empty</span>
            </div>
          )}
        </div>

        <div className="h-px bg-border/30 mx-5" />

        {/* ── Footer ── */}
        <div className="flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-2">
            <CharRing value={charCount} max={MAX_CHARS} />
            <span
              aria-hidden="true"
              className={cn(
                'text-[13px] font-mono tabular-nums text-muted-foreground/50 transition-colors',
                charCount > MAX_CHARS * 0.85 && 'text-amber-400/80',
                charCount > MAX_CHARS        && 'text-rose-400'
              )}
            >
              {charCount}/{MAX_CHARS}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={isLoading}
              className="rounded-full h-8 px-4 text-[13px] text-muted-foreground hover:text-foreground"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSubmit}
              disabled={!isDirty || isInvalid || isLoading}
              title="Save (Ctrl+Enter / ⌘+Enter)"
              className={cn(
                'rounded-full h-8 px-4 text-[13px] font-semibold transition-all duration-200',
                'bg-indigo-600 hover:bg-indigo-500 text-white',
                'disabled:opacity-40 disabled:cursor-not-allowed',
                isDirty && !isInvalid && !isLoading && 'shadow-md shadow-indigo-500/20'
              )}
            >
              {isLoading ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving…
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  Save
                </span>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditPostModal;