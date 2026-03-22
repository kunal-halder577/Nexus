import React from 'react';
import Feed from '@/components/Feed/Feed.jsx';
import { useGetUserPostsInfiniteQuery } from '@/features/post/api/postApi';

const ProfileFeedContainer = ({ userId, emptyState }) => {
  const { data, isLoading, isError, isFetching ,fetchNextPage, hasNextPage } = useGetUserPostsInfiniteQuery(userId);
  
  const posts = data?.pages?.flatMap(page => page.data?.data ?? []) ?? [];
  
  return (
    <Feed
      posts={posts}
      isLoading={isLoading}
      isFetching={isFetching}
      hasNextPage={hasNextPage}
      fetchNextPage={fetchNextPage}
      isError={isError}
      emptyState={emptyState}
    />
  );
};

export default ProfileFeedContainer;