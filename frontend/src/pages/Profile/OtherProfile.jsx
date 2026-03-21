import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import {
  MapPin,
  Link as LinkIcon,
  Calendar,
  ShieldCheck,
  Award,
  MoreHorizontal,
  Image as ImageIcon,
  Grid,
  UserPlus,
  UserCheck,
  MessageCircle,
  X,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button, buttonVariants } from '@/components/ui/button';
import { Link, useParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useGetUserByIdQuery } from '@/features/user/api/userApi';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '@/features/auth/authSlice';
import ProfileFeedContainer from './ProfileFeedContainer';
import {
  useFollowUserMutation,
  useGetFollowStatusQuery,
  useUnfollowUserMutation,
} from '@/features/follow/api/followApi';
import { toast } from 'sonner';

// ─── Avatar Lightbox (rendered in a portal so fixed positioning is safe) ───────
function AvatarLightbox({ src, fallback, name, onClose }) {
  useEffect(() => {
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-2xl backdrop-saturate-150" />

      <button
        className="absolute top-4 right-4 z-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 p-2 text-white transition-colors"
        onClick={onClose}
        aria-label="Close"
      >
        <X className="h-5 w-5" />
      </button>

      <div
        className="relative z-10 flex flex-col items-center gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        {src ? (
          <img
            src={src}
            alt={name || 'Profile picture'}
            className="rounded-full w-72 h-72 sm:w-96 sm:h-96 object-cover shadow-2xl ring-4 ring-white/20"
            style={{ animation: 'lightboxPop 0.2s cubic-bezier(0.34,1.56,0.64,1) both' }}
          />
        ) : (
          <div
            className="rounded-full w-72 h-72 sm:w-96 sm:h-96 bg-muted flex items-center justify-center text-8xl font-bold text-muted-foreground shadow-2xl ring-4 ring-white/20"
            style={{ animation: 'lightboxPop 0.2s cubic-bezier(0.34,1.56,0.64,1) both' }}
          >
            {fallback}
          </div>
        )}
        <p className="text-white/80 text-sm font-medium tracking-wide">{name || 'User'}</p>
      </div>

      <style>{`
        @keyframes lightboxPop {
          from { opacity: 0; transform: scale(0.85); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>,
    document.body
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function OtherUserProfile() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('posts');
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [isJustFollowed, setIsJustFollowed] = useState(false);
  const [followParticles, setFollowParticles] = useState([]);

  const { data: user, isLoading, isError, error } = useGetUserByIdQuery(id);
  const { data: isFollowingData, isLoading: isLoadingFollowStatus } =
    useGetFollowStatusQuery(id);

  const [followUser, { isLoading: isFollowingLoading }] = useFollowUserMutation();
  const [unfollowUser, { isLoading: isUnfollowingLoading }] = useUnfollowUserMutation();

  const currentUser = useSelector(selectCurrentUser);
  const isOwnProfile = id === currentUser?._id;

  // Derive follow state from the nested query shape:
  // { success, msg, data: { isFollowing, status } }
  const isFollowing = isFollowingData?.data?.isFollowing ?? false;
  const isFollowActionPending = isFollowingLoading || isUnfollowingLoading;

  // ─── Follow handler ──────────────────────────────────────────────────────────
  const handleFollow = useCallback(async () => {
    try {
      await followUser(id).unwrap();
      // ── Spawn 6 hearts with varied size, horizontal drift & timing ──────────
      const HEART_COLORS = ['#f472b6','#fb7185','#e879f9','#f9a8d4','#c084fc','#ff6b8a'];
      const SWAYS        = [-10, 6, -4, 8, -7, 3];      // horizontal drift (px)
      const SIZES        = ['11px','9px','13px','8px','11px','10px'];
      const DELAYS       = [0, 120, 60, 200, 90, 160];   // stagger (ms)
      const DURATIONS    = [1100, 1300, 1050, 1400, 1150, 1250];
      const OFFSETS      = [-22, -8, 4, 16, -14, 26];   // left offset from center

      setFollowParticles(
        Array.from({ length: 6 }, (_, i) => ({
          id: i,
          color: HEART_COLORS[i],
          size: SIZES[i],
          delay: DELAYS[i],
          duration: DURATIONS[i],
          offsetX: OFFSETS[i],
          sway: SWAYS[i],
        }))
      );
      setIsJustFollowed(true);
      setTimeout(() => {
        setIsJustFollowed(false);
        setFollowParticles([]);
      }, 1700);
    } catch (err) {
      toast.error(err?.data?.message || err?.message || 'Failed to follow user.');
    }
  }, [followUser, id]);

  // ─── Unfollow handler ────────────────────────────────────────────────────────
  const handleUnfollow = useCallback(async () => {
    try {
      await unfollowUser(id).unwrap();
    } catch (err) {
      toast.error(err?.data?.message || err?.message || 'Failed to unfollow user.');
    }
  }, [unfollowUser, id]);

  const handleFollowToggle = isFollowing ? handleUnfollow : handleFollow;

  // ─── Derived helpers ─────────────────────────────────────────────────────────
  const avatarSrc = user?.avatarUrl || '';
  const avatarFallback = user?.name?.charAt(0)?.toUpperCase() || 'U';

  const followerCount = user?.stats?.followerCount ?? 0;
  const followerLabel = followerCount === 1 ? 'Follower' : 'Followers';

  const joinDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-GB', {
        month: 'long',
        year: 'numeric',
      })
    : 'recently';

  // ─── Loading state ───────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-32 w-32 bg-muted rounded-full" />
          <div className="h-4 w-48 bg-muted rounded" />
          <div className="h-3 w-32 bg-muted rounded" />
        </div>
      </div>
    );
  }

  // ─── Error state ─────────────────────────────────────────────────────────────
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-muted-foreground gap-3">
        <ShieldCheck className="h-12 w-12 opacity-20" />
        <p className="font-medium">Profile not found or private.</p>
        <p className="text-xs opacity-50">{error?.data?.message || 'Unknown error'}</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Avatar lightbox — rendered in a portal to avoid fixed-positioning issues */}
      {avatarOpen && (
        <AvatarLightbox
          src={avatarSrc}
          fallback={avatarFallback}
          name={user?.name}
          onClose={() => setAvatarOpen(false)}
        />
      )}

      <main className="container max-w-4xl mx-auto px-0 sm:px-4 mt-4">

        {/* ── Profile Header Card ─────────────────────────────────────────── */}
        <Card className="overflow-hidden border-none sm:border shadow-none sm:shadow-lg">

          {/* Banner */}
          <div className="h-48 w-full relative overflow-hidden">
            {/* Base gradient — always visible whether or not a bannerUrl exists */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700" />

            {/* Soft glow blobs for depth */}
            <div
              className="absolute inset-0 opacity-50"
              style={{
                backgroundImage:
                  'radial-gradient(ellipse at 20% 60%, rgba(139,92,246,0.7) 0%, transparent 55%),' +
                  'radial-gradient(ellipse at 80% 20%, rgba(99,102,241,0.6) 0%, transparent 50%)',
              }}
            />

            {/* User banner image — overlaid on top if provided */}
            {user.bannerUrl && (
              <div
                className="absolute inset-0 bg-cover bg-center opacity-60 transition-opacity"
                style={{ backgroundImage: `url('${user.bannerUrl}')` }}
              />
            )}

            {user.isPremium && (
              <div className="absolute top-4 right-4">
                <Badge className="bg-black/30 text-white backdrop-blur-md border-white/10">
                  <ShieldCheck className="w-3 h-3 mr-1 text-yellow-400" /> Pro Member
                </Badge>
              </div>
            )}
          </div>

          <div className="px-6 pb-6 relative">
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between -mt-12 mb-4 gap-4">

              {/* Clickable avatar */}
              <button
                onClick={() => setAvatarOpen(true)}
                className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 group"
                aria-label="View profile picture"
              >
                <Avatar className="h-32 w-32 border border-border/50 bg-background transition-all group-hover:ring-2 group-hover:ring-ring group-hover:ring-offset-1 group-hover:brightness-90">
                  <AvatarImage src={avatarSrc} alt={user?.name || 'User avatar'} />
                  <AvatarFallback className="text-4xl">{avatarFallback}</AvatarFallback>
                </Avatar>
              </button>

              {/* Action buttons */}
              <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                {isOwnProfile ? (
                  <>
                    <Link
                      to="/profile/update/me"
                      className={cn(
                        buttonVariants({ variant: 'outline', size: 'default' }),
                        'flex-1 sm:flex-none'
                      )}
                    >
                      Edit Profile
                    </Link>
                    <Button variant="outline" size="icon" className="h-9 w-9 cursor-pointer">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    {/*
                      ── Follow / Unfollow button ──────────────────────────────
                      Layout: fixed w-32, three absolute label layers — no reflow.
                      Animation on follow: 6 hearts float upward from the button,
                      each slightly different in size, drift, and delay so they
                      feel organic rather than mechanical. No shimmer, no ring,
                      no squish — deliberately quiet.
                    */}
                    <div className="relative shrink-0" style={{ isolation: 'isolate' }}>

                      {followParticles.map((p) => (
                        <span
                          key={p.id}
                          aria-hidden="true"
                          style={{
                            position: 'absolute',
                            left: `calc(50% + ${p.offsetX}px)`,
                            top: '4px',
                            fontSize: p.size,
                            color: p.color,
                            lineHeight: 1,
                            pointerEvents: 'none',
                            zIndex: 10,
                            userSelect: 'none',
                            '--sway': `${p.sway}px`,
                            animation: `heartFloat ${p.duration}ms cubic-bezier(0.25,0.46,0.45,0.94) ${p.delay}ms forwards`,
                          }}
                        >
                          ♥
                        </span>
                      ))}

                      <Button
                        onClick={handleFollowToggle}
                        disabled={isFollowActionPending || isLoadingFollowStatus}
                        variant={isFollowing ? 'outline' : 'default'}
                        className={cn(
                          'relative h-9 w-32 overflow-hidden transition-colors duration-700 cursor-pointer',
                          isFollowing
                            ? 'border-border text-muted-foreground hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20'
                        )}
                      >
                        {/* Layer 0 — skeleton (initial follow status not yet known) */}
                        <span
                          className={cn(
                            'absolute inset-0 flex items-center justify-center transition-opacity duration-150',
                            isLoadingFollowStatus ? 'opacity-100' : 'opacity-0 pointer-events-none'
                          )}
                        >
                          <span className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                        </span>

                        {/* Layer 1 — "Follow" (not yet following, idle, status known) */}
                        <span
                          className={cn(
                            'absolute inset-0 flex items-center justify-center gap-1.5 transition-opacity duration-150',
                            !isFollowing && !isFollowActionPending && !isLoadingFollowStatus
                              ? 'opacity-100'
                              : 'opacity-0 pointer-events-none'
                          )}
                        >
                          <UserPlus className="w-4 h-4" />
                          Follow
                        </span>

                        {/* Layer 2 — "Following" (following, idle, status known) */}
                        <span
                          className={cn(
                            'absolute inset-0 flex items-center justify-center gap-1.5 transition-opacity duration-150',
                            isFollowing && !isFollowActionPending && !isLoadingFollowStatus
                              ? 'opacity-100'
                              : 'opacity-0 pointer-events-none'
                          )}
                        >
                          <UserCheck
                            className="w-4 h-4"
                            style={isJustFollowed
                              ? { animation: 'heartIconPop 0.55s cubic-bezier(0.34,1.56,0.64,1) both' }
                              : {}}
                          />
                          Following
                        </span>

                        {/* Layer 3 — spinner (follow/unfollow action in flight) */}
                        <span
                          className={cn(
                            'absolute inset-0 flex items-center justify-center gap-1.5 transition-opacity duration-150',
                            isFollowActionPending
                              ? 'opacity-100'
                              : 'opacity-0 pointer-events-none'
                          )}
                        >
                          <span className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                          {isFollowing ? 'Unfollowing…' : 'Following…'}
                        </span>
                      </Button>

                      <style>{`
                        @keyframes heartFloat {
                          0%   { transform: translateY(0)    translateX(0)               scale(0.4); opacity: 0;   }
                          10%  { opacity: 0.85; }
                          45%  { transform: translateY(-38px) translateX(var(--sway, 4px)) scale(1);   opacity: 0.8; }
                          100% { transform: translateY(-90px) translateX(0)               scale(0.6); opacity: 0;   }
                        }
                        @keyframes heartIconPop {
                          0%   { transform: scale(0.5); opacity: 0; }
                          65%  { transform: scale(1.12); opacity: 1; }
                          100% { transform: scale(1);    opacity: 1; }
                        }
                      `}</style>
                    </div>

                    {/* Message */}
                    <Button
                      variant="secondary"
                      className="flex-1 sm:flex-none h-9 px-4 shadow-sm border border-transparent hover:border-border/50 cursor-pointer"
                      onClick={() => toast.info('Messaging coming soon!')}
                    >
                      <MessageCircle className="w-4 h-4 mr-1.5" /> Message
                    </Button>

                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <MoreHorizontal className="h-5 w-5" />
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* User info */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  {user.name || 'Unknown User'}
                </h1>
                {user.isPremium && (
                  <Award className="h-5 w-5 text-indigo-500 fill-indigo-500/10" />
                )}
              </div>
              <p className="text-muted-foreground font-medium text-sm">@{user.username}</p>
            </div>

            {/* Bio */}
            <p className="mt-4 text-sm leading-relaxed max-w-2xl whitespace-pre-line text-muted-foreground/90">
              {user.bio ||
                'Digital Architect & Visual Storyteller. Creating premium experiences on the Nexus platform. ✦'}
            </p>

            {/* Metadata */}
            <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
              {user.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{user.location}</span>
                </div>
              )}

              {(user.website || user.username) && (
                <div className="flex items-center gap-1 hover:text-indigo-500 transition-colors">
                  <LinkIcon className="h-3.5 w-3.5" />
                  <a
                    href={user.website ? `https://${user.website}` : '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline"
                  >
                    {user.website || `nexus.online/${user.username}`}
                  </a>
                </div>
              )}

              <div className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                <span>Joined {joinDate}</span>
              </div>
            </div>

            {/* Stats
                Two sources of shift fixed:
                1. w-20/w-24 on each block so label changes ("Follower" vs "Followers")
                   can't push siblings sideways.
                2. tabular-nums on counts so every digit occupies the same width —
                   9→10 or 99→100 never resizes the number span.
            */}
            <div className="flex gap-6 mt-6 pt-6 border-t border-border/50">
              <div className="w-20 shrink-0 text-center sm:text-left cursor-pointer hover:opacity-80 transition-opacity">
                <span className="block font-bold text-lg text-foreground tabular-nums">
                  {followerCount}
                </span>
                <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                  {followerLabel}
                </span>
              </div>
              <div className="w-20 shrink-0 text-center sm:text-left cursor-pointer hover:opacity-80 transition-opacity">
                <span className="block font-bold text-lg text-foreground tabular-nums">
                  {user.stats?.followingCount ?? 0}
                </span>
                <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                  Following
                </span>
              </div>
              <div className="w-24 shrink-0 text-center sm:text-left">
                <span className="block font-bold text-lg text-foreground tabular-nums">
                  {user.stats?.reputation ?? 0}
                </span>
                <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                  Reputation
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* ── Content Tabs ────────────────────────────────────────────────── */}
        <div className="mt-6">
          <div className="flex items-center w-full border-b bg-background/80 sticky top-0 -mt-10 pt-10 z-40 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
            <TabButton
              active={activeTab === 'posts'}
              onClick={() => setActiveTab('posts')}
              icon={<Grid className="h-4 w-4" />}
              label="Posts"
            />
            <TabButton
              active={activeTab === 'media'}
              onClick={() => setActiveTab('media')}
              icon={<ImageIcon className="h-4 w-4" />}
              label="Media"
            />
          </div>

          <div className={activeTab === 'posts' ? 'block' : 'hidden'}>
            <ProfileFeedContainer userId={user?._id} />
          </div>
          <div className={activeTab === 'media' ? 'block' : 'hidden'}>
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-2">
              <ImageIcon className="h-10 w-10 opacity-20" />
              <p className="text-sm">No media yet.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ─── Small tab button sub-component ───────────────────────────────────────────
function TabButton({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex-1 pb-3 pt-2 text-sm font-medium transition-all relative',
        active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
      )}
    >
      <span className="flex items-center justify-center gap-2">
        {icon}
        {label}
      </span>
      {active && (
        <span className="absolute bottom-0 left-0 w-full h-[2px] bg-indigo-600 rounded-t-full" />
      )}
    </button>
  );
}
