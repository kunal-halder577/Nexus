import React, { useState, useRef, useCallback } from 'react';
import { Loader2, SendHorizonal, MessageSquareDashed } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { Separator } from '@/components/ui/separator.jsx';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '@/features/auth/authSlice.js';

// ─── Moved outside — one instance shared across all CommentItems ─────────────
const formatTime = (dateString) => {
  const diff = Date.now() - new Date(dateString).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return 'just now';
  if (mins  < 60) return `${mins}m`;
  if (hours < 24) return `${hours}h`;
  if (days  < 7)  return `${days}d`;
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// ─── Single comment ──────────────────────────────────────────────────────────
const CommentItem = ({ comment }) => (
  <div className="flex gap-3 group">
    <Avatar className="w-8 h-8 shrink-0 border border-border/50 mt-0.5">
      <AvatarImage src={comment.author?.avatarUrl} />
      <AvatarFallback className="text-xs font-bold bg-muted">
        {comment.author?.name?.charAt(0) ?? 'U'}
      </AvatarFallback>
    </Avatar>

    <div className="flex-1 min-w-0">
      <div className="bg-muted/40 rounded-2xl rounded-tl-sm px-3.5 py-2.5
        border border-border/30 group-hover:border-indigo-500/20 transition-colors">
        <div className="flex items-baseline gap-2 mb-0.5">
          <span className="text-[13px] font-semibold text-foreground leading-tight">
            {comment.author?.name}
          </span>
          <span className="text-[11px] text-muted-foreground/60">
            @{comment.author?.username}
          </span>
        </div>
        <p className="text-[13px] text-foreground/85 leading-relaxed">{comment.content}</p>
      </div>
      <div className="flex items-center gap-3 mt-1 px-1">
        <span className="text-[11px] text-muted-foreground/50">
          {formatTime(comment.createdAt)}
        </span>
        <button type="button" className="text-[11px] text-muted-foreground/50 hover:text-indigo-400
          transition-colors font-medium">
          Like
        </button>
        <button type="button" className="text-[11px] text-muted-foreground/50 hover:text-indigo-400
          transition-colors font-medium">
          Reply
        </button>
      </div>
    </div>
  </div>
);

// ─── Comment input ───────────────────────────────────────────────────────────
const CommentInput = ({ onSubmit, isSubmitting }) => {
  const user = useSelector(selectCurrentUser);
  const [text, setText] = useState('');
  const textareaRef = useRef(null);

  const handleChange = useCallback((e) => {
    setText(e.target.value);
    // Auto-resize: reset to auto first so it can shrink back down, then expand to scrollHeight
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    }
  }, []);

  const handleSubmit = useCallback(() => {
    if (!text.trim() || isSubmitting) return;
    onSubmit(text.trim());
    setText('');
    // Reset height after clearing
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }, [text, isSubmitting, onSubmit]);

  const handleKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex gap-3 items-start">
      <Avatar className="w-8 h-8 shrink-0 border border-border/50 mt-1">
        <AvatarImage src={user?.avatarUrl} />
        <AvatarFallback className="text-xs font-bold bg-muted">
          {user?.name?.charAt(0) ?? 'U'}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 relative">
        <Textarea
          id="comment-input"
          ref={textareaRef}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Write a comment…"
          rows={1}
          className="min-h-[40px] max-h-32 resize-none pr-10 py-2.5 text-[13px]
            rounded-2xl border-border/40 bg-muted/30 focus-visible:ring-1
            focus-visible:ring-indigo-500/50 focus-visible:border-indigo-500/40
            placeholder:text-muted-foreground/50 transition-all overflow-y-auto"
        />
        <Button
          type="button"
          size="icon"
          disabled={!text.trim() || isSubmitting}
          onClick={handleSubmit}
          className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full
            bg-indigo-500 hover:bg-indigo-600 disabled:opacity-30 transition-all"
        >
          {isSubmitting
            ? <Loader2 className="w-3 h-3 animate-spin" />
            : <SendHorizonal className="w-3 h-3" />
          }
        </Button>
      </div>
    </div>
  );
};

// ─── Main section ────────────────────────────────────────────────────────────
const PostCommentSection = ({ postId, commentCount }) => {
  const [comments, setComments] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (text) => {
    setIsSubmitting(true);
    const optimistic = {
      _id: `temp-${Date.now()}`,
      content: text,
      author: { name: 'You', username: 'you', avatarUrl: null },
      createdAt: new Date().toISOString(),
    };
    setComments(prev => [optimistic, ...prev]);
    // TODO: await createComment({ postId, content: text });
    setIsSubmitting(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-sm font-semibold text-foreground">
        Comments
        {commentCount > 0 && (
          <span className="ml-2 text-muted-foreground font-normal">
            {commentCount.toLocaleString()}
          </span>
        )}
      </h2>

      <CommentInput onSubmit={handleSubmit} isSubmitting={isSubmitting} />

      {comments.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground/50">
          <MessageSquareDashed className="w-8 h-8" />
          <p className="text-sm">No comments yet. Be the first!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {comments.map((comment, i) => (
            <React.Fragment key={comment._id}>
              <CommentItem comment={comment} />
              {i < comments.length - 1 && <Separator className="opacity-20" />}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};

export default PostCommentSection;