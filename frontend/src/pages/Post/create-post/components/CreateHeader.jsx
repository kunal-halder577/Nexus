import React from 'react';
import { ArrowLeft, Globe, Lock, Sparkles, Save, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';

export default function CreateHeader({
  saveState,
  visibility,
  onVisibilityChange,
  onPublish,
  canPublish,
  isLoading,
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
    <header className="flex-none z-40 bg-background/60 backdrop-blur-2xl border-b border-border/20 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
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
          <span className="text-base font-semibold text-muted-foreground tracking-widest uppercase">
            Drafting
          </span>
          {saveIndicator && (
            <span
              role="status"
              aria-live="polite"
              className={`flex items-center gap-1 text-xs font-medium transition-all duration-300 ${saveIndicator.color}`}
            >
              {saveIndicator.icon}
              {saveIndicator.label}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Select value={visibility} onValueChange={onVisibilityChange}>
          <SelectTrigger
            aria-label="Post visibility"
            className="w-[150px] h-10 border-none bg-transparent hover:bg-muted/30 focus:ring-0 focus:ring-offset-0 shadow-none transition-colors text-muted-foreground cursor-pointer hover:text-foreground justify-start gap-2"
          >
            {visibility === 'public' ? (
              <Globe className="w-4 h-4 shrink-0 text-indigo-400" aria-hidden="true" />
            ) : (
              <Lock className="w-4 h-4 shrink-0 text-indigo-400" aria-hidden="true" />
            )}
            <span className="truncate">
              <SelectValue placeholder="Visibility" />
            </span>
          </SelectTrigger>
          <SelectContent
            position="popper"
            sideOffset={8}
            className="border-border/20 backdrop-blur-xl bg-background/95 rounded-xl shadow-2xl min-w-[150px]"
          >
            <SelectItem value="public"  className="cursor-pointer py-2.5">Public</SelectItem>
            <SelectItem value="private" className="cursor-pointer py-2.5">Connections</SelectItem>
          </SelectContent>
        </Select>

        <Button
          onClick={onPublish}
          disabled={!canPublish}
          title="Publish (⌘↩)"
          aria-keyshortcuts="Control+Enter Meta+Enter"
          className="rounded-full px-6 gap-2 bg-indigo-500 hover:bg-indigo-600 text-white disabled:opacity-100 disabled:bg-indigo-500/40 disabled:text-white/70 font-medium cursor-pointer transition-all duration-200"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {isLoading ? 'Publishing…' : 'Publish'}
        </Button>
      </div>
    </header>
  );
}
