import React, { useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MoreHorizontal } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useDeletePostMutation, useUpdatePostMutation } from '@/features/post/api/postApi';
import PostActionMenu from '@/features/post/components/PostActionMenu';
import { selectCurrentUser } from '@/features/auth/authSlice';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';

const formatRelativeTime = (dateString) => {
  if (!dateString) return null;
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const PostAuthorHeader = ({ post }) => {
  const author = post.author;
  const currentUser = useSelector(selectCurrentUser);
  const relativeTime = formatRelativeTime(post.createdAt);
  const navigate = useNavigate();
  const [deletePost] = useDeletePostMutation();
  const [updatePost] = useUpdatePostMutation();

  const isOwnPost = currentUser._id === post.author?._id;

  const handleLike = useCallback(() => {
    const liked = post.hasLiked;
    updatePost({
      id:       post._id,
      hasLiked: !liked,
      stats:    { ...post.stats, likeCount: post.stats.likeCount + (liked ? -1 : 1) },
    });
  }, [post, updatePost]);

  const handleDelete = useCallback(async () => {
    try {
      await deletePost(post._id).unwrap();
      if (window.location.pathname.includes(post._id)) navigate('/');
      toast.success("Post deleted successfully.");
    } catch {
      toast.error("Something went wrong while deleting post.");
    }
  }, [deletePost, navigate, post._id]);

  const handleEdit   = useCallback(() => { /* TODO: open edit modal */ }, []);
  const handleCopy   = useCallback(() => {
    navigator.clipboard.writeText(`${window.location.origin}/post/${post._id}`);
    toast.success("Link copied.");
  }, [post._id]);
  const handleShare  = useCallback(() => { /* TODO: share sheet */ }, []);
  const handleReport = useCallback(() => { /* TODO: report flow */ }, []);
  const handleSave   = useCallback(() => { /* TODO: save post  */ }, []);

  const menuActions = useMemo(() => [
    { label: 'Edit post',         onClick: handleEdit,   hidden: !isOwnPost },
    { label: 'Delete post',   onClick: handleDelete, variant: 'destructive', hidden: !isOwnPost },
    { label: 'Report post',   onClick: handleReport, variant: 'destructive', hidden: isOwnPost  },
    { label: 'Block user',    onClick: () => {},     variant: 'warning',     hidden: isOwnPost  },
    { type:  'separator',                                hidden: !isOwnPost },
    { label: 'Turn off comments', onClick: () => {},     hidden: !isOwnPost },
    { label: 'Bookmark',          onClick: () => {},     hidden: !isOwnPost },
    { label: 'Save post',         onClick: handleSave,   hidden: isOwnPost  },
    { label: 'Bookmark',          onClick: () => {},     hidden: isOwnPost  },
    { type:  'separator' },
    { label: 'Hide post',         onClick: () => {},     hidden: isOwnPost  },
    { label: 'Unfollow user',     onClick: () => {},     hidden: isOwnPost  },
    { type:  'separator' },
    { label: 'Copy link',         onClick: handleCopy  },
    { label: 'Share post',        onClick: handleShare },
    { type:  'separator',                                hidden: isOwnPost  },
  ], [isOwnPost, handleEdit, handleDelete, handleSave, handleCopy, handleShare, handleReport]);

  return (
    <div className="flex items-center justify-between">
      <Link
        to={`/profile/users/${author?._id}`}
        className="flex items-center gap-3 group"
      >
        <Avatar className="w-11 h-11 border border-border/60 group-hover:border-indigo-500/40 transition-colors duration-200">
          <AvatarImage src={author?.avatarUrl} alt={author?.name} />
          <AvatarFallback className="bg-muted font-bold text-sm">
            {author?.name?.charAt(0) ?? 'U'}
          </AvatarFallback>
        </Avatar>

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[15px] text-foreground
              group-hover:text-indigo-500 dark:group-hover:text-indigo-400
              transition-colors leading-tight truncate">
              {author?.name}
            </span>
            <Badge
              variant="secondary"
              className="text-[9px] px-1.5 py-0 h-4 font-semibold
                bg-indigo-500/10 text-indigo-500 dark:text-indigo-400
                border-0 leading-none shrink-0"
            >
              Author
            </Badge>
          </div>
          <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground leading-tight">
            <span>@{author?.username}</span>
            {relativeTime && (
              <>
                <span className="opacity-40">·</span>
                <time dateTime={post.createdAt} className="shrink-0">{relativeTime}</time>
              </>
            )}
          </div>
        </div>
      </Link>

      <PostActionMenu actions={menuActions}>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
        >
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </PostActionMenu>
    </div>
  );
};

export default PostAuthorHeader;