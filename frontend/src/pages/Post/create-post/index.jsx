import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Image as ImageIcon, User, Globe, Lock } from 'lucide-react';
import { toast } from 'sonner';

import Editor from '@/components/Editor.jsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { useDraft }        from './useDraft.js';
import { isAllowed, revokeAll, DRAFT_KEY } from './mediaUtils.js';
import MediaLightbox       from './components/MediaLightBox.jsx';
import AttachmentGrid      from './components/AttachmentGrid.jsx';
import CreateHeader        from './components/CreateHeader.jsx';
import CreateToolbar       from './components/CreateToolbar.jsx';
import { useCreatePostMutation } from '@/features/post/api/postApi.js';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '@/features/auth/authSlice.js';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.jsx';

export default function NexusFullPageCreate() {
  const user = useSelector(selectCurrentUser);
  const [content,       setContent]       = useState('');
  const [visibility,    setVisibility]    = useState('public');
  const [isDragging,    setIsDragging]    = useState(false);
  const [attachments,   setAttachments]   = useState([]);
  const [draftBanner,   setDraftBanner]   = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  
  const dropZoneRef       = useRef(null);
  const imageInputRef     = useRef(null);
  const videoInputRef     = useRef(null);
  const gifInputRef       = useRef(null);
  const idempotencyKeyRef = useRef(crypto.randomUUID());

  const navigate = useNavigate();
  const [createPost, { isLoading }] = useCreatePostMutation();
  const plainText = content.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').trim();

  const attachmentsRef = useRef(attachments);
  useEffect(() => { attachmentsRef.current = attachments; }, [attachments]);
  useEffect(() => () => revokeAll(attachmentsRef.current), []);

  // Scope the draft key to the logged-in user's ID.
  // This ensures drafts are completely isolated between accounts sharing the same browser.
  // null when user is unknown — useDraft and the restore effect both guard against this.
  const draftKey = user?._id ? `${DRAFT_KEY}:${user._id}` : null;

  // Pass draftKey into useDraft so it saves to the right key.
  // useDraft should accept this as its third argument and use it instead of the bare DRAFT_KEY.
  const saveState = useDraft(content, visibility, draftKey);

  useEffect(() => {
    // Don't attempt to restore until we know who is logged in.
    if (!draftKey) return;

    const raw = localStorage.getItem(draftKey);
    if (!raw) return;
    try {
      const draft = JSON.parse(raw);
      if (draft.content?.trim()) {
        const ageMins = Math.round((Date.now() - draft.savedAt) / 60000);
        let ageText = 'just now';
        if (ageMins > 0 && ageMins < 60) ageText = `${ageMins}m ago`;
        else if (ageMins >= 60 && ageMins < 1440) ageText = `${Math.floor(ageMins / 60)}h ago`;
        else if (ageMins >= 1440) ageText = `${Math.floor(ageMins / 1440)}d ago`;

        setDraftBanner({ ...draft, ageText });
      }
    } catch {}
  }, [draftKey]);

  const restoreDraft = () => {
    setContent(draftBanner.content);
    setVisibility(draftBanner.visibility || 'public');
    setDraftBanner(null);
  };
  
  const discardDraft = () => {
    localStorage.removeItem(draftKey);
    setDraftBanner(null);
  };

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && (plainText || attachments.length > 0) && !isLoading) handlePublish();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [plainText, attachments, isLoading]);

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
        
        revokeAll(currentAttachments);
        setAttachments([]);
        setContent('');
        // Use the scoped key so we clear the right user's draft on publish
        if (draftKey) localStorage.removeItem(draftKey);

        toast.success('Post Published!', { description: 'Your post is now live on Nexus.' });
        navigate('/');
    } catch (error) {
        toast.error('Post creation failed', {
          description: error?.data?.message || error.message || 'Something went wrong.',
        });
    }
  };

  const processFiles = useCallback((files) => {
    if (!files.length) return;
    const allowed = files.filter(isAllowed);
    const blocked = files.filter((f) => !isAllowed(f));

    if (blocked.length) {
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
        className="h-[100dvh] w-full bg-background flex flex-col relative overflow-hidden font-sans"
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

        <CreateHeader
          saveState={saveState}
          isLoading={isLoading}
          onPublish={handlePublish}
          canPublish={(plainText.length > 0 || attachments.length > 0) && !isLoading}
          draftBanner={draftBanner}
          onRestoreDraft={restoreDraft}
          onDiscardDraft={discardDraft}
        />

        {/* Main layout container */}
        <div
          className="flex-1 min-h-0 w-full max-w-3xl mx-auto px-3 py-4 sm:px-6 sm:py-8 flex flex-col gap-3 relative z-10 overflow-hidden"
          role="main"
          aria-label="Post editor"
        >
          {/* Avatar and Visibility Row */}
          <div className="flex items-center gap-4 shrink-0">
            <Avatar className="w-10 h-10 ring-2 ring-indigo-500/20 shadow-sm">
              <AvatarImage src={user?.avatarUrl} alt={user?.name || 'User'} className="object-cover" />
              <AvatarFallback className="bg-indigo-500/15 text-indigo-500 dark:text-indigo-400 font-semibold text-sm">
                {user?.name?.charAt(0)?.toUpperCase() || <User className="w-5 h-5" />}
              </AvatarFallback>
            </Avatar>

            <div className="flex flex-col justify-center gap-1">
              <span className="text-[15px] font-semibold text-foreground tracking-tight leading-none">
                {user?.name || 'User'}
              </span>
              <Select value={visibility} onValueChange={setVisibility}>
                <SelectTrigger
                  aria-label="Post visibility"
                  className="w-auto h-auto min-h-0 py-0.5 border-none bg-transparent hover:bg-muted/40 focus:ring-1 focus:ring-indigo-500/30 shadow-none transition-colors text-indigo-400 cursor-pointer justify-start gap-1.5 rounded-md px-1.5 -ml-1.5"
                >
                  {visibility === 'public' ? (
                    <Globe className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  ) : (
                    <Lock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  )}
                  <span className="text-sm font-medium leading-none">
                    <SelectValue placeholder="Visibility" />
                  </span>
                </SelectTrigger>
                <SelectContent
                  position="popper"
                  sideOffset={4}
                  className="border-border/20 backdrop-blur-xl bg-background/95 rounded-xl shadow-2xl min-w-[150px]"
                >
                  <SelectItem value="public"  className="cursor-pointer py-2.5">Public</SelectItem>
                  <SelectItem value="private" className="cursor-pointer py-2.5">Connections</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Scrollable editor + attachments */}
          <main className="flex-1 min-w-0 min-h-0 flex flex-col overflow-y-auto overflow-x-hidden pt-1">
            <Editor content={content} setContent={setContent} maxChars={500} />
            <AttachmentGrid
              attachments={attachments}
              onRemove={removeAttachment}
              onOpen={openLightbox}
            />
          </main>
        </div>

        <CreateToolbar
          content={plainText}
          attachmentCount={attachments.length}
          onPickImage={() => imageInputRef.current?.click()}
          onPickVideo={() => videoInputRef.current?.click()}
          onPickGif={()   => gifInputRef.current?.click()}
        />
      </div>
    </>
  );
}