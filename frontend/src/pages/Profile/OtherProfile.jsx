import React, { useState, useCallback } from 'react';
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
  FileText,
} from 'lucide-react';
import { Card } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.jsx';
import { Button, buttonVariants } from '@/components/ui/button.jsx';
import { Link, useParams } from 'react-router-dom';
import { cn } from '@/lib/utils.js';
import { useGetUserByIdQuery } from '@/features/user/api/userApi.js';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '@/features/auth/authSlice.js';
import ProfileFeedContainer from './ProfileFeedContainer.jsx';
import {
  useFollowUserMutation,
  useGetFollowStatusQuery,
  useUnfollowUserMutation,
} from '@/features/follow/api/followApi';
import { toast } from 'sonner';
import FollowersModal from './FollowersModal.jsx';
import AvatarLightbox from './AvatarLightbox.jsx';
import UserNotFound from '../Error/UserNotFoundPage.jsx';

// ─── Stat button — accessible, no layout shift on label change ────────────────
function StatButton({ count, label, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label={`${count} ${label} — click to view list`}
      className={cn(
        'w-20 shrink-0 text-center sm:text-left',
        'rounded-lg py-1 -my-1 px-1 -mx-1',
        'hover:opacity-80 transition-opacity',
        'focus-visible:outline-none focus-visible:ring-2',
        'focus-visible:ring-indigo-500 focus-visible:ring-offset-2 cursor-pointer'
      )}
    >
      <span className="block font-bold text-lg text-foreground tabular-nums leading-tight">
        {count}
      </span>
      <span className="block text-xs text-muted-foreground uppercase tracking-wide font-medium min-w-[4rem]">
        {label}
      </span>
    </button>
  );
}

// ─── Empty tab state ──────────────────────────────────────────────────────────
function EmptyTab({ icon: Icon, message }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
      <Icon className="h-10 w-10 opacity-20" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}

// ─── Tab button sub-component ─────────────────────────────────────────────────
function TabButton({ id, active, onClick, icon, label }) {
  return (
    <button
      role="tab"
      id={`tab-${id}`}
      aria-selected={active}
      aria-controls={`tabpanel-${id}`}
      onClick={onClick}
      className={cn(
        'flex-1 pb-3 pt-2 text-sm font-medium transition-all relative cursor-pointer',
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

// ─── Main Component ────────────────────────────────────────────────────────────
export default function OtherUserProfile() {
  const { id } = useParams();
  const [activeTab, setActiveTab]     = useState('posts');
  const [avatarOpen, setAvatarOpen]   = useState(false);
  const [followModal, setFollowModal] = useState(null); // null | 'followers' | 'following'
  const [isJustFollowed, setIsJustFollowed] = useState(false);
  const [followParticles, setFollowParticles] = useState([]);

  const { data: user, isLoading, isError, error } = useGetUserByIdQuery(id);
  const { data: isFollowingData, isLoading: isLoadingFollowStatus } =
    useGetFollowStatusQuery(id);

  const [followUser, { isLoading: isFollowingLoading }] = useFollowUserMutation();
  const [unfollowUser, { isLoading: isUnfollowingLoading }] = useUnfollowUserMutation();

  const currentUser    = useSelector(selectCurrentUser);
  const isOwnProfile   = id === currentUser?._id;
  const isFollowing    = isFollowingData?.data?.isFollowing ?? false;
  const isFollowActionPending = isFollowingLoading || isUnfollowingLoading;

  // ─── Follow handler ──────────────────────────────────────────────────────────
  const handleFollow = useCallback(() => {
    // 1. Fire optimistic UI effects immediately
    const HEART_COLORS = ['#f472b6','#fb7185','#e879f9','#f9a8d4','#c084fc','#ff6b8a'];
    const SWAYS        = [-10, 6, -4, 8, -7, 3];
    const SIZES        = ['11px','9px','13px','8px','11px','10px'];
    const DELAYS       = [0, 120, 60, 200, 90, 160];
    const DURATIONS    = [1100, 1300, 1050, 1400, 1150, 1250];
    const OFFSETS      = [-22, -8, 4, 16, -14, 26];

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

    // 2. Fire network request in background
    followUser(id).unwrap().catch((err) => {
      toast.error(err?.data?.message || err?.message || 'Failed to follow user.');
    });
  }, [followUser, id]);

  // ─── Unfollow handler ────────────────────────────────────────────────────────
  const handleUnfollow = useCallback(() => {
    // Fire network request in background
    unfollowUser(id).unwrap().catch((err) => {
      toast.error(err?.data?.message || err?.message || 'Failed to unfollow user.');
    });
  }, [unfollowUser, id]);

  const handleFollowToggle = isFollowing ? handleUnfollow : handleFollow;

  // ─── Derived helpers ─────────────────────────────────────────────────────────
  const avatarSrc      = user?.avatarUrl || '';
  const avatarFallback = user?.name?.charAt(0)?.toUpperCase() || 'U';
  const followerCount  = user?.stats?.followerCount ?? 0;
  const followerLabel  = followerCount === 1 ? 'Follower' : 'Followers';

  const joinDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
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
  if (error || !user) return <UserNotFound />;

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">

      {/* AvatarLightbox — portal, owns scroll-lock + Escape */}
      {avatarOpen && (
        <AvatarLightbox
          src={avatarSrc}
          fallback={avatarFallback}
          name={user?.name}
          onClose={() => setAvatarOpen(false)}
        />
      )}

      {/* FollowersModal — portal, owns scroll-lock + Escape */}
      {followModal && (
        <FollowersModal
          userId={user._id}
          initialTab={followModal}
          onClose={() => setFollowModal(null)}
        />
      )}

      <main className="container max-w-4xl mx-auto px-0 sm:px-4 mt-4">

        {/* ── Profile Header Card ─────────────────────────────────────────── */}
        <Card className="overflow-hidden border-none sm:border shadow-none sm:shadow-lg">

          {/* Banner */}
          <div className="h-32 sm:h-48 w-full relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700" />
            <div
              className="absolute inset-0 opacity-50"
              style={{
                backgroundImage:
                  'radial-gradient(ellipse at 20% 60%, rgba(139,92,246,0.7) 0%, transparent 55%),' +
                  'radial-gradient(ellipse at 80% 20%, rgba(99,102,241,0.6) 0%, transparent 50%)',
              }}
            />
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

          <div className="px-4 sm:px-6 pb-6 relative">
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between -mt-10 sm:-mt-12 mb-4 gap-4">

              {/* Clickable avatar */}
              <button
                onClick={() => setAvatarOpen(true)}
                className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 group"
                aria-label="View profile picture"
              >
                <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border border-border/50 bg-background transition-all group-hover:ring-2 group-hover:ring-ring group-hover:ring-offset-1 group-hover:brightness-90 cursor-pointer">
                  <AvatarImage src={avatarSrc} alt={user?.name || 'User avatar'} />
                  <AvatarFallback className="text-3xl sm:text-4xl">{avatarFallback}</AvatarFallback>
                </Avatar>
              </button>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2 w-full sm:w-auto mt-2 sm:mt-0">
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
                      Fixed w-32 with three absolute label layers — no reflow.
                      6 hearts float on follow, organic stagger, no ring/squish.
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
                        disabled={isLoadingFollowStatus}
                        variant={isFollowing ? 'outline' : 'default'}
                        className={cn(
                          'relative h-9 w-32 overflow-hidden transition-colors duration-700 cursor-pointer',
                          isFollowing
                            ? 'border-border text-muted-foreground hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20'
                        )}
                      >
                        {/* Layer 0 — skeleton while follow status loads */}
                        <span className={cn(
                          'absolute inset-0 flex items-center justify-center transition-opacity duration-150',
                          isLoadingFollowStatus ? 'opacity-100' : 'opacity-0 pointer-events-none'
                        )}>
                          <span className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                        </span>

                        {/* Layer 1 — Follow (not following, idle) */}
                        <span className={cn(
                          'absolute inset-0 flex items-center justify-center gap-1.5 transition-opacity duration-150',
                          !isFollowing && !isLoadingFollowStatus
                            ? 'opacity-100' : 'opacity-0 pointer-events-none'
                        )}>
                          <UserPlus className="w-4 h-4" /> Follow
                        </span>

                        {/* Layer 2 — Following (following, idle) */}
                        <span className={cn(
                          'absolute inset-0 flex items-center justify-center gap-1.5 transition-opacity duration-150',
                          isFollowing && !isLoadingFollowStatus
                            ? 'opacity-100' : 'opacity-0 pointer-events-none'
                        )}>
                          <UserCheck
                            className="w-4 h-4"
                            style={isJustFollowed
                              ? { animation: 'heartIconPop 0.55s cubic-bezier(0.34,1.56,0.64,1) both' }
                              : {}}
                          />
                          Following
                        </span>
                      </Button>

                      <style>{`
                        @keyframes heartFloat {
                          0%   { transform: translateY(0) translateX(0) scale(0.4); opacity: 0; }
                          10%  { opacity: 0.85; }
                          45%  { transform: translateY(-38px) translateX(var(--sway, 4px)) scale(1); opacity: 0.8; }
                          100% { transform: translateY(-90px) translateX(0) scale(0.6); opacity: 0; }
                        }
                        @keyframes heartIconPop {
                          0%   { transform: scale(0.5); opacity: 0; }
                          65%  { transform: scale(1.12); opacity: 1; }
                          100% { transform: scale(1); opacity: 1; }
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
            {user.bio && (
              <p className="mt-4 text-sm leading-relaxed max-w-2xl whitespace-pre-line text-muted-foreground/90">
                {user.bio}
              </p>
            )}

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

            {/* Stats — <StatButton> for a11y on clickable ones */}
            <div className="flex gap-4 sm:gap-6 mt-6 pt-6 border-t border-border/50">
              <StatButton
                count={followerCount}
                label={followerLabel}
                onClick={() => setFollowModal('followers')}
              />
              <StatButton
                count={user.stats?.followingCount ?? 0}
                label="Following"
                onClick={() => setFollowModal('following')}
              />
              {/* Reputation is not interactive — plain div is correct */}
              <div className="w-24 shrink-0 text-center sm:text-left">
                <span className="block font-bold text-lg text-foreground tabular-nums leading-tight">
                  {user.stats?.reputation ?? 0}
                </span>
                <span className="block text-xs text-muted-foreground uppercase tracking-wide font-medium">
                  Reputation
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* ── Content Tabs ────────────────────────────────────────────────── */}
        <div className="mt-6">
          <div
            role="tablist"
            aria-label="Profile content"
            className="flex items-center w-full border-b bg-background/80 sticky top-0 -mt-10 pt-10 z-20 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60"
          >
            <TabButton
              id="posts"
              active={activeTab === 'posts'}
              onClick={() => setActiveTab('posts')}
              icon={<Grid className="h-4 w-4" />}
              label="Posts"
            />
            <TabButton
              id="media"
              active={activeTab === 'media'}
              onClick={() => setActiveTab('media')}
              icon={<ImageIcon className="h-4 w-4" />}
              label="Media"
            />
          </div>

          {/* Posts tab panel */}
          <div
            role="tabpanel"
            id="tabpanel-posts"
            aria-labelledby="tab-posts"
            hidden={activeTab !== 'posts'}
          >
            <ProfileFeedContainer
              userId={user._id}
              emptyState={
                <EmptyTab
                  icon={FileText}
                  message="This user hasn't posted anything yet."
                />
              }
            />
          </div>

          {/* Media tab panel */}
          <div
            role="tabpanel"
            id="tabpanel-media"
            aria-labelledby="tab-media"
            hidden={activeTab !== 'media'}
          >
            <EmptyTab icon={ImageIcon} message="No media uploaded yet." />
          </div>
        </div>
      </main>
    </div>
  );
}
