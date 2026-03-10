import React, { useState } from 'react';
import { 
  MapPin, 
  Link as LinkIcon, 
  Calendar, 
  ShieldCheck, 
  Award,
  MoreHorizontal,
  Image as ImageIcon,
  Grid
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button, buttonVariants } from '@/components/ui/button';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '@/features/auth/authSlice';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import ProfileFeedContainer from './ProfileFeedContainer';

export default function UserProfile() {
  const [activeTab, setActiveTab] = useState("posts");
  const user = useSelector(selectCurrentUser);

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <main className="container max-w-4xl mx-auto px-0 sm:px-4 mt-4">

       {/* Profile Header Card */}
        <Card className="overflow-hidden border-none sm:border shadow-none sm:shadow-lg">
            {/* Banner Image */}
            <div className="h-48 w-full bg-gradient-to-r from-slate-900 to-slate-800 relative">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-40 mix-blend-overlay"></div>
                <div className="absolute top-4 right-4">
                    <Badge className="bg-black/30 text-white backdrop-blur-md border-white/10">
                    <ShieldCheck className="w-3 h-3 mr-1 text-emerald-400" /> Premium
                    </Badge>
                </div>
            </div>

            <div className="px-6 pb-6 relative">
                {/* Avatar & Action Buttons Row */}
                <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between -mt-12 mb-4 gap-4">
                
                    <Avatar className="h-32 w-32 cursor-pointer border border-border/50 transition-all hover:ring-2 hover:ring-ring hover:ring-offset-1">
                        <AvatarImage src={user?.avatarUrl || ''} alt="@user" />
                        <AvatarFallback>
                          {user?.name?.charAt(0) ||'U'}
                        </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                        <Link 
                          to={'/profile/update/me'}
                          className={cn(
                            buttonVariants({ variant: 'outline', size: 'default'}),
                            "flex-1 sm:flex-none"
                          )} 
                        >
                          Edit Profile
                        </Link>                        
                        <Button variant="outline" size="icon" className="h-9 w-9 cursor-pointer">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* User Info */}
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                            {user?.name || 'Jane Doe'}
                        </h1>
                        <Award className="h-5 w-5 text-indigo-500" />
                    </div>
                    <p className="text-muted-foreground font-medium text-sm">
                        {`@${user?.username || 'username'}`}
                    </p>
                </div>

                {/* Bio */}
                <p className="mt-4 text-sm leading-relaxed max-w-2xl">
                Digital Architect & Visual Storyteller. Creating premium experiences on the Nexus platform. 
                Always chasing the perfect gradient. ✦
                </p>

                {/* Metadata */}
                <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>San Francisco, CA</span>
                </div>
                <div className="flex items-center gap-1 hover:text-indigo-500 transition-colors cursor-pointer">
                    <LinkIcon className="h-3.5 w-3.5" />
                    <span>nexus.design/alex</span>
                </div>
                <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Joined March 2024</span>
                </div>
                </div>

                {/* Stats */}
                <div className="flex gap-6 mt-6 pt-6 border-t">
                <div className="text-center sm:text-left">
                    <span className="block font-bold text-lg text-foreground">
                      {user?.followers ?? 0}
                    </span>
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">Followers</span>
                </div>
                <div className="text-center sm:text-left">
                    <span className="block font-bold text-lg text-foreground">
                      {user?.following ?? 0}
                    </span>
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">Following</span>
                </div>
                <div className="text-center sm:text-left">
                    <span className="block font-bold text-lg text-foreground">
                      {user?.reputation ?? 0} {/* Fixed typo here */}
                    </span>
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">Reputation</span>
                </div>
                </div>
            </div>
        </Card>

        {/* Content Tabs */}
        <div className="mt-6">
          <div className="flex items-center w-full border-b bg-background/80 sticky top-0 -mt-10 pt-10 z-40 backdrop-blur-xl supports-backdrop-filter:bg-background/60">
            <button 
              onClick={() => setActiveTab('posts')}
              className={`flex-1 pb-3 pt-2 text-sm font-medium transition-all relative ${activeTab === 'posts' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <span className="flex items-center justify-center gap-2">
                <Grid className="h-4 w-4" /> Posts
              </span>
              {activeTab === 'posts' && <span className="absolute bottom-0 left-0 w-full h-[2px] bg-indigo-600"></span>}
            </button>
            <button 
              onClick={() => setActiveTab('media')}
              className={`flex-1 pb-3 pt-2 text-sm font-medium transition-all relative ${activeTab === 'media' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <span className="flex items-center justify-center gap-2">
                <ImageIcon className="h-4 w-4" /> Media
              </span>
              {activeTab === 'media' && <span className="absolute bottom-0 left-0 w-full h-[2px] bg-indigo-600"></span>}
            </button>
          </div>

          {/* Grid Content Placeholder */}
          {activeTab === 'posts' && 
            <ProfileFeedContainer userId={user?._id} />
          }
        </div>
      </main>
    </div>
  );
};