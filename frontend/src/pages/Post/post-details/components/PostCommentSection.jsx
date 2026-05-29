import React, { useState, useRef, useCallback } from 'react';
import {
  Loader2, SendHorizonal, MessageSquareDashed,
  ChevronDown, ChevronUp, Trash2, Heart, Pencil, UserX
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { Separator } from '@/components/ui/separator.jsx';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '@/features/auth/authSlice.js';
import {
  useGetPostCommentsQuery,
  useCreateCommentMutation,
  useGetRepliesQuery,
  useDeleteCommentMutation,
  useUpdateCommentMutation,
} from '@/features/comment/api/commentApi.js';
import {
  useLikeCommentMutation,
  useDislikeCommentMutation,
} from '@/features/Like/api/likeApi.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatTime = (dateString) => {
  const diff  = Date.now() - new Date(dateString).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return 'just now';
  if (mins  < 60) return `${mins}m`;
  if (hours < 24) return `${hours}h`;
  if (days  < 7)  return `${days}d`;
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// Backend stores content as { text } — normalise to a plain string
const getText = (comment) =>
  typeof comment.content === 'string'
    ? comment.content
    : comment.content?.text ?? '';

// ─── Textarea that auto-resizes and hides scrollbar on single line ─────────────
const CommentInput = ({
  onSubmit,
  isSubmitting,
  placeholder = 'Write a comment…',
  avatarUrl,
  name,
  initialValue = '',
  autoFocus = false,
  compact = false,
  hideAvatar = false,
}) => {
  const [text, setText]         = useState(initialValue);
  const [multiLine, setMultiLine] = useState(false);
  const textareaRef             = useRef(null);

  const handleChange = useCallback((e) => {
    setText(e.target.value);
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
      // Show scrollbar only when content wraps to multiple lines
      setMultiLine(el.scrollHeight > el.clientHeight + 2);
    }
  }, []);

  const handleSubmit = useCallback(() => {
    if (!text.trim() || isSubmitting) return;
    onSubmit(text.trim());
    setText('');
    setMultiLine(false);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }, [text, isSubmitting, onSubmit]);

  const handleKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const avatarSize = compact ? 'w-7 h-7' : 'w-9 h-9';
  const textSize   = 'text-sm md:text-base';

  return (
    <div className="flex gap-2.5 items-start">
      {!hideAvatar && (
        <Avatar className={`${avatarSize} shrink-0 border border-border/50 mt-1`}>
          <AvatarImage src={avatarUrl} />
          <AvatarFallback className="text-[10px] font-bold bg-muted">
            {name?.charAt(0) ?? 'U'}
          </AvatarFallback>
        </Avatar>
      )}

      <div className="flex-1 relative min-w-0">
        <Textarea
          ref={textareaRef}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          autoFocus={autoFocus}
          className={`w-full min-h-[38px] max-h-36 resize-none break-words pr-10 py-2.5 ${textSize}
            rounded-2xl border-border/40 bg-muted/30 focus-visible:ring-1
            focus-visible:ring-indigo-500/50 focus-visible:border-indigo-500/40
            placeholder:text-muted-foreground/40 transition-all shadow-sm
            ${multiLine ? 'overflow-y-auto' : 'overflow-hidden'}`}
        />
        <motion.div whileTap={{ scale: 0.9 }} className="absolute right-2 top-1/2 -translate-y-1/2">
          <Button
            type="button"
            size="icon"
            disabled={!text.trim() || isSubmitting}
            onClick={handleSubmit}
            className="h-7 w-7 rounded-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-30 transition-all shadow-md"
          >
            {isSubmitting
              ? <Loader2 className="w-3 h-3 animate-spin" />
              : <SendHorizonal className="w-3.5 h-3.5" />
            }
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

// ─── Like button for a comment ────────────────────────────────────────────────
const CommentLikeButton = ({ comment, size = 'sm' }) => {
  const [likeComment]    = useLikeCommentMutation();
  const [dislikeComment] = useDislikeCommentMutation();

  // Optimistic local state — seed from server data
  const [liked, setLiked]   = useState(!!comment.isLiked);
  const [count, setCount]   = useState(comment.stats?.likeCount ?? 0);
  const [busy, setBusy]     = useState(false);

  const toggle = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    const willLike = !liked;
    setLiked(willLike);
    setCount((c) => Math.max(willLike ? c + 1 : c - 1, 0));
    try {
      if (willLike) await likeComment(comment._id).unwrap();
      else          await dislikeComment(comment._id).unwrap();
    } catch {
      // Revert on failure
      setLiked(!willLike);
      setCount((c) => Math.max(willLike ? c - 1 : c + 1, 0));
    } finally {
      setBusy(false);
    }
  }, [busy, liked, comment._id, likeComment, dislikeComment]);

  const iconSize  = size === 'sm' ? 'w-4 h-4'   : 'w-5 h-5';
  const textClass = size === 'sm' ? 'text-sm' : 'text-base';

  return (
    <motion.button
      whileTap={{ scale: 0.8 }}
      type="button"
      onClick={toggle}
      disabled={busy}
      className={`flex items-center gap-1.5 ${textClass} font-medium transition-colors
        ${liked
          ? 'text-rose-500 hover:text-rose-400'
          : 'text-muted-foreground/60 hover:text-rose-400'
        } disabled:opacity-50`}
    >
      <Heart className={`${iconSize} ${liked ? 'fill-current' : ''}`} />
      {count > 0 && <span>{count}</span>}
    </motion.button>
  );
};

// ─── Action row beneath a comment bubble ─────────────────────────────────────
const CommentActions = ({
  comment,
  onReply,
  onEdit,
  onDelete,
  isOwn,
  canReply = true,
  size = 'sm',
}) => {
  const textClass = size === 'sm' ? 'text-sm' : 'text-base';
  const timestampClass = size === 'sm' ? 'text-xs md:text-sm' : 'text-sm md:text-base';

  if (comment.deletedAt) return null;

  return (
    <div className="flex items-center gap-3 mt-1.5 px-1 flex-wrap">
      {/* Timestamp */}
      <span className={`${timestampClass} text-muted-foreground/70 font-medium tabular-nums flex items-center whitespace-nowrap`}>
        {formatTime(comment.createdAt)}
      </span>

      {/* Like */}
      <CommentLikeButton comment={comment} size={size} />

      {/* Reply */}
      {canReply && (
        <button
          type="button"
          onClick={onReply}
          className={`${textClass} font-semibold text-muted-foreground/70 hover:text-indigo-400 transition-colors whitespace-nowrap`}
        >
          Reply
        </button>
      )}
      
      {/* Edit (own) */}
      {isOwn && (
        <button
          type="button"
          onClick={onEdit}
          className={`${textClass} font-semibold text-muted-foreground/70 hover:text-indigo-400 transition-colors flex items-center gap-1 whitespace-nowrap`}
        >
          <Pencil className="w-3 h-3" />
          Edit
        </button>
      )}

      {/* Delete (own) */}
      {isOwn && (
        <button
          type="button"
          onClick={onDelete}
          className={`${textClass} text-muted-foreground/50 hover:text-red-400 transition-colors flex items-center gap-1 whitespace-nowrap`}
        >
          <Trash2 className="w-3 h-3" />
          Delete
        </button>
      )}
    </div>
  );
};

// ─── A single rendered comment bubble (avatar + bubble + actions) ─────────────
// depth: 0 = root, 1 = direct reply, 2 = reply-of-reply (max)
const CommentBubble = ({ comment, postId, depth = 0, avatarSize = 'md' }) => {
  const currentUser              = useSelector(selectCurrentUser);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  // Ref to imperatively open NestedReplies when user posts a reply
  const openRepliesRef = useRef(null);
  const [deleteComment]          = useDeleteCommentMutation();
  const [createComment, { isLoading: isReplying }] = useCreateCommentMutation();
  const [updateComment, { isLoading: isUpdating }] = useUpdateCommentMutation();

  const isOwn     = currentUser?._id === (comment.author?._id ?? comment.author);
  const canReply  = depth < 2;  // max depth is 2

  const handleDelete = useCallback(async () => {
    try {
      await deleteComment({
        id: comment._id,
        postId,
        parentId: comment.parentId ?? null,
        replyCount: comment.stats?.replyCount ?? 0,
      }).unwrap();
    } catch {}
  }, [comment._id, comment.parentId, comment.stats?.replyCount, postId, deleteComment]);

  const handleEdit = useCallback(async (text) => {
    try {
      await updateComment({ id: comment._id, data: { newContent: text } }).unwrap();
      setIsEditing(false);
    } catch {}
  }, [comment._id, updateComment]);

  const handleReply = useCallback(async (text) => {
    try {
      await createComment({
        content: text,
        postId,
        parentId: comment._id,
        idempotentKey: `reply-${comment._id}-${Date.now()}`,
      }).unwrap();
      setShowReplyInput(false);
      // Auto-open the replies section so the new reply is immediately visible
      openRepliesRef.current?.();
    } catch {}
  }, [comment._id, postId, createComment]);

  const avClass = avatarSize === 'sm'
    ? 'w-7 h-7'
    : 'w-9 h-9';

  const isPending = !!comment.isPending;

  return (
    <div className={`flex flex-col gap-0.5 transition-opacity duration-200 ${isPending ? 'opacity-50' : 'opacity-100'}`}>
      {/* Bubble row */}
      <div className="flex gap-3 group">
        <Avatar className={`${avClass} shrink-0 border border-border/50 mt-0.5 shadow-sm`}>
          {comment.deletedAt ? (
             <AvatarFallback className="text-xs font-bold bg-muted/50 text-muted-foreground/50">
               <UserX className="w-4 h-4 opacity-70" />
             </AvatarFallback>
          ) : (
            <>
              <AvatarImage src={comment.author?.avatarUrl} />
              <AvatarFallback className="text-xs font-bold bg-muted">
                {comment.author?.name?.charAt(0) ?? 'U'}
              </AvatarFallback>
            </>
          )}
        </Avatar>

        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="mb-2">
              <CommentInput
                onSubmit={handleEdit}
                isSubmitting={isUpdating}
                placeholder="Edit your comment…"
                avatarUrl={currentUser?.avatarUrl}
                name={currentUser?.name}
                initialValue={getText(comment)}
                autoFocus
                compact
                hideAvatar
              />
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="mt-1 ml-1 text-xs md:text-sm font-medium text-muted-foreground/60
                  hover:text-muted-foreground transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <>
              <div
                className={`relative bg-card shadow-sm rounded-2xl rounded-tl-sm px-4 py-3
                  border transition-colors
                  ${
                    isPending
                      ? 'border-indigo-500/30 animate-pulse'
                      : comment.deletedAt
                        ? 'bg-muted/30 border-dashed border-border/50 opacity-70'
                        : 'border-border/50 group-hover:border-indigo-500/30'
                  }`}
              >
                {/* Pending spinner in corner */}
                {isPending && (
                  <div className="absolute top-2 right-3">
                    <Loader2 className="w-3 h-3 text-indigo-400 animate-spin" />
                  </div>
                )}
                <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                  <span className="text-sm md:text-base font-semibold text-foreground leading-tight">
                    {comment.deletedAt ? '[deleted]' : comment.author?.name}
                  </span>
                  <span className="text-xs md:text-sm text-muted-foreground/60">
                    {comment.deletedAt ? '[deleted]' : `@${comment.author?.username}`}
                  </span>
                  {comment.isEdited && !comment.deletedAt && !isPending && (
                    <span className="text-[11px] md:text-xs text-muted-foreground/80 ml-1">(edited)</span>
                  )}
                  {isPending && (
                    <span className="text-[11px] md:text-xs text-indigo-400/80 ml-1">Sending…</span>
                  )}
                </div>
                {comment.deletedAt ? (
                  <p className="text-sm md:text-base text-muted-foreground/70 italic">This comment was deleted</p>
                ) : (
                  <p className="text-sm md:text-base text-foreground/90 leading-relaxed break-words whitespace-pre-wrap">{getText(comment)}</p>
                )}
              </div>

              {/* Hide action row while pending */}
              {!isPending && (
                <CommentActions
                  comment={comment}
                  onReply={() => setShowReplyInput((v) => !v)}
                  onEdit={() => setIsEditing(true)}
                  onDelete={handleDelete}
                  isOwn={isOwn}
                  canReply={canReply}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Inline reply input */}
      {showReplyInput && (
        <div className="ml-11 mt-1.5">
          <CommentInput
            onSubmit={handleReply}
            isSubmitting={isReplying}
            placeholder={`Reply to ${comment.author?.name ?? 'comment'}…`}
            avatarUrl={currentUser?.avatarUrl}
            name={currentUser?.name}
            autoFocus
            compact
          />
          <button
            type="button"
            onClick={() => setShowReplyInput(false)}
            className="mt-1 ml-1 text-xs md:text-sm font-medium text-muted-foreground/60
              hover:text-muted-foreground transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Nested replies (only rendered for depth 0 and 1) */}
      {canReply && (
        <NestedReplies
          commentId={comment._id}
          postId={postId}
          replyCount={comment.stats?.replyCount ?? 0}
          depth={depth}
          openRef={openRepliesRef}
        />
      )}
    </div>
  );
};

// ─── Nested reply list for a given parent comment ─────────────────────────────
const NestedReplies = ({ commentId, postId, replyCount, depth, openRef }) => {
  const [open, setOpen] = useState(false);

  // Expose an imperative open() so the parent CommentBubble can force-open
  // after submitting a reply, making the new reply immediately visible.
  React.useEffect(() => {
    if (openRef) openRef.current = () => setOpen(true);
  }, [openRef]);
  const [page, setPage] = useState(1);

  const { data, isFetching } = useGetRepliesQuery(
    { commentId, page, limit: 10 },
    { skip: !open }
  );

  const replies    = data?.data?.replies ?? [];
  const pagination = data?.data?.pagination;

  // Nothing to show and not open — but keep mounted if open so optimistic replies stay visible
  if (replyCount === 0 && !open && replies.length === 0) return null;

  const indent = depth === 0 ? 'ml-11' : 'ml-9';

  return (
    <div className={`${indent} flex flex-col gap-1.5 mt-0.5`}>
      {/* Toggle button */}
      {replyCount > 0 && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1.5 text-xs md:text-sm font-semibold text-indigo-400
            hover:text-indigo-300 transition-colors w-fit"
        >
          {open
            ? <ChevronUp className="w-4 h-4" />
            : <ChevronDown className="w-4 h-4" />
          }
          {open
            ? 'Hide replies'
            : `${replyCount} ${replyCount === 1 ? 'reply' : 'replies'}`
          }
        </button>
      )}

      {/* Replies */}
      <AnimatePresence>
        {open && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex flex-col gap-3 overflow-hidden"
          >
            {isFetching && replies.length === 0 ? (
            <div className="flex items-center gap-2 py-1 text-muted-foreground/60 text-xs">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Loading replies…
            </div>
          ) : (
            <AnimatePresence>
              {replies.map((reply) => (
                <motion.div key={reply._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
                  <CommentBubble
                    comment={reply}
                    postId={postId}
                    depth={depth + 1}
                    avatarSize="sm"
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          )}

          {/* Load more replies */}
          {pagination?.hasNextPage && (
            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              disabled={isFetching}
              className="flex items-center gap-1.5 text-xs md:text-sm font-semibold text-indigo-400
                hover:text-indigo-300 transition-colors disabled:opacity-50 w-fit"
            >
              {isFetching
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <ChevronDown className="w-4 h-4" />
              }
              Load more replies
            </button>
          )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Main section ──────────────────────────────────────────────────────────────
const PostCommentSection = ({ postId, commentCount }) => {
  const currentUser = useSelector(selectCurrentUser);
  const [page, setPage] = useState(1);

  const { data, isFetching } = useGetPostCommentsQuery(
    { postId, page, limit: 20 },
    { skip: !postId }
  );

  const [createComment, { isLoading: isSubmitting }] = useCreateCommentMutation();

  const comments   = data?.data?.comments ?? [];
  const pagination = data?.data?.pagination;

  const handleSubmit = useCallback(async (text) => {
    try {
      await createComment({
        content: text,
        postId,
        idempotentKey: `comment-${postId}-${Date.now()}`,
      }).unwrap();
    } catch {}
  }, [createComment, postId]);

  // Use the authoritative post-level commentCount (excludes soft-deleted tombstones).
  // pagination.total counts visible root comments including tombstones with replies,
  // so it would overcount when deleted comments with replies exist.
  const displayCount = commentCount ?? pagination?.total ?? 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <h2 className="text-sm font-semibold text-foreground">
        Comments
        {displayCount > 0 && (
          <span className="ml-2 text-muted-foreground font-normal">
            {displayCount.toLocaleString()}
          </span>
        )}
      </h2>

      {/* Write box */}
      <CommentInput
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        avatarUrl={currentUser?.avatarUrl}
        name={currentUser?.name}
      />

      {/* Gap between input and list */}
      <div className="flex flex-col gap-4 mt-4 mb-8">
        {isFetching && comments.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-10
            text-muted-foreground/60 text-sm">
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading comments…
          </div>
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground/50">
            <MessageSquareDashed className="w-8 h-8" />
            <p className="text-sm">No comments yet. Be the first!</p>
          </div>
        ) : (
          <AnimatePresence>
            {comments.map((comment, i) => (
              <motion.div key={comment._id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
                <CommentBubble comment={comment} postId={postId} depth={0} />
                {i < comments.length - 1 && <Separator className="opacity-30 my-3" />}
              </motion.div>
            ))}

            {/* Load more top-level comments */}
            {pagination?.hasNextPage ? (
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                disabled={isFetching}
                className="mx-auto text-sm font-semibold text-indigo-400 hover:text-indigo-300
                  transition-colors flex items-center gap-1.5 disabled:opacity-50 py-1"
              >
                {isFetching
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <ChevronDown className="w-4 h-4" />
                }
                Load more comments
              </button>
            ) : (
              comments.length > 0 && (
                <div className="flex justify-center pt-2 pb-4">
                  <span className="text-xs text-muted-foreground/60 italic">You've reached the end.</span>
                </div>
              )
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default PostCommentSection;