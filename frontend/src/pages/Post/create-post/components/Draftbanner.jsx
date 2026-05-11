import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';

export default function DraftBanner({ draft, onRestore, onDiscard }) {
  if (!draft) return null;

  const ageLabel = draft.age < 1 ? 'just now' : `${draft.age}m ago`;

  return (
    <div role="alert" className="relative z-50 mx-auto mt-3 max-w-2xl w-full px-6">
      <div className="flex items-center justify-between bg-indigo-950/80 border border-indigo-500/30 backdrop-blur-xl rounded-xl px-4 py-3 shadow-lg">
        <p className="text-sm text-indigo-200">
          <span className="font-semibold">Unsaved draft</span>{' '}
          <span className="text-indigo-400">from {ageLabel}</span>
        </p>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={onRestore}
            className="text-indigo-300 hover:text-white hover:bg-indigo-500/20 h-8 text-xs cursor-pointer"
          >
            Restore
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onDiscard}
            aria-label="Discard draft"
            className="text-muted-foreground hover:text-white hover:bg-muted/30 h-8 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
