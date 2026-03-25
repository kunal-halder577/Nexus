import React, { useEffect, useRef, useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { X, Heart, UserPlus, UserCheck } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { useGetPostLikersQuery } from '@/features/Like/api/likeApi.js';
import { useFollowUserMutation, useUnfollowUserMutation } from '@/features/follow/api/followApi.js';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '@/features/auth/authSlice';
import { toast } from 'sonner';

const LIMIT = 20;

// ─── Individual liker row ─────────────────────────────────────────────────────
function LikerRow({ user, onClose }) {
  const currentUser = useSelector(selectCurrentUser);
  const isOwn = user._id === currentUser?._id;

  const [followUser,   { isLoading: isFollowing  }] = useFollowUserMutation();
  const [unfollowUser, { isLoading: isUnfollowing }] = useUnfollowUserMutation();

  const isFollowingUser = user?.isFollowing ?? false;
  const isPending       = isFollowing || isUnfollowing;

  const handleToggle = useCallback(async () => {
    try {
      if (isFollowingUser) {
        await unfollowUser(user._id).unwrap();
      } else {
        await followUser(user._id).unwrap();
      }
    } catch (err) {
      toast.error(err?.data?.message || 'Action failed.');
    }
  }, [isFollowingUser, followUser, unfollowUser, user._id]);

  const fallback = user?.name?.charAt(0)?.toUpperCase() || 'U';

  return (
    <div className="flex items-center gap-3 px-5 py-3 hover:bg-muted/40 transition-colors group">
      <Link to={`/profile/users/${user._id}`} onClick={onClose} className="shrink-0">
        <Avatar className="h-10 w-10 ring-1 ring-border/50 group-hover:ring-indigo-400/50 transition-all">
          <AvatarImage src={user?.avatarUrl || ''} alt={user.name} />
          <AvatarFallback className="text-sm font-semibold">{fallback}</AvatarFallback>
        </Avatar>
      </Link>

      <div className="flex-1 min-w-0">
        <Link
          to={`/profile/users/${user._id}`}
          onClick={onClose}
          className="block font-semibold text-sm text-foreground truncate hover:text-indigo-500 transition-colors leading-snug"
        >
          {user.name || 'Unknown'}
        </Link>
        <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
        {user.bio && (
          <p className="text-xs text-muted-foreground/70 truncate mt-0.5 hidden sm:block">
            {user.bio}
          </p>
        )}
      </div>

      {!isOwn && (
        <Button
          size="sm"
          type="button"
          variant={isFollowingUser ? 'outline' : 'default'}
          disabled={isPending}
          onClick={handleToggle}
          className={cn(
            'h-8 w-24 shrink-0 text-xs font-medium transition-colors duration-300 cursor-pointer',
            isFollowingUser
              ? 'border-border text-muted-foreground hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-500/20'
          )}
        >
          {isPending ? (
            <span className="h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
          ) : isFollowingUser ? (
            <span className="flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5" aria-hidden="true" /> Following
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <UserPlus className="w-3.5 h-3.5" aria-hidden="true" /> Follow
            </span>
          )}
        </Button>
      )}
    </div>
  );
}

// ─── Paginated list with infinite scroll ──────────────────────────────────────
// Receives key={postId} from the parent so it fully remounts on postId change —
// no manual reset effect needed.
function LikersList({ postId, onClose }) {
  const [page, setPage]         = useState(1);
  const [allUsers, setAllUsers] = useState([]);
  const [hasMore, setHasMore]   = useState(true);
  const sentinelRef             = useRef(null);

  // Keep a ref so the IntersectionObserver callback always reads the latest
  // isFetching value without needing to be recreated on every fetch cycle.
  const isFetchingRef = useRef(false);

  const { data, isLoading, isFetching, isError } = useGetPostLikersQuery(
    { id: postId, page, limit: LIMIT }
  );

  useEffect(() => {
    isFetchingRef.current = isFetching;
  }, [isFetching]);

  // Accumulate pages. `page` is in the dep array so the `page === 1` reset
  // check never runs against a stale value.
  useEffect(() => {
    if (!data) return;
    const newUsers = data?.data?.likers ?? [];
    setHasMore(data?.data?.pagination?.hasNextPage ?? newUsers.length === LIMIT);
    setAllUsers((prev) => {
      if (page === 1) return newUsers;
      const existingIds = new Set(prev.map((u) => u._id));
      return [...prev, ...newUsers.filter((u) => !existingIds.has(u._id))];
    });
  }, [data, page]);

  // Stable observer — isFetching is read via ref so `hasMore` is the only
  // dependency, preventing the double-page-increment on each fetch cycle.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isFetchingRef.current) {
          setPage((p) => p + 1);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore]);

  if (isLoading && page === 1) {
    return (
      <div className="flex flex-col divide-y divide-border/40">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-5 py-3 animate-pulse">
            <div className="h-10 w-10 rounded-full bg-muted shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-32 bg-muted rounded" />
              <div className="h-2.5 w-20 bg-muted rounded" />
            </div>
            <div className="h-8 w-24 bg-muted rounded-md shrink-0" />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
        <Heart className="h-8 w-8 opacity-20" aria-hidden="true" />
        <p className="text-sm">Failed to load likes.</p>
      </div>
    );
  }

  if (!isLoading && allUsers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
        <Heart className="h-8 w-8 opacity-20" aria-hidden="true" />
        <p className="text-sm font-medium">No likes yet.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border/40">
      {allUsers.map((user) => (
        <LikerRow key={user._id} user={user} onClose={onClose} />
      ))}

      <div ref={sentinelRef} className="h-1" aria-hidden="true" />

      {isFetching && page > 1 && (
        <div className="flex justify-center py-4">
          <span className="h-4 w-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        </div>
      )}

      {!hasMore && allUsers.length > 0 && (
        <p className="text-center text-xs text-muted-foreground/40 py-4 select-none">
          {allUsers.length} likes · all loaded
        </p>
      )}
    </div>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────
// triggerRef — the element that opened the modal; focus returns to it on close.
export default function LikersModal({ postId, onClose, triggerRef }) {
  const closeButtonRef = useRef(null);
  const closeTimerRef  = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  // Fade in
  useEffect(() => {
    const raf = requestAnimationFrame(() => setIsVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  // Cancel any in-flight close timer if the component unmounts early
  useEffect(() => () => clearTimeout(closeTimerRef.current), []);

  // Scroll lock
  useEffect(() => {
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, []);

  // Move focus into the modal when it opens
  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  // handleClose is stable; the Escape listener re-registers whenever it changes
  // so it never captures a stale reference.
  const handleClose = useCallback(() => {
    setIsVisible(false);
    closeTimerRef.current = setTimeout(() => {
      onClose();
      triggerRef?.current?.focus(); // return focus to the triggering element
    }, 220);
  }, [onClose, triggerRef]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleClose]);

  return ReactDOM.createPortal(
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-end sm:items-center justify-center transition-all duration-200',
        isVisible ? 'opacity-100' : 'opacity-0'
      )}
      onClick={handleClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="likers-modal-title"
        className={cn(
          'relative z-10 w-full sm:max-w-md bg-background rounded-t-2xl sm:rounded-2xl',
          'shadow-2xl ring-1 ring-border/40 flex flex-col',
          'max-h-[82vh] sm:max-h-[70vh]',
          'transition-transform duration-220 ease-out',
          isVisible ? 'translate-y-0 sm:scale-100' : 'translate-y-8 sm:scale-95'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle — mobile only */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden" aria-hidden="true">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 sm:pt-5 border-b border-border/50 shrink-0">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500" aria-hidden="true" />
            <h2
              id="likers-modal-title"
              className="font-bold text-base text-foreground tracking-tight"
            >
              Liked by
            </h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={handleClose}
            aria-label="Close likes dialog"
            className="rounded-full p-1.5 text-muted-foreground cursor-pointer hover:text-foreground hover:bg-muted/60 transition-colors"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* key={postId} remounts LikersList on postId change, avoiding a
            stale-list flash and making an explicit reset effect unnecessary. */}
        <div className="overflow-y-auto flex-1 overscroll-contain">
          <LikersList key={postId} postId={postId} onClose={handleClose} />
        </div>
      </div>

      <style>{`.duration-220 { transition-duration: 220ms; }`}</style>
    </div>,
    document.body
  );
}
