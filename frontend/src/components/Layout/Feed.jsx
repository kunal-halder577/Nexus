import React from 'react';
import { Image, Smile, MapPin, Sparkles, MessageCircle, Repeat2, Heart, Share } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import PostItem from './Post';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '@/features/auth/authSlice';

const Feed = () => {
  const user = useSelector(selectCurrentUser);

  return (
    <div className="flex flex-col w-full h-full pb-20">
      
      {/* ==================== 1. STICKY HEADER & TABS ==================== */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
        {/* Mobile Sidebar Trigger would go here if needed later */}
        
        <div className="flex w-full">
          <button className="flex-1 py-4 font-bold text-foreground border-b-4 border-primary hover:bg-accent transition-colors">
            For You
          </button>
          <button className="flex-1 py-4 font-medium text-muted-foreground border-b-4 border-transparent hover:bg-accent transition-colors">
            Following
          </button>
        </div>
      </header>

      {/* ==================== 2. CREATE POST BOX ==================== */}
      <div className="p-4 border-b border-border">
        <div className="flex gap-4">
          <Avatar className="w-10 h-10">
            <AvatarImage src={user?.avatarUrl} />
            <AvatarFallback>{user?.name?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <Textarea 
              placeholder="What's happening?" 
              className="min-h-[60px] text-lg border-0 focus-visible:ring-0 p-0 pt-1 resize-none bg-transparent"
            />
            
            <div className="flex items-center justify-between pt-4 border-t border-border mt-2">
              <div className="flex gap-1 text-primary">
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10 hover:text-primary">
                  <Image className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10 hover:text-primary">
                  <Smile className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10 hover:text-primary">
                  <MapPin className="h-5 w-5" />
                </Button>
              </div>

              <Button className="rounded-full px-6 font-bold">
                Post
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== 3. POST LIST ==================== */}
      <div className="flex flex-col">
        <PostItem 
          name="Sarah Chen"
          username="@sarahcodes"
          time="2h"
          content="Just finished setting up the new layout grid for my project. CSS Subgrid is an absolute game changer! 🚀 #webdev #css"
          likes={243}
          comments={12}
          reposts={4}
        />
        <PostItem 
          name="Dev Daily"
          username="@devdaily"
          time="5h"
          content="What's your preferred stack for 2024? We are seeing a massive shift back to server-side rendering."
          likes={1200}
          comments={89}
          reposts={340}
        />
        <PostItem 
          name="Alex Doe"
          username="@alexdoe"
          time="12h"
          content="Exploring the new design system. Really impressed with how clean these components look. Great work by the UI team!"
          likes={88}
          comments={3}
          reposts={1}
        />
      </div>

    </div>
  );
};

export default Feed;