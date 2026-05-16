import React from 'react';
import { Image } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Textarea } from "@/components/ui/textarea.jsx";
import Feed from './Feed.jsx';

const FeedView = ({ 
    user, 
    posts, 
    isLoading,
    isFetching,
    isError,
    hasNextPage,
    fetchNextPage,
    onCreatePost,
    emptyState,
}) => {

  return (
    <div className="flex flex-col w-full h-full pb-20">
      
      {/* ==================== 1. STICKY HEADER & TABS ==================== */}
      <header className="sticky top-0 z-10 h-12 bg-background/80 backdrop-blur-md border-b border-border flex items-center">
        <div className="flex w-full h-full">
          <button className="relative flex-1 flex items-center justify-center h-full hover:bg-accent/50 transition-colors cursor-pointer">
            <span className="text-sm font-semibold text-foreground">For You</span>
            <div className="absolute bottom-0 h-1 w-12 rounded-t-full bg-primary"></div>
          </button>
          <button className="relative flex-1 flex items-center justify-center h-full hover:bg-accent/50 transition-colors cursor-pointer">
            <span className="text-sm font-medium text-muted-foreground">Following</span>
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
              
              </div>
              <Button 
                className="rounded-full px-6 font-bold"
                onClick={() => onCreatePost("some text")} 
              >
                Post
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Feed
        posts={posts}
        isFetching={isFetching}
        isError={isError}
        isLoading={isLoading}
        hasNextPage={hasNextPage}
        fetchNextPage={fetchNextPage}
        emptyState={emptyState}
      />
    </div>
  );
};

export default FeedView;