import FeedPost from '@/features/post/components/FeedPost.jsx';
import { FileText, Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { useInView } from 'react-intersection-observer';

const Feed = ({ 
    posts, 
    isLoading,
    isFetching,
    isError,
    hasNextPage,
    fetchNextPage,
    emptyState,
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

  // Inside Feed, wherever you currently handle the empty case:
  if (!isLoading && posts.length === 0) {
    return emptyState ?? (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
        <FileText className="h-10 w-10 opacity-20" />
        <p className="text-sm font-medium">No posts yet.</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col w-full h-full pb-20">
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
export default Feed;