import React from 'react';
import { BookmarkIcon } from 'lucide-react';
import { useGetUserBookmarksInfiniteQuery } from '@/features/bookmark/api/bookmarkApi.js';
import Feed from '@/components/Feed/Feed.jsx';

function EmptyBookmarks() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
      <BookmarkIcon className="h-10 w-10 opacity-20" />
      <p className="text-sm font-medium">You haven't bookmarked any posts yet.</p>
    </div>
  );
}

const BookmarksPage = () => {
  const { data, isLoading, isError, isFetching, fetchNextPage, hasNextPage } = useGetUserBookmarksInfiniteQuery();
  const posts = data?.pages?.flatMap(page => page.data?.data ?? []) ?? [];

  return (
    <div className="flex flex-col w-full h-full pb-20">
      <header className="sticky top-0 z-10 h-14 bg-background/80 backdrop-blur-md border-b border-border flex items-center px-4">
        <h1 className="text-lg font-semibold text-foreground">Bookmarks</h1>
      </header>
      
      <Feed
        posts={posts}
        isFetching={isFetching}
        isError={isError}
        isLoading={isLoading}
        hasNextPage={hasNextPage}
        fetchNextPage={fetchNextPage}
        emptyState={<EmptyBookmarks />}
      />
    </div>
  );
};

export default BookmarksPage;
