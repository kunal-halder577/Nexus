import { baseApi } from "@/lib/api/baseApi.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns patch results for every fulfilled getUserPosts cache entry.
 * Eliminates the need to pass userId from the component.
 */
const patchAllUserFeeds = (dispatch, getState, postId, updater) => {
  const queries = getState()[baseApi.reducerPath].queries;

  return Object.values(queries)
    .filter((e) => e?.endpointName === "getUserPosts" && e?.status === "fulfilled")
    .map((e) =>
      dispatch(
        postApi.util.updateQueryData("getUserPosts", e.originalArgs, (draft) => {
          updater(draft);
        })
      )
    );
};

const patchAllBookmarksFeeds = (dispatch, getState, updater) => {
  const queries = getState()[baseApi.reducerPath].queries;

  return Object.values(queries)
    .filter((e) => e?.endpointName === "getUserBookmarks" && e?.status === "fulfilled")
    .map((e) =>
      dispatch(
        baseApi.util.updateQueryData("getUserBookmarks", e.originalArgs, (draft) => {
          updater(draft);
        })
      )
    );
};

const patchPostInFeed = (dispatch, postId, updater) =>
  dispatch(
    postApi.util.updateQueryData("getFeedPosts", undefined, (draft) => {
      for (const page of draft.pages) {
        const post = page.data?.data?.find((p) => p._id === postId);
        if (post) { updater(post); break; }
      }
    })
  );

const patchPostById = (dispatch, postId, updater) =>
  dispatch(
    postApi.util.updateQueryData("getPostById", postId, (draft) => {
      const post = draft.data?.post ?? draft.data?.data ?? draft.data;
      if (post) updater(post);
    })
  );

// ─── API Slice ────────────────────────────────────────────────────────────────

export const postApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    createPost: builder.mutation({
      query: (data) => ({ url: "/posts", method: "POST", body: data }),
      invalidatesTags: [{ type: "Post", id: "LIST" }],
    }),

    getFeedPosts: builder.infiniteQuery({
      query: ({ pageParam }) => {
        const params = { limit: 10 };
        if (pageParam) {
          params.cursorId        = pageParam.cursorId;
          params.cursorCreatedAt = pageParam.cursorCreatedAt;
        }
        return { url: "/posts/feed", method: "GET", params };
      },
      infiniteQueryOptions: {
        initialPageParam: null,
        getNextPageParam: (lastPage) => lastPage?.data?.nextCursor || undefined,
      },
      providesTags: (result) =>
        result?.pages
          ? [
              ...result.pages.flatMap((page) =>
                page.data.data.map((post) => ({ type: "Post", id: post._id }))
              ),
              { type: "Post", id: "LIST" },
            ]
          : [{ type: "Post", id: "LIST" }],
    }),

    getUserPosts: builder.infiniteQuery({
      query: ({ pageParam, queryArg: userId }) => {
        const params = { limit: 10 };
        if (pageParam) {
          params.cursorId        = pageParam.cursorId;
          params.cursorCreatedAt = pageParam.cursorCreatedAt;
        }
        return { url: `/posts/user/${userId}`, method: "GET", params };
      },
      infiniteQueryOptions: {
        initialPageParam: null,
        getNextPageParam: (lastPage) => lastPage?.data?.nextCursor || undefined,
      },
      providesTags: (result) =>
        result?.pages
          ? [
              ...result.pages.flatMap((page) =>
                page.data.data.map((post) => ({ type: "Post", id: post._id }))
              ),
              { type: "Post", id: "LIST" },
            ]
          : [{ type: "Post", id: "LIST" }],
    }),

    getPostById: builder.query({
      query: (id) => ({ url: `/posts/${id}`, method: "GET" }),
      providesTags: (result, error, id) => [{ type: "Post", id }],
    }),

    // ✅ userId no longer needed from caller
    updatePost: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `/posts/${id}`,
        method: "PATCH",
        body: patch,
      }),
      // Removed invalidatesTags to prevent infinite query reset to page 1
      // Optimistic updates (below) already handle syncing the cache
      async onQueryStarted({ id, ...patch }, { dispatch, getState, queryFulfilled }) {
        const postUpdater = (post) => {
          if (patch.caption !== undefined) {
            if (!post.content) post.content = {};
            post.content.caption = patch.caption;
          }
          const { caption, ...rest } = patch;
          Object.assign(post, rest);
        };
        const draftUpdater = (draft) => {
          for (const page of draft.pages) {
            const post = page.data?.data?.find((p) => p._id === id);
            if (post) { postUpdater(post); break; }
          }
        };

        const feedPatch       = patchPostInFeed(dispatch, id, postUpdater);
        const userFeedPatch   = patchAllUserFeeds(dispatch, getState, id, draftUpdater);
        const bookmarkPatch   = patchAllBookmarksFeeds(dispatch, getState, draftUpdater);
        const detailPatch     = patchPostById(dispatch, id, postUpdater);

        try {
          await queryFulfilled;
        } catch {
          feedPatch.undo();
          userFeedPatch.forEach((p) => p.undo());
          bookmarkPatch.forEach((p) => p.undo());
          detailPatch.undo();
        }
      },
    }),

    viewPost: builder.mutation({
      query: (id) => ({ url: `/posts/${id}/view`, method: "POST" }),
    }),

    // ✅ userId no longer needed from caller
    deletePost: builder.mutation({
      query: ({ id }) => ({ url: `/posts/${id}`, method: "DELETE" }),
      // Removed invalidatesTags to prevent infinite query reset to page 1
      // Optimistic updates (below) already handle syncing the cache
      async onQueryStarted({ id }, { dispatch, getState, queryFulfilled }) {
        const draftRemover = (draft) => {
          draft.pages.forEach((page) => {
            if (page?.data?.data) {
              page.data.data = page.data.data.filter((p) => p._id !== id);
            }
          });
        };

        const feedPatch     = dispatch(
          postApi.util.updateQueryData("getFeedPosts", undefined, draftRemover)
        );
        const userFeedPatch = patchAllUserFeeds(dispatch, getState, id, draftRemover);
        const bookmarkPatch = patchAllBookmarksFeeds(dispatch, getState, draftRemover);

        try {
          await queryFulfilled;
        } catch {
          feedPatch.undo();
          userFeedPatch.forEach((p) => p.undo());
          bookmarkPatch.forEach((p) => p.undo());
        }
      },
    }),
  }),
});

export const {
  useCreatePostMutation,
  useGetPostByIdQuery,
  useDeletePostMutation,
  useUpdatePostMutation,
  useGetFeedPostsInfiniteQuery,
  useGetUserPostsInfiniteQuery,
  useViewPostMutation,
} = postApi;