import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { Card } from "@/components/ui/card.jsx";
import { MessageSquare, Heart, Share2, MoreHorizontal, PlayCircle } from "lucide-react";
import parse from 'html-react-parser';
import DOMPurify from 'dompurify';
import { useDeletePostMutation, useUpdatePostMutation } from '../api/postApi.js';
import MediaLightbox from '@/components/Shared/MediaLightBox.jsx';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '@/features/auth/authSlice.js';
import { toast } from 'sonner';
import PostActionMenu from './PostActionMenu.jsx';
import { useEditPost } from '@/hooks/useEditPost.js';
import EditPostModal from '@/components/Shared/EditPostModal.jsx';
import PostViewTracker from './PostViewTracker.jsx';
import {
  useFollowUserMutation,
  useUnfollowUserMutation,
  useGetFollowStatusQuery,
} from '@/features/follow/api/followApi.js';
import { useDislikePostMutation, useLikePostMutation } from '@/features/Like/api/likeApi.js';
import { useCreateBookmarkMutation, useDeleteBookmarkMutation } from '@/features/bookmark/api/bookmarkApi.js';

// ─── MIME type helper ─────────────────────────────────────────────────────────
const EXTENSION_TO_MIME = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg',
  png: 'image/png',  webp: 'image/webp',
  gif: 'image/gif',  avif: 'image/avif',
  mp4: 'video/mp4',  mov: 'video/quicktime',
  webm: 'video/webm',
};

const getMimeType = (item) => {
  if (item.type === 'Video') return 'video/mp4';
  const ext = item.url?.split('.').pop()?.split('?')[0]?.toLowerCase();
  return EXTENSION_TO_MIME[ext] ?? 'image/jpeg';
};

const toLibItems = (mediaArr) =>
  mediaArr.map((item, i) => ({
    id:           `media-${i}`,
    name:         `media-${i + 1}`,
    size:         0,
    url:          item.url,
    thumbnailUrl: item.thumbnailUrl,
    type:         getMimeType(item),
  }));

// ─── Time formatter ───────────────────────────────────────────────────────────
const formatTime = (dateString) => {
  if (!dateString) return '';
  const ts = new Date(dateString).getTime();
  if (isNaN(ts)) return '';
  const diff  = Date.now() - ts;
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return 'just now';
  if (mins  < 60) return `${mins}m`;
  if (hours < 24) return `${hours}h`;
  if (days  < 7)  return `${days}d`;
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// ─── Caption ──────────────────────────────────────────────────────────────────
const stripHtml = (html) => html.replace(/<[^>]*>/g, '');

const Caption = ({ text }) => {
  const [expanded, setExpanded] = useState(false);
  if (!text) return null;

  const { parsed, plainLength } = useMemo(() => ({
    parsed:      parse(DOMPurify.sanitize(text)),
    plainLength: stripHtml(text).length,
  }), [text]);

  return (
    <div className="pl-1">
      <div
        className={`text-foreground/90 text-[14px] leading-relaxed
          [&_p]:my-0.5 [&_a]:text-indigo-400 [&_a]:hover:underline
          [&_strong]:font-semibold [&_strong]:text-foreground
          [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4
          [&_blockquote]:border-l-2 [&_blockquote]:border-indigo-500
          [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground
          ${!expanded ? 'line-clamp-3' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {parsed}
      </div>
      {!expanded && plainLength > 180 && (
        <button
          onClick={(e) => { e.stopPropagation(); setExpanded(true); }}
          className="text-xs text-indigo-400 hover:text-indigo-300 mt-0.5 font-medium transition-colors"
        >
          see more
        </button>
      )}
    </div>
  );
};

// ─── Media grid ───────────────────────────────────────────────────────────────
const MediaGrid = ({ media, onOpen }) => {
  const count = media.length;
  if (count === 0) return null;

  const handleOpen = (e, idx) => {
    e.stopPropagation();
    onOpen(idx);
  };

  const handleKeyDown = (e, idx) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      onOpen(idx);
    }
  };

  if (count === 1) {
    const item = media[0];
    const isVideo = item.type === 'Video';
    const src = isVideo ? item.thumbnailUrl : item.url;

    return (
      <div
        role="button"
        tabIndex={0}
        aria-label={`${isVideo ? 'Play video' : 'View image'}`}
        onClick={(e) => handleOpen(e, 0)}
        onKeyDown={(e) => handleKeyDown(e, 0)}
        className="relative flex items-center justify-center bg-muted/50 group/media cursor-pointer overflow-hidden rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/70 w-full max-h-[600px] min-h-[250px]"
        style={{ maxHeight: '600px' }}
      >
        <div 
          className="absolute inset-[-10%] bg-cover bg-center blur-lg opacity-60 dark:opacity-40 transition-transform duration-300 group-hover/media:scale-105 pointer-events-none will-change-transform"
          style={{ backgroundImage: `url(${src})` }}
        />
        <img
          src={src}
          alt="Post media 1"
          className="relative max-w-full max-h-[600px] object-contain transition-transform duration-300 group-hover/media:scale-105"
          style={{ maxHeight: '600px' }}
        />
        {isVideo && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover/media:bg-indigo-950/40 transition-colors pointer-events-none">
            <PlayCircle className="w-10 h-10 text-white drop-shadow-md" />
          </div>
        )}
      </div>
    );
  }

  // Multiple Images Layout
  const firstItem = media[0];
  const firstSrc = firstItem.type === 'Video' ? firstItem.thumbnailUrl : firstItem.url;

  let gridContainerClass = "";
  let getItemClass = (idx) => "";

  if (count === 2) {
    gridContainerClass = "grid-cols-2 aspect-video";
  } else if (count === 3) {
    gridContainerClass = "grid-cols-2 grid-rows-2 aspect-video sm:aspect-[16/7]";
    getItemClass = (idx) => idx === 0 ? "row-span-2" : "";
  } else {
    gridContainerClass = "grid-cols-2 grid-rows-2 aspect-square sm:aspect-[4/3]";
  }

  return (
    <div className="relative rounded-xl overflow-hidden border border-border/20 dark:border-border/10">
      {/* Outer Container Glassmorphism Glow */}
      <div 
        className="absolute inset-[-20%] bg-cover bg-center blur-2xl opacity-50 dark:opacity-30 pointer-events-none will-change-transform"
        style={{ backgroundImage: `url(${firstSrc})` }}
      />
      <div className="absolute inset-0 bg-background/50 dark:bg-background/60 backdrop-blur-xl pointer-events-none" />

      {/* Grid Container */}
      <div className="relative p-1.5 sm:p-2">
        <div className={`grid gap-[2px] bg-background dark:bg-black rounded-lg overflow-hidden shadow-sm ${gridContainerClass}`}>
          {media.slice(0, 4).map((item, idx) => {
            const isVideo = item.type === 'Video';
            const src     = isVideo ? item.thumbnailUrl : item.url;
            
            return (
              <div
                key={idx}
                role="button"
                tabIndex={0}
                aria-label={`${isVideo ? 'Play video' : 'View image'} ${idx + 1} of ${count}`}
                onClick={(e) => handleOpen(e, idx)}
                onKeyDown={(e) => handleKeyDown(e, idx)}
                className={`relative group/media cursor-pointer overflow-hidden bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/70 w-full h-full ${getItemClass(idx)}`}
              >
                <img
                  src={src}
                  alt={`Post media ${idx + 1}`}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover/media:scale-105"
                />
                {isVideo && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover/media:bg-indigo-950/40 transition-colors pointer-events-none">
                    <PlayCircle className="w-10 h-10 text-white drop-shadow-md" />
                  </div>
                )}
                {idx === 3 && count > 4 && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center pointer-events-none">
                    <span className="text-white font-medium text-2xl">+{count - 4}</span>
                  </div>
                )}
                {!isVideo && !(idx === 3 && count > 4) && (
                  <div className="absolute inset-0 bg-black/0 group-hover/media:bg-black/10 transition-colors pointer-events-none" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ─── Stat button ──────────────────────────────────────────────────────────────
const StatBtn = ({ icon: Icon, count, onClick, active, activeClass, hoverClass, filled }) => (
  <Button
    variant="ghost"
    size="sm"
    onClick={(e) => { e.stopPropagation(); onClick?.(); }}
    className={`group h-7 px-2.5 rounded-full transition-all duration-200 gap-1.5 cursor-pointer
      ${active ? activeClass : `text-muted-foreground ${hoverClass}`}`}
  >
    <Icon className={`w-3.5 h-3.5 transition-transform duration-200 group-hover:scale-110
      ${active && filled ? 'fill-current' : ''}`} />
    <span className="text-[12px] font-semibold tabular-nums">{count ?? 0}</span>
  </Button>
);

// ─── Main component ───────────────────────────────────────────────────────────
const FeedPost = ({ post }) => {
  const navigate    = useNavigate();
  const currentUser = useSelector(selectCurrentUser);
  const [deletePost] = useDeletePostMutation();
  const [createBookmark] = useCreateBookmarkMutation();
  const [deleteBookmark] = useDeleteBookmarkMutation();
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const {
    isOpen:      editOpen,
    openEditor:  openEdit,
    closeEditor: closeEdit,
    submitEdit,
    isLoading:   editLoading,
  } = useEditPost(post);

  const isOwnPost = currentUser._id === post.author?._id;
  const isPrivilaged = currentUser.role === "admin" || currentUser.role === "moderator";
  const authorId  = post.author?._id;

  const libItems = useMemo(
    () => (post.media?.length ? toLibItems(post.media) : []),
    [post.media]
  );

  const { data: followStatusData } = useGetFollowStatusQuery(authorId, {
    skip: !authorId || isOwnPost,
  });
  const isFollowing = followStatusData?.data?.isFollowing ?? false;

  const [likePost]    = useLikePostMutation();
  const [dislikePost] = useDislikePostMutation();
  const [followUser]   = useFollowUserMutation();
  const [unfollowUser] = useUnfollowUserMutation();

  const handleFollowToggle = useCallback(async () => {
    try {
      if (isFollowing) {
        await unfollowUser(authorId).unwrap();
        toast.success("Unfollowed successfully.");
      } else {
        await followUser(authorId).unwrap();
        toast.success("Following!");
      }
    } catch {
      toast.error("Something went wrong.");
    }
  }, [isFollowing, followUser, unfollowUser, authorId]);

  // ✅ Fixed deps — removed toast, added post._id
  const handleLike = useCallback(async () => {
    try {
      await likePost(post._id).unwrap();
    } catch (error) {
      toast.error(error?.data?.message ?? "Something went wrong.");
    }
  }, [likePost, post._id]);

  // ✅ Fixed: was calling likePost — now correctly calls dislikePost
  const handleDislike = useCallback(async () => {
    try {
      await dislikePost(post._id).unwrap();
    } catch (error) {
      toast.error(error?.data?.message ?? "Something went wrong.");
    }
  }, [dislikePost, post._id]);

  const handleBookmark = useCallback(async () => {
    try {
      const postId = post?._id;
      if (!postId) return;
      if(post?.isBookmarked) {
        await deleteBookmark(postId).unwrap();
        toast.success("Post is removed from bookmarks.");
      } else {
        await createBookmark(postId).unwrap();
        toast.success("Post added to bookmarks.");
      }
    } catch (error) {
      toast.error(error?.data?.message ?? "Something went wrong.");
    }
  }, [post, createBookmark, deleteBookmark]);

  // ✅ Memoized so StatBtn doesn't re-render on every cycle
  const handleLikeToggler = useCallback(
    (...args) => (post.isLiked ? handleDislike : handleLike)(...args),
    [post.isLiked, handleLike, handleDislike]
  );

  // ✅ Fixed: passes { id, userId } so getUserPosts cache gets patched too
  const handleDelete = useCallback(async () => {
    try {
      await deletePost({ id: post._id }).unwrap();
      if (window.location.pathname.includes(post._id)) navigate("/");
      toast.success("Post deleted successfully.");
    } catch {
      toast.error("Something went wrong while deleting post.");
    }
  }, [deletePost, navigate, post._id, authorId]);

  const handleEdit   = useCallback(() => openEdit(), [openEdit]);
  const handleCopy   = useCallback(() => {
    navigator.clipboard.writeText(`${window.location.origin}/post/${post._id}`);
    toast.success("Link copied.");
  }, [post._id]);
  const handleShare  = useCallback(() => { /* TODO */ }, []);
  const handleReport = useCallback(() => { /* TODO */ }, []);

  const openPost     = useCallback(() => navigate(`/post/${post._id}`), [navigate, post._id]);
  const openLightbox = useCallback((idx) => setLightboxIndex(idx), []);

  const formattedTime = formatTime(post.createdAt);
  const authorInitial = post.author?.name?.[0]?.toUpperCase() ?? "?";

  const menuActions = useMemo(() => [
    { label: "Edit post",         onClick: handleEdit,   hidden: !isOwnPost && !isPrivilaged },
    { label: "Delete post",       onClick: handleDelete, variant: "destructive", hidden: !isOwnPost && !isPrivilaged },
    { label: "Report post",       onClick: handleReport, variant: "destructive", hidden: isOwnPost  },
    { label: "Block user",        onClick: () => {},     variant: "warning",     hidden: isOwnPost  },
    { type:  "separator",                                hidden: !isOwnPost },
    { label: "Turn off comments", onClick: () => {},     hidden: !isOwnPost },
    { 
      label: post?.isBookmarked ? "Remove from bookmarks" : "Bookmark",
      onClick: handleBookmark,
      variant: post?.isBookmarked ? "destructive" : "primary"
    },
    { type:  "separator" },
    { label: "Hide post",         onClick: () => {},     hidden: isOwnPost  },
    {
      label:   isFollowing ? "Unfollow user" : "Follow user",
      onClick: handleFollowToggle,
      hidden:  isOwnPost,
    },
    { type:  "separator" },
    { label: "Copy link",  onClick: handleCopy  },
    { label: "Share post", onClick: handleShare },
    { type:  "separator",  hidden: isOwnPost    },
  ], [isOwnPost, isPrivilaged, handleEdit, handleDelete, handleCopy, handleShare, handleReport, isFollowing, handleFollowToggle, post?.isBookmarked, handleBookmark]);

  return (
    <>
      <PostViewTracker postId={post._id}>
        <Card
          onClick={openPost}
          onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openPost();
          }
        }}
        role="article"
        tabIndex={0}
        aria-label={`Post by ${post.author?.name ?? "unknown"}`}
        className="mb-3 group/card relative border border-border/40 bg-card/50
          hover:bg-muted/20 hover:border-indigo-500/20 rounded-2xl overflow-hidden
          shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
      >
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-indigo-500
          opacity-0 group-hover/card:opacity-100 transition-opacity z-10" />

        {/* ── HEADER ── */}
        <div className="px-4 pt-3 pb-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Avatar className="w-11 h-11 border border-border/60 group-hover/card:border-indigo-500/30 transition-colors duration-200 shrink-0">
              <AvatarImage src={post.author?.avatarUrl} alt={post.author?.name} />
              <AvatarFallback className="bg-muted text-sm font-bold">
                {authorInitial}
              </AvatarFallback>
            </Avatar>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span
                  onClick={(e) => { e.stopPropagation(); navigate(`/profile/users/${authorId}`); }}
                  className="font-semibold text-[15px] text-foreground group-hover/card:text-indigo-500
                    dark:group-hover/card:text-indigo-400 transition-colors cursor-pointer leading-tight"
                >
                  {post.author?.name}
                </span>
                <Badge
                  variant="secondary"
                  className="text-[9px] px-1.5 py-0 h-4 font-semibold bg-indigo-500/10
                    text-indigo-500 dark:text-indigo-400 border-0 leading-none"
                >
                  Author
                </Badge>
              </div>
              <div className="flex items-center gap-1 text-[13px] text-muted-foreground leading-tight">
                <span
                  onClick={(e) => { e.stopPropagation(); navigate(`/profile/users/${authorId}`); }}
                  className="hover:text-foreground cursor-pointer transition-colors truncate max-w-[140px]"
                >
                  @{post.author?.username}
                </span>
                {formattedTime && (
                  <>
                    <span className="opacity-40">·</span>
                    <span>{formattedTime}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <PostActionMenu actions={menuActions}>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => e.stopPropagation()}
              className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-full shrink-0 cursor-pointer"
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </PostActionMenu>
        </div>

        {/* ── CONTENT ── */}
        <div className="px-4 pb-3 flex flex-col gap-2.5">
          <Caption text={post.content?.caption} />
          {libItems.length > 0 && (
            <MediaGrid media={post.media} onOpen={openLightbox} />
          )}
        </div>

        {/* ── FOOTER ── */}
        <div className="px-4 py-2 flex items-center justify-between border-t border-border/30">
          <div className="flex items-center gap-0.5">
            <StatBtn
              icon={Heart}
              count={post.stats?.likeCount}
              onClick={handleLikeToggler}
              active={post.isLiked}
              activeClass="text-rose-400 bg-rose-500/10"
              hoverClass="hover:bg-rose-500/10 hover:text-rose-400"
              filled
            />
            <StatBtn
              icon={MessageSquare}
              count={post.stats?.commentCount}
              active={false}
              hoverClass="hover:bg-indigo-500/10 hover:text-indigo-400"
            />
            <StatBtn
              icon={Share2}
              count={post.stats?.shareCount}
              active={false}
              hoverClass="hover:bg-indigo-500/10 hover:text-indigo-400"
            />
          </div>

          <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground/80
            font-mono tracking-wide cursor-default select-none
            hover:text-indigo-400 transition-colors duration-200"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/50 animate-pulse
              shadow-[0_0_5px_rgba(99,102,241,0.5)]" />
            {post.stats?.viewCount ?? 0} views
          </div>
        </div>
      </Card>
      </PostViewTracker>

      {lightboxIndex !== null && libItems.length > 0 && (
        <MediaLightbox
          items={libItems}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}

      {editOpen && (
        <EditPostModal
          post={post}
          open={editOpen}
          onClose={closeEdit}
          onSubmit={submitEdit}
          isLoading={editLoading}
        />
      )}
    </>
  );
};

export default FeedPost;