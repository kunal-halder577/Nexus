import React, { useEffect, useRef, useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { X, UserPlus, UserCheck, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.jsx';
import { Button } from '@/components/ui/button.jsx';
import { cn } from '@/lib/utils.js';
import { Link } from 'react-router-dom';
import {
  useGetFollowersQuery,
  useGetFollowingQuery,
  useFollowUserMutation,
  useUnfollowUserMutation,
} from '@/features/follow/api/followApi';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '@/features/auth/authSlice.js';
import { toast } from 'sonner';

// ─── Individual user row ───────────────────────────────────────────────────────
function UserRow({ user, onClose }) {
  const currentUser = useSelector(selectCurrentUser);
  const isOwn = user._id === currentUser?._id;

  const [followUser, { isLoading: isFollowingLoading }] = useFollowUserMutation();
  const [unfollowUser, { isLoading: isUnfollowingLoading }] = useUnfollowUserMutation();

  const [localIsFollowing, setLocalIsFollowing] = useState(user?.isFollowing ?? false);

  useEffect(() => {
    setLocalIsFollowing(user?.isFollowing ?? false);
  }, [user?.isFollowing]);

  const handleToggle = useCallback(() => {
    const prev = localIsFollowing;
    setLocalIsFollowing(!prev);
    
    if (prev) {
      unfollowUser(user._id).unwrap().catch((err) => {
        setLocalIsFollowing(prev);
        toast.error(err?.data?.message || 'Action failed.');
      });
    } else {
      followUser(user._id).unwrap().catch((err) => {
        setLocalIsFollowing(prev);
        toast.error(err?.data?.message || 'Action failed.');
      });
    }
  }, [localIsFollowing, followUser, unfollowUser, user._id]);

  const isActionPending = isFollowingLoading || isUnfollowingLoading;

  const avatarSrc = user?.avatarUrl || '';
  const fallback = user?.name?.charAt(0)?.toUpperCase() || 'U';

  return (
    <div className="flex items-center gap-3 px-5 py-3 hover:bg-muted/40 transition-colors group">
      {/* Avatar → links to profile, closes modal */}
      <Link to={`/profile/users/${user._id}`} onClick={onClose} className="shrink-0">
        <Avatar className="h-10 w-10 ring-1 ring-border/50 group-hover:ring-indigo-400/50 transition-all">
          <AvatarImage src={avatarSrc} alt={user.name} />
          <AvatarFallback className="text-sm font-semibold">{fallback}</AvatarFallback>
        </Avatar>
      </Link>

      {/* Name + username */}
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

      {/* Follow toggle — hidden for own account */}
      {!isOwn && (
        <Button
          size="sm"
          variant={localIsFollowing ? 'outline' : 'default'}
          disabled={isActionPending}
          onClick={handleToggle}
          className={cn(
            'h-8 w-24 shrink-0 text-xs font-medium relative overflow-hidden transition-colors duration-300 cursor-pointer',
            localIsFollowing
              ? 'border-border text-muted-foreground hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-500/20'
          )}
        >
          {localIsFollowing ? (
            <span className="flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5" /> Following
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <UserPlus className="w-3.5 h-3.5" /> Follow
            </span>
          )}
        </Button>
      )}
    </div>
  );
}

const LIMIT = 20;

// ─── List with pagination + infinite scroll ────────────────────────────────────
function UserList({ userId, type, onClose }) {
  const isFollowers = type === 'followers';

  const [page, setPage]         = useState(1);
  const [allUsers, setAllUsers] = useState([]);
  const [hasMore, setHasMore]   = useState(true);
  const sentinelRef             = useRef(null);

  // MongoDB ObjectIds survive Redux serialization as objects in some setups.
  // Coerce once here so every query arg and cache key is always a plain string.
  const id = String(userId);

  // Both hooks unconditional — inactive one is suppressed via `skip`.
  // Arg shape matches followApi exactly so RTK hits the right cache entry.
  const {
    data: followersData,
    isLoading: followersLoading,
    isFetching: followersFetching,
    isError: followersError,
  } = useGetFollowersQuery(
    { id, page, limit: LIMIT },
    { skip: !isFollowers }
  );

  const {
    data: followingData,
    isLoading: followingLoading,
    isFetching: followingFetching,
    isError: followingError,
  } = useGetFollowingQuery(
    { id, page, limit: LIMIT },
    { skip: isFollowers }
  );

  const data       = isFollowers ? followersData   : followingData;
  const isLoading  = isFollowers ? followersLoading : followingLoading;
  const isFetching = isFollowers ? followersFetching : followingFetching;
  const isError    = isFollowers ? followersError   : followingError;

  // Reset accumulated list whenever the tab switches
  useEffect(() => {
    setPage(1);
    setAllUsers([]);
    setHasMore(true);
  }, [type]);

  // Append each new page into allUsers
  useEffect(() => {
    if (!data) return;

    const rawDocs  = data?.data?.followers ?? data?.data?.following ?? [];
    const newUsers = isFollowers
      ? rawDocs.map((doc) => doc.followerId)
      : rawDocs.map((doc) => doc.followingId);

    // hasMore: prefer explicit flag from backend, fall back to page-size heuristic
    setHasMore(data?.data?.hasMore ?? newUsers.length === LIMIT);

    setAllUsers((prev) => {
      // Page 1 always replaces — handles tab-reset race where old data fires late
      if (page === 1) return newUsers;
      // Subsequent pages: deduplicate by _id in case optimistic updates
      // already prepended a user that now also arrives in a fetched page
      const existingIds = new Set(prev.map((u) => u._id));
      return [...prev, ...newUsers.filter((u) => !existingIds.has(u._id))];
    });
  }, [data]);

  // Scroll sentinel — IntersectionObserver fires when the invisible div at the
  // bottom of the list enters the viewport, triggering the next page fetch
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore || isFetching) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !isFetching) {
          setPage((p) => p + 1);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, isFetching]);

  // ── Initial skeleton (page 1 only) ──────────────────────────────────────────
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
        <Users className="h-8 w-8 opacity-20" />
        <p className="text-sm">Failed to load.</p>
      </div>
    );
  }

  if (!isLoading && allUsers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
        <Users className="h-8 w-8 opacity-20" />
        <p className="text-sm font-medium">
          {isFollowers ? 'No followers yet.' : 'Not following anyone yet.'}
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border/40">
      {allUsers.map((user) => (
        <UserRow key={user._id} user={user} onClose={onClose} />
      ))}

      {/* Invisible sentinel — sits just below the last row.
          IntersectionObserver watches this to trigger the next page. */}
      <div ref={sentinelRef} className="h-1" aria-hidden />

      {/* Spinner shown while fetching pages 2+ */}
      {isFetching && page > 1 && (
        <div className="flex justify-center py-4">
          <span className="h-4 w-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        </div>
      )}

      {/* End-of-list marker */}
      {!hasMore && allUsers.length > 0 && (
        <p className="text-center text-xs text-muted-foreground/40 py-4 select-none">
          {allUsers.length} {isFollowers ? 'followers' : 'following'} · all loaded
        </p>
      )}
    </div>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────
export default function FollowersModal({ userId, initialTab = 'followers', onClose }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const listRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  // Entrance animation — flip to true one frame after mount
  useEffect(() => {
    const raf = requestAnimationFrame(() => setIsVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  // Scroll-lock + scrollbar compensation (same pattern as AvatarLightbox)
  useEffect(() => {
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, []);

  // Escape to close
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Reset scroll when switching tabs
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = 0;
  }, [activeTab]);

  // Animated close
  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(onClose, 220);
  }, [onClose]);

  return ReactDOM.createPortal(
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-end sm:items-center justify-center transition-all duration-200',
        isVisible ? 'opacity-100' : 'opacity-0'
      )}
      onClick={handleClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className={cn(
          'relative z-10 w-full sm:max-w-md bg-background rounded-t-2xl sm:rounded-2xl',
          'shadow-2xl ring-1 ring-border/40 flex flex-col',
          'max-h-[82vh] sm:max-h-[70vh]',
          'transition-transform duration-220 ease-out',
          isVisible
            ? 'translate-y-0 sm:scale-100'
            : 'translate-y-8 sm:scale-95'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle — mobile only */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden" aria-hidden>
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 sm:pt-5 border-b border-border/50 shrink-0">
          <h2 className="font-bold text-base text-foreground tracking-tight">
            Connections
          </h2>
          <button
            onClick={handleClose}
            aria-label="Close"
            className="rounded-full p-1.5 text-muted-foreground cursor-pointer hover:text-foreground hover:bg-muted/60 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border/50 shrink-0">
          {['followers', 'following'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'flex-1 py-2.5 text-sm font-medium capitalize relative transition-colors cursor-pointer',
                activeTab === tab
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {tab}
              {activeTab === tab && (
                <span className="absolute bottom-0 left-0 w-full h-[2px] bg-indigo-600 rounded-t-full" />
              )}
            </button>
          ))}
        </div>

        {/* Scrollable list */}
        <div ref={listRef} className="overflow-y-auto flex-1 overscroll-contain">
          <UserList
            userId={userId}
            type={activeTab}
            onClose={handleClose}  // handleClose (animated) — not the raw onClose prop
          />
        </div>
      </div>

      <style>{`
        .duration-220 { transition-duration: 220ms; }
      `}</style>
    </div>,
    document.body
  );
}
