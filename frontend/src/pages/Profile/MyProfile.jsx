import React, { useState } from 'react';
import {
  MapPin,
  Link as LinkIcon,
  Calendar,
  ShieldCheck,
  Award,
  MoreHorizontal,
  Image as ImageIcon,
  Grid,
  FileText,
} from 'lucide-react';
import { Card } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.jsx';
import { Button, buttonVariants } from '@/components/ui/button.jsx';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '@/features/auth/authSlice.js';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils.js';
import ProfileFeedContainer from './ProfileFeedContainer.jsx';
import FollowersModal from './FollowersModal.jsx';
import AvatarLightbox from './AvatarLightbox.jsx';
import { useGetUserByIdQuery } from '@/features/user/api/userApi.js';

// ─── Stat button — accessible, no layout shift on label change ────────────────
// `w-20` is wide enough for any count + label combo. `tabular-nums` prevents
// digit-width jitter. The label slot is fixed-height so "Follower" vs
// "Followers" never shifts siblings.
function StatButton({ count, label, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label={`${count} ${label} — click to view list`}
      className={cn(
        'w-20 shrink-0 text-center sm:text-left cursor-pointer',
        'rounded-lg py-1 -my-1 px-1 -mx-1',         // invisible padding for larger hit area
        'hover:opacity-80 transition-opacity',
        'focus-visible:outline-none focus-visible:ring-2',
        'focus-visible:ring-indigo-500 focus-visible:ring-offset-2'
      )}
    >
      <span className="block font-bold text-lg text-foreground tabular-nums leading-tight">
        {count}
      </span>
      {/* min-w prevents the parent from resizing when label flips */}
      <span className="block text-xs text-muted-foreground uppercase tracking-wide font-medium min-w-[4rem]">
        {label}
      </span>
    </button>
  );
}

// ─── Empty state for tabs ─────────────────────────────────────────────────────
function EmptyTab({ icon: Icon, message }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
      <Icon className="h-10 w-10 opacity-20" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function UserProfile() {
  const [activeTab, setActiveTab]     = useState('posts');
  const [avatarOpen, setAvatarOpen]   = useState(false);
  const [followModal, setFollowModal] = useState(null); // null | 'followers' | 'following'

  // Use auth slice only for the ID — avoids stale data after edits/follows
  const currentUser = useSelector(selectCurrentUser);
  const userId      = currentUser?._id;

  // Fresh profile data from RTK Query — always up-to-date
  const {
    data: user,
    isLoading,
    isError,
  } = useGetUserByIdQuery(userId, { skip: !userId });

  // Fallback to auth slice during the initial fetch so the page isn't blank
  const profile        = user ?? currentUser;
  const avatarSrc      = profile?.avatarUrl || '';
  const avatarFallback = profile?.name?.charAt(0)?.toUpperCase() || 'U';

  const followerCount = profile?.stats?.followerCount ?? 0;
  const followerLabel = followerCount === 1 ? 'Follower' : 'Followers';

  const joinDate = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-GB', {
        month: 'long',
        year: 'numeric',
      })
    : null;

  // ── Loading skeleton ─────────────────────────────────────────────────────
  if (isLoading && !currentUser) {
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

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-muted-foreground gap-3">
        <ShieldCheck className="h-12 w-12 opacity-20" />
        <p className="font-medium">Could not load your profile.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">

      {/* AvatarLightbox — portal, owns scroll-lock + Escape */}
      {avatarOpen && (
        <AvatarLightbox
          src={avatarSrc}
          fallback={avatarFallback}
          name={profile?.name}
          onClose={() => setAvatarOpen(false)}
        />
      )}

      {/* FollowersModal — portal, owns scroll-lock + Escape */}
      {followModal && (
        <FollowersModal
          userId={userId}
          initialTab={followModal}
          onClose={() => setFollowModal(null)}
        />
      )}

      <main className="container max-w-4xl mx-auto px-0 sm:px-4 mt-4">

        {/* ── Profile Header Card ─────────────────────────────────────────── */}
        <Card className="overflow-hidden border-none sm:border shadow-none sm:shadow-lg">

          {/* Banner */}
          <div className="h-48 w-full bg-gradient-to-r from-slate-900 to-slate-800 relative">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-40 mix-blend-overlay" />
            {profile?.isPremium && (
              <div className="absolute top-4 right-4">
                <Badge className="bg-black/30 text-white backdrop-blur-md border-white/10">
                  <ShieldCheck className="w-3 h-3 mr-1 text-emerald-400" /> Premium
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
                <Avatar className="h-32 w-32 border border-border/50 transition-all group-hover:ring-2 group-hover:ring-ring group-hover:ring-offset-1 group-hover:brightness-90 cursor-pointer">
                  <AvatarImage src={avatarSrc} alt={profile?.name || 'User avatar'} />
                  <AvatarFallback className="text-4xl">{avatarFallback}</AvatarFallback>
                </Avatar>
              </button>

              {/* Action buttons */}
              <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
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
              </div>
            </div>

            {/* Name + username */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                  {profile?.name || 'Your Name'}
                </h1>
                {profile?.isPremium && (
                  <Award className="h-5 w-5 text-indigo-500 fill-indigo-500/10" />
                )}
              </div>
              <p className="text-muted-foreground font-medium text-sm">
                @{profile?.username || 'username'}
              </p>
            </div>

            {/* Bio */}
            {profile?.bio && (
              <p className="mt-4 text-sm leading-relaxed max-w-2xl whitespace-pre-line text-muted-foreground/90">
                {profile.bio}
              </p>
            )}

            {/* Metadata */}
            <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
              {profile?.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{profile.location}</span>
                </div>
              )}
              {profile?.website && (
                <div className="flex items-center gap-1 hover:text-indigo-500 transition-colors">
                  <LinkIcon className="h-3.5 w-3.5" />
                  <a
                    href={`https://${profile.website}`}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline"
                  >
                    {profile.website}
                  </a>
                </div>
              )}
              {joinDate && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Joined {joinDate}</span>
                </div>
              )}
            </div>

            {/* Stats — all <button> for a11y: keyboard nav + screen reader support */}
            <div className="flex gap-6 mt-6 pt-6 border-t border-border/50">
              <StatButton
                count={followerCount}
                label={followerLabel}
                onClick={() => setFollowModal('followers')}
              />
              <StatButton
                count={profile?.stats?.followingCount ?? 0}
                label="Following"
                onClick={() => setFollowModal('following')}
              />
              {/* Reputation is not clickable — plain div is correct here */}
              <div className="w-24 shrink-0 text-center sm:text-left">
                <span className="block font-bold text-lg text-foreground tabular-nums leading-tight">
                  {profile?.stats?.reputation ?? 0}
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
            className="flex items-center w-full border-b bg-background/80 sticky top-0 -mt-10 pt-10 z-40 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60"
          >
            {[
              { id: 'posts', icon: Grid,      label: 'Posts' },
              { id: 'media', icon: ImageIcon, label: 'Media' },
            ].map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                role="tab"
                aria-selected={activeTab === id}
                aria-controls={`tabpanel-${id}`}
                id={`tab-${id}`}
                onClick={() => setActiveTab(id)}
                className={cn(
                  'flex-1 pb-3 pt-2 text-sm font-medium transition-all relative cursor-pointer',
                  activeTab === id
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <span className="flex items-center justify-center gap-2">
                  <Icon className="h-4 w-4" />
                  {label}
                </span>
                {activeTab === id && (
                  <span className="absolute bottom-0 left-0 w-full h-[2px] bg-indigo-600 rounded-t-full" />
                )}
              </button>
            ))}
          </div>

          {/* Posts tab */}
          <div
            role="tabpanel"
            id="tabpanel-posts"
            aria-labelledby="tab-posts"
            hidden={activeTab !== 'posts'}
          >
            <ProfileFeedContainer
              userId={userId}
              emptyState={
                <EmptyTab
                  icon={FileText}
                  message="You haven't posted anything yet."
                />
              }
            />
          </div>

          {/* Media tab */}
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
