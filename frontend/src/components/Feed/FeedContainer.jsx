import React from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '@/features/auth/authSlice';
import { useGetFeedPostsInfiniteQuery } from '@/features/post/api/postApi';
import FeedView from './FeedView';
import { Image } from 'lucide-react';

function EmptyTab({ icon: Icon, message }) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
        <Icon className="h-10 w-10 opacity-20" />
        <p className="text-sm font-medium">{message}</p>
      </div>
    );
}

const FeedContainer = () => {
  const user = useSelector(selectCurrentUser);
  const { data, isLoading, isError, isFetching ,fetchNextPage, hasNextPage } = useGetFeedPostsInfiniteQuery();
  
  const posts = data?.pages?.flatMap(page => page.data?.data ?? []) ?? [];

  const handleCreatePost = (postContent) => {
    console.log("Creating post:", postContent);
  };
 
  return (
    <FeedView
      user={user}
      posts={posts}
      isLoading={isLoading}
      isFetching={isFetching}
      hasNextPage={hasNextPage}
      fetchNextPage={fetchNextPage}
      isError={isError}
      onCreatePost={handleCreatePost}
      emptyState={
        <EmptyTab
          icon={Image}
          message={"Follow other users to see posts."} 
        />
      }
    />
  );
};

export default FeedContainer;