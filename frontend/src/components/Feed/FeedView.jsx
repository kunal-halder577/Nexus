import React, { useEffect } from 'react';
import { Image, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import FeedPost from '@/features/post/components/FeedPost';
import { useInView } from 'react-intersection-observer'; 
const FeedView = ({ 
    user, 
    posts, 
    isLoading,
    isFetching,
    isError,
    hasNextPage,
    fetchNextPage,
    onCreatePost
}) => {
  const { ref: sentinelRef, inView } = useInView({
    rootMargin: '200px', 
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetching) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetching, fetchNextPage]);

  if (isError) return <div className="p-4 text-red-500">Error loading feed.</div>;

  if (isLoading && posts.length === 0) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="animate-spin text-indigo-500" />
      </div>
    );
  }

  
  return (
    <div className="flex flex-col w-full h-full pb-20">
      
      {/* ==================== 1. STICKY HEADER & TABS ==================== */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
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
                {/* ... other buttons ... */}
              </div>
              <Button 
                className="rounded-full px-6 font-bold"
                onClick={() => onCreatePost("some text")} // Hooked up to props!
              >
                Post
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== 3. POST LIST ==================== */}
      <div className="flex flex-col">
        {(posts ?? []).map(post => (
          <FeedPost key={post._id} post={post} />
        ))}
      </div>
      
      {/* This is the invisible sensor. We attach the 'ref' here. */}
      <div ref={sentinelRef} className="h-4 w-full" />

     {/* Show a spinner at the bottom ONLY when fetching page 2, 3, etc. */}
      {isFetching && posts.length > 0 && (
        <div className="flex justify-center p-4 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}

      {/* If there are no more pages, optionally show an end message */}
      {!hasNextPage && posts.length > 0 && (
        <div className="text-center p-4 text-sm text-muted-foreground">
          You've caught up on all posts!
        </div>
      )}

    </div>
  );
};

export default FeedView;