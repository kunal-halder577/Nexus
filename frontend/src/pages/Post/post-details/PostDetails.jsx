import React, { useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useGetPostByIdQuery } from '@/features/post/api/postApi';
import PostAuthorHeader from './components/PostAuthorHeader';
import PostCaption from './components/PostCaption';
import PostMediaGrid from './components/PostMediaGrid';
import PostActionBar from './components/PostActionBar';
import PostCommentSection from './components/PostCommentSection';

const PostDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const handleDeleteSuccess = useCallback(() => navigate('/'), [navigate]);
  const { data, isLoading, isError } = useGetPostByIdQuery(id);

  const post = data?.data;

  if (isLoading) return <PostDetailSkeleton />;
  if (isError || !post) return <PostDetailError onBack={() => navigate(-1)} />;

  return (
    <div className="min-h-screen bg-background">
      {/* ── STICKY TOP BAR ── */}
      <header className="sticky top-0 z-20 flex items-center gap-4 px-4 py-3
        bg-background/80 backdrop-blur-md border-b border-border/40">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="rounded-full h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted/50"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-base font-semibold text-foreground tracking-tight">Post</h1>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-5 flex flex-col gap-4">

        {/* ── AUTHOR ── */}
        <PostAuthorHeader post={post} onDeleteSuccess={handleDeleteSuccess}/>

        {/* ── CAPTION ── */}
        {post.content?.caption && (
          <PostCaption html={post.content.caption} />
        )}

        {/* ── MEDIA ── */}
        {post.media?.length > 0 && (
          <PostMediaGrid media={post.media} />
        )}

        {/* ── TIMESTAMP (full) ── */}
        <p className="text-xs text-muted-foreground/60 pl-0.5">
          {new Date(post.createdAt).toLocaleString('en-US', {
            hour: 'numeric', minute: '2-digit',
            month: 'long', day: 'numeric', year: 'numeric'
          })}
        </p>

        <Separator className="opacity-40" />

        {/* ── STATS ROW ── */}
        <PostStatsSummary post={post} />

        <Separator className="opacity-40" />

        {/* ── ACTION BAR ── */}
        <PostActionBar post={post} />

        <Separator className="opacity-40" />

        {/* ── COMMENTS ── */}
        <PostCommentSection postId={post._id} commentCount={post.stats?.commentCount} />
      </div>
    </div>
  );
};

// ─── Stats summary row (like Twitter's "X Likes · X Reposts") ────────────────
const PostStatsSummary = ({ post }) => {
  const stats = post.stats ?? {};
  const items = [
    { label: 'Likes',    value: stats.likeCount    ?? 0 },
    { label: 'Comments', value: stats.commentCount  ?? 0 },
    { label: 'Shares',   value: stats.shareCount    ?? 0 },
    { label: 'Views',    value: stats.viewCount     ?? 0 },
  ].filter(i => i.value > 0);

  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 px-0.5">
      {items.map(({ label, value }) => (
        <span key={label} className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">
            {value.toLocaleString()}
          </span>{' '}
          {label}
        </span>
      ))}
    </div>
  );
};

// ─── Loading skeleton ────────────────────────────────────────────────────────
const PostDetailSkeleton = () => (
  <div className="max-w-2xl mx-auto px-4 py-5 flex flex-col gap-4 animate-pulse">
    <div className="flex items-center gap-3">
      <div className="w-11 h-11 rounded-full bg-muted" />
      <div className="flex flex-col gap-1.5">
        <div className="w-32 h-3.5 rounded bg-muted" />
        <div className="w-20 h-3 rounded bg-muted" />
      </div>
    </div>
    <div className="flex flex-col gap-2">
      <div className="w-full h-3.5 rounded bg-muted" />
      <div className="w-5/6 h-3.5 rounded bg-muted" />
      <div className="w-3/4 h-3.5 rounded bg-muted" />
    </div>
    <div className="w-full aspect-video rounded-xl bg-muted" />
  </div>
);

// ─── Error state ─────────────────────────────────────────────────────────────
const PostDetailError = ({ onBack }) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
    <p className="text-muted-foreground text-sm">This post doesn't exist or was deleted.</p>
    <Button variant="outline" onClick={onBack} className="rounded-full">
      Go back
    </Button>
  </div>
);

export default PostDetailPage;
