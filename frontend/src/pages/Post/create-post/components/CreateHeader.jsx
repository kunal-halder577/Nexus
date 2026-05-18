import React from 'react';
import { ArrowLeft, Globe, Lock, Sparkles, Save, CheckCircle2, Loader2, History, X } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { useNavigate } from 'react-router-dom';

export default function CreateHeader({
  saveState,
  onPublish,
  canPublish,
  isLoading,
  draftBanner,
  onRestoreDraft,
  onDiscardDraft,
}) {
  const saveIndicator = {
    saving: {
      icon:  <Save className="w-3.5 h-3.5 animate-pulse" />,
      label: 'Saving…',
      color: 'text-muted-foreground',
    },
    saved: {
      icon:  <CheckCircle2 className="w-3.5 h-3.5" />,
      label: 'Draft saved',
      color: 'text-emerald-500',
    },
    idle: null,
  }[saveState];

  const navigate = useNavigate();

  return (
    <>
      <header className="flex-none z-40 bg-background/80 backdrop-blur-md border-b border-white/10 px-2 sm:px-6 py-3 sm:py-4 flex items-center justify-between">

        {/* ── Left: back + "Drafting" + save indicator ── */}
        <div className="flex items-center gap-1 sm:gap-4 shrink-0 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Go back"
            onClick={() => navigate(-1)}
            className="rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/40 -ml-2 cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" aria-hidden="true" />
          </Button>

          <div className="flex items-center gap-2">
            <span className="text-base font-semibold text-muted-foreground tracking-widest uppercase hidden sm:inline">
              Drafting
            </span>

            {/* Fixed-size container — only opacity changes, never dimensions */}
            <div className="w-24 h-5 flex items-center">
              <span
                role="status"
                aria-live="polite"
                className={`flex items-center gap-1 text-xs font-medium transition-opacity duration-300 ${
                  saveIndicator ? 'opacity-100' : 'opacity-0'
                } ${saveIndicator?.color ?? 'text-muted-foreground'}`}
              >
                {saveIndicator?.icon}
                {saveIndicator?.label}
              </span>
            </div>
          </div>
        </div>

        {/* ── Right: publish ── */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">

          <Button
            onClick={onPublish}
            disabled={!canPublish}
            title="Publish (⌘↩)"
            aria-keyshortcuts="Control+Enter Meta+Enter"
            className="rounded-full px-3 sm:px-4 py-1.5 h-auto gap-1.5 sm:gap-2 bg-indigo-500 hover:bg-indigo-600 text-white disabled:opacity-100 disabled:bg-indigo-500/40 disabled:text-white/70 font-medium cursor-pointer transition-all duration-200"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {isLoading ? 'Publishing…' : 'Publish'}
          </Button>
        </div>
      </header>

      {/*
        Draft banner — fixed to the bottom of the screen, centered.
        `fixed` takes it fully out of document flow so it can never
        push or shift any other element regardless of content size.
        Fades + slides up when present.
      */}
      {draftBanner && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50
                     flex items-center gap-3 px-4 py-3 w-[calc(100%-2rem)] max-w-sm
                     rounded-2xl text-sm font-medium
                     bg-background/95 backdrop-blur-md border border-border/40 shadow-2xl
                     animate-in fade-in slide-in-from-bottom-2 duration-300"
        >
          <History className="w-4 h-4 text-indigo-400 shrink-0" aria-hidden="true" />
          <p className="flex-1 text-muted-foreground text-sm">
            Draft from{' '}
            <span className="text-foreground font-semibold whitespace-nowrap">
              {draftBanner.ageText || (draftBanner.age === 0 ? 'just now' : `${draftBanner.age}m ago`)}
            </span>
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRestoreDraft}
            className="h-8 px-3 text-sm font-semibold text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-lg cursor-pointer shrink-0"
          >
            Restore
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDiscardDraft}
            aria-label="Discard draft"
            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded-lg cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}
    </>
  );
}