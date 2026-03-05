import React from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '@/features/auth/authSlice';
import { useGetFeedPostsInfiniteQuery } from '@/features/post/api/postApi';
import FeedView from './FeedView';

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
    />
  );
};

export default FeedContainer;