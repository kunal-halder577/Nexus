import { baseApi } from "@/lib/api/baseApi"

// ─── Helpers ──────────────────────────────────────────────────────────────────

const patchPostBookmarkState = (api, postId, isBookmarked) => {
  const applyToPost = (post) => {
    post.isBookmarked = isBookmarked;
  };

  const state = api.getState();
  const queries = state[baseApi.reducerPath].queries;

  // Attempt to find the full post object from existing cache
  let fullPost = null;
  for (const query of Object.values(queries)) {
    if (query?.status !== "fulfilled") continue;
    
    if (["getFeedPosts", "getUserPosts", "getUserBookmarks"].includes(query.endpointName)) {
      for (const page of query.data?.pages || []) {
        const p = page.data?.data?.find((p) => p._id === postId);
        if (p) {
          fullPost = { ...p };
          break;
        }
      }
    } else if (query.endpointName === "getPostById" && query.originalArgs === postId) {
      if (query.data?.data) {
        fullPost = { ...query.data.data };
      }
    }
    if (fullPost) break;
  }

  // 1. Patch Main Feed
  const feedPatch = api.dispatch(
    baseApi.util.updateQueryData("getFeedPosts", undefined, (draft) => {
      for (const page of draft.pages) {
        const post = page.data?.data?.find((p) => p._id === postId);
        if (post) { applyToPost(post); break; }
      }
    })
  );

  // 2. Patch All User Feeds
  const userFeedPatches = Object.values(queries)
    .filter((e) => e?.endpointName === "getUserPosts" && e?.status === "fulfilled")
    .map((e) =>
      api.dispatch(
        baseApi.util.updateQueryData("getUserPosts", e.originalArgs, (draft) => {
          for (const page of draft.pages) {
            const post = page.data?.data?.find((p) => p._id === postId);
            if (post) { applyToPost(post); break; }
          }
        })
      )
    );

  // 3. Patch All Bookmark Feeds
  const bookmarkFeedPatches = Object.values(queries)
    .filter((e) => e?.endpointName === "getUserBookmarks" && e?.status === "fulfilled")
    .map((e) =>
      api.dispatch(
        baseApi.util.updateQueryData("getUserBookmarks", e.originalArgs, (draft) => {
          let existsInBookmarks = false;
          for (const page of draft.pages) {
            const idx = page.data?.data?.findIndex((p) => p._id === postId);
            if (idx !== undefined && idx > -1) {
              existsInBookmarks = true;
              if (!isBookmarked) {
                // Remove the post from the bookmarks feed entirely
                page.data.data.splice(idx, 1);
              } else {
                // Toggle flag if it's there
                applyToPost(page.data.data[idx]);
              }
              break;
            }
          }

          // Optimistically add to the top of the bookmarks feed if it's a new bookmark
          if (!existsInBookmarks && isBookmarked && fullPost && draft.pages.length > 0) {
            applyToPost(fullPost);
            if (draft.pages[0].data?.data) {
              draft.pages[0].data.data.unshift(fullPost);
            }
          }
        })
      )
    );

  // 4. Patch Post Detail Page
  const detailPatch = api.dispatch(
    baseApi.util.updateQueryData("getPostById", postId, (draft) => {
      const post = draft.data;
      if (post && post._id === postId) applyToPost(post);
    })
  );

  return [feedPatch, ...userFeedPatches, ...bookmarkFeedPatches, detailPatch];
};

const applyOptimisticBookmark = async (api, { postId, isBookmarked }) => {
  const patches = patchPostBookmarkState(api, postId, isBookmarked);
  try {
    await api.queryFulfilled;
  } catch {
    patches.forEach((p) => p.undo());
  }
};

// ─── API Slice ────────────────────────────────────────────────────────────────

const bookmarkApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createBookmark: builder.mutation({
      query: (postId) => ({
        url: `/bookmarks/${postId}`,
        method: 'POST',
      }),
      onQueryStarted: async (postId, api) => applyOptimisticBookmark(api, { postId, isBookmarked: true }),
    }),
    deleteBookmark: builder.mutation({
      query: (postId) => ({
        url: `/bookmarks/${postId}`,
        method: 'DELETE',
      }),
      onQueryStarted: async (postId, api) => applyOptimisticBookmark(api, { postId, isBookmarked: false }),
    }),
    getUserBookmarks: builder.infiniteQuery({
      query: ({ pageParam }) => {
        const params = {
          limit: 10,
          ...(pageParam && {
            cursorId: pageParam.cursorId,
            cursorCreatedAt: pageParam.cursorCreatedAt,
          }),
        };
        return { url: `/bookmarks`, method: 'GET', params };
      },
      infiniteQueryOptions: {
        initialPageParam: null,
        getNextPageParam: (lastPage) => lastPage?.data?.nextCursor ?? null,
      },
      providesTags: (result) =>
        result?.pages
          ? [
              ...result.pages.flatMap((page) =>
                page.data?.data?.map((post) => ({ type: "Post", id: post._id })) || []
              ),
              { type: "Bookmark", id: "LIST" },
            ]
          : [{ type: "Bookmark", id: "LIST" }],
    }),
  })
})

export const { 
  useCreateBookmarkMutation, 
  useDeleteBookmarkMutation,
  useGetUserBookmarksInfiniteQuery 
} = bookmarkApi;