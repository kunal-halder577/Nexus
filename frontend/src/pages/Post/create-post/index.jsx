import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner'; // <-- 1. Import Sonner

import Editor from '@/components/Editor';

import { useDraft }        from './useDraft';
import { isAllowed, revokeAll, DRAFT_KEY } from './mediaUtils';
import MediaLightbox       from './components/MediaLightBox';
import AttachmentGrid      from './components/AttachmentGrid';
import CreateHeader        from './components/CreateHeader';
import CreateToolbar       from './components/CreateToolbar';
import DraftBanner         from './components/Draftbanner';
import { useCreatePostMutation } from '@/features/post/api/postApi';
import { useNavigate } from 'react-router-dom';

export default function NexusFullPageCreate() {
  const [content,       setContent]       = useState('');
  const [visibility,    setVisibility]    = useState('public');
  const [isDragging,    setIsDragging]    = useState(false);
  const [attachments,   setAttachments]   = useState([]);
  const [draftBanner,   setDraftBanner]   = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  
  // <-- Removed the 'rejected' state completely

  const dropZoneRef       = useRef(null);
  const imageInputRef     = useRef(null);
  const videoInputRef     = useRef(null);
  const gifInputRef       = useRef(null);
  const idempotencyKeyRef = useRef(crypto.randomUUID());

  const navigate = useNavigate();
  const [createPost, { isLoading }] = useCreatePostMutation();
  // ── 7-Character Bug Fix: Strip HTML tags to get pure text length ──
  const plainText = content.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').trim();

  // Keep a ref so the unmount cleanup always sees the latest list
  const attachmentsRef = useRef(attachments);
  useEffect(() => { attachmentsRef.current = attachments; }, [attachments]);
  useEffect(() => () => revokeAll(attachmentsRef.current), []);

  const saveState = useDraft(content, visibility);

  // ── Restore draft on mount ──────────────────────────────────────
  useEffect(() => {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    try {
      const draft = JSON.parse(raw);
      if (draft.content?.trim()) {
        const age = Math.round((Date.now() - draft.savedAt) / 60000);
        setDraftBanner({ ...draft, age });
      }
    } catch {}
  }, []);

  const restoreDraft = () => {
    setContent(draftBanner.content);
    setVisibility(draftBanner.visibility || 'public');
    setDraftBanner(null);
  };
  
  const discardDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setDraftBanner(null);
  };

  // ── Keyboard shortcut: ⌘↩ / Ctrl↩ to publish ──────────────────
  useEffect(() => {
    const handler = (e) => {
      // Use plainText to prevent publishing empty <p></p> blocks
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && plainText && !isLoading) handlePublish();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [plainText]);

  const handlePublish = async () => {
    const htmlContent = content;
    const currentAttachments = attachmentsRef.current;

    const formData = new FormData();
    formData.append('caption', htmlContent);
    formData.append('visibility', visibility);
    formData.append('idempotentKey', idempotencyKeyRef.current);
    currentAttachments.forEach((att) => formData.append('media', att.file));

    try {
        const post = await createPost(formData).unwrap();
        idempotencyKeyRef.current = crypto.randomUUID();

        console.log(post);
        
        // ✅ Clean up only after success
        revokeAll(currentAttachments);
        setAttachments([]);
        setContent('');
        localStorage.removeItem(DRAFT_KEY);

        toast.success('Post Published!', { description: 'Your post is now live on Nexus.' });
        navigate('/');
    } catch (error) {
        // ✅ State is untouched — user can retry without losing their work
        toast.error('Post creation failed', {
        description: error?.data?.message || error.message || 'Something went wrong.',
        });
    }
  };

  // ── File processing ─────────────────────────────────────────────
  const processFiles = useCallback((files) => {
    if (!files.length) return;
    const allowed = files.filter(isAllowed);
    const blocked = files.filter((f) => !isAllowed(f));

    if (blocked.length) {
      // <-- 3. Sonner Error Toast
      const blockedNames = blocked.map(f => f.name).join(', ');
      toast.error("Unsupported file type", {
        description: `${blockedNames} was removed. Only images, GIFs, and videos are allowed.`,
      });
    }
    
    if (!allowed.length) return;

    const next = allowed.map((f) => ({
      id:   crypto.randomUUID(),
      name: f.name,
      type: f.type,
      size: f.size,
      url:  URL.createObjectURL(f),
      file: f,
    }));
    setAttachments((prev) => [...prev, ...next]);
  }, []);

  const onPickChange = (e) => {
    processFiles(Array.from(e.target.files || []));
    e.target.value = '';
  };

  const removeAttachment = (id) => {
    setAttachments((prev) => {
      const hit = prev.find((a) => a.id === id);
      if (hit?.url) URL.revokeObjectURL(hit.url);
      return prev.filter((a) => a.id !== id);
    });
  };

  const openLightbox = (att) => {
    const idx = attachments.findIndex((a) => a.id === att.id);
    if (idx !== -1) setLightboxIndex(idx);
  };

  // ── Drag & drop ─────────────────────────────────────────────────
  const handleDragOver  = useCallback((e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback((e) => { if (!dropZoneRef.current?.contains(e.relatedTarget)) setIsDragging(false); }, []);
  const handleDrop      = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(Array.from(e.dataTransfer.files));
  }, [processFiles]);

  return (
    <>
      {lightboxIndex !== null && attachments.length > 0 && (
        <MediaLightbox
          items={attachments}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}

      <div
        className="h-screen w-full bg-background flex flex-col relative overflow-hidden font-sans"
        ref={dropZoneRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml" multiple className="sr-only" aria-hidden="true" tabIndex={-1} onChange={onPickChange} />
        <input ref={videoInputRef} type="file" accept="video/mp4,video/webm,video/ogg,video/quicktime" multiple className="sr-only" aria-hidden="true" tabIndex={-1} onChange={onPickChange} />
        <input ref={gifInputRef}   type="file" accept="image/gif" multiple className="sr-only" aria-hidden="true" tabIndex={-1} onChange={onPickChange} />

        <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" aria-hidden="true" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" aria-hidden="true" />

        {isDragging && (
          <div role="status" aria-live="assertive" className="absolute inset-0 z-50 bg-indigo-500/10 border-2 border-dashed border-indigo-400 flex items-center justify-center pointer-events-none backdrop-blur-sm">
            <div className="text-center">
              <ImageIcon className="w-10 h-10 text-indigo-400 mx-auto mb-2" aria-hidden="true" />
              <p className="text-indigo-300 font-semibold text-lg">Drop images, GIFs or videos</p>
              <p className="text-indigo-400/60 text-sm mt-1">Other file types will be rejected</p>
            </div>
          </div>
        )}

        <DraftBanner draft={draftBanner} onRestore={restoreDraft} onDiscard={discardDraft} />

        <CreateHeader
          saveState={saveState}
          visibility={visibility}
          isLoading={isLoading}
          onVisibilityChange={setVisibility}
          onPublish={handlePublish}
          canPublish={plainText.length > 0 && !isLoading} // Uses plain text check
        />

        <main className="flex-1 w-full max-w-3xl mx-auto px-6 py-8 flex flex-col relative z-10 overflow-y-auto" role="main" aria-label="Post editor">
          <Editor content={content} setContent={setContent} maxChars={500} />

          <AttachmentGrid
            attachments={attachments}
            onRemove={removeAttachment}
            onOpen={openLightbox}
          />
        </main>

        <CreateToolbar
          content={plainText} // Pass plain text to Toolbar so it counts correctly
          attachmentCount={attachments.length}
          onPickImage={() => imageInputRef.current?.click()}
          onPickVideo={() => videoInputRef.current?.click()}
          onPickGif={()   => gifInputRef.current?.click()}
        />
      </div>
    </>
  );
}