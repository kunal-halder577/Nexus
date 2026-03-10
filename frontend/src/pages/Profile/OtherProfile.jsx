import React, { useState, useEffect } from 'react';
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

export default function OtherUserProfile() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("posts");
  const [isFollowing, setIsFollowing] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const { data: user, isLoading, isError, error } = useGetUserByIdQuery(id);
  const currentUser = useSelector(selectCurrentUser);
  const isOwnProfile = id === currentUser._id;

  // Scroll lock + Escape key
  useEffect(() => {
    if (!avatarOpen) return;

    // Compensate for scrollbar width to prevent layout jump
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setAvatarOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [avatarOpen]);

  const handleFollowToggle = () => {
    setIsFollowing(!isFollowing);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-32 w-32 bg-muted rounded-full"></div>
          <div className="h-4 w-48 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-muted-foreground">
        <ShieldCheck className="h-12 w-12 mb-4 opacity-20" />
        <p>Profile not found or private.</p>
        <p className="text-xs mt-2 opacity-50">{error?.data?.message || "Unknown error"}</p>
      </div>
    );
  }

  if (!user) return null;

  const avatarSrc = user?.avatarUrl || '';
  const avatarFallback = user?.name?.charAt(0) || 'U';

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">

      {/* ── Avatar Lightbox ── */}
      {avatarOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={() => setAvatarOpen(false)}
        >
          {/* Tailwind-native backdrop blur */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-2xl backdrop-saturate-150" />

          {/* Close button */}
          <button
            className="absolute top-4 right-4 z-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 p-2 text-white transition-colors"
            onClick={() => setAvatarOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>

          {/* Avatar + name */}
          <div
            className="relative z-10 flex flex-col items-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt={user?.name || 'Profile picture'}
                className="rounded-full w-72 h-72 sm:w-96 sm:h-96 object-cover shadow-2xl ring-4 ring-white/20"
                style={{ animation: 'lightboxPop 0.2s cubic-bezier(0.34,1.56,0.64,1) both' }}
              />
            ) : (
              <div
                className="rounded-full w-72 h-72 sm:w-96 sm:h-96 bg-muted flex items-center justify-center text-8xl font-bold text-muted-foreground shadow-2xl ring-4 ring-white/20"
                style={{ animation: 'lightboxPop 0.2s cubic-bezier(0.34,1.56,0.64,1) both' }}
              >
                {avatarFallback}
              </div>
            )}
            <p className="text-white/80 text-sm font-medium tracking-wide">
              {user?.name || 'User'}
            </p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes lightboxPop {
          from { opacity: 0; transform: scale(0.85); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>

      <main className="container max-w-4xl mx-auto px-0 sm:px-4 mt-4">

        {/* Profile Header Card */}
        <Card className="overflow-hidden border-none sm:border shadow-none sm:shadow-lg">
          {/* Banner Image */}
          <div className="h-48 w-full bg-slate-900 relative">
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-60 transition-opacity"
              style={{ 
                backgroundImage: `url('${user.bannerUrl || "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&q=80"}')`
              }}
            />
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

              {/* Clickable Avatar */}
              <button
                onClick={() => setAvatarOpen(true)}
                className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 group"
                aria-label="View profile picture"
              >
                <Avatar className="h-32 w-32 border border-border/50 bg-background transition-all group-hover:ring-2 group-hover:ring-ring group-hover:ring-offset-1 group-hover:brightness-90">
                  <AvatarImage src={avatarSrc} alt="@user" />
                  <AvatarFallback className="text-4xl">{avatarFallback}</AvatarFallback>
                </Avatar>
              </button>

              {/* Action Buttons */}
              <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                {isOwnProfile ? (
                  <>
                    <Link 
                      to={'/profile/update/me'}
                      className={cn(
                        buttonVariants({ variant: 'outline', size: 'default' }),
                        "flex-1 sm:flex-none"
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
                    <Button 
                      onClick={handleFollowToggle}
                      variant={isFollowing ? "outline" : "default"}
                      className={cn(
                        "flex-1 sm:flex-none h-9 px-6 w-full sm:w-auto transition-all duration-200 cursor-pointer", 
                        isFollowing 
                          ? "border-border text-muted-foreground hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive" 
                          : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20"
                      )}
                    >
                      {isFollowing ? (
                        <><UserCheck className="w-4 h-4 mr-1.5" /> Following</>
                      ) : (
                        <><UserPlus className="w-4 h-4 mr-1.5" /> Follow</>
                      )}
                    </Button>

                    <Button 
                      variant="secondary" 
                      className="flex-1 sm:flex-none h-9 px-4 shadow-sm border border-transparent hover:border-border/50 cursor-pointer"
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

            {/* User Info */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  {user.name || "Unknown User"}
                </h1>
                {user.isPremium && <Award className="h-5 w-5 text-indigo-500 fill-indigo-500/10" />}
              </div>
              <p className="text-muted-foreground font-medium text-sm">
                @{user.username}
              </p>
            </div>

            {/* Bio */}
            <p className="mt-4 text-sm leading-relaxed max-w-2xl whitespace-pre-line text-muted-foreground/90">
              {user.bio || "Digital Architect & Visual Storyteller. Creating premium experiences on the Nexus platform. ✦"}
            </p>

            {/* Metadata */}
            <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                <span>{user.location || "Global"}</span>
              </div>
              
              {(user.website || user.username) && (
                <div className="flex items-center gap-1 hover:text-indigo-500 transition-colors cursor-pointer">
                  <LinkIcon className="h-3.5 w-3.5" />
                  <a href={user.website ? `https://${user.website}` : '#'} target="_blank" rel="noreferrer" className="hover:underline">
                    {user.website || `nexus.online/${user.username}`}
                  </a>
                </div>
              )}

              <div className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                <span>
                  Joined {user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-GB", { month: 'long', year: 'numeric' }) : "recently"}
                </span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-8 mt-6 pt-6 border-t border-border/50">
              <div className="text-center sm:text-left cursor-pointer hover:opacity-80 transition-opacity">
                <span className="block font-bold text-lg text-foreground">{user.stats?.followers || "0"}</span>
                <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Followers</span>
              </div>
              <div className="text-center sm:text-left cursor-pointer hover:opacity-80 transition-opacity">
                <span className="block font-bold text-lg text-foreground">{user.stats?.following || "0"}</span>
                <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Following</span>
              </div>
              <div className="text-center sm:text-left">
                <span className="block font-bold text-lg text-foreground">{user.stats?.reputation || "0"}</span>
                <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Reputation</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Content Tabs */}
        <div className="mt-6">
          <div className="flex items-center w-full border-b bg-background/80 sticky top-0 -mt-10 pt-10 z-40 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
            <button 
              onClick={() => setActiveTab('posts')}
              className={`flex-1 pb-3 pt-2 text-sm font-medium transition-all relative ${activeTab === 'posts' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <span className="flex items-center justify-center gap-2">
                <Grid className="h-4 w-4" /> Posts
              </span>
              {activeTab === 'posts' && <span className="absolute bottom-0 left-0 w-full h-[2px] bg-indigo-600" />}
            </button>
            <button 
              onClick={() => setActiveTab('media')}
              className={`flex-1 pb-3 pt-2 text-sm font-medium transition-all relative ${activeTab === 'media' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <span className="flex items-center justify-center gap-2">
                <ImageIcon className="h-4 w-4" /> Media
              </span>
              {activeTab === 'media' && <span className="absolute bottom-0 left-0 w-full h-[2px] bg-indigo-600" />}
            </button>
          </div>

          {activeTab === 'posts' && <ProfileFeedContainer userId={user?._id} />}
        </div>
      </main>
    </div>
  );
}
